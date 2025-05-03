package main.controller;

import main.model.Project;
import main.service.FirestoreService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.concurrent.ExecutionException;

@RestController
@RequestMapping("/api/projects")
@CrossOrigin(origins = "*", maxAge = 3600)
public class ProjectController {

    private final FirestoreService firestoreService;

    public ProjectController(FirestoreService firestoreService) {
        this.firestoreService = firestoreService;
    }

    // Get all projects - Public endpoint, no authentication required
    @GetMapping
    public ResponseEntity<?> getAllProjects() {
        try {
            List<Project> projects = firestoreService.getAllProjects();
            return ResponseEntity.ok(projects);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error fetching projects: " + e.getMessage());
        }
    }

    // Get a specific project - Public endpoint, no authentication required
    @GetMapping("/{id}")
    public ResponseEntity<?> getProjectById(@PathVariable String id) {
        try {
            Project project = firestoreService.getProjectById(id);
            if (project != null) {
                return ResponseEntity.ok(project);
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("Project not found with ID: " + id);
            }
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error fetching project: " + e.getMessage());
        }
    }

    // Get projects for a specific user - Requires authentication
    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getProjectsByUser(@PathVariable String userId) {
        try {
            List<Project> projects = firestoreService.getProjectsByUser(userId);
            return ResponseEntity.ok(projects);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error fetching projects: " + e.getMessage());
        }
    }

    // Create a new project - Requires authentication
    @PostMapping
    public ResponseEntity<?> createProject(@RequestBody Project project) {
        try {
            String projectId = firestoreService.createProject(project);
            return ResponseEntity.status(HttpStatus.CREATED).body(projectId);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error creating project: " + e.getMessage());
        }
    }

    // Update an existing project - Requires authentication
    @PutMapping("/{id}")
    public ResponseEntity<?> updateProject(@PathVariable String id, @RequestBody Project project) {
        try {
            // Ensure the project ID matches the path parameter
            project.setId(id);
            
            Project existingProject = firestoreService.getProjectById(id);
            if (existingProject == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("Project not found with ID: " + id);
            }
            
            boolean updated = firestoreService.updateProject(project);
            if (updated) {
                return ResponseEntity.ok("Project updated successfully");
            } else {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body("Failed to update project");
            }
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error updating project: " + e.getMessage());
        }
    }

    // Delete a project - Requires authentication
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteProject(@PathVariable String id) {
        try {
            Project project = firestoreService.getProjectById(id);
            if (project == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("Project not found with ID: " + id);
            }
            
            boolean deleted = firestoreService.deleteProject(id);
            if (deleted) {
                return ResponseEntity.ok("Project deleted successfully");
            } else {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body("Failed to delete project");
            }
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error deleting project: " + e.getMessage());
        }
    }
}
