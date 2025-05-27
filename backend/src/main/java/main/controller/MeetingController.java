package main.controller;

import main.model.Meeting;
import main.model.User;
import main.service.FirestoreService;
import main.util.JwtUtil;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/meetings")
public class MeetingController {
    private final FirestoreService firestore;

    public MeetingController(FirestoreService firestore) {
        this.firestore = firestore;
    }

    /**
     * Client requests a meeting.
     * Expects JSON body with at least: { "meetingDate": "YYYY-MM-DD", "message": "..." }
     * Saves it (status="pending") and then notifies every manager.
     */
    @PostMapping
    public ResponseEntity<Meeting> create(
            @RequestBody Meeting m,
            @RequestHeader("Authorization") String authHeader
    ) throws Exception {
        // 1) pull the JWT out of the header
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).build();
        }
        String token = authHeader.substring(7);

        // 2) extract the userId (the “sub” claim) from the token
        String clientId = JwtUtil.extractUserId(token);
        if (clientId == null) {
            return ResponseEntity.status(401).build();
        }

        // 3a) load the user so we can get their name
        User client = firestore.getUserById(clientId);
        String fullName = (client != null)
                ? (client.getName() + " " + client.getSurname()).trim()
                : "Someone";

        // 3b) parse & prettify the meetingDate
        LocalDate ld = LocalDate.parse(m.getMeetingDate());
        String prettyDate = ld.format(DateTimeFormatter.ofPattern("MMMM d, yyyy"));

        // 3c) attach userId + metadata
        m.setUserId(clientId);
        m.setStatus("pending");
        m.setTimestamp(com.google.cloud.Timestamp.now());
        m.setType("meeting_request");

        // 4) persist
        Meeting saved = firestore.saveMeeting(m);

        // 5) notify all managers (using your helper)
        firestore.sendMeetingRequestNotifications(saved);

        return ResponseEntity.ok(saved);
    }

    /**
     * Manager fetches all meetings (pending, accepted, rejected).
     */
    @GetMapping
    public ResponseEntity<List<Meeting>> all() throws Exception {
        List<Meeting> list = firestore.getAllMeetings();
        return ResponseEntity.ok(list);
    }

    /**
     * Manager fetches all pending meetings.
     */
    @GetMapping("/pending")
    public ResponseEntity<List<Meeting>> pending() throws Exception {
        List<Meeting> list = firestore.getPendingMeetings();
        return ResponseEntity.ok(list);
    }

    /**
     * Client fetches all of their meetings (pending, accepted, etc.).
     */
    @GetMapping("/mine")
    public ResponseEntity<List<Meeting>> myAll(
            @RequestHeader("Authorization") String authHeader
    ) throws Exception {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).build();
        }
        String token    = authHeader.substring(7);
        String clientId = JwtUtil.extractUserId(token);
        if (clientId == null) {
            return ResponseEntity.status(401).build();
        }

        List<Meeting> mine = firestore.getMeetingsForUser(clientId);
        return ResponseEntity.ok(mine);
    }

    @GetMapping("/availability")
    public ResponseEntity<Map<String,Object>> checkAvailability(
            @RequestParam("date") String meetingDate
    ) throws Exception {
        List<Meeting> accepted =
                firestore.getAcceptedMeetingsByDate(meetingDate);
        int count = accepted.size();
        boolean fullyBooked = count >= 3;

        Map<String,Object> resp = new HashMap<>();
        resp.put("acceptedCount", count);
        resp.put("fullyBooked",    fullyBooked);
        return ResponseEntity.ok(resp);
    }

    @PutMapping("/{id}/reschedule")
    public ResponseEntity<Void> reschedule(
            @PathVariable String id,
            @RequestParam("newDate") String newDate
    ) throws Exception {
        Meeting old = firestore.getMeetingById(id);
        firestore.rescheduleMeeting(id, newDate);

        String msg = String.format(
                "Your meeting on %s has been moved to %s",
                old.getMeetingDate(), newDate
        );
        firestore.sendGeneralNotification(
                old.getUserId(), msg, "meeting_rescheduled"
        );
        return ResponseEntity.ok().build();
    }

    /**
     * Manager accepts a meeting.
     * Updates status to "accepted" and notifies the client.
     */
    @PutMapping("/{id}/accept")
    public ResponseEntity<Void> accept(@PathVariable String id) throws Exception {
        // 1) update status
        firestore.updateMeetingStatus(id, "accepted");

        // 2) fetch so we can notify
        Meeting m = firestore.getMeetingById(id);
        if (m != null) {
            firestore.sendMeetingAcceptedNotification(m);
        }

        return ResponseEntity.ok().build();
    }

    /**
     * Manager rejects a meeting.
     * Deletes the meeting and notifies the client.
     */
    @PutMapping("/{id}/reject")
    public ResponseEntity<Void> reject(@PathVariable String id) throws Exception {
        // 1) fetch so we know who set it up
        Meeting m = firestore.getMeetingById(id);

        // 2) delete the meeting
        firestore.deleteMeeting(id);

        // 3) notify the client via generic helper (no dedicated reject method needed)
        if (m != null) {
            firestore.sendMeetingRejectedNotification(m);
        }

        return ResponseEntity.ok().build();
    }
}
