package com.queryandclue.backend.entity;

import java.time.LocalDate;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "cases")
public class Case {

    @Id
    private int caseId;


    private String title;
    private String description;
    private String difficulty;
    private LocalDate crimeDate;
    private String crimeType;


    public int getCaseId() {
        return caseId;
    }

    public void setCaseId(int caseId) {
        this.caseId = caseId;
    }

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
        if (difficulty == null || difficulty.isBlank()) {
            return "EASY";
        }
        return difficulty;
    }

    public void setDifficulty(String difficulty) {
        if (difficulty == null || difficulty.isBlank()) {
            this.difficulty = "EASY";
        } else {
            String u = difficulty.trim().toUpperCase();
            if (u.equals("EASY") || u.equals("MEDIUM") || u.equals("HARD")) {
                this.difficulty = u;
            } else {
                this.difficulty = "EASY";
            }
        }
    }

    public LocalDate getCrimeDate() {
        return crimeDate;
    }

    public void setCrimeDate(LocalDate crimeDate) {
        this.crimeDate = crimeDate;
    }

    public String getCrimeType() {
        return crimeType;
    }

    public void setCrimeType(String crimeType) {
        this.crimeType = crimeType;
    }
}