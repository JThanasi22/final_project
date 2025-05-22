package main.service;

import com.stripe.Stripe;
import com.stripe.model.checkout.Session;
import com.stripe.param.checkout.SessionCreateParams;
import org.springframework.stereotype.Service;

@Service
public class StripeService {

    private static final String SECRET_KEY = "sk_test_51RRGCsGhz3J1k4hEFXwUkG0x7Qrob8UGKf2HV1T9HH5cUeXt8XhPuZyhqf16xdG7OgkpndevwQkWcfrA9kUFVdz400fbUYOJtj";

    public Session createCheckoutSession(String successUrl, String cancelUrl, long amount, String projectId) throws Exception {
        Stripe.apiKey = SECRET_KEY;

        SessionCreateParams params = SessionCreateParams.builder()
                .setClientReferenceId(projectId) // ✅ safer than relying on successUrl
                .setMode(SessionCreateParams.Mode.PAYMENT)
                .setSuccessUrl(successUrl)
                .setCancelUrl(cancelUrl)
                .addLineItem(
                        SessionCreateParams.LineItem.builder()
                                .setQuantity(1L)
                                .setPriceData(
                                        SessionCreateParams.LineItem.PriceData.builder()
                                                .setCurrency("eur")
                                                .setUnitAmount(amount)
                                                .setProductData(
                                                        SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                                                .setName("Studio 21")
                                                                .build())
                                                .build())
                                .build())
                .build();

        return Session.create(params);
    }

    public String generatePaymentLink(String projectId, long halfAmount) throws Exception {
        Session session = createCheckoutSession(
                "http://localhost:5173/payment-success",
                "http://localhost:5173/payment-cancel",
                halfAmount,
                projectId
        );
        return session.getUrl();
    }
}
