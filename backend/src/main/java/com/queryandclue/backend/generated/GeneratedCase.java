package com.queryandclue.backend.generated;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonProperty;

public class GeneratedCase {

    @JsonProperty("case")
private CaseData caseData;
    private Victim victim;
    private List<Suspect> suspects;
    private List<CrimeScene> crimeScenes;
    private List<Evidence> evidence;
    private List<TimelineEvent> timelineEvents;
    private List<AccessLog> accessLogs;
    private List<PhoneRecord> phoneRecords;
    private List<Transaction> transactions;
    private Solution solution;

    // Getters and Setters

    public CaseData getCaseData() {
        return caseData;
    }

    public void setCaseData(CaseData caseData) {
        this.caseData = caseData;
    }

    public Victim getVictim() {
        return victim;
    }

    public void setVictim(Victim victim) {
        this.victim = victim;
    }

    public List<Suspect> getSuspects() {
        return suspects;
    }

    public void setSuspects(List<Suspect> suspects) {
        this.suspects = suspects;
    }

    public List<CrimeScene> getCrimeScenes() {
        return crimeScenes;
    }

    public void setCrimeScenes(List<CrimeScene> crimeScenes) {
        this.crimeScenes = crimeScenes;
    }

    public List<Evidence> getEvidence() {
        return evidence;
    }

    public void setEvidence(List<Evidence> evidence) {
        this.evidence = evidence;
    }

    public List<TimelineEvent> getTimelineEvents() {
        return timelineEvents;
    }

    public void setTimelineEvents(List<TimelineEvent> timelineEvents) {
        this.timelineEvents = timelineEvents;
    }

    public List<AccessLog> getAccessLogs() {
        return accessLogs;
    }

    public void setAccessLogs(List<AccessLog> accessLogs) {
        this.accessLogs = accessLogs;
    }

    public List<PhoneRecord> getPhoneRecords() {
        return phoneRecords;
    }

    public void setPhoneRecords(List<PhoneRecord> phoneRecords) {
        this.phoneRecords = phoneRecords;
    }

    public List<Transaction> getTransactions() {
        return transactions;
    }

    public void setTransactions(List<Transaction> transactions) {
        this.transactions = transactions;
    }

    public Solution getSolution() {
        return solution;
    }

    public void setSolution(Solution solution) {
        this.solution = solution;
    }


    // =========================
    // CASE
    // =========================

    public static class CaseData {

        private String title;
        private String description;
        private String difficulty;
        private String crimeDate;
        private String crimeType;

        public String getTitle() {
            return title;
        }

        public void setTitle(String title) {
            this.title = title;
        }

        public String getDescription() {
            return description;
        }

        public void setDescription(String description) {
            this.description = description;
        }

        public String getDifficulty() {
            return difficulty;
        }

        public void setDifficulty(String difficulty) {
            this.difficulty = difficulty;
        }

        public String getCrimeDate() {
            return crimeDate;
        }

        public void setCrimeDate(String crimeDate) {
            this.crimeDate = crimeDate;
        }

        public String getCrimeType() {
            return crimeType;
        }

        public void setCrimeType(String crimeType) {
            this.crimeType = crimeType;
        }
    }


    // =========================
    // VICTIM
    // =========================

    public static class Victim {

        private String name;
        private int age;
        private String occupation;
        private String causeOfCrime;

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public int getAge() {
            return age;
        }

        public void setAge(int age) {
            this.age = age;
        }

        public String getOccupation() {
            return occupation;
        }

        public void setOccupation(String occupation) {
            this.occupation = occupation;
        }

        public String getCauseOfCrime() {
            return causeOfCrime;
        }

        public void setCauseOfCrime(String causeOfCrime) {
            this.causeOfCrime = causeOfCrime;
        }
    }


    // =========================
    // SUSPECT
    // =========================

    public static class Suspect {

        private String name;
        private int age;
        private String occupation;
        private String relationshipToVictim;
        private String motive;
        private String alibi;

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public int getAge() {
            return age;
        }

        public void setAge(int age) {
            this.age = age;
        }

        public String getOccupation() {
            return occupation;
        }

        public void setOccupation(String occupation) {
            this.occupation = occupation;
        }

        public String getRelationshipToVictim() {
            return relationshipToVictim;
        }

        public void setRelationshipToVictim(String relationshipToVictim) {
            this.relationshipToVictim = relationshipToVictim;
        }

        public String getMotive() {
            return motive;
        }

        public void setMotive(String motive) {
            this.motive = motive;
        }

        public String getAlibi() {
            return alibi;
        }

        public void setAlibi(String alibi) {
            this.alibi = alibi;
        }
    }


    // =========================
    // CRIME SCENE
    // =========================

    public static class CrimeScene {

        private String name;
        private String location;
        private String description;

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public String getLocation() {
            return location;
        }

        public void setLocation(String location) {
            this.location = location;
        }

        public String getDescription() {
            return description;
        }

        public void setDescription(String description) {
            this.description = description;
        }
    }


    // =========================
    // EVIDENCE
    // =========================

    public static class Evidence {

        private String description;
        private String location;
        private String evidenceType;
        private String dateFound;

        public String getDescription() {
            return description;
        }

        public void setDescription(String description) {
            this.description = description;
        }

        public String getLocation() {
            return location;
        }

        public void setLocation(String location) {
            this.location = location;
        }

        public String getEvidenceType() {
            return evidenceType;
        }

        public void setEvidenceType(String evidenceType) {
            this.evidenceType = evidenceType;
        }

        public String getDateFound() {
            return dateFound;
        }

        public void setDateFound(String dateFound) {
            this.dateFound = dateFound;
        }
    }


    // =========================
    // TIMELINE EVENT
    // =========================

    public static class TimelineEvent {

        private String eventTime;
        private String description;

        public String getEventTime() {
            return eventTime;
        }

        public void setEventTime(String eventTime) {
            this.eventTime = eventTime;
        }

        public String getDescription() {
            return description;
        }

        public void setDescription(String description) {
            this.description = description;
        }
    }


    // =========================
    // ACCESS LOG
    // =========================

    public static class AccessLog {

        private String suspectName;
        private String location;
        private String accessTime;
        private String exitTime;

        public String getSuspectName() {
            return suspectName;
        }

        public void setSuspectName(String suspectName) {
            this.suspectName = suspectName;
        }

        public String getLocation() {
            return location;
        }

        public void setLocation(String location) {
            this.location = location;
        }

        public String getAccessTime() {
            return accessTime;
        }

        public void setAccessTime(String accessTime) {
            this.accessTime = accessTime;
        }

        public String getExitTime() {
            return exitTime;
        }

        public void setExitTime(String exitTime) {
            this.exitTime = exitTime;
        }
    }


    // =========================
    // PHONE RECORD
    // =========================

    public static class PhoneRecord {

        private String callerSuspectName;
        private String receiverSuspectName;
        private String callTime;
        private int callDuration;

        public String getCallerSuspectName() {
            return callerSuspectName;
        }

        public void setCallerSuspectName(String callerSuspectName) {
            this.callerSuspectName = callerSuspectName;
        }

        public String getReceiverSuspectName() {
            return receiverSuspectName;
        }

        public void setReceiverSuspectName(String receiverSuspectName) {
            this.receiverSuspectName = receiverSuspectName;
        }

        public String getCallTime() {
            return callTime;
        }

        public void setCallTime(String callTime) {
            this.callTime = callTime;
        }

        public int getCallDuration() {
            return callDuration;
        }

        public void setCallDuration(int callDuration) {
            this.callDuration = callDuration;
        }
    }


    // =========================
    // TRANSACTION
    // =========================

    public static class Transaction {

        private String suspectName;
        private double amount;
        private String transactionDate;
        private String description;

        public String getSuspectName() {
            return suspectName;
        }

        public void setSuspectName(String suspectName) {
            this.suspectName = suspectName;
        }

        public double getAmount() {
            return amount;
        }

        public void setAmount(double amount) {
            this.amount = amount;
        }

        public String getTransactionDate() {
            return transactionDate;
        }

        public void setTransactionDate(String transactionDate) {
            this.transactionDate = transactionDate;
        }

        public String getDescription() {
            return description;
        }

        public void setDescription(String description) {
            this.description = description;
        }
    }


    // =========================
    // SOLUTION
    // =========================

    public static class Solution {

        private String culpritSuspectName;
        private String motive;
        private String crimeMethod;
        private String explanation;

        public String getCulpritSuspectName() {
            return culpritSuspectName;
        }

        public void setCulpritSuspectName(String culpritSuspectName) {
            this.culpritSuspectName = culpritSuspectName;
        }

        public String getMotive() {
            return motive;
        }

        public void setMotive(String motive) {
            this.motive = motive;
        }

        public String getCrimeMethod() {
            return crimeMethod;
        }

        public void setCrimeMethod(String crimeMethod) {
            this.crimeMethod = crimeMethod;
        }

        public String getExplanation() {
            return explanation;
        }

        public void setExplanation(String explanation) {
            this.explanation = explanation;
        }
    }
}