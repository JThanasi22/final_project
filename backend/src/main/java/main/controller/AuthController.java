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
import java.util.UUID;
import java.util.concurrent.ExecutionException;



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
        String token = payload.get("token");
        String newPassword = payload.get("newPassword");

        try {
            DocumentSnapshot tokenDoc = firestoreService.getResetToken(token);
            if (tokenDoc == null || !tokenDoc.exists() ||
                    System.currentTimeMillis() > tokenDoc.getLong("expiresAt") ||
                    !tokenDoc.getBoolean("confirmed")) {
                return ResponseEntity.badRequest().body("Token invalid, expired or not confirmed");
            }

            String email = tokenDoc.getString("email");
            String hashedPassword = passwordEncoder.encode(newPassword);

            firestoreService.updateUserPassword(email, hashedPassword);
            firestoreService.deleteResetToken(token);

            return ResponseEntity.ok("Password successfully reset.");
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error during password reset");
        }
    }


    @PostMapping("/confirm-reset")
    public ResponseEntity<?> confirmResetToken(@RequestBody Map<String, String> payload) {
        String token = payload.get("token");

        try {
            DocumentSnapshot tokenDoc = firestoreService.getResetToken(token);
            if (tokenDoc == null || !tokenDoc.exists() || System.currentTimeMillis() > tokenDoc.getLong("expiresAt")) {
                return ResponseEntity.badRequest().body("Token invalid or expired");
            }

            firestoreService.confirmResetToken(token);
            return ResponseEntity.ok("Token confirmed");
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error confirming token");
        }
    }

    @PostMapping("/request-reset")
    public ResponseEntity<?> requestReset(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");

        try {
            User user = firestoreService.getUserByEmail(email);
            if (user == null) return ResponseEntity.badRequest().body("User not found");

            String token = UUID.randomUUID().toString();
            long expiresAt = System.currentTimeMillis() + 15 * 60 * 1000;

            firestoreService.saveResetToken(email, token, expiresAt);

            String confirmationLink = "http://localhost:5173/confirm-reset?token=" + token;
            emailService.sendResetConfirmationLink(email, confirmationLink);

            return ResponseEntity.ok("Reset confirmation link sent");
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Internal server error");
        }
    }


}
