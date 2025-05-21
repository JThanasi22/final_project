package main.controller;

import main.dto.ProjectResponse;
import main.model.Project;
import main.service.FirestoreService;
import main.util.JwtUtil;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.concurrent.ExecutionException;

@RestController
@RequestMapping("/api/client-projects")
public class ClientController {

    private final FirestoreService firestoreService;

    public ClientController(FirestoreService firestoreService) {
        this.firestoreService = firestoreService;
    }

    @GetMapping("/pending")
    public ResponseEntity<List<ProjectResponse>> getClientPendingProjects(@RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.replace("Bearer ", "");
            String userId = JwtUtil.extractUserId(token);

            List<Project> projects = firestoreService.getProjectsByUserFromCollection("pending_projects", userId);
            List<ProjectResponse> response = projects.stream()
                    .map(ProjectResponse::new)
                    .toList();

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).build();
        }
    }

    @GetMapping("/active")
    public ResponseEntity<List<ProjectResponse>> getClientActiveProjects(@RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.replace("Bearer ", "");
            String userId = JwtUtil.extractUserId(token);

            List<Project> projects = firestoreService.getProjectsByUserFromCollection("active_projects", userId);
            List<ProjectResponse> response = projects.stream()
                    .map(ProjectResponse::new)
                    .toList();

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).build();
        }
    }

    @GetMapping("/finished")
    public ResponseEntity<List<ProjectResponse>> getClientFinishedProjects(@RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.replace("Bearer ", "");
            String userId = JwtUtil.extractUserId(token);

            List<Project> projects = firestoreService.getProjectsByUserFromCollection("finished_projects", userId);
            List<ProjectResponse> response = projects.stream()
                    .map(ProjectResponse::new)
                    .toList();

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).build();
        }
    }
}
