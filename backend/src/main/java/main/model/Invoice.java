package main.model;

public class Invoice {

    private String id;
    private String clientId;
    private String projectId;
    private double amount;
    private String createdAt;

    public Invoice() {
    }

    public Invoice(String id, String clientId, String projectId, double amount, String createdAt) {
        this.id = id;
        this.clientId = clientId;
        this.projectId = projectId;
        this.amount = amount;
        this.createdAt = createdAt;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getClientId() {
        return clientId;
    }

    public void setClientId(String clientId) {
        this.clientId = clientId;
    }

    public String getProjectId() {
        return projectId;
    }

    public void setProjectId(String projectId) {
        this.projectId = projectId;
    }

    public double getAmount() {
        return amount;
    }

    public void setAmount(double amount) {
        this.amount = amount;
    }

    public String getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(String createdAt) {
        this.createdAt = createdAt;
    }
}