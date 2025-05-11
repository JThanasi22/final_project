package main.controller;

import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import main.dto.AssignmentRequest;
import main.dto.ProjectResponse;
import main.model.Project;
import main.model.User;
import main.service.FirestoreService;
import main.util.JwtUtil;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.concurrent.ExecutionException;

@RestController
@RequestMapping("/api/pending-projects")
public class ManagerController {

    private final FirestoreService firestoreService;

    public ManagerController(FirestoreService firestoreService) {
        this.firestoreService = firestoreService;
    }

    @GetMapping
    public ResponseEntity<List<ProjectResponse>> getPendingProjects() throws ExecutionException, InterruptedException {
        List<Project> projects = firestoreService.getAllPendingProjects();
        List<ProjectResponse> response = projects.stream()
                .map(ProjectResponse::new)
                .toList();
        return ResponseEntity.ok(response);
    }


    @DeleteMapping("/{projectId}")
    public ResponseEntity<Void> deletePendingProject(@PathVariable String projectId) {
        try {
            boolean deleted = firestoreService.deletePendingProject(projectId);
            if (deleted) {
                return ResponseEntity.noContent().build(); // 204
            } else {
                return ResponseEntity.notFound().build(); // 404
            }
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).build(); // 500
        }
    }

    @GetMapping("/active")
    public ResponseEntity<List<ProjectResponse>> getAllActiveProjectsForManager() {
        try {
            List<Project> projects = firestoreService.getAllActiveProjects();
            List<ProjectResponse> response = projects.stream()
                    .map(ProjectResponse::new)
                    .toList();
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).build();
        }
    }

    @GetMapping("/all-finished")
    public ResponseEntity<List<ProjectResponse>> getAllFinishedProjects() throws ExecutionException, InterruptedException {
        List<Project> projects = firestoreService.getAllFinishedProjects();
        List<ProjectResponse> response = projects.stream()
                .map(ProjectResponse::new)
                .toList();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/photographers")
    public ResponseEntity<List<User>> getPhotographers() throws ExecutionException, InterruptedException {
        List<User> users = firestoreService.getAllUsers();
        List<User> photographers = users.stream()
                .filter(user -> "p".equalsIgnoreCase(user.getRole()))
                .toList();
        return ResponseEntity.ok(photographers);
    }

    @GetMapping("/editors")
    public ResponseEntity<List<User>> getEditors() throws ExecutionException, InterruptedException {
        List<User> users = firestoreService.getAllUsers();
        List<User> editors = users.stream()
                .filter(user -> "e".equalsIgnoreCase(user.getRole()))
                .toList();
        return ResponseEntity.ok(editors);
    }

}