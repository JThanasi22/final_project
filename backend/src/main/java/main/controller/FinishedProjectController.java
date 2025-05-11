package main.controller;

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
