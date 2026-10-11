package com.queryandclue.backend.validator;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class SqlPolicyValidatorTest {

    @Autowired
    private SqlPolicyValidator validator;

    @Test
    void validSelectWithCaseScope() {
        var result = validator.validate("SELECT * FROM suspects WHERE case_id = 1", 1);
        assertTrue(result.isValid());
    }

    @Test
    void validSelectWithMultipleColumns() {
        var result = validator.validate("SELECT name, age FROM suspects WHERE case_id = 1", 1);
        assertTrue(result.isValid());
    }

    @Test
    void validSelectWithJoin() {
        var result = validator.validate(
                "SELECT s.name, e.description FROM suspects s JOIN evidence e ON s.case_id = e.case_id WHERE s.case_id = 1",
                1);
        assertTrue(result.isValid());
    }

    @Test
    void invalidEmptyQuery() {
        var result = validator.validate("", 1);
        assertFalse(result.isValid());
        assertEquals("Query cannot be empty", result.getErrorMessage());
    }

    @Test
    void invalidInsertStatement() {
        var result = validator.validate("INSERT INTO suspects (name) VALUES ('test')", 1);
        assertFalse(result.isValid());
        assertEquals("Only SELECT statements are allowed", result.getErrorMessage());
    }

    @Test
    void invalidUpdateStatement() {
        var result = validator.validate("UPDATE suspects SET name = 'test' WHERE case_id = 1", 1);
        assertFalse(result.isValid());
        assertEquals("Only SELECT statements are allowed", result.getErrorMessage());
    }

    @Test
    void invalidDeleteStatement() {
        var result = validator.validate("DELETE FROM suspects WHERE case_id = 1", 1);
        assertFalse(result.isValid());
        assertEquals("Only SELECT statements are allowed", result.getErrorMessage());
    }

    @Test
    void invalidDropStatement() {
        var result = validator.validate("DROP TABLE suspects", 1);
        assertFalse(result.isValid());
        assertEquals("Only SELECT statements are allowed", result.getErrorMessage());
    }

    @Test
    void invalidForbiddenTableUsers() {
        var result = validator.validate("SELECT * FROM users WHERE case_id = 1", 1);
        assertFalse(result.isValid());
        assertTrue(result.getErrorMessage().contains("forbidden"));
    }

    @Test
    void invalidForbiddenTableCaseSolutions() {
        var result = validator.validate("SELECT * FROM case_solutions WHERE case_id = 1", 1);
        assertFalse(result.isValid());
        assertTrue(result.getErrorMessage().contains("forbidden"));
    }

    @Test
    void invalidForbiddenTableFinalAccusations() {
        var result = validator.validate("SELECT * FROM final_accusations WHERE case_id = 1", 1);
        assertFalse(result.isValid());
        assertTrue(result.getErrorMessage().contains("forbidden"));
    }

    @Test
    void invalidForbiddenTableQueryHistory() {
        var result = validator.validate("SELECT * FROM query_history WHERE case_id = 1", 1);
        assertFalse(result.isValid());
        assertTrue(result.getErrorMessage().contains("forbidden"));
    }

    @Test
    void invalidForbiddenTablePlayerProgress() {
        var result = validator.validate("SELECT * FROM player_progress WHERE case_id = 1", 1);
        assertFalse(result.isValid());
        assertTrue(result.getErrorMessage().contains("forbidden"));
    }

    @Test
    void invalidDisallowedTable() {
        var result = validator.validate("SELECT * FROM non_existent_table WHERE case_id = 1", 1);
        assertFalse(result.isValid());
        assertTrue(result.getErrorMessage().contains("not allowed"));
    }

    @Test
    void invalidMissingCaseScope() {
        var result = validator.validate("SELECT * FROM suspects", 1);
        assertFalse(result.isValid());
        assertTrue(result.getErrorMessage().contains("case_id"));
    }

    @Test
    void invalidWrongCaseScope() {
        var result = validator.validate("SELECT * FROM suspects WHERE case_id = 2", 1);
        assertFalse(result.isValid());
        assertTrue(result.getErrorMessage().contains("case_id"));
    }

    @Test
    void invalidMultipleStatements() {
        var result = validator
                .validate("SELECT * FROM suspects WHERE case_id = 1; SELECT * FROM victims WHERE case_id = 1", 1);
        assertFalse(result.isValid());
    }

    @Test
    void invalidSyntax() {
        var result = validator.validate("SELECT * FROM suspects WHERE case_id =", 1);
        assertFalse(result.isValid());
        assertTrue(result.getErrorMessage().contains("syntax"));
    }

    @Test
    void validWithClause() {
        var result = validator.validate(
                "WITH suspect_names AS (SELECT name FROM suspects WHERE case_id = 1) SELECT * FROM suspect_names",
                1);
        assertTrue(result.isValid());
    }
}