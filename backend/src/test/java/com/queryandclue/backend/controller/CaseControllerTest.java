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

    private Case sampleCase;

    @BeforeEach
    void setUp() {
        sampleCase = new Case();
        sampleCase.setCaseId(1);
        sampleCase.setTitle("The Midnight Ledger");
        sampleCase.setDifficulty("Easy");
        sampleCase.setCrimeType("Theft");
    }

    @Test
    void testGetAllCases() {
        when(caseRepository.findAll()).thenReturn(List.of(sampleCase));

        List<Case> cases = caseController.getAllCases();

        assertNotNull(cases);
        assertEquals(1, cases.size());
        assertEquals("The Midnight Ledger", cases.get(0).getTitle());
        verify(caseRepository, times(1)).findAll();
    }

    @Test
    void testGetCaseByIdFound() {
        when(caseRepository.findById(1)).thenReturn(Optional.of(sampleCase));

        ResponseEntity<Case> response = caseController.getCaseById(1);

        assertEquals(200, response.getStatusCode().value());
        assertNotNull(response.getBody());
        assertEquals(1, response.getBody().getCaseId());
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
        Suspect s = new Suspect();
        s.setSuspectId(1);
        s.setName("Daniel Carter");
        when(suspectRepository.findByCaseId(1)).thenReturn(List.of(s));

        ResponseEntity<List<Suspect>> response = caseController.getSuspectsByCaseId(1);

        assertEquals(200, response.getStatusCode().value());
        assertNotNull(response.getBody());
        assertEquals(1, response.getBody().size());
        assertEquals("Daniel Carter", response.getBody().get(0).getName());
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
        Evidence ev = new Evidence();
        ev.setEvidenceId(1);
        ev.setDescription("Broken desk drawer");
        when(evidenceRepository.findByCaseId(1)).thenReturn(List.of(ev));

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
}
