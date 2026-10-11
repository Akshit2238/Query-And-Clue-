package com.queryandclue.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.queryandclue.backend.entity.Case;
import com.queryandclue.backend.generated.GeneratedCase;
import com.queryandclue.backend.service.AICaseGeneratorService;
import com.queryandclue.backend.service.CaseSaveService;
import com.queryandclue.backend.validator.CaseValidator;

@RestController
@RequestMapping("/api/generated-case")
public class GeneratedCaseController {

    private final CaseValidator caseValidator = new CaseValidator();
    private final AICaseGeneratorService aiCaseGeneratorService;
    private final CaseSaveService caseSaveService;

    public GeneratedCaseController(
            AICaseGeneratorService aiCaseGeneratorService,
            CaseSaveService caseSaveService) {

        this.aiCaseGeneratorService = aiCaseGeneratorService;
        this.caseSaveService = caseSaveService;
    }

    @PostMapping("/generate")
    public GeneratedCase generateCase() {
        return aiCaseGeneratorService.generateCase();
    }

    @PostMapping("/generate-and-save")
    public ResponseEntity<?> generateAndSaveCase() {

        GeneratedCase generatedCase =
                aiCaseGeneratorService.generateCase();

        boolean valid =
                caseValidator.validate(generatedCase);

        if (!valid) {
            return ResponseEntity.badRequest()
                    .body(java.util.Map.of("error", "AI generated case was invalid and was not saved."));
        }

        Case savedCase = caseSaveService.saveGeneratedCase(generatedCase);
        return ResponseEntity.ok(savedCase);
    }
}