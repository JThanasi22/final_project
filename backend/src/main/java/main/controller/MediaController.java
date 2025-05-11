package main.controller;

import main.service.FirestoreService;
import main.util.JwtUtil;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class MediaController {

    private final FirestoreService firestoreService;

    public MediaController(FirestoreService firestoreService) {
        this.firestoreService = firestoreService;
    }

    @PostMapping("/upload_media")
    public ResponseEntity<String> uploadMedia(
            @RequestParam("projectId") String projectId,
            @RequestParam("files") List<MultipartFile> files
    ) {
        try {
            firestoreService.attachMediaToProject(projectId, files);
            return ResponseEntity.ok("Media uploaded and attached successfully.");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error uploading media: " + e.getMessage());
        }
    }

    @PostMapping("/upload_final_media")
    public ResponseEntity<String> uploadFinalMedia(
            @RequestParam("projectId") String projectId,
            @RequestParam("files") List<MultipartFile> files
    ) {
        try {
            firestoreService.attachFinalMediaToProject(projectId, files);
            return ResponseEntity.ok("Final media uploaded and attached successfully.");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error uploading final media: " + e.getMessage());
        }
    }

    @GetMapping("/download_media")
    public ResponseEntity<List<Map<String, String>>> downloadMedia(
            @RequestHeader("Authorization") String token,
            @RequestParam String projectId
    ) {
        System.out.println("Token received: " + token);
        String cleanToken = token.replace("Bearer ", "");
        String userId = JwtUtil.extractUserId(cleanToken);
        String role = JwtUtil.extractRole(cleanToken);

        System.out.println("✅ Request from userId: " + userId + ", role: " + role);

        try {
            List<Map<String, String>> mediaList = firestoreService.getMediaForProject(projectId);
            return ResponseEntity.ok(mediaList);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).build();
        }
    }



}
