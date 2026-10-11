package com.queryandclue.backend.dto;

public class AccusationRequest {

    private int accusedSuspectId;
    private String motive;
    private String explanation;

    public AccusationRequest() {
    }

    public AccusationRequest(int accusedSuspectId, String motive, String explanation) {
        this.accusedSuspectId = accusedSuspectId;
        this.motive = motive;
        this.explanation = explanation;
    }

    public int getAccusedSuspectId() {
        return accusedSuspectId;
    }

    public void setAccusedSuspectId(int accusedSuspectId) {
        this.accusedSuspectId = accusedSuspectId;
    }

    public String getMotive() {
        return motive;
    }

    public void setMotive(String motive) {
        this.motive = motive;
    }

    public String getExplanation() {
        return explanation;
    }

    public void setExplanation(String explanation) {
        this.explanation = explanation;
    }
}