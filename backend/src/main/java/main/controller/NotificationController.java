package main.controller;

import com.google.cloud.firestore.DocumentSnapshot;
import main.model.Notification;
import main.service.FirestoreService;
import main.util.JwtUtil;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.concurrent.ExecutionException;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final FirestoreService firestoreService;

    public NotificationController(FirestoreService firestoreService) {
        this.firestoreService = firestoreService;
    }

    @GetMapping
    public ResponseEntity<List<Notification>> getUserNotifications(@RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.replace("Bearer ", "");
            String userId = JwtUtil.extractUserId(token);

            List<Notification> notifications = firestoreService.getNotificationsForUser(userId);
            return ResponseEntity.ok(notifications);
        } catch (ExecutionException | InterruptedException e) {
            e.printStackTrace();
            return ResponseEntity.status(500).build();
        }
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<String> markAsRead(@PathVariable("id") String notificationId) {
        try {
            firestoreService.markNotificationAsRead(notificationId);
            return ResponseEntity.ok("Notification marked as read.");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Failed to mark notification as read.");
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteNotification(@PathVariable("id") String notificationId) {
        try {
            firestoreService.deleteNotification(notificationId);
            return ResponseEntity.ok("Notification deleted.");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Failed to delete notification.");
        }
    }



}
