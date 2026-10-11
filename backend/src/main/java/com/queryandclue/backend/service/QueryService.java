package com.queryandclue.backend.service;

import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;

import javax.sql.DataSource;

import org.springframework.stereotype.Service;

import com.queryandclue.backend.dto.QueryResult;
import com.queryandclue.backend.validator.SqlPolicyValidator;

@Service
public class QueryService {

    private final DataSource readOnlyDataSource;
    private final SqlPolicyValidator sqlPolicyValidator;

    private static final int QUERY_TIMEOUT_SECONDS = 5;
    private static final int MAX_ROWS = 200;

    public QueryService(DataSource readOnlyDataSource, SqlPolicyValidator sqlPolicyValidator) {
        this.readOnlyDataSource = readOnlyDataSource;
        this.sqlPolicyValidator = sqlPolicyValidator;
    }

    public QueryResult executeQuery(int caseId, String query) {
        SqlPolicyValidator.ValidationResult validation = sqlPolicyValidator.validate(query, caseId);
        if (!validation.isValid()) {
            throw new IllegalArgumentException(validation.getErrorMessage());
        }

        long startTime = System.currentTimeMillis();

        try (Connection conn = readOnlyDataSource.getConnection();
             Statement stmt = conn.createStatement()) {

            stmt.setQueryTimeout(QUERY_TIMEOUT_SECONDS);
            stmt.setMaxRows(MAX_ROWS + 1);

            boolean hasResults = stmt.execute(query);

            if (!hasResults) {
                return new QueryResult(List.of(), List.of(), 0, false, System.currentTimeMillis() - startTime);
            }

            ResultSet rs = stmt.getResultSet();
            ResultSetMetaData meta = rs.getMetaData();
            int columnCount = meta.getColumnCount();

            List<String> columns = new ArrayList<>(columnCount);
            for (int i = 1; i <= columnCount; i++) {
                columns.add(meta.getColumnLabel(i));
            }

            List<List<String>> rows = new ArrayList<>();
            int rowCount = 0;
            boolean truncated = false;

            while (rs.next()) {
                rowCount++;
                if (rowCount > MAX_ROWS) {
                    truncated = true;
                    break;
                }

                List<String> row = new ArrayList<>(columnCount);
                for (int i = 1; i <= columnCount; i++) {
                    Object value = rs.getObject(i);
                    row.add(value == null ? "NULL" : value.toString());
                }
                rows.add(row);
            }

            long executionMs = System.currentTimeMillis() - startTime;
            return new QueryResult(columns, rows, rowCount, truncated, executionMs);

        } catch (SQLException e) {
            throw new RuntimeException("Query execution failed: " + e.getMessage(), e);
        }
    }
}