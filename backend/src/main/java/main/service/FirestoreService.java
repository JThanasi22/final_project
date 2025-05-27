package main.service;

import com.google.api.core.ApiFuture;
import com.google.cloud.Timestamp;
import com.google.cloud.firestore.*;
import com.google.firebase.FirebaseApp;
import com.google.firebase.cloud.FirestoreClient;
import main.dto.ProjectResponse;
import main.model.*;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.text.SimpleDateFormat;
import java.util.*;
import java.util.concurrent.ExecutionException;
import java.util.stream.Collectors;

@Service
public class FirestoreService {

    private static final String USER_COLLECTION = "users";
    private static final String TOKEN_COLLECTION = "reset_tokens";
    private static final String PROJECT_COLLECTION = "projects";
    private static final String TASK_COLLECTION = "tasks";
    private static final String INVOICE_COLLECTION = "invoices";
    private static final String PORTFOLIO_COLLECTION = "portfolios";
    private static final String MESSAGES_COLLECTION = "messages";
    private static final String NOTIFICATION_COLLECTION = "notifications";

    private final Firestore db;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public FirestoreService(FirebaseApp firebaseApp) {
        this.db = FirestoreClient.getFirestore(firebaseApp);
    }

    // ----------------- User Auth & Management -----------------

    public boolean userExists(String email) throws ExecutionException, InterruptedException {
        return getUserDocByEmail(email) != null;
    }

    public String saveUser(User user) throws ExecutionException, InterruptedException {
        if (userExists(user.getEmail())) {
            return "User already exists!";
        }

        user.setPassword(passwordEncoder.encode(user.getPassword()));

        DocumentReference docRef = db.collection(USER_COLLECTION).document();
        user.setId(docRef.getId());

        docRef.set(user).get();
        System.out.println("Saving user to Firestore with ID: " + user.getId());

        return "User registered with ID: " + user.getId();
    }

    public void updateUserFields(String email, User updatedUser) throws ExecutionException, InterruptedException {
        DocumentSnapshot userDoc = getUserDocByEmail(email);
        if (userDoc != null) {
            DocumentReference docRef = userDoc.getReference();

            Map<String, Object> updates = new HashMap<>();
            if (updatedUser.getName() != null) updates.put("name", updatedUser.getName());
            if (updatedUser.getSurname() != null) updates.put("surname", updatedUser.getSurname());
            if (updatedUser.getPhone() != null) updates.put("phone", updatedUser.getPhone());

            if (!updates.isEmpty()) {
                docRef.update(updates).get();
                System.out.println("✅ Updated fields for: " + email);
            } else {
                System.out.println("⚠️ No updatable fields found in request.");
            }
        } else {
            System.out.println("❌ User not found: " + email);
        }
    }


    public boolean validateUser(String email, String rawPassword) throws ExecutionException, InterruptedException {
        DocumentSnapshot doc = getUserDocByEmail(email);
        if (doc != null) {
            User user = doc.toObject(User.class);
            if (user != null) {
                System.out.println("🔍 Email: " + email);
                System.out.println("🔍 Input password: " + rawPassword);
                System.out.println("🔍 Stored hash: " + user.getPassword());
                boolean match = passwordEncoder.matches(rawPassword, user.getPassword());
                System.out.println("✅ Match result: " + match);
                return match;
            }
        }
        return false;
    }

    public User getUserByEmail(String email) throws ExecutionException, InterruptedException {
        System.out.println("🔎 Searching for user: " + email);
        DocumentSnapshot doc = getUserDocByEmail(email);
        if (doc != null) {
            System.out.println("✅ User found: " + doc.getId());
            return doc.toObject(User.class);
        } else {
            System.out.println("❌ No user doc found for email: " + email);
            return null;
        }
    }

    public User getUserById(String userId) throws ExecutionException, InterruptedException {
        DocumentSnapshot doc = db.collection("users").document(userId).get().get();
        if (doc.exists()) {
            return doc.toObject(User.class);
        }
        return null;
    }


    private DocumentSnapshot getUserDocByEmail(String email) throws ExecutionException, InterruptedException {
        CollectionReference users = db.collection(USER_COLLECTION);
        Query query = users.whereEqualTo("email", email);
        QuerySnapshot snapshot = query.get().get();

        if (!snapshot.isEmpty()) {
            return snapshot.getDocuments().get(0);
        }
        return null;
    }

    public void updateUserPassword(String email, String newPassword) throws ExecutionException, InterruptedException {
        DocumentSnapshot doc = getUserDocByEmail(email);
        if (doc != null) {
            doc.getReference().update("password", newPassword);
            System.out.println("✅ Updated password for: " + email);
            System.out.println("🔐 Raw new password: " + newPassword);
        }

    }

    public String getUserEmailById(String userId) throws Exception {
        DocumentSnapshot snapshot = db.collection("users").document(userId).get().get();
        if (!snapshot.exists()) return null;
        return snapshot.getString("email");
    }

    // ----------------- Password Reset Tokens -----------------

    public void saveResetCode(String email, String code, long expiresAt) throws ExecutionException, InterruptedException {
        Map<String, Object> data = Map.of(
                "email", email,
                "code", code,
                "expiresAt", expiresAt
        );

        db.collection("reset_codes").document(email).set(data).get();
    }

    public DocumentSnapshot getResetCode(String email) throws ExecutionException, InterruptedException {
        return db.collection("reset_codes").document(email).get().get();
    }

    public void deleteResetCode(String email) throws ExecutionException, InterruptedException {
        db.collection("reset_codes").document(email).delete().get();
        System.out.println("🗑️ Reset code deleted for: " + email);
    }
    // ----------------- Admin Operations -----------------

    public List<User> getAllUsers() throws ExecutionException, InterruptedException {
        List<User> users = new ArrayList<>();
        QuerySnapshot snapshot = db.collection(USER_COLLECTION).get().get();

        for (DocumentSnapshot doc : snapshot.getDocuments()) {
            User user = doc.toObject(User.class);
            if (user != null) {
                // Don't send password hash to frontend
                user.setPassword(null);
                users.add(user);
            }
        }

        System.out.println("✅ Retrieved " + users.size() + " users");
        return users;
    }

    public boolean updateUserRole(String userId, String newRole) throws ExecutionException, InterruptedException {
        DocumentReference docRef = db.collection(USER_COLLECTION).document(userId);
        DocumentSnapshot doc = docRef.get().get();

        if (doc.exists()) {
            docRef.update("role", newRole).get();
            System.out.println("✅ Updated role for user " + userId + " to " + newRole);
            return true;
        } else {
            System.out.println("❌ User not found: " + userId);
            return false;
        }
    }

    public boolean deleteUser(String userId) throws ExecutionException, InterruptedException {
        DocumentReference docRef = db.collection(USER_COLLECTION).document(userId);
        DocumentSnapshot doc = docRef.get().get();

        if (doc.exists()) {
            docRef.delete().get();
            System.out.println("✅ Deleted user: " + userId);
            return true;
        } else {
            System.out.println("❌ User not found: " + userId);
            return false;
        }
    }

    public Map<String, Object> getSystemStats() throws ExecutionException, InterruptedException {
        Map<String, Object> stats = new HashMap<>();

        // Count total users
        QuerySnapshot userSnapshot = db.collection(USER_COLLECTION).get().get();
        long totalUsers = userSnapshot.size();

        // Count admin users
        QuerySnapshot adminSnapshot = db.collection(USER_COLLECTION)
                .whereEqualTo("role", "a")
                .get().get();
        long adminUsers = adminSnapshot.size();

        stats.put("totalUsers", totalUsers);
        stats.put("adminUsers", adminUsers);
        stats.put("regularUsers", totalUsers - adminUsers);

        return stats;
    }

    public User findByEmail(String email) throws ExecutionException, InterruptedException {
        CollectionReference usersRef = db.collection("users");
        Query query = usersRef.whereEqualTo("email", email);
        ApiFuture<QuerySnapshot> querySnapshot = query.get();

        List<QueryDocumentSnapshot> documents = querySnapshot.get().getDocuments();
        if (documents.isEmpty()) return null;

        return documents.get(0).toObject(User.class);
    }

    // ----------------- Project Operations -----------------

    public List<Project> getAllPendingProjects() throws ExecutionException, InterruptedException {
        List<Project> projects = new ArrayList<>();
        QuerySnapshot snapshot = db.collection("pending_projects").get().get();

        for (DocumentSnapshot doc : snapshot.getDocuments()) {
            Project project = doc.toObject(Project.class);
            if (project != null) {
                project.setId(doc.getId()); // ✅ THIS LINE FIXES ID
                projects.add(project);
            }
        }

        return projects;
    }

    public boolean deletePendingProject(String projectId) throws ExecutionException, InterruptedException {
        DocumentReference docRef = db.collection("pending_projects").document(projectId);
        DocumentSnapshot doc = docRef.get().get();

        if (doc.exists()) {
            docRef.delete().get();
            System.out.println("✅ Deleted pending project: " + projectId);
            return true;
        } else {
            System.out.println("❌ Pending project not found: " + projectId);
            return false;
        }
    }

    public boolean movePendingProjectToActive(String projectId) {
        try {
            System.out.println("🔍 Starting move for project: " + projectId);

            DocumentReference pendingRef = db.collection("pending_projects").document(projectId);
            DocumentSnapshot pendingSnapshot = pendingRef.get().get();

            if (!pendingSnapshot.exists()) {
                System.out.println("❌ Pending project not found: " + projectId);
                return false;
            }

            Map<String, Object> projectData = new HashMap<>(pendingSnapshot.getData());

            projectData.put("state", 1);
            projectData.put("status", "active");
            projectData.put("assignedAt", Instant.now().toString());

            DocumentReference activeRef = db.collection("active_projects").document(projectId);
            WriteResult result = activeRef.set(projectData).get();

            System.out.println("✅ Firestore write complete at: " + result.getUpdateTime());

            pendingRef.delete().get();
            System.out.println("✅ Deleted pending project: " + projectId);

            return true;
        } catch (Exception e) {
            System.out.println("❌ Exception while moving project to active:");
            e.printStackTrace();
            return false;
        }
    }


    public boolean updatePendingProjectDetails(String projectId, List<String> photographers, List<String> editors, String price, String managerId) {
        try {
            DocumentReference pendingRef = db.collection("pending_projects").document(projectId);
            DocumentSnapshot pendingSnapshot = pendingRef.get().get();

            if (!pendingSnapshot.exists()) {
                System.out.println("❌ Pending project not found: " + projectId);
                return false;
            }

            Map<String, Object> updates = new HashMap<>();
            updates.put("photographers", photographers);
            updates.put("editors", editors);
            updates.put("price", price);
            updates.put("managerId", managerId);
            updates.put("assignedAt", Instant.now().toString());
            updates.put("state", 0);  // state 1 → photographer phase


            pendingRef.update(updates).get();

            System.out.println("✅ Pending project updated with photographers, editors, and price: " + projectId);
            return true;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }


    public List<Project> getAllActiveProjects() throws ExecutionException, InterruptedException {
        List<Project> projects = new ArrayList<>();
        QuerySnapshot snapshot = db.collection("active_projects").get().get();

        for (DocumentSnapshot doc : snapshot.getDocuments()) {
            Project project = doc.toObject(Project.class);
            if (project != null) {
                project.setId(doc.getId()); // ✅ THIS LINE FIXES ID
                projects.add(project);
            }

        }

        System.out.println("✅ Retrieved " + projects.size() + " active projects");
        return projects;
    }

    public List<ProjectResponse> getActiveProjectsForUser(String userId, String role) throws ExecutionException, InterruptedException {
        List<ProjectResponse> userProjects = new ArrayList<>();

        ApiFuture<QuerySnapshot> querySnapshot = db.collection("active_projects").get();
        List<QueryDocumentSnapshot> documents = querySnapshot.get().getDocuments();

        for (QueryDocumentSnapshot doc : documents) {
            Project project = doc.toObject(Project.class);

            boolean isPhotographer = role.equals("p") && project.getPhotographers() != null && project.getPhotographers().contains(userId);
            boolean isEditor = role.equals("e") && project.getEditors() != null && project.getEditors().contains(userId);
            boolean isManager = role.equals("m") && userId.equals(project.getmanagerId());

            if (isPhotographer || isEditor || isManager) {
                ProjectResponse response = new ProjectResponse(project);
                response.setId(project.getId());
                response.setTitle(project.getTitle());
                response.setDescription(project.getDescription());
                response.setRequirements(project.getRequirements());
                response.setCreationDate(project.getCreationDate());
                response.setEndDate(project.getEndDate());
                response.setPrice(project.getPrice());
                response.setStatus(project.getStatus());
                response.setType(project.getType());
                response.setUserId(project.getmanagerId());
                response.setProjectTeamId(project.getProjectTeamId());
                response.setState(project.getState());
                response.setAssignedAt(project.getAssignedAt());

                // Replace photographer/editor IDs with names
                List<String> photographerNames = getUserNamesByIds(project.getPhotographers());
                List<String> editorNames = getUserNamesByIds(project.getEditors());

                response.setPhotographers(photographerNames);
                response.setEditors(editorNames);

                userProjects.add(response);
            }
        }

        return userProjects;
    }


    private List<String> getUserNamesByIds(List<String> userIds) throws ExecutionException, InterruptedException {
        List<String> names = new ArrayList<>();
        if (userIds == null) return names;

        for (String id : userIds) {
            DocumentSnapshot userDoc = db.collection("users").document(id).get().get();
            if (userDoc.exists()) {
                String name = userDoc.getString("name");
                names.add(name != null ? name : id); // fallback to ID if name is missing
            }
        }
        return names;
    }


    public List<Project> getAllFinishedProjects() throws ExecutionException, InterruptedException {
        List<Project> projects = new ArrayList<>();
        QuerySnapshot snapshot = db.collection("finished_projects").get().get();

        for (DocumentSnapshot doc : snapshot.getDocuments()) {
            Project project = doc.toObject(Project.class);
            if (project != null) {
                project.setId(doc.getId()); // ✅ THIS LINE FIXES ID
                projects.add(project);
            }

        }

        System.out.println("✅ Retrieved " + projects.size() + " finished projects");
        return projects;
    }

    public List<ProjectResponse> getFinishedProjectsForUser(String userId, String role) throws ExecutionException, InterruptedException {
        List<ProjectResponse> userProjects = new ArrayList<>();

        ApiFuture<QuerySnapshot> querySnapshot = db.collection("finished_projects").get();
        List<QueryDocumentSnapshot> documents = querySnapshot.get().getDocuments();

        for (QueryDocumentSnapshot doc : documents) {
            Project project = doc.toObject(Project.class);

            boolean isPhotographer = role.equals("p") && project.getPhotographers() != null && project.getPhotographers().contains(userId);
            boolean isEditor = role.equals("e") && project.getEditors() != null && project.getEditors().contains(userId);

            if (isPhotographer || isEditor) {
                ProjectResponse response = new ProjectResponse(project);
                response.setId(project.getId());
                response.setTitle(project.getTitle());
                response.setDescription(project.getDescription());
                response.setRequirements(project.getRequirements());
                response.setCreationDate(project.getCreationDate());
                response.setEndDate(project.getEndDate());
                response.setPrice(project.getPrice());
                response.setStatus(project.getStatus());
                response.setType(project.getType());
                response.setUserId(project.getmanagerId());
                response.setProjectTeamId(project.getProjectTeamId());
                response.setState(project.getState());
                response.setAssignedAt(project.getAssignedAt());

                // Replace photographer/editor IDs with names
                List<String> photographerNames = getUserNamesByIds(project.getPhotographers());
                List<String> editorNames = getUserNamesByIds(project.getEditors());

                response.setPhotographers(photographerNames);
                response.setEditors(editorNames);

                userProjects.add(response);
            }
        }

        return userProjects;
    }

    public List<Project> getProjectsByUserFromCollection(String collectionName, String userId) throws ExecutionException, InterruptedException {
        List<Project> projects = new ArrayList<>();
        CollectionReference ref = db.collection(collectionName);
        Query query = ref.whereEqualTo("clientId", db.collection("users").document(userId));
        QuerySnapshot snapshot = query.get().get();

        for (DocumentSnapshot doc : snapshot.getDocuments()) {
            Project project = doc.toObject(Project.class);
            if (project != null) {
                projects.add(project);
            }
        }

        return projects;
    }

    public List<Project> getProjectsByUserFromCollectionS(String collectionName, String userId, String role) throws ExecutionException, InterruptedException {
        List<Project> projects = new ArrayList<>();
        CollectionReference ref = db.collection(collectionName);
        Query query;

        switch (role) {
            case "m":
                query = ref.whereEqualTo("managerId", userId);
                break;
            case "p":
                query = ref.whereArrayContains("photographers", userId);
                break;
            case "e":
                query = ref.whereArrayContains("editors", userId);
                break;
            default:
                // Fallback to avoid error if role is not one of the expected
                return projects;
        }

        QuerySnapshot snapshot = query.get().get();

        for (DocumentSnapshot doc : snapshot.getDocuments()) {
            Project project = doc.toObject(Project.class);
            if (project != null) {
                project.setId(doc.getId()); // include document ID
                projects.add(project);
            }
        }

        return projects;
    }


    public List<Project> getPendingProjectsForClient(String clientId) throws ExecutionException, InterruptedException {
        List<Project> projects = new ArrayList<>();
        QuerySnapshot snapshot = db.collection("pending_projects")
                .whereEqualTo("clientId", db.collection("users").document(clientId))
                .get().get();

        for (DocumentSnapshot doc : snapshot.getDocuments()) {
            Project project = doc.toObject(Project.class);
            if (project != null) {
                projects.add(project);
            }
        }

        return projects;
    }

    public List<Project> getActiveProjectsForClient(String clientId) throws ExecutionException, InterruptedException {
        List<Project> projects = new ArrayList<>();
        QuerySnapshot snapshot = db.collection("active_projects")
                .whereEqualTo("clientId", db.collection("users").document(clientId))
                .get().get();

        for (DocumentSnapshot doc : snapshot.getDocuments()) {
            Project project = doc.toObject(Project.class);
            if (project != null) {
                projects.add(project);
            }
        }

        return projects;
    }

    public List<Project> getFinishedProjectsForClient(String clientId) throws ExecutionException, InterruptedException {
        List<Project> projects = new ArrayList<>();
        QuerySnapshot snapshot = db.collection("finished_projects")
                .whereEqualTo("clientId", db.collection("users").document(clientId))
                .get().get();

        for (DocumentSnapshot doc : snapshot.getDocuments()) {
            Project project = doc.toObject(Project.class);
            if (project != null) {
                projects.add(project);
            }
        }

        return projects;
    }

    public void attachMediaToProject(String projectId, List<MultipartFile> files) throws Exception {
        DocumentReference projectRef = db.collection("active_projects").document(projectId);
        DocumentSnapshot projectSnap = projectRef.get().get();

        if (!projectSnap.exists()) {
            throw new Exception("Project not found");
        }

        List<Map<String, String>> mediaList = new ArrayList<>();
        for (MultipartFile file : files) {
            String base64 = Base64.getEncoder().encodeToString(file.getBytes());

            Map<String, String> mediaItem = new HashMap<>();
            mediaItem.put("fileName", file.getOriginalFilename());
            mediaItem.put("content", base64);

            mediaList.add(mediaItem);
        }

        // Store under a 'media' field inside the project
        Map<String, Object> updates = new HashMap<>();
        updates.put("media", mediaList);

        projectRef.update(updates).get();
        System.out.println("✅ Attached media to project: " + projectId);
    }

    public void attachFinalMediaToProject(String projectId, List<MultipartFile> files, boolean applyWatermark) throws Exception {
        DocumentReference projectRef = db.collection("active_projects").document(projectId);
        DocumentSnapshot projectSnap = projectRef.get().get();

        if (!projectSnap.exists()) {
            throw new Exception("Project not found");
        }

        List<Map<String, String>> finalMediaList = new ArrayList<>();
        for (MultipartFile file : files) {
            String originalFilename = Objects.requireNonNull(file.getOriginalFilename());
            String extension = originalFilename.substring(originalFilename.lastIndexOf('.') + 1).toLowerCase();

            byte[] fileBytes = file.getBytes();

            // Apply watermark only if it's an image and the flag is true
            if (applyWatermark && (extension.equals("png") || extension.equals("jpg") || extension.equals("jpeg"))) {
                try {
                    fileBytes = addWatermarkToImage(fileBytes, "Studio21");
                } catch (Exception e) {
                    System.out.println("⚠️ Failed to watermark image: " + originalFilename);
                    e.printStackTrace();
                }
            }

            String base64 = Base64.getEncoder().encodeToString(fileBytes);

            Map<String, String> mediaItem = new HashMap<>();
            mediaItem.put("fileName", originalFilename);
            mediaItem.put("content", base64);

            finalMediaList.add(mediaItem);
        }

        Map<String, Object> updates = new HashMap<>();
        updates.put("finalMedia", finalMediaList);

        projectRef.update(updates).get();
        System.out.println("✅ Attached final media to project: " + projectId);
    }

    private byte[] addWatermarkToImage(byte[] originalImageBytes, String watermarkText) throws IOException {
        ByteArrayInputStream inStream = new ByteArrayInputStream(originalImageBytes);
        BufferedImage image = ImageIO.read(inStream);

        Graphics2D g2d = image.createGraphics();
        AlphaComposite alphaChannel = AlphaComposite.getInstance(AlphaComposite.SRC_OVER, 0.5f);
        g2d.setComposite(alphaChannel);
        g2d.setColor(Color.WHITE);
        g2d.setFont(new Font("Arial", Font.BOLD, 48));

        FontMetrics fontMetrics = g2d.getFontMetrics();
        int x = image.getWidth() - fontMetrics.stringWidth(watermarkText) - 20;
        int y = image.getHeight() - fontMetrics.getHeight() + 40;

        g2d.drawString(watermarkText, x, y);
        g2d.dispose();

        ByteArrayOutputStream outStream = new ByteArrayOutputStream();
        ImageIO.write(image, "png", outStream);
        return outStream.toByteArray();
    }



    public List<Map<String, String>> getFinalMediaForProject(String projectId) throws Exception {
        DocumentSnapshot doc = db.collection("finished_projects").document(projectId).get().get();
        if (!doc.exists() || !doc.contains("finalMedia")) {
            throw new Exception("No final media found for project " + projectId);
        }

        return (List<Map<String, String>>) doc.get("finalMedia");
    }

    public Firestore getDb() {
        return db;
    }

    public boolean moveActiveProjectToFinished(String projectId) {
        try {
            DocumentReference activeRef = db.collection("active_projects").document(projectId);
            DocumentSnapshot activeSnapshot = activeRef.get().get();

            if (!activeSnapshot.exists()) {
                System.out.println("❌ Active project not found: " + projectId);
                return false;
            }

            Map<String, Object> activeData = activeSnapshot.getData();

            if (activeData == null || !activeData.containsKey("finalMedia")) {
                System.out.println("❌ No final media found for project: " + projectId);
                return false;
            }

            Map<String, Object> finishedData = new HashMap<>();
            finishedData.put("id", projectId);
            finishedData.put("title", activeData.get("title"));
            finishedData.put("description", activeData.get("description"));
            finishedData.put("requirements", activeData.get("requirements"));
            finishedData.put("creationDate", activeData.get("creationDate"));
            finishedData.put("endDate", activeData.get("endDate"));
            finishedData.put("price", activeData.get("price"));
            finishedData.put("status", "finished");
            finishedData.put("type", activeData.get("type"));
            finishedData.put("userId", activeData.get("userId"));
            finishedData.put("clientId", activeData.get("clientId"));
            finishedData.put("projectTeamId", activeData.get("projectTeamId"));
            finishedData.put("state", 3);
            finishedData.put("photographers", activeData.get("photographers"));
            finishedData.put("editors", activeData.get("editors"));
            finishedData.put("assignedAt", activeData.get("assignedAt"));
            finishedData.put("finalMedia", activeData.get("finalMedia"));


            // Save to finished_projects
            DocumentReference finishedRef = db.collection("finished_projects").document(projectId);
            finishedRef.set(finishedData).get();

            // Delete from active_projects
            activeRef.delete().get();

            System.out.println("✅ Moved project " + projectId + " to finished_projects.");
            return true;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    public void revertProjectToPhotographing(String projectId) throws Exception {
        Firestore db = FirestoreClient.getFirestore();
        DocumentReference ref = db.collection("active_projects").document(projectId);
        ref.update("state", 1).get();
    }

    public List<Map<String, String>> getMediaForProject(String projectId) throws Exception {
        DocumentSnapshot doc = db.collection("active_projects").document(projectId).get().get();
        if (!doc.exists() || !doc.contains("media")) {
            throw new Exception("No media found for project " + projectId);
        }

        return (List<Map<String, String>>) doc.get("media");
    }

    public List<Project> getAllProjects() throws ExecutionException, InterruptedException {
        List<Project> projects = new ArrayList<>();
        QuerySnapshot snapshot = db.collection(PROJECT_COLLECTION).get().get();

        for (DocumentSnapshot doc : snapshot.getDocuments()) {
            Project project = doc.toObject(Project.class);
            if (project != null) {
                projects.add(project);
            }
        }

        System.out.println("✅ Retrieved " + projects.size() + " projects");
        return projects;
    }

    public List<Project> getProjectsByUser(String userId) throws ExecutionException, InterruptedException {
        List<Project> projects = new ArrayList<>();
        QuerySnapshot snapshot = db.collection(PROJECT_COLLECTION)
                .whereEqualTo("clientId", userId)
                .get().get();

        for (DocumentSnapshot doc : snapshot.getDocuments()) {
            Project project = doc.toObject(Project.class);
            if (project != null) {
                projects.add(project);
            }
        }

        System.out.println("✅ Retrieved " + projects.size() + " projects for user " + userId);
        return projects;
    }

    public List<Project> getProjectsByUserId(String userId) throws ExecutionException, InterruptedException {
        // This is just a wrapper method that calls the existing getProjectsByUser method
        return getProjectsByUser(userId);
    }

    public Project getProjectById(String projectId) throws ExecutionException, InterruptedException {
        DocumentSnapshot doc = db.collection(PROJECT_COLLECTION).document(projectId).get().get();
        if (doc.exists()) {
            return doc.toObject(Project.class);
        }
        return null;
    }

    public void createProject(Project project, String clientId) throws ExecutionException, InterruptedException {
        project.setStatus("pending");
        project.setState(-1);
        project.setClientId(db.collection("users").document(clientId)); // Convert to DocumentReference
        project.setCreationDate(Instant.now().toString());

        DocumentReference docRef = db.collection("pending_projects").document();
        project.setId(docRef.getId());

        docRef.set(project).get();
    }

    public boolean updateProject(Project project) throws ExecutionException, InterruptedException {
        if (project.getId() == null) {
            System.out.println("❌ Cannot update project with null ID");
            return false;
        }

        DocumentReference docRef = db.collection(PROJECT_COLLECTION).document(project.getId());
        DocumentSnapshot doc = docRef.get().get();

        if (doc.exists()) {
            docRef.set(project).get();  // Overwrite entire project
            System.out.println("✅ Updated project: " + project.getId());
            return true;
        } else {
            System.out.println("❌ Project not found: " + project.getId());
            return false;
        }
    }

    public boolean deleteProject(String projectId) throws ExecutionException, InterruptedException {
        DocumentReference docRef = db.collection(PROJECT_COLLECTION).document(projectId);
        DocumentSnapshot doc = docRef.get().get();

        if (doc.exists()) {
            docRef.delete().get();
            System.out.println("✅ Deleted project: " + projectId);
            return true;
        } else {
            System.out.println("❌ Project not found: " + projectId);
            return false;
        }
    }

    // ----------------- Task Operations -----------------

    public List<Task> getAllTasks() throws ExecutionException, InterruptedException {
        List<Task> tasks = new ArrayList<>();
        QuerySnapshot snapshot = db.collection(TASK_COLLECTION).get().get();

        for (DocumentSnapshot doc : snapshot.getDocuments()) {
            Task task = doc.toObject(Task.class);
            if (task != null) {
                tasks.add(task);
            }
        }

        System.out.println("✅ Retrieved " + tasks.size() + " tasks");
        return tasks;
    }

    public List<Task> getTasksByUser(String userId) throws ExecutionException, InterruptedException {
        List<Task> tasks = new ArrayList<>();
        QuerySnapshot snapshot = db.collection(TASK_COLLECTION)
                .whereEqualTo("userId", userId)
                .get().get();

        for (DocumentSnapshot doc : snapshot.getDocuments()) {
            Task task = doc.toObject(Task.class);
            if (task != null) {
                tasks.add(task);
            }
        }

        System.out.println("✅ Retrieved " + tasks.size() + " tasks for user " + userId);
        return tasks;
    }

    public List<Task> getTasksByProject(String projectId) throws ExecutionException, InterruptedException {
        List<Task> tasks = new ArrayList<>();
        QuerySnapshot snapshot = db.collection(TASK_COLLECTION)
                .whereEqualTo("projectId", projectId)
                .get().get();

        for (DocumentSnapshot doc : snapshot.getDocuments()) {
            Task task = doc.toObject(Task.class);
            if (task != null) {
                tasks.add(task);
            }
        }

        System.out.println("✅ Retrieved " + tasks.size() + " tasks for project " + projectId);
        return tasks;
    }

    public List<Task> getTasksAssignedToUser(String assignedToId) throws ExecutionException, InterruptedException {
        List<Task> tasks = new ArrayList<>();
        QuerySnapshot snapshot = db.collection(TASK_COLLECTION)
                .whereEqualTo("assignedToId", assignedToId)
                .get().get();

        for (DocumentSnapshot doc : snapshot.getDocuments()) {
            Task task = doc.toObject(Task.class);
            if (task != null) {
                tasks.add(task);
            }
        }

        System.out.println("✅ Retrieved " + tasks.size() + " tasks assigned to user " + assignedToId);
        return tasks;
    }

    public Task getTaskById(String taskId) throws ExecutionException, InterruptedException {
        DocumentSnapshot doc = db.collection(TASK_COLLECTION).document(taskId).get().get();
        if (doc.exists()) {
            System.out.println("✅ Retrieved task: " + taskId);
            return doc.toObject(Task.class);
        } else {
            System.out.println("❌ Task not found: " + taskId);
            return null;
        }
    }

    public String createTask(Task task) throws ExecutionException, InterruptedException {
        DocumentReference docRef = db.collection(TASK_COLLECTION).document();
        task.setId(docRef.getId());

        // Set creation and update timestamps
        Date now = new Date();
        task.setCreatedAt(now);
        task.setUpdatedAt(now);

        docRef.set(task).get();
        System.out.println("✅ Created task: " + task.getId());

        return task.getId();
    }

    public boolean updateTask(Task task) throws ExecutionException, InterruptedException {
        DocumentReference docRef = db.collection(TASK_COLLECTION).document(task.getId());
        DocumentSnapshot doc = docRef.get().get();

        if (doc.exists()) {
            // Update the timestamp
            task.setUpdatedAt(new Date());

            docRef.set(task).get();
            System.out.println("✅ Updated task: " + task.getId());
            return true;
        } else {
            System.out.println("❌ Task not found: " + task.getId());
            return false;
        }
    }

    // Collection name
    private static final String TASK_REPLY_COLLECTION = "task_reply";

    // Fetch replies for a task
    public List<TaskReply> getRepliesForTask(String taskId) throws Exception {
        List<TaskReply> replies = new ArrayList<>();
        QuerySnapshot snapshot = db.collection("task_replies")
                .whereEqualTo("taskId", taskId)
                .get()
                .get();
        for (DocumentSnapshot doc : snapshot.getDocuments()) {
            TaskReply r = doc.toObject(TaskReply.class);
            replies.add(r);
        }
        // now sort locally:
        replies.sort(Comparator.comparing(r -> r.getTimestamp().toDate()));
        return replies;
    }

    public void addReply(String taskId, String userId, String message) throws Exception {
        Map<String,Object> data = new HashMap<>();
        data.put("taskId",   taskId);
        data.put("userId",   userId);
        data.put("message",  message);
        data.put("timestamp", new Date());
        db.collection("task_replies").add(data).get();
    }

    public boolean deleteTask(String taskId) throws ExecutionException, InterruptedException {
        DocumentReference docRef = db.collection(TASK_COLLECTION).document(taskId);
        DocumentSnapshot doc = docRef.get().get();

        if (doc.exists()) {
            docRef.delete().get();
            System.out.println("✅ Deleted task: " + taskId);
            return true;
        } else {
            System.out.println("❌ Task not found: " + taskId);
            return false;
        }
    }


    public void createInvoice(String clientId, String projectId, long amountCents) throws Exception {
        Map<String, Object> invoiceData = new HashMap<>();
        invoiceData.put("clientId", clientId);
        invoiceData.put("projectId", projectId);
        invoiceData.put("amount", amountCents/100);

        invoiceData.put("createdAt", Instant.now().toString());

        db.collection("invoices").add(invoiceData).get();
    }


    public String saveInvoice(Map<String, Object> data) throws ExecutionException, InterruptedException {
        Map<String, Object> invoiceData = new HashMap<>();

        invoiceData.put("projectId", data.get("projectId"));
        invoiceData.put("amount", data.get("amount"));

        // Auto-generated timestamps
        invoiceData.put("createdAt", Instant.now().toString());

        DocumentReference docRef = db.collection(INVOICE_COLLECTION).add(invoiceData).get();
        return docRef.getId();
    }


    public boolean updateInvoice(String invoiceId, Map<String, Object> updatedData) throws ExecutionException, InterruptedException {
        DocumentReference docRef = db.collection(INVOICE_COLLECTION).document(invoiceId);
        DocumentSnapshot snapshot = docRef.get().get();

        if (snapshot.exists()) {
            docRef.set(updatedData).get();
            return true;
        }
        return false;
    }

    public boolean deleteInvoice(String invoiceId) throws ExecutionException, InterruptedException {
        DocumentReference docRef = db.collection(INVOICE_COLLECTION).document(invoiceId);
        DocumentSnapshot snapshot = docRef.get().get();

        if (snapshot.exists()) {
            docRef.delete().get();
            return true;
        }
        return false;
    }

    public Map<String, Object> getInvoiceById(String invoiceId) throws ExecutionException, InterruptedException {
        DocumentSnapshot snapshot = db.collection(INVOICE_COLLECTION).document(invoiceId).get().get();
        if (snapshot.exists()) {
            Map<String, Object> data = snapshot.getData();
            if (data != null) data.put("id", snapshot.getId());
            return data;
        }
        return null;
    }

    public List<Map<String, Object>> getAllInvoices() throws ExecutionException, InterruptedException {
        List<Map<String, Object>> invoices = new ArrayList<>();
        ApiFuture<QuerySnapshot> future = db.collection(INVOICE_COLLECTION).get();
        for (DocumentSnapshot doc : future.get().getDocuments()) {
            Map<String, Object> invoice = doc.getData();
            if (invoice != null) {
                invoice.put("id", doc.getId());
                invoices.add(invoice);
            }
        }
        return invoices;
    }

    public List<Map<String, Object>> getInvoicesByClientId(String clientId) throws ExecutionException, InterruptedException {
        List<Map<String, Object>> results = new ArrayList<>();
        ApiFuture<QuerySnapshot> future = db.collection(INVOICE_COLLECTION)
                .whereEqualTo("clientId", clientId)
                .get();
        for (DocumentSnapshot doc : future.get().getDocuments()) {
            Map<String, Object> invoice = doc.getData();
            if (invoice != null) {
                invoice.put("id", doc.getId());
                results.add(invoice);
            }
        }
        return results;
    }

    // Portfolio related methods
    public List<Portfolio> getAllPortfolios() throws ExecutionException, InterruptedException {
        List<Portfolio> portfolios = new ArrayList<>();
        QuerySnapshot snapshot = db.collection(PORTFOLIO_COLLECTION).get().get();

        for (DocumentSnapshot doc : snapshot.getDocuments()) {
            Portfolio portfolio = doc.toObject(Portfolio.class);
            if (portfolio != null) {
                portfolios.add(portfolio);
            }
        }

        System.out.println("✅ Retrieved " + portfolios.size() + " portfolios");
        return portfolios;
    }

    public List<Portfolio> getPortfoliosByUser(String userId) throws ExecutionException, InterruptedException {
        List<Portfolio> portfolios = new ArrayList<>();
        QuerySnapshot snapshot = db.collection(PORTFOLIO_COLLECTION)
                .whereEqualTo("userId", userId)
                .get().get();

        for (DocumentSnapshot doc : snapshot.getDocuments()) {
            Portfolio portfolio = doc.toObject(Portfolio.class);
            if (portfolio != null) {
                portfolios.add(portfolio);
            }
        }

        System.out.println("✅ Retrieved " + portfolios.size() + " portfolios for user: " + userId);
        return portfolios;
    }

    public Portfolio getPortfolioById(String portfolioId) throws ExecutionException, InterruptedException {
        DocumentSnapshot doc = db.collection(PORTFOLIO_COLLECTION).document(portfolioId).get().get();
        if (doc.exists()) {
            Portfolio portfolio = doc.toObject(Portfolio.class);
            System.out.println("✅ Retrieved portfolio: " + portfolioId);
            return portfolio;
        }
        System.out.println("❌ Portfolio not found: " + portfolioId);
        return null;
    }

    public String createPortfolio(Portfolio portfolio) throws ExecutionException, InterruptedException {
        try {
            // Validate the portfolio object
            if (portfolio == null) {
                throw new IllegalArgumentException("Portfolio object cannot be null");
            }

            // If no ID is provided, generate one
            if (portfolio.getId() == null || portfolio.getId().isEmpty()) {
                String portfolioId = UUID.randomUUID().toString();
                portfolio.setId(portfolioId);
            }

            // Create document reference with the portfolio ID
            DocumentReference docRef = db.collection(PORTFOLIO_COLLECTION).document(portfolio.getId());

            // Save the portfolio
            ApiFuture<WriteResult> result = docRef.set(portfolio);
            result.get(); // Wait for completion

            System.out.println("✅ Created portfolio with ID: " + portfolio.getId());
            return portfolio.getId();
        } catch (Exception e) {
            System.err.println("❌ Error creating portfolio: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    public boolean updatePortfolio(Portfolio portfolio) throws ExecutionException, InterruptedException {
        if (portfolio == null || portfolio.getId() == null || portfolio.getId().isEmpty()) {
            return false;
        }

        DocumentReference docRef = db.collection(PORTFOLIO_COLLECTION).document(portfolio.getId());
        DocumentSnapshot doc = docRef.get().get();

        if (doc.exists()) {
            docRef.set(portfolio).get();
            System.out.println("✅ Updated portfolio: " + portfolio.getId());
            return true;
        }

        System.out.println("❌ Portfolio not found for update: " + portfolio.getId());
        return false;
    }

    public boolean deletePortfolio(String portfolioId) throws ExecutionException, InterruptedException {
        DocumentReference docRef = db.collection(PORTFOLIO_COLLECTION).document(portfolioId);
        DocumentSnapshot doc = docRef.get().get();

        if (doc.exists()) {
            docRef.delete().get();
            System.out.println("✅ Deleted portfolio: " + portfolioId);
            return true;
        }

        System.out.println("❌ Portfolio not found for deletion: " + portfolioId);
        return false;
    }

    public void saveMessage(ChatMessage message) throws ExecutionException, InterruptedException {
        db.collection(MESSAGES_COLLECTION).add(message);
    }

    public List<ChatMessage> getMessagesBetweenUsers(String user1, String user2) throws ExecutionException, InterruptedException {
        List<ChatMessage> result = new ArrayList<>();

        // Combine messages where (sender=user1 AND receiver=user2) OR (sender=user2 AND receiver=user1)
        CollectionReference messagesRef = db.collection("messages");

        List<ApiFuture<QuerySnapshot>> futures = List.of(
                messagesRef.whereEqualTo("senderId", user1).whereEqualTo("receiverId", user2).get(),
                messagesRef.whereEqualTo("senderId", user2).whereEqualTo("receiverId", user1).get()
        );

        for (ApiFuture<QuerySnapshot> future : futures) {
            for (DocumentSnapshot doc : future.get().getDocuments()) {
                result.add(doc.toObject(ChatMessage.class));
            }
        }

        // Sort by timestamp
        result.sort(Comparator.comparing(ChatMessage::getTimestamp));
        return result;
    }


    public List<Map<String, Object>> getUserConversations(String userId) throws ExecutionException, InterruptedException {
        List<Map<String, Object>> conversations = new ArrayList<>();
        Set<String> contactIds = new HashSet<>();

        List<ChatMessage> allMessages = new ArrayList<>();
        allMessages.addAll(getMessagesByField("senderId", userId));
        allMessages.addAll(getMessagesByField("receiverId", userId));

        for (ChatMessage msg : allMessages) {
            String contactId = msg.getSenderId().equals(userId) ? msg.getReceiverId() : msg.getSenderId();
            contactIds.add(contactId);
        }

        for (String contactId : contactIds) {
            DocumentSnapshot contactDoc = db.collection("users").document(contactId).get().get();
            String contactName = contactDoc.exists() ? contactDoc.getString("name") : "Unknown";
            Map<String, Object> conv = new HashMap<>();
            conv.put("id", contactId);
            conv.put("contactName", contactName);
            conv.put("messages", new ArrayList<>()); // Filled later when selected
            conversations.add(conv);
        }

        return conversations;
    }

    private List<ChatMessage> getMessagesByField(String field, String value) throws ExecutionException, InterruptedException {
        List<ChatMessage> messages = new ArrayList<>();
        ApiFuture<QuerySnapshot> future = db.collection("messages").whereEqualTo(field, value).get();
        for (DocumentSnapshot doc : future.get().getDocuments()) {
            ChatMessage m = doc.toObject(ChatMessage.class);
            if (m != null) messages.add(m);
        }
        return messages;
    }


    public String createProjectTeam(ProjectTeam team) throws ExecutionException, InterruptedException {
        DocumentReference docRef = db.collection("project_teams").document();
        team.setId(docRef.getId()); // Optional: set ID in model
        docRef.set(team).get();
        System.out.println("✅ Created project team with ID: " + docRef.getId());
        return docRef.getId();
    }

    public void sendPaymentNotification(String projectId, String clientId, String clientEmail, String paymentUrl) throws Exception {
        // Prepare notification data
        Map<String, Object> notification = new HashMap<>();
        notification.put("type", "payment_request");
        notification.put("projectId", projectId);
        notification.put("recipientId", clientId);
        notification.put("email", clientEmail);
        notification.put("paymentUrl", paymentUrl);
        notification.put("timestamp", Timestamp.now());
        notification.put("status", "unread");

        // Get project title for message
        DocumentSnapshot projectSnapshot = db.collection("pending_projects").document(projectId).get().get();
        String projectTitle = projectSnapshot.exists() ? projectSnapshot.getString("title") : "your project";
        notification.put("message", "Please complete your payment for project \"" + projectTitle + "\".");

        // Add notification and retrieve its ID
        DocumentReference ref = db.collection("notifications").add(notification).get();
        String id = ref.getId();

        ref.update("id", id).get();
    }

    public void sendGeneralNotification(String recipientId, String message, String type) throws Exception {
        Map<String, Object> notification = new HashMap<>();
        notification.put("recipientId", recipientId);
        notification.put("message", message);
        notification.put("type", type);
        notification.put("timestamp", new Date());
        notification.put("status", "unread");
        db.collection("notifications").add(notification).get();
    }

    public List<Notification> getNotificationsForUser(String userId) throws ExecutionException, InterruptedException {
        List<Notification> results = new ArrayList<>();

        Query query = db.collection("notifications")
                .whereEqualTo("recipientId", userId);
        List<QueryDocumentSnapshot> docs = query.get().get().getDocuments();

        for (QueryDocumentSnapshot doc : docs) {
            Notification notification = doc.toObject(Notification.class);
            notification.setId(doc.getId()); // ✅ This line is critical
            results.add(notification);
        }

        return results;
    }

    public void markNotificationAsRead(String notificationId) throws Exception {
        db.collection("notifications")
                .document(notificationId)
                .update("status", "read")
                .get();
    }

    public void deleteNotification(String notificationId) throws Exception {
        db.collection("notifications")
                .document(notificationId)
                .delete()
                .get();
    }

    public void sendMeetingRequestNotifications(Meeting m) throws Exception {
        // 1) look up the client’s User record
        User client = getUserById(m.getUserId());
        String fullName = (client != null)
                ? (client.getName() + " " + client.getSurname()).trim()
                : m.getUserId();  // fallback to ID if name lookup fails

        // 2) build the human-friendly message
        String notifyMsg = String.format(
                "%s requested a meeting on %s",
                fullName,
                m.getMeetingDate()
        );

        // 3) fetch all managers
        List<User> all = getAllUsers();
        for (User u : all) {
            if ("m".equals(u.getRole())) {
                Map<String,Object> n = new HashMap<>();
                n.put("recipientId", u.getId());
                n.put("message",     notifyMsg);
                n.put("type",        "meeting_request");
                n.put("meetingId",   m.getId());
                n.put("timestamp",   new Date());
                n.put("status",      "unread");
                db.collection("notifications").add(n).get();
            }
        }
    }

    public List<Meeting> getAllMeetings() throws Exception {
        List<Meeting> out = new ArrayList<>();
        QuerySnapshot snap = db.collection("meetings")
                .get()
                .get();
        for (DocumentSnapshot doc : snap.getDocuments()) {
            Meeting m = doc.toObject(Meeting.class);
            if (m != null) {
                m.setId(doc.getId());
                out.add(m);
            }
        }
        return out;
    }

    public void sendMeetingAcceptedNotification(Meeting m) throws Exception {
        Map<String,Object> n = new HashMap<>();
        n.put("recipientId", m.getUserId());
        n.put("message",     "Your meeting on " + m.getMeetingDate() + " was accepted");
        n.put("type",        "meeting_accepted");
        n.put("meetingId",   m.getId());
        n.put("timestamp",   new Date());
        n.put("status",      "unread");
        db.collection("notifications").add(n).get();
    }

    /**
     * Notify the client that their meeting was rejected.
     */
    public void sendMeetingRejectedNotification(Meeting m) throws Exception {
        Map<String,Object> n = new HashMap<>();
        n.put("recipientId", m.getUserId());
        n.put("message",     "Your meeting request for " + m.getMeetingDate() + " was rejected");
        n.put("type",        "meeting_rejected");
        n.put("meetingId",   m.getId());
        n.put("timestamp",   new Date());
        n.put("status",      "unread");
        db.collection("notifications").add(n).get();
    }


    public List<Map<String, Object>> getFeedbackWithReplies() throws ExecutionException, InterruptedException {
        CollectionReference ref = db.collection("feedback");
        List<QueryDocumentSnapshot> allDocs = ref.get().get().getDocuments();

        List<Map<String, Object>> feedbacks = new ArrayList<>();
        Map<String, List<Map<String, Object>>> repliesMap = new HashMap<>();

        for (QueryDocumentSnapshot doc : allDocs) {
            Map<String, Object> data = doc.getData();
            data.put("id", doc.getId());
            String parentId = (String) data.get("parentId");
            if (parentId == null) {
                feedbacks.add(data);
            } else {
                repliesMap.computeIfAbsent(parentId, k -> new ArrayList<>()).add(data);
            }
        }

        for (Map<String, Object> fb : feedbacks) {
            String fbId = (String) fb.get("id");
            fb.put("replies", repliesMap.getOrDefault(fbId, List.of()));
        }

        return feedbacks;
    }

    public void addFeedback(Map<String, Object> feedbackData) {
        db.collection("feedback").add(feedbackData);
    }

    public String deleteFeedback(String id) throws ExecutionException, InterruptedException {
        db.collection("feedback").document(id).delete().get();
        return "Deleted feedback with ID: " + id;
    }

    public String getGoogleRefreshToken(String email) throws Exception {
        DocumentSnapshot userDoc = getUserDocByEmail(email);
        if (userDoc != null && userDoc.contains("googleRefreshToken")) {
            return userDoc.getString("googleRefreshToken");
        }
        return null;
    }

    public void attachGoogleCalendarToken(String email, String refreshToken) throws ExecutionException, InterruptedException {
        DocumentSnapshot doc = getUserDocByEmail(email);
        if (doc != null) {
            doc.getReference().update("googleRefreshToken", refreshToken).get();
            System.out.println("✅ Attached Google refresh token for: " + email);
        } else {
            System.out.println("❌ Could not find user: " + email);
        }
    }

    public void saveTwoFactorCode(String email, String code, long expiresAt) {
        Map<String, Object> data = Map.of("code", code, "expiresAt", expiresAt);
        db.collection("two_factor_codes").document(email).set(data);
    }

    public DocumentSnapshot getTwoFactorCode(String email) throws ExecutionException, InterruptedException {
        return db.collection("two_factor_codes").document(email).get().get();
    }

    public void deleteTwoFactorCode(String email) {
        db.collection("two_factor_codes").document(email).delete();
    }

    public boolean isDeviceRemembered(String email, String deviceId) throws ExecutionException, InterruptedException {
        DocumentSnapshot doc = db.collection("remembered_devices").document(email).get().get();
        if (doc.exists()) {
            Map<String, Object> devices = (Map<String, Object>) doc.get("devices");
            if (devices != null && devices.containsKey(deviceId)) {
                long expiry = ((Number) devices.get(deviceId)).longValue();
                return System.currentTimeMillis() < expiry;
            }
        }
        return false;
    }

    public void rememberDevice(String email, String deviceId) {
        long expiresAt = System.currentTimeMillis() + (30L * 24 * 60 * 60 * 1000); // 30 days
        Map<String, Object> update = new HashMap<>();
        update.put("devices." + deviceId, expiresAt);
        db.collection("remembered_devices")
                .document(email)
                .set(update, SetOptions.merge());
    }

    public List<Invoice> getInvoicesForManagerWithinPeriod(String managerId, LocalDate start, LocalDate end) throws Exception {
        List<Invoice> results = new ArrayList<>();

        CollectionReference invoicesRef = db.collection("invoices");
        List<QueryDocumentSnapshot> docs = invoicesRef.get().get().getDocuments();

        System.out.println("📋 Total invoices fetched: " + docs.size());

        for (QueryDocumentSnapshot doc : docs) {
            Map<String, Object> data = doc.getData();

            // 🔍 Extract projectId and resolve managerId
            Object projectRaw = data.get("projectId");
            String projectId;
            if (projectRaw instanceof DocumentReference ref) {
                projectId = ref.getId();
            } else if (projectRaw instanceof String str) {
                projectId = str;
            } else {
                System.out.println("❌ Invalid projectId format for invoice: " + doc.getId());
                continue;
            }

            // 🔍 Get project from one of the 3 collections
            String actualManagerId = null;
            for (String collection : List.of("pending_projects", "active_projects", "finished_projects")) {
                DocumentSnapshot projectSnap = db.collection(collection).document(projectId).get().get();
                if (projectSnap.exists()) {
                    Object mgrRaw = projectSnap.get("managerId");
                    if (mgrRaw != null) {
                        actualManagerId = mgrRaw.toString();
                        break;
                    }
                }
            }

            System.out.println("🔍 Invoice ID: " + doc.getId());
            System.out.println(" - Project ID: " + projectId);
            System.out.println(" - Manager ID: " + actualManagerId);

            if (!managerId.equals(actualManagerId)) {
                System.out.println("❌ Skipping: managerId does not match.");
                continue;
            }

            // 🔍 Extract createdAt date (supports Timestamp or String)
            Object createdAtRaw = data.get("createdAt");
            LocalDate createdDate;
            if (createdAtRaw instanceof com.google.cloud.Timestamp ts) {
                createdDate = ts.toDate().toInstant().atZone(ZoneId.systemDefault()).toLocalDate();
            } else if (createdAtRaw instanceof String str) {
                try {
                    createdDate = Instant.parse(str).atZone(ZoneId.systemDefault()).toLocalDate();
                } catch (Exception e) {
                    System.out.println("❌ Invalid createdAt string for invoice: " + doc.getId());
                    continue;
                }
            } else {
                System.out.println("❌ Invalid createdAt format for invoice: " + doc.getId());
                continue;
            }

            if (createdDate.isBefore(start) || createdDate.isAfter(end)) continue;

            // 🔍 Extract clientId (supports DocumentReference or String)
            Object clientIdRaw = data.get("clientId");
            String clientId;
            if (clientIdRaw instanceof DocumentReference ref) {
                clientId = ref.getId();
            } else if (clientIdRaw instanceof String str) {
                clientId = str;
            } else {
                System.out.println("❌ Invalid clientId format for invoice: " + doc.getId());
                continue;
            }

            // ✅ Build invoice
            Invoice invoice = new Invoice();
            invoice.setId(doc.getId());
            invoice.setProjectId(projectId);
            invoice.setClientId(clientId);
            invoice.setAmount(Double.parseDouble(data.get("amount").toString()));
            invoice.setCreatedAt(createdDate.toString());

            results.add(invoice);
        }

        System.out.println("✅ Final invoices included: " + results.size());
        return results;
    }



    public String getProjectTitleById(String projectId) throws Exception {
        String[] collections = { "pending_projects", "active_projects", "finished_projects" };

        for (String collection : collections) {
            System.out.println("🔎 Looking for project in collection: " + collection + " with ID: " + projectId);
            DocumentSnapshot snapshot = db.collection(collection).document(projectId).get().get();
            if (snapshot.exists()) {
                String title = snapshot.getString("title");
                System.out.println("✅ Found project in " + collection + ": Title = " + title);
                return title;
            }
        }

        System.out.println("❌ Project ID not found in any collection: " + projectId);
        return null;
    }

    public String getUserNameById(String userId) throws Exception {
        System.out.println("🔎 Fetching user with ID: " + userId);
        DocumentSnapshot snapshot = db.collection("users").document(userId).get().get();
        if (snapshot.exists()) {
            String name = snapshot.getString("name");
            System.out.println("✅ Found user: Name = " + name);
            return name;
        } else {
            System.out.println("❌ User not found: " + userId);
            return null;
        }
    }

    // Meetings

    public Meeting saveMeeting(Meeting m) throws Exception {
        DocumentReference ref = db.collection("meetings").document();
        m.setId(ref.getId());
        ref.set(m).get();
        return m;
    }

    /**
     * Fetch all meetings where status == "pending"
     */
    public List<Meeting> getPendingMeetings() throws Exception {
        QuerySnapshot snap = db.collection("meetings")
                .whereEqualTo("status", "pending")
                .get()
                .get();
        return snap.getDocuments().stream()
                .map(doc -> {
                    Meeting m = doc.toObject(Meeting.class);
                    m.setId(doc.getId());
                    return m;
                })
                .collect(Collectors.toList());
    }

    /**
     * Lookup a single meeting by its ID
     * (needed so you can read m.getUserId() & m.getMeetingDate())
     */
    public Meeting getMeetingById(String id) throws Exception {
        DocumentSnapshot snap = db.collection("meetings").document(id).get().get();
        if (!snap.exists()) return null;
        Meeting m = snap.toObject(Meeting.class);
        m.setId(snap.getId());
        return m;
    }

    /**
     * Update the `status` field for a meeting (e.g. "accepted")
     */
    public void updateMeetingStatus(String id, String newStatus) throws Exception {
        db.collection("meetings")
                .document(id)
                .update("status", newStatus)
                .get();
    }

    /**
     * Delete a meeting document (used on reject)
     */
    public void deleteMeeting(String id) throws Exception {
        db.collection("meetings")
                .document(id)
                .delete()
                .get();
    }

    /**
     * Fetch just the pending meetings for a single user.
     */

    public List<Meeting> getMeetingsForUser(String userId) throws Exception {
        QuerySnapshot snap = db.collection("meetings")
                .whereEqualTo("userId", userId)
                .get()
                .get();

        return snap.getDocuments().stream()
                .map(doc -> {
                    Meeting m = doc.toObject(Meeting.class);
                    m.setId(doc.getId());
                    return m;
                })
                .collect(Collectors.toList());
    }

}