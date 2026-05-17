package com.myfoundation.school.announcementbar;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Singleton entity — {@code findById(SINGLETON_ID)} + {@code save()} is all we need.
 */
@Repository
public interface AnnouncementBarRepository extends JpaRepository<AnnouncementBar, Long> {
}
