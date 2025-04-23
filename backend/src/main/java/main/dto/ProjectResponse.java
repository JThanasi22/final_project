package main.dto;

import main.model.Project;

public class ProjectResponse {
    private String id;
    private String title;
    private String description;
    private String requirements;
    private String creationDate;
    private String endDate;
    private String status;
    private String type;
    private String clientId; // String, not DocumentReference

    // Constructor from your Project model:
    public ProjectResponse(Project project) {
        this.id = project.getId();
        this.title = project.getTitle();
        this.description = project.getDescription();
        this.requirements = project.getRequirements();
        this.creationDate = project.getCreationDate();
        this.endDate = project.getEndDate();
        this.status = project.getStatus();
        this.type = project.getType();
        this.clientId = project.getClientId() != null ? project.getClientId().getId() : null;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getRequirements() {
        return requirements;
    }

    public void setRequirements(String requirements) {
        this.requirements = requirements;
    }

    public String getCreationDate() {
        return creationDate;
    }

    public void setCreationDate(String creationDate) {
        this.creationDate = creationDate;
    }

    public String getEndDate() {
        return endDate;
    }

    public void setEndDate(String endDate) {
        this.endDate = endDate;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getClientId() {
        return clientId;
    }

    public void setClientId(String clientId) {
        this.clientId = clientId;
    }
}
