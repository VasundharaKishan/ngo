package com.myfoundation.school.admin;

import com.myfoundation.school.donation.DonationService;
import com.myfoundation.school.dto.DonationResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/donations")
@RequiredArgsConstructor
@Slf4j
public class AdminDonationController {
    
    private final DonationService donationService;
    
    @GetMapping
    public ResponseEntity<List<DonationResponse>> getAllDonations() {
        log.info("GET /api/admin/donations - Fetching all donations");
        List<DonationResponse> donations = donationService.getAllDonations();
        return ResponseEntity.ok(donations);
    }
}
