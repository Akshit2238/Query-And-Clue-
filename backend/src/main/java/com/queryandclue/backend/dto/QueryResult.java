package com.queryandclue.backend.dto;

import java.util.List;

public class QueryResult {

    private List<String> columns;
    private List<List<String>> rows;
    private int rowCount;
    private boolean truncated;
    private long executionMs;

    public QueryResult() {}

    public QueryResult(List<String> columns, List<List<String>> rows, int rowCount, boolean truncated, long executionMs) {
        this.columns = columns;
        this.rows = rows;
        this.rowCount = rowCount;
        this.truncated = truncated;
        this.executionMs = executionMs;
    }

    public List<String> getColumns() {
        return columns;
    }

    public void setColumns(List<String> columns) {
        this.columns = columns;
    }

    public List<List<String>> getRows() {
        return rows;
    }

    public void setRows(List<List<String>> rows) {
        this.rows = rows;
    }

    public int getRowCount() {
        return rowCount;
    }

    public void setRowCount(int rowCount) {
        this.rowCount = rowCount;
    }

    public boolean isTruncated() {
        return truncated;
    }

    public void setTruncated(boolean truncated) {
        this.truncated = truncated;
    }

    public long getExecutionMs() {
        return executionMs;
    }

    public void setExecutionMs(long executionMs) {
        this.executionMs = executionMs;
    }
}