package main.controller;

import main.model.Task;
import main.model.User;
import main.service.FirestoreService;
import main.service.TaskService;
import main.util.JwtUtil;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.List;
import java.util.concurrent.ExecutionException;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {

    private final TaskService taskService;
    private final FirestoreService firestoreService;

    public TaskController(TaskService taskService, FirestoreService firestoreService) {
        this.taskService = taskService;
        this.firestoreService = firestoreService;
    }

    @GetMapping
    public ResponseEntity<?> getAllTasks(@RequestHeader("Authorization") String authHeader) {
        try {
            System.out.println("📋 GET /api/tasks - Fetching all tasks");
            
            // Extract user email from token
            String token = authHeader.substring(7); // Remove "Bearer " prefix
            String userEmail = JwtUtil.extractEmail(token);
            System.out.println("👤 User: " + userEmail);
            
            List<Task> tasks = taskService.getAllTasks(userEmail);
            System.out.println("✅ Returning " + tasks.size() + " tasks");
            
            return ResponseEntity.ok(tasks);
        } catch (Exception e) {
            System.err.println("❌ Error fetching tasks: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error fetching tasks: " + e.getMessage());
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getTaskById(
            @PathVariable String id,
            @RequestHeader("Authorization") String authHeader) {
        try {
            System.out.println("🔍 GET /api/tasks/" + id + " - Fetching task by ID");
            
            String token = authHeader.substring(7);
            String userEmail = JwtUtil.extractEmail(token);
            System.out.println("👤 User: " + userEmail);
            
            Task task = taskService.getTaskById(id);
            
            // Check if task exists
            if (task == null) {
                System.out.println("❌ Task not found");
                return ResponseEntity.notFound().build();
            }

            // Only the creator or the assigned person should see the task
            User user = firestoreService.getUserByEmail(userEmail);
            if (user == null) {
                System.out.println("❌ User not found");
                return ResponseEntity.status(401).body("User not found");
            }
            
            String fullName = (user.getName() != null ? user.getName() : "") + " " + 
                             (user.getSurname() != null ? user.getSurname() : "");
            fullName = fullName.trim();
            
            if (!userEmail.equals(task.getCreatedBy()) && 
                !fullName.equals(task.getAssignedTo()) && 
                !"a".equals(user.getRole())) {
                
                System.out.println("⛔ Access denied. User is not creator or assignee");
                return ResponseEntity.status(403).body("You don't have permission to view this task");
            }
            
            System.out.println("✅ Returning task: " + task.getTitle());
            return ResponseEntity.ok(task);
        } catch (Exception e) {
            System.err.println("❌ Error fetching task: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error fetching task: " + e.getMessage());
        }
    }

    @PostMapping
    public ResponseEntity<?> createTask(
            @RequestBody Task task,
            @RequestHeader("Authorization") String authHeader) {
        try {
            System.out.println("➕ POST /api/tasks - Creating new task: " + task.getTitle());
            
            String token = authHeader.substring(7);
            String userEmail = JwtUtil.extractEmail(token);
            System.out.println("👤 Creator: " + userEmail);
            
            // Set created/updated timestamps
            task.setCreatedAt(new Date());
            task.setUpdatedAt(new Date());
            task.setCreatedBy(userEmail);
            
            Task createdTask = taskService.createTask(task);
            System.out.println("✅ Task created with ID: " + createdTask.getId());
            
            return ResponseEntity.ok(createdTask);
        } catch (Exception e) {
            System.err.println("❌ Error creating task: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error creating task: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateTask(
            @PathVariable String id,
            @RequestBody Task task,
            @RequestHeader("Authorization") String authHeader) {
        try {
            System.out.println("🔄 PUT /api/tasks/" + id + " - Updating task");
            
            String token = authHeader.substring(7);
            String userEmail = JwtUtil.extractEmail(token);
            System.out.println("👤 User: " + userEmail);
            
            // Get the existing task
            Task existingTask = taskService.getTaskById(id);
            
            // Check if task exists
            if (existingTask == null) {
                System.out.println("❌ Task not found");
                return ResponseEntity.notFound().build();
            }
            
            // Only the creator or an admin can update a task
            User user = firestoreService.getUserByEmail(userEmail);
            if (user == null) {
                System.out.println("❌ User not found");
                return ResponseEntity.status(401).body("User not found");
            }
            
            if (!userEmail.equals(existingTask.getCreatedBy()) && !"a".equals(user.getRole())) {
                System.out.println("⛔ Access denied. User is not creator or admin");
                return ResponseEntity.status(403).body("You don't have permission to update this task");
            }
            
            // Set ID and updated timestamp
            task.setId(id);
            task.setCreatedAt(existingTask.getCreatedAt());
            task.setCreatedBy(existingTask.getCreatedBy());
            task.setUpdatedAt(new Date());
            
            Task updatedTask = taskService.updateTask(task);
            System.out.println("✅ Task updated: " + updatedTask.getTitle());
            
            return ResponseEntity.ok(updatedTask);
        } catch (Exception e) {
            System.err.println("❌ Error updating task: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error updating task: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteTask(
            @PathVariable String id,
            @RequestHeader("Authorization") String authHeader) {
        try {
            System.out.println("🗑️ DELETE /api/tasks/" + id + " - Deleting task");
            
            String token = authHeader.substring(7);
            String userEmail = JwtUtil.extractEmail(token);
            System.out.println("👤 User: " + userEmail);
            
            // Get the existing task
            Task existingTask = taskService.getTaskById(id);
            
            // Check if task exists
            if (existingTask == null) {
                System.out.println("❌ Task not found");
                return ResponseEntity.notFound().build();
            }
            
            // Only the creator or an admin can delete a task
            User user = firestoreService.getUserByEmail(userEmail);
            if (user == null) {
                System.out.println("❌ User not found");
                return ResponseEntity.status(401).body("User not found");
            }
            
            if (!userEmail.equals(existingTask.getCreatedBy()) && !"a".equals(user.getRole())) {
                System.out.println("⛔ Access denied. User is not creator or admin");
                return ResponseEntity.status(403).body("You don't have permission to delete this task");
            }
            
            boolean deleted = taskService.deleteTask(id);
            
            if (deleted) {
                System.out.println("✅ Task deleted successfully");
                return ResponseEntity.ok("Task deleted successfully");
            } else {
                System.out.println("❌ Failed to delete task");
                return ResponseEntity.status(500).body("Failed to delete task");
            }
        } catch (Exception e) {
            System.err.println("❌ Error deleting task: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error deleting task: " + e.getMessage());
        }
    }
} 