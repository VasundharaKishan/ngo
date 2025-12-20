package com.myfoundation.school.webhook;

import com.myfoundation.school.config.StripeConfig;
import com.myfoundation.school.donation.DonationService;
import com.stripe.model.Event;
import com.stripe.model.EventDataObjectDeserializer;
import com.stripe.model.checkout.Session;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class StripeWebhookControllerTest {

    @Mock
    private DonationService donationService;

    @Mock
    private StripeConfig stripeConfig;

    @InjectMocks
    private StripeWebhookController webhookController;

    private String testWebhookSecret = "whsec_test123";

    @BeforeEach
    void setUp() {
        when(stripeConfig.getWebhookSecret()).thenReturn(testWebhookSecret);
    }

    /**
     * Test: checkout.session.completed with payment_status="paid" should mark donation as SUCCESS
     */
    @Test
    void testCheckoutSessionCompleted_WithPaidStatus_MarksDonationSuccess() throws Exception {
        // Arrange
        String donationId = "donation123";
        String paymentIntentId = "pi_test123";
        Event event = createMockEvent("checkout.session.completed", donationId, "paid", paymentIntentId);

        // Act
        ReflectionTestUtils.invokeMethod(webhookController, "handleCheckoutSessionCompleted", event);

        // Assert
        verify(donationService, times(1)).markDonationSuccessFromStripe(donationId, paymentIntentId);
    }

    /**
     * Test: checkout.session.completed with payment_status="unpaid" should NOT mark donation as SUCCESS
     * (donation remains PENDING, waiting for async_payment_succeeded webhook)
     */
    @Test
    void testCheckoutSessionCompleted_WithUnpaidStatus_DoesNotMarkDonationSuccess() throws Exception {
        // Arrange
        String donationId = "donation456";
        Event event = createMockEvent("checkout.session.completed", donationId, "unpaid", null);

        // Act
        ReflectionTestUtils.invokeMethod(webhookController, "handleCheckoutSessionCompleted", event);

        // Assert
        verify(donationService, never()).markDonationSuccessFromStripe(anyString(), anyString());
        verify(donationService, never()).markDonationFailed(anyString());
    }

    /**
     * Test: checkout.session.completed with payment_status="no_payment_required" should mark donation as SUCCESS
     */
    @Test
    void testCheckoutSessionCompleted_WithNoPaymentRequired_MarksDonationSuccess() throws Exception {
        // Arrange
        String donationId = "donation789";
        String paymentIntentId = "pi_test789";
        Event event = createMockEvent("checkout.session.completed", donationId, "no_payment_required", paymentIntentId);

        // Act
        ReflectionTestUtils.invokeMethod(webhookController, "handleCheckoutSessionCompleted", event);

        // Assert
        verify(donationService, times(1)).markDonationSuccessFromStripe(donationId, paymentIntentId);
    }

    /**
     * Test: checkout.session.async_payment_succeeded should mark donation as SUCCESS
     */
    @Test
    void testAsyncPaymentSucceeded_MarksDonationSuccess() throws Exception {
        // Arrange
        String donationId = "donation_async123";
        String paymentIntentId = "pi_async123";
        Event event = createMockEvent("checkout.session.async_payment_succeeded", donationId, "paid", paymentIntentId);

        // Act
        ReflectionTestUtils.invokeMethod(webhookController, "handleAsyncPaymentSucceeded", event);

        // Assert
        verify(donationService, times(1)).markDonationSuccessFromStripe(donationId, paymentIntentId);
    }

    /**
     * Test: checkout.session.async_payment_failed should mark donation as FAILED
     */
    @Test
    void testAsyncPaymentFailed_MarksDonationFailed() throws Exception {
        // Arrange
        String donationId = "donation_async_failed";
        Event event = createMockEvent("checkout.session.async_payment_failed", donationId, "unpaid", null);

        // Act
        ReflectionTestUtils.invokeMethod(webhookController, "handleAsyncPaymentFailed", event);

        // Assert
        verify(donationService, times(1)).markDonationFailed(donationId);
    }

    /**
     * Test: checkout.session.expired should mark donation as FAILED
     */
    @Test
    void testCheckoutSessionExpired_MarksDonationFailed() throws Exception {
        // Arrange
        String donationId = "donation_expired";
        Event event = createMockEvent("checkout.session.expired", donationId, null, null);

        // Act
        ReflectionTestUtils.invokeMethod(webhookController, "handleCheckoutSessionExpired", event);

        // Assert
        verify(donationService, times(1)).markDonationFailed(donationId);
    }

    /**
     * Test: webhook with null donationId metadata should not update donation
     */
    @Test
    void testCheckoutSessionCompleted_WithNullDonationId_DoesNotUpdateDonation() throws Exception {
        // Arrange
        Event event = createMockEvent("checkout.session.completed", null, "paid", "pi_test");

        // Act
        ReflectionTestUtils.invokeMethod(webhookController, "handleCheckoutSessionCompleted", event);

        // Assert
        verify(donationService, never()).markDonationSuccessFromStripe(anyString(), anyString());
    }

    /**
     * Test: idempotency - calling markDonationSuccessFromStripe multiple times should be safe
     * (This test verifies the controller calls the service method, which has idempotency checks)
     */
    @Test
    void testIdempotency_MultipleSuccessWebhooks_CallsServiceMultipleTimes() throws Exception {
        // Arrange
        String donationId = "donation_idempotent";
        String paymentIntentId = "pi_idempotent";
        Event event = createMockEvent("checkout.session.completed", donationId, "paid", paymentIntentId);

        // Act - send same webhook twice
        ReflectionTestUtils.invokeMethod(webhookController, "handleCheckoutSessionCompleted", event);
        ReflectionTestUtils.invokeMethod(webhookController, "handleCheckoutSessionCompleted", event);

        // Assert - service should be called twice (idempotency is handled in service layer)
        verify(donationService, times(2)).markDonationSuccessFromStripe(donationId, paymentIntentId);
    }

    /**
     * Test: service exception should be caught and logged
     */
    @Test
    void testCheckoutSessionCompleted_ServiceThrowsException_ExceptionIsCaught() throws Exception {
        // Arrange
        String donationId = "donation_error";
        String paymentIntentId = "pi_error";
        Event event = createMockEvent("checkout.session.completed", donationId, "paid", paymentIntentId);
        
        doThrow(new RuntimeException("Database error"))
            .when(donationService).markDonationSuccessFromStripe(donationId, paymentIntentId);

        // Act & Assert - should not throw exception
        assertDoesNotThrow(() -> 
            ReflectionTestUtils.invokeMethod(webhookController, "handleCheckoutSessionCompleted", event)
        );
    }

    /**
     * Helper method to create a mock Stripe Event with Session data
     */
    private Event createMockEvent(String eventType, String donationId, String paymentStatus, String paymentIntentId) {
        Event event = mock(Event.class);
        Session session = mock(Session.class);
        Event.Data data = mock(Event.Data.class);
        EventDataObjectDeserializer deserializer = mock(EventDataObjectDeserializer.class);

        // Mock metadata
        Map<String, String> metadata = new HashMap<>();
        if (donationId != null) {
            metadata.put("donationId", donationId);
        }
        metadata.put("campaignId", "campaign123");

        // Configure mock behavior
        when(event.getType()).thenReturn(eventType);
        when(event.getId()).thenReturn("evt_test_" + System.currentTimeMillis());
        when(event.getData()).thenReturn(data);
        when(event.getDataObjectDeserializer()).thenReturn(deserializer);
        when(deserializer.getObject()).thenReturn(java.util.Optional.of(session));
        
        when(session.getId()).thenReturn("cs_test_" + System.currentTimeMillis());
        when(session.getPaymentStatus()).thenReturn(paymentStatus);
        when(session.getPaymentIntent()).thenReturn(paymentIntentId);
        when(session.getMetadata()).thenReturn(metadata);
        when(session.getStatus()).thenReturn("complete");

        return event;
    }
}

