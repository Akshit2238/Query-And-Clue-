package com.queryandclue.backend.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "final_accusations")
public class FinalAccusation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int accusationId;

    private int userId;
    private int caseId;
    private int accusedSuspectId;
    private String motive;
    private String explanation;
    private LocalDateTime submittedAt;
    private String result;

    public int getAccusationId() {
        return accusationId;
    }

    public void setAccusationId(int accusationId) {
        this.accusationId = accusationId;
    }

    public int getUserId() {
        return userId;
    }

    public void setUserId(int userId) {
        this.userId = userId;
    }

    public int getCaseId() {
        return caseId;
    }

    public void setCaseId(int caseId) {
        this.caseId = caseId;
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

    public LocalDateTime getSubmittedAt() {
        return submittedAt;
    }

    public void setSubmittedAt(LocalDateTime submittedAt) {
        this.submittedAt = submittedAt;
    }

    public String getResult() {
        return result;
    }

    public void setResult(String result) {
        this.result = result;
    }
}