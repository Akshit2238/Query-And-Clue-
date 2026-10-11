package com.queryandclue.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import com.queryandclue.backend.dto.AccusationRequest;
import com.queryandclue.backend.dto.AccusationResult;
import com.queryandclue.backend.service.AccusationService;

@RestController
@RequestMapping("/api/cases")
public class AccusationController {

    private final AccusationService accusationService;

    public AccusationController(AccusationService accusationService) {
        this.accusationService = accusationService;
    }

    @PostMapping("/{id}/accusation")
    public ResponseEntity<?> submitAccusation(@PathVariable int id, @RequestBody AccusationRequest request) {
        if (request == null || request.getAccusedSuspectId() <= 0) {
            return ResponseEntity.badRequest()
                    .body(new ErrorResponse("INVALID_REQUEST", "Accused suspect ID is required"));
        }
        if (request.getExplanation() == null || request.getExplanation().isBlank()) {
            return ResponseEntity.badRequest().body(new ErrorResponse("INVALID_REQUEST", "Explanation is required"));
        }

        try {
            AccusationResult result = accusationService.submitAccusation(id, request);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse("VALIDATION_ERROR", e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.internalServerError()
                    .body(new ErrorResponse("SERVER_ERROR", "Failed to submit accusation"));
        }
    }

    public static class ErrorResponse {
        private final String error;
        private final String message;

        public ErrorResponse(String error, String message) {
            this.error = error;
            this.message = message;
        }

        public String getError() {
            return error;
        }

        public String getMessage() {
            return message;
        }
    }
}