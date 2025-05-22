package main.controller;

import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.model.Event;
import com.stripe.model.checkout.Session;
import com.stripe.net.ApiResource;
import com.stripe.net.Webhook;
import main.service.FirestoreService;
import main.service.StripeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.util.Map;

@RestController
@RequestMapping("/api/payment")
public class PaymentController {

    private final FirestoreService firestoreService;

    @Autowired
    private StripeService stripeService;

    public PaymentController(FirestoreService firestoreService) {
        this.firestoreService = firestoreService;
    }

    @PostMapping("/create-checkout-session")
    public Map<String, String> createCheckoutSession(@RequestBody Map<String, Object> data) throws Exception {
        long amount = Long.parseLong(data.get("amount").toString());
        String successUrl = data.get("successUrl").toString();
        String cancelUrl = data.get("cancelUrl").toString();
        String projectId = data.get("projectId").toString();

        Session session = stripeService.createCheckoutSession(successUrl, cancelUrl, amount, projectId);
        return Map.of("id", session.getId());
    }

    @PostMapping("/create-payment-link")
    public Map<String, String> createPaymentLink(@RequestBody Map<String, Object> payload) throws Exception {
        String projectId = payload.get("projectId").toString();
        long totalAmount = Long.parseLong(payload.get("amount").toString());
        long halfAmount = totalAmount / 2;

        String paymentUrl = stripeService.generatePaymentLink(projectId, halfAmount);
        return Map.of("paymentUrl", paymentUrl);
    }

    @PostMapping("/webhook")
    public ResponseEntity<String> handleWebhook(
            @RequestBody byte[] payloadBytes,
            @RequestHeader("Stripe-Signature") String sigHeader
    ) {
        String endpointSecret = "whsec_ea908896848ee2224b837bc4734d1ffc9e97c206604c2e123a366490b6a418f1";

        try {
            String payload = new String(payloadBytes, StandardCharsets.UTF_8);
            Event event = Webhook.constructEvent(payload, sigHeader, endpointSecret);

            if ("checkout.session.completed".equals(event.getType())) {
                try {
                    System.out.println("✅ Stripe event received: " + event.getType());

                    // ✅ FIXED DESERIALIZATION FROM RAW JSON
                    com.google.gson.JsonObject root = new com.google.gson.JsonParser().parse(payload).getAsJsonObject();
                    com.google.gson.JsonObject sessionJson = root.getAsJsonObject("data").getAsJsonObject("object");

                    System.out.println("📦 Raw session JSON: " + sessionJson);

                    Session session = ApiResource.GSON.fromJson(sessionJson, Session.class);
                    System.out.println("✅ Deserialized session ID: " + session.getId());
                    System.out.println("✅ Client Reference ID: " + session.getClientReferenceId());

                    String projectId = session.getClientReferenceId();
                    if (projectId == null) {
                        System.err.println("❌ Missing projectId in session.");
                        return ResponseEntity.badRequest().body("Missing projectId in session.");
                    }

                    boolean moved = firestoreService.movePendingProjectToActive(projectId);
                    if (!moved) {
                        System.err.println("❌ Could not move project to active: " + projectId);
                        return ResponseEntity.status(500).body("Failed to move project to active.");
                    }

                    DocumentSnapshot snapshot = firestoreService.getDb()
                            .collection("active_projects")
                            .document(projectId)
                            .get()
                            .get();

                    if (snapshot.exists()) {
                        DocumentReference clientRef = snapshot.get("clientId", DocumentReference.class);
                        String clientId = clientRef != null ? clientRef.getId() : null;
                        String priceStr = snapshot.getString("price");

                        if (priceStr == null || priceStr.isBlank()) {
                            System.err.println("❌ Price field is missing or empty for project: " + projectId);
                            return ResponseEntity.status(500).body("Missing price for project.");
                        }

                        long price = Long.parseLong(priceStr);
                        long halfAmount = price / 2;

                        if (clientId != null) {
                            firestoreService.createInvoice(clientId, projectId, halfAmount);
                            System.out.println("✅ Invoice created for project: " + projectId);
                        } else {
                            System.err.println("❌ Client ID is null for project: " + projectId);
                            return ResponseEntity.status(500).body("Missing clientId in active project.");
                        }
                    } else {
                        System.err.println("❌ Active project not found for ID: " + projectId);
                        return ResponseEntity.status(404).body("Active project not found.");
                    }

                    return ResponseEntity.ok("Webhook handled successfully.");
                } catch (Exception e) {
                    e.printStackTrace();
                    return ResponseEntity.badRequest().body("Webhook error: " + e.getMessage());
                }
            }

            return ResponseEntity.ok("Event received: " + event.getType());

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Webhook error: " + e.getMessage());
        }
    }

}

