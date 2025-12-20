# Stripe Webhook Fix - Implementation Summary

## Problem

Donations were showing as PENDING in the admin dashboard even after successful Stripe payments, especially for asynchronous payment methods (Klarna, Bancontact, EPS, Revolut Pay, Amazon Pay).

### Root Cause

The `StripeWebhookController` was unconditionally marking all donations as SUCCESS when receiving the `checkout.session.completed` webhook, without checking the `payment_status` field. For async payment methods, Stripe fires this webhook with `payment_status="unpaid"` immediately after checkout, then fires separate webhooks (`checkout.session.async_payment_succeeded` or `checkout.session.async_payment_failed`) when the actual payment completes.

## Solution Implemented

### 1. Fixed `handleCheckoutSessionCompleted()` Method

**Location**: `foundation-backend/src/main/java/com/myfoundation/school/webhook/StripeWebhookController.java` (Lines 69-108)

**Changes**:
- Added payment_status check before marking donation as SUCCESS
- Only marks SUCCESS if `payment_status="paid"` or `payment_status="no_payment_required"` 
- Leaves donation as PENDING if `payment_status="unpaid"` (async payment in progress)
- Added detailed structured logging for debugging

**Code Flow**:
```java
if ("paid".equals(paymentStatus) || "no_payment_required".equals(paymentStatus)) {
    // Immediate payment success (card, Link, etc.)
    donationService.markDonationSuccessFromStripe(donationId, paymentIntentId);
} else {
    // Async payment pending - awaiting async_payment_succeeded webhook
    // Donation remains PENDING - no action needed
}
```

### 2. Added `handleAsyncPaymentSucceeded()` Method

**Location**: `foundation-backend/src/main/java/com/myfoundation/school/webhook/StripeWebhookController.java` (Lines 110-145)

**Purpose**: Handles the `checkout.session.async_payment_succeeded` webhook event

**Behavior**:
- Fired by Stripe when async payment completes successfully
- Verifies `payment_status="paid"` before marking SUCCESS
- Uses existing `markDonationSuccessFromStripe()` method with idempotency protection
- Logs payment_intent ID, session ID, and donation ID for traceability

### 3. Added `handleAsyncPaymentFailed()` Method

**Location**: `foundation-backend/src/main/java/com/myfoundation/school/webhook/StripeWebhookController.java` (Lines 147-175)

**Purpose**: Handles the `checkout.session.async_payment_failed` webhook event

**Behavior**:
- Fired by Stripe when async payment fails (customer cancels, bank rejects, etc.)
- Marks donation as FAILED
- Uses existing `markDonationFailed()` method with idempotency protection

### 4. Updated Webhook Event Switch Statement

**Location**: `foundation-backend/src/main/java/com/myfoundation/school/webhook/StripeWebhookController.java` (Lines 48-62)

**Changes**: Added two new event handlers
```java
case "checkout.session.async_payment_succeeded":
    handleAsyncPaymentSucceeded(event);
    break;
case "checkout.session.async_payment_failed":
    handleAsyncPaymentFailed(event);
    break;
```

### 5. Enhanced Logging Throughout

**All webhook handlers now log**:
- Event type
- Session ID
- Payment status
- Payment intent ID
- Donation ID from metadata
- Campaign ID from metadata
- Action taken (mark SUCCESS, mark FAILED, or leave PENDING)
- Success/failure of database update

**Example log output**:
```
[Webhook] checkout.session.completed - sessionId: cs_test_abc123, payment_status: unpaid, payment_intent: pi_xyz789
[Webhook] Session metadata - donationId: don_456, campaignId: camp_789
[Webhook] Checkout completed but payment_status='unpaid' (unpaid) for donation don_456. Payment is async - awaiting checkout.session.async_payment_succeeded webhook
```

### 6. Improved `handleCheckoutSessionExpired()` Method

**Location**: `foundation-backend/src/main/java/com/myfoundation/school/webhook/StripeWebhookController.java` (Lines 177-206)

**Changes**: Enhanced logging consistency to match other handlers

## Testing

### Comprehensive Unit Tests Created

**Location**: `foundation-backend/src/test/java/com/myfoundation/school/webhook/StripeWebhookControllerTest.java`

**Test Coverage** (9 tests, all passing):

1. ✅ `testCheckoutSessionCompleted_WithPaidStatus_MarksDonationSuccess`
   - Verifies immediate payment (card) marks SUCCESS

2. ✅ `testCheckoutSessionCompleted_WithUnpaidStatus_DoesNotMarkDonationSuccess`
   - Verifies async payment leaves donation PENDING

3. ✅ `testCheckoutSessionCompleted_WithNoPaymentRequired_MarksDonationSuccess`
   - Verifies zero-amount donations mark SUCCESS

4. ✅ `testAsyncPaymentSucceeded_MarksDonationSuccess`
   - Verifies async_payment_succeeded webhook marks SUCCESS

5. ✅ `testAsyncPaymentFailed_MarksDonationFailed`
   - Verifies async_payment_failed webhook marks FAILED

6. ✅ `testCheckoutSessionExpired_MarksDonationFailed`
   - Verifies expired sessions mark FAILED

7. ✅ `testCheckoutSessionCompleted_WithNullDonationId_DoesNotUpdateDonation`
   - Verifies null metadata is handled gracefully

8. ✅ `testIdempotency_MultipleSuccessWebhooks_CallsServiceMultipleTimes`
   - Verifies duplicate webhooks are handled (idempotency in service layer)

9. ✅ `testCheckoutSessionCompleted_ServiceThrowsException_ExceptionIsCaught`
   - Verifies exceptions are caught and logged, not thrown

**Test Results**:
```
[INFO] Tests run: 9, Failures: 0, Errors: 0, Skipped: 0
[INFO] BUILD SUCCESS
```

## Payment Flow

### Immediate Payment Methods (Card, Link)

1. User completes checkout
2. Stripe fires `checkout.session.completed` with `payment_status="paid"`
3. Webhook marks donation as SUCCESS ✅
4. Admin sees SUCCESS immediately

### Asynchronous Payment Methods (Klarna, Bancontact, EPS, Revolut Pay, Amazon Pay)

1. User completes checkout (redirected to bank/payment provider)
2. Stripe fires `checkout.session.completed` with `payment_status="unpaid"`
3. Webhook leaves donation as PENDING (awaiting payment confirmation)
4. Admin sees PENDING (customer completing payment at bank)
5. **Later**: Customer confirms payment at bank
6. Stripe fires `checkout.session.async_payment_succeeded` with `payment_status="paid"`
7. Webhook marks donation as SUCCESS ✅
8. Admin now sees SUCCESS

### Failed Async Payment

1. Steps 1-4 same as above
2. Customer cancels or bank rejects payment
3. Stripe fires `checkout.session.async_payment_failed`
4. Webhook marks donation as FAILED ❌
5. Admin sees FAILED

## Idempotency

**Existing Protection**: The `DonationService` methods already have idempotency checks:

- `markDonationSuccessFromStripe()` (Line 109): Checks if already SUCCESS, skips update
- `markDonationFailed()` (Lines 127-131): Prevents overwriting SUCCESS or duplicate FAILED

This ensures that:
- Duplicate webhooks from Stripe don't cause issues
- Race conditions between webhooks are handled
- Final state is always consistent

## Files Modified

1. **StripeWebhookController.java** - Core webhook handling logic
   - Added payment_status check
   - Added 2 new webhook handlers
   - Enhanced logging

2. **StripeWebhookControllerTest.java** - Comprehensive test suite
   - 9 test cases covering all scenarios
   - Mock Stripe events with various payment_status values
   - Verifies correct service method calls

## Deployment Notes

### Backend Restart Required
The backend must be restarted to pick up the new webhook handlers.

### Stripe Dashboard Configuration
**IMPORTANT**: Update Stripe webhook endpoint to listen for these events:
- ✅ `checkout.session.completed` (already configured)
- ✅ `checkout.session.expired` (already configured)
- ⚠️  `checkout.session.async_payment_succeeded` (ADD THIS)
- ⚠️  `checkout.session.async_payment_failed` (ADD THIS)

**Steps**:
1. Go to Stripe Dashboard → Developers → Webhooks
2. Click on your webhook endpoint
3. Click "Add events"
4. Search for and add:
   - `checkout.session.async_payment_succeeded`
   - `checkout.session.async_payment_failed`
5. Save changes

### Testing in Stripe Test Mode

**Test immediate payment (Card)**:
```
Card number: 4242 4242 4242 4242
Expiry: Any future date
CVC: Any 3 digits
```

**Test async payment (Klarna)**:
1. Select Klarna as payment method
2. Stripe will simulate async payment flow in test mode
3. Check logs to see `payment_status="unpaid"` webhook
4. Stripe will automatically fire success webhook after ~30 seconds

## Backward Compatibility

✅ **Fully backward compatible**:
- Existing immediate payment methods (Card, Link) continue to work exactly as before
- No changes to `DonationService` methods
- No database schema changes
- No frontend changes required
- Only adds new functionality for async payments

## Monitoring

### Key Log Patterns to Monitor

**Successful immediate payment**:
```
[Webhook] checkout.session.completed - sessionId: cs_..., payment_status: paid
[Webhook] Payment completed immediately (payment_status=paid), marking donation ... as SUCCESS
[Webhook] Successfully marked donation ... as SUCCESS
```

**Async payment initiated**:
```
[Webhook] checkout.session.completed - sessionId: cs_..., payment_status: unpaid
[Webhook] Checkout completed but payment_status='unpaid' (unpaid) for donation ...
Payment is async - awaiting checkout.session.async_payment_succeeded webhook
```

**Async payment succeeded**:
```
[Webhook] checkout.session.async_payment_succeeded - sessionId: cs_..., payment_status: paid
[Webhook] Async payment succeeded (payment_status=paid), marking donation ... as SUCCESS
[Webhook] Successfully marked donation ... as SUCCESS after async payment
```

**Async payment failed**:
```
[Webhook] checkout.session.async_payment_failed - sessionId: cs_..., payment_status: unpaid
[Webhook] Async payment failed, marking donation ... as FAILED
[Webhook] Successfully marked donation ... as FAILED after async payment failure
```

## Summary

This implementation provides:
- ✅ Correct status for all payment methods (immediate and async)
- ✅ Comprehensive structured logging for debugging
- ✅ Idempotency protection against duplicate webhooks
- ✅ Graceful error handling
- ✅ Full test coverage (9 passing tests)
- ✅ Backward compatibility
- ✅ Production-ready with minimal code changes

The fix ensures that admin users see accurate donation statuses:
- **PENDING**: Payment initiated but not yet confirmed (async methods)
- **SUCCESS**: Payment confirmed by Stripe
- **FAILED**: Payment failed or session expired
