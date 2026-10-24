package com.queryandclue.backend.validator;

import java.util.List;
import java.util.Set;

import org.springframework.stereotype.Component;

import net.sf.jsqlparser.JSQLParserException;
import net.sf.jsqlparser.parser.CCJSqlParserUtil;
import net.sf.jsqlparser.statement.Statement;
import net.sf.jsqlparser.statement.select.Select;
import net.sf.jsqlparser.util.TablesNamesFinder;

@Component
public class SqlPolicyValidator {

    private static final Set<String> ALLOWED_TABLES = Set.of(
            "cases", "victims", "suspects", "crime_scenes", "evidence",
            "timeline_events", "access_logs", "phone_records", "transactions");

    private static final Set<String> FORBIDDEN_TABLES = Set.of(
            "users", "case_solutions", "final_accusations", "query_history", "player_progress");

    private static final int MAX_QUERY_LENGTH = 5000;

    public ValidationResult validate(String query, int caseId) {
        if (query == null || query.isBlank()) {
            return ValidationResult.invalid("Query cannot be empty");
        }

        if (query.length() > MAX_QUERY_LENGTH) {
            return ValidationResult.invalid("Query exceeds maximum length of " + MAX_QUERY_LENGTH);
        }

        net.sf.jsqlparser.statement.Statements statements;
        try {
            statements = CCJSqlParserUtil.parseStatements(query);
        } catch (JSQLParserException e) {
            return ValidationResult.invalid("Invalid SQL syntax: " + e.getMessage());
        }

        if (statements == null || statements.getStatements().isEmpty()) {
            return ValidationResult.invalid("Query cannot be empty");
        }

        if (statements.getStatements().size() > 1) {
            return ValidationResult.invalid("Multiple SQL statements are forbidden");
        }

        Statement statement = statements.getStatements().get(0);

        if (!(statement instanceof Select)) {
            return ValidationResult.invalid("Only SELECT statements are allowed");
        }

        Select select = (Select) statement;

        if (select.getWithItemsList() != null && !select.getWithItemsList().isEmpty()) {
            // WITH clause is allowed, but we still validate the main SELECT
        }

        TablesNamesFinder tablesNamesFinder = new TablesNamesFinder();
        List<String> tableNames;
        try {
            tableNames = tablesNamesFinder.getTableList(select);
        } catch (Exception e) {
            return ValidationResult.invalid("Could not extract table names: " + e.getMessage());
        }

        for (String tableName : tableNames) {
            String normalized = tableName.toLowerCase().replaceAll("`", "");
            if (FORBIDDEN_TABLES.contains(normalized)) {
                return ValidationResult.invalid("Access to table '" + tableName + "' is forbidden");
            }
            if (!ALLOWED_TABLES.contains(normalized)) {
                return ValidationResult.invalid("Table '" + tableName + "' is not allowed");
            }
        }

        if (!hasCaseScopePredicate(select, caseId)) {
            return ValidationResult.invalid("Query must include a case_id = " + caseId + " predicate");
        }

        return ValidationResult.valid();
    }

    private boolean hasCaseScopePredicate(Select select, int caseId) {
        if (select == null) {
            return false;
        }

        // Strip string literals to prevent injection bypasses like WHERE alibi = 'case_id = 1'
        String sql = select.toString();
        String sqlNoLiterals = sql.replaceAll("'(''|[^'])*'", "''").toLowerCase();

        // Match case_id = <caseId> or <caseId> = case_id with optional table prefix and word boundaries
        String regex = "(?:(?:\\b[a-z0-9_]+\\.)?\\bcase_id\\b\\s*=\\s*" + caseId + "\\b|\\b" + caseId + "\\s*=\\s*(?:\\b[a-z0-9_]+\\.)?\\bcase_id\\b)";
        return java.util.regex.Pattern.compile(regex).matcher(sqlNoLiterals).find();
    }

    public static class ValidationResult {
        private final boolean valid;
        private final String errorMessage;

        private ValidationResult(boolean valid, String errorMessage) {
            this.valid = valid;
            this.errorMessage = errorMessage;
        }

        public static ValidationResult valid() {
            return new ValidationResult(true, null);
        }

        public static ValidationResult invalid(String errorMessage) {
            return new ValidationResult(false, errorMessage);
        }

        public boolean isValid() {
            return valid;
        }

        public String getErrorMessage() {
            return errorMessage;
        }
    }
}