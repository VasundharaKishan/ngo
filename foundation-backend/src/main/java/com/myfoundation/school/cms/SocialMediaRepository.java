package com.myfoundation.school.cms;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SocialMediaRepository extends JpaRepository<SocialMedia, String> {
    List<SocialMedia> findByActiveTrueOrderByDisplayOrderAsc();
}
