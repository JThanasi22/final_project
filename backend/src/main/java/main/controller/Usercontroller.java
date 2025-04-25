package main.controller;

import main.model.User;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import main.service.FirestoreService;
import main.util.JwtUtil;

import java.util.List;
import java.util.concurrent.ExecutionException;

@RestController
@RequestMapping("/api/users")
public class Usercontroller {
    private final FirestoreService firestoreService;

    public Usercontroller(FirestoreService firestoreService) {
        this.firestoreService = firestoreService;
    }

    @PostMapping("/signup")
    public String signup(@RequestBody User user) {
        System.out.println("Received user: " + user.getEmail()); // 👈 Log input

        try {
            String result = firestoreService.saveUser(user);
            System.out.println("Signup result: " + result); // 👈 Log output
            return result;
        } catch (ExecutionException | InterruptedException e) {
            e.printStackTrace(); // 👈 Log the error
            return "Error: " + e.getMessage();
        }
    }
    
    @GetMapping
    public ResponseEntity<?> getAllUsers(@RequestHeader("Authorization") String authHeader) 
            throws ExecutionException, InterruptedException {
        
        String email = getUserEmailFromToken(authHeader);
        if (email == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }
        
        List<User> users = firestoreService.getAllUsers();
        return ResponseEntity.ok(users);
    }
    
    private String getUserEmailFromToken(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return null;
        }
        
        String token = authHeader.substring(7);
        return JwtUtil.extractEmail(token);
    }
}
