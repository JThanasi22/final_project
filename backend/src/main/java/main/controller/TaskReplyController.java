package main.controller;

import main.model.TaskReply;
import main.model.Task;
import main.model.User;
import main.service.FirestoreService;
import main.util.JwtUtil;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tasks/{taskId}/replies")
public class TaskReplyController {

    private final FirestoreService firestoreService;

    public TaskReplyController(FirestoreService firestoreService) {
        this.firestoreService = firestoreService;
    }

    @GetMapping
    public ResponseEntity<List<TaskReply>> getReplies(@PathVariable String taskId) {
        try {
            List<TaskReply> replies = firestoreService.getRepliesForTask(taskId);
            return ResponseEntity.ok(replies);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).build();
        }
    }

    @PostMapping
    public ResponseEntity<Void> postReply(
            @PathVariable String taskId,
            @RequestBody Map<String, String> body,
            @RequestHeader("Authorization") String authHeader
    ) {
        try {
            String token = authHeader.replace("Bearer ", "");
            String userId = JwtUtil.extractUserId(token);
            String message = body.get("message");

            // 1) save the reply
            firestoreService.addReply(taskId, userId, message);

            // 2) notification logic
            User sender = firestoreService.getUserById(userId);
            String senderName = sender.getName() + " " + sender.getSurname();

            if ("m".equals(sender.getRole())) {
                // manager replied → notify the one staff assigned to this task
                Task task = firestoreService.getTaskById(taskId);
                String staffId = task.getAssignedToId();
                if (staffId != null && !staffId.isEmpty()) {
                    String notif = String.format(
                            "Manager %s replied on \"%s\": %s",
                            senderName, task.getTitle(), message
                    );
                    firestoreService.sendGeneralNotification(
                            staffId, notif, "task_reply"
                    );
                }
            } else {
                // staff asked → notify all managers
                Task task = firestoreService.getTaskById(taskId);
                String notif = String.format(
                        "%s asked about \"%s\": %s",
                        senderName, task.getTitle(), message
                );
                for (User u : firestoreService.getAllUsers()) {
                    if ("m".equals(u.getRole())) {
                        firestoreService.sendGeneralNotification(
                                u.getId(), notif, "task_reply"
                        );
                    }
                }
            }

            return ResponseEntity.ok().build();
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).build();
        }
    }
}
