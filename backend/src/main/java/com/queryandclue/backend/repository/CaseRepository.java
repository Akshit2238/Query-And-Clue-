package com.queryandclue.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.queryandclue.backend.entity.Case;

public interface CaseRepository extends JpaRepository<Case, Integer> {
}