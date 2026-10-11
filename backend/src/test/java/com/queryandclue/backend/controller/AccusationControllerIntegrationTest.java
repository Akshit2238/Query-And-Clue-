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
class AccusationControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void submitCorrectAccusation() throws Exception {
        mockMvc.perform(post("/api/cases/1/accusation")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"accusedSuspectId\":1,\"motive\":\"Test motive\",\"explanation\":\"Test explanation\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.correct").exists())
                .andExpect(jsonPath("$.feedback").exists())
                .andExpect(jsonPath("$.solution").exists());
    }

    @Test
    void submitAccusationMissingSuspect() throws Exception {
        mockMvc.perform(post("/api/cases/1/accusation")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"motive\":\"Test motive\",\"explanation\":\"Test explanation\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("INVALID_REQUEST"));
    }

    @Test
    void submitAccusationMissingExplanation() throws Exception {
        mockMvc.perform(post("/api/cases/1/accusation")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"accusedSuspectId\":1,\"motive\":\"Test motive\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("INVALID_REQUEST"));
    }

    @Test
    void submitAccusationEmptyExplanation() throws Exception {
        mockMvc.perform(post("/api/cases/1/accusation")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"accusedSuspectId\":1,\"motive\":\"Test motive\",\"explanation\":\"\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("INVALID_REQUEST"));
    }
}