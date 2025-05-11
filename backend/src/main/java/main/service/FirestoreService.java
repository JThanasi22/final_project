package main.service;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import com.google.firebase.FirebaseApp;
import com.google.firebase.cloud.FirestoreClient;
import main.dto.ProjectResponse;
import main.model.*;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.text.SimpleDateFormat;
import java.util.*;
import java.util.concurrent.ExecutionException;

@Service
public class FirestoreService {

    private static final String USER_COLLECTION = "users";
    private static final String TOKEN_COLLECTION = "reset_tokens";
    private static final String PROJECT_COLLECTION = "projects";
    private static final String TASK_COLLECTION = "tasks";
    private static final String INVOICE_COLLECTION = "invoices";
    private static final String PORTFOLIO_COLLECTION = "portfolios";
    private static final String MESSAGES_COLLECTION = "messages";

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

    public boolean movePendingProjectToActive(String projectId, List<String> photographers, List<String> editors, String price) {
        try {
            DocumentReference pendingRef = db.collection("pending_projects").document(projectId);
            DocumentSnapshot pendingSnapshot = pendingRef.get().get();

            if (!pendingSnapshot.exists()) {
                System.out.println("❌ Pending project not found: " + projectId);
                return false;
            }

            // Copy data
            Map<String, Object> projectData = new HashMap<>(pendingSnapshot.getData());
            projectData.put("photographers", photographers);
            projectData.put("editors", editors);
            projectData.put("price", price);
            projectData.put("status", "active");
            projectData.put("assignedAt", Instant.now().toString());
            projectData.put("state", 1);  // state 1 → photographer phase

            // Save to active_projects
            DocumentReference activeRef = db.collection("active_projects").document(projectId);
            activeRef.set(projectData).get();

            // Delete from pending_projects
            pendingRef.delete().get();

            System.out.println("✅ Project moved to active_projects: " + projectId);
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
                response.setUserId(project.getUserId());
                response.setProjectTeamId(project.getProjectTeamId());
                response.setState(project.getState());
                response.setPhotographers(project.getPhotographers());
                response.setEditors(project.getEditors());
                response.setAssignedAt(project.getAssignedAt());

                userProjects.add(response);
            }
        }

        return userProjects;
    }

    public List<Project> getAllFinishedProjects() throws ExecutionException, InterruptedException {
        List<Project> projects = new ArrayList<>();
        QuerySnapshot snapshot = db.collection("finished_projects").get().get();

        for (DocumentSnapshot doc : snapshot.getDocuments()) {
            Project project = doc.toObject(Project.class);
            if (project != null) {
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
                response.setUserId(project.getUserId());
                response.setProjectTeamId(project.getProjectTeamId());
                response.setState(project.getState());
                response.setPhotographers(project.getPhotographers());
                response.setEditors(project.getEditors());
                response.setAssignedAt(project.getAssignedAt());

                userProjects.add(response);
            }
        }

        return userProjects;
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

    public void attachFinalMediaToProject(String projectId, List<MultipartFile> files) throws Exception {
        DocumentReference projectRef = db.collection("active_projects").document(projectId);
        DocumentSnapshot projectSnap = projectRef.get().get();

        if (!projectSnap.exists()) {
            throw new Exception("Project not found");
        }

        List<Map<String, String>> finalMediaList = new ArrayList<>();
        for (MultipartFile file : files) {
            String base64 = Base64.getEncoder().encodeToString(file.getBytes());

            Map<String, String> mediaItem = new HashMap<>();
            mediaItem.put("fileName", file.getOriginalFilename());
            mediaItem.put("content", base64);

            finalMediaList.add(mediaItem);
        }

        // Store under a 'finalMedia' field inside the project
        Map<String, Object> updates = new HashMap<>();
        updates.put("finalMedia", finalMediaList);

        projectRef.update(updates).get();
        System.out.println("✅ Attached final media to project: " + projectId);
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
            finishedData.put("projectTeamId", activeData.get("projectTeamId"));
            finishedData.put("state", 3); // mark as finished
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

    public String createProject(Project project, String clientId) throws ExecutionException, InterruptedException {
        project.setStatus("pending");
        project.setClientId(db.collection("users").document(clientId)); // Convert to DocumentReference
        project.setCreationDate(Instant.now().toString());

        DocumentReference docRef = db.collection("pending_projects").document();
        project.setId(docRef.getId());

        docRef.set(project).get();
        return project.getId();
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

    // ----------------- Invoice Management -----------------

    public List<Invoice> getAllInvoices() throws ExecutionException, InterruptedException {
        List<Invoice> invoices = new ArrayList<>();
        QuerySnapshot snapshot = db.collection(INVOICE_COLLECTION).get().get();

        for (DocumentSnapshot doc : snapshot.getDocuments()) {
            Invoice invoice = doc.toObject(Invoice.class);
            if (invoice != null) {
                invoices.add(invoice);
            }
        }

        System.out.println("✅ Retrieved " + invoices.size() + " invoices");
        return invoices;
    }

    public List<Invoice> getInvoicesByClientId(String clientId) throws ExecutionException, InterruptedException {
        List<Invoice> invoices = new ArrayList<>();
        QuerySnapshot snapshot = db.collection(INVOICE_COLLECTION)
                .whereEqualTo("clientId", clientId)
                .get().get();

        for (DocumentSnapshot doc : snapshot.getDocuments()) {
            Invoice invoice = doc.toObject(Invoice.class);
            if (invoice != null) {
                invoices.add(invoice);
            }
        }

        System.out.println("✅ Retrieved " + invoices.size() + " invoices for client: " + clientId);
        return invoices;
    }

    public Invoice getInvoiceById(String invoiceId) throws ExecutionException, InterruptedException {
        DocumentSnapshot doc = db.collection(INVOICE_COLLECTION).document(invoiceId).get().get();
        if (doc.exists()) {
            Invoice invoice = doc.toObject(Invoice.class);
            System.out.println("✅ Retrieved invoice: " + invoiceId);
            return invoice;
        }
        System.out.println("❌ Invoice not found: " + invoiceId);
        return null;
    }

    public String saveInvoice(Invoice invoice) throws ExecutionException, InterruptedException {
        try {
            // Validate the invoice object
            if (invoice == null) {
                throw new IllegalArgumentException("Invoice object cannot be null");
            }

            if (invoice.getClientId() == null || invoice.getClientId().isEmpty()) {
                throw new IllegalArgumentException("Client ID is required");
            }

            // If no ID is provided, create a new invoice number with pattern INV-YYYY-XXXX
            if (invoice.getId() == null || invoice.getId().isEmpty()) {
                String invoiceNumber = "INV-" + new SimpleDateFormat("yyyy").format(new Date()) + "-"
                        + String.format("%04d", (int)(Math.random() * 10000));
                invoice.setId(invoiceNumber);
            }

            // Set created date if not provided
            if (invoice.getCreatedAt() == null || invoice.getCreatedAt().isEmpty()) {
                invoice.setCreatedAt(new SimpleDateFormat("yyyy-MM-dd").format(new Date()));
            }

            // Make sure numeric fields are properly set
            if (invoice.getTax() <= 0 && invoice.getAmount() > 0) {
                // Calculate tax if not provided (10%)
                invoice.setTax(invoice.getAmount() * 0.1);
            }

            if (invoice.getTotal() <= 0) {
                // Calculate total if not provided
                invoice.setTotal(invoice.getAmount() + invoice.getTax());
            }

            // Create document reference with the invoice ID
            DocumentReference docRef = db.collection(INVOICE_COLLECTION).document(invoice.getId());

            // Save the invoice
            System.out.println("Saving invoice: " + invoice.toString());
            ApiFuture<WriteResult> result = docRef.set(invoice);
            result.get(); // Wait for completion

            System.out.println("✅ Saved invoice with ID: " + invoice.getId());
            return invoice.getId();
        } catch (Exception e) {
            System.err.println("❌ Error saving invoice: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    public boolean updateInvoice(String invoiceId, Invoice updatedInvoice) throws ExecutionException, InterruptedException {
        DocumentReference docRef = db.collection(INVOICE_COLLECTION).document(invoiceId);
        DocumentSnapshot doc = docRef.get().get();

        if (doc.exists()) {
            // Ensure the ID remains the same
            updatedInvoice.setId(invoiceId);
            docRef.set(updatedInvoice).get();
            System.out.println("✅ Updated invoice: " + invoiceId);
            return true;
        }

        System.out.println("❌ Invoice not found for update: " + invoiceId);
        return false;
    }

    public boolean deleteInvoice(String invoiceId) throws ExecutionException, InterruptedException {
        DocumentReference docRef = db.collection(INVOICE_COLLECTION).document(invoiceId);
        DocumentSnapshot doc = docRef.get().get();

        if (doc.exists()) {
            docRef.delete().get();
            System.out.println("✅ Deleted invoice: " + invoiceId);
            return true;
        }

        System.out.println("❌ Invoice not found for deletion: " + invoiceId);
        return false;
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
}