package com.queryandclue.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.queryandclue.backend.entity.CrimeScene;

public interface CrimeSceneRepository extends JpaRepository<CrimeScene, Integer> {
}