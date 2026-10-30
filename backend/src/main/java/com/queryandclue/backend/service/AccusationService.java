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
    }

    public AccusationResult submitAccusation(int caseId, AccusationRequest request) {
        CaseSolution solution = caseSolutionRepository.findByCaseId(caseId)
                .orElseThrow(() -> new IllegalArgumentException("Case solution not found for case " + caseId));

        boolean correct = request.getAccusedSuspectId() == solution.getCulpritSuspectId();

        String feedback;
        AccusationResult.CaseSolution solutionDto;

        if (correct) {
            feedback = "Warrant Approved. Confession secured. " + solution.getExplanation();
            solutionDto = new AccusationResult.CaseSolution(
                    solution.getCulpritSuspectId(),
                    solution.getMotive(),
                    solution.getCrimeMethod(),
                    solution.getExplanation());
        } else {
            String[] contradictionHints = {
                "Warrant Denied: Badge swipe records in access_logs contradict this suspect's opportunity during the incident window.",
                "Warrant Denied: Financial transactions show no motive or illicit monetary transfers linked to this suspect.",
                "Warrant Denied: Phone records indicate this individual was communicating with outside parties during the incident window.",
                "Warrant Denied: Physical forensic evidence recovered on scene contradicts this suspect's alleged involvement."
            };
            int hintIdx = Math.abs((request.getAccusedSuspectId() * 37 + caseId)) % contradictionHints.length;
            feedback = contradictionHints[hintIdx];
            // Do not leak solution on incorrect accusation
            solutionDto = null;
        }

        return new AccusationResult(correct, feedback, solutionDto);
    }
}
