package com.queryandclue.backend.service;

import org.springframework.stereotype.Service;

import com.queryandclue.backend.dto.AccusationRequest;
import com.queryandclue.backend.dto.AccusationResult;
import com.queryandclue.backend.entity.CaseSolution;
import com.queryandclue.backend.repository.CaseSolutionRepository;
import com.queryandclue.backend.repository.FinalAccusationRepository;

@Service
public class AccusationService {

    private final CaseSolutionRepository caseSolutionRepository;

    public AccusationService(CaseSolutionRepository caseSolutionRepository,
            FinalAccusationRepository finalAccusationRepository) {
        this.caseSolutionRepository = caseSolutionRepository;
        // finalAccusationRepository omitted until user auth is implemented (avoids FK error)
    }

    public AccusationResult submitAccusation(int caseId, AccusationRequest request) {
        CaseSolution solution = caseSolutionRepository.findByCaseId(caseId)
                .orElseThrow(() -> new IllegalArgumentException("Case solution not found for case " + caseId));

        boolean correct = request.getAccusedSuspectId() == solution.getCulpritSuspectId();

        String feedback = correct
                ? "Correct! You identified the culprit. The arrest warrant has been approved."
                : "Incorrect. The evidence points to a different suspect. Review the clues and try again.";

        AccusationResult.CaseSolution solutionDto = new AccusationResult.CaseSolution(
                solution.getCulpritSuspectId(),
                solution.getMotive(),
                solution.getCrimeMethod(),
                solution.getExplanation());

        return new AccusationResult(correct, feedback, solutionDto);
    }
}