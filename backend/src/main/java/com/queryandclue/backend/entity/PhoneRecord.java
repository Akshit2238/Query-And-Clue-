package com.queryandclue.backend.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "phone_records")
public class PhoneRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int recordId;

    private int caseId;
    private int callerSuspectId;
    private int receiverSuspectId;
    private String callTime;
    private int callDuration;

    public int getRecordId() {
        return recordId;
    }

    public void setRecordId(int recordId) {
        this.recordId = recordId;
    }

    public int getCaseId() {
        return caseId;
    }

    public void setCaseId(int caseId) {
        this.caseId = caseId;
    }

    public int getCallerSuspectId() {
        return callerSuspectId;
    }

    public void setCallerSuspectId(int callerSuspectId) {
        this.callerSuspectId = callerSuspectId;
    }

    public int getReceiverSuspectId() {
        return receiverSuspectId;
    }

    public void setReceiverSuspectId(int receiverSuspectId) {
        this.receiverSuspectId = receiverSuspectId;
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