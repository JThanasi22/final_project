package main.controller;

import main.model.Portfolio;
import main.service.FirestoreService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.concurrent.ExecutionException;

@RestController
@RequestMapping("/api/portfolios")
@CrossOrigin(origins = "*", maxAge = 3600)
public class PortfolioController {

    private final FirestoreService firestoreService;

    public PortfolioController(FirestoreService firestoreService) {
        this.firestoreService = firestoreService;
    }

    // Get all portfolios
    @GetMapping
    public ResponseEntity<?> getAllPortfolios() {
        try {
            List<Portfolio> portfolios = firestoreService.getAllPortfolios();
            return ResponseEntity.ok(portfolios);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error fetching portfolios: " + e.getMessage());
        }
    }

    // Get a specific portfolio
    @GetMapping("/{id}")
    public ResponseEntity<?> getPortfolioById(@PathVariable String id) {
        try {
            Portfolio portfolio = firestoreService.getPortfolioById(id);
            if (portfolio != null) {
                return ResponseEntity.ok(portfolio);
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("Portfolio not found with ID: " + id);
            }
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error fetching portfolio: " + e.getMessage());
        }
    }

    // Get portfolios for a specific user
    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getPortfoliosByUser(@PathVariable String userId) {
        try {
            List<Portfolio> portfolios = firestoreService.getPortfoliosByUser(userId);
            return ResponseEntity.ok(portfolios);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error fetching portfolios: " + e.getMessage());
        }
    }

    // Create a new portfolio
    @PostMapping
    public ResponseEntity<?> createPortfolio(@RequestBody Portfolio portfolio) {
        try {
            String portfolioId = firestoreService.createPortfolio(portfolio);
            return ResponseEntity.status(HttpStatus.CREATED).body(portfolioId);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error creating portfolio: " + e.getMessage());
        }
    }

    // Update an existing portfolio
    @PutMapping("/{id}")
    public ResponseEntity<?> updatePortfolio(@PathVariable String id, @RequestBody Portfolio portfolio) {
        try {
            // Ensure the portfolio ID matches the path parameter
            portfolio.setId(id);
            
            Portfolio existingPortfolio = firestoreService.getPortfolioById(id);
            if (existingPortfolio == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("Portfolio not found with ID: " + id);
            }
            
            boolean updated = firestoreService.updatePortfolio(portfolio);
            if (updated) {
                return ResponseEntity.ok("Portfolio updated successfully");
            } else {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body("Failed to update portfolio");
            }
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error updating portfolio: " + e.getMessage());
        }
    }

    // Delete a portfolio
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletePortfolio(@PathVariable String id) {
        try {
            Portfolio portfolio = firestoreService.getPortfolioById(id);
            if (portfolio == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("Portfolio not found with ID: " + id);
            }
            
            boolean deleted = firestoreService.deletePortfolio(id);
            if (deleted) {
                return ResponseEntity.ok("Portfolio deleted successfully");
            } else {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body("Failed to delete portfolio");
            }
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error deleting portfolio: " + e.getMessage());
        }
    }
} 