package com.queryandclue.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.queryandclue.backend.entity.Evidence;

public interface EvidenceRepository extends JpaRepository<Evidence, Integer> {
}