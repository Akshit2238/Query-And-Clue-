package com.queryandclue.backend.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.queryandclue.backend.entity.Case;
import com.queryandclue.backend.entity.CrimeScene;
import com.queryandclue.backend.entity.Evidence;
import com.queryandclue.backend.entity.Suspect;
import com.queryandclue.backend.repository.CaseRepository;
import com.queryandclue.backend.repository.CrimeSceneRepository;
import com.queryandclue.backend.repository.EvidenceRepository;
import com.queryandclue.backend.repository.SuspectRepository;

@RestController
@RequestMapping("/api/cases")
public class CaseController {

    private final CaseRepository caseRepository;
    private final SuspectRepository suspectRepository;
    private final EvidenceRepository evidenceRepository;
    private final CrimeSceneRepository crimeSceneRepository;

    public CaseController(
            CaseRepository caseRepository,
            SuspectRepository suspectRepository,
            EvidenceRepository evidenceRepository,
            CrimeSceneRepository crimeSceneRepository) {
        this.caseRepository = caseRepository;
        this.suspectRepository = suspectRepository;
        this.evidenceRepository = evidenceRepository;
        this.crimeSceneRepository = crimeSceneRepository;
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

    @GetMapping("/{id}/suspects")
    public ResponseEntity<List<Suspect>> getSuspectsByCaseId(@PathVariable int id) {
        if (!caseRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(suspectRepository.findByCaseId(id));
    }

    @GetMapping("/{id}/evidence")
    public ResponseEntity<List<Evidence>> getEvidenceByCaseId(@PathVariable int id) {
        if (!caseRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(evidenceRepository.findByCaseId(id));
    }

    @GetMapping("/{id}/crime-scenes")
    public ResponseEntity<List<CrimeScene>> getCrimeScenesByCaseId(@PathVariable int id) {
        if (!caseRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(crimeSceneRepository.findByCaseId(id));
    }
}