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
@RequestMapping("/api/staff-projects")
public class StaffController {

    private final FirestoreService firestoreService;

    public StaffController(FirestoreService firestoreService) {
        this.firestoreService = firestoreService;
    }

    @GetMapping("/pending")
    public ResponseEntity<List<ProjectResponse>> getStaffPendingProjects(@RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.replace("Bearer ", "");
            String role = JwtUtil.extractRole(token);
            String userId = JwtUtil.extractUserId(token);

            List<Project> projects = firestoreService.getProjectsByUserFromCollectionS("pending_projects", userId, role);
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
    public ResponseEntity<List<ProjectResponse>> getStaffActiveProjects(@RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.replace("Bearer ", "");
            String role = JwtUtil.extractRole(token);
            String userId = JwtUtil.extractUserId(token);

            List<Project> projects = firestoreService.getProjectsByUserFromCollectionS("active_projects", userId, role);
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
    public ResponseEntity<List<ProjectResponse>> getStaffFinishedProjects(@RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.replace("Bearer ", "");
            String role = JwtUtil.extractRole(token);
            String userId = JwtUtil.extractUserId(token);

            List<Project> projects = firestoreService.getProjectsByUserFromCollectionS("finished_projects", userId, role);
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
