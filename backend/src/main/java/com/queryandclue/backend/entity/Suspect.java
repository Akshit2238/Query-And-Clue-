package com.queryandclue.backend.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "suspects")
public class Suspect {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int suspectId;

    private int caseId;
    private String name;
    private int age;
    private String occupation;
    private String relationshipToVictim;
    private String motive;
    private String alibi;

    public int getSuspectId() {
        return suspectId;
    }

    public void setSuspectId(int suspectId) {
        this.suspectId = suspectId;
    }

    public int getCaseId() {
        return caseId;
    }

    public void setCaseId(int caseId) {
        this.caseId = caseId;
    }

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