package com.myfoundation.school.trustbadge;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TrustBadgeRepository extends JpaRepository<TrustBadge, Long> {

    List<TrustBadge> findAllByOrderBySortOrderAscIdAsc();

    Optional<TrustBadge> findBySlotKey(String slotKey);
}
