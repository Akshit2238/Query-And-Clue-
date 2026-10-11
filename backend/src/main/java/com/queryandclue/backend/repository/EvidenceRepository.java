package com.queryandclue.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.queryandclue.backend.entity.Evidence;

public interface EvidenceRepository extends JpaRepository<Evidence, Integer> {

    List<Evidence> findByCaseId(int caseId);
}