// Query & Clue - Case Detail Page Logic
import { API_BASE_URL } from './config.js';

const params = new URLSearchParams(window.location.search);
const caseId = params.get('caseId');

const caseDetail = document.getElementById('caseDetail');

async function loadCase() {
    if (!caseId) {
        caseDetail.innerHTML = '<p>No case ID provided.</p>';
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/cases/${caseId}`);
        if (!response.ok) throw new Error('Case not found');
        const c = await response.json();

        caseDetail.innerHTML = `
            <p class="case-status">CASE #${String(c.caseId).padStart(3, '0')} · ${c.difficulty || 'Unknown'}</p>
            <h2>${c.title}</h2>
            <p>${c.description || ''}</p>
            <p><strong>Crime Date:</strong> ${c.crimeDate || 'Unknown'}</p>
            <p><strong>Crime Type:</strong> ${c.crimeType || 'Unknown'}</p>

            <h3>Victim</h3>
            <p>${c.victim ? `${c.victim.name}, ${c.victim.age}, ${c.victim.occupation} — ${c.victim.causeOfCrime}` : 'No victim data'}</p>

            <h3>Suspects</h3>
            <ul>
                ${c.suspects && c.suspects.length > 0
                ? c.suspects.map(s => `<li>${s.name}, ${s.age}, ${s.occupation} — ${s.relationshipToVictim} — Motive: ${s.motive} — Alibi: ${s.alibi}</li>`).join('')
                : '<li>No suspects</li>'}
            </ul>

            <button type="button" id="beginInvestigation">Begin Investigation</button>
        `;

        document.getElementById('beginInvestigation').addEventListener('click', () => {
            window.location.href = `investigation.html?caseId=${caseId}`;
        });
    } catch (e) {
        console.error('Failed to load case:', e);
        caseDetail.innerHTML = '<p>Failed to load case. Is the backend running?</p>';
    }
}

loadCase();