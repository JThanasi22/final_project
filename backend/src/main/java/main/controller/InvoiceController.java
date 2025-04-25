package main.controller;

import main.model.Invoice;
import main.service.FirestoreService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/invoices")
@CrossOrigin(origins = "*", maxAge = 3600)
public class InvoiceController {

    @Autowired
    private FirestoreService firestoreService;

    @GetMapping
    public ResponseEntity<?> getAllInvoices() {
        try {
            List<Invoice> invoices = firestoreService.getAllInvoices();
            return ResponseEntity.ok(invoices);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getInvoiceById(@PathVariable String id) {
        try {
            Invoice invoice = firestoreService.getInvoiceById(id);
            if (invoice != null) {
                return ResponseEntity.ok(invoice);
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Invoice not found with ID: " + id);
            }
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/client/{clientId}")
    public ResponseEntity<?> getInvoicesByClientId(@PathVariable String clientId) {
        try {
            List<Invoice> invoices = firestoreService.getInvoicesByClientId(clientId);
            return ResponseEntity.ok(invoices);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error: " + e.getMessage());
        }
    }

    @PostMapping
    public ResponseEntity<?> createInvoice(@RequestBody Invoice invoice) {
        try {
            // Basic validation
            if (invoice == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invoice data is required");
            }
            
            String invoiceId = firestoreService.saveInvoice(invoice);
            System.out.println("Created invoice with ID: " + invoiceId);
            return ResponseEntity.status(HttpStatus.CREATED).body(invoiceId);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error creating invoice: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateInvoice(@PathVariable String id, @RequestBody Invoice invoice) {
        try {
            boolean updated = firestoreService.updateInvoice(id, invoice);
            if (updated) {
                return ResponseEntity.ok("Invoice updated successfully");
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Invoice not found with ID: " + id);
            }
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error updating invoice: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteInvoice(@PathVariable String id) {
        try {
            boolean deleted = firestoreService.deleteInvoice(id);
            if (deleted) {
                return ResponseEntity.ok("Invoice deleted successfully");
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Invoice not found with ID: " + id);
            }
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error deleting invoice: " + e.getMessage());
        }
    }
} 