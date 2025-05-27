package main.model;

import com.google.cloud.Timestamp;

/**
 * Represents a client’s single-day meeting request as a notification-style entity.
 */
public class Meeting {
    private String id;
    private String recipientId;
    private String userId;
    private String message;
    private String projectId;
    private String meetingDate;
    private String status;
    private Timestamp timestamp;
    private String type;

    // Getters and setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getRecipientId() { return recipientId; }
    public void setRecipientId(String recipientId) { this.recipientId = recipientId; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public String getProjectId() { return projectId; }
    public void setProjectId(String projectId) { this.projectId = projectId; }

    public String getMeetingDate() { return meetingDate; }
    public void setMeetingDate(String meetingDate) { this.meetingDate = meetingDate; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Timestamp getTimestamp() { return timestamp; }
    public void setTimestamp(Timestamp timestamp) { this.timestamp = timestamp; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
}