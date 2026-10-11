package com.queryandclue.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.queryandclue.backend.dto.QueryRequest;
import com.queryandclue.backend.dto.QueryResult;
import com.queryandclue.backend.service.QueryService;

@RestController
@RequestMapping("/api/query")
public class QueryController {

    private final QueryService queryService;

    public QueryController(QueryService queryService) {
        this.queryService = queryService;
    }

    @PostMapping("/execute")
    public ResponseEntity<?> executeQuery(@RequestBody QueryRequest request) {
        if (request == null || request.getQuery() == null || request.getQuery().isBlank()) {
            return ResponseEntity.badRequest().body(new ErrorResponse("INVALID_REQUEST", "Query cannot be empty"));
        }

        try {
            QueryResult result = queryService.executeQuery(request.getCaseId(), request.getQuery());
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse("VALIDATION_ERROR", e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.internalServerError().body(new ErrorResponse("EXECUTION_ERROR", "Query execution failed"));
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