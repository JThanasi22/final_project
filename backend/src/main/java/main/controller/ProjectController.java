package main.controller;

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
@RequestMapping("/api/projects")
public class ProjectController {

    private final FirestoreService firestoreService;

    public ProjectController(FirestoreService firestoreService) {
        this.firestoreService = firestoreService;
    }

    @GetMapping
    public List<ProjectResponse> getUserProjects(@RequestHeader("Authorization") String token) throws ExecutionException, InterruptedException {
        String clientId = JwtUtil.extractUserId(token.replace("Bearer ", ""));
        List<Project> projects = firestoreService.getProjectsByUserId(clientId);
        return projects.stream().map(ProjectResponse::new).toList();
    }

    @PostMapping
    public ResponseEntity<String> createProject(
            @RequestHeader("Authorization") String token,
            @RequestBody Project project
    ) throws ExecutionException, InterruptedException {
        String clientId = JwtUtil.extractUserId(token.replace("Bearer ", ""));
        firestoreService.createProject(project, clientId);

        // 🔔 Notify all managers about the new project request
        try {
            String title = project.getTitle() != null ? project.getTitle() : "Untitled";
            for (User u : firestoreService.getAllUsers()) {
                if ("m".equals(u.getRole())) {
                    firestoreService.sendGeneralNotification(
                            u.getId(),
                            "A new project request was submitted: \"" + title + "\"",
                            "project_request"
                    );
                }
            }
        } catch (Exception e) {
            // log but don't fail the request
            e.printStackTrace();
        }

        return ResponseEntity.ok("Project created successfully.");
    }

    @PutMapping("/activate")
    public ResponseEntity<String> activateProject(@RequestHeader("Authorization") String token, @RequestBody Project incomingProject) throws ExecutionException, InterruptedException {
        String managerId = JwtUtil.extractUserId(token.replace("Bearer ", ""));

        incomingProject.setmanagerId(managerId);
        incomingProject.setStatus("active");

        // ⚠️ Optional: validate required fields
        if (incomingProject.getPrice() == null || incomingProject.getId() == null || incomingProject.getProjectTeamId() == null) {
            return ResponseEntity.badRequest().body("Missing price, teamId or projectTeamId.");
        }

        boolean updated = firestoreService.updateProject(incomingProject);

        if (updated) {
            return ResponseEntity.ok("✅ Project activated successfully.");
        } else {
            return ResponseEntity.badRequest().body("❌ Project not found or failed to update.");
        }
    }
}