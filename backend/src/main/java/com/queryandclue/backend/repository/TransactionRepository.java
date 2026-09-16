package com.queryandclue.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.queryandclue.backend.entity.Transaction;

public interface TransactionRepository extends JpaRepository<Transaction, Integer> {
}