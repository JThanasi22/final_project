package main.controller;

import main.dto.ProjectResponse;
import main.model.Project;
import main.service.FirestoreService;
import main.util.JwtUtil;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.concurrent.ExecutionException;

@RestController
@RequestMapping("/api")
public class PhotographerController {

    private final FirestoreService firestoreService;

    public PhotographerController(FirestoreService firestoreService) {
        this.firestoreService = firestoreService;
    }

    @GetMapping("/my-active-projects")
    public ResponseEntity<List<ProjectResponse>> getMyActiveProjects(
            @RequestHeader("Authorization") String token
    ) throws ExecutionException, InterruptedException {
        String cleanToken = token.replace("Bearer ", "");
        String userId = JwtUtil.extractUserId(cleanToken);
        String role = JwtUtil.extractRole(cleanToken);

        List<ProjectResponse> projects = firestoreService.getActiveProjectsForUser(userId, role);

        return ResponseEntity.ok(projects);
    }

    @GetMapping("/finished_projects")
    public ResponseEntity<List<ProjectResponse>> getMyFinishedProjects(
            @RequestHeader("Authorization") String token
    ) throws ExecutionException, InterruptedException {
        String cleanToken = token.replace("Bearer ", "");
        String userId = JwtUtil.extractUserId(cleanToken);
        String role = JwtUtil.extractRole(cleanToken);

        List<ProjectResponse> projects = firestoreService.getFinishedProjectsForUser(userId, role);
        return ResponseEntity.ok(projects);
    }

}
