package com.myfoundation.school.faq;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FaqRepository extends JpaRepository<Faq, Long> {

    List<Faq> findAllByOrderBySortOrderAscIdAsc();

    List<Faq> findByEnabledTrueOrderBySortOrderAscIdAsc();
}
