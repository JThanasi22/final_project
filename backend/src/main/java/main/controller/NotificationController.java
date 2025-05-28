package main.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import jakarta.servlet.http.HttpServletRequest;
import main.model.Notification;
import main.service.FirestoreService;
import main.util.JwtUtil;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final FirestoreService firestoreService;
    private final ObjectMapper objectMapper;

    public NotificationController(FirestoreService firestoreService) {
        this.firestoreService = firestoreService;
        this.objectMapper = new ObjectMapper();
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

    @PostMapping("/send")
    public ResponseEntity<String> sendNotification(
            HttpServletRequest request
    ) {
        try {
            JsonNode json = objectMapper.readTree(request.getInputStream());

            String projectId = json.path("projectId").asText(null);
            String message = json.path("message").asText(null);
            String type = json.path("type").asText(null);

            String recipientId = firestoreService.getManagerIdByProjectId(projectId);

            if (recipientId == null || message == null || type == null) {
                return ResponseEntity.badRequest().body("Missing required fields.");
            }

            firestoreService.sendSpecificNotification(recipientId, message, type, projectId);

            return ResponseEntity.ok("Notification sent successfully.");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Failed to send notification.");
        }
    }

    @PutMapping("/change_request/accept")
    public ResponseEntity<String> acceptChangeRequest(@RequestBody Map<String, Object> payload) {
        try {
            String projectId = (String) payload.get("projectId");

            String clientId = firestoreService.getClientIdByProjectId(projectId);

            firestoreService.sendGeneralNotification(
                    clientId,
                    "Your change request has been accepted.",
                    "change_reply"
            );

            return ResponseEntity.ok("Client notified of acceptance.");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error processing acceptance.");
        }
    }

    @PutMapping("/change_request/reject")
    public ResponseEntity<String> rejectChangeRequest(@RequestBody Map<String, Object> payload) {
        try {
            String projectId = (String) payload.get("projectId");

            String clientId = firestoreService.getClientIdByProjectId(projectId);

            firestoreService.sendGeneralNotification(
                    clientId,
                    "Your change request has been rejected.",
                    "change_reply"
            );

            return ResponseEntity.ok("Client notified of rejection.");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error processing rejection.");
        }
    }




}
