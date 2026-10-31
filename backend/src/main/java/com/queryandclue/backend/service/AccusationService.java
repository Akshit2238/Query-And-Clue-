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
            feedback = getMissedEvidenceFeedback(caseId, request.getAccusedSuspectId());
            // Do not leak solution on incorrect accusation
            solutionDto = null;
        }

        return new AccusationResult(correct, feedback, solutionDto);
    }

    private String getMissedEvidenceFeedback(int caseId, int suspectId) {
        if (caseId == 1) {
            if (suspectId == 102) {
                return "Warrant Denied: You missed her departure logs. Her keycard checked out at 20:30 and parking receipt confirmed her absence during the 21:20 breach.";
            } else if (suspectId == 103) {
                return "Warrant Denied: Alibi verified by recorded dispatch phone logs. This suspect was on a verified 21:15 call with external monitoring.";
            } else if (suspectId == 104) {
                return "Warrant Denied: Off-site bistro dining receipt and phone logs verify this suspect's location well after 21:30.";
            }
        }

        String[] contradictionHints = {
            "Warrant Denied: You missed their alibi timeline. Phone records place this individual in a call outside the crime scene during the critical incident window.",
            "Warrant Denied: Badge swipe records in access_logs confirm this suspect checked out of the perimeter before the incident occurred.",
            "Warrant Denied: Financial transactions show regular verified payroll activity and no illicit transfers or bribery motive linked to this suspect.",
            "Warrant Denied: Physical forensic exhibits from the crime scene match a different physical profile and rule out this individual."
        };
        int hintIdx = Math.abs((suspectId * 37 + caseId)) % contradictionHints.length;
        return contradictionHints[hintIdx];
    }
}
