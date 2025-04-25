package main.model;

import java.util.ArrayList;
import java.util.List;

public class Portfolio {
    private String id;
    private String title;
    private String description;
    private String coverImage;
    private String category;
    private String date;
    private List<PortfolioImage> images;
    private String userId; // ID of the user who owns this portfolio

    public Portfolio() {
        // Required empty constructor for Firestore
        this.images = new ArrayList<>();
    }

    public Portfolio(String id, String title, String description, String coverImage, 
                  String category, String date, List<PortfolioImage> images, String userId) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.coverImage = coverImage;
        this.category = category;
        this.date = date;
        this.images = images != null ? images : new ArrayList<>();
        this.userId = userId;
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

    public String getCoverImage() {
        return coverImage;
    }

    public void setCoverImage(String coverImage) {
        this.coverImage = coverImage;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getDate() {
        return date;
    }

    public void setDate(String date) {
        this.date = date;
    }

    public List<PortfolioImage> getImages() {
        return images;
    }

    public void setImages(List<PortfolioImage> images) {
        this.images = images != null ? images : new ArrayList<>();
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    // Inner class for portfolio images
    public static class PortfolioImage {
        private String url;
        private String title;
        private String description;

        public PortfolioImage() {
            // Required empty constructor for Firestore
        }

        public PortfolioImage(String url, String title, String description) {
            this.url = url;
            this.title = title;
            this.description = description;
        }

        public String getUrl() {
            return url;
        }

        public void setUrl(String url) {
            this.url = url;
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
    }
} 