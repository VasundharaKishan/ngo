package com.myfoundation.school.cms;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HomepageStatRepository extends JpaRepository<HomepageStat, String> {
    List<HomepageStat> findByActiveTrueOrderByDisplayOrderAsc();
}
