package com.queryandclue.backend.controller;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import com.queryandclue.backend.dto.WarrantInfo;
import com.queryandclue.backend.entity.Case;
import com.queryandclue.backend.entity.CrimeScene;
import com.queryandclue.backend.entity.Evidence;
import com.queryandclue.backend.entity.Suspect;
import com.queryandclue.backend.repository.CaseRepository;
import com.queryandclue.backend.repository.CrimeSceneRepository;
import com.queryandclue.backend.repository.EvidenceRepository;
import com.queryandclue.backend.repository.SuspectRepository;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CaseControllerTest {

    @Mock
    private CaseRepository caseRepository;

    @Mock
    private SuspectRepository suspectRepository;

    @Mock
    private EvidenceRepository evidenceRepository;

    @Mock
    private CrimeSceneRepository crimeSceneRepository;

    @InjectMocks
    private CaseController caseController;

    private Case testCase;

    @BeforeEach
    void setUp() {
        testCase = new Case();
        testCase.setCaseId(1);
        testCase.setTitle("The Missing Diamond");
        testCase.setDescription("A diamond went missing from the museum.");
        testCase.setDifficulty("Medium");
    }

    @Test
    void testGetAllCases() {
        when(caseRepository.findAll()).thenReturn(List.of(testCase));

        List<Case> cases = caseController.getAllCases();

        assertNotNull(cases);
        assertEquals(1, cases.size());
        assertEquals("The Missing Diamond", cases.get(0).getTitle());
    }

    @Test
    void testGetCaseByIdFound() {
        when(caseRepository.findById(1)).thenReturn(Optional.of(testCase));

        ResponseEntity<Case> response = caseController.getCaseById(1);

        assertEquals(200, response.getStatusCode().value());
        assertNotNull(response.getBody());
        assertEquals("The Missing Diamond", response.getBody().getTitle());
    }

    @Test
    void testGetCaseByIdNotFound() {
        when(caseRepository.findById(999)).thenReturn(Optional.empty());

        ResponseEntity<Case> response = caseController.getCaseById(999);

        assertEquals(404, response.getStatusCode().value());
        assertNull(response.getBody());
    }

    @Test
    void testGetSuspectsByCaseIdFound() {
        when(caseRepository.existsById(1)).thenReturn(true);
        Suspect suspect = new Suspect();
        suspect.setSuspectId(1);
        suspect.setName("John Doe");
        when(suspectRepository.findByCaseId(1)).thenReturn(List.of(suspect));

        ResponseEntity<List<Suspect>> response = caseController.getSuspectsByCaseId(1);

        assertEquals(200, response.getStatusCode().value());
        assertNotNull(response.getBody());
        assertEquals(1, response.getBody().size());
        assertEquals("John Doe", response.getBody().get(0).getName());
    }

    @Test
    void testGetSuspectsByCaseIdNotFound() {
        when(caseRepository.existsById(999)).thenReturn(false);

        ResponseEntity<List<Suspect>> response = caseController.getSuspectsByCaseId(999);

        assertEquals(404, response.getStatusCode().value());
    }

    @Test
    void testGetEvidenceByCaseIdFound() {
        when(caseRepository.existsById(1)).thenReturn(true);
        Evidence evidence = new Evidence();
        evidence.setEvidenceId(1);
        evidence.setDescription("Broken desk drawer");
        when(evidenceRepository.findByCaseId(1)).thenReturn(List.of(evidence));

        ResponseEntity<List<Evidence>> response = caseController.getEvidenceByCaseId(1);

        assertEquals(200, response.getStatusCode().value());
        assertNotNull(response.getBody());
        assertEquals(1, response.getBody().size());
        assertEquals("Broken desk drawer", response.getBody().get(0).getDescription());
    }

    @Test
    void testGetEvidenceByCaseIdNotFound() {
        when(caseRepository.existsById(999)).thenReturn(false);

        ResponseEntity<List<Evidence>> response = caseController.getEvidenceByCaseId(999);

        assertEquals(404, response.getStatusCode().value());
    }

    @Test
    void testGetCrimeScenesByCaseIdFound() {
        when(caseRepository.existsById(1)).thenReturn(true);
        CrimeScene cs = new CrimeScene();
        cs.setSceneId(1);
        cs.setName("Executive Office");
        when(crimeSceneRepository.findByCaseId(1)).thenReturn(List.of(cs));

        ResponseEntity<List<CrimeScene>> response = caseController.getCrimeScenesByCaseId(1);

        assertEquals(200, response.getStatusCode().value());
        assertNotNull(response.getBody());
        assertEquals(1, response.getBody().size());
        assertEquals("Executive Office", response.getBody().get(0).getName());
    }

    @Test
    void testGetCrimeScenesByCaseIdNotFound() {
        when(caseRepository.existsById(999)).thenReturn(false);

        ResponseEntity<List<CrimeScene>> response = caseController.getCrimeScenesByCaseId(999);

        assertEquals(404, response.getStatusCode().value());
    }

    @Test
    void testGetWarrantByCaseIdFound() {
        when(caseRepository.existsById(1)).thenReturn(true);

        ResponseEntity<WarrantInfo> response = caseController.getWarrantByCaseId(1);

        assertEquals(200, response.getStatusCode().value());
        assertNotNull(response.getBody());
        assertEquals(1, response.getBody().getCaseId());
        assertTrue(response.getBody().getWarrantNumber().startsWith("MC-001-W"));
        assertNotNull(response.getBody().getReferenceNumber());
        assertNotNull(response.getBody().getCreatedAt());
        assertTrue(response.getBody().getFormId().contains("OFFICIAL APPREHENSION ORDER"));
    }

    @Test
    void testGetWarrantByCaseIdNotFound() {
        when(caseRepository.existsById(999)).thenReturn(false);

        ResponseEntity<WarrantInfo> response = caseController.getWarrantByCaseId(999);

        assertEquals(404, response.getStatusCode().value());
        assertNull(response.getBody());
    }

    @Test
    void testCaseDefaultDifficulty_WhenNullOrBlank_DefaultsToEasy() {
        Case c = new Case();
        c.setDifficulty(null);
        assertEquals("EASY", c.getDifficulty());

        c.setDifficulty("");
        assertEquals("EASY", c.getDifficulty());

        c.setDifficulty("INVALID_DIFF");
        assertEquals("EASY", c.getDifficulty());
    }

    @Test
    void testCaseDifficulty_WhenValid_ReturnsNormalized() {
        Case c = new Case();
        c.setDifficulty("Hard");
        assertEquals("HARD", c.getDifficulty());

        c.setDifficulty("medium");
        assertEquals("MEDIUM", c.getDifficulty());

        c.setDifficulty("EASY");
        assertEquals("EASY", c.getDifficulty());
    }
}