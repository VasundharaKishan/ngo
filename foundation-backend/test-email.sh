#!/bin/bash
# Simple script to test email sending

cd "$(dirname "$0")"

# Create a test class to send email
cat > src/test/java/com/myfoundation/school/TestEmailSending.java << 'EOF'
package com.myfoundation.school;

import com.myfoundation.school.auth.EmailService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
public class TestEmailSending {

    @Autowired
    private EmailService emailService;

    @Test
    void sendTestOtpEmail() {
        System.out.println("=".repeat(60));
        System.out.println("SENDING TEST OTP EMAIL...");
        System.out.println("=".repeat(60));
        
        try {
            emailService.sendOtpEmail(
                "yugalsavitriseva@gmail.com", 
                "Test User", 
                "123456"
            );
            System.out.println("✅ OTP EMAIL SENT SUCCESSFULLY!");
            System.out.println("Check yugalsavitriseva@gmail.com inbox");
        } catch (Exception e) {
            System.out.println("❌ EMAIL FAILED: " + e.getMessage());
            e.printStackTrace();
        }
        
        System.out.println("=".repeat(60));
    }

    @Test
    void sendTestDonationEmail() {
        System.out.println("=".repeat(60));
        System.out.println("SENDING TEST DONATION EMAIL...");
        System.out.println("=".repeat(60));
        
        try {
            emailService.sendDonationAcknowledgement(
                "yugalsavitriseva@gmail.com",
                "Test Donor",
                5000L, // $50.00
                "usd",
                "Test Campaign",
                "test-donation-123",
                "January 9, 2026"
            );
            System.out.println("✅ DONATION EMAIL SENT SUCCESSFULLY!");
            System.out.println("Check yugalsavitriseva@gmail.com inbox");
        } catch (Exception e) {
            System.out.println("❌ EMAIL FAILED: " + e.getMessage());
            e.printStackTrace();
        }
        
        System.out.println("=".repeat(60));
    }
}
EOF

echo ""
echo "================================================"
echo "Testing Email Sending..."
echo "================================================"
echo ""

# Run the test
mvn test -Dtest=TestEmailSending#sendTestOtpEmail 2>&1 | grep -A 20 "SENDING TEST"

echo ""
echo "================================================"
echo "If you see ✅ above, check yugalsavitriseva@gmail.com"
echo "================================================"
