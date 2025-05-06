package main.controller;

import main.model.ChatMessage;
import main.service.FirestoreService;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;

@RestController
public class ChatController {

    private final FirestoreService firestoreService;

    public ChatController(FirestoreService firestoreService) {
        this.firestoreService = firestoreService;
    }

    @MessageMapping("/chat.send")
    @SendTo("/topic/messages")
    public ChatMessage sendMessage(@Payload ChatMessage chatMessage) throws ExecutionException, InterruptedException {
        firestoreService.saveMessage(chatMessage);
        return chatMessage;
    }

    // Get all contacts (WhatsApp sidebar)
    @GetMapping("/api/messages/conversations/{userId}")
    public List<Map<String, Object>> getConversations(@PathVariable String userId) throws ExecutionException, InterruptedException {
        return firestoreService.getUserConversations(userId);
    }

    @GetMapping("/api/messages/{senderId}/{receiverId}")
    public List<ChatMessage> getMessagesBetweenUsers(@PathVariable String senderId, @PathVariable String receiverId) throws ExecutionException, InterruptedException {
        return firestoreService.getMessagesBetweenUsers(senderId, receiverId);
    }

}
