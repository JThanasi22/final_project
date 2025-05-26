package main.controller;

import main.dto.UserDTO;
import main.model.User;
import main.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import main.service.FirestoreService;
import main.util.JwtUtil;

import java.util.List;
import java.util.concurrent.ExecutionException;

@RestController
@RequestMapping("/api/users")
public class Usercontroller {

    @Autowired
    private EmailService emailService;
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

            // Send greeting email after successful signup
            emailService.sendWelcomeEmail(user.getEmail(), user.getName());

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

    @GetMapping("/by-email/{email}")
    public ResponseEntity<UserDTO> getUserByEmail(@PathVariable String email) throws ExecutionException, InterruptedException {
        User user = firestoreService.findByEmail(email);
        if (user == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(new UserDTO(user.getId(), user.getName()));
    }

}
