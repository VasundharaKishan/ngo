package com.myfoundation.school.privacy;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ErasureRequestRepository extends JpaRepository<ErasureRequest, String> {

    Page<ErasureRequest> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
