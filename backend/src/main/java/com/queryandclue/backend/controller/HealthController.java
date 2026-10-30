package com.queryandclue.backend.controller;

import java.util.LinkedHashMap;
import java.util.Map;

import javax.sql.DataSource;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Lightweight health endpoint.
 *
 * GET /health        — application liveness (no DB check)
 * GET /health/db     — database readiness (executes SELECT 1)
 *
 * Never exposes credentials, stack traces, or internal hostnames.
 */
@RestController
public class HealthController {

    private final DataSource dataSource;

    public HealthController(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> liveness() {
        Map<String, String> body = new LinkedHashMap<>();
        body.put("status", "UP");
        body.put("service", "query-and-clue-backend");
        return ResponseEntity.ok(body);
    }

    @GetMapping("/health/db")
    public ResponseEntity<Map<String, String>> dbReadiness() {
        Map<String, String> body = new LinkedHashMap<>();
        try (var conn = dataSource.getConnection();
             var stmt = conn.createStatement()) {
            stmt.setQueryTimeout(5);
            stmt.executeQuery("SELECT 1");
            body.put("status", "UP");
            body.put("database", "reachable");
            return ResponseEntity.ok(body);
        } catch (Exception e) {
            body.put("status", "DOWN");
            body.put("database", "unreachable");
            // Deliberately omit e.getMessage() — may contain host/credentials
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(body);
        }
    }
}
