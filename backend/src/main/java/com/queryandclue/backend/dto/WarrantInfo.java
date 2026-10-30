package com.queryandclue.backend.dto;

import java.time.Instant;

public class WarrantInfo {

    private int caseId;
    private String warrantNumber;
    private String referenceNumber;
    private Instant createdAt;
    private String formId;

    public WarrantInfo() {
    }

    public WarrantInfo(int caseId, String warrantNumber, String referenceNumber, Instant createdAt, String formId) {
        this.caseId = caseId;
        this.warrantNumber = warrantNumber;
        this.referenceNumber = referenceNumber;
        this.createdAt = createdAt;
        this.formId = formId;
    }

    public int getCaseId() {
        return caseId;
    }

    public void setCaseId(int caseId) {
        this.caseId = caseId;
    }

    public String getWarrantNumber() {
        return warrantNumber;
    }

    public void setWarrantNumber(String warrantNumber) {
        this.warrantNumber = warrantNumber;
    }

    public String getReferenceNumber() {
        return referenceNumber;
    }

    public void setReferenceNumber(String referenceNumber) {
        this.referenceNumber = referenceNumber;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public String getFormId() {
        return formId;
    }

    public void setFormId(String formId) {
        this.formId = formId;
    }
}
