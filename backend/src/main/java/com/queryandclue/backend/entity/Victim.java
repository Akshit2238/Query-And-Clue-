package com.queryandclue.backend.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name="victims")
public class Victim {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int victimId;

    private int caseId;
    private String name;
    private int age;
    private String occupation;
    private String causeOfCrime;

    public int getVictimId() {
        return victimId;
    }

    public void setVictimId(int victimId) {
        this.victimId = victimId;
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

    public String getCauseOfCrime() {
        return causeOfCrime;
    }

    public void setCauseOfCrime(String causeOfCrime) {
        this.causeOfCrime = causeOfCrime;
    }
}