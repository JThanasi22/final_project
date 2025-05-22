package main.controller;

import main.model.Feedback;
import main.service.FirestoreService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;

    @RestController
    @RequestMapping("/api/feedback")
    public class FeedbackController {

        private final FirestoreService firestoreService;

        public FeedbackController(FirestoreService firestoreService) {
            this.firestoreService = firestoreService;
        }

        @GetMapping
        public ResponseEntity<List<Map<String, Object>>> getFeedbackWithReplies() throws ExecutionException, InterruptedException {
            List<Map<String, Object>> feedbacks = firestoreService.getFeedbackWithReplies();
            return ResponseEntity.ok(feedbacks);
        }

        @PostMapping
        public ResponseEntity<String> postFeedback(@RequestBody Map<String, Object> feedbackData) {
            firestoreService.addFeedback(feedbackData);
            return ResponseEntity.ok("Feedback submitted");
        }
    }

