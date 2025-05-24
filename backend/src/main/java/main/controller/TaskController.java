package main.controller;

import main.model.Task;
import main.model.User;
import main.service.FirestoreService;
import main.util.JwtUtil;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.concurrent.ExecutionException;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {

    private final FirestoreService firestoreService;

    public TaskController(FirestoreService firestoreService) {
        this.firestoreService = firestoreService;
    }

    @GetMapping("/all")
    public ResponseEntity<?> getAllTasks(@RequestHeader("Authorization") String authHeader)
            throws ExecutionException, InterruptedException {

        if (!isManagerOrAdmin(authHeader)) {
            return ResponseEntity.status(403).body("Access denied");
        }

        List<Task> tasks = firestoreService.getAllTasks();
        return ResponseEntity.ok(tasks);
    }

    @GetMapping
    public ResponseEntity<?> getUserTasks(@RequestHeader("Authorization") String authHeader)
            throws ExecutionException, InterruptedException {

        String email = getUserEmailFromToken(authHeader);
        if (email == null) return ResponseEntity.status(401).body("Unauthorized");

        User user = firestoreService.getUserByEmail(email);
        if (user == null) return ResponseEntity.status(404).body("User not found");

        List<Task> tasks = firestoreService.getTasksByUser(user.getId());
        return ResponseEntity.ok(tasks);
    }

    @GetMapping("/assigned")
    public ResponseEntity<?> getAssignedTasks(@RequestHeader("Authorization") String authHeader)
            throws ExecutionException, InterruptedException {

        String email = getUserEmailFromToken(authHeader);
        if (email == null) return ResponseEntity.status(401).body("Unauthorized");

        User user = firestoreService.getUserByEmail(email);
        if (user == null) return ResponseEntity.status(404).body("User not found");

        List<Task> tasks = firestoreService.getTasksAssignedToUser(user.getId());
        return ResponseEntity.ok(tasks);
    }

    @GetMapping("/project/{projectId}")
    public ResponseEntity<?> getProjectTasks(@PathVariable String projectId,
                                             @RequestHeader("Authorization") String authHeader)
            throws ExecutionException, InterruptedException {

        String email = getUserEmailFromToken(authHeader);
        if (email == null) return ResponseEntity.status(401).body("Unauthorized");

        List<Task> tasks = firestoreService.getTasksByProject(projectId);
        return ResponseEntity.ok(tasks);
    }

    @GetMapping("/{taskId}")
    public ResponseEntity<?> getTask(@PathVariable String taskId,
                                     @RequestHeader("Authorization") String authHeader)
            throws ExecutionException, InterruptedException {

        String email = getUserEmailFromToken(authHeader);
        if (email == null) return ResponseEntity.status(401).body("Unauthorized");

        Task task = firestoreService.getTaskById(taskId);
        if (task == null) return ResponseEntity.status(404).body("Task not found");

        return ResponseEntity.ok(task);
    }

    @PostMapping
    public ResponseEntity<?> createTask(@RequestBody Task task,
                                        @RequestHeader("Authorization") String authHeader)
            throws Exception {

        String email = getUserEmailFromToken(authHeader);
        if (email == null) return ResponseEntity.status(401).body("Unauthorized");

        User user = firestoreService.getUserByEmail(email);
        if (user == null) return ResponseEntity.status(404).body("User not found");

        task.setUserId(user.getId());

        String taskId = firestoreService.createTask(task);

        if (task.getAssignedToId() != null && !task.getAssignedToId().isEmpty()) {
            String msg = "You have been assigned a new task: " + task.getTitle();
            firestoreService.sendGeneralNotification(task.getAssignedToId(), msg, "task_assignment");
        }

        return ResponseEntity.ok(taskId);
    }

    @PutMapping("/{taskId}")
    public ResponseEntity<?> updateTask(@PathVariable String taskId,
                                        @RequestBody Task task,
                                        @RequestHeader("Authorization") String authHeader)
            throws Exception {

        String email = getUserEmailFromToken(authHeader);
        if (email == null) return ResponseEntity.status(401).body("Unauthorized");

        task.setId(taskId);

        Task existingTask = firestoreService.getTaskById(taskId);
        if (existingTask == null) return ResponseEntity.status(404).body("Task not found");

        boolean updated = firestoreService.updateTask(task);

        if ("Completed".equalsIgnoreCase(task.getStatus()) &&
                !"Completed".equalsIgnoreCase(existingTask.getStatus())) {

            String creatorId = existingTask.getUserId();

            if (creatorId != null && !creatorId.isEmpty()) {
                User assignee = firestoreService.getUserById(task.getAssignedToId());
                String assigneeName = assignee != null
                        ? (assignee.getName() + " " + assignee.getSurname()).trim()
                        : "someone";

                String msg = "Task \"" + task.getTitle() + "\" was completed by " + assigneeName;
                firestoreService.sendGeneralNotification(creatorId, msg, "task_completed");
            }
        }

        return updated
                ? ResponseEntity.ok("Task updated successfully")
                : ResponseEntity.status(500).body("Failed to update task");
    }

    @DeleteMapping("/{taskId}")
    public ResponseEntity<?> deleteTask(@PathVariable String taskId,
                                        @RequestHeader("Authorization") String authHeader)
            throws ExecutionException, InterruptedException {

        String email = getUserEmailFromToken(authHeader);
        if (email == null) return ResponseEntity.status(401).body("Unauthorized");

        Task task = firestoreService.getTaskById(taskId);
        if (task == null) return ResponseEntity.status(404).body("Task not found");

        boolean deleted = firestoreService.deleteTask(taskId);
        return deleted
                ? ResponseEntity.ok("Task deleted successfully")
                : ResponseEntity.status(500).body("Failed to delete task");
    }

    // --- Helper Methods ---

    private String getUserEmailFromToken(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) return null;
        String token = authHeader.substring(7);
        return JwtUtil.extractEmail(token);
    }

    private boolean isManagerOrAdmin(String authHeader) throws ExecutionException, InterruptedException {
        String email = getUserEmailFromToken(authHeader);
        if (email == null) return false;

        User user = firestoreService.getUserByEmail(email);
        return user != null && ("a".equals(user.getRole()) || "m".equals(user.getRole()));
    }
}
