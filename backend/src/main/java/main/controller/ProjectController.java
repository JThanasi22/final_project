package main.controller;

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

    // Get all projects (admin only)
    @GetMapping("/all")
    public ResponseEntity<?> getAllProjects(@RequestHeader("Authorization") String authHeader) 
            throws ExecutionException, InterruptedException {
        
        if (!isAdmin(authHeader)) {
            return ResponseEntity.status(403).body("Access denied");
        }
        
        List<Project> projects = firestoreService.getAllProjects();
        return ResponseEntity.ok(projects);
    }
    
    // Get projects for the current user
    @GetMapping
    public ResponseEntity<?> getUserProjects(@RequestHeader("Authorization") String authHeader) 
            throws ExecutionException, InterruptedException {
        
        String email = getUserEmailFromToken(authHeader);
        if (email == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }
        
        User user = firestoreService.getUserByEmail(email);
        if (user == null) {
            return ResponseEntity.status(404).body("User not found");
        }
        
        List<Project> projects = firestoreService.getProjectsByUser(user.getId());
        return ResponseEntity.ok(projects);
    }
    
    // Get a specific project
    @GetMapping("/{projectId}")
    public ResponseEntity<?> getProject(@PathVariable String projectId, 
                                     @RequestHeader("Authorization") String authHeader) 
            throws ExecutionException, InterruptedException {
        
        String email = getUserEmailFromToken(authHeader);
        if (email == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }
        
        Project project = firestoreService.getProjectById(projectId);
        if (project == null) {
            return ResponseEntity.status(404).body("Project not found");
        }
        
        // Only the project owner or an admin can view the project
        User user = firestoreService.getUserByEmail(email);
        if (user == null) {
            return ResponseEntity.status(404).body("User not found");
        }
        
        if (!project.getUserId().equals(user.getId()) && !"a".equals(user.getRole())) {
            return ResponseEntity.status(403).body("Access denied");
        }
        
        return ResponseEntity.ok(project);
    }
    
    // Create a new project
    @PostMapping
    public ResponseEntity<?> createProject(@RequestBody Project project, 
                                        @RequestHeader("Authorization") String authHeader) 
            throws ExecutionException, InterruptedException {
        
        String email = getUserEmailFromToken(authHeader);
        if (email == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }
        
        User user = firestoreService.getUserByEmail(email);
        if (user == null) {
            return ResponseEntity.status(404).body("User not found");
        }
        
        // Set the current user as the project owner
        project.setUserId(user.getId());
        
        String projectId = firestoreService.createProject(project);
        return ResponseEntity.ok(projectId);
    }
    
    // Update an existing project
    @PutMapping("/{projectId}")
    public ResponseEntity<?> updateProject(@PathVariable String projectId, 
                                        @RequestBody Project project, 
                                        @RequestHeader("Authorization") String authHeader) 
            throws ExecutionException, InterruptedException {
        
        String email = getUserEmailFromToken(authHeader);
        if (email == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }
        
        // Ensure the project ID matches the path parameter
        project.setId(projectId);
        
        Project existingProject = firestoreService.getProjectById(projectId);
        if (existingProject == null) {
            return ResponseEntity.status(404).body("Project not found");
        }
        
        // Only the project owner or an admin can update the project
        User user = firestoreService.getUserByEmail(email);
        if (user == null) {
            return ResponseEntity.status(404).body("User not found");
        }
        
        if (!existingProject.getUserId().equals(user.getId()) && !"a".equals(user.getRole())) {
            return ResponseEntity.status(403).body("Access denied");
        }
        
        // Preserve the original userId
        project.setUserId(existingProject.getUserId());
        
        boolean updated = firestoreService.updateProject(project);
        if (updated) {
            return ResponseEntity.ok("Project updated successfully");
        } else {
            return ResponseEntity.status(500).body("Failed to update project");
        }
    }
    
    // Delete a project
    @DeleteMapping("/{projectId}")
    public ResponseEntity<?> deleteProject(@PathVariable String projectId, 
                                        @RequestHeader("Authorization") String authHeader) 
            throws ExecutionException, InterruptedException {
        
        String email = getUserEmailFromToken(authHeader);
        if (email == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }
        
        Project project = firestoreService.getProjectById(projectId);
        if (project == null) {
            return ResponseEntity.status(404).body("Project not found");
        }
        
        // Only the project owner or an admin can delete the project
        User user = firestoreService.getUserByEmail(email);
        if (user == null) {
            return ResponseEntity.status(404).body("User not found");
        }
        
        if (!project.getUserId().equals(user.getId()) && !"a".equals(user.getRole())) {
            return ResponseEntity.status(403).body("Access denied");
        }
        
        boolean deleted = firestoreService.deleteProject(projectId);
        if (deleted) {
            return ResponseEntity.ok("Project deleted successfully");
        } else {
            return ResponseEntity.status(500).body("Failed to delete project");
        }
    }
    
    // Helper methods
    
    private String getUserEmailFromToken(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return null;
        }
        
        String token = authHeader.substring(7);
        return JwtUtil.extractEmail(token);
    }
    
    private boolean isAdmin(String authHeader) throws ExecutionException, InterruptedException {
        String email = getUserEmailFromToken(authHeader);
        if (email == null) {
            return false;
        }
        
        User user = firestoreService.getUserByEmail(email);
        return user != null && "a".equals(user.getRole());
    }
} 