package com.queryandclue.backend.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@SuppressWarnings("null")
class QueryControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void executeValidQuery() throws Exception {
        mockMvc.perform(post("/api/query/execute")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"caseId\":1,\"query\":\"SELECT * FROM suspects WHERE case_id = 1\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.columns").exists())
                .andExpect(jsonPath("$.rows").exists())
                .andExpect(jsonPath("$.rowCount").exists())
                .andExpect(jsonPath("$.executionMs").exists());
    }

    @Test
    void executeQueryWithValidationError() throws Exception {
        mockMvc.perform(post("/api/query/execute")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"caseId\":1,\"query\":\"INSERT INTO suspects (name) VALUES ('test')\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("VALIDATION_ERROR"));
    }

    @Test
    void executeQueryMissingCaseScope() throws Exception {
        mockMvc.perform(post("/api/query/execute")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"caseId\":1,\"query\":\"SELECT * FROM suspects\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("VALIDATION_ERROR"));
    }

    @Test
    void executeQueryForbiddenTable() throws Exception {
        mockMvc.perform(post("/api/query/execute")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"caseId\":1,\"query\":\"SELECT * FROM users WHERE case_id = 1\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("VALIDATION_ERROR"));
    }

    @Test
    void executeQueryEmptyBody() throws Exception {
        mockMvc.perform(post("/api/query/execute")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("INVALID_REQUEST"));
    }

    @Test
    void executeQueryWrongCaseScope() throws Exception {
        mockMvc.perform(post("/api/query/execute")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"caseId\":1,\"query\":\"SELECT * FROM suspects WHERE case_id = 999\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("VALIDATION_ERROR"));
    }
}