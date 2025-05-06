package main.controller;

import main.model.ProjectTeam;
import main.service.FirestoreService;
import main.util.JwtUtil;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.concurrent.ExecutionException;

@RestController
@RequestMapping("/api/project-teams")
public class ProjectTeamController {

    private final FirestoreService firestoreService;

    public ProjectTeamController(FirestoreService firestoreService) {
        this.firestoreService = firestoreService;
    }

    @PostMapping
    public ResponseEntity<String> createProjectTeam(@RequestHeader("Authorization") String token,
                                                    @RequestBody ProjectTeam projectTeam) throws ExecutionException, InterruptedException {
        String managerId = JwtUtil.extractUserId(token.replace("Bearer ", ""));
        projectTeam.setManagerId(managerId); // ✅ Manager is always the authenticated user

        String savedId = firestoreService.createProjectTeam(projectTeam);
        return ResponseEntity.ok("✅ Project team created with ID: " + savedId);
    }
}
