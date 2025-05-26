package main.util;

import main.model.Invoice;
import main.service.FirestoreService;
import org.apache.pdfbox.pdmodel.*;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;

import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.util.List;

public class PdfReportUtil {

    public static byte[] generateInvoiceReport(List<Invoice> invoices, LocalDate start, LocalDate end, FirestoreService firestoreService) throws Exception {
        PDDocument doc = new PDDocument();
        PDPage page = new PDPage(PDRectangle.A4);
        doc.addPage(page);

        float margin = 50;
        float y = 770;
        float leading = 15;

        PDPageContentStream stream = new PDPageContentStream(doc, page);
        stream.setFont(PDType1Font.HELVETICA_BOLD, 18);
        stream.beginText();
        stream.newLineAtOffset(margin, y);
        stream.showText("Financial Report");
        stream.endText();

        y -= leading * 2;
        stream.setFont(PDType1Font.HELVETICA, 12);
        stream.beginText();
        stream.newLineAtOffset(margin, y);
        stream.showText("Period: " + start + " to " + end);
        stream.endText();

        y -= leading * 2;
        stream.setFont(PDType1Font.HELVETICA_BOLD, 10);
        stream.beginText();
        stream.newLineAtOffset(margin, y);
        stream.showText("Project Title | Client | Amount | Created At");
        stream.endText();

        double total = 0;
        stream.setFont(PDType1Font.HELVETICA, 10);

        for (Invoice invoice : invoices) {
            y -= leading;

            // Add new page if needed
            if (y < 50) {
                stream.close();
                page = new PDPage(PDRectangle.A4);
                doc.addPage(page);
                stream = new PDPageContentStream(doc, page);
                y = 770;

                // Redraw header on new page
                stream.setFont(PDType1Font.HELVETICA_BOLD, 10);
                stream.beginText();
                stream.newLineAtOffset(margin, y);
                stream.showText("Project Title | Client | Amount | Created At");
                stream.endText();

                y -= leading;
                stream.setFont(PDType1Font.HELVETICA, 10);
            }

            String title = firestoreService.getProjectTitleById(invoice.getProjectId());
            String clientName = firestoreService.getUserNameById(invoice.getClientId());

            stream.beginText();
            stream.newLineAtOffset(margin, y);
            stream.showText(String.format("%s | %s | $%.2f | %s",
                    title != null ? title : "Unknown Project",
                    clientName != null ? clientName : "Unknown Client",
                    invoice.getAmount() / 100.0,
                    invoice.getCreatedAt()));
            stream.endText();

            total += invoice.getAmount();
        }

        // Draw total at bottom
        y -= leading * 2;
        stream.setFont(PDType1Font.HELVETICA_BOLD, 12);
        stream.beginText();
        stream.newLineAtOffset(margin, y);
        stream.showText("Total: $" + String.format("%.2f", total / 100.0));
        stream.endText();

        stream.close();
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        doc.save(output);
        doc.close();
        return output.toByteArray();
    }


}
