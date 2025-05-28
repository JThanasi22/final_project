package main.controller;

import main.dto.SystemStatsResponse;
import main.dto.UserRoleUpdateRequest;
import main.model.User;
import main.service.FirestoreService;
import main.util.JwtUtil;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final FirestoreService firestoreService;

    public AdminController(FirestoreService firestoreService) {
        this.firestoreService = firestoreService;
    }

    // Middleware to check if user is admin
    private boolean isAdmin(String authHeader) throws ExecutionException, InterruptedException {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return false;
        }

        String token = authHeader.substring(7);
        String email = JwtUtil.extractEmail(token);
        User user = firestoreService.getUserByEmail(email);

        return user != null && "a".equals(user.getRole());
    }

    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers(@RequestHeader("Authorization") String authHeader) 
            throws ExecutionException, InterruptedException {
        
        if (!isAdmin(authHeader)) {
            return ResponseEntity.status(403).body("Access denied");
        }
        
        List<User> users = firestoreService.getAllUsers();
        return ResponseEntity.ok(users);
    }

    @PutMapping("/users/{userId}/role")
    public ResponseEntity<?> updateUserRole(
            @PathVariable String userId,
            @RequestBody UserRoleUpdateRequest request,
            @RequestHeader("Authorization") String authHeader) 
            throws ExecutionException, InterruptedException {
        
        if (!isAdmin(authHeader)) {
            return ResponseEntity.status(403).body("Access denied");
        }
        
        String newRole = request.getRole();
        
        boolean updated = firestoreService.updateUserRole(userId, newRole);
        if (updated) {
            return ResponseEntity.ok("User role updated successfully");
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/users/{userId}")
    public ResponseEntity<?> deleteUser(
            @PathVariable String userId,
            @RequestHeader("Authorization") String authHeader) 
            throws ExecutionException, InterruptedException {
        
        if (!isAdmin(authHeader)) {
            return ResponseEntity.status(403).body("Access denied");
        }
        
        boolean deleted = firestoreService.deleteUser(userId);
        if (deleted) {
            return ResponseEntity.ok("User deleted successfully");
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/stats")
    public ResponseEntity<SystemStatsResponse> getSystemStats(@RequestHeader("Authorization") String authHeader) 
            throws ExecutionException, InterruptedException {
        
        if (!isAdmin(authHeader)) {
            return ResponseEntity.status(403).build();
        }
        
        Map<String, Object> statsMap = firestoreService.getSystemStats();
        
        SystemStatsResponse stats = new SystemStatsResponse(
            (Long) statsMap.get("totalUsers"),
            (Long) statsMap.get("adminUsers"),
            (Long) statsMap.get("regularUsers")
        );
        
        return ResponseEntity.ok(stats);
    }
} 