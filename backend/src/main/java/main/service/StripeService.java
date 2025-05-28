package main.service;

import com.stripe.Stripe;
import com.stripe.model.checkout.Session;
import com.stripe.param.checkout.SessionCreateParams;
import org.springframework.stereotype.Service;
import com.itextpdf.text.*;
import com.itextpdf.text.pdf.PdfPCell;
import com.itextpdf.text.pdf.PdfPTable;
import com.itextpdf.text.pdf.PdfWriter;
import com.stripe.model.Charge;
import com.stripe.model.ChargeCollection;
import com.stripe.param.ChargeListParams;

import java.io.ByteArrayOutputStream;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.List;

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
                                                .setCurrency("usd")
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

    public String generatePaymentLink(String projectId, long ammount) throws Exception {
        Session session = createCheckoutSession(
                "http://localhost:5173/payment-success",
                "http://localhost:5173/payment-cancel",
                ammount,
                projectId
        );
        return session.getUrl();
    }

    public byte[] generateFinancialReport(String startDate, String endDate, String managerId) throws Exception {
        Stripe.apiKey = SECRET_KEY;

        long startTimestamp = LocalDate.parse(startDate).atStartOfDay().toEpochSecond(ZoneOffset.UTC);
        long endTimestamp = LocalDate.parse(endDate).plusDays(1).atStartOfDay().toEpochSecond(ZoneOffset.UTC);

        ChargeListParams params = ChargeListParams.builder()
                .setLimit(100L)
                .setCreated(
                        ChargeListParams.Created.builder()
                                .setGte(startTimestamp)
                                .setLte(endTimestamp)
                                .build()
                )
                .build();

        ChargeCollection charges = Charge.list(params);
        List<Charge> chargeList = charges.getData();

        // Generate PDF
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document document = new Document();
        PdfWriter.getInstance(document, out);
        document.open();

        document.add(new Paragraph("Stripe Financial Report", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18)));
        document.add(new Paragraph("Manager Email: " + managerId));
        document.add(new Paragraph("Date Range: " + startDate + " to " + endDate));
        document.add(new Paragraph("\n"));

        PdfPTable table = new PdfPTable(4);
        table.setWidths(new int[]{4, 3, 3, 4});
        table.addCell("Charge ID");
        table.addCell("Currency");
        table.addCell("Amount");
        table.addCell("Created At");

        for (Charge charge : chargeList) {
            table.addCell(charge.getId());
            table.addCell(charge.getCurrency().toUpperCase());
            table.addCell(String.format("%.2f", charge.getAmount() / 100.0));
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")
                    .withZone(ZoneId.of("Europe/Tirane")); // or use ZoneOffset.UTC if you want UTC

            table.addCell(formatter.format(Instant.ofEpochSecond(charge.getCreated())));        }

        document.add(table);
        document.close();

        return out.toByteArray();
    }

}
