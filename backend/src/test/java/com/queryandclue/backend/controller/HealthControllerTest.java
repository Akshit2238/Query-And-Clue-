package com.queryandclue.backend.controller;

import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.Map;

import javax.sql.DataSource;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for HealthController using hand-written minimal stubs
 * to avoid Byte Buddy / Java 23+ incompatibilities with Mockito.
 */
class HealthControllerTest {

    // Minimal DataSource stub — healthy path
    private static final DataSource HEALTHY_DS = new StubDataSource(false);
    // Minimal DataSource stub — broken path
    private static final DataSource BROKEN_DS = new StubDataSource(true);

    @Test
    void liveness_alwaysReturnsUp() {
        HealthController controller = new HealthController(HEALTHY_DS);
        ResponseEntity<Map<String, String>> resp = controller.liveness();
        assertEquals(HttpStatus.OK, resp.getStatusCode());
        assertEquals("UP", resp.getBody().get("status"));
        assertEquals("query-and-clue-backend", resp.getBody().get("service"));
    }

    @Test
    void dbReadiness_returnsUp_whenDatabaseReachable() {
        HealthController controller = new HealthController(HEALTHY_DS);
        ResponseEntity<Map<String, String>> resp = controller.dbReadiness();
        assertEquals(HttpStatus.OK, resp.getStatusCode());
        assertEquals("UP", resp.getBody().get("status"));
        assertEquals("reachable", resp.getBody().get("database"));
    }

    @Test
    void dbReadiness_returnsDown_whenDatabaseUnreachable() {
        HealthController controller = new HealthController(BROKEN_DS);
        ResponseEntity<Map<String, String>> resp = controller.dbReadiness();
        assertEquals(HttpStatus.SERVICE_UNAVAILABLE, resp.getStatusCode());
        assertEquals("DOWN", resp.getBody().get("status"));
        assertEquals("unreachable", resp.getBody().get("database"));
        assertFalse(resp.getBody().containsKey("error"), "Must not expose internal error details");
    }

    // -----------------------------------------------------------------------
    // Hand-written stubs — avoids Mockito Byte Buddy issues on Java 23+
    // -----------------------------------------------------------------------

    /** Minimal DataSource that either returns a working connection or throws. */
    private static class StubDataSource implements DataSource {
        private final boolean throwOnConnect;
        StubDataSource(boolean throwOnConnect) { this.throwOnConnect = throwOnConnect; }

        @Override
        public Connection getConnection() throws SQLException {
            if (throwOnConnect) throw new SQLException("Connection refused (stub)");
            return new StubConnection();
        }

        @Override public Connection getConnection(String u, String p) throws SQLException { return getConnection(); }
        @Override public java.io.PrintWriter getLogWriter() { return null; }
        @Override public void setLogWriter(java.io.PrintWriter pw) {}
        @Override public void setLoginTimeout(int s) {}
        @Override public int getLoginTimeout() { return 0; }
        @Override public java.util.logging.Logger getParentLogger() { return null; }
        @Override public <T> T unwrap(Class<T> i) { return null; }
        @Override public boolean isWrapperFor(Class<?> i) { return false; }
    }

    /** Minimal Connection that hands back a StubStatement. */
    private static class StubConnection implements Connection {
        @Override public Statement createStatement() { return new StubStatement(); }
        @Override public void close() {}
        @Override public boolean isClosed() { return false; }
        // All other Connection methods — return safe no-op defaults
        @Override public java.sql.PreparedStatement prepareStatement(String s) { return null; }
        @Override public java.sql.CallableStatement prepareCall(String s) { return null; }
        @Override public String nativeSQL(String s) { return s; }
        @Override public void setAutoCommit(boolean b) {}
        @Override public boolean getAutoCommit() { return true; }
        @Override public void commit() {}
        @Override public void rollback() {}
        @Override public java.sql.DatabaseMetaData getMetaData() { return null; }
        @Override public void setReadOnly(boolean b) {}
        @Override public boolean isReadOnly() { return false; }
        @Override public void setCatalog(String c) {}
        @Override public String getCatalog() { return null; }
        @Override public void setTransactionIsolation(int l) {}
        @Override public int getTransactionIsolation() { return Connection.TRANSACTION_NONE; }
        @Override public java.sql.SQLWarning getWarnings() { return null; }
        @Override public void clearWarnings() {}
        @Override public Statement createStatement(int t, int c) { return null; }
        @Override public java.sql.PreparedStatement prepareStatement(String s, int t, int c) { return null; }
        @Override public java.sql.CallableStatement prepareCall(String s, int t, int c) { return null; }
        @Override public java.util.Map<String, Class<?>> getTypeMap() { return null; }
        @Override public void setTypeMap(java.util.Map<String, Class<?>> m) {}
        @Override public void setHoldability(int h) {}
        @Override public int getHoldability() { return 0; }
        @Override public java.sql.Savepoint setSavepoint() { return null; }
        @Override public java.sql.Savepoint setSavepoint(String n) { return null; }
        @Override public void rollback(java.sql.Savepoint s) {}
        @Override public void releaseSavepoint(java.sql.Savepoint s) {}
        @Override public Statement createStatement(int t, int c, int h) { return null; }
        @Override public java.sql.PreparedStatement prepareStatement(String s, int t, int c, int h) { return null; }
        @Override public java.sql.CallableStatement prepareCall(String s, int t, int c, int h) { return null; }
        @Override public java.sql.PreparedStatement prepareStatement(String s, int ag) { return null; }
        @Override public java.sql.PreparedStatement prepareStatement(String s, int[] ci) { return null; }
        @Override public java.sql.PreparedStatement prepareStatement(String s, String[] cn) { return null; }
        @Override public java.sql.Clob createClob() { return null; }
        @Override public java.sql.Blob createBlob() { return null; }
        @Override public java.sql.NClob createNClob() { return null; }
        @Override public java.sql.SQLXML createSQLXML() { return null; }
        @Override public boolean isValid(int timeout) { return true; }
        @Override public void setClientInfo(String n, String v) {}
        @Override public void setClientInfo(java.util.Properties p) {}
        @Override public String getClientInfo(String n) { return null; }
        @Override public java.util.Properties getClientInfo() { return null; }
        @Override public java.sql.Array createArrayOf(String t, Object[] e) { return null; }
        @Override public java.sql.Struct createStruct(String t, Object[] a) { return null; }
        @Override public void setSchema(String s) {}
        @Override public String getSchema() { return null; }
        @Override public void abort(java.util.concurrent.Executor e) {}
        @Override public void setNetworkTimeout(java.util.concurrent.Executor e, int ms) {}
        @Override public int getNetworkTimeout() { return 0; }
        @Override public <T> T unwrap(Class<T> i) { return null; }
        @Override public boolean isWrapperFor(Class<?> i) { return false; }
    }

    /** Minimal Statement that succeeds on executeQuery. */
    private static class StubStatement implements Statement {
        @Override public ResultSet executeQuery(String sql) { return null; }
        @Override public void setQueryTimeout(int seconds) {}
        @Override public void close() {}
        @Override public int executeUpdate(String sql) { return 0; }
        @Override public int getMaxFieldSize() { return 0; }
        @Override public void setMaxFieldSize(int max) {}
        @Override public int getMaxRows() { return 0; }
        @Override public void setMaxRows(int max) {}
        @Override public void setEscapeProcessing(boolean enable) {}
        @Override public int getQueryTimeout() { return 0; }
        @Override public void cancel() {}
        @Override public java.sql.SQLWarning getWarnings() { return null; }
        @Override public void clearWarnings() {}
        @Override public void setCursorName(String name) {}
        @Override public boolean execute(String sql) { return false; }
        @Override public ResultSet getResultSet() { return null; }
        @Override public int getUpdateCount() { return -1; }
        @Override public boolean getMoreResults() { return false; }
        @Override public void setFetchDirection(int d) {}
        @Override public int getFetchDirection() { return 0; }
        @Override public void setFetchSize(int rows) {}
        @Override public int getFetchSize() { return 0; }
        @Override public int getResultSetConcurrency() { return 0; }
        @Override public int getResultSetType() { return 0; }
        @Override public void addBatch(String sql) {}
        @Override public void clearBatch() {}
        @Override public int[] executeBatch() { return new int[0]; }
        @Override public Connection getConnection() { return null; }
        @Override public boolean getMoreResults(int current) { return false; }
        @Override public ResultSet getGeneratedKeys() { return null; }
        @Override public int executeUpdate(String sql, int autoGeneratedKeys) { return 0; }
        @Override public int executeUpdate(String sql, int[] columnIndexes) { return 0; }
        @Override public int executeUpdate(String sql, String[] columnNames) { return 0; }
        @Override public boolean execute(String sql, int autoGeneratedKeys) { return false; }
        @Override public boolean execute(String sql, int[] columnIndexes) { return false; }
        @Override public boolean execute(String sql, String[] columnNames) { return false; }
        @Override public int getResultSetHoldability() { return 0; }
        @Override public boolean isClosed() { return false; }
        @Override public void setPoolable(boolean poolable) {}
        @Override public boolean isPoolable() { return false; }
        @Override public void closeOnCompletion() {}
        @Override public boolean isCloseOnCompletion() { return false; }
        @Override public <T> T unwrap(Class<T> iface) { return null; }
        @Override public boolean isWrapperFor(Class<?> iface) { return false; }
    }
}
