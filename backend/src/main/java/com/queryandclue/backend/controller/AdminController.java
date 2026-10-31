package com.queryandclue.backend.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
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

    /** Normalise difficulty string to EASY/MEDIUM/HARD. Returns INVALID if invalid. */
    static String normaliseDifficulty(String raw) {
        if (raw == null || raw.isBlank()) return null; // null = let AI decide
        switch (raw.trim().toUpperCase()) {
            case "EASY": return "EASY";
            case "MEDIUM": return "MEDIUM";
            case "HARD": return "HARD";
            default: return "INVALID";
        }
    }

    private boolean isAdmin(String key) {
        String adminKey = System.getenv("ADMIN_KEY");
        if (adminKey == null || adminKey.isBlank()) {
            adminKey = "queryadmin";
        }
        return key != null && adminKey.equals(key.trim());
    }

    private static final java.util.concurrent.atomic.AtomicLong LAST_GEN_TIMESTAMP = new java.util.concurrent.atomic.AtomicLong(0);
    private static final long MIN_GEN_INTERVAL_MS = 3000;

    public ResponseEntity<?> adminGenerate(String key) {
        return adminGenerate(key, null);
    }

    /** Rate-limited case generation with optional difficulty (EASY/MEDIUM/HARD) */
    @PostMapping("/generate")
    public ResponseEntity<?> adminGenerate(
            @RequestHeader(value = "X-Admin-Key", required = false) String key,
            @RequestParam(value = "difficulty", required = false) String difficulty) {

        if (!isAdmin(key)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Unauthorized"));
        }

        String normDifficulty = normaliseDifficulty(difficulty);
        if ("INVALID".equals(normDifficulty)) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Invalid difficulty. Allowed values: EASY, MEDIUM, HARD"));
        }

        long now = System.currentTimeMillis();
        long last = LAST_GEN_TIMESTAMP.get();
        if (now - last < MIN_GEN_INTERVAL_MS) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body(Map.of("error", "Rate limit exceeded. Please wait 3 seconds before generating another case."));
        }
        LAST_GEN_TIMESTAMP.set(now);

        for (int attempt = 1; attempt <= 3; attempt++) {
            GeneratedCase generatedCase = aiCaseGeneratorService.generateCase(normDifficulty);

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

    /** Update case metadata (e.g. title/crimeType fix) */
    @PutMapping("/case/{id}")
    public ResponseEntity<?> updateCase(
            @PathVariable int id,
            @RequestBody Map<String, String> updates,
            @RequestHeader(value = "X-Admin-Key", required = false) String key) {

        if (!isAdmin(key)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Unauthorized"));
        }

        if (updates.containsKey("difficulty")) {
            String d = normaliseDifficulty(updates.get("difficulty"));
            if ("INVALID".equals(d)) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Invalid difficulty. Allowed values: EASY, MEDIUM, HARD"));
            }
        }

        return caseRepository.findById(id).map(c -> {
            if (updates.containsKey("title")) c.setTitle(updates.get("title"));
            if (updates.containsKey("crimeType")) c.setCrimeType(updates.get("crimeType"));
            if (updates.containsKey("description")) c.setDescription(updates.get("description"));
            if (updates.containsKey("difficulty")) c.setDifficulty(updates.get("difficulty"));
            Case saved = caseRepository.save(c);
            return ResponseEntity.ok(saved);
        }).orElse(ResponseEntity.notFound().build());
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
