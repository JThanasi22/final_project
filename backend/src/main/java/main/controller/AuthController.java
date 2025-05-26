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
    public ResponseEntity<?> login(@RequestBody Map<String, String> payload) {
        try {
            String email = payload.get("email");
            String password = payload.get("password");
            String deviceId = payload.get("deviceId"); // optional

            System.out.println("➡️ Login attempt for: " + email);

            User user = firestoreService.getUserByEmail(email);
            if (user == null || !firestoreService.validateUser(email, password)) {
                return ResponseEntity.status(401).body("Invalid credentials");
            }

            // ✅ TEMPORARILY BYPASSING 2FA
            String token = JwtUtil.generateToken(user);
            return ResponseEntity.ok(Map.of("token", token));

        /*
        // 🔒 Check remembered device
        if (deviceId != null && firestoreService.isDeviceRemembered(email, deviceId)) {
            String token = JwtUtil.generateToken(user);
            return ResponseEntity.ok(Map.of("token", token));
        }

        // 🔐 Proceed to 2FA
        String code = String.format("%06d", new Random().nextInt(999999));
        long expiresAt = System.currentTimeMillis() + 5 * 60 * 1000;

        firestoreService.saveTwoFactorCode(email, code, expiresAt);
        emailService.sendResetCode(email, code);

        return ResponseEntity.ok("2FA code sent");
        */

        } catch (Exception e) {
            return ResponseEntity.status(500).body("Internal error");
        }
    }



    @PostMapping("/verify-2fa")
    public ResponseEntity<?> verify2FA(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        String code = payload.get("code");
        String deviceId = payload.get("deviceId"); // optional
        boolean remember = Boolean.parseBoolean(payload.getOrDefault("remember", "false"));

        try {
            DocumentSnapshot doc = firestoreService.getTwoFactorCode(email);
            if (doc == null || !doc.exists()) return ResponseEntity.badRequest().body("No code found");

            String storedCode = doc.getString("code");
            Long expiresAt = doc.getLong("expiresAt");

            if (!code.equals(storedCode)) return ResponseEntity.badRequest().body("Invalid code");
            if (System.currentTimeMillis() > expiresAt) return ResponseEntity.badRequest().body("Code expired");

            firestoreService.deleteTwoFactorCode(email);
            User user = firestoreService.getUserByEmail(email);
            String token = JwtUtil.generateToken(user);

            if (remember && deviceId != null) {
                firestoreService.rememberDevice(email, deviceId);
            }

            return ResponseEntity.ok(Map.of("token", token));
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Verification failed");
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

    @GetMapping("/me")
    public ResponseEntity<User> getCurrentUser(@RequestHeader("Authorization") String authHeader) throws Exception {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).build();
        }

        String token = authHeader.substring(7); // Strip "Bearer "
        String email = JwtUtil.extractEmail(token);
        User user = firestoreService.getUserByEmail(email);

        if (user == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(user);
    }

    @PutMapping("/update")
    public ResponseEntity<String> updateUser(@RequestBody User updatedUser,
                                             @RequestHeader("Authorization") String token) {
        String email = JwtUtil.extractEmail(token.replace("Bearer ", ""));
        try {
            firestoreService.updateUserFields(email, updatedUser);
        } catch (ExecutionException | InterruptedException e) {
            throw new RuntimeException(e);
        }
        return ResponseEntity.ok("User updated");
    }





}
