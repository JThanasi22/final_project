package main.model;

import com.google.cloud.firestore.DocumentReference;

public class Project {
    private String id;
    private String title;
    private String description;
    private String requirements;
    private String creationDate;
    private String endDate;
    private Float price;
    private String status;
    private String type;
    private String clientId;
    private String userId;
    private String projectTeamId;

    public Project() {
    }
    public Project(String id, String title, String description, String requirements, String creationDate, String endDate, Float price, String status, String type, String clientId, String userId, String projectTeamId)
    {
            this.id = id;
            this.title = title;
            this.description = description;
            this.requirements = requirements;
            this.creationDate = creationDate;
            this.endDate = endDate;
            this.price = price;
            this.status = status;
            this.type = type;
            this.clientId = clientId;
            this.userId = null;
            this.projectTeamId = null;
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

        public Float getPrice () {
            return price;
        }

        public void setPrice (Float price){
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

        public String getClientId () {
            return clientId;
        }

        public void setClientId (String clientId){
            this.clientId = clientId;
        }

        public String getUserId () {
            return userId;
        }

        public void setUserId (String userId){
            this.userId = userId;
        }
        public String getProjectTeamId() {
            return projectTeamId;
        }

        public void setProjectTeamId(String projectTeamId) {
            this.projectTeamId = projectTeamId;
        }
    }
