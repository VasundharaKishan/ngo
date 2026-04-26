package com.myfoundation.school.story;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StoryRepository extends JpaRepository<Story, Long> {

    List<Story> findAllByOrderBySortOrderAscIdAsc();

    List<Story> findByEnabledTrueOrderBySortOrderAscIdAsc();
}
