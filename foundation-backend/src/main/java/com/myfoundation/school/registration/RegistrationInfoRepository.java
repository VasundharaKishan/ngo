package com.myfoundation.school.registration;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RegistrationInfoRepository extends JpaRepository<RegistrationInfo, Long> {
    // JpaRepository provides findById(SINGLETON_ID) and save(), which is all we need.
}
