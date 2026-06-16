package com.myfoundation.school.donation;

import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.lowagie.text.pdf.draw.LineSeparator;
import com.myfoundation.school.config.SiteConfigService;
import com.myfoundation.school.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

/**
 * Service that generates downloadable PDF donation receipts.
 * Uses OpenPDF (LGPL fork of iText 5) for PDF creation.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class DonationReceiptService {

    private final DonationRepository donationRepository;
    private final SiteConfigService siteConfigService;

    @Value("${app.mail.from-name:Foundation}")
    private String defaultOrgName;

    private static final DateTimeFormatter DATE_FORMATTER =
            DateTimeFormatter.ofPattern("MMMM dd, yyyy 'at' hh:mm a z");

    /**
     * Generate a PDF receipt for the given donation.
     *
     * @param donationId the donation ID
     * @return PDF content as byte array
     * @throws ResourceNotFoundException if donation not found
     */
    @Transactional(readOnly = true)
    public byte[] generateReceipt(String donationId) {
        Donation donation = donationRepository.findById(donationId)
                .orElseThrow(() -> new ResourceNotFoundException("Donation", donationId));

        return buildPdf(donation);
    }

    /**
     * Find a donation by ID and verify the donor email matches.
     *
     * @param donationId the donation ID
     * @param email      the email to verify against the donation's donorEmail
     * @return the Donation if email matches, null otherwise
     */
    @Transactional(readOnly = true)
    public Donation findAndVerifyDonation(String donationId, String email) {
        Donation donation = donationRepository.findById(donationId)
                .orElseThrow(() -> new ResourceNotFoundException("Donation", donationId));

        if (donation.getDonorEmail() == null || !donation.getDonorEmail().equalsIgnoreCase(email)) {
            return null;
        }
        return donation;
    }

    private byte[] buildPdf(Donation donation) {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();

        Document document = new Document(PageSize.A4, 50, 50, 50, 50);
        try {
            PdfWriter.getInstance(document, baos);
            document.open();

            String orgName = resolveOrgName();

            // -- Header: Organization name --
            Font orgFont = new Font(Font.HELVETICA, 20, Font.BOLD, new Color(55, 65, 81));
            Paragraph orgParagraph = new Paragraph(orgName, orgFont);
            orgParagraph.setAlignment(Element.ALIGN_CENTER);
            document.add(orgParagraph);

            document.add(Chunk.NEWLINE);

            // -- Title --
            Font titleFont = new Font(Font.HELVETICA, 16, Font.BOLD, new Color(79, 70, 229));
            Paragraph title = new Paragraph("Donation Receipt", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            document.add(title);

            document.add(Chunk.NEWLINE);

            // -- Separator line --
            LineSeparator separator = new LineSeparator();
            separator.setLineColor(new Color(209, 213, 219));
            document.add(new Chunk(separator));

            document.add(Chunk.NEWLINE);

            // -- Receipt details table --
            PdfPTable table = new PdfPTable(2);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{35f, 65f});
            table.setSpacingBefore(10f);
            table.setSpacingAfter(10f);

            Font labelFont = new Font(Font.HELVETICA, 11, Font.BOLD, new Color(107, 114, 128));
            Font valueFont = new Font(Font.HELVETICA, 11, Font.NORMAL, new Color(17, 24, 39));

            // Receipt No
            String receiptNo = "DON-" + donation.getId().substring(0, Math.min(8, donation.getId().length())).toUpperCase();
            addTableRow(table, "Receipt No:", receiptNo, labelFont, valueFont);

            // Date
            String dateStr = donation.getCreatedAt() != null
                    ? donation.getCreatedAt().atZone(ZoneId.of("UTC")).format(DATE_FORMATTER)
                    : "N/A";
            addTableRow(table, "Date:", dateStr, labelFont, valueFont);

            // Donor Name
            String donorName = donation.getDonorName() != null ? donation.getDonorName() : "Anonymous";
            addTableRow(table, "Donor Name:", donorName, labelFont, valueFont);

            // Donor Email
            if (donation.getDonorEmail() != null && !donation.getDonorEmail().isBlank()) {
                addTableRow(table, "Donor Email:", donation.getDonorEmail(), labelFont, valueFont);
            }

            // Amount
            String formattedAmount = formatCurrency(donation.getAmount(), donation.getCurrency());
            addTableRow(table, "Amount:", formattedAmount, labelFont, valueFont);

            // Campaign
            String campaignTitle = donation.getCampaign() != null
                    ? donation.getCampaign().getTitle() : "General Donation";
            addTableRow(table, "Campaign:", campaignTitle, labelFont, valueFont);

            // Payment Reference
            if (donation.getStripePaymentIntentId() != null && !donation.getStripePaymentIntentId().isBlank()) {
                addTableRow(table, "Payment Reference:", donation.getStripePaymentIntentId(), labelFont, valueFont);
            }

            // Status
            addTableRow(table, "Status:", donation.getStatus().name(), labelFont, valueFont);

            document.add(table);

            document.add(Chunk.NEWLINE);

            // -- 80G Registration line --
            LineSeparator separator2 = new LineSeparator();
            separator2.setLineColor(new Color(209, 213, 219));
            document.add(new Chunk(separator2));

            document.add(Chunk.NEWLINE);

            Font regFont = new Font(Font.HELVETICA, 10, Font.NORMAL, new Color(107, 114, 128));
            String regNumber = siteConfigService.getConfigValue("org.80g.registration");
            String regLine = (regNumber != null && !regNumber.isBlank())
                    ? "80G Registration No: " + regNumber
                    : "80G Registration No: [As per records]";
            Paragraph regParagraph = new Paragraph(regLine, regFont);
            regParagraph.setAlignment(Element.ALIGN_LEFT);
            document.add(regParagraph);

            document.add(Chunk.NEWLINE);

            // -- Footer --
            Font footerFont = new Font(Font.HELVETICA, 9, Font.ITALIC, new Color(156, 163, 175));
            Paragraph footer = new Paragraph(
                    "This receipt is computer-generated and does not require a signature.", footerFont);
            footer.setAlignment(Element.ALIGN_CENTER);
            document.add(footer);

            Paragraph thankYou = new Paragraph(
                    "Thank you for your generous contribution!", footerFont);
            thankYou.setAlignment(Element.ALIGN_CENTER);
            document.add(thankYou);

        } catch (DocumentException e) {
            log.error("Failed to generate PDF receipt for donation {}", donation.getId(), e);
            throw new RuntimeException("Failed to generate donation receipt PDF", e);
        } finally {
            document.close();
        }

        return baos.toByteArray();
    }

    private void addTableRow(PdfPTable table, String label, String value,
                             Font labelFont, Font valueFont) {
        PdfPCell labelCell = new PdfPCell(new Phrase(label, labelFont));
        labelCell.setBorder(Rectangle.NO_BORDER);
        labelCell.setPaddingBottom(8f);
        labelCell.setPaddingTop(8f);
        labelCell.setVerticalAlignment(Element.ALIGN_MIDDLE);

        PdfPCell valueCell = new PdfPCell(new Phrase(value, valueFont));
        valueCell.setBorder(Rectangle.NO_BORDER);
        valueCell.setPaddingBottom(8f);
        valueCell.setPaddingTop(8f);
        valueCell.setVerticalAlignment(Element.ALIGN_MIDDLE);

        table.addCell(labelCell);
        table.addCell(valueCell);
    }

    private String formatCurrency(Long amount, String currency) {
        double amountInUnits = amount / 100.0;
        String currencySymbol = switch (currency.toUpperCase()) {
            case "INR" -> "Rs.";
            case "USD" -> "$";
            case "EUR" -> "EUR ";
            case "GBP" -> "GBP ";
            default -> currency.toUpperCase() + " ";
        };
        return currencySymbol + String.format("%.2f", amountInUnits);
    }

    private String resolveOrgName() {
        String name = siteConfigService.getConfigValue("site.name");
        return (name != null && !name.isBlank()) ? name : defaultOrgName;
    }
}
