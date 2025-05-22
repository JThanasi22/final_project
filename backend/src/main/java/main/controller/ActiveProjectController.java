package main.controller;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.WriteResult;
import com.stripe.model.checkout.Session;
import main.dto.AssignmentRequest;
import main.dto.ProjectResponse;
import main.model.Project;
import main.service.FirestoreService;
import main.service.StripeService;
import main.util.JwtUtil;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/active_projects")
public class ActiveProjectController {

    private final FirestoreService firestoreService;
    private final StripeService stripeService;


    public ActiveProjectController(FirestoreService firestoreService, StripeService stripeService) {
        this.firestoreService = firestoreService;
        this.stripeService = stripeService;
    }



    @PostMapping
    public ResponseEntity<String> assignTeamAndNotifyWithLink(@RequestBody AssignmentRequest request) {
        try {
            boolean updated = firestoreService.updatePendingProjectDetails(
                    request.getProjectId(),
                    request.getPhotographers(),
                    request.getEditors(),
                    request.getPrice(),
                    request.getManagerId()
            );

            if (!updated) {
                return ResponseEntity.status(500).body("Failed to update project.");
            }

            DocumentSnapshot snapshot = firestoreService.getDb()
                    .collection("pending_projects")
                    .document(request.getProjectId())
                    .get()
                    .get();

            if (!snapshot.exists()) {
                return ResponseEntity.status(404).body("Project not found.");
            }

            Map<String, Object> projectData = snapshot.getData();
            DocumentReference userRef = (DocumentReference) projectData.get("clientId");
            String clientId = userRef.getId();

            String clientEmail = firestoreService.getUserEmailById(clientId);
            if (clientEmail == null) {
                return ResponseEntity.status(404).body("Client email not found.");
            }

            long fullPrice = Long.parseLong(request.getPrice());
            long halfPrice = fullPrice / 2;

            // ✅ Generate payment URL using StripeService
            String paymentUrl = stripeService.generatePaymentLink(request.getProjectId(), halfPrice);

            // ✅ Send notification with payment link
            firestoreService.sendPaymentNotification(
                    request.getProjectId(),
                    clientId,
                    clientEmail,
                    paymentUrl
            );

            return ResponseEntity.ok("Project updated and payment notification sent.");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error during assignment.");
        }
    }


    @GetMapping
    public ResponseEntity<List<ProjectResponse>> getActiveProjects(@RequestHeader("Authorization") String token) {
        try {
            String cleanToken = token.replace("Bearer ", "");
            String userId = JwtUtil.extractUserId(cleanToken);
            String role = JwtUtil.extractRole(cleanToken);

            List<ProjectResponse> projects = firestoreService.getActiveProjectsForUser(userId, role);
            System.out.println("✅ userId: " + userId + ", role: " + role);

            return ResponseEntity.ok(projects);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).build();
        }
    }

    @PutMapping
    public ResponseEntity<String> updateActiveProjectState(@RequestBody Map<String, Object> payload) {
        try {
            String projectId = (String) payload.get("id");
            int newState = (int) payload.get("state");

            DocumentReference projectRef = firestoreService.getDb()
                    .collection("active_projects")
                    .document(projectId);

            ApiFuture<WriteResult> writeResult = projectRef.update("state", newState);
            writeResult.get(); // wait for completion

            System.out.println("✅ Updated project " + projectId + " to state " + newState);
            return ResponseEntity.ok("Project state updated successfully.");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error updating project state.");
        }
    }

    @PutMapping("/callback")
    public ResponseEntity<String> callbackProject(@RequestBody Map<String, String> payload) {
        try {
            String projectId = payload.get("id");
            firestoreService.revertProjectToPhotographing(projectId);
            return ResponseEntity.ok("Project state reverted to photographing.");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error updating project state.");
        }
    }

}
