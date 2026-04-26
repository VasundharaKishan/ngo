package com.myfoundation.school.moneyallocation;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MoneyAllocationRepository extends JpaRepository<MoneyAllocation, Long> {

    List<MoneyAllocation> findAllByOrderBySortOrderAscIdAsc();

    List<MoneyAllocation> findByEnabledTrueOrderBySortOrderAscIdAsc();
}
