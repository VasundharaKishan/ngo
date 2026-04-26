package com.myfoundation.school.donationpreset;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DonationPresetRepository extends JpaRepository<DonationPreset, Long> {

    List<DonationPreset> findAllByOrderBySortOrderAscIdAsc();

    List<DonationPreset> findByEnabledTrueOrderBySortOrderAscIdAsc();

    @Modifying
    @Query("update DonationPreset p set p.isDefault = false where p.id <> :keepId")
    int clearOtherDefaults(Long keepId);

    @Modifying
    @Query("update DonationPreset p set p.isDefault = false")
    int clearAllDefaults();
}
