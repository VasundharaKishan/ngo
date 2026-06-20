package com.myfoundation.school.privacy;

import com.myfoundation.school.audit.AuditAction;
import com.myfoundation.school.audit.AuditLogService;
import com.myfoundation.school.donation.Donation;
import com.myfoundation.school.donation.DonationRepository;
import com.myfoundation.school.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ErasureService {

    private final ErasureRequestRepository erasureRequestRepository;
    private final DonationRepository donationRepository;
    private final AuditLogService auditLogService;

    /**
     * Submit an erasure request. Always returns success to avoid revealing
     * whether an email exists in the system.
     */
    @Transactional
    public void submitErasureRequest(String email, String reason) {
        ErasureRequest request = ErasureRequest.builder()
                .email(email.trim().toLowerCase())
                .reason(reason)
                .build();
        erasureRequestRepository.save(request);

        auditLogService.log(
                AuditAction.ERASURE_REQUESTED,
                "ErasureRequest",
                request.getId(),
                "anonymous",
                "Erasure request submitted for email: " + maskEmail(email)
        );
        log.info("Erasure request {} created for masked email {}", request.getId(), maskEmail(email));
    }

    /**
     * Process an erasure request: anonymize all donations matching the email,
     * then mark the request as COMPLETED.
     */
    @Transactional
    public ErasureRequest processErasureRequest(String requestId, String adminUsername) {
        ErasureRequest request = erasureRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Erasure request not found: " + requestId));

        if (request.getStatus() != ErasureStatus.PENDING) {
            throw new IllegalStateException("Erasure request is not in PENDING status");
        }

        // Anonymize all donations matching the email
        List<Donation> donations = donationRepository.findByDonorEmailIgnoreCase(request.getEmail());

        int anonymized = 0;
        for (Donation donation : donations) {
            donation.setDonorName("[Deleted]");
            donation.setDonorEmail(null);
            donationRepository.save(donation);
            anonymized++;
        }

        // Mark the request as completed
        request.setStatus(ErasureStatus.COMPLETED);
        request.setProcessedBy(adminUsername);
        request.setProcessedAt(Instant.now());
        erasureRequestRepository.save(request);

        auditLogService.log(
                AuditAction.ERASURE_COMPLETED,
                "ErasureRequest",
                request.getId(),
                adminUsername,
                "Erasure completed. " + anonymized + " donation(s) anonymized for email: " + maskEmail(request.getEmail())
        );
        log.info("Erasure request {} processed by {}. {} donations anonymized.", requestId, adminUsername, anonymized);

        return request;
    }

    /**
     * Get paginated list of erasure requests for admin view.
     */
    public Page<ErasureRequest> getErasureRequests(Pageable pageable) {
        return erasureRequestRepository.findAllByOrderByCreatedAtDesc(pageable);
    }

    /** Mask email for logging: show first 2 chars + domain. */
    private String maskEmail(String email) {
        if (email == null || !email.contains("@")) return "***";
        int atIdx = email.indexOf('@');
        String local = email.substring(0, atIdx);
        String domain = email.substring(atIdx);
        if (local.length() <= 2) return local + "***" + domain;
        return local.substring(0, 2) + "***" + domain;
    }
}
