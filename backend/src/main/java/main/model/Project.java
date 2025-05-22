package main.model;

import com.google.cloud.firestore.DocumentReference;

import java.util.List;
import java.util.Map;

public class Project {
    private String id;
    private String title;
    private String description;
    private String requirements;
    private String creationDate;
    private String endDate;
    private String price;
    private String status;
    private String type;
    private DocumentReference clientId;
    private String managerId;
    private String projectTeamId;
    private int state;
    private List<String> photographers;
    private List<String> editors;
    private String assignedAt;
    private List<Map<String, String>> media;
    private List<Map<String, String>> finalMedia;




    public Project() {
    }
    public Project(String id, String title, String description, String requirements, String creationDate, String endDate, Float price, String status, String type, DocumentReference clientId, String userId, String projectTeamId)
    {
        this.id = id;
        this.title = title;
        this.description = description;
        this.requirements = requirements;
        this.creationDate = creationDate;
        this.endDate = endDate;
        this.status = status;
        this.type = type;
        this.clientId = clientId;
        this.managerId = null;
        this.projectTeamId = null;
        this.state = 0;
    }

    public String getId () {
        return id;
    }

    public void setId (String id){
        this.id = id;
    }

    public String getTitle () {
        return title;
    }

    public void setTitle (String title){
        this.title = title;
    }

    public String getDescription () {
        return description;
    }

    public void setDescription (String description){
        this.description = description;
    }

    public String getRequirements () {
        return requirements;
    }

    public void setRequirements (String requirements){
        this.requirements = requirements;
    }

    public String getCreationDate () {
        return creationDate;
    }

    public void setCreationDate (String creationDate){
        this.creationDate = creationDate;
    }

    public String getEndDate () {
        return endDate;
    }

    public void setEndDate (String endDate){
        this.endDate = endDate;
    }

    public String getPrice() {
        return price;
    }

    public void setPrice(String price) {
        this.price = price;
    }

    public String getStatus () {
        return status;
    }

    public void setStatus (String status){
        this.status = status;
    }

    public String getType () {
        return type;
    }

    public void setType (String type){
        this.type = type;
    }

    public DocumentReference getClientId() {
        return clientId;
    }

    public void setClientId(DocumentReference clientId) {
        this.clientId = clientId;
    }

    public String getmanagerId () {
        return managerId;
    }

    public void setmanagerId (String userId){
        this.managerId = userId;
    }
    public String getProjectTeamId() {
        return projectTeamId;
    }

    public void setProjectTeamId(String projectTeamId) {
        this.projectTeamId = projectTeamId;
    }

    public int getState() { return state; }
    public void setState(int state) { this.state = state; }
    public List<String> getPhotographers() { return photographers; }
    public void setPhotographers(List<String> photographers) { this.photographers = photographers; }

    public List<String> getEditors() { return editors; }
    public void setEditors(List<String> editors) { this.editors = editors; }
    public String getAssignedAt() {
        return assignedAt;
    }

    public void setAssignedAt(String assignedAt) {
        this.assignedAt = assignedAt;
    }
    public List<Map<String, String>> getMedia() { return media; }
    public void setMedia(List<Map<String, String>> media) { this.media = media; }

    public List<Map<String, String>> getFinalMedia() { return finalMedia; }
    public void setFinalMedia(List<Map<String, String>> finalMedia) { this.finalMedia = finalMedia; }

}