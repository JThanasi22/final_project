package main.controller;

import main.model.Invoice;
import main.service.FirestoreService;
import main.util.JwtUtil;
import main.util.PdfReportUtil;
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
    private FirestoreService firestoreService;

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
    public ResponseEntity<byte[]> generateFinancialReport(
            @RequestParam String startDate,
            @RequestParam String endDate,
            @RequestHeader("Authorization") String token
    ) {
        try {
            String cleanToken = token.replace("Bearer ", "");
            String managerId = JwtUtil.extractUserId(cleanToken);

            LocalDate start = LocalDate.parse(startDate);
            LocalDate end = LocalDate.parse(endDate);

            List<Invoice> invoices = firestoreService.getInvoicesForManagerWithinPeriod(managerId, start, end);
            byte[] pdf = PdfReportUtil.generateInvoiceReport(invoices, start, end, firestoreService);

            return ResponseEntity.ok()
                    .header("Content-Type", "application/pdf")
                    .header("Content-Disposition", "attachment; filename=financial_report.pdf")
                    .body(pdf);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(null);
        }
    }

}
