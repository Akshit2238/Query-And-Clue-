package com.queryandclue.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.queryandclue.backend.entity.FinalAccusation;

public interface FinalAccusationRepository extends JpaRepository<FinalAccusation, Integer> {
}