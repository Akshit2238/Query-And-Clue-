// Query & Clue - Frontend Configuration
// Single source of truth for API base URL
if (typeof window !== 'undefined') {
    window.API_BASE_URL = window.API_BASE_URL || 'http://localhost:8081/api';
}