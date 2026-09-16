package com.queryandclue.backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.queryandclue.backend.entity.Suspect;

public interface SuspectRepository extends JpaRepository<Suspect, Integer> {

    Optional<Suspect> findByCaseIdAndName(int caseId, String name);
}