// Query & Clue - Frontend Configuration
// Single source of truth for API base URL
if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';
    const isStaging = hostname.includes('staging') || window.location.search.includes('env=staging');

    if (!window.API_BASE_URL) {
        if (isLocal) {
            window.API_BASE_URL = 'http://localhost:8081/api';
        } else if (isStaging) {
            window.API_BASE_URL = 'https://query-and-clue-staging.onrender.com/api';
        } else {
            window.API_BASE_URL = 'https://query-and-clue.onrender.com/api';
        }
    }
}
