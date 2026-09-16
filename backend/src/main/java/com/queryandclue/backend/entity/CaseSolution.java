package com.queryandclue.backend.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "case_solutions")
public class CaseSolution {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int solutionId;

    private int caseId;
    private int culpritSuspectId;
    private String motive;
    private String crimeMethod;
    private String explanation;

    public int getSolutionId() {
        return solutionId;
    }

    public void setSolutionId(int solutionId) {
        this.solutionId = solutionId;
    }

    public int getCaseId() {
        return caseId;
    }

    public void setCaseId(int caseId) {
        this.caseId = caseId;
    }

    public int getCulpritSuspectId() {
        return culpritSuspectId;
    }

    public void setCulpritSuspectId(int culpritSuspectId) {
        this.culpritSuspectId = culpritSuspectId;
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
