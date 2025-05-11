package main.controller;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.WriteResult;
import main.dto.AssignmentRequest;
import main.dto.ProjectResponse;
import main.model.Project;
import main.service.FirestoreService;
import main.util.JwtUtil;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/active_projects")
public class ActiveProjectController {

    private final FirestoreService firestoreService;

    public ActiveProjectController(FirestoreService firestoreService) {
        this.firestoreService = firestoreService;
    }

    @PostMapping
    public ResponseEntity<String> movePendingToActive(@RequestBody AssignmentRequest request) {
        try {
            boolean success = firestoreService.movePendingProjectToActive(
                    request.getProjectId(),
                    request.getPhotographers(),
                    request.getEditors(),
                    request.getPrice()
            );

            if (success) {
                return ResponseEntity.ok("Project moved to active successfully.");
            } else {
                return ResponseEntity.status(500).body("Failed to move project to active.");
            }
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error occurred while moving project.");
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
