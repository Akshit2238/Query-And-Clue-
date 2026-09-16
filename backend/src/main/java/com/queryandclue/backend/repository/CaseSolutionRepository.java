package com.queryandclue.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.queryandclue.backend.entity.CaseSolution;

public interface CaseSolutionRepository extends JpaRepository<CaseSolution, Integer> {
}