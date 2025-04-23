package main.dto;

public class SystemStatsResponse {
    private long totalUsers;
    private long adminUsers;
    private long regularUsers;

    public SystemStatsResponse() {
    }

    public SystemStatsResponse(long totalUsers, long adminUsers, long regularUsers) {
        this.totalUsers = totalUsers;
        this.adminUsers = adminUsers;
        this.regularUsers = regularUsers;
    }

    public long getTotalUsers() {
        return totalUsers;
    }

    public void setTotalUsers(long totalUsers) {
        this.totalUsers = totalUsers;
    }

    public long getAdminUsers() {
        return adminUsers;
    }

    public void setAdminUsers(long adminUsers) {
        this.adminUsers = adminUsers;
    }

    public long getRegularUsers() {
        return regularUsers;
    }

    public void setRegularUsers(long regularUsers) {
        this.regularUsers = regularUsers;
    }
} 