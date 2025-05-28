package main.controller;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.WriteResult;
import com.stripe.model.checkout.Session;
import main.dto.AssignmentRequest;
import main.dto.ProjectResponse;
import main.model.Project;
import main.model.User;
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
            DocumentReference clientRef = (DocumentReference) projectData.get("clientId");
            String clientId = clientRef.getId();
            String clientEmail = firestoreService.getUserEmailById(clientId);
            if (clientEmail == null) {
                return ResponseEntity.status(404).body("Client email not found.");
            }

            long halfPrice = Long.parseLong(request.getPrice());
            String paymentUrl = stripeService.generatePaymentLink(request.getProjectId(), halfPrice);

            // payment notification
            firestoreService.sendPaymentNotification(
                    request.getProjectId(),
                    clientId,
                    clientEmail,
                    paymentUrl
            );

            String title = (String) projectData.getOrDefault("title", "a project");

            // notify photographers
            for (String uid : request.getPhotographers()) {
                firestoreService.sendGeneralNotification(
                        uid,
                        "You have been assigned to photograph project \"" + title + "\"",
                        "project_update"
                );
            }
            // notify editors
            for (String uid : request.getEditors()) {
                firestoreService.sendGeneralNotification(
                        uid,
                        "You have been assigned to edit project \"" + title + "\"",
                        "project_update"
                );
            }
            // notify client
            firestoreService.sendGeneralNotification(
                    clientId,
                    "Your project \"" + title + "\" has had its team assigned.",
                    "project_update"
            );
            // notify all managers
            for (User u : firestoreService.getAllUsers()) {
                if ("m".equals(u.getRole())) {
                    firestoreService.sendGeneralNotification(
                            u.getId(),
                            "Project \"" + title + "\" was updated and team assigned.",
                            "project_update"
                    );
                }
            }

            return ResponseEntity.ok("Project updated and notifications sent.");
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
            projectRef.update("state", newState).get();

            DocumentSnapshot snapshot = projectRef.get().get();
            Project project = snapshot.toObject(Project.class);
            String title = project != null ? project.getTitle() : "a project";

            // notify photographers
            for (String uid : project.getPhotographers()) {
                firestoreService.sendGeneralNotification(
                        uid,
                        "Project \"" + title + "\" moved to a new stage.",
                        "project_update"
                );
            }
            // notify editors
            for (String uid : project.getEditors()) {
                firestoreService.sendGeneralNotification(
                        uid,
                        "Project \"" + title + "\" moved to a new stage.",
                        "project_update"
                );
            }
            // notify client
            DocumentReference clientRef = (DocumentReference) project.getClientId();
            String clientId = clientRef.getId();
            firestoreService.sendGeneralNotification(
                    clientId,
                    "Your project \"" + title + "\" has been updated to state " + newState + ".",
                    "project_update"
            );
            // notify managers
            for (User u : firestoreService.getAllUsers()) {
                if ("m".equals(u.getRole())) {
                    firestoreService.sendGeneralNotification(
                            u.getId(),
                            "Project \"" + title + "\" changed to state " + newState + ".",
                            "project_update"
                    );
                }
            }

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

            DocumentSnapshot snapshot = firestoreService.getDb()
                    .collection("active_projects")
                    .document(projectId)
                    .get()
                    .get();
            Project project = snapshot.toObject(Project.class);
            String title = project != null ? project.getTitle() : "a project";

            // notify photographers
            for (String uid : project.getPhotographers()) {
                firestoreService.sendGeneralNotification(
                        uid,
                        "Project \"" + title + "\" was reverted to photographing.",
                        "project_update"
                );
            }
            // notify editors
            for (String uid : project.getEditors()) {
                firestoreService.sendGeneralNotification(
                        uid,
                        "Project \"" + title + "\" was reverted to photographing.",
                        "project_update"
                );
            }
            // notify client
            DocumentReference clientRef = (DocumentReference) project.getClientId();
            String clientId = clientRef.getId();
            firestoreService.sendGeneralNotification(
                    clientId,
                    "Your project \"" + title + "\" was reverted to photographing.",
                    "project_update"
            );
            // notify managers
            for (User u : firestoreService.getAllUsers()) {
                if ("m".equals(u.getRole())) {
                    firestoreService.sendGeneralNotification(
                            u.getId(),
                            "Project \"" + title + "\" was reverted to photographing.",
                            "project_update"
                    );
                }
            }

            return ResponseEntity.ok("Project state reverted to photographing.");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error updating project state.");
        }
    }

    @GetMapping("/download_media")
    public ResponseEntity<List<Map<String, String>>> downloadMedia(
            @RequestParam String projectId,
            @RequestHeader("Authorization") String auth
    ) throws Exception {
        // (1) Optionally check the JWT / role from `auth` here
        List<Map<String,String>> media = firestoreService.getMediaForProject(projectId);
        return ResponseEntity.ok(media);
    }

}
