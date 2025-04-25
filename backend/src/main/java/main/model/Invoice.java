package main.model;

import java.util.Date;

public class Invoice {
    private String id;
    private String clientId;
    private String clientName;
    private double amount;
    private double tax;
    private double total;
    private String status; // "Paid", "Pending", "Overdue"
    private String dueDate;
    private String createdAt;

    public Invoice() {
    }

    public Invoice(String id, String clientId, String clientName, double amount,
                  double tax, double total, String status, String dueDate, String createdAt) {
        this.id = id;
        this.clientId = clientId;
        this.clientName = clientName;
        this.amount = amount;
        this.tax = tax;
        this.total = total;
        this.status = status;
        this.dueDate = dueDate;
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

    public String getClientName() {
        return clientName;
    }

    public void setClientName(String clientName) {
        this.clientName = clientName;
    }

    public double getAmount() {
        return amount;
    }

    public void setAmount(double amount) {
        this.amount = amount;
    }

    public double getTax() {
        return tax;
    }

    public void setTax(double tax) {
        this.tax = tax;
    }

    public double getTotal() {
        return total;
    }

    public void setTotal(double total) {
        this.total = total;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getDueDate() {
        return dueDate;
    }

    public void setDueDate(String dueDate) {
        this.dueDate = dueDate;
    }

    public String getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(String createdAt) {
        this.createdAt = createdAt;
    }

    @Override
    public String toString() {
        return "Invoice{" +
                "id='" + id + '\'' +
                ", clientId='" + clientId + '\'' +
                ", clientName='" + clientName + '\'' +
                ", amount=" + amount +
                ", tax=" + tax +
                ", total=" + total +
                ", status='" + status + '\'' +
                ", dueDate='" + dueDate + '\'' +
                ", createdAt='" + createdAt + '\'' +
                '}';
    }
} 