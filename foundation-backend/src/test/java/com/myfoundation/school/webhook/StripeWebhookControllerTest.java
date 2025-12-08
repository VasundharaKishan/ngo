package com.myfoundation.school.webhook;

import com.myfoundation.school.config.StripeConfig;
import com.myfoundation.school.donation.DonationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(StripeWebhookController.class)
class StripeWebhookControllerTest {
    
    @Autowired
    private MockMvc mockMvc;
    
    @MockBean
    private DonationService donationService;
    
    @MockBean
    private StripeConfig stripeConfig;
    
    @BeforeEach
    void setUp() {
        when(stripeConfig.getWebhookSecret()).thenReturn("whsec_test_secret");
    }
    
    @Test
    void testWebhookEndpoint_MissingSignature() throws Exception {
        mockMvc.perform(post("/api/donations/stripe/webhook")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());
    }
    
    @Test
    void testWebhookEndpoint_WithSignature() throws Exception {
        // Note: In real tests, you would need to generate a valid Stripe signature
        // This is a simplified test to verify the endpoint is reachable
        mockMvc.perform(post("/api/donations/stripe/webhook")
                        .header("Stripe-Signature", "test-signature")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest()); // Will fail signature verification
    }
}
