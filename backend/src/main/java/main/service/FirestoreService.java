package main.service;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import com.google.firebase.FirebaseApp;
import com.google.firebase.cloud.FirestoreClient;
import main.model.User;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.concurrent.ExecutionException;

@Service
public class FirestoreService {

    private static final String COLLECTION_NAME = "users";
    private final Firestore db;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    // Inject the initialized FirebaseApp
    public FirestoreService(FirebaseApp firebaseApp) {
        this.db = FirestoreClient.getFirestore(firebaseApp);
    }

    public boolean userExists(String email) throws ExecutionException, InterruptedException {
        CollectionReference users = db.collection(COLLECTION_NAME);
        Query query = users.whereEqualTo("email", email);
        ApiFuture<QuerySnapshot> querySnapshot = query.get();
        return !querySnapshot.get().isEmpty();
    }

    public String saveUser(User user) throws ExecutionException, InterruptedException {
        if (userExists(user.getEmail())) {
            return "User already exists!";
        }

        // Encrypt password
        user.setPassword(passwordEncoder.encode(user.getPassword()));

        // Generate new document reference with auto ID
        DocumentReference docRef = db.collection(COLLECTION_NAME).document();

        // Set the ID inside the user object
        user.setId(docRef.getId());

        // Save user with the specified document ID
        ApiFuture<WriteResult> future = docRef.set(user);
        future.get();

        System.out.println("Saving user to Firestore with ID: " + user.getId());
        return "User registered with ID: " + user.getId();
    }

    public boolean validateUser(String email, String rawPassword) throws ExecutionException, InterruptedException {
        CollectionReference users = db.collection("users");
        Query query = users.whereEqualTo("email", email);
        ApiFuture<QuerySnapshot> querySnapshot = query.get();

        for (DocumentSnapshot doc : querySnapshot.get().getDocuments()) {
            User user = doc.toObject(User.class);
            System.out.println("Found user: " + user.getEmail());
            System.out.println("Raw password: " + rawPassword);
            System.out.println("Encrypted password in DB: " + user.getPassword());

            if (user != null && passwordEncoder.matches(rawPassword, user.getPassword())) {
                System.out.println("Password matches");
                return true;
            } else {
                System.out.println("Password does NOT match");
            }
        }

        System.out.println("No user found or password mismatch");
        return false;
    }


    public User getUserByEmail(String email) throws ExecutionException, InterruptedException {
        CollectionReference users = db.collection(COLLECTION_NAME);
        Query query = users.whereEqualTo("email", email);
        ApiFuture<QuerySnapshot> querySnapshot = query.get();

        for (DocumentSnapshot doc : querySnapshot.get().getDocuments()) {
            return doc.toObject(User.class);
        }
        return null;
    }
}
