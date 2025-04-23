package main.service;

import com.google.cloud.firestore.*;
import com.google.firebase.cloud.FirestoreClient;
import main.model.Task;
import main.model.User;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.concurrent.ExecutionException;

@Service
public class TaskService {

    private static final String TASK_COLLECTION = "tasks";
    private final Firestore db;
    private final FirestoreService firestoreService;

    public TaskService(FirestoreService firestoreService) {
        this.firestoreService = firestoreService;
        this.db = FirestoreClient.getFirestore();
    }

    public List<Task> getAllTasks(String userEmail) throws ExecutionException, InterruptedException {
        List<Task> tasks = new ArrayList<>();
        User user = firestoreService.getUserByEmail(userEmail);
        
        if (user == null) {
            System.out.println("❌ User not found for email: " + userEmail);
            return tasks;
        }
        
        System.out.println("🔍 Finding tasks for user: " + userEmail + " with role: " + user.getRole());
        
        try {
            // Create a query based on user's role
            if ("a".equals(user.getRole())) {
                // Admin can see all tasks
                System.out.println("👑 Admin user, fetching all tasks");
                QuerySnapshot snapshot = db.collection(TASK_COLLECTION).get().get();
                
                for (DocumentSnapshot doc : snapshot.getDocuments()) {
                    Task task = doc.toObject(Task.class);
                    if (task != null) {
                        tasks.add(task);
                        System.out.println("➕ Added task: " + task.getTitle());
                    }
                }
            } else {
                // Regular users only see tasks they created or are assigned to
                String fullName = (user.getName() != null ? user.getName() : "") + " " + 
                                 (user.getSurname() != null ? user.getSurname() : "");
                fullName = fullName.trim();
                
                System.out.println("👤 Regular user, fetching tasks for: " + fullName);
                
                // Get tasks where user is creator
                QuerySnapshot creatorSnapshot = db.collection(TASK_COLLECTION)
                        .whereEqualTo("createdBy", userEmail)
                        .get().get();
                
                System.out.println("📊 Found " + creatorSnapshot.size() + " tasks created by user");
                
                for (DocumentSnapshot doc : creatorSnapshot.getDocuments()) {
                    Task task = doc.toObject(Task.class);
                    if (task != null) {
                        tasks.add(task);
                        System.out.println("➕ Added task (as creator): " + task.getTitle());
                    }
                }
                
                // Get tasks assigned to the user
                QuerySnapshot assignedSnapshot = db.collection(TASK_COLLECTION)
                        .whereEqualTo("assignedTo", fullName)
                        .get().get();
                
                System.out.println("📊 Found " + assignedSnapshot.size() + " tasks assigned to user");
                
                for (DocumentSnapshot doc : assignedSnapshot.getDocuments()) {
                    Task task = doc.toObject(Task.class);
                    if (task != null && !containsTaskWithId(tasks, task.getId())) {
                        tasks.add(task);
                        System.out.println("➕ Added task (as assignee): " + task.getTitle());
                    }
                }
            }
            
            System.out.println("✅ Total tasks retrieved: " + tasks.size());
            return tasks;
        } catch (Exception e) {
            System.err.println("❌ Error retrieving tasks: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    private boolean containsTaskWithId(List<Task> tasks, String id) {
        return tasks.stream().anyMatch(t -> t.getId().equals(id));
    }

    public Task getTaskById(String id) throws ExecutionException, InterruptedException {
        try {
            System.out.println("🔍 Getting task by ID: " + id);
            DocumentSnapshot doc = db.collection(TASK_COLLECTION).document(id).get().get();
            
            if (doc.exists()) {
                Task task = doc.toObject(Task.class);
                System.out.println("✅ Task found: " + (task != null ? task.getTitle() : "null"));
                return task;
            } else {
                System.out.println("❌ Task not found with ID: " + id);
                return null;
            }
        } catch (Exception e) {
            System.err.println("❌ Error getting task by ID: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    public Task createTask(Task task) throws ExecutionException, InterruptedException {
        try {
            System.out.println("➕ Creating new task: " + task.getTitle());
            DocumentReference docRef = db.collection(TASK_COLLECTION).document();
            task.setId(docRef.getId());
            docRef.set(task).get();
            System.out.println("✅ Task created with ID: " + task.getId());
            return task;
        } catch (Exception e) {
            System.err.println("❌ Error creating task: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    public Task updateTask(Task task) throws ExecutionException, InterruptedException {
        try {
            System.out.println("🔄 Updating task: " + task.getId());
            DocumentReference docRef = db.collection(TASK_COLLECTION).document(task.getId());
            docRef.set(task).get();
            System.out.println("✅ Task updated: " + task.getTitle());
            return task;
        } catch (Exception e) {
            System.err.println("❌ Error updating task: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    public boolean deleteTask(String id) throws ExecutionException, InterruptedException {
        try {
            System.out.println("🗑️ Deleting task: " + id);
            DocumentReference docRef = db.collection(TASK_COLLECTION).document(id);
            DocumentSnapshot doc = docRef.get().get();
            
            if (doc.exists()) {
                docRef.delete().get();
                System.out.println("✅ Task deleted successfully");
                return true;
            } else {
                System.out.println("❌ Task not found for deletion");
                return false;
            }
        } catch (Exception e) {
            System.err.println("❌ Error deleting task: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }
} 