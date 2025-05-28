package main.controller;

import main.model.Invoice;
import main.service.FirestoreService;
import main.service.StripeService;
import main.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api/invoices")
public class InvoiceController {


    @Autowired
    private StripeService stripeService;
    @Autowired
    private FirestoreService firestoreService;

    public InvoiceController(StripeService stripeService) {
        this.stripeService = stripeService;
    }


    @GetMapping
    public ResponseEntity<?> getAllInvoices() {
        try {
            List<Map<String, Object>> invoices = firestoreService.getAllInvoices();
            return ResponseEntity.ok(invoices);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/client")
    public ResponseEntity<?> getInvoicesByClientId(@RequestParam String clientId) {
        try {
            List<Map<String, Object>> invoices = firestoreService.getInvoicesByClientId(clientId);
            return ResponseEntity.ok(invoices);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error: " + e.getMessage());
        }
    }


    @GetMapping("/{id}")
    public ResponseEntity<?> getInvoiceById(@PathVariable String id) {
        try {
            Map<String, Object> invoice = firestoreService.getInvoiceById(id);
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

    @PostMapping
    public ResponseEntity<?> createInvoice(@RequestBody Map<String, Object> invoiceData) {
        try {
            if (invoiceData == null || invoiceData.isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invoice data is required");
            }

            String invoiceId = firestoreService.saveInvoice(invoiceData);
            return ResponseEntity.status(HttpStatus.CREATED).body(invoiceId);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error creating invoice: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateInvoice(@PathVariable String id, @RequestBody Map<String, Object> updatedData) {
        try {
            boolean updated = firestoreService.updateInvoice(id, updatedData);
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

    @GetMapping("/report")
    public ResponseEntity<byte[]> getReport(
            @RequestParam String startDate,
            @RequestParam String endDate,
            @RequestParam String managerId
    ) {
        try {
            byte[] pdf = stripeService.generateFinancialReport(startDate, endDate, managerId);
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=financial_report.pdf")
                    .contentType(MediaType.APPLICATION_PDF)
                    .body(pdf);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

}