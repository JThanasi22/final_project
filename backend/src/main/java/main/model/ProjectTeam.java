package main.model;

import java.util.ArrayList;
import java.util.List;

public class ProjectTeam {

    private String id;
    private String projectId;       // The ID of the project this team belongs to
    private String managerId;       // The userId of the manager (team leader)
    private List<String> workerIds; // List of userIds for team members (workers)

    public ProjectTeam() {
        this.workerIds = new ArrayList<>();
    }

    public ProjectTeam(String id, String projectId, String managerId, List<String> workerIds) {
        this.id = id;
        this.projectId = projectId;
        this.managerId = managerId;
        this.workerIds = workerIds != null ? workerIds : new ArrayList<>();
    }

    public String getProjectId() {
        return projectId;
    }

    public void setProjectId(String projectId) {
        this.projectId = projectId;
    }

    public String getManagerId() {
        return managerId;
    }

    public void setManagerId(String managerId) {
        this.managerId = managerId;
    }

    public List<String> getWorkerIds() {
        return workerIds;
    }

    public void setWorkerIds(List<String> workerIds) {
        this.workerIds = workerIds;
    }

    public void addWorker(String workerId) {
        this.workerIds.add(workerId);
    }

    public void removeWorker(String workerId) {
        this.workerIds.remove(workerId);
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }
}
