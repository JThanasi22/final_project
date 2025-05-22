package main.model;

public class Feedback {
    private String id;
    private String projectTitle;
    private String clientName;
    private String comment;
    private double rating;
    private String date;
    private String status; // "Unread" or "Replied"
    private String parent; // null if it's original feedback, otherwise parent feedback ID
    private String reply;  // optional text reply

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getProjectTitle() {
        return projectTitle;
    }

    public void setProjectTitle(String projectTitle) {
        this.projectTitle = projectTitle;
    }

    public String getClientName() {
        return clientName;
    }

    public void setClientName(String clientName) {
        this.clientName = clientName;
    }

    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }

    public double getRating() {
        return rating;
    }

    public void setRating(double rating) {
        this.rating = rating;
    }

    public String getDate() {
        return date;
    }

    public void setDate(String date) {
        this.date = date;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getParent() {
        return parent;
    }

    public void setParent(String parent) {
        this.parent = parent;
    }

    public String getReply() {
        return reply;
    }

    public void setReply(String reply) {
        this.reply = reply;
    }

    public Feedback(String id, String projectTitle, String clientName, String comment, double rating, String date, String status, String parent, String reply) {
        this.id = id;
        this.projectTitle = projectTitle;
        this.clientName = clientName;
        this.comment = comment;
        this.rating = rating;
        this.date = date;
        this.status = status;
        this.parent = parent;
        this.reply = reply;
    }
}
