package main.dto;

import java.util.List;

public class AssignmentRequest {
    private String projectId;
    private List<String> photographers;
    private List<String> editors;
    private String price;
    private String managerId;

    public String getProjectId() {
        return projectId;
    }

    public void setProjectId(String projectId) {
        this.projectId = projectId;
    }

    public List<String> getPhotographers() {
        return photographers;
    }

    public void setPhotographers(List<String> photographers) {
        this.photographers = photographers;
    }

    public List<String> getEditors() {
        return editors;
    }

    public void setEditors(List<String> editors) {
        this.editors = editors;
    }

    public String getPrice() {
        return price;
    }

    public void setPrice(String price) {
        this.price = price;
    }
    public String getManagerId() {
        return managerId;
    }
    public void setManagerId(String userId) {
        this.managerId = userId;
    }
}
