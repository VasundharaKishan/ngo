package com.myfoundation.school.heropanel;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface HeroPanelRepository extends JpaRepository<HeroPanel, Long> {
    // JpaRepository.findById(SINGLETON_ID) + save() is sufficient.
}
