package com.myfoundation.school.auth;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {
    
    private final JavaMailSender mailSender;
    
    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;
    
    @Value("${spring.mail.username}")
    private String fromEmail;
    
    public void sendOtpEmail(String toEmail, String username, String code) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, false, "UTF-8");

            helper.setFrom(fromEmail);
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
        } catch (MessagingException e) {
            log.error("Failed to send OTP email to: {}", toEmail, e);
            throw new RuntimeException("Failed to send email", e);
        }
    }
    
    public void sendPasswordSetupEmail(String toEmail, String username, String token) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("Complete Your Account Setup - Hope Foundation");
            
            String setupLink = frontendUrl + "/admin/setup-password?token=" + token;
            
            String htmlContent = buildPasswordSetupEmailHtml(username, setupLink);
            helper.setText(htmlContent, true);
            
            mailSender.send(message);
            log.info("Password setup email sent successfully to: {}", toEmail);
            
        } catch (MessagingException e) {
            log.error("Failed to send password setup email to: {}", toEmail, e);
            throw new RuntimeException("Failed to send email", e);
        }
    }
    
    private String buildPasswordSetupEmailHtml(String username, String setupLink) {
        return """
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        line-height: 1.6;
                        color: #333;
                        max-width: 600px;
                        margin: 0 auto;
                        padding: 20px;
                    }
                    .header {
                        background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%);
                        color: white;
                        padding: 30px;
                        text-align: center;
                        border-radius: 10px 10px 0 0;
                    }
                    .content {
                        background: #f8fafc;
                        padding: 30px;
                        border-radius: 0 0 10px 10px;
                    }
                    .button {
                        display: inline-block;
                        padding: 15px 30px;
                        background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%);
                        color: white;
                        text-decoration: none;
                        border-radius: 8px;
                        margin: 20px 0;
                        font-weight: bold;
                    }
                    .info-box {
                        background: white;
                        padding: 20px;
                        border-left: 4px solid #667eea;
                        margin: 20px 0;
                        border-radius: 4px;
                    }
                    .footer {
                        text-align: center;
                        color: #64748b;
                        font-size: 14px;
                        margin-top: 30px;
                        padding-top: 20px;
                        border-top: 1px solid #e2e8f0;
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>🎉 Welcome to Hope Foundation!</h1>
                </div>
                <div class="content">
                    <p>Hello <strong>%s</strong>,</p>
                    
                    <p>An administrator has created an account for you at Hope Foundation Admin Portal. To complete your account setup, you need to:</p>
                    
                    <div class="info-box">
                        <strong>📋 Setup Steps:</strong>
                        <ol>
                            <li>Create your secure password</li>
                            <li>Choose and answer security questions</li>
                        </ol>
                    </div>
                    
                    <p>Click the button below to get started:</p>
                    
                    <center>
                        <a href="%s" class="button">Complete Account Setup</a>
                    </center>
                    
                    <p style="font-size: 14px; color: #64748b;">
                        <strong>Note:</strong> This link will expire in 24 hours for security purposes.
                    </p>
                    
                    <p style="font-size: 14px; color: #64748b;">
                        If you didn't expect this email, please contact your administrator immediately.
                    </p>
                    
                    <div class="footer">
                        <p>Hope Foundation Admin Portal</p>
                        <p>Making a difference, one campaign at a time 💙</p>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(username, setupLink);
    }
}
