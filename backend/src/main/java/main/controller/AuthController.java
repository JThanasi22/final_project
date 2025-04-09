package main.controller;

import com.google.cloud.firestore.DocumentSnapshot;
import main.dto.LoginRequest;
import main.model.User;
import main.service.EmailService;
import main.service.FirestoreService;
import main.util.JwtUtil;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Random;
import java.util.UUID;



@RestController
@RequestMapping("/api/users")
public class AuthController {


    private final FirestoreService firestoreService;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    public AuthController(FirestoreService firestoreService, PasswordEncoder passwordEncoder, EmailService emailService) {
        this.firestoreService = firestoreService;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            System.out.println("➡️ Login attempt for: " + request.getEmail());

            User user = firestoreService.getUserByEmail(request.getEmail());
            if (user == null) {
                System.out.println("No user found");
                return ResponseEntity.status(401).body("Invalid credentials");
            }

            boolean valid = firestoreService.validateUser(request.getEmail(), request.getPassword());
            System.out.println("Password valid: " + valid);

            if (valid) {
                String token = JwtUtil.generateToken(user);
                System.out.println("Login success. Token: " + token);
                return ResponseEntity.ok(Map.of("token", token));
            } else {
                System.out.println("Invalid credentials for: " + request.getEmail());
                return ResponseEntity.status(401).body("Invalid credentials");
            }
        } catch (Exception e) {
            System.err.println("❌ Login error: " + e.getMessage());
            return ResponseEntity.status(500).body("Login failed due to internal error");
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        String code = payload.get("code");
        String newPassword = payload.get("newPassword");

        try {
            DocumentSnapshot doc = firestoreService.getResetCode(email);
            if (doc == null || !doc.exists()) {
                return ResponseEntity.badRequest().body("No code found for this email.");
            }

            String storedCode = doc.getString("code");
            Long expiresAt = doc.getLong("expiresAt");

            if (!code.equals(storedCode)) return ResponseEntity.badRequest().body("Incorrect code");
            if (System.currentTimeMillis() > expiresAt) return ResponseEntity.badRequest().body("Code expired");

            String hashedPassword = passwordEncoder.encode(newPassword);
            firestoreService.updateUserPassword(email, hashedPassword);
            firestoreService.deleteResetCode(email);

            return ResponseEntity.ok("Password successfully reset.");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error resetting password");
        }
    }



    @PostMapping("/verify-reset-code")
    public ResponseEntity<?> verifyCode(@RequestBody Map<String, String> payload) throws Exception {
        String email = payload.get("email");
        String code = payload.get("code");

        DocumentSnapshot doc = firestoreService.getResetCode(email);
        if (doc == null || !doc.exists()) {
            return ResponseEntity.badRequest().body("Invalid request");
        }

        String storedCode = doc.getString("code");
        Long expiresAt = doc.getLong("expiresAt");

        if (!code.equals(storedCode)) return ResponseEntity.badRequest().body("Incorrect code");
        if (System.currentTimeMillis() > expiresAt) return ResponseEntity.badRequest().body("Code expired");

        return ResponseEntity.ok("Code valid");
    }


    @PostMapping("/request-reset")
    public ResponseEntity<?> requestReset(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");

        try {
            User user = firestoreService.getUserByEmail(email);
            if (user == null) {
                return ResponseEntity.badRequest().body("User not found");
            }

            // 👇 Generate 6-digit code
            String code = String.format("%06d", new Random().nextInt(999999));
            long expiresAt = System.currentTimeMillis() + 15 * 60 * 1000;

            firestoreService.saveResetCode(email, code, expiresAt);
            emailService.sendResetCode(email, code); // 🔧 You’ll write this method next

            return ResponseEntity.ok("Code sent to email");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Failed to process reset request");
        }
    }



}
