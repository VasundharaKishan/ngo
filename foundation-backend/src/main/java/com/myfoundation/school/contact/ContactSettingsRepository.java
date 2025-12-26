package com.myfoundation.school.contact;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ContactSettingsRepository extends JpaRepository<ContactSettings, String> {
}
