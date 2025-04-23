package main.service;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import com.google.firebase.FirebaseApp;
import com.google.firebase.cloud.FirestoreClient;
import main.model.Project;
import main.model.User;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ExecutionException;

@Service
public class FirestoreService {

    private static final String USER_COLLECTION = "users";
    private static final String TOKEN_COLLECTION = "reset_tokens";
    private static final String PROJECT_COLLECTION = "projects";

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
    
    // ----------------- Project Operations -----------------
    
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
                .whereEqualTo("userId", userId)
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
    
    public Project getProjectById(String projectId) throws ExecutionException, InterruptedException {
        DocumentSnapshot doc = db.collection(PROJECT_COLLECTION).document(projectId).get().get();
        if (doc.exists()) {
            return doc.toObject(Project.class);
        }
        return null;
    }
    
    public String createProject(Project project) throws ExecutionException, InterruptedException {
        DocumentReference docRef = db.collection(PROJECT_COLLECTION).document();
        project.setId(docRef.getId());
        
        docRef.set(project).get();
        System.out.println("✅ Created project with ID: " + project.getId());
        
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
            docRef.set(project).get();
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
}
