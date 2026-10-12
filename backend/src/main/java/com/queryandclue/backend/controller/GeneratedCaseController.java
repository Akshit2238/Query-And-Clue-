package com.queryandclue.backend.controller;

import java.time.LocalDate;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;


import com.queryandclue.backend.entity.Case;
import com.queryandclue.backend.generated.GeneratedCase;
import com.queryandclue.backend.service.AICaseGeneratorService;
import com.queryandclue.backend.service.CaseSaveService;
import com.queryandclue.backend.validator.CaseValidator;

import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/generated-case")
public class GeneratedCaseController {

    private static final int DAILY_GENERATION_LIMIT = 5;
    private final Map<String, AtomicInteger> dailyGenerations = new ConcurrentHashMap<>();

    private final CaseValidator caseValidator = new CaseValidator();
    private final AICaseGeneratorService aiCaseGeneratorService;
    private final CaseSaveService caseSaveService;

    public GeneratedCaseController(
            AICaseGeneratorService aiCaseGeneratorService,
            CaseSaveService caseSaveService) {

        this.aiCaseGeneratorService = aiCaseGeneratorService;
        this.caseSaveService = caseSaveService;
    }

    private String getClientIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            return xff.split(",")[0].trim();
        }
        return request.getRemoteAddr() != null ? request.getRemoteAddr() : "unknown";
    }

    private int getRemaining(String clientIp) {
        String key = clientIp + ":" + LocalDate.now();
        AtomicInteger counter = dailyGenerations.get(key);
        int used = counter != null ? counter.get() : 0;
        return Math.max(0, DAILY_GENERATION_LIMIT - used);
    }

    @GetMapping("/limit")
    public ResponseEntity<Map<String, Object>> getLimit(HttpServletRequest request) {
        String clientIp = getClientIp(request);
        int remaining = getRemaining(clientIp);
        return ResponseEntity.ok(Map.of(
            "limit", DAILY_GENERATION_LIMIT,
            "remaining", remaining
        ));
    }

    @PostMapping("/generate-and-save")
    public ResponseEntity<?> generateAndSaveCase(HttpServletRequest request) {
        String clientIp = getClientIp(request);
        String key = clientIp + ":" + LocalDate.now();
        AtomicInteger counter = dailyGenerations.computeIfAbsent(key, k -> new AtomicInteger(0));

        if (counter.get() >= DAILY_GENERATION_LIMIT) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(Map.of(
                "error", "DAILY_LIMIT_EXCEEDED",
                "message", "Daily generation limit reached. You can only generate up to 5 cases per day. Please return tomorrow!"
            ));
        }

        // Try up to 2 times in case AI generates a duplicate title
        for (int attempt = 1; attempt <= 2; attempt++) {
            GeneratedCase generatedCase = aiCaseGeneratorService.generateCase();

            boolean valid = caseValidator.validate(generatedCase);
            if (!valid) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "AI generated case was invalid and was not saved."));
            }

            String title = generatedCase.getCaseData().getTitle();
            if (caseSaveService.titleExists(title)) {
                if (attempt == 2) {
                    return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(
                        "error", "DUPLICATE_CASE",
                        "message", "A case with this title already exists. Please try again."
                    ));
                }
                continue; // retry
            }

            Case savedCase = caseSaveService.saveGeneratedCase(generatedCase);
            counter.incrementAndGet();
            return ResponseEntity.ok(savedCase);
        }

        return ResponseEntity.internalServerError().body(Map.of("error", "Failed to generate a unique case."));
    }
}