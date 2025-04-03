package main.controller;

import main.model.User;
import org.springframework.web.bind.annotation.*;
import main.service.FirestoreService;

import java.util.concurrent.ExecutionException;

@RestController
@RequestMapping("/api/users")
public class Usercontroller {
    private final FirestoreService firestoreService;

    public Usercontroller(FirestoreService firestoreService) {
        this.firestoreService = firestoreService;
    }

    @PostMapping("/signup")
    public String signup(@RequestBody User user) {
        System.out.println("Received user: " + user.getEmail()); // 👈 Log input

        try {
            String result = firestoreService.saveUser(user);
            System.out.println("Signup result: " + result); // 👈 Log output
            return result;
        } catch (ExecutionException | InterruptedException e) {
            e.printStackTrace(); // 👈 Log the error
            return "Error: " + e.getMessage();
        }
    }
}
