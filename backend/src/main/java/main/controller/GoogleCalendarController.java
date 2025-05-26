package main.controller;

import com.google.api.client.auth.oauth2.Credential;
import com.google.api.services.calendar.model.Event;
import main.service.FirestoreService;
import main.service.GoogleCalendarService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/google")
public class GoogleCalendarController {

    @Autowired
    private FirestoreService firestoreService;

    @Autowired
    private GoogleCalendarService calendarService;

    @GetMapping("/events")
    public ResponseEntity<?> getEvents() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String email = (String) auth.getPrincipal(); // Now the JWT principal is the email

            String refreshToken = firestoreService.getGoogleRefreshToken(email);
            if (refreshToken == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Google account not connected.");
            }

            Credential credential = GoogleCalendarService.createCredentialFromRefreshToken(refreshToken);
            List<Event> events = calendarService.getUpcomingEvents(credential);

            List<Map<String, String>> response = events.stream().map(e -> {
                Map<String, String> map = new HashMap<>();
                map.put("title", e.getSummary());
                map.put("date", e.getStart().getDateTime() != null
                        ? e.getStart().getDateTime().toStringRfc3339()
                        : e.getStart().getDate().toStringRfc3339());
                return map;
            }).collect(Collectors.toList());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to fetch events");
        }
    }
}
