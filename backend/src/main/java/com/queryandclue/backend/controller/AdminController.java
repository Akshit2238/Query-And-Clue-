package com.queryandclue.backend.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.queryandclue.backend.entity.Case;
import com.queryandclue.backend.entity.CaseSolution;
import com.queryandclue.backend.entity.Suspect;
import com.queryandclue.backend.generated.GeneratedCase;
import com.queryandclue.backend.repository.CaseRepository;
import com.queryandclue.backend.repository.CaseSolutionRepository;
import com.queryandclue.backend.repository.SuspectRepository;
import com.queryandclue.backend.service.AICaseGeneratorService;
import com.queryandclue.backend.service.CaseSaveService;
import com.queryandclue.backend.validator.CaseValidator;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AICaseGeneratorService aiCaseGeneratorService;
    private final CaseSaveService caseSaveService;
    private final CaseRepository caseRepository;
    private final CaseSolutionRepository caseSolutionRepository;
    private final SuspectRepository suspectRepository;
    private final CaseValidator caseValidator = new CaseValidator();

    public AdminController(
            AICaseGeneratorService aiCaseGeneratorService,
            CaseSaveService caseSaveService,
            CaseRepository caseRepository,
            CaseSolutionRepository caseSolutionRepository,
            SuspectRepository suspectRepository) {
        this.aiCaseGeneratorService = aiCaseGeneratorService;
        this.caseSaveService = caseSaveService;
        this.caseRepository = caseRepository;
        this.caseSolutionRepository = caseSolutionRepository;
        this.suspectRepository = suspectRepository;
    }

    private boolean isAdmin(String key) {
        String adminKey = System.getenv("ADMIN_KEY");
        if (adminKey == null || adminKey.isBlank()) {
            adminKey = "queryadmin";
        }
        return key != null && adminKey.equals(key.trim());
    }

    /** Unlimited case generation — no rate limit */
    @PostMapping("/generate")
    public ResponseEntity<?> adminGenerate(
            @RequestHeader(value = "X-Admin-Key", required = false) String key) {

        if (!isAdmin(key)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Unauthorized"));
        }

        for (int attempt = 1; attempt <= 3; attempt++) {
            GeneratedCase generatedCase = aiCaseGeneratorService.generateCase();

            if (!caseValidator.validate(generatedCase)) {
                continue;
            }

            String title = generatedCase.getCaseData().getTitle();
            if (caseSaveService.titleExists(title)) {
                continue;
            }

            Case savedCase = caseSaveService.saveGeneratedCase(generatedCase);
            return ResponseEntity.ok(savedCase);
        }

        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(Map.of("error", "Could not generate a unique valid case after 3 attempts."));
    }

    /** Get all cases (for admin list) */
    @GetMapping("/cases")
    public ResponseEntity<?> getAllCases(
            @RequestHeader(value = "X-Admin-Key", required = false) String key) {

        if (!isAdmin(key)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Unauthorized"));
        }

        return ResponseEntity.ok(caseRepository.findAll());
    }

    /** Get solution + culprit name + hint queries for a case */
    @GetMapping("/case/{id}/solution")
    public ResponseEntity<?> getCaseSolution(
            @PathVariable int id,
            @RequestHeader(value = "X-Admin-Key", required = false) String key) {

        if (!isAdmin(key)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Unauthorized"));
        }

        CaseSolution solution = caseSolutionRepository.findByCaseId(id)
                .orElse(null);
        if (solution == null) {
            return ResponseEntity.notFound().build();
        }

        Suspect culprit = suspectRepository.findById(solution.getCulpritSuspectId())
                .orElse(null);
        String culpritName = culprit != null ? culprit.getName() : "Unknown";

        List<String> hintQueries = List.of(
            "-- Who are the suspects?\nSELECT * FROM suspects WHERE case_id = " + id + ";",
            "-- What evidence was found?\nSELECT * FROM evidence WHERE case_id = " + id + ";",
            "-- Timeline of events\nSELECT * FROM timeline_events WHERE case_id = " + id + " ORDER BY event_time;",
            "-- Where did each suspect access?\nSELECT s.name, a.location, a.access_time, a.exit_time\nFROM access_logs a\nJOIN suspects s ON a.suspect_id = s.suspect_id\nWHERE a.case_id = " + id + ";",
            "-- Phone calls between suspects\nSELECT caller.name AS caller, receiver.name AS receiver, p.call_time, p.call_duration\nFROM phone_records p\nJOIN suspects caller ON p.caller_suspect_id = caller.suspect_id\nJOIN suspects receiver ON p.receiver_suspect_id = receiver.suspect_id\nWHERE p.case_id = " + id + ";",
            "-- Financial transactions\nSELECT s.name, t.amount, t.transaction_date, t.description\nFROM transactions t\nJOIN suspects s ON t.suspect_id = s.suspect_id\nWHERE t.case_id = " + id + " ORDER BY t.amount DESC;",
            "-- Suspects with NO alibi (prime targets)\nSELECT name, alibi FROM suspects WHERE case_id = " + id + " AND (alibi IS NULL OR alibi = '' OR LOWER(alibi) LIKE '%none%');"
        );

        return ResponseEntity.ok(Map.of(
            "caseId", id,
            "culpritName", culpritName,
            "motive", solution.getMotive(),
            "crimeMethod", solution.getCrimeMethod(),
            "explanation", solution.getExplanation(),
            "hintQueries", hintQueries
        ));
    }
}
