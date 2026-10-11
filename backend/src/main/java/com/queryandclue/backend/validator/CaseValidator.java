package com.queryandclue.backend.validator;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

import com.queryandclue.backend.generated.GeneratedCase;

public class CaseValidator {

    public boolean validate(GeneratedCase generatedCase) {

        // =========================
        // 1. BASIC NULL CHECKS
        // =========================

        if (generatedCase == null) {
            return false;
        }

        if (generatedCase.getCaseData() == null) {
            return false;
        }

        if (generatedCase.getVictim() == null) {
            return false;
        }

        if (generatedCase.getSuspects() == null ||
                generatedCase.getSuspects().size() < 4) {
            return false;
        }

        if (generatedCase.getCrimeScenes() == null ||
                generatedCase.getCrimeScenes().isEmpty()) {
            return false;
        }

        if (generatedCase.getEvidence() == null ||
                generatedCase.getEvidence().size() < 5) {
            return false;
        }

        if (generatedCase.getTimelineEvents() == null ||
                generatedCase.getTimelineEvents().size() < 6) {
            return false;
        }

        if (generatedCase.getAccessLogs() == null ||
                generatedCase.getAccessLogs().isEmpty()) {
            return false;
        }

        if (generatedCase.getPhoneRecords() == null ||
                generatedCase.getPhoneRecords().isEmpty()) {
            return false;
        }

        if (generatedCase.getTransactions() == null ||
                generatedCase.getTransactions().isEmpty()) {
            return false;
        }

        if (generatedCase.getSolution() == null) {
            return false;
        }


        // =========================
        // 2. CASE DATA CHECKS
        // =========================

        if (isBlank(generatedCase.getCaseData().getTitle())) {
            return false;
        }

        if (isBlank(generatedCase.getCaseData().getDescription())) {
            return false;
        }

        if (isBlank(generatedCase.getCaseData().getDifficulty())) {
            return false;
        }

        if (isBlank(generatedCase.getCaseData().getCrimeType())) {
            return false;
        }

        if (!isValidDate(generatedCase.getCaseData().getCrimeDate())) {
            return false;
        }


        // =========================
        // 3. VICTIM CHECK
        // =========================

        if (isBlank(generatedCase.getVictim().getName())) {
            return false;
        }

        if (generatedCase.getVictim().getAge() <= 0) {
            return false;
        }

        if (isBlank(generatedCase.getVictim().getOccupation())) {
            return false;
        }

        if (isBlank(generatedCase.getVictim().getCauseOfCrime())) {
            return false;
        }


        // =========================
        // 4. SUSPECT CHECKS
        // =========================

        Set<String> suspectNames = new HashSet<>();

        for (GeneratedCase.Suspect suspect :
                generatedCase.getSuspects()) {

            if (suspect == null) {
                return false;
            }

            if (isBlank(suspect.getName())) {
                return false;
            }

            if (suspect.getAge() <= 0) {
                return false;
            }

            if (isBlank(suspect.getOccupation())) {
                return false;
            }

            if (isBlank(suspect.getRelationshipToVictim())) {
                return false;
            }

            if (isBlank(suspect.getMotive())) {
                return false;
            }

            if (isBlank(suspect.getAlibi())) {
                return false;
            }

            // No duplicate suspect names
            String name = suspect.getName().trim().toLowerCase();

            if (!suspectNames.add(name)) {
                return false;
            }
        }


        // =========================
        // 5. SOLUTION CHECK
        // =========================

        String culpritName =
                generatedCase.getSolution().getCulpritSuspectName();

        if (isBlank(culpritName)) {
            return false;
        }

        if (!suspectNames.contains(
                culpritName.trim().toLowerCase())) {
            return false;
        }

        if (isBlank(generatedCase.getSolution().getMotive())) {
            return false;
        }

        if (isBlank(generatedCase.getSolution().getCrimeMethod())) {
            return false;
        }

        if (isBlank(generatedCase.getSolution().getExplanation())) {
            return false;
        }


        // =========================
        // 6. EVIDENCE CHECK
        // =========================

        for (GeneratedCase.Evidence evidence :
                generatedCase.getEvidence()) {

            if (evidence == null) {
                return false;
            }

            if (isBlank(evidence.getDescription())) {
                return false;
            }

            if (isBlank(evidence.getLocation())) {
                return false;
            }

            if (isBlank(evidence.getEvidenceType())) {
                return false;
            }

            if (!isValidDate(evidence.getDateFound())) {
                return false;
            }
        }


        // =========================
        // 7. TIMELINE CHECK
        // =========================

        for (GeneratedCase.TimelineEvent event :
                generatedCase.getTimelineEvents()) {

            if (event == null) {
                return false;
            }

            if (isBlank(event.getEventTime())) {
                return false;
            }

            if (isBlank(event.getDescription())) {
                return false;
            }

            try {
                LocalDateTime.parse(event.getEventTime());
            } catch (Exception e) {
                return false;
            }
        }


        // =========================
        // 8. ACCESS LOG CHECK
        // =========================

        for (GeneratedCase.AccessLog log :
                generatedCase.getAccessLogs()) {

            if (log == null) {
                return false;
            }

            if (isBlank(log.getSuspectName())) {
                return false;
            }

            if (!suspectNames.contains(
                    log.getSuspectName().trim().toLowerCase())) {
                return false;
            }

            if (isBlank(log.getLocation())) {
                return false;
            }

            if (isBlank(log.getAccessTime()) ||
                    isBlank(log.getExitTime())) {
                return false;
            }

            try {
                LocalDateTime.parse(log.getAccessTime());
                LocalDateTime.parse(log.getExitTime());
            } catch (Exception e) {
                return false;
            }
        }


        // =========================
        // 9. PHONE RECORD CHECK
        // =========================

        for (GeneratedCase.PhoneRecord record :
                generatedCase.getPhoneRecords()) {

            if (record == null) {
                return false;
            }

            if (isBlank(record.getCallerSuspectName()) ||
                    isBlank(record.getReceiverSuspectName())) {
                return false;
            }

            if (!suspectNames.contains(
                    record.getCallerSuspectName()
                            .trim()
                            .toLowerCase())) {
                return false;
            }

            if (!suspectNames.contains(
                    record.getReceiverSuspectName()
                            .trim()
                            .toLowerCase())) {
                return false;
            }

            if (isBlank(record.getCallTime())) {
                return false;
            }

            if (record.getCallDuration() < 0) {
                return false;
            }

            try {
                LocalDateTime.parse(record.getCallTime());
            } catch (Exception e) {
                return false;
            }
        }


        // =========================
        // 10. TRANSACTION CHECK
        // =========================

        for (GeneratedCase.Transaction transaction :
                generatedCase.getTransactions()) {

            if (transaction == null) {
                return false;
            }

            if (isBlank(transaction.getSuspectName())) {
                return false;
            }

            if (!suspectNames.contains(
                    transaction.getSuspectName()
                            .trim()
                            .toLowerCase())) {
                return false;
            }

            if (transaction.getAmount() < 0) {
                return false;
            }

            if (!isValidDate(transaction.getTransactionDate())) {
                return false;
            }

            if (isBlank(transaction.getDescription())) {
                return false;
            }
        }


        return true;
    }

    private boolean isValidDate(String dateStr) {
        if (isBlank(dateStr)) return false;
        try {
            String s = dateStr.trim();
            if (s.contains("T")) s = s.split("T")[0];
            LocalDate.parse(s);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}