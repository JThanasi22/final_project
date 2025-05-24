package main.controller;

import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import main.model.Project;
import main.model.User;
import main.service.FirestoreService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/finished_projects")
public class FinishedProjectController {

    private final FirestoreService firestoreService;

    public FinishedProjectController(FirestoreService firestoreService) {
        this.firestoreService = firestoreService;
    }

    @PostMapping
    public ResponseEntity<String> finishProject(@RequestParam String projectId) {
        try {
            boolean success = firestoreService.moveActiveProjectToFinished(projectId);
            if (success) {
                // Fetch the now‐finished project
                DocumentSnapshot snap = firestoreService.getDb()
                        .collection("finished_projects")
                        .document(projectId)
                        .get()
                        .get();
                Project project = snap.toObject(Project.class);
                String title = project != null ? project.getTitle() : "a project";

                // Notify photographers
                for (String uid : project.getPhotographers()) {
                    firestoreService.sendGeneralNotification(
                            uid,
                            "Project \"" + title + "\" is now finished.",
                            "project_update"
                    );
                }
                // Notify editors
                for (String uid : project.getEditors()) {
                    firestoreService.sendGeneralNotification(
                            uid,
                            "Project \"" + title + "\" is now finished.",
                            "project_update"
                    );
                }
                // Notify the client
                DocumentReference clientRef = (DocumentReference) project.getClientId();
                String clientId = clientRef.getId();
                firestoreService.sendGeneralNotification(
                        clientId,
                        "Your project \"" + title + "\" has been completed.",
                        "project_update"
                );
                // Notify all managers
                for (User u : firestoreService.getAllUsers()) {
                    if ("m".equals(u.getRole())) {
                        firestoreService.sendGeneralNotification(
                                u.getId(),
                                "Project \"" + title + "\" has been completed.",
                                "project_update"
                        );
                    }
                }

                return ResponseEntity.ok("Project moved to finished successfully.");
            } else {
                return ResponseEntity.status(500).body("Failed to move project to finished.");
            }
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error occurred while finishing project.");
        }
    }
}
