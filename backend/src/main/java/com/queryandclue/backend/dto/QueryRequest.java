package com.queryandclue.backend.dto;

public class QueryRequest {

    private int caseId;
    private String query;

    public QueryRequest() {}

    public QueryRequest(int caseId, String query) {
        this.caseId = caseId;
        this.query = query;
    }

    public int getCaseId() {
        return caseId;
    }

    public void setCaseId(int caseId) {
        this.caseId = caseId;
    }

    public String getQuery() {
        return query;
    }

    public void setQuery(String query) {
        this.query = query;
    }
}