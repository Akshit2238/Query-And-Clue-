package com.queryandclue.backend.service;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.queryandclue.backend.entity.AccessLog;
import com.queryandclue.backend.entity.Case;
import com.queryandclue.backend.entity.CaseSolution;
import com.queryandclue.backend.entity.CrimeScene;
import com.queryandclue.backend.entity.Evidence;
import com.queryandclue.backend.entity.PhoneRecord;
import com.queryandclue.backend.entity.Suspect;
import com.queryandclue.backend.entity.TimelineEvent;
import com.queryandclue.backend.entity.Transaction;
import com.queryandclue.backend.entity.Victim;
import com.queryandclue.backend.generated.GeneratedCase;
import com.queryandclue.backend.repository.AccessLogRepository;
import com.queryandclue.backend.repository.CaseRepository;
import com.queryandclue.backend.repository.CaseSolutionRepository;
import com.queryandclue.backend.repository.CrimeSceneRepository;
import com.queryandclue.backend.repository.EvidenceRepository;
import com.queryandclue.backend.repository.PhoneRecordRepository;
import com.queryandclue.backend.repository.SuspectRepository;
import com.queryandclue.backend.repository.TimelineEventRepository;
import com.queryandclue.backend.repository.TransactionRepository;
import com.queryandclue.backend.repository.VictimRepository;

@Service
public class CaseSaveService {

    private final CaseSolutionRepository caseSolutionRepository;
    private final CaseRepository caseRepository;
    private final SuspectRepository suspectRepository;
    private final VictimRepository victimRepository;
    private final CrimeSceneRepository crimeSceneRepository;
    private final EvidenceRepository evidenceRepository;
    private final TimelineEventRepository timelineEventRepository;
    private final AccessLogRepository accessLogRepository;
    private final PhoneRecordRepository phoneRecordRepository;
    private final TransactionRepository transactionRepository;

    public CaseSaveService(
            CaseSolutionRepository caseSolutionRepository,
            CaseRepository caseRepository,
            SuspectRepository suspectRepository,
            VictimRepository victimRepository,
            CrimeSceneRepository crimeSceneRepository,
            EvidenceRepository evidenceRepository,
            TimelineEventRepository timelineEventRepository,
            AccessLogRepository accessLogRepository,
            PhoneRecordRepository phoneRecordRepository,
            TransactionRepository transactionRepository) {

        this.caseSolutionRepository = caseSolutionRepository;
        this.caseRepository = caseRepository;
        this.suspectRepository = suspectRepository;
        this.victimRepository = victimRepository;
        this.crimeSceneRepository = crimeSceneRepository;
        this.evidenceRepository = evidenceRepository;
        this.timelineEventRepository = timelineEventRepository;
        this.accessLogRepository = accessLogRepository;
        this.phoneRecordRepository = phoneRecordRepository;
        this.transactionRepository = transactionRepository;
    }

    @Transactional
    public void saveGeneratedCase(GeneratedCase generatedCase) {

        // =========================
        // 1. SAVE CASE
        // =========================

        Case newCase = new Case();

        newCase.setTitle(generatedCase.getCaseData().getTitle());
        newCase.setDescription(generatedCase.getCaseData().getDescription());
        newCase.setDifficulty(generatedCase.getCaseData().getDifficulty());
        newCase.setCrimeType(generatedCase.getCaseData().getCrimeType());

        if (generatedCase.getCaseData().getCrimeDate() != null
                && !generatedCase.getCaseData().getCrimeDate().isBlank()) {

            newCase.setCrimeDate(
                    LocalDate.parse(
                            generatedCase.getCaseData().getCrimeDate()
                    )
            );
        }

        Case savedCase = caseRepository.save(newCase);

        int caseId = savedCase.getCaseId();


        // =========================
        // 2. SAVE VICTIM
        // =========================

        GeneratedCase.Victim generatedVictim =
                generatedCase.getVictim();

        Victim victim = new Victim();

        victim.setCaseId(caseId);
        victim.setName(generatedVictim.getName());
        victim.setAge(generatedVictim.getAge());
        victim.setOccupation(generatedVictim.getOccupation());
        victim.setCauseOfCrime(generatedVictim.getCauseOfCrime());

        victimRepository.save(victim);


        // =========================
        // 3. SAVE SUSPECTS
        // =========================

        Map<String, Integer> suspectIds = new HashMap<>();

        for (GeneratedCase.Suspect generatedSuspect
                : generatedCase.getSuspects()) {

            Suspect suspect = new Suspect();

            suspect.setCaseId(caseId);
            suspect.setName(generatedSuspect.getName());
            suspect.setAge(generatedSuspect.getAge());
            suspect.setOccupation(generatedSuspect.getOccupation());
            suspect.setRelationshipToVictim(
                    generatedSuspect.getRelationshipToVictim()
            );
            suspect.setMotive(generatedSuspect.getMotive());
            suspect.setAlibi(generatedSuspect.getAlibi());

            Suspect savedSuspect =
                    suspectRepository.save(suspect);

            // Store:
            // suspect name -> database suspect ID
            suspectIds.put(
                    generatedSuspect.getName().toLowerCase(),
                    savedSuspect.getSuspectId()
            );
        }


        // =========================
        // 4. SAVE CRIME SCENES
        // =========================

        for (GeneratedCase.CrimeScene generatedScene
                : generatedCase.getCrimeScenes()) {

            CrimeScene crimeScene = new CrimeScene();

            crimeScene.setCaseId(caseId);
            crimeScene.setName(generatedScene.getName());
            crimeScene.setLocation(generatedScene.getLocation());
            crimeScene.setDescription(
                    generatedScene.getDescription()
            );

            crimeSceneRepository.save(crimeScene);
        }


        // =========================
        // 5. SAVE EVIDENCE
        // =========================

        for (GeneratedCase.Evidence generatedEvidence
                : generatedCase.getEvidence()) {

            Evidence evidence = new Evidence();

            evidence.setCaseId(caseId);
            evidence.setDescription(
                    generatedEvidence.getDescription()
            );
            evidence.setLocation(
                    generatedEvidence.getLocation()
            );
            evidence.setEvidenceType(
                    generatedEvidence.getEvidenceType()
            );
            evidence.setDateFound(
                    generatedEvidence.getDateFound()
            );

            evidenceRepository.save(evidence);
        }


        // =========================
        // 6. SAVE TIMELINE EVENTS
        // =========================

        for (GeneratedCase.TimelineEvent generatedEvent
                : generatedCase.getTimelineEvents()) {

            TimelineEvent timelineEvent = new TimelineEvent();

            timelineEvent.setCaseId(caseId);
            timelineEvent.setEventTime(
                    generatedEvent.getEventTime()
            );
            timelineEvent.setDescription(
                    generatedEvent.getDescription()
            );

            timelineEventRepository.save(timelineEvent);
        }


        // =========================
        // 7. SAVE ACCESS LOGS
        // =========================

        for (GeneratedCase.AccessLog generatedLog
                : generatedCase.getAccessLogs()) {

            Integer suspectId = suspectIds.get(
                    generatedLog.getSuspectName().toLowerCase()
            );

            if (suspectId == null) {
                throw new RuntimeException(
                        "Suspect not found: "
                                + generatedLog.getSuspectName()
                );
            }

            AccessLog accessLog = new AccessLog();

            accessLog.setSuspectId(suspectId);
            accessLog.setCaseId(caseId);
            accessLog.setLocation(
                    generatedLog.getLocation()
            );
            accessLog.setAccessTime(
                    generatedLog.getAccessTime()
            );
            accessLog.setExitTime(
                    generatedLog.getExitTime()
            );

            accessLogRepository.save(accessLog);
        }


        // =========================
        // 8. SAVE PHONE RECORDS
        // =========================

        for (GeneratedCase.PhoneRecord generatedRecord
                : generatedCase.getPhoneRecords()) {

            Integer callerId = suspectIds.get(
                    generatedRecord
                            .getCallerSuspectName()
                            .toLowerCase()
            );

            Integer receiverId = suspectIds.get(
                    generatedRecord
                            .getReceiverSuspectName()
                            .toLowerCase()
            );

            if (callerId == null) {
                throw new RuntimeException(
                        "Caller suspect not found: "
                                + generatedRecord
                                .getCallerSuspectName()
                );
            }

            if (receiverId == null) {
                throw new RuntimeException(
                        "Receiver suspect not found: "
                                + generatedRecord
                                .getReceiverSuspectName()
                );
            }

            PhoneRecord phoneRecord = new PhoneRecord();

            phoneRecord.setCaseId(caseId);
            phoneRecord.setCallerSuspectId(callerId);
            phoneRecord.setReceiverSuspectId(receiverId);
            phoneRecord.setCallTime(
                    generatedRecord.getCallTime()
            );
            phoneRecord.setCallDuration(
                    generatedRecord.getCallDuration()
            );

            phoneRecordRepository.save(phoneRecord);
        }


        // =========================
        // 9. SAVE TRANSACTIONS
        // =========================

        for (GeneratedCase.Transaction generatedTransaction
                : generatedCase.getTransactions()) {

            Integer suspectId = suspectIds.get(
                    generatedTransaction
                            .getSuspectName()
                            .toLowerCase()
            );

            if (suspectId == null) {
                throw new RuntimeException(
                        "Suspect not found: "
                                + generatedTransaction
                                .getSuspectName()
                );
            }

            Transaction transaction = new Transaction();

            transaction.setCaseId(caseId);
            transaction.setSuspectId(suspectId);
            transaction.setAmount(
                    generatedTransaction.getAmount()
            );
            transaction.setTransactionDate(
                    generatedTransaction.getTransactionDate()
            );
            transaction.setDescription(
                    generatedTransaction.getDescription()
            );

            transactionRepository.save(transaction);
        }


        // =========================
        // 10. SAVE HIDDEN SOLUTION
        // =========================

        GeneratedCase.Solution generatedSolution =
                generatedCase.getSolution();

        Integer culpritId = suspectIds.get(
                generatedSolution
                        .getCulpritSuspectName()
                        .toLowerCase()
        );

        if (culpritId == null) {
            throw new RuntimeException(
                    "Culprit suspect not found: "
                            + generatedSolution
                            .getCulpritSuspectName()
            );
        }

        CaseSolution caseSolution = new CaseSolution();

        caseSolution.setCaseId(caseId);
        caseSolution.setCulpritSuspectId(culpritId);
        caseSolution.setMotive(
                generatedSolution.getMotive()
        );
        caseSolution.setCrimeMethod(
                generatedSolution.getCrimeMethod()
        );
        caseSolution.setExplanation(
                generatedSolution.getExplanation()
        );

        caseSolutionRepository.save(caseSolution);
    }
}