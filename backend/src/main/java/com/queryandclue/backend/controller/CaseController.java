package com.queryandclue.backend.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.queryandclue.backend.entity.Case;
import com.queryandclue.backend.repository.CaseRepository;

@RestController
@RequestMapping("/api/cases")
public class CaseController {

    private final CaseRepository caseRepository;

    public CaseController(CaseRepository caseRepository) {
        this.caseRepository = caseRepository;
    }

    @GetMapping
    public List<Case> getAllCases() {
        return caseRepository.findAll();
    }

    @GetMapping("/{id}")
public ResponseEntity<Case> getCaseById(@PathVariable int id) {
    return caseRepository.findById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
}
}