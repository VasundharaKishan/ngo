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

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {
    
    private final JavaMailSender mailSender;
    private final SiteConfigService siteConfigService;
    
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

            String htmlContent = """
                <p>Hello %s,</p>
                <p>Your verification code is:</p>
                <h2 style="letter-spacing:4px;">%s</h2>
                <p>This code will expire in a few minutes. If you did not request it, you can ignore this email.</p>
                """.formatted(username, code);
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
            
            String htmlContent = buildPasswordSetupEmailHtml(username, setupLink);
            helper.setText(htmlContent, true);
            
            mailSender.send(message);
            log.info("Password setup email sent successfully to: {}", toEmail);
            
        } catch (MessagingException | UnsupportedEncodingException e) {
            log.error("Failed to send password setup email to: {}", toEmail, e);
            throw new RuntimeException("Failed to send email", e);
        }
    }
    
    private String buildPasswordSetupEmailHtml(String username, String setupLink) {
        String org = orgName();
        return """
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }
                    .button { display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%); color: white; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold; }
                    .info-box { background: white; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0; border-radius: 4px; }
                    .footer { text-align: center; color: #64748b; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>🎉 Welcome to %s!</h1>
                </div>
                <div class="content">
                    <p>Hello <strong>%s</strong>,</p>
                    <p>An administrator has created an account for you at %s Admin Portal. To complete your account setup, you need to:</p>
                    <div class="info-box">
                        <strong>📋 Setup Steps:</strong>
                        <ol>
                            <li>Create your secure password</li>
                            <li>Choose and answer security questions</li>
                        </ol>
                    </div>
                    <p>Click the button below to get started:</p>
                    <center><a href="%s" class="button">Complete Account Setup</a></center>
                    <p style="font-size: 14px; color: #64748b;"><strong>Note:</strong> This link will expire in 24 hours for security purposes.</p>
                    <p style="font-size: 14px; color: #64748b;">If you didn't expect this email, please contact your administrator immediately.</p>
                    <div class="footer">
                        <p>%s Admin Portal</p>
                        <p>Making a difference, one campaign at a time 💙</p>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(org, username, org, setupLink, org);
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

            String htmlContent = buildPasswordResetEmailHtml(username, resetLink);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("Password reset email sent successfully to: {}", toEmail);

        } catch (MessagingException | UnsupportedEncodingException e) {
            log.error("Failed to send password reset email to: {}", toEmail, e);
            throw new RuntimeException("Failed to send email", e);
        }
    }

    private String buildPasswordResetEmailHtml(String username, String resetLink) {
        String org = orgName();
        return """
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }
                    .button { display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%); color: white; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold; }
                    .info-box { background: white; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0; border-radius: 4px; }
                    .footer { text-align: center; color: #64748b; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>Reset Your Password</h1>
                </div>
                <div class="content">
                    <p>Hello <strong>%s</strong>,</p>
                    <p>We received a request to reset your password. Click the button below to set a new password.</p>
                    <center><a href="%s" class="button">Reset Password</a></center>
                    <div class="info-box">
                        <strong>This link expires in 24 hours.</strong>
                        <p style="margin: 10px 0 0 0;">If you didn't request this, you can safely ignore this email. Your password will remain unchanged.</p>
                    </div>
                    <div class="footer">
                        <p>%s Admin Portal</p>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(username, resetLink, org);
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
            
            String htmlContent = buildDonationAcknowledgementHtml(
                donorName, amount, currency, campaignTitle, donationId, donationDate
            );
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
            
            String htmlContent = buildAdminNotificationHtml(
                donorName, donorEmail, amount, currency, campaignTitle, donationId, donationDate
            );
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
    
    private String buildDonationAcknowledgementHtml(
            String donorName,
            Long amount,
            String currency,
            String campaignTitle,
            String donationId,
            String donationDate) {

        String formattedAmount = formatCurrency(amount, currency);
        String org = orgName();
        String contact = contactEmail();
        String logoUrl = frontendUrl + "/logo.png";
        
        return """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body {
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        line-height: 1.6;
                        color: #333;
                        max-width: 600px;
                        margin: 0 auto;
                        padding: 0;
                        background-color: #f5f5f5;
                    }
                    .email-container {
                        background-color: white;
                        margin: 20px auto;
                        border-radius: 12px;
                        overflow: hidden;
                        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    }
                    .header {
                        background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%);
                        color: white;
                        padding: 40px 30px;
                        text-align: center;
                    }
                    .logo {
                        max-width: 120px;
                        margin-bottom: 20px;
                    }
                    .header h1 {
                        margin: 0;
                        font-size: 28px;
                        font-weight: 600;
                    }
                    .content {
                        padding: 40px 30px;
                    }
                    .donation-card {
                        background: linear-gradient(135deg, #f8f9ff 0%%, #f0f2ff 100%%);
                        padding: 25px;
                        border-radius: 10px;
                        margin: 25px 0;
                        border-left: 5px solid #667eea;
                    }
                    .amount {
                        font-size: 32px;
                        font-weight: bold;
                        color: #667eea;
                        margin: 10px 0;
                    }
                    .detail-row {
                        display: flex;
                        justify-content: space-between;
                        padding: 12px 0;
                        border-bottom: 1px solid #e5e7eb;
                    }
                    .detail-row:last-child {
                        border-bottom: none;
                    }
                    .detail-label {
                        color: #6b7280;
                        font-weight: 500;
                    }
                    .detail-value {
                        color: #111827;
                        font-weight: 600;
                    }
                    .message-box {
                        background: #fef3c7;
                        border-left: 4px solid #f59e0b;
                        padding: 20px;
                        margin: 25px 0;
                        border-radius: 6px;
                    }
                    .footer {
                        background: #f9fafb;
                        padding: 30px;
                        text-align: center;
                        color: #6b7280;
                        font-size: 14px;
                    }
                    .footer a {
                        color: #667eea;
                        text-decoration: none;
                    }
                    .social-links {
                        margin: 20px 0;
                    }
                    .social-links a {
                        display: inline-block;
                        margin: 0 8px;
                        color: #667eea;
                        text-decoration: none;
                    }
                    @media only screen and (max-width: 600px) {
                        .content {
                            padding: 30px 20px;
                        }
                        .donation-card {
                            padding: 20px;
                        }
                        .amount {
                            font-size: 28px;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="email-container">
                    <div class="header">
                        <h1>🙏 Thank You for Your Donation!</h1>
                        <p style="margin: 10px 0 0 0; opacity: 0.95;">Your generosity makes a difference</p>
                    </div>
                    
                    <div class="content">
                        <p style="font-size: 18px; margin-bottom: 10px;">Dear <strong>%s</strong>,</p>
                        
                        <p>We are deeply grateful for your generous donation to <strong>%s</strong>. Your support enables us to continue our mission and make a positive impact in our community.</p>
                        
                        <div class="donation-card">
                            <div style="text-align: center; margin-bottom: 20px;">
                                <div style="color: #6b7280; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Donation Amount</div>
                                <div class="amount">%s</div>
                            </div>
                            
                            <div class="detail-row">
                                <span class="detail-label">Campaign</span>
                                <span class="detail-value">%s</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Date</span>
                                <span class="detail-value">%s</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Transaction ID</span>
                                <span class="detail-value">%s</span>
                            </div>
                        </div>
                        
                        <div class="message-box">
                            <strong>📧 Keep this email for your records</strong>
                            <p style="margin: 10px 0 0 0;">This serves as your official donation receipt. Please save it for tax purposes if applicable.</p>
                        </div>
                        
                        <p>Your donation will be used to support our programs and initiatives. We will keep you updated on the impact of your contribution.</p>
                        
                        <p style="margin-top: 30px;">
                            If you have any questions or would like to learn more about our work, please don't hesitate to reach out to us at 
                            <a href="mailto:%s" style="color: #667eea;">%s</a>
                        </p>

                        <p style="margin-top: 30px; font-size: 18px; font-weight: 600; color: #667eea;">
                            With heartfelt gratitude,<br>
                            <span style="color: #333;">The %s Team</span>
                        </p>
                    </div>

                    <div class="footer">
                        <p><strong>%s</strong></p>
                        <p>Empowering communities through compassion and action</p>

                        <p style="margin-top: 20px; font-size: 12px; color: #9ca3af;">
                            This is an automated message. Please do not reply to this email.<br>
                            For inquiries, contact us at <a href="mailto:%s">%s</a>
                        </p>

                        <p style="margin-top: 20px; font-size: 12px; color: #9ca3af;">
                            © 2025 %s. All rights reserved.
                        </p>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(donorName, formattedAmount, campaignTitle, donationDate, donationId,
                          org, contact, contact, org, contact, org, org, contact, contact, org);
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

            String htmlContent = buildRefundNotificationHtml(donorName, amount, currency, campaignName, donationId);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("Refund notification email sent successfully to: {}", toEmail);

        } catch (MessagingException | UnsupportedEncodingException e) {
            log.error("Failed to send refund notification email to: {}", toEmail, e);
            // Don't throw - email failure shouldn't block refund processing
        }
    }

    private String buildRefundNotificationHtml(
            String donorName,
            Long amount,
            String currency,
            String campaignName,
            String donationId) {

        String formattedAmount = formatCurrency(amount, currency);
        String org = orgName();
        String contact = contactEmail();

        return """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body {
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        line-height: 1.6;
                        color: #333;
                        max-width: 600px;
                        margin: 0 auto;
                        padding: 0;
                        background-color: #f5f5f5;
                    }
                    .email-container {
                        background-color: white;
                        margin: 20px auto;
                        border-radius: 12px;
                        overflow: hidden;
                        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    }
                    .header {
                        background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%);
                        color: white;
                        padding: 40px 30px;
                        text-align: center;
                    }
                    .header h1 {
                        margin: 0;
                        font-size: 28px;
                        font-weight: 600;
                    }
                    .content {
                        padding: 40px 30px;
                    }
                    .refund-card {
                        background: linear-gradient(135deg, #fff7ed 0%%, #ffedd5 100%%);
                        padding: 25px;
                        border-radius: 10px;
                        margin: 25px 0;
                        border-left: 5px solid #f59e0b;
                    }
                    .amount {
                        font-size: 32px;
                        font-weight: bold;
                        color: #f59e0b;
                        margin: 10px 0;
                    }
                    .detail-row {
                        display: flex;
                        justify-content: space-between;
                        padding: 12px 0;
                        border-bottom: 1px solid #e5e7eb;
                    }
                    .detail-row:last-child {
                        border-bottom: none;
                    }
                    .detail-label {
                        color: #6b7280;
                        font-weight: 500;
                    }
                    .detail-value {
                        color: #111827;
                        font-weight: 600;
                    }
                    .info-box {
                        background: #eff6ff;
                        border-left: 4px solid #3b82f6;
                        padding: 20px;
                        margin: 25px 0;
                        border-radius: 6px;
                    }
                    .footer {
                        background: #f9fafb;
                        padding: 30px;
                        text-align: center;
                        color: #6b7280;
                        font-size: 14px;
                    }
                    .footer a {
                        color: #667eea;
                        text-decoration: none;
                    }
                </style>
            </head>
            <body>
                <div class="email-container">
                    <div class="header">
                        <h1>Refund Processed</h1>
                        <p style="margin: 10px 0 0 0; opacity: 0.95;">Your refund has been initiated</p>
                    </div>

                    <div class="content">
                        <p style="font-size: 18px; margin-bottom: 10px;">Dear <strong>%s</strong>,</p>

                        <p>Your donation of <strong>%s</strong> to <strong>%s</strong> has been refunded. The refund should appear in your account within 5-10 business days.</p>

                        <div class="refund-card">
                            <div style="text-align: center; margin-bottom: 20px;">
                                <div style="color: #6b7280; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Refund Amount</div>
                                <div class="amount">%s</div>
                            </div>

                            <div class="detail-row">
                                <span class="detail-label">Campaign</span>
                                <span class="detail-value">%s</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Donation ID</span>
                                <span class="detail-value">%s</span>
                            </div>
                        </div>

                        <div class="info-box">
                            <strong>Please note:</strong>
                            <p style="margin: 10px 0 0 0;">Refunds typically take 5-10 business days to appear on your statement, depending on your bank or card issuer.</p>
                        </div>

                        <p>If you have any questions about this refund, please contact us at
                            <a href="mailto:%s" style="color: #667eea;">%s</a>.
                        </p>

                        <p style="margin-top: 30px;">
                            Best regards,<br>
                            <span style="font-weight: 600; color: #667eea;">The %s Team</span>
                        </p>
                    </div>

                    <div class="footer">
                        <p><strong>%s</strong></p>
                        <p style="margin-top: 15px; font-size: 12px; color: #9ca3af;">
                            This is an automated message. Please do not reply to this email.<br>
                            For inquiries, contact us at <a href="mailto:%s">%s</a>
                        </p>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(
                donorName, formattedAmount, campaignName,
                formattedAmount, campaignName, donationId,
                contact, contact, org, org, contact, contact
            );
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
            String htmlContent = buildContactNotificationHtml(
                    senderName, senderEmail, subject, message, submissionId, adminUrl);
            helper.setText(htmlContent, true);

            mailSender.send(mimeMessage);
            log.info("Contact notification email sent to admin for submission id={}", submissionId);
        } catch (MessagingException | UnsupportedEncodingException e) {
            log.error("Failed to send contact notification email for submission id={}", submissionId, e);
            // Don't throw — email failure must not block the contact submission
        }
    }

    private String buildContactNotificationHtml(
            String senderName,
            String senderEmail,
            String subject,
            String message,
            Long submissionId,
            String adminUrl) {
        // Escape HTML in user-supplied fields to prevent injection
        String safeName = escapeHtml(senderName);
        String safeEmail = escapeHtml(senderEmail);
        String safeSubject = escapeHtml(subject);
        String safeMessage = escapeHtml(message).replace("\n", "<br>");

        return """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333;
                           max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5; }
                    .container { background: white; border-radius: 8px; padding: 30px;
                                 box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
                    .header { background: linear-gradient(135deg, #1e3a8a 0%%, #312e81 100%%);
                              color: white; padding: 20px; border-radius: 6px; margin-bottom: 20px; }
                    .header h2 { margin: 0; font-size: 20px; }
                    .info td { padding: 10px 12px; border-bottom: 1px solid #e5e7eb; }
                    .info td:first-child { font-weight: 600; color: #6b7280; width: 100px; }
                    .message-box { background: #f8fafc; border-left: 4px solid #1e3a8a;
                                   padding: 15px 18px; margin: 20px 0; border-radius: 4px;
                                   font-size: 15px; line-height: 1.65; color: #1e293b; }
                    .btn { display: inline-block; padding: 12px 24px; background: #1e3a8a;
                           color: white; text-decoration: none; border-radius: 6px;
                           font-weight: 600; font-size: 14px; }
                    .footer { margin-top: 25px; padding-top: 15px; border-top: 1px solid #e5e7eb;
                              font-size: 13px; color: #6b7280; text-align: center; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h2>New contact message</h2>
                        <p style="margin:5px 0 0;opacity:0.9;font-size:14px;">
                            Someone submitted the contact form on your website
                        </p>
                    </div>
                    <table class="info" style="width:100%%;border-collapse:collapse;">
                        <tr><td>From</td><td><strong>%s</strong></td></tr>
                        <tr><td>Email</td><td><a href="mailto:%s">%s</a></td></tr>
                        <tr><td>Subject</td><td><strong>%s</strong></td></tr>
                        <tr><td>ID</td><td>#%d</td></tr>
                    </table>
                    <div class="message-box">%s</div>
                    <p style="text-align:center;margin:25px 0 10px;">
                        <a href="%s" class="btn">View in admin panel</a>
                    </p>
                    <p style="text-align:center;font-size:13px;color:#64748b;">
                        You can reply directly to this email — it will go to <strong>%s</strong>.
                    </p>
                    <div class="footer">
                        <p>Automated notification from your website contact form.</p>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(safeName, safeEmail, safeEmail, safeSubject, submissionId, safeMessage, adminUrl, safeEmail);
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

    private String buildAdminNotificationHtml(
            String donorName,
            String donorEmail,
            Long amount,
            String currency,
            String campaignTitle,
            String donationId,
            String donationDate) {
        
        String formattedAmount = formatCurrency(amount, currency);
        String org = orgName();

        return """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        line-height: 1.6;
                        color: #333;
                        max-width: 600px;
                        margin: 0 auto;
                        padding: 20px;
                        background-color: #f5f5f5;
                    }
                    .email-container {
                        background-color: white;
                        border-radius: 8px;
                        padding: 30px;
                        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                    }
                    .header {
                        background: linear-gradient(135deg, #10b981 0%%, #059669 100%%);
                        color: white;
                        padding: 20px;
                        border-radius: 6px;
                        margin-bottom: 20px;
                    }
                    .header h2 {
                        margin: 0;
                        font-size: 24px;
                    }
                    .amount-highlight {
                        font-size: 32px;
                        font-weight: bold;
                        color: #10b981;
                        text-align: center;
                        padding: 20px 0;
                        margin: 20px 0;
                        background: #f0fdf4;
                        border-radius: 6px;
                    }
                    .info-table {
                        width: 100%%;
                        border-collapse: collapse;
                        margin: 20px 0;
                    }
                    .info-table td {
                        padding: 12px;
                        border-bottom: 1px solid #e5e7eb;
                    }
                    .info-table td:first-child {
                        font-weight: 600;
                        color: #6b7280;
                        width: 140px;
                    }
                    .footer {
                        margin-top: 30px;
                        padding-top: 20px;
                        border-top: 1px solid #e5e7eb;
                        font-size: 14px;
                        color: #6b7280;
                        text-align: center;
                    }
                </style>
            </head>
            <body>
                <div class="email-container">
                    <div class="header">
                        <h2>💰 New Donation Received</h2>
                        <p style="margin: 5px 0 0 0; opacity: 0.9;">You have received a new donation on your platform</p>
                    </div>
                    
                    <div class="amount-highlight">
                        %s
                    </div>
                    
                    <table class="info-table">
                        <tr>
                            <td>Donor Name</td>
                            <td><strong>%s</strong></td>
                        </tr>
                        <tr>
                            <td>Donor Email</td>
                            <td><a href="mailto:%s">%s</a></td>
                        </tr>
                        <tr>
                            <td>Campaign</td>
                            <td><strong>%s</strong></td>
                        </tr>
                        <tr>
                            <td>Date & Time</td>
                            <td>%s</td>
                        </tr>
                        <tr>
                            <td>Transaction ID</td>
                            <td><code>%s</code></td>
                        </tr>
                        <tr>
                            <td>Currency</td>
                            <td>%s</td>
                        </tr>
                    </table>
                    
                    <p style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 4px; margin: 20px 0;">
                        <strong>📝 Action Required:</strong> A thank-you email has been automatically sent to the donor. You may want to follow up personally for larger donations.
                    </p>
                    
                    <div class="footer">
                        <p>This is an automated notification from your donation platform.</p>
                        <p>%s Admin Dashboard</p>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(
                formattedAmount,
                donorName,
                donorEmail, donorEmail,
                campaignTitle,
                donationDate,
                donationId,
                currency.toUpperCase(),
                org
            );
    }
}
