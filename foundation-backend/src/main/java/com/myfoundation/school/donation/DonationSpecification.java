package com.myfoundation.school.donation;

import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import com.myfoundation.school.campaign.Campaign;

import java.util.ArrayList;
import java.util.List;

public class DonationSpecification {
    
    /**
     * Creates a specification for searching and filtering donations.
     * 
     * @param searchQuery Optional search term to match against donor name, email, campaign title, or donation ID
     * @param status Optional status filter (PENDING, SUCCESS, FAILED)
     * @return Specification for querying donations
     */
    public static Specification<Donation> filterDonations(String searchQuery, DonationStatus status) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();
            
            // Join with campaign eagerly to avoid N+1 queries
            Join<Donation, Campaign> campaignJoin = root.join("campaign", JoinType.LEFT);
            
            // Add search filter if provided
            if (searchQuery != null && !searchQuery.trim().isEmpty()) {
                String searchPattern = "%" + searchQuery.toLowerCase() + "%";
                Predicate searchPredicate = criteriaBuilder.or(
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("donorName")), searchPattern),
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("donorEmail")), searchPattern),
                    criteriaBuilder.like(criteriaBuilder.lower(campaignJoin.get("title")), searchPattern),
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("id")), searchPattern),
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("stripePaymentIntentId")), searchPattern)
                );
                predicates.add(searchPredicate);
            }
            
            // Add status filter if provided
            if (status != null) {
                predicates.add(criteriaBuilder.equal(root.get("status"), status));
            }
            
            // Ensure distinct results
            query.distinct(true);
            
            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }
}
