package main.controller;

import main.model.Project;
import main.dto.ProjectResponse;
import main.service.FirestoreService;
import main.util.JwtUtil;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/portfolio")
public class PortfolioController {

    private final FirestoreService firestoreService;

    public PortfolioController(FirestoreService firestoreService) {
        this.firestoreService = firestoreService;
    }

    @GetMapping
    public ResponseEntity<List<ProjectResponse>> getClientFinishedPortfolio(@RequestHeader("Authorization") String authHeader) {
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
