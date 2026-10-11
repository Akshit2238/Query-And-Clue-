// =========================================
// QUERY & CLUE — RETRO OS LOGIC (app.js)
// =========================================

const getApiBase = () => window.API_BASE_URL || 'http://localhost:8081/api';

async function apiFetch(endpoint, options) {
    try {
        const res = await fetch(`${getApiBase()}${endpoint}`, options);
        if (res.ok) return res;
    } catch (e) {}
    return await fetch(`http://127.0.0.1:8081/api${endpoint}`, options);
}

let caseId = parseInt(localStorage.getItem('qc_active_case') || '1', 10);
let cachedCasesList = [];
if (!window.highestZ) window.highestZ = 100;

// =========================================
// INIT & WINDOW MANAGEMENT
// =========================================

function init() {
    initClock();
    initResizableWindows();
    initDraggableWindows();
    initWindowFocus();
    initIconTriggers();
    initNotepad();
    initTabs();
    initQueryHistory();
    initMusicPlayer();
    initSettings();
    initBrowser();
    initDetectiveBadge();

    loadCaseContext(caseId);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Clock Tray Update
function initClock() {
    const clockEl = document.getElementById('clockTray');
    if (!clockEl) return;
    const update = () => {
        const now = new Date();
        clockEl.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };
    update();
    setInterval(update, 1000);
}

// Detective Badge Tray Update
function initDetectiveBadge() {
    const name = localStorage.getItem('qc_detective_name') || 'Guest Detective';
    const avatar = localStorage.getItem('qc_detective_avatar') || '🕵️';
    const badgeName = document.getElementById('badgeName');
    const badgeAvatar = document.getElementById('badgeAvatar');
    if (badgeName) badgeName.textContent = name;
    if (badgeAvatar) badgeAvatar.textContent = avatar;
}

// Window Focus & Bring to Front
function bringToFront(win) {
    if (typeof win === 'string') win = document.getElementById(win);
    if (!win) return;
    window.highestZ = (window.highestZ || 100) + 1;
    win.style.zIndex = window.highestZ;
    win.classList.remove('hidden');
    updateTaskbar();
}

window.bringToFront = bringToFront;
window.openWindow = bringToFront;

// Maximize / Restore Toggle
function toggleMaximize(win) {
    if (typeof win === 'string') win = document.getElementById(win);
    if (!win) return;
    bringToFront(win);

    const maxBtn = win.querySelector('.btn-max');
    if (win.classList.contains('maximized')) {
        win.classList.remove('maximized');
        win.style.left = win.dataset.prevLeft || '160px';
        win.style.top = win.dataset.prevTop || '60px';
        win.style.width = win.dataset.prevWidth || '560px';
        win.style.height = win.dataset.prevHeight || '400px';
        if (maxBtn) maxBtn.textContent = '□';
    } else {
        const rect = win.getBoundingClientRect();
        const desktop = document.getElementById('desktop');
        const deskRect = desktop ? desktop.getBoundingClientRect() : { left: 0, top: 0 };
        win.dataset.prevLeft = (rect.left - deskRect.left) + 'px';
        win.dataset.prevTop = (rect.top - deskRect.top) + 'px';
        win.dataset.prevWidth = rect.width + 'px';
        win.dataset.prevHeight = rect.height + 'px';
        win.classList.add('maximized');
        win.style.left = '0px';
        win.style.top = '0px';
        win.style.width = '100vw';
        win.style.height = 'calc(100vh - 36px)';
        if (maxBtn) maxBtn.textContent = '❐';
    }
    updateTaskbar();
}
window.toggleMaximize = toggleMaximize;

function updateTaskbar() {
    let topWinId = null;
    let maxZ = -1;
    document.querySelectorAll('.retro-window').forEach(win => {
        if (!win.classList.contains('hidden')) {
            const z = parseInt(win.style.zIndex || '0', 10);
            if (z > maxZ) { maxZ = z; topWinId = win.id; }
        }
    });
    document.querySelectorAll('.task-item').forEach(item => {
        item.classList.toggle('active', item.getAttribute('data-window') === topWinId);
    });
}

function initWindowFocus() {
    // Bring to front on click anywhere on window
    document.querySelectorAll('.retro-window').forEach(win => {
        win.addEventListener('mousedown', () => bringToFront(win));
    });

    // Event delegation for close, min, and max
    document.addEventListener('click', (e) => {
        const closeBtn = e.target.closest('.btn-close');
        if (closeBtn) {
            e.stopPropagation();
            const targetWin = document.getElementById(closeBtn.getAttribute('data-target')) || closeBtn.closest('.retro-window');
            if (targetWin) { targetWin.classList.add('hidden'); updateTaskbar(); }
            return;
        }
        const minBtn = e.target.closest('.btn-min');
        if (minBtn) {
            e.stopPropagation();
            const win = minBtn.closest('.retro-window');
            if (win) { win.classList.add('hidden'); updateTaskbar(); }
            return;
        }
        const maxBtn = e.target.closest('.btn-max');
        if (maxBtn) {
            e.stopPropagation();
            const win = maxBtn.closest('.retro-window');
            if (win) toggleMaximize(win);
            return;
        }
    });

    document.querySelectorAll('.task-item').forEach(item => {
        item.addEventListener('click', () => {
            const win = document.getElementById(item.getAttribute('data-window'));
            if (!win) return;
            const currentZ = parseInt(win.style.zIndex || '0', 10);
            if (win.classList.contains('hidden') || currentZ < window.highestZ) {
                bringToFront(win);
            } else {
                win.classList.add('hidden');
                updateTaskbar();
            }
        });
    });
}

// Resizable Windows (Injects Maximize button + Resize corner grip)
function initResizableWindows() {
    document.querySelectorAll('.retro-window').forEach(win => {
        // 1. Inject Maximize button if missing
        const controls = win.querySelector('.titlebar-controls');
        if (controls && !controls.querySelector('.btn-max')) {
            const maxBtn = document.createElement('button');
            maxBtn.className = 'win-btn btn-max';
            maxBtn.title = 'Maximize / Restore';
            maxBtn.textContent = '□';
            const closeBtn = controls.querySelector('.btn-close');
            if (closeBtn) {
                controls.insertBefore(maxBtn, closeBtn);
            } else {
                controls.appendChild(maxBtn);
            }
        }

        // 2. Inject Resize Handle if missing
        let handle = win.querySelector('.win-resize-handle');
        if (!handle) {
            handle = document.createElement('div');
            handle.className = 'win-resize-handle';
            handle.title = 'Drag to resize window';
            win.appendChild(handle);
        }

        handle.onmousedown = (e) => {
            if (win.classList.contains('maximized')) return;
            e.stopPropagation();
            e.preventDefault();
            bringToFront(win);

            const startX = e.clientX;
            const startY = e.clientY;
            const startW = win.offsetWidth;
            const startH = win.offsetHeight;

            const onMove = (mv) => {
                const newW = Math.max(300, startW + (mv.clientX - startX));
                const newH = Math.max(180, startH + (mv.clientY - startY));
                win.style.width = `${newW}px`;
                win.style.height = `${newH}px`;
            };

            const onUp = () => {
                document.removeEventListener('mousemove', onMove);
                document.removeEventListener('mouseup', onUp);
            };

            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onUp);
        };

        // 3. Double-click titlebar to maximize
        const titlebar = win.querySelector('.titlebar');
        if (titlebar) {
            titlebar.ondblclick = (e) => {
                if (e.target.closest('.win-btn')) return;
                toggleMaximize(win);
            };
        }
    });
}

// Draggable Window Logic
function initDraggableWindows() {
    document.querySelectorAll('.retro-window').forEach(win => {
        const titlebar = win.querySelector('.titlebar');
        if (!titlebar) return;

        titlebar.addEventListener('mousedown', (e) => {
            if (e.target.closest('.win-btn')) return;
            if (win.classList.contains('maximized')) return;
            e.preventDefault();
            bringToFront(win);

            const startX = e.clientX;
            const startY = e.clientY;
            const rect = win.getBoundingClientRect();
            const desktop = document.getElementById('desktop');
            const desktopRect = desktop ? desktop.getBoundingClientRect() : { left: 0, top: 0 };
            const initialLeft = rect.left - desktopRect.left;
            const initialTop = rect.top - desktopRect.top;

            const onMove = (mv) => {
                win.style.left = `${initialLeft + mv.clientX - startX}px`;
                win.style.top = `${initialTop + mv.clientY - startY}px`;
            };
            const onUp = () => {
                document.removeEventListener('mousemove', onMove);
                document.removeEventListener('mouseup', onUp);
            };
            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onUp);
        });
    });
}

// Icon Click Listeners (All icons functional)
function initIconTriggers() {
    document.querySelectorAll('.icon-btn[data-window]').forEach(btn => {
        const trigger = (e) => {
            e.preventDefault();
            const winId = btn.getAttribute('data-window');
            if (winId) bringToFront(winId);
        };
        btn.addEventListener('click', trigger);
        btn.addEventListener('dblclick', trigger);
    });

    const btnExit = document.getElementById('btn-icon-exit');
    if (btnExit) {
        btnExit.addEventListener('click', () => {
            if (confirm('Return to Chapter Select?')) {
                window.location.href = 'welcome.html';
            }
        });
    }

    const startBtn = document.getElementById('startBtn');
    if (startBtn) {
        startBtn.addEventListener('click', () => {
            const winManual = document.getElementById('win-manual');
            if (winManual) bringToFront(winManual);
        });
    }
}

// SQL Query Tabs State
let tabsInitialized = false;
let currentTabName = 'Tab 1';
const tabState = {
    'Tab 1': { query: '', headHtml: '<tr><th>Status</th><th>Message</th></tr>', bodyHtml: '<tr><td>INFO</td><td>Enter a SELECT query above and click Submit.</td></tr>', statusText: 'Ready.', statusColor: '#000', execTime: '' },
    'Tab 2': { query: '', headHtml: '<tr><th>Status</th><th>Message</th></tr>', bodyHtml: '<tr><td>INFO</td><td>Enter a SELECT query above and click Submit.</td></tr>', statusText: 'Ready.', statusColor: '#000', execTime: '' },
    'Tab 3': { query: '', headHtml: '<tr><th>Status</th><th>Message</th></tr>', bodyHtml: '<tr><td>INFO</td><td>Enter a SELECT query above and click Submit.</td></tr>', statusText: 'Ready.', statusColor: '#000', execTime: '' },
    'Tab 4': { query: '', headHtml: '<tr><th>Status</th><th>Message</th></tr>', bodyHtml: '<tr><td>INFO</td><td>Enter a SELECT query above and click Submit.</td></tr>', statusText: 'Ready.', statusColor: '#000', execTime: '' },
    'Tab 5': { query: '', headHtml: '<tr><th>Status</th><th>Message</th></tr>', bodyHtml: '<tr><td>INFO</td><td>Enter a SELECT query above and click Submit.</td></tr>', statusText: 'Ready.', statusColor: '#000', execTime: '' }
};

function saveCurrentTabState() {
    const sqlInput = document.getElementById('sqlQuery');
    const headEl = document.getElementById('resultsHead');
    const bodyEl = document.getElementById('resultsBody');
    const statusEl = document.getElementById('queryStatus');
    const timeEl = document.getElementById('executionTime');

    if (!tabState[currentTabName]) {
        tabState[currentTabName] = {};
    }
    if (sqlInput) tabState[currentTabName].query = sqlInput.value;
    if (headEl) tabState[currentTabName].headHtml = headEl.innerHTML;
    if (bodyEl) tabState[currentTabName].bodyHtml = bodyEl.innerHTML;
    if (statusEl) {
        tabState[currentTabName].statusText = statusEl.textContent;
        tabState[currentTabName].statusColor = statusEl.style.color || '#000';
    }
    if (timeEl) tabState[currentTabName].execTime = timeEl.textContent;
}

function restoreTabState(tabName) {
    const sqlInput = document.getElementById('sqlQuery');
    const headEl = document.getElementById('resultsHead');
    const bodyEl = document.getElementById('resultsBody');
    const statusEl = document.getElementById('queryStatus');
    const timeEl = document.getElementById('executionTime');

    const state = tabState[tabName] || { query: '', headHtml: '<tr><th>Status</th><th>Message</th></tr>', bodyHtml: '<tr><td>INFO</td><td>Enter a SELECT query above and click Submit.</td></tr>', statusText: 'Ready.', statusColor: '#000', execTime: '' };

    if (sqlInput) sqlInput.value = state.query || '';
    if (headEl) headEl.innerHTML = state.headHtml || '<tr><th>Status</th><th>Message</th></tr>';
    if (bodyEl) bodyEl.innerHTML = state.bodyHtml || '<tr><td>INFO</td><td>Enter a SELECT query above and click Submit.</td></tr>';
    if (statusEl) {
        statusEl.textContent = state.statusText || 'Ready.';
        statusEl.style.color = state.statusColor || '#000';
    }
    if (timeEl) timeEl.textContent = state.execTime || '';
}

function initTabs() {
    if (tabsInitialized) return;
    tabsInitialized = true;

    const sqlInput = document.getElementById('sqlQuery');
    if (sqlInput) {
        sqlInput.addEventListener('input', () => {
            if (tabState[currentTabName]) {
                tabState[currentTabName].query = sqlInput.value;
            }
        });
    }

    document.querySelectorAll('.retro-tabs .tab-item').forEach(tab => {
        tab.addEventListener('click', () => {
            const newTabName = tab.textContent.trim();
            if (newTabName === currentTabName) return;

            saveCurrentTabState();

            tab.parentElement.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            currentTabName = newTabName;
            restoreTabState(currentTabName);
        });
    });
}

// SQL Query History Window
function initQueryHistory() {
    const btnHistory = document.getElementById('btnViewHistory');
    const btnClear = document.getElementById('btnClearHistory');
    const container = document.getElementById('historyListContainer');
    const sqlInput = document.getElementById('sqlQuery');

    const renderHistory = () => {
        if (!container) return;
        let history = JSON.parse(localStorage.getItem('qc_query_history') || '[]');
        if (!history.length) {
            history = [
                'SELECT suspect_id, name, occupation FROM suspects WHERE case_id = 1;',
                'SELECT * FROM evidence WHERE case_id = 1;',
                'SELECT * FROM access_logs WHERE case_id = 1;'
            ];
        }

        container.innerHTML = '';
        history.forEach((query, idx) => {
            const card = document.createElement('div');
            card.style.cssText = 'padding:6px 8px; border:1px solid #cbd5e1; background:#f8fafc; display:flex; justify-content:space-between; align-items:center; gap:8px; border-radius:2px;';
            card.innerHTML = `
                <div style="flex:1; overflow:hidden;">
                    <div style="font-size:10px; color:#64748b; font-weight:bold; margin-bottom:2px;">Query #${idx + 1}</div>
                    <code style="font-family:monospace; font-size:11px; color:#0f172a; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; display:block;">${esc(query)}</code>
                </div>
                <button class="retro-btn btn-load-query" style="font-size:11px; padding:2px 10px; min-width:54px; font-weight:bold;">Load</button>
            `;

            card.querySelector('.btn-load-query').addEventListener('click', () => {
                if (sqlInput) {
                    sqlInput.value = query;
                    if (typeof tabState !== 'undefined' && tabState[currentTabName]) {
                        tabState[currentTabName].query = query;
                    }
                }
                const winHistory = document.getElementById('win-history');
                if (winHistory) winHistory.classList.add('hidden');
                openWindow('win-search');
                sqlInput.focus();
            });

            container.appendChild(card);
        });
    };

    if (btnHistory) {
        btnHistory.addEventListener('click', () => {
            renderHistory();
            openWindow('win-history');
        });
    }

    if (btnClear) {
        btnClear.addEventListener('click', () => {
            if (confirm('Clear all saved query history?')) {
                localStorage.removeItem('qc_query_history');
                renderHistory();
            }
        });
    }
}

// Notepad with Multi-Page support
function initNotepad() {
    const notepad = document.getElementById('notepadText');
    if (!notepad) return;

    let activePage = 1;
    const pageButtons = document.querySelectorAll('.notepad-sidebar .retro-btn');

    const loadPage = (p) => {
        activePage = p;
        notepad.value = localStorage.getItem(`qc_notepad_page_${p}`) || (p === 1 ? (localStorage.getItem('qc_notepad_notes') || '') : '');
        pageButtons.forEach((b, i) => {
            b.style.fontWeight = (i + 1 === p) ? 'bold' : 'normal';
            b.style.backgroundColor = (i + 1 === p) ? '#e2e8f0' : '';
        });
    };

    pageButtons.forEach((btn, idx) => {
        btn.addEventListener('click', () => {
            localStorage.setItem(`qc_notepad_page_${activePage}`, notepad.value);
            loadPage(idx + 1);
        });
    });

    loadPage(1);

    notepad.addEventListener('input', () => {
        const autosave = localStorage.getItem('qc_setting_autosave') !== 'false';
        if (autosave) {
            localStorage.setItem(`qc_notepad_page_${activePage}`, notepad.value);
            if (activePage === 1) localStorage.setItem('qc_notepad_notes', notepad.value);
        }
    });

    document.querySelectorAll('.color-swatch').forEach(swatch => {
        swatch.addEventListener('click', () => {
            const color = swatch.getAttribute('data-color');
            notepad.style.backgroundColor = color;
            notepad.style.color = color === '#475569' ? '#ffffff' : '#000000';
        });
    });
}

// Retro 8-bit Synthesizer Audio Player
function initMusicPlayer() {
    const winMusic = document.getElementById('win-music');
    if (!winMusic) return;
    const playBtn = winMusic.querySelector('.retro-btn:nth-of-type(2)');
    const pauseBtn = winMusic.querySelector('.retro-btn:nth-of-type(3)');
    const prevBtn = winMusic.querySelector('.retro-btn:nth-of-type(1)');
    const nextBtn = winMusic.querySelector('.retro-btn:nth-of-type(4)');
    const display = winMusic.querySelector('.sunken-panel');
    if (!playBtn || !display) return;

    const tracks = [
        { name: 'POLICE_SIREN.MID', dur: '02:45', notes: [440, 587, 440, 587, 440, 587] },
        { name: 'DETECTIVE_NOIR.MID', dur: '03:12', notes: [220, 261, 293, 329, 392, 329, 293] },
        { name: 'MIDNIGHT_SYNTH.MID', dur: '02:08', notes: [330, 392, 493, 587, 493, 392] }
    ];
    let curTrack = 0;
    let audioCtx = null;
    let timerId = null;
    let step = 0;
    let isPlaying = false;

    function renderDisplay(state) {
        const t = tracks[curTrack];
        display.textContent = `${state} TRACK 0${curTrack + 1}: ${t.name} [${t.dur}]`;
    }

    function playBeep() {
        if (!isPlaying) return;
        try {
            if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            if (audioCtx.state === 'suspended') audioCtx.resume();
            const note = tracks[curTrack].notes[step % tracks[curTrack].notes.length];
            step++;
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(note, audioCtx.currentTime);
            gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.22);
        } catch (e) {}
    }

    playBtn.addEventListener('click', () => {
        if (isPlaying) return;
        isPlaying = true;
        renderDisplay('▶ PLAYING:');
        playBeep();
        timerId = setInterval(playBeep, 240);
    });

    pauseBtn.addEventListener('click', () => {
        isPlaying = false;
        clearInterval(timerId);
        renderDisplay('⏸ PAUSED:');
    });

    nextBtn.addEventListener('click', () => {
        curTrack = (curTrack + 1) % tracks.length;
        step = 0;
        renderDisplay(isPlaying ? '▶ PLAYING:' : '■ READY:');
    });

    prevBtn.addEventListener('click', () => {
        curTrack = (curTrack - 1 + tracks.length) % tracks.length;
        step = 0;
        renderDisplay(isPlaying ? '▶ PLAYING:' : '■ READY:');
    });
}

// Settings Window Preferences
function initSettings() {
    const checkboxes = document.querySelectorAll('#win-settings input[type="checkbox"]');
    if (checkboxes.length < 3) return;
    const [scanlines, shadows, autosave] = checkboxes;

    scanlines.addEventListener('change', () => {
        document.body.classList.toggle('no-scanlines', !scanlines.checked);
        localStorage.setItem('qc_pref_scanlines', scanlines.checked);
    });

    shadows.addEventListener('change', () => {
        document.querySelectorAll('.retro-window').forEach(w => w.classList.toggle('no-shadow', !shadows.checked));
        localStorage.setItem('qc_pref_shadows', shadows.checked);
    });

    autosave.addEventListener('change', () => {
        localStorage.setItem('qc_setting_autosave', autosave.checked);
    });
}

// Web Browser Window Navigation
function initBrowser() {
    const winBrowser = document.getElementById('win-browser');
    if (!winBrowser) return;
    const addrInput = winBrowser.querySelector('input[type="text"]');
    const content = winBrowser.querySelector('.sunken-panel:nth-of-type(2)');
    if (!addrInput || !content) return;

    const pages = {
        'http://lzpd.precinct.net/bulletin': `
            <h3 style="margin-top:0;">LZPD Police Department Intranet</h3>
            <p>Welcome Detective. Use this station to cross-reference evidence, investigate clues, and interrogate suspects.</p>
            <p style="color:#166534;font-weight:bold;margin-top:8px;">● Case Database Connected: Online</p>
            <div style="margin-top:12px;display:flex;gap:8px;">
                <button class="retro-btn btn-nav" data-url="http://lzpd.precinct.net/wanted">Wanted Board</button>
                <button class="retro-btn btn-nav" data-url="http://lzpd.precinct.net/protocol">Evidence Protocol</button>
            </div>
        `,
        'http://lzpd.precinct.net/wanted': `
            <h3 style="margin-top:0;">⚠ LZPD Most Wanted Bulletin</h3>
            <p>Active warrants pending for corporate espionage, high-stakes theft, and vault breaches.</p>
            <p>Check the Clue Locker before presenting evidence to the district magistrate.</p>
            <div style="margin-top:12px;">
                <button class="retro-btn btn-nav" data-url="http://lzpd.precinct.net/bulletin">← Return to Bulletin</button>
            </div>
        `,
        'http://lzpd.precinct.net/protocol': `
            <h3 style="margin-top:0;">📋 Evidence Handling Directives</h3>
            <p>1. Always identify suspect fingerprint and badge records with case_id parameters.</p>
            <p>2. Physical clues must match crime scene entry timestamps.</p>
            <div style="margin-top:12px;">
                <button class="retro-btn btn-nav" data-url="http://lzpd.precinct.net/bulletin">← Return to Bulletin</button>
            </div>
        `
    };

    content.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-nav');
        if (btn) {
            const url = btn.getAttribute('data-url');
            if (pages[url]) {
                addrInput.value = url;
                content.innerHTML = pages[url];
            }
        }
    });
}

// =========================================
// CASE CONTEXT LOADING
// =========================================

async function loadCaseContext(id) {
    caseId = parseInt(id, 10);
    localStorage.setItem('qc_active_case', caseId);

    const caseLabel = document.getElementById('activeCaseLabel');
    if (caseLabel) caseLabel.textContent = `Loading case #${caseId}...`;

    let caseData = null;
    try {
        const res = await apiFetch(`/cases/${caseId}`);
        if (!res.ok) throw new Error(`Case ${caseId} not found`);
        caseData = await res.json();
        let displayNum = caseId;
        if (Array.isArray(cachedCasesList) && cachedCasesList.length > 0) {
            const idx = cachedCasesList.findIndex(c => Number(c.caseId) === Number(caseId));
            if (idx >= 0) displayNum = idx + 1;
        }
        if (caseLabel) caseLabel.textContent = `Case #${displayNum}: ${caseData.title}`;
    } catch (e) {
        console.warn('Could not load case metadata:', e.message);
    }

    await Promise.all([
        loadSuspects(caseId),
        loadEvidence(caseId),
        loadAccusationSuspects(caseId)
    ]);
    loadCaseList();

    if (typeof initTabs === 'function') initTabs();
}


// =========================================
// SUSPECTS WINDOW
// =========================================

async function loadSuspects(id) {
    const tbody = document.getElementById('suspectsTableBody');
    if (!tbody) return;

    setTableState(tbody, 4, 'Loading suspects...');

    try {
        const res = await apiFetch(`/cases/${id}/suspects`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const suspects = await res.json();

        if (!suspects.length) {
            setTableState(tbody, 4, 'No suspects found for this case.');
            return;
        }

        tbody.innerHTML = suspects.map(s => `
            <tr>
                <td>${s.suspectId}</td>
                <td>${esc(s.name ? s.name.split(' ')[0] : '—')}</td>
                <td>${esc(s.name ? s.name.split(' ').slice(1).join(' ') : '—')}</td>
                <td>${esc(s.occupation || '—')}</td>
            </tr>
        `).join('');
    } catch (e) {
        setTableState(tbody, 4, `Error: ${e.message}`);
    }
}

// =========================================
// CLUE EXPLORER WINDOW
// =========================================

async function loadEvidence(id) {
    const grid = document.getElementById('clueGrid');
    if (!grid) return;

    grid.innerHTML = '<div style="padding:12px;font-size:11px;color:#555;">Loading evidence...</div>';

    try {
        const [evRes, sceneRes] = await Promise.all([
            apiFetch(`/cases/${id}/evidence`),
            apiFetch(`/cases/${id}/crime-scenes`)
        ]);

        const evidence = evRes.ok ? await evRes.json() : [];
        const scenes = sceneRes.ok ? await sceneRes.json() : [];

        if (!evidence.length && !scenes.length) {
            grid.innerHTML = '<div style="padding:12px;font-size:11px;color:#555;">No clues found for this case.</div>';
            return;
        }

        grid.innerHTML = '';

        scenes.forEach(s => {
            const card = document.createElement('div');
            card.className = 'clue-card';
            card.title = 'Click to inspect in Forensic Viewer';
            card.innerHTML = `
                <div class="mugshot-placeholder">
                    ${getAnimatedClueVisual(s, true, false)}
                </div>
                <strong>${esc(s.name || 'Scene')}</strong>
                <span style="font-size:9px;color:#555;">${esc(s.location || '')}</span>
            `;
            card.addEventListener('click', () => openEvidenceViewer(s, true));
            grid.appendChild(card);
        });

        evidence.forEach(e => {
            const card = document.createElement('div');
            card.className = 'clue-card';
            card.title = 'Click to inspect in Forensic Viewer';
            card.innerHTML = `
                <div class="mugshot-placeholder">
                    ${getAnimatedClueVisual(e, false, false)}
                </div>
                <strong>${esc(e.evidenceType || 'Clue')}</strong>
                <span style="font-size:9px;color:#555;">${esc(e.location || e.dateFound || '')}</span>
            `;
            card.addEventListener('click', () => openEvidenceViewer(e, false));
            grid.appendChild(card);
        });
    } catch (e) {
        grid.innerHTML = `<div style="padding:12px;font-size:11px;color:#c00;">Error loading clues: ${esc(e.message)}</div>`;
    }
}

// Forensic Evidence Viewer Inspector Logic
function openEvidenceViewer(item, isScene) {
    const win = document.getElementById('win-evidence-detail');
    if (!win) return;

    const titleEl = document.getElementById('evidenceViewerTitle');
    const crtPhoto = document.getElementById('evidenceCrtPhoto');
    const scanStatus = document.getElementById('evidenceScanStatus');
    const tagEl = document.getElementById('evidenceTag');
    const dateEl = document.getElementById('evidenceDate');
    const nameEl = document.getElementById('evidenceName');
    const locEl = document.getElementById('evidenceLocation');
    const descEl = document.getElementById('evidenceDesc');

    if (titleEl) titleEl.textContent = isScene ? `Crime Scene: ${item.name || 'Site'}` : `Exhibit: ${item.evidenceType || 'Clue'}`;
    if (crtPhoto) crtPhoto.innerHTML = getAnimatedClueVisual(item, isScene, true);
    if (scanStatus) scanStatus.innerHTML = isScene ? '<span style="color:#0284c7;">● SCENE: LOGGED ON RECORD</span>' : '<span style="color:#16a34a;">● SCAN: 98.6% FORENSIC MATCH</span>';
    if (tagEl) {
        tagEl.textContent = isScene ? 'SCENE RECORD' : `EXHIBIT #${item.evidenceId || '1'}`;
        tagEl.style.backgroundColor = isScene ? '#0284c7' : '#b91c1c';
    }
    if (dateEl) dateEl.textContent = item.dateFound || (isScene ? 'RECORDED SITE' : 'EVIDENCE LOG');
    if (nameEl) nameEl.textContent = isScene ? (item.name || 'Crime Scene') : (item.evidenceType || 'Forensic Item');
    if (locEl) locEl.textContent = item.location || 'Location Not Specified';
    if (descEl) descEl.textContent = item.description || 'No additional detective notes recorded on file.';

    bringToFront(win);
}

// Animated Retro SVG Visual Generator for Clues
function getAnimatedClueVisual(item, isScene, isLarge) {
    const size = isLarge ? 160 : 64;
    const text = ((item.evidenceType || '') + ' ' + (item.name || '') + ' ' + (item.description || '')).toLowerCase();

    if (isScene) {
        return `
            <svg viewBox="0 0 100 100" style="width:100%;height:100%;display:block;">
                <rect width="100" height="100" fill="#091026"/>
                <line x1="10" y1="90" x2="90" y2="90" stroke="#1e293b" stroke-width="1.5"/>
                <line x1="20" y1="75" x2="80" y2="75" stroke="#1e293b" stroke-width="1"/>
                <line x1="30" y1="60" x2="70" y2="60" stroke="#1e293b" stroke-width="0.8"/>
                <line x1="10" y1="90" x2="45" y2="50" stroke="#1e293b" stroke-width="1"/>
                <line x1="90" y1="90" x2="55" y2="50" stroke="#1e293b" stroke-width="1"/>
                <line x1="50" y1="90" x2="50" y2="50" stroke="#1e293b" stroke-width="1"/>
                <polygon points="15,82 85,82 80,72 20,72" fill="#eab308" opacity="0.9"/>
                <line x1="22" y1="82" x2="30" y2="72" stroke="#000" stroke-width="3"/>
                <line x1="42" y1="82" x2="50" y2="72" stroke="#000" stroke-width="3"/>
                <line x1="62" y1="82" x2="70" y2="72" stroke="#000" stroke-width="3"/>
                <circle cx="50" cy="35" r="16" fill="#0284c7" opacity="0.25" style="animation:dotBlink 0.7s infinite;"/>
                <circle cx="50" cy="35" r="9" fill="#38bdf8" style="animation:dotBlink 0.7s infinite;"/>
                <path d="M42 45 L58 45 L54 30 L46 30 Z" fill="#e2e8f0"/>
                <polygon points="35,62 35,50 45,55" fill="#facc15" stroke="#000" stroke-width="0.5"/>
                <line x1="35" y1="62" x2="35" y2="70" stroke="#fff" stroke-width="1.5"/>
            </svg>
        `;
    }

    if (text.includes('fingerprint') || text.includes('print') || text.includes('dna') || text.includes('biometric')) {
        const sweepAnim = isLarge ? 'laserSweep 2s ease-in-out infinite' : 'laserSweepThumb 1.8s ease-in-out infinite';
        return `
            <svg viewBox="0 0 100 100" style="width:100%;height:100%;display:block;">
                <rect width="100" height="100" fill="#02140d"/>
                <line x1="10" y1="50" x2="90" y2="50" stroke="#064e3b" stroke-width="0.5" stroke-dasharray="2,2"/>
                <line x1="50" y1="10" x2="50" y2="90" stroke="#064e3b" stroke-width="0.5" stroke-dasharray="2,2"/>
                <g fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" opacity="0.85">
                    <circle cx="50" cy="50" r="8"/>
                    <path d="M36 50 A14 16 0 0 1 64 50 A14 20 0 0 1 50 70 A14 16 0 0 1 36 50"/>
                    <path d="M30 48 A20 23 0 0 1 70 48 A20 27 0 0 1 50 76 A20 22 0 0 1 30 52"/>
                    <path d="M24 46 A26 29 0 0 1 76 46 A26 34 0 0 1 50 82 A26 28 0 0 1 24 54"/>
                    <path d="M19 44 A32 35 0 0 1 81 44"/>
                </g>
                <path d="M18 26 H26 M18 26 V34 M82 26 H74 M82 26 V34 M18 74 H26 M18 74 V66 M82 74 H74 M82 74 V66" stroke="#34d399" stroke-width="2" fill="none"/>
                <line x1="10" y1="50" x2="90" y2="50" stroke="#4ade80" stroke-width="3" style="animation:${sweepAnim};filter:drop-shadow(0 0 4px #4ade80);"/>
            </svg>
        `;
    }

    if (text.includes('weapon') || text.includes('gun') || text.includes('knife') || text.includes('blade') || text.includes('bullet') || text.includes('poison') || text.includes('chemical') || text.includes('vial') || text.includes('bottle') || text.includes('syringe')) {
        const isPoison = text.includes('poison') || text.includes('chemical') || text.includes('vial');
        return `
            <svg viewBox="0 0 100 100" style="width:100%;height:100%;display:block;">
                <rect width="100" height="100" fill="#180707"/>
                <circle cx="50" cy="50" r="42" fill="none" stroke="#7f1d1d" stroke-width="1.5"/>
                <circle cx="50" cy="50" r="28" fill="none" stroke="#7f1d1d" stroke-width="1" stroke-dasharray="2,3"/>
                <circle cx="50" cy="50" r="14" fill="none" stroke="#7f1d1d" stroke-width="0.8"/>
                <line x1="8" y1="50" x2="92" y2="50" stroke="#7f1d1d" stroke-width="0.8"/>
                <line x1="50" y1="8" x2="50" y2="92" stroke="#7f1d1d" stroke-width="0.8"/>
                ${isPoison ?
                    '<path d="M44 26 h12 v8 l8 14 v26 h-28 v-26 l8 -14 z" fill="#f59e0b" opacity="0.85" stroke="#fff" stroke-width="1.5"/><circle cx="50" cy="62" r="5" fill="#ef4444" style="animation:dotBlink 0.8s infinite;"/>' :
                    '<path d="M50 22 L56 46 L53 72 L47 72 L44 46 Z" fill="#f87171" opacity="0.9" stroke="#fff" stroke-width="1.5"/><rect x="42" y="72" width="16" height="5" fill="#991b1b"/><rect x="47" y="77" width="6" height="10" fill="#450a0a"/>'
                }
                <g style="transform-origin:50px 50px;animation:radarSpin 3s linear infinite;">
                    <line x1="50" y1="50" x2="50" y2="8" stroke="#ef4444" stroke-width="2" style="filter:drop-shadow(0 0 3px #ef4444);"/>
                    <polygon points="50,50 50,8 75,18" fill="rgba(239, 68, 68, 0.25)"/>
                </g>
                <circle cx="80" cy="20" r="3" fill="#ef4444" style="animation:dotBlink 0.6s infinite;"/>
            </svg>
        `;
    }

    if (text.includes('cctv') || text.includes('camera') || text.includes('video') || text.includes('digital') || text.includes('phone') || text.includes('call') || text.includes('audio') || text.includes('log') || text.includes('computer') || text.includes('drive') || text.includes('usb') || text.includes('disk')) {
        return `
            <svg viewBox="0 0 100 100" style="width:100%;height:100%;display:block;">
                <rect width="100" height="100" fill="#030712"/>
                <rect x="8" y="10" width="84" height="80" rx="3" fill="none" stroke="#334155" stroke-width="1.5"/>
                <circle cx="20" cy="22" r="4" fill="#ef4444" style="animation:dotBlink 0.9s infinite;"/>
                <text x="28" y="25" fill="#ef4444" font-size="7" font-weight="bold" font-family="monospace">REC</text>
                <text x="64" y="24" fill="#64748b" font-size="6" font-family="monospace">CAM-02</text>
                <g fill="#38bdf8" style="transform-origin:50px 55px;">
                    <rect x="20" y="44" width="6" height="22" style="animation:waveOscillate 0.6s ease-in-out infinite alternate;"/>
                    <rect x="30" y="38" width="6" height="34" style="animation:waveOscillate 0.8s ease-in-out infinite alternate;"/>
                    <rect x="40" y="32" width="6" height="46" style="animation:waveOscillate 0.5s ease-in-out infinite alternate;"/>
                    <rect x="50" y="40" width="6" height="30" style="animation:waveOscillate 0.7s ease-in-out infinite alternate;"/>
                    <rect x="60" y="35" width="6" height="40" style="animation:waveOscillate 0.9s ease-in-out infinite alternate;"/>
                    <rect x="70" y="45" width="6" height="20" style="animation:waveOscillate 0.6s ease-in-out infinite alternate;"/>
                </g>
                <text x="24" y="82" fill="#22c55e" font-size="6" font-family="monospace">23:41:09:82</text>
            </svg>
        `;
    }

    if (text.includes('document') || text.includes('ledger') || text.includes('paper') || text.includes('receipt') || text.includes('note') || text.includes('letter') || text.includes('contract') || text.includes('check')) {
        return `
            <svg viewBox="0 0 100 100" style="width:100%;height:100%;display:block;">
                <rect width="100" height="100" fill="#130826"/>
                <g style="animation:uvPulse 2.2s ease-in-out infinite;">
                    <polygon points="26,14 62,14 74,26 74,86 26,86" fill="#f8fafc" stroke="#6b21a8" stroke-width="2"/>
                    <polygon points="62,14 62,26 74,26" fill="#c084fc"/>
                    <line x1="34" y1="36" x2="66" y2="36" stroke="#475569" stroke-width="2.5" stroke-linecap="round"/>
                    <line x1="34" y1="46" x2="66" y2="46" stroke="#9333ea" stroke-width="2.5" stroke-linecap="round"/>
                    <line x1="34" y1="56" x2="56" y2="56" stroke="#475569" stroke-width="2.5" stroke-linecap="round"/>
                    <line x1="34" y1="66" x2="62" y2="66" stroke="#c084fc" stroke-width="2.5" stroke-linecap="round"/>
                    <rect x="34" y="74" width="18" height="6" fill="#dc2626"/>
                </g>
                <circle cx="50" cy="50" r="32" fill="none" stroke="#a855f7" stroke-width="1.5" stroke-dasharray="3,3" opacity="0.7"/>
            </svg>
        `;
    }

    // Default: Forensic Loupe / Particle Magnifier Grid
    return `
        <svg viewBox="0 0 100 100" style="width:100%;height:100%;display:block;">
            <rect width="100" height="100" fill="#0f172a"/>
            <line x1="12" y1="50" x2="88" y2="50" stroke="#334155" stroke-width="1"/>
            <line x1="50" y1="12" x2="50" y2="88" stroke="#334155" stroke-width="1"/>
            <circle cx="50" cy="50" r="34" fill="none" stroke="#38bdf8" stroke-width="1.5" stroke-dasharray="3,3"/>
            <circle cx="44" cy="46" r="3" fill="#facc15"/>
            <circle cx="54" cy="42" r="2" fill="#facc15" opacity="0.8"/>
            <circle cx="52" cy="54" r="2.5" fill="#facc15" opacity="0.9"/>
            <circle cx="50" cy="50" r="18" fill="rgba(56, 189, 248, 0.2)" stroke="#38bdf8" stroke-width="2"/>
            <line x1="32" y1="50" x2="68" y2="50" stroke="#38bdf8" stroke-width="1.5" style="animation:laserSweepThumb 2s infinite;"/>
            <circle cx="78" cy="22" r="2" fill="#38bdf8" style="animation:dotBlink 0.8s infinite;"/>
        </svg>
    `;
}

// =========================================
// ARREST WARRANT WINDOW — Suspect dropdown
// =========================================

async function loadAccusationSuspects(id) {
    const select = document.getElementById('accusedSuspect');
    if (!select) return;

    select.innerHTML = '<option value="">Loading suspects...</option>';
    select.disabled = true;

    try {
        const res = await apiFetch(`/cases/${id}/suspects`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const suspects = await res.json();

        select.innerHTML = '<option value="">-- Select Suspect --</option>';
        suspects.forEach(s => {
            const opt = document.createElement('option');
            opt.value = s.suspectId;
            opt.textContent = `${s.name}${s.occupation ? ' (' + s.occupation + ')' : ''}`;
            select.appendChild(opt);
        });
        select.disabled = false;
    } catch (e) {
        select.innerHTML = '<option value="">Error loading suspects</option>';
    }
}

// =========================================
// CASE LIST (Manual window)
// =========================================

async function loadCaseList() {
    const caseGrid = document.getElementById('caseGrid');
    if (!caseGrid) return;

    try {
        const res = await apiFetch(`/cases`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const cases = await res.json();

        if (!cases.length) {
            caseGrid.innerHTML = '<div style="font-size:11px;">No cases available.</div>';
            return;
        }

        cachedCasesList = cases;
        caseGrid.innerHTML = '';
        cases.forEach((c, index) => {
            const div = document.createElement('div');
            div.style.cssText = 'padding:8px 10px;border:1px solid var(--win-border-dark);background:#fff;display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;';
            const isCurrent = Number(c.caseId) === Number(caseId);
            const displayNum = index + 1;
            div.innerHTML = `
                <div>
                    <strong>Case #${displayNum}: ${esc(c.title)}</strong>
                    <div style="font-size:10px;color:#555;margin-top:2px;">${esc(c.difficulty || 'Normal')} · ${esc(c.crimeType || '')}</div>
                </div>
                <button class="retro-btn btn-select-case" data-case-id="${c.caseId}" style="font-size:11px;padding:3px 12px;min-width:68px;font-weight:${isCurrent ? 'bold' : 'normal'};" ${isCurrent ? 'disabled' : ''}>
                    ${isCurrent ? 'Active' : 'Select'}
                </button>
            `;
            caseGrid.appendChild(div);
        });

        // Update active case label with sequential number if available
        const currentActive = cases.find(c => Number(c.caseId) === Number(caseId));
        if (currentActive) {
            const activeIndex = cases.indexOf(currentActive) + 1;
            const caseLabel = document.getElementById('activeCaseLabel');
            if (caseLabel && currentActive.title) {
                caseLabel.textContent = `Case #${activeIndex}: ${currentActive.title}`;
            }
        }

        // Event delegation on caseGrid ensures clicks always trigger
        caseGrid.onclick = (e) => {
            const btn = e.target.closest('.btn-select-case');
            if (btn && !btn.disabled && btn.dataset.caseId) {
                e.preventDefault();
                e.stopPropagation();
                loadCaseContext(btn.dataset.caseId);
            }
        };
    } catch (e) {
        caseGrid.innerHTML = `<div style="font-size:11px;color:#c00;">Error: ${esc(e.message)}</div>`;
    }

    // Daily Generation Limit Logic
    updateGenerateButtonState();

    // Wire up Generate Case button each time list is refreshed
    const btnGen = document.getElementById('btnGenerateCase');
    if (btnGen && !btnGen._wired) {
        btnGen._wired = true;
        btnGen.addEventListener('click', generateCase);
    }
}

// =========================================
// AI CASE GENERATION (DAILY LIMIT: 5)
// =========================================

const DAILY_MAX_GENERATIONS = 5;

function getDailyGenCount() {
    const today = new Date().toISOString().split('T')[0];
    const savedDate = localStorage.getItem('qc_gen_date');
    if (savedDate !== today) {
        localStorage.setItem('qc_gen_date', today);
        localStorage.setItem('qc_gen_count', '0');
        return 0;
    }
    return parseInt(localStorage.getItem('qc_gen_count') || '0', 10);
}

function updateGenerateButtonState() {
    const btn = document.getElementById('btnGenerateCase');
    const status = document.getElementById('generateCaseStatus');
    const used = getDailyGenCount();
    const remaining = Math.max(0, DAILY_MAX_GENERATIONS - used);

    if (btn) {
        if (remaining <= 0) {
            btn.disabled = true;
            btn.textContent = '🔒 Daily Limit Reached (0/5)';
            if (status) {
                status.style.color = '#c00';
                status.textContent = 'You have reached the daily limit of 5 cases. Resets tomorrow!';
            }
        } else {
            btn.disabled = false;
            btn.textContent = `✦ Generate New Case (AI) [${remaining}/5 left today]`;
        }
    }
}

async function generateCase() {
    const btn = document.getElementById('btnGenerateCase');
    const status = document.getElementById('generateCaseStatus');
    if (!btn || !status) return;

    if (getDailyGenCount() >= DAILY_MAX_GENERATIONS) {
        updateGenerateButtonState();
        return;
    }

    btn.disabled = true;
    btn.textContent = '⏳ Generating...';
    status.style.color = '#555';
    status.textContent = 'Contacting AI...';

    // Animated waiting dots
    let dotCount = 0;
    const dotTimer = setInterval(() => {
        dotCount = (dotCount + 1) % 4;
        status.textContent = 'Contacting AI' + '.'.repeat(dotCount || 1) + ' (this takes ~30s)';
    }, 600);

    try {
        const res = await apiFetch('/generated-case/generate-and-save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });

        clearInterval(dotTimer);

        if (!res.ok) {
            const err = await res.text();
            let msg = err;
            try {
                const parsed = JSON.parse(err);
                msg = parsed.message || parsed.error || err;
            } catch(e) {}
            throw new Error(msg || `HTTP ${res.status}`);
        }

        const newCase = await res.json();

        // Increment daily count
        localStorage.setItem('qc_gen_count', String(getDailyGenCount() + 1));

        status.style.color = '#166534';
        status.textContent = `✔ Case "${newCase.title || 'Generated'}" added! Loading...`;

        await loadCaseList();

        // Auto-load the new case so the player can start immediately
        if (newCase.caseId) {
            await loadCaseContext(newCase.caseId);
            status.textContent = `✔ Now investigating: "${newCase.title || 'New Case'}"!`;
        }
    } catch (e) {
        clearInterval(dotTimer);
        status.style.color = '#c00';
        status.textContent = `✘ Error: ${e.message}`;
    } finally {
        updateGenerateButtonState();
    }
}

// =========================================
// SQL QUERY EXECUTION
// =========================================

const btnExecute = document.getElementById('executeQuery');
if (btnExecute) {
    btnExecute.addEventListener('click', async () => {
        const queryInput = document.getElementById('sqlQuery');
        const statusEl = document.getElementById('queryStatus');
        const timeEl = document.getElementById('executionTime');
        const headEl = document.getElementById('resultsHead');
        const bodyEl = document.getElementById('resultsBody');

        const query = queryInput.value.trim();
        if (!query) {
            statusEl.textContent = 'Error: Query cannot be empty.';
            statusEl.style.color = '#c00';
            return;
        }

        statusEl.textContent = 'Executing...';
        statusEl.style.color = '#000';
        btnExecute.disabled = true;

        try {
            const res = await apiFetch(`/query/execute`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ caseId, query })
            });
            const data = await res.json();

            if (!res.ok) {
                statusEl.textContent = `Error: ${data.message || 'Execution failed'}`;
                statusEl.style.color = '#c00';
                headEl.innerHTML = '<tr><th>Error</th></tr>';
                bodyEl.innerHTML = `<tr><td style="color:#c00;">${esc(data.message || 'Query failed')}</td></tr>`;
                return;
            }

            // Save to query history
            try {
                let hist = JSON.parse(localStorage.getItem('qc_query_history') || '[]');
                if (!hist.includes(query)) {
                    hist.unshift(query);
                    if (hist.length > 20) hist.pop();
                    localStorage.setItem('qc_query_history', JSON.stringify(hist));
                }
            } catch (e) {}

            // Save Table checkbox handling
            const chkSave = document.getElementById('chkSaveTable');
            let savedNotice = '';
            if (chkSave && chkSave.checked && data.rows && data.rows.length) {
                const csvData = [(data.columns || []).join('\t'), ...data.rows.map(r => r.join('\t'))].join('\n');
                localStorage.setItem('qc_saved_table_result', csvData);
                savedNotice = ' [Table Saved]';
            }

            statusEl.textContent = `${data.rowCount} row(s) returned${savedNotice}`;
            statusEl.style.color = '#060';
            if (timeEl) timeEl.textContent = `${data.executionMs} ms`;

            headEl.innerHTML = '';
            const trHead = document.createElement('tr');
            (data.columns || []).forEach(col => {
                const th = document.createElement('th');
                th.textContent = col;
                trHead.appendChild(th);
            });
            headEl.appendChild(trHead);

            bodyEl.innerHTML = '';
            (data.rows || []).forEach(row => {
                const tr = document.createElement('tr');
                row.forEach(cell => {
                    const td = document.createElement('td');
                    td.textContent = cell;
                    tr.appendChild(td);
                });
                bodyEl.appendChild(tr);
            });

            if (!data.rows || !data.rows.length) {
                bodyEl.innerHTML = '<tr><td colspan="99" style="color:#555;">No rows returned.</td></tr>';
            }
        } catch (e) {
            statusEl.textContent = `Network Error: ${e.message}`;
            statusEl.style.color = '#c00';
        } finally {
            btnExecute.disabled = false;
            saveCurrentTabState();
        }
    });
}

// =========================================
// ARREST WARRANT SUBMISSION
// =========================================

const btnSubmitAccusation = document.getElementById('submitAccusation');
if (btnSubmitAccusation) {
    btnSubmitAccusation.addEventListener('click', async () => {
        const select = document.getElementById('accusedSuspect');
        const motive = document.getElementById('motive');
        const explanation = document.getElementById('explanation');
        const statusEl = document.getElementById('accusationStatus');
        const resultEl = document.getElementById('accusationResult');

        const suspectId = parseInt(select.value, 10);
        const explanationText = explanation.value.trim();

        if (!suspectId) {
            statusEl.textContent = 'Please select a suspect.';
            statusEl.style.color = '#c00';
            return;
        }
        if (!explanationText) {
            statusEl.textContent = 'Explanation is required.';
            statusEl.style.color = '#c00';
            return;
        }

        statusEl.textContent = 'Filing warrant...';
        statusEl.style.color = '#000';
        btnSubmitAccusation.disabled = true;

        try {
            const res = await apiFetch(`/cases/${caseId}/accusation`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    accusedSuspectId: suspectId,
                    motive: motive ? motive.value.trim() : '',
                    explanation: explanationText
                })
            });
            const data = await res.json();

            if (!res.ok) {
                statusEl.textContent = `Error: ${data.message || 'Submission failed'}`;
                statusEl.style.color = '#c00';
                return;
            }

            statusEl.textContent = 'Warrant processed.';
            resultEl.innerHTML = `
                <div style="padding:10px;border:2px solid ${data.correct ? '#060' : '#c00'};background:#fff;">
                    <h3 style="margin-top:0;color:${data.correct ? '#060' : '#c00'};">
                        ${data.correct ? '✓ ARREST WARRANT APPROVED' : '✗ ARREST WARRANT REJECTED'}
                    </h3>
                    <p style="font-size:13px;">${esc(data.feedback || '')}</p>
                    ${data.solution ? `
                        <details style="font-size:11px;margin-top:6px;">
                            <summary><strong>View Solution</strong></summary>
                            <div style="background:#f5f5f5;padding:6px;margin-top:4px;">
                                <strong>Motive:</strong> ${esc(data.solution.motive || 'N/A')}<br>
                                <strong>Method:</strong> ${esc(data.solution.crimeMethod || 'N/A')}<br>
                                <strong>Explanation:</strong> ${esc(data.solution.explanation || 'N/A')}
                            </div>
                        </details>
                    ` : ''}
                </div>
            `;
        } catch (e) {
            statusEl.textContent = `Network Error: ${e.message}`;
            statusEl.style.color = '#c00';
        } finally {
            btnSubmitAccusation.disabled = false;
        }
    });
}

// =========================================
// UTILITY
// =========================================

function esc(str) {
    return String(str ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function setTableState(tbody, cols, msg) {
    tbody.innerHTML = `<tr><td colspan="${cols}" style="text-align:center;color:#555;padding:10px;">${esc(msg)}</td></tr>`;
}

window.loadEvidence = loadEvidence;
window.loadSuspects = loadSuspects;
window.loadAccusationSuspects = loadAccusationSuspects;
window.loadCaseList = loadCaseList;
window.loadCaseContext = loadCaseContext;
window.initResizableWindows = initResizableWindows;
window.toggleMaximize = toggleMaximize;