package main.controller;

import main.dto.LoginRequest;
import main.model.User;
import main.service.FirestoreService;
import main.util.JwtUtil;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class AuthController {

    private final FirestoreService firestoreService;

    public AuthController(FirestoreService firestoreService) {
        this.firestoreService = firestoreService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) throws Exception {
        System.out.println("➡️ Login attempt for: " + request.getEmail());

        User user = firestoreService.getUserByEmail(request.getEmail());
        if (user == null) {
            System.out.println("No user found");
        }

        boolean valid = firestoreService.validateUser(request.getEmail(), request.getPassword());
        System.out.println("Password valid: " + valid);

        if (user != null && valid) {
            String token = JwtUtil.generateToken(user);
            System.out.println("Login success. Token: " + token);
            return ResponseEntity.ok(Map.of("token", token));
        } else {
            System.out.println("Invalid credentials for: " + request.getEmail());
            return ResponseEntity.status(401).body("Invalid credentials");
        }
    }

}
