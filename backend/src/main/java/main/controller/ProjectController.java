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
@RequestMapping("/api/projects")
public class ProjectController {

    private final FirestoreService firestoreService;

    public ProjectController(FirestoreService firestoreService) {
        this.firestoreService = firestoreService;
    }

    @GetMapping
    public List<ProjectResponse> getUserProjects(@RequestHeader("Authorization") String token) throws ExecutionException, InterruptedException {
        String userId = JwtUtil.extractUserId(token.replace("Bearer ", ""));
        List<Project> projects = firestoreService.getProjectsByUserId(userId);
        return projects.stream().map(ProjectResponse::new).toList();
    }

    @PostMapping
    public ResponseEntity<String> createProject(@RequestHeader("Authorization") String token, @RequestBody Project project) throws ExecutionException, InterruptedException {
        String userId = JwtUtil.extractUserId(token.replace("Bearer ", ""));
        firestoreService.createProject(project, userId);
        return ResponseEntity.ok("Project created successfully.");
    }
}
