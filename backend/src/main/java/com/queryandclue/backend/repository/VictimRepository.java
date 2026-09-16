package com.queryandclue.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.queryandclue.backend.entity.Victim;

public interface VictimRepository extends JpaRepository<Victim, Integer> {
}