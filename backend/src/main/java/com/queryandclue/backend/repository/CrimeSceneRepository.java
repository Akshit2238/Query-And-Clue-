package com.queryandclue.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.queryandclue.backend.entity.CrimeScene;

public interface CrimeSceneRepository extends JpaRepository<CrimeScene, Integer> {

    List<CrimeScene> findByCaseId(int caseId);
}