// Query & Clue - Investigation Page Logic
import { API_BASE_URL } from './config.js';

// Support both /investigation.html?caseId=1 and /investigation?caseId=1
const params = new URLSearchParams(window.location.search);
let caseId = parseInt(params.get('caseId') || '1', 10);

// If no caseId in URL but we're on /investigation, try to get from referrer or default to 1
if (!params.has('caseId') && window.location.pathname === '/investigation') {
    // Try to get from sessionStorage as fallback
    const stored = sessionStorage.getItem('caseId');
    if (stored) {
        caseId = parseInt(stored, 10);
    }
}

// Store caseId for later use
sessionStorage.setItem('caseId', caseId.toString());

const sqlQuery = document.getElementById('sqlQuery');
const executeBtn = document.getElementById('executeQuery');
const queryStatus = document.getElementById('queryStatus');
const queryResults = document.getElementById('queryResults');
const resultsInfo = document.getElementById('resultsInfo');
const executionTime = document.getElementById('executionTime');
const resultsHead = document.getElementById('resultsHead');
const resultsBody = document.getElementById('resultsBody');
const truncatedNotice = document.getElementById('truncatedNotice');
const queryError = document.getElementById('queryError');

const accusedSuspect = document.getElementById('accusedSuspect');
const motive = document.getElementById('motive');
const explanation = document.getElementById('explanation');
const submitAccusationBtn = document.getElementById('submitAccusation');
const accusationStatus = document.getElementById('accusationStatus');
const accusationResult = document.getElementById('accusationResult');
const accusationSection = document.getElementById('accusationSection');

const backBtn = document.getElementById('backToCases');

async function loadCaseInfo() {
    try {
        const response = await fetch(`${API_BASE_URL}/cases/${caseId}`);
        if (!response.ok) throw new Error('Failed to load case');
        const caseData = await response.json();

        document.getElementById('victimInfo').textContent = caseData.victim ? `${caseData.victim.name} (${caseData.victim.age})` : 'No victim data';
        document.getElementById('suspectsInfo').textContent = caseData.suspects ? `${caseData.suspects.length} suspects` : 'No suspects';
        document.getElementById('evidenceInfo').textContent = caseData.evidence ? `${caseData.evidence.length} evidence records` : 'No evidence';

        if (caseData.suspects && caseData.suspects.length > 0) {
            accusedSuspect.innerHTML = '<option value="">-- Select a suspect --</option>';
            caseData.suspects.forEach(s => {
                const opt = document.createElement('option');
                opt.value = s.suspectId;
                opt.textContent = s.name;
                accusedSuspect.appendChild(opt);
            });
        }
    } catch (e) {
        console.error('Failed to load case info:', e);
    }
}

function showStatus(el, message, isError = false) {
    el.textContent = message;
    el.style.color = isError ? '#c00' : '#060';
}

function clearResults() {
    queryResults.style.display = 'none';
    queryError.style.display = 'none';
    truncatedNotice.style.display = 'none';
}

async function executeQuery() {
    const query = sqlQuery.value.trim();
    if (!query) {
        showStatus(queryStatus, 'Please enter a query', true);
        return;
    }

    clearResults();
    showStatus(queryStatus, 'Executing...');
    executeBtn.disabled = true;

    try {
        const response = await fetch(`${API_BASE_URL}/query/execute`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ caseId, query })
        });

        const data = await response.json();

        if (!response.ok) {
            showStatus(queryStatus, '', false);
            queryError.textContent = data.message || 'Query failed';
            queryError.style.display = 'block';
            return;
        }

        showStatus(queryStatus, 'Success', false);
        renderResults(data);
    } catch (e) {
        showStatus(queryStatus, '', false);
        queryError.textContent = 'Network error: ' + e.message;
        queryError.style.display = 'block';
    } finally {
        executeBtn.disabled = false;
    }
}

function renderResults(result) {
    queryResults.style.display = 'block';
    resultsInfo.textContent = `${result.rowCount} row(s) returned`;
    executionTime.textContent = `${result.executionMs} ms`;

    if (result.truncated) {
        truncatedNotice.textContent = `Results truncated at ${result.rowCount} rows.`;
        truncatedNotice.style.display = 'block';
    }

    resultsHead.innerHTML = '';
    const headRow = document.createElement('tr');
    result.columns.forEach(col => {
        const th = document.createElement('th');
        th.textContent = col;
        headRow.appendChild(th);
    });
    resultsHead.appendChild(headRow);

    resultsBody.innerHTML = '';
    result.rows.forEach(row => {
        const tr = document.createElement('tr');
        row.forEach(cell => {
            const td = document.createElement('td');
            td.textContent = cell;
            tr.appendChild(td);
        });
        resultsBody.appendChild(tr);
    });
}

async function submitAccusation() {
    const suspectId = parseInt(accusedSuspect.value, 10);
    const motiveText = motive.value.trim();
    const explanationText = explanation.value.trim();

    if (!suspectId) {
        showStatus(accusationStatus, 'Please select a suspect', true);
        return;
    }
    if (!explanationText) {
        showStatus(accusationStatus, 'Explanation is required', true);
        return;
    }

    showStatus(accusationStatus, 'Submitting...');
    submitAccusationBtn.disabled = true;

    try {
        const response = await fetch(`${API_BASE_URL}/cases/${caseId}/accusation`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                accusedSuspectId: suspectId,
                motive: motiveText,
                explanation: explanationText
            })
        });

        const data = await response.json();

        if (!response.ok) {
            showStatus(accusationStatus, data.message || 'Submission failed', true);
            return;
        }

        showStatus(accusationStatus, 'Submitted', false);
        renderAccusationResult(data);
    } catch (e) {
        showStatus(accusationStatus, 'Network error: ' + e.message, true);
    } finally {
        submitAccusationBtn.disabled = false;
    }
}

function renderAccusationResult(data) {
    accusationResult.style.display = 'block';
    accusationResult.innerHTML = `
        <h3>${data.correct ? '✓ Correct!' : '✗ Incorrect'}</h3>
        <p>${data.feedback}</p>
        ${data.solution ? `<details><summary>Solution</summary><pre>${JSON.stringify(data.solution, null, 2)}</pre></details>` : ''}
    `;
    accusationResult.style.color = data.correct ? '#060' : '#c00';
}

executeBtn.addEventListener('click', executeQuery);
submitAccusationBtn.addEventListener('click', submitAccusation);
backBtn.addEventListener('click', () => { window.location.href = `case.html?caseId=${caseId}`; });

loadCaseInfo();