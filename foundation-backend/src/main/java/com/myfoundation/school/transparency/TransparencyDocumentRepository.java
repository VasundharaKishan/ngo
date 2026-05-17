package com.myfoundation.school.transparency;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TransparencyDocumentRepository extends JpaRepository<TransparencyDocument, Long> {

    List<TransparencyDocument> findAllByOrderBySortOrderAscIdAsc();

    List<TransparencyDocument> findByEnabledTrueOrderBySortOrderAscIdAsc();
}
