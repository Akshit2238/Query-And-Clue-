package com.queryandclue.backend.validator;

import java.util.ArrayList;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

import com.queryandclue.backend.generated.GeneratedCase;

class CaseValidatorTest {

    private CaseValidator caseValidator;
    private GeneratedCase sampleCase;

    @BeforeEach
    void setUp() {
        caseValidator = new CaseValidator();
        sampleCase = new GeneratedCase();

        // 1. Case data
        GeneratedCase.CaseData cd = new GeneratedCase.CaseData();
        cd.setTitle("The Phantom Break-in");
        cd.setDescription("A server room was breached.");
        cd.setCrimeType("Sabotage");
        cd.setDifficulty("Medium");
        cd.setCrimeDate("2026-10-15");
        sampleCase.setCaseData(cd);

        // 2. Victim
        GeneratedCase.Victim v = new GeneratedCase.Victim();
        v.setName("Wayne Enterprise");
        v.setAge(45);
        v.setOccupation("CEO");
        v.setCauseOfCrime("Industrial Espionage");
        sampleCase.setVictim(v);

        // 3. Suspects (exactly 4)
        List<GeneratedCase.Suspect> suspects = new ArrayList<>();
        for (String name : List.of("Alice Smith", "Bob Jones", "Charlie Brown", "Diana Prince")) {
            GeneratedCase.Suspect s = new GeneratedCase.Suspect();
            s.setName(name);
            s.setAge(30);
            s.setOccupation("Analyst");
            s.setRelationshipToVictim("Employee");
            s.setMotive("Dispute");
            s.setAlibi("Working from home");
            suspects.add(s);
        }
        sampleCase.setSuspects(suspects);

        // 4. Crime scene
        List<GeneratedCase.CrimeScene> scenes = new ArrayList<>();
        GeneratedCase.CrimeScene cs = new GeneratedCase.CrimeScene();
        cs.setName("Server Room B");
        cs.setLocation("Floor 3");
        cs.setDescription("Door lock damaged.");
        scenes.add(cs);
        sampleCase.setCrimeScenes(scenes);

        // 5. Evidence (5 records)
        List<GeneratedCase.Evidence> evidenceList = new ArrayList<>();
        for (int i = 1; i <= 5; i++) {
            GeneratedCase.Evidence e = new GeneratedCase.Evidence();
            e.setEvidenceType("Exhibit " + i);
            e.setDescription("Sample evidence description " + i);
            e.setLocation("Office Floor 3");
            e.setDateFound("2026-10-15");
            evidenceList.add(e);
        }
        sampleCase.setEvidence(evidenceList);

        // 6. Timeline events (6 records)
        List<GeneratedCase.TimelineEvent> events = new ArrayList<>();
        for (int i = 1; i <= 6; i++) {
            GeneratedCase.TimelineEvent te = new GeneratedCase.TimelineEvent();
            te.setEventTime("2026-10-15T20:0" + i + ":00");
            te.setDescription("Event observed at timestamp " + i);
            events.add(te);
        }
        sampleCase.setTimelineEvents(events);

        // 7. Access logs (4 records)
        List<GeneratedCase.AccessLog> logs = new ArrayList<>();
        for (int i = 0; i < 4; i++) {
            GeneratedCase.AccessLog al = new GeneratedCase.AccessLog();
            al.setSuspectName(suspects.get(i).getName());
            al.setLocation("Server Room B");
            al.setAccessTime("2026-10-15T20:1" + i + ":00");
            al.setExitTime("2026-10-15T20:2" + i + ":00");
            logs.add(al);
        }
        sampleCase.setAccessLogs(logs);

        // 8. Phone records (4 records)
        List<GeneratedCase.PhoneRecord> calls = new ArrayList<>();
        for (int i = 0; i < 4; i++) {
            GeneratedCase.PhoneRecord pr = new GeneratedCase.PhoneRecord();
            pr.setCallerSuspectName(suspects.get(i).getName());
            pr.setReceiverSuspectName(suspects.get((i + 1) % 4).getName());
            pr.setCallTime("2026-10-15T21:0" + i + ":00");
            pr.setCallDuration(120);
            calls.add(pr);
        }
        sampleCase.setPhoneRecords(calls);

        // 9. Transactions (4 records)
        List<GeneratedCase.Transaction> txs = new ArrayList<>();
        for (int i = 0; i < 4; i++) {
            GeneratedCase.Transaction tx = new GeneratedCase.Transaction();
            tx.setSuspectName(suspects.get(i).getName());
            tx.setAmount(500.0);
            tx.setTransactionDate("2026-10-15");
            tx.setDescription("Hardware purchase " + i);
            txs.add(tx);
        }
        sampleCase.setTransactions(txs);

        // 10. Solution
        GeneratedCase.Solution sol = new GeneratedCase.Solution();
        sol.setCulpritSuspectName("Alice Smith");
        sol.setMotive("Retaliation");
        sol.setCrimeMethod("Badge spoofing");
        sol.setExplanation("Alice was caught in access logs entering at 20:10.");
        sampleCase.setSolution(sol);
    }

    @Test
    void validate_whenCaseValidAndSolvable_returnsTrue() {
        assertTrue(caseValidator.validate(sampleCase));
    }

    @Test
    void validate_whenCulpritNotInSuspectList_returnsFalse() {
        sampleCase.getSolution().setCulpritSuspectName("Unknown Intruder");
        assertFalse(caseValidator.validate(sampleCase), "Culprit must match one of the 4 suspects");
    }

    @Test
    void validate_whenCulpritHasNoForensicRecord_returnsFalse() {
        // Change culprit to Diana Prince, but remove Diana from all logs, transactions, and calls
        sampleCase.getSolution().setCulpritSuspectName("Diana Prince");
        sampleCase.getAccessLogs().removeIf(l -> l.getSuspectName().equalsIgnoreCase("Diana Prince"));
        sampleCase.getTransactions().removeIf(t -> t.getSuspectName().equalsIgnoreCase("Diana Prince"));
        sampleCase.getPhoneRecords().removeIf(p -> p.getCallerSuspectName().equalsIgnoreCase("Diana Prince") || p.getReceiverSuspectName().equalsIgnoreCase("Diana Prince"));

        assertFalse(caseValidator.validate(sampleCase), "Solvability check must fail when culprit has no forensic activity recorded");
    }

    @Test
    void validate_whenDifficultyInvalid_returnsFalse() {
        sampleCase.getCaseData().setDifficulty("IMPOSSIBLE");
        assertFalse(caseValidator.validate(sampleCase), "Invalid difficulty must be rejected");

        sampleCase.getCaseData().setDifficulty("");
        assertFalse(caseValidator.validate(sampleCase), "Blank difficulty must be rejected");

        sampleCase.getCaseData().setDifficulty(null);
        assertFalse(caseValidator.validate(sampleCase), "Null difficulty must be rejected");
    }

    @Test
    void validate_whenDifficultyValid_returnsTrue() {
        for (String diff : List.of("EASY", "MEDIUM", "HARD", "easy", "Medium", "hard")) {
            sampleCase.getCaseData().setDifficulty(diff);
            assertTrue(caseValidator.validate(sampleCase), "Valid difficulty should be accepted: " + diff);
        }
    }
}