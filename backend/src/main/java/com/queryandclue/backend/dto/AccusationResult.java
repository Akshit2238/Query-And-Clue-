package com.queryandclue.backend.dto;

public class AccusationResult {

    private boolean correct;
    private String feedback;
    private CaseSolution solution;

    public AccusationResult() {
    }

    public AccusationResult(boolean correct, String feedback, CaseSolution solution) {
        this.correct = correct;
        this.feedback = feedback;
        this.solution = solution;
    }

    public boolean isCorrect() {
        return correct;
    }

    public void setCorrect(boolean correct) {
        this.correct = correct;
    }

    public String getFeedback() {
        return feedback;
    }

    public void setFeedback(String feedback) {
        this.feedback = feedback;
    }

    public CaseSolution getSolution() {
        return solution;
    }

    public void setSolution(CaseSolution solution) {
        this.solution = solution;
    }

    public static class CaseSolution {
        private int culpritSuspectId;
        private String motive;
        private String crimeMethod;
        private String explanation;

        public CaseSolution() {
        }

        public CaseSolution(int culpritSuspectId, String motive, String crimeMethod, String explanation) {
            this.culpritSuspectId = culpritSuspectId;
            this.motive = motive;
            this.crimeMethod = crimeMethod;
            this.explanation = explanation;
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
}