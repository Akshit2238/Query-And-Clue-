// Query & Clue - Frontend Configuration
// Single source of truth for API base URL
if (typeof window !== 'undefined') {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    window.API_BASE_URL = window.API_BASE_URL || (isLocal ? 'http://localhost:8081/api' : 'https://query-and-clue.onrender.com/api');
}