package com.queryandclue.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.queryandclue.backend.entity.Case;

public interface CaseRepository extends JpaRepository<Case, Integer> {

    @Query("SELECT COALESCE(MAX(c.caseId), 0) FROM Case c")
    int findMaxCaseId();

    boolean existsByTitle(String title);
}
