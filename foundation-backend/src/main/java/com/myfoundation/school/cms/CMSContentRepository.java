package com.myfoundation.school.cms;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CMSContentRepository extends JpaRepository<CMSContent, String> {
    List<CMSContent> findBySectionAndActiveTrue(String section);
    List<CMSContent> findBySection(String section);
    Optional<CMSContent> findBySectionAndContentKey(String section, String contentKey);
    List<CMSContent> findByActiveTrueOrderByDisplayOrderAsc();
}
