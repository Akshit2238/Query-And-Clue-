package com.queryandclue.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.queryandclue.backend.entity.AccessLog;

public interface AccessLogRepository extends JpaRepository<AccessLog, Integer> {
}