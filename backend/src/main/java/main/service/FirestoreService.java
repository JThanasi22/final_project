package main.service;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import com.google.firebase.FirebaseApp;
import com.google.firebase.cloud.FirestoreClient;
import main.model.Project;
import main.model.User;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.text.SimpleDateFormat;
import java.util.*;
import java.util.concurrent.ExecutionException;

@Service
public class FirestoreService {

    private static final String USER_COLLECTION = "users";
    private static final String TOKEN_COLLECTION = "reset_tokens";

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


    // ----------------- Project -----------------

    private static final String PENDING_COLLECTION = "pending_projects";
    private static final String[] PROJECT_COLLECTIONS = {
            "pending_projects", "active_projects", "finished_projects"
    };

    // Create a project (default collection: pending_projects, default status: pending)
    public void createProject(Project project, String userId) {
        CollectionReference collectionRef = db.collection(PENDING_COLLECTION);
        DocumentReference userRef = db.collection("users").document(userId);

        // Set defaults
        project.setStatus("pending");
        project.setClientId(userRef); // Set the clientId as DocumentReference
        project.setId(null);          // Firestore will assign the ID from docRef.getId()

        // Set creationDate using Java time (formatted like endDate)
        String formattedCreationDate = new SimpleDateFormat("yyyy-MM-dd").format(new Date());
        project.setCreationDate(formattedCreationDate);

        // Add the project to Firestore and get the auto-generated ID
        DocumentReference docRef = collectionRef.document();
        project.setId(docRef.getId());  // Assign the generated ID to the project object

        // Set the project data
        ApiFuture<WriteResult> result = docRef.set(project);
    }

    // Fetch projects by user ID (search across all collections)
    public List<Project> getProjectsByUserId(String userId) {
        List<Project> allProjects = new ArrayList<>();
        DocumentReference userRef = db.collection("users").document(userId);

        for (String collection : PROJECT_COLLECTIONS) {
            try {
                ApiFuture<QuerySnapshot> future = db.collection(collection)
                        .whereEqualTo("clientId", userRef)
                        .get();

                List<QueryDocumentSnapshot> documents = future.get().getDocuments();
                for (DocumentSnapshot doc : documents) {
                    Project project = doc.toObject(Project.class);
                    project.setId(doc.getId());  // Attach the document ID
                    allProjects.add(project);
                }
            } catch (InterruptedException | ExecutionException e) {
                e.printStackTrace();
            }
        }
        return allProjects;
    }
}
