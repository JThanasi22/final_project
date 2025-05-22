package main.dto;

import main.model.Project;
import java.util.List;
import java.util.Map;

public class ProjectResponse {
    private String id;
    private String title;
    private String description;
    private String requirements;
    private String creationDate;
    private String endDate;
    private String price;
    private String status;
    private String type;
    private String clientId; // converted from DocumentReference to String
    private String userId;
    private String projectTeamId;
    private int state;
    private List<String> photographers;
    private List<String> editors;
    private String assignedAt;
    private List<Map<String, String>> media;
    private List<Map<String, String>> finalMedia;


    // Constructor from Project model:
    public ProjectResponse(Project project) {
        this.id = project.getId();
        this.title = project.getTitle();
        this.description = project.getDescription();
        this.requirements = project.getRequirements();
        this.creationDate = project.getCreationDate();
        this.endDate = project.getEndDate();
        this.price = project.getPrice();
        this.status = project.getStatus();
        this.type = project.getType();
        this.clientId = project.getClientId() != null ? project.getClientId().getId() : null;
        this.userId = project.getmanagerId();
        this.projectTeamId = project.getProjectTeamId();
        this.state = project.getState();
        this.photographers = project.getPhotographers();
        this.editors = project.getEditors();
        this.assignedAt = project.getAssignedAt();
        this.media = project.getMedia();
        this.finalMedia = project.getFinalMedia();
    }

    // Getters and setters (generated)
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getRequirements() { return requirements; }
    public void setRequirements(String requirements) { this.requirements = requirements; }

    public String getCreationDate() { return creationDate; }
    public void setCreationDate(String creationDate) { this.creationDate = creationDate; }

    public String getEndDate() { return endDate; }
    public void setEndDate(String endDate) { this.endDate = endDate; }

    public String getPrice() { return price; }
    public void setPrice(String price) { this.price = price; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getClientId() { return clientId; }
    public void setClientId(String clientId) { this.clientId = clientId; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getProjectTeamId() { return projectTeamId; }
    public void setProjectTeamId(String projectTeamId) { this.projectTeamId = projectTeamId; }

    public int getState() { return state; }
    public void setState(int state) { this.state = state; }

    public List<String> getPhotographers() { return photographers; }
    public void setPhotographers(List<String> photographers) { this.photographers = photographers; }

    public List<String> getEditors() { return editors; }
    public void setEditors(List<String> editors) { this.editors = editors; }

    public String getAssignedAt() { return assignedAt; }
    public void setAssignedAt(String assignedAt) { this.assignedAt = assignedAt; }
    public List<Map<String, String>> getMedia() { return media; }
    public void setMedia(List<Map<String, String>> media) { this.media = media; }

    public List<Map<String, String>> getFinalMedia() { return finalMedia; }
    public void setFinalMedia(List<Map<String, String>> finalMedia) { this.finalMedia = finalMedia; }

}
