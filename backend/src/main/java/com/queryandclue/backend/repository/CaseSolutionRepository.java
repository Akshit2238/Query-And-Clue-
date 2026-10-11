package com.queryandclue.backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.queryandclue.backend.entity.CaseSolution;

public interface CaseSolutionRepository extends JpaRepository<CaseSolution, Integer> {
    Optional<CaseSolution> findByCaseId(int caseId);
}