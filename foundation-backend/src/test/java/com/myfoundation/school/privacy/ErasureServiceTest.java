package com.myfoundation.school.privacy;

import com.myfoundation.school.audit.AuditAction;
import com.myfoundation.school.audit.AuditLogService;
import com.myfoundation.school.donation.Donation;
import com.myfoundation.school.donation.DonationRepository;
import com.myfoundation.school.donation.DonationStatus;
import com.myfoundation.school.exception.ResourceNotFoundException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ErasureServiceTest {

    @Mock
    private ErasureRequestRepository erasureRequestRepository;

    @Mock
    private DonationRepository donationRepository;

    @Mock
    private AuditLogService auditLogService;

    @InjectMocks
    private ErasureService erasureService;

    @Captor
    private ArgumentCaptor<ErasureRequest> requestCaptor;

    @Captor
    private ArgumentCaptor<Donation> donationCaptor;

    // ── submitErasureRequest ──

    @Test
    void submitErasureRequest_savesRequestWithNormalizedEmail() {
        when(erasureRequestRepository.save(any(ErasureRequest.class)))
                .thenAnswer(inv -> {
                    ErasureRequest r = inv.getArgument(0);
                    r.setId("req-1");
                    return r;
                });

        erasureService.submitErasureRequest("  User@Example.COM  ", "Delete my data");

        verify(erasureRequestRepository).save(requestCaptor.capture());
        ErasureRequest saved = requestCaptor.getValue();
        assertThat(saved.getEmail()).isEqualTo("user@example.com");
        assertThat(saved.getReason()).isEqualTo("Delete my data");
    }

    @Test
    void submitErasureRequest_logsAuditEntry() {
        when(erasureRequestRepository.save(any(ErasureRequest.class)))
                .thenAnswer(inv -> {
                    ErasureRequest r = inv.getArgument(0);
                    r.setId("req-audit");
                    return r;
                });

        erasureService.submitErasureRequest("donor@test.com", "GDPR");

        verify(auditLogService).log(
                eq(AuditAction.ERASURE_REQUESTED),
                eq("ErasureRequest"),
                eq("req-audit"),
                eq("anonymous"),
                contains("do***@test.com")
        );
    }

    // ── processErasureRequest ──

    @Test
    void processErasureRequest_anonymizesDonationsAndCompletesRequest() {
        ErasureRequest request = ErasureRequest.builder()
                .id("req-1")
                .email("donor@test.com")
                .status(ErasureStatus.PENDING)
                .build();

        Donation donation1 = Donation.builder()
                .id("don-1").donorName("Alice").donorEmail("donor@test.com")
                .amount(5000L).currency("INR").status(DonationStatus.SUCCESS).build();
        Donation donation2 = Donation.builder()
                .id("don-2").donorName("Alice").donorEmail("donor@test.com")
                .amount(10000L).currency("INR").status(DonationStatus.SUCCESS).build();

        when(erasureRequestRepository.findById("req-1")).thenReturn(Optional.of(request));
        when(donationRepository.findByDonorEmailIgnoreCase("donor@test.com"))
                .thenReturn(List.of(donation1, donation2));
        when(erasureRequestRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(donationRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        ErasureRequest result = erasureService.processErasureRequest("req-1", "admin_user");

        assertThat(result.getStatus()).isEqualTo(ErasureStatus.COMPLETED);
        assertThat(result.getProcessedBy()).isEqualTo("admin_user");
        assertThat(result.getProcessedAt()).isNotNull();

        verify(donationRepository, times(2)).save(donationCaptor.capture());
        List<Donation> anonymized = donationCaptor.getAllValues();
        assertThat(anonymized).allSatisfy(d -> {
            assertThat(d.getDonorName()).isEqualTo("[Deleted]");
            assertThat(d.getDonorEmail()).isNull();
        });
    }

    @Test
    void processErasureRequest_noMatchingDonations_stillCompletes() {
        ErasureRequest request = ErasureRequest.builder()
                .id("req-2")
                .email("unknown@test.com")
                .status(ErasureStatus.PENDING)
                .build();

        when(erasureRequestRepository.findById("req-2")).thenReturn(Optional.of(request));
        when(donationRepository.findByDonorEmailIgnoreCase("unknown@test.com"))
                .thenReturn(Collections.emptyList());
        when(erasureRequestRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        ErasureRequest result = erasureService.processErasureRequest("req-2", "admin");

        assertThat(result.getStatus()).isEqualTo(ErasureStatus.COMPLETED);
        verify(donationRepository, never()).save(any());
    }

    @Test
    void processErasureRequest_notFound_throwsException() {
        when(erasureRequestRepository.findById("nonexistent")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> erasureService.processErasureRequest("nonexistent", "admin"))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void processErasureRequest_alreadyCompleted_throwsIllegalState() {
        ErasureRequest request = ErasureRequest.builder()
                .id("req-3")
                .email("done@test.com")
                .status(ErasureStatus.COMPLETED)
                .build();

        when(erasureRequestRepository.findById("req-3")).thenReturn(Optional.of(request));

        assertThatThrownBy(() -> erasureService.processErasureRequest("req-3", "admin"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("not in PENDING status");
    }

    @Test
    void processErasureRequest_logsAuditWithAnonymizedCount() {
        ErasureRequest request = ErasureRequest.builder()
                .id("req-4")
                .email("audited@test.com")
                .status(ErasureStatus.PENDING)
                .build();

        Donation donation = Donation.builder()
                .id("don-a").donorName("Bob").donorEmail("audited@test.com")
                .amount(1000L).currency("USD").status(DonationStatus.SUCCESS).build();

        when(erasureRequestRepository.findById("req-4")).thenReturn(Optional.of(request));
        when(donationRepository.findByDonorEmailIgnoreCase("audited@test.com"))
                .thenReturn(List.of(donation));
        when(erasureRequestRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(donationRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        erasureService.processErasureRequest("req-4", "admin");

        verify(auditLogService).log(
                eq(AuditAction.ERASURE_COMPLETED),
                eq("ErasureRequest"),
                eq("req-4"),
                eq("admin"),
                contains("1 donation(s) anonymized")
        );
    }

    // ── getErasureRequests ──

    @Test
    void getErasureRequests_returnsPaginatedResults() {
        ErasureRequest req = ErasureRequest.builder()
                .id("req-5").email("test@test.com").status(ErasureStatus.PENDING).build();

        Pageable pageable = PageRequest.of(0, 10);
        Page<ErasureRequest> page = new PageImpl<>(List.of(req), pageable, 1);

        when(erasureRequestRepository.findAllByOrderByCreatedAtDesc(pageable)).thenReturn(page);

        Page<ErasureRequest> result = erasureService.getErasureRequests(pageable);

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getId()).isEqualTo("req-5");
    }
}
