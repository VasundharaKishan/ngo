package com.myfoundation.school.auth;

import com.myfoundation.school.config.SiteConfigService;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.io.UnsupportedEncodingException;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;
    private final SiteConfigService siteConfigService;
    private final EmailTemplateService emailTemplateService;
    
    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;
    
    @Value("${app.mail.from-name}")
    private String fromName;
    
    @Value("${app.mail.reply-to}")
    private String replyTo;
    
    @Value("${app.mail.from.account-alerts}")
    private String fromAccountAlerts;
    
    @Value("${app.mail.from.donations}")
    private String fromDonations;
    
    @Value("${app.mail.from.support}")
    private String fromSupport;
    
    @Value("${app.mail.from.contact}")
    private String fromContact;
    
    @Value("${app.mail.from.system}")
    private String fromSystem;

    /** Returns the org name from admin settings, falling back to the mail from-name. */
    private String orgName() {
        String name = siteConfigService.getConfigValue("site.name");
        return (name != null && !name.isBlank()) ? name : fromName;
    }

    /** Returns the public contact email from admin settings, falling back to reply-to. */
    private String contactEmail() {
        String email = siteConfigService.getConfigValue("contact.email");
        return (email != null && !email.isBlank()) ? email : replyTo;
    }

    public void sendOtpEmail(String toEmail, String username, String code) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, false, "UTF-8");

            helper.setFrom(fromAccountAlerts, fromName);
            helper.setReplyTo(replyTo);
            helper.setTo(toEmail);
            helper.setSubject("Your verification code");

            String htmlContent = emailTemplateService.render("email/otp",
                    Map.of("username", username, "code", code));
            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("OTP email sent successfully to: {}", toEmail);
        } catch (MessagingException | UnsupportedEncodingException e) {
            log.error("Failed to send OTP email to: {}", toEmail, e);
            throw new RuntimeException("Failed to send email", e);
        }
    }
    
    public void sendPasswordSetupEmail(String toEmail, String username, String token) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromAccountAlerts, fromName);
            helper.setReplyTo(replyTo);
            helper.setTo(toEmail);
            helper.setSubject("Complete Your Account Setup - " + orgName());

            String setupLink = frontendUrl + "/admin/setup-password?token=" + token;

            String htmlContent = emailTemplateService.render("email/password-setup",
                    Map.of("username", username, "orgName", orgName(), "setupLink", setupLink));
            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("Password setup email sent successfully to: {}", toEmail);

        } catch (MessagingException | UnsupportedEncodingException e) {
            log.error("Failed to send password setup email to: {}", toEmail, e);
            throw new RuntimeException("Failed to send email", e);
        }
    }
    
    public void sendPasswordResetEmail(String toEmail, String username, String token) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromAccountAlerts, fromName);
            helper.setReplyTo(replyTo);
            helper.setTo(toEmail);
            helper.setSubject("Reset Your Password — " + orgName());

            String resetLink = frontendUrl + "/admin/reset-password?token=" + token;

            String htmlContent = emailTemplateService.render("email/password-reset",
                    Map.of("username", username, "orgName", orgName(), "resetLink", resetLink));
            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("Password reset email sent successfully to: {}", toEmail);

        } catch (MessagingException | UnsupportedEncodingException e) {
            log.error("Failed to send password reset email to: {}", toEmail, e);
            throw new RuntimeException("Failed to send email", e);
        }
    }

    /**
     * Send donation acknowledgement email to the donor.
     * This is the receipt/thank you email sent immediately after successful payment.
     */
    public void sendDonationAcknowledgement(
            String toEmail, 
            String donorName, 
            Long amount, 
            String currency, 
            String campaignTitle,
            String donationId,
            String donationDate) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            // Use donations@ or no-reply@ for outbound emails
            // Reply-To uses the configured replyTo address
            helper.setFrom(fromDonations, fromName);
            helper.setReplyTo(replyTo);
            helper.setTo(toEmail);
            helper.setSubject("Thank You for Your Generous Donation - " + orgName());
            
            String htmlContent = emailTemplateService.render("email/donation-acknowledgement",
                    Map.of(
                            "donorName", donorName,
                            "orgName", orgName(),
                            "formattedAmount", formatCurrency(amount, currency),
                            "campaignTitle", campaignTitle,
                            "donationDate", donationDate,
                            "donationId", donationId,
                            "contactEmail", contactEmail()
                    ));
            helper.setText(htmlContent, true);
            
            mailSender.send(message);
            log.info("Donation acknowledgement email sent successfully to: {}", toEmail);
            
        } catch (MessagingException | UnsupportedEncodingException e) {
            log.error("Failed to send donation acknowledgement email to: {}", toEmail, e);
            // Don't throw exception - we don't want email failure to break donation processing
        }
    }
    
    /**
     * Send donation notification email to admin.
     * This notifies the organization that a donation was received.
     */
    public void sendDonationNotificationToAdmin(
            String donorName,
            String donorEmail,
            Long amount,
            String currency,
            String campaignTitle,
            String donationId,
            String donationDate) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setFrom(fromSystem, fromName);
            String adminEmail = siteConfigService.getConfigValue("admin.notification.email");
            if (adminEmail == null || adminEmail.isBlank()) {
                adminEmail = contactEmail();
            }
            helper.setTo(adminEmail);
            helper.setSubject("New Donation Received - " + formatCurrency(amount, currency));
            
            String htmlContent = emailTemplateService.render("email/donation-admin-notification",
                    Map.of(
                            "formattedAmount", formatCurrency(amount, currency),
                            "donorName", donorName,
                            "donorEmail", donorEmail,
                            "campaignTitle", campaignTitle,
                            "donationDate", donationDate,
                            "donationId", donationId,
                            "currency", currency.toUpperCase(),
                            "orgName", orgName()
                    ));
            helper.setText(htmlContent, true);
            
            mailSender.send(message);
            log.info("Donation notification email sent successfully to admin");
            
        } catch (MessagingException | UnsupportedEncodingException e) {
            log.error("Failed to send donation notification email to admin", e);
            // Don't throw exception - we don't want email failure to break donation processing
        }
    }
    
    private String formatCurrency(Long amount, String currency) {
        double amountInUnits = amount / 100.0;
        String currencySymbol = switch (currency.toUpperCase()) {
            case "INR" -> "₹";
            case "USD" -> "$";
            case "EUR" -> "€";
            case "GBP" -> "£";
            default -> currency.toUpperCase() + " ";
        };
        return currencySymbol + String.format("%.2f", amountInUnits);
    }
    
    /**
     * Send refund notification email to the donor.
     */
    public void sendRefundNotificationEmail(
            String toEmail,
            String donorName,
            Long amount,
            String currency,
            String campaignName,
            String donationId) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromDonations, fromName);
            helper.setReplyTo(replyTo);
            helper.setTo(toEmail);
            helper.setSubject("Refund Processed — " + orgName());

            String htmlContent = emailTemplateService.render("email/refund-notification",
                    Map.of(
                            "donorName", donorName,
                            "formattedAmount", formatCurrency(amount, currency),
                            "campaignName", campaignName,
                            "donationId", donationId,
                            "contactEmail", contactEmail(),
                            "orgName", orgName()
                    ));
            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("Refund notification email sent successfully to: {}", toEmail);

        } catch (MessagingException | UnsupportedEncodingException e) {
            log.error("Failed to send refund notification email to: {}", toEmail, e);
            // Don't throw - email failure shouldn't block refund processing
        }
    }

    /**
     * Notify admin when a new contact-form submission arrives.
     * Never throws — email failure must not block the submission.
     */
    public void sendContactNotificationToAdmin(
            String senderName,
            String senderEmail,
            String subject,
            String message,
            Long submissionId) {
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, false, "UTF-8");

            helper.setFrom(fromSystem, fromName);
            String adminEmail = siteConfigService.getConfigValue("admin.notification.email");
            if (adminEmail == null || adminEmail.isBlank()) {
                adminEmail = replyTo; // fallback to reply-to address
            }
            helper.setTo(adminEmail);
            helper.setReplyTo(senderEmail); // reply goes directly to the visitor
            helper.setSubject("New contact message: " + truncate(subject, 60));

            String adminUrl = frontendUrl + "/admin/contact-submissions";
            String safeMessage = escapeHtml(message).replace("\n", "<br>");
            String htmlContent = emailTemplateService.render("email/contact-admin-notification",
                    Map.of(
                            "senderName", senderName,
                            "senderEmail", senderEmail,
                            "subject", subject,
                            "submissionId", submissionId,
                            "messageBody", safeMessage,
                            "adminUrl", adminUrl
                    ));
            helper.setText(htmlContent, true);

            mailSender.send(mimeMessage);
            log.info("Contact notification email sent to admin for submission id={}", submissionId);
        } catch (MessagingException | UnsupportedEncodingException e) {
            log.error("Failed to send contact notification email for submission id={}", submissionId, e);
            // Don't throw — email failure must not block the contact submission
        }
    }

    private static String escapeHtml(String input) {
        if (input == null) return "";
        return input
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }

    private static String truncate(String s, int max) {
        if (s == null || s.length() <= max) return s;
        return s.substring(0, max - 1) + "…";
    }

}
