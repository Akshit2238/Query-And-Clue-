package com.queryandclue.backend.service;

import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.queryandclue.backend.dto.AccusationRequest;
import com.queryandclue.backend.dto.AccusationResult;
import com.queryandclue.backend.entity.CaseSolution;
import com.queryandclue.backend.repository.CaseSolutionRepository;
import com.queryandclue.backend.repository.FinalAccusationRepository;

class AccusationServiceTest {

    private CaseSolutionRepository caseSolutionRepository;
    private FinalAccusationRepository finalAccusationRepository;
    private AccusationService accusationService;

    @BeforeEach
    void setUp() {
        caseSolutionRepository = mock(CaseSolutionRepository.class);
        finalAccusationRepository = mock(FinalAccusationRepository.class);
        accusationService = new AccusationService(caseSolutionRepository, finalAccusationRepository);
    }

    @Test
    void submitAccusation_whenCorrect_returnsApprovalAndSolution() {
        CaseSolution solution = new CaseSolution();
        solution.setCaseId(1);
        solution.setCulpritSuspectId(101);
        solution.setMotive("Embezzlement");
        solution.setCrimeMethod("Badge spoofing");
        solution.setExplanation("Daniel swiped into the office at 21:20.");

        when(caseSolutionRepository.findByCaseId(1)).thenReturn(Optional.of(solution));

        AccusationRequest req = new AccusationRequest();
        req.setAccusedSuspectId(101);
        req.setMotive("Embezzlement");
        req.setExplanation("He stole the ledger.");

        AccusationResult result = accusationService.submitAccusation(1, req);

        assertTrue(result.isCorrect());
        assertTrue(result.getFeedback().contains("Warrant Approved"));
        assertNotNull(result.getSolution());
        assertEquals(101, result.getSolution().getCulpritSuspectId());
    }

    @Test
    void submitAccusation_whenIncorrect_returnsDeniedFeedbackWithoutSolution() {
        CaseSolution solution = new CaseSolution();
        solution.setCaseId(1);
        solution.setCulpritSuspectId(101);
        solution.setMotive("Embezzlement");
        solution.setCrimeMethod("Badge spoofing");
        solution.setExplanation("Daniel swiped into the office at 21:20.");

        when(caseSolutionRepository.findByCaseId(1)).thenReturn(Optional.of(solution));

        AccusationRequest req = new AccusationRequest();
        req.setAccusedSuspectId(102); // Rebecca Torres
        req.setMotive("Contract dispute");
        req.setExplanation("Argument over contract.");

        AccusationResult result = accusationService.submitAccusation(1, req);

        assertFalse(result.isCorrect());
        assertTrue(result.getFeedback().contains("Warrant Denied"));
        assertTrue(result.getFeedback().contains("departure logs") || result.getFeedback().contains("alibi"));
        assertNull(result.getSolution(), "Solution must remain shielded on wrong arrest");
    }

    @Test
    void submitAccusation_whenCaseNotFound_throwsIllegalArgumentException() {
        when(caseSolutionRepository.findByCaseId(999)).thenReturn(Optional.empty());

        AccusationRequest req = new AccusationRequest();
        req.setAccusedSuspectId(101);

        assertThrows(IllegalArgumentException.class, () -> accusationService.submitAccusation(999, req));
    }
}

