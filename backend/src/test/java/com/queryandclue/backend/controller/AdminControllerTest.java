package com.queryandclue.backend.controller;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import com.queryandclue.backend.entity.Case;
import com.queryandclue.backend.entity.CaseSolution;
import com.queryandclue.backend.entity.Suspect;
import com.queryandclue.backend.generated.GeneratedCase;
import com.queryandclue.backend.repository.CaseRepository;
import com.queryandclue.backend.repository.CaseSolutionRepository;
import com.queryandclue.backend.repository.SuspectRepository;
import com.queryandclue.backend.service.AICaseGeneratorService;
import com.queryandclue.backend.service.CaseSaveService;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for AdminController.
 * Uses subclasses for concrete services (AICaseGeneratorService, CaseSaveService)
 * and Mockito for JPA repository interfaces to support Java 25+ without Byte Buddy class retransformation.
 */
@ExtendWith(MockitoExtension.class)
class AdminControllerTest {

    @Mock
    private CaseRepository caseRepository;

    @Mock
    private CaseSolutionRepository caseSolutionRepository;

    @Mock
    private SuspectRepository suspectRepository;

    private StubAICaseGeneratorService aiCaseGeneratorService;
    private StubCaseSaveService caseSaveService;
    private AdminController adminController;

    private Case testCase;
    private static final String VALID_KEY = "queryadmin";
    private static final String INVALID_KEY = "wrongkey";

    @BeforeEach
    void setUp() {
        aiCaseGeneratorService = new StubAICaseGeneratorService();
        caseSaveService = new StubCaseSaveService();
        adminController = new AdminController(
            aiCaseGeneratorService,
            caseSaveService,
            caseRepository,
            caseSolutionRepository,
            suspectRepository
        );

        testCase = new Case();
        testCase.setCaseId(1);
        testCase.setTitle("The Midnight Ledger");
        testCase.setCrimeType("Theft");
        testCase.setDescription("Ledger stolen from executive office.");
        testCase.setDifficulty("Easy");
    }

    @Test
    void testAdminGenerate_UnauthorizedWhenKeyMissingOrInvalid() {
        ResponseEntity<?> respMissing = adminController.adminGenerate(null);
        assertEquals(HttpStatus.UNAUTHORIZED, respMissing.getStatusCode());

        ResponseEntity<?> respInvalid = adminController.adminGenerate(INVALID_KEY);
        assertEquals(HttpStatus.UNAUTHORIZED, respInvalid.getStatusCode());

        assertEquals(0, aiCaseGeneratorService.generateCount);
    }

    @Test
    void testGetAllCases_UnauthorizedWhenKeyInvalid() {
        ResponseEntity<?> resp = adminController.getAllCases(INVALID_KEY);
        assertEquals(HttpStatus.UNAUTHORIZED, resp.getStatusCode());
        verify(caseRepository, never()).findAll();
    }

    @Test
    void testGetAllCases_Success() {
        when(caseRepository.findAll()).thenReturn(List.of(testCase));

        ResponseEntity<?> resp = adminController.getAllCases(VALID_KEY);

        assertEquals(HttpStatus.OK, resp.getStatusCode());
        @SuppressWarnings("unchecked")
        List<Case> cases = (List<Case>) resp.getBody();
        assertNotNull(cases);
        assertEquals(1, cases.size());
        assertEquals("The Midnight Ledger", cases.get(0).getTitle());
    }

    @Test
    void testUpdateCase_UnauthorizedWhenKeyInvalid() {
        ResponseEntity<?> resp = adminController.updateCase(1, Map.of("title", "New Title"), INVALID_KEY);
        assertEquals(HttpStatus.UNAUTHORIZED, resp.getStatusCode());
        verify(caseRepository, never()).findById(any());
    }

    @Test
    void testUpdateCase_NotFound() {
        when(caseRepository.findById(999)).thenReturn(Optional.empty());

        ResponseEntity<?> resp = adminController.updateCase(999, Map.of("title", "New Title"), VALID_KEY);

        assertEquals(HttpStatus.NOT_FOUND, resp.getStatusCode());
    }

    @Test
    void testUpdateCase_Success() {
        when(caseRepository.findById(1)).thenReturn(Optional.of(testCase));
        when(caseRepository.save(any(Case.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Map<String, String> updates = Map.of(
            "title", "Updated Title",
            "crimeType", "Homicide",
            "description", "Updated narrative",
            "difficulty", "Hard"
        );

        ResponseEntity<?> resp = adminController.updateCase(1, updates, VALID_KEY);

        assertEquals(HttpStatus.OK, resp.getStatusCode());
        Case updated = (Case) resp.getBody();
        assertNotNull(updated);
        assertEquals("Updated Title", updated.getTitle());
        assertEquals("Homicide", updated.getCrimeType());
        assertEquals("Updated narrative", updated.getDescription());
        assertEquals("HARD", updated.getDifficulty());
        verify(caseRepository).save(testCase);
    }

    @Test
    void testGetCaseSolution_UnauthorizedWhenKeyInvalid() {
        ResponseEntity<?> resp = adminController.getCaseSolution(1, INVALID_KEY);
        assertEquals(HttpStatus.UNAUTHORIZED, resp.getStatusCode());
        verify(caseSolutionRepository, never()).findByCaseId(anyInt());
    }

    @Test
    void testGetCaseSolution_NotFoundWhenSolutionMissing() {
        when(caseSolutionRepository.findByCaseId(999)).thenReturn(Optional.empty());

        ResponseEntity<?> resp = adminController.getCaseSolution(999, VALID_KEY);

        assertEquals(HttpStatus.NOT_FOUND, resp.getStatusCode());
    }

    @Test
    void testGetCaseSolution_SuccessWithCulpritAndHintQueries() {
        CaseSolution solution = new CaseSolution();
        solution.setCaseId(1);
        solution.setCulpritSuspectId(101);
        solution.setMotive("Embezzlement cover-up");
        solution.setCrimeMethod("Stole ledger from safe");
        solution.setExplanation("Altered balances exposed");

        Suspect culprit = new Suspect();
        culprit.setSuspectId(101);
        culprit.setName("Daniel Vance");

        when(caseSolutionRepository.findByCaseId(1)).thenReturn(Optional.of(solution));
        when(suspectRepository.findById(101)).thenReturn(Optional.of(culprit));

        ResponseEntity<?> resp = adminController.getCaseSolution(1, VALID_KEY);

        assertEquals(HttpStatus.OK, resp.getStatusCode());
        @SuppressWarnings("unchecked")
        Map<String, Object> body = (Map<String, Object>) resp.getBody();
        assertNotNull(body);
        assertEquals(1, body.get("caseId"));
        assertEquals("Daniel Vance", body.get("culpritName"));
        assertEquals("Embezzlement cover-up", body.get("motive"));
        assertEquals("Stole ledger from safe", body.get("crimeMethod"));
        assertEquals("Altered balances exposed", body.get("explanation"));

        @SuppressWarnings("unchecked")
        List<String> hints = (List<String>) body.get("hintQueries");
        assertNotNull(hints);
        assertFalse(hints.isEmpty());
        assertTrue(hints.get(0).contains("SELECT * FROM suspects"));
    }


    @Test
    void testAdminGenerate_InvalidDifficulty_ReturnsBadRequest() {
        ResponseEntity<?> resp = adminController.adminGenerate(VALID_KEY, "EXTREME");
        assertEquals(HttpStatus.BAD_REQUEST, resp.getStatusCode());
    }

    @Test
    void testUpdateCase_InvalidDifficulty_ReturnsBadRequest() {
        ResponseEntity<?> resp = adminController.updateCase(1, Map.of("difficulty", "INVALID_DIFF"), VALID_KEY);
        assertEquals(HttpStatus.BAD_REQUEST, resp.getStatusCode());
    }

    // --- Minimal Stub Classes avoiding Java 25 Byte Buddy class instrumentation ---
    private static class StubAICaseGeneratorService extends AICaseGeneratorService {
        int generateCount = 0;
        StubAICaseGeneratorService() { super(null); }
        @Override public GeneratedCase generateCase() {
            generateCount++;
            return null;
        }
        @Override public GeneratedCase generateCase(String diff) {
            generateCount++;
            return null;
        }
    }

    private static class StubCaseSaveService extends CaseSaveService {
        StubCaseSaveService() { super(null, null, null, null, null, null, null, null, null, null); }
        @Override public boolean titleExists(String title) { return false; }
        @Override public Case saveGeneratedCase(GeneratedCase c) { return null; }
    }
}
