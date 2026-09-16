package com.queryandclue.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.queryandclue.backend.entity.PhoneRecord;

public interface PhoneRecordRepository extends JpaRepository<PhoneRecord, Integer> {
}
