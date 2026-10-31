// =========================================
// QUERY & CLUE — RETRO OS LOGIC (app.js)
// =========================================

const getApiBase = () => {
    if (typeof window !== 'undefined' && window.API_BASE_URL) {
        if (window.API_BASE_URL.includes('query-and-clue-9sag.onrender.com')) {
            return 'https://query-and-clue.onrender.com/api';
        }
        return window.API_BASE_URL;
    }
    const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    return isLocal ? 'http://localhost:8081/api' : 'https://query-and-clue.onrender.com/api';
};

let activeApiRequests = 0;
function showPrecinctConnecting(show, text, progressPercent = null) {
    const banner = document.getElementById('precinctConnectingBanner');
    const label = document.getElementById('precinctConnectingText');
    const bootScreen = document.getElementById('precinctBootScreen');
    const bootText = document.getElementById('bootStatusText');
    const bootBar = document.getElementById('bootProgressBar');
    const retryContainer = document.getElementById('bootRetryContainer');

    if (show) {
        if (label && text) label.textContent = text;
        if (banner) banner.style.display = 'flex';
        if (bootScreen) {
            bootScreen.style.display = 'flex';
            if (bootText && text) bootText.textContent = text;
            if (bootBar && progressPercent !== null) bootBar.style.width = `${progressPercent}%`;
            if (retryContainer) retryContainer.style.display = 'none';
        }
    } else if (activeApiRequests <= 0) {
        if (banner) banner.style.display = 'none';
        if (bootScreen) {
            if (bootBar) bootBar.style.width = '100%';
            setTimeout(() => {
                if (activeApiRequests <= 0) bootScreen.style.display = 'none';
            }, 350);
        }
    }
}

function showPrecinctBootError() {
    const bootScreen = document.getElementById('precinctBootScreen');
    const retryContainer = document.getElementById('bootRetryContainer');
    const bootText = document.getElementById('bootStatusText');
    if (bootScreen) bootScreen.style.display = 'flex';
    if (retryContainer) retryContainer.style.display = 'block';
    if (bootText) bootText.textContent = 'Precinct database connection timed out after multiple attempts.';
}

async function apiFetch(endpoint, options = {}, retries = 2) {
    const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    const delay = (ms) => new Promise(r => setTimeout(r, ms));
    const retryDelays = [1200, 2500, 4000];

    for (let attempt = 0; attempt <= retries; attempt++) {
        activeApiRequests++;
        const controller = new AbortController();
        // 14-second timeout per attempt to comfortably allow Render spin-up
        const timeoutMs = 14000;
        const progressStep = attempt === 0 ? 30 : (attempt === 1 ? 65 : 85);
        const bannerTimer = setTimeout(() => {
            showPrecinctConnecting(true, attempt > 0 
                ? `Connecting to Police Records (Server waking up... attempt ${attempt + 1}/${retries + 1})`
                : 'Connecting to Police Records Mainframe (Waking up precinct server on Render...)...', progressStep);
        }, 1000);

        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
        const fetchOptions = { ...options, signal: controller.signal };

        try {
            const res = await fetch(`${getApiBase()}${endpoint}`, fetchOptions);
            clearTimeout(bannerTimer);
            clearTimeout(timeoutId);
            activeApiRequests--;
            showPrecinctConnecting(false);

            // If Render cold-start returns 502/503/504 gateway errors, retry
            if ([502, 503, 504].includes(res.status) && attempt < retries) {
                await delay(retryDelays[attempt]);
                continue;
            }
            return res;
        } catch (e) {
            clearTimeout(bannerTimer);
            clearTimeout(timeoutId);
            activeApiRequests--;
            showPrecinctConnecting(false);

            // Local dev fallback if remote fails
            if (isLocal && !getApiBase().includes('127.0.0.1')) {
                try {
                    const fbCtrl = new AbortController();
                    const fbTimeout = setTimeout(() => fbCtrl.abort(), 6000);
                    const res = await fetch(`http://127.0.0.1:8081/api${endpoint}`, { ...options, signal: fbCtrl.signal });
                    clearTimeout(fbTimeout);
                    return res;
                } catch (err2) {
                    // fall through to retry
                }
            }

            if (attempt < retries) {
                await delay(retryDelays[attempt]);
            } else {
                showPrecinctBootError();
                throw e;
            }
        }
    }
}


let caseId = parseInt(localStorage.getItem('qc_active_case') || '1', 10);
let cachedCasesList = [];
let sessionQueriesCount = 0;
let sessionStartTime = Date.now();
let sessionIncorrectAccusations = 0;
let currentInvestigationStage = 1;
if (!window.highestZ) window.highestZ = 100;

// =========================================
// INIT & WINDOW MANAGEMENT
// =========================================

function init() {
    const btnBootRetry = document.getElementById('btnBootRetry');
    if (btnBootRetry) {
        btnBootRetry.addEventListener('click', () => {
            const retryContainer = document.getElementById('bootRetryContainer');
            if (retryContainer) retryContainer.style.display = 'none';
            showPrecinctConnecting(true, 'Retrying connection to precinct server...', 25);
            loadCaseContext(caseId);
        });
    }
    initClock();
    initResizableWindows();
    initDraggableWindows();
    initWindowFocus();
    initKeyboardShortcuts();
    initFocusMode();
    initIconTriggers();
    initNotepad();
    initTabs();
    initQueryHistory();
    initMusicPlayer();
    initSettings();
    initReduceEffects();
    initSqlAutocomplete();
    initBrowser();
    initDetectiveBadge();
    initGuide();
    initBriefingControls();
    initStageTracker();
    initArrestInterrogation();
    updateGatedIcons();
    initSchemaDrawer();
    setupQueryHistoryNav();
    initWindowTiling();
    initPrintDossier();
    initNotepadPinning();
    initNotepadExport();
    if (typeof initHintSystem === 'function') initHintSystem();
    if (typeof initEvidenceConfrontation === 'function') initEvidenceConfrontation();

    loadCaseContext(caseId);
    if (typeof updatePlayerProfileUI === 'function') updatePlayerProfileUI();
    if (typeof initDailyCaseAndLeaderboard === 'function') initDailyCaseAndLeaderboard();
}

function initGuide() {
    document.querySelectorAll('.btn-paste-query').forEach(btn => {
        btn.addEventListener('click', () => {
            const template = btn.getAttribute('data-sql') || '';
            const activeId = caseId || 1;
            const finalSql = template.replace(/\{CASE_ID\}/g, activeId);
            const sqlInput = document.getElementById('sqlQuery');
            if (sqlInput) {
                sqlInput.value = finalSql;
                if (typeof tabState !== 'undefined' && tabState[currentTabName]) {
                    tabState[currentTabName].query = finalSql;
                }
            }
            bringToFront('win-search');
            if (sqlInput) {
                sqlInput.focus();
                sqlInput.select();
            }
        });
    });

    // Auto-open guide for first-time detectives
    if (!localStorage.getItem('qc_guide_seen')) {
        setTimeout(() => {
            bringToFront('win-guide');
            localStorage.setItem('qc_guide_seen', 'true');
        }, 350);
    }
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


// =========================================
// PROGRESSIVE TOOL GATING & HELPER TOAST
// =========================================

window.inspectedCluesCount = 0;

function isWindowLocked(winId) {
    // Open access for all investigative tools
    return null;
}

function showDetectiveToast(msg) {
    let toast = document.getElementById('detectiveToast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'detectiveToast';
        toast.className = 'detective-toast';
        document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add('visible');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => {
        toast.classList.remove('visible');
    }, 4000);
}

function updateGatedIcons() {
    const isExp = localStorage.getItem('qc_experienced_mode') === 'true';
    document.querySelectorAll('.icon-btn[data-window]').forEach(btn => {
        const winId = btn.getAttribute('data-window');
        const lockReason = isExp ? null : isWindowLocked(winId);
        btn.classList.toggle('tool-locked', lockReason !== null);
        if (lockReason) {
            btn.setAttribute('title', lockReason);
        } else {
            const originalTitle = btn.id ? btn.id.replace('btn-icon-', '') : '';
            btn.setAttribute('title', originalTitle);
        }
    });
}

function getCaseInvestigativeHint(cId) {
    const num = Number(cId);
    if (num === 1) {
        return "Cross-reference access_logs for Floor 7 and the Executive Office between 20:30 and 21:40 with the suspect badge IDs.";
    } else if (num === 2) {
        return "Query access_logs for the Server Room around 22:30 and compare with purchase records for red clothing in transactions.";
    } else if (num === 11) {
        return "Review surveillance_logs around The Pit entrance and check which security guard was on duty during Maya's entry.";
    } else if (num === 12) {
        return "Examine Grandstand Stables access_logs at 14:00 and search suspect lockers for cutting tool receipts.";
    } else if (num === 13) {
        return "Inspect the Vault Room door latch physical clue and cross-reference back hallway access_logs with the weapon location.";
    }
    return "Check access_logs timestamps against suspect alibis and verify any large financial transactions.";
}

// Window Focus & Bring to Front
function bringToFront(win) {
    if (typeof win === 'string') win = document.getElementById(win);
    if (!win) return;
    const lockReason = isWindowLocked(win.id);
    if (lockReason) {
        showDetectiveToast(lockReason);
        playSfx('denied');
        return;
    }
    window.highestZ = (window.highestZ || 100) + 1;
    win.style.zIndex = window.highestZ;
    win.classList.remove('hidden');
    if (win.id === 'win-leaderboard') {
        if (typeof renderLeaderboard === 'function') renderLeaderboard();
        if (typeof renderAchievements === 'function') renderAchievements();
    }
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
                const deskW = desktop ? desktop.clientWidth : window.innerWidth;
                const deskH = desktop ? desktop.clientHeight : (window.innerHeight - 36);
                const winW = win.offsetWidth || 320;
                const winH = win.offsetHeight || 200;

                let nextLeft = initialLeft + mv.clientX - startX;
                let nextTop = initialTop + mv.clientY - startY;

                // Ensure window stays within viewable boundaries
                nextLeft = Math.max(0, Math.min(nextLeft, Math.max(0, deskW - 60)));
                nextTop = Math.max(0, Math.min(nextTop, Math.max(0, deskH - 30)));

                win.style.left = `${nextLeft}px`;
                win.style.top = `${nextTop}px`;
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
        window.activeNotepadPage = p;
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

    window.pinToNotepad = function(text) {
        const p = window.activeNotepadPage || 1;
        const current = notepad.value.trim();
        const stamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const entry = `[${stamp}] ${text}`;
        const updated = current ? `${current}\n\n📌 ${entry}` : `📌 ${entry}`;
        notepad.value = updated;
        localStorage.setItem(`qc_notepad_page_${p}`, updated);
        if (p === 1) localStorage.setItem('qc_notepad_notes', updated);
        playSfx('pin');
        openWindow('win-notepad');
        notepad.scrollTop = notepad.scrollHeight;
    };
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

    const volSlider = document.getElementById('musicVolume');
    let masterVolume = parseInt(localStorage.getItem('qc_audio_volume') || '40', 10);
    if (volSlider) {
        volSlider.value = masterVolume;
        volSlider.addEventListener('input', () => {
            masterVolume = parseInt(volSlider.value, 10);
            localStorage.setItem('qc_audio_volume', String(masterVolume));
        });
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
            const baseGain = (masterVolume / 100) * 0.08;
            gain.gain.setValueAtTime(baseGain, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.2);
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
    const chkCrt = document.getElementById('settingCrt');
    const chkShadows = document.getElementById('settingShadows');
    const chkAutosave = document.getElementById('settingAutosave');
    const chkSfx = document.getElementById('settingSfx');

    // Restore preferences
    const prefScanlines = localStorage.getItem('qc_pref_scanlines') === 'true';
    if (chkCrt) chkCrt.checked = prefScanlines;
    document.body.classList.toggle('no-scanlines', !prefScanlines);

    const prefShadows = localStorage.getItem('qc_pref_shadows') !== 'false';
    if (chkShadows) chkShadows.checked = prefShadows;
    document.querySelectorAll('.retro-window').forEach(w => w.classList.toggle('no-shadow', !prefShadows));

    const prefAutosave = localStorage.getItem('qc_setting_autosave') !== 'false';
    if (chkAutosave) chkAutosave.checked = prefAutosave;

    const prefSfx = localStorage.getItem('qc_audio_volume') !== '0';
    if (chkSfx) chkSfx.checked = prefSfx;

    if (chkCrt) {
        chkCrt.addEventListener('change', () => {
            document.body.classList.toggle('no-scanlines', !chkCrt.checked);
            localStorage.setItem('qc_pref_scanlines', chkCrt.checked);
            playSfx('pin');
        });
    }

    if (chkShadows) {
        chkShadows.addEventListener('change', () => {
            document.querySelectorAll('.retro-window').forEach(w => w.classList.toggle('no-shadow', !chkShadows.checked));
            localStorage.setItem('qc_pref_shadows', chkShadows.checked);
            playSfx('pin');
        });
    }

    if (chkAutosave) {
        chkAutosave.addEventListener('change', () => {
            localStorage.setItem('qc_setting_autosave', chkAutosave.checked);
            playSfx('pin');
        });
    }

    if (chkSfx) {
        chkSfx.addEventListener('change', () => {
            const vol = chkSfx.checked ? '50' : '0';
            localStorage.setItem('qc_audio_volume', vol);
            const slider = document.querySelector('#win-music input[type="range"]');
            if (slider) slider.value = vol;
            if (chkSfx.checked) playSfx('clue');
        });
    }
}

// ===== STEP 4: REDUCE EFFECTS TOGGLE =====
function initReduceEffects() {
    const chk = document.getElementById('chkReduceEffects');
    if (!chk) return;
    const saved = localStorage.getItem('qc_reduce_effects') === 'true';
    chk.checked = saved;
    if (saved) document.body.classList.add('reduce-effects');
    chk.addEventListener('change', () => {
        document.body.classList.toggle('reduce-effects', chk.checked);
        localStorage.setItem('qc_reduce_effects', String(chk.checked));
    });
}

// ===== STEP 4: SQL AUTOCOMPLETE =====
function initSqlAutocomplete() {
    const input = document.getElementById('sqlQuery');
    if (!input) return;

    const SQL_KEYWORDS = ['SELECT', 'FROM', 'WHERE', 'JOIN', 'ON', 'GROUP BY', 'ORDER BY',
        'HAVING', 'LIMIT', 'AND', 'OR', 'NOT', 'IN', 'LIKE', 'COUNT', 'SUM', 'AVG', 'MIN', 'MAX',
        'DISTINCT', 'AS', 'LEFT JOIN', 'INNER JOIN', 'case_id'];
    const tableNames = typeof DB_SCHEMA !== 'undefined' ? Object.keys(DB_SCHEMA) : [];
    const colNames = typeof DB_SCHEMA !== 'undefined'
        ? [...new Set(Object.values(DB_SCHEMA).flat())]
        : [];
    const ALL_SUGGESTIONS = [...new Set([...SQL_KEYWORDS, ...tableNames, ...colNames])];

    let dropdown = null;
    let activeSuggestions = [];
    let activeIndex = -1;

    function removeDropdown() {
        if (dropdown) { dropdown.remove(); dropdown = null; }
        activeSuggestions = []; activeIndex = -1;
    }

    function showDropdown(suggestions, caretPos) {
        removeDropdown();
        if (!suggestions.length) return;
        activeSuggestions = suggestions;
        activeIndex = 0;

        dropdown = document.createElement('div');
        dropdown.id = 'sqlAutocompleteDropdown';
        renderDropdown();

        const rect = input.getBoundingClientRect();
        dropdown.style.left = rect.left + 'px';
        dropdown.style.top = (rect.bottom + window.scrollY) + 'px';
        document.body.appendChild(dropdown);
    }

    function renderDropdown() {
        if (!dropdown) return;
        dropdown.innerHTML = '';
        activeSuggestions.slice(0, 8).forEach((s, i) => {
            const item = document.createElement('div');
            item.className = 'sql-ac-item' + (i === activeIndex ? ' active' : '');
            item.textContent = s;
            item.addEventListener('mousedown', (e) => {
                e.preventDefault();
                applySuggestion(s);
            });
            dropdown.appendChild(item);
        });
    }

    function getCurrentWord() {
        const val = input.value;
        const pos = input.selectionStart;
        const before = val.slice(0, pos);
        const match = before.match(/(\w+)$/);
        return match ? match[1] : '';
    }

    function applySuggestion(suggestion) {
        const val = input.value;
        const pos = input.selectionStart;
        const before = val.slice(0, pos);
        const after = val.slice(pos);
        const wordMatch = before.match(/(\w+)$/);
        const wordStart = wordMatch ? pos - wordMatch[1].length : pos;
        input.value = val.slice(0, wordStart) + suggestion + (after.startsWith(' ') ? '' : ' ') + after;
        const newPos = wordStart + suggestion.length + 1;
        input.setSelectionRange(newPos, newPos);
        removeDropdown();
        input.focus();
    }

    input.addEventListener('keyup', (e) => {
        if (['ArrowUp', 'ArrowDown', 'Enter', 'Escape', 'Tab'].includes(e.key)) return;
        const word = getCurrentWord();
        if (word.length < 2) { removeDropdown(); return; }
        const upper = word.toUpperCase();
        const matches = ALL_SUGGESTIONS.filter(s =>
            s.toUpperCase().startsWith(upper) && s.toUpperCase() !== upper
        );
        if (matches.length) showDropdown(matches); else removeDropdown();
    });

    input.addEventListener('keydown', (e) => {
        if (!dropdown) return;
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            activeIndex = Math.min(activeIndex + 1, Math.min(activeSuggestions.length, 8) - 1);
            renderDropdown();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            activeIndex = Math.max(activeIndex - 1, 0);
            renderDropdown();
        } else if (e.key === 'Enter' || e.key === 'Tab') {
            if (activeSuggestions[activeIndex]) {
                e.preventDefault();
                applySuggestion(activeSuggestions[activeIndex]);
            }
        } else if (e.key === 'Escape') {
            removeDropdown();
        }
    });

    document.addEventListener('click', (e) => {
        if (e.target !== input && e.target !== dropdown) removeDropdown();
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

    if (!Array.isArray(cachedCasesList) || cachedCasesList.length === 0) {
        try {
            const listRes = await apiFetch('/cases');
            if (listRes.ok) cachedCasesList = await listRes.json();
        } catch (e) {}
    }

    let displayNum = caseId;
    if (Array.isArray(cachedCasesList) && cachedCasesList.length > 0) {
        const idx = cachedCasesList.findIndex(c => Number(c.caseId) === Number(caseId));
        if (idx >= 0) displayNum = idx + 1;
    }
    window.activeCaseIndex = displayNum;

    const sqlInput = document.getElementById('sqlQuery');
    if (sqlInput) {
        sqlInput.placeholder = `Enter query... (e.g. SELECT * FROM suspects WHERE case_id = ${caseId};)`;
    }
    const sqlHint = document.getElementById('activeCaseSqlHint');
    if (sqlHint) {
        sqlHint.textContent = `Active Case SQL ID: ${caseId} (or case_id = ${displayNum})`;
    }

    let caseData = null;
    try {
        const res = await apiFetch(`/cases/${caseId}`);
        if (!res.ok) throw new Error(`Case ${caseId} not found`);
        caseData = await res.json();
        if (caseLabel) caseLabel.textContent = `Case #${displayNum} [ID: ${caseId}]: ${caseData.title}`;
    } catch (e) {
        console.warn('Could not load case metadata:', e.message);
    }

    sessionQueriesCount = 0;
    sessionStartTime = Date.now();
    sessionIncorrectAccusations = 0;
    updateInvestigationStage(1);
    if (typeof resetObjectivesTracker === 'function') resetObjectivesTracker();
    if (typeof resetHintSystemUI === 'function') resetHintSystemUI();
    window.caseWarrantAttemptsRemaining = 3;
    if (typeof updateWarrantQuotaDisplay === 'function') updateWarrantQuotaDisplay();
    window.latentEvidenceUnlocked = false;
    if (typeof initCaptainVanceInbox === 'function') initCaptainVanceInbox();

    if (caseData) {
        window.currentCaseData = caseData;
        const bTitle = document.getElementById('briefingTitle');
        const bDiff = document.getElementById('briefingDifficulty');
        const bType = document.getElementById('briefingType');
        const bDate = document.getElementById('briefingDate');
        const bNarrative = document.getElementById('briefingNarrative');
        const wForm = document.getElementById('warrantFormId');
        const wTitle = document.getElementById('warrantHeaderTitle');
        const crimeType = (caseData.crimeType || 'FELONY').toUpperCase();
        const hintEl = document.getElementById('activeCaseSqlHint');
        if (hintEl) {
            hintEl.textContent = `🔒 Scoped to Case #${displayNum} [ID: ${caseId}] — queries auto-isolate this case`;
        }

        if (bTitle) bTitle.textContent = `Case #${displayNum}: ${caseData.title}`;
        if (bDiff) {
            const diffText = (caseData.difficulty || 'Normal').toUpperCase();
            bDiff.textContent = `DIFFICULTY: ${diffText}`;
            bDiff.style.background = diffText === 'HARD' ? '#fee2e2' : diffText === 'MEDIUM' ? '#fef3c7' : '#dcfce7';
            bDiff.style.borderColor = diffText === 'HARD' ? '#f87171' : diffText === 'MEDIUM' ? '#f59e0b' : '#4ade80';
            bDiff.style.color = diffText === 'HARD' ? '#991b1b' : diffText === 'MEDIUM' ? '#92400e' : '#166534';
        }
        if (bType) bType.textContent = `TYPE: ${crimeType}`;
        if (bDate) bDate.textContent = `DATE: ${caseData.crimeDate || '2026-09-10'}`;
        if (bNarrative && caseData.description) bNarrative.textContent = caseData.description;
        if (typeof updateSqlConceptCard === 'function') updateSqlConceptCard(caseData);
        if (wForm) {
            wForm.textContent = `FORM MC-${caseId}-W841 - OFFICIAL APPREHENSION ORDER`;
            apiFetch(`/cases/${caseId}/warrant`)
                .then(r => r.ok ? r.json() : null)
                .then(w => {
                    if (w && w.formId && wForm) {
                        wForm.textContent = w.formId;
                    }
                })
                .catch(() => {});
        }
        if (wTitle) {
            wTitle.innerHTML = `
                Los Zorangeles Police Department<br>
                <span style="font-size: 13px; font-weight: normal;">Minor Crimes &amp; Financial Fraud Squad</span><br><br>
                ARREST WARRANT &bull; ${esc(crimeType)}<br>
                <span style="font-size: 11px; font-weight: 500; color: #334155;">In Re: ${esc(caseData.title)}</span>
            `;
        }
        const wCaseNo = document.getElementById('warrantCaseNo');
        const dTitle = document.getElementById('debriefCaseTitle');
        if (wCaseNo) wCaseNo.textContent = `Case No. #${displayNum} (DB ID: ${caseId})`;
        if (dTitle) dTitle.textContent = `Case #${displayNum}: ${caseData.title}`;

        // Check if intro has been seen
        const seen = localStorage.getItem('qc_intro_seen_' + caseId);
        const skipBtn = document.getElementById('btnBriefingSkip');
        const overlay = document.getElementById('briefingOverlay');
        if (skipBtn) {
            skipBtn.style.display = seen ? 'inline-block' : 'none';
        }
        if (overlay) {
            overlay.style.display = 'flex';
        }
    }

    await Promise.all([
        loadSuspects(caseId),
        loadEvidence(caseId),
        loadAccusationSuspects(caseId)
    ]);
    loadCaseList();

    initTabs();
}


// =========================================
// SUSPECTS WINDOW
// =========================================

async function loadSuspects(id) {
    const tbody = document.getElementById('suspectsTableBody');
    if (!tbody) return;

    setTableState(tbody, 7, 'Loading suspects...');

    try {
        const res = await apiFetch(`/cases/${id}/suspects`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const suspects = await res.json();

        if (!suspects.length) {
            setTableState(tbody, 7, 'No suspects found for this case.');
            return;
        }

        const getBadge = (sid) => {
            const st = localStorage.getItem(`qc_suspect_status_${id}_${sid}`) || 'inquiry';
            if (st === 'cleared') return '<span class="suspect-triage-badge triage-cleared" title="Click to change status">🟢 Cleared</span>';
            if (st === 'prime') return '<span class="suspect-triage-badge triage-prime" title="Click to change status">🔴 Prime</span>';
            return '<span class="suspect-triage-badge triage-inquiry" title="Click to change status">⚪ Inquiry</span>';
        };

        tbody.innerHTML = suspects.map(s => `
            <tr data-suspect-id="${s.suspectId}">
                <td style="font-weight:bold;text-align:center;">${s.suspectId}</td>
                <td style="font-weight:bold;color:#1e3a8a;">${esc(s.name || '-')}</td>
                <td style="text-align:center;">${s.age != null ? s.age : '-'}</td>
                <td>${esc(s.occupation || '-')}</td>
                <td style="font-size:10.5px;color:#334155;">${esc(s.relationshipToVictim || '-')}</td>
                <td style="font-size:10.5px;font-style:italic;">${esc(s.alibi || '-')}</td>
                <td style="text-align:center;">
                    <button type="button" class="retro-btn btn-triage" data-suspect-id="${s.suspectId}" style="font-size:10px;padding:1px 4px;width:100%;cursor:pointer;">
                        ${getBadge(s.suspectId)}
                    </button>
                </td>
            </tr>
        `).join('');

        tbody.onclick = (e) => {
            const btn = e.target.closest('.btn-triage');
            if (!btn) return;
            const sid = btn.dataset.suspectId;
            const current = localStorage.getItem(`qc_suspect_status_${id}_${sid}`) || 'inquiry';
            let next = 'cleared';
            if (current === 'cleared') next = 'prime';
            else if (current === 'prime') next = 'inquiry';

            localStorage.setItem(`qc_suspect_status_${id}_${sid}`, next);
            btn.innerHTML = getBadge(sid);
            playSfx('pin');

            if (next === 'prime') {
                const sel = document.getElementById('accusedSuspect');
                if (sel) sel.value = sid;
            }
        };
    } catch (e) {
        setTableState(tbody, 7, `Error: ${e.message}`);
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

        if (!evRes.ok || !sceneRes.ok) {
            grid.innerHTML = `
                <div style="padding:14px;color:#991b1b;background:#fee2e2;border:1px solid #f87171;margin:8px;font-size:11px;">
                    <strong>⚠️ Evidence Mainframe Error (HTTP ${evRes.status || sceneRes.status})</strong>
                    <div style="margin-top:4px;color:#555;">Unable to retrieve forensic evidence from police records server.</div>
                    <button class="retro-btn" onclick="loadEvidence(${id})" style="margin-top:8px;padding:2px 10px;font-weight:bold;">Retry Connection</button>
                </div>
            `;
            return;
        }

        const evidence = await evRes.json();
        const scenes = await sceneRes.json();

        if (!evidence.length && !scenes.length) {
            grid.innerHTML = '<div style="padding:12px;font-size:11px;color:#555;">No clues found for this case.</div>';
            return;
        }

        grid.innerHTML = '';

        // Add latent unlockable evidence card
        const latentCard = document.createElement('div');
        latentCard.className = `clue-card ${window.latentEvidenceUnlocked ? 'clue-card-unlocked' : 'clue-card-locked'}`;
        latentCard.innerHTML = `
            <div class="clue-tag"><span class="clue-badge" style="background:${window.latentEvidenceUnlocked ? '#dcfce7' : '#e2e8f0'};color:${window.latentEvidenceUnlocked ? '#166534' : '#475569'};">${window.latentEvidenceUnlocked ? 'UNLOCKED EXHIBIT' : '🔒 CLASSIFIED EXHIBIT'}</span></div>
            <div class="clue-name">Exhibit #E-CL: Latent Security Log</div>
            <div class="clue-desc">${window.latentEvidenceUnlocked ? 'LATENT ANALYSIS DECRYPTED: Access records prove terminal #4 at 21:20 required a physical bypass code known only to executive staff.' : 'CLASSIFIED FORENSIC EXHIBIT [LOCKED] — Encrypted crime scene terminal log. Decrypts after querying access_logs or interrogating a prime suspect.'}</div>
        `;
        latentCard.onclick = () => {
            if (window.latentEvidenceUnlocked) {
                showDetectiveToast('🔬 Latent Exhibit #E-CL: Bypassed physical executive terminal at 21:20.');
            } else {
                showDetectiveToast('🔒 Exhibit Locked: Query access_logs or interrogate a suspect to decrypt.');
            }
        };
        grid.appendChild(latentCard);

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

        window.currentCaseEvidence = evidence;
        renderArrestEvidenceChips(evidence);
    } catch (e) {
        grid.innerHTML = `<div style="padding:12px;font-size:11px;color:#c00;">Error loading clues: ${esc(e.message)}</div>`;
    }
}

// Forensic Evidence Viewer Inspector Logic
function openEvidenceViewer(item, isScene) {
    window.inspectedCluesCount = (window.inspectedCluesCount || 0) + 1;
    if (typeof completeObjective === 'function') completeObjective(1, 'Inspect Evidence');
    if (typeof updateGatedIcons === 'function') updateGatedIcons();
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
    if (descEl) descEl.textContent = cleanMojibake(item.description || 'No additional detective notes recorded on file.');

    window.currentInspectedExhibit = item;
    playSfx('clue');
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
        window.currentCaseSuspects = suspects;
        renderArrestSuspectPicker(suspects);
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

            const progress = (typeof getPlayerProgress === 'function') ? getPlayerProgress() : { solvedCases: [], caseRanks: {} };
            const isSolved = progress.solvedCases.includes(Number(c.caseId));
            const solvedRank = progress.caseRanks[c.caseId] || 'S';
            const dailyIdx = (typeof getDailyCaseIndex === 'function') ? getDailyCaseIndex(cases.length) : 0;
            const isDaily = index === dailyIdx;

            const solvedBadge = isSolved ? `<span style="margin-left:6px;font-size:9.5px;background:#dcfce7;border:1px solid #86efac;color:#166534;padding:1px 5px;border-radius:2px;font-weight:bold;">✓ SOLVED [Rank ${solvedRank}]</span>` : '';
            const dailyBadge = isDaily ? `<span style="margin-left:6px;font-size:9.5px;background:#fef3c7;border:1px solid #f59e0b;color:#92400e;padding:1px 5px;border-radius:2px;font-weight:bold;">📅 DAILY</span>` : '';

            const diff = (c.difficulty || 'EASY').toUpperCase();
            const diffStyle = diff === 'HARD'
                ? 'background:#fee2e2;color:#991b1b;border:1px solid #fca5a5;'
                : (diff === 'MEDIUM'
                    ? 'background:#fef3c7;color:#92400e;border:1px solid #fcd34d;'
                    : 'background:#dcfce7;color:#166534;border:1px solid #86efac;');
            const diffBadge = `<span style="font-size:9px;font-weight:bold;padding:1px 5px;border-radius:2px;margin-right:6px;${diffStyle}">${diff}</span>`;

            div.innerHTML = `
                <div>
                    <strong>Case #${displayNum}: ${esc(c.title)}</strong>${solvedBadge}${dailyBadge}
                    <div style="font-size:10px;color:#555;margin-top:3px;display:flex;align-items:center;">${diffBadge}<span>${esc(c.crimeType || '')}</span></div>
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


// Intelligent SQL Diagnostic Assistant
function getSqlDiagnosticHint(query, errorMsg) {
    const q = (query || '').toLowerCase().trim();
    const err = (errorMsg || '').toLowerCase();

    // Syntax & delimiter errors
    if ((q.match(/'/g) || []).length % 2 !== 0) {
        return "Unclosed single quote (') detected in query string.";
    }
    if ((q.match(/\(/g) || []).length !== (q.match(/\)/g) || []).length) {
        return "Mismatched parentheses: count of '(' does not match ')'.";
    }

    // Table typos
    if (/\bfrom\s+suspect\b/.test(q)) return "Table name is plural: use 'FROM suspects'.";
    if (/\bfrom\s+(access_log|log|logs)\b/.test(q)) return "Table name is 'FROM access_logs'.";
    if (/\bfrom\s+(transaction|trans)\b/.test(q)) return "Table name is 'FROM transactions'.";
    if (/\bfrom\s+(phone|calls|call_records)\b/.test(q)) return "Table name is 'FROM phone_records'.";
    if (/\bfrom\s+(clue|clues|evidences)\b/.test(q)) return "Table name is 'FROM evidence'.";
    if (/\bfrom\s+(timeline|events)\b/.test(q)) return "Table name is 'FROM timeline_events'.";
    if (/\bfrom\s+(scene|scenes)\b/.test(q)) return "Table name is 'FROM crime_scenes'.";
    if (/\bfrom\s+victim\b/.test(q)) return "Table name is plural: use 'FROM victims'.";

    // Column typos in specific tables
    if (q.includes('phone_records') && q.includes('suspect_id') && !q.includes('caller_') && !q.includes('receiver_')) {
        return "Note: 'phone_records' uses 'caller_suspect_id' and 'receiver_suspect_id' rather than 'suspect_id'.";
    }

    // Missing JOIN condition
    if (q.includes('join') && !q.includes('on')) {
        return "Missing JOIN condition: JOIN clause requires an ON condition (e.g. 'JOIN suspects s ON a.suspect_id = s.suspect_id').";
    }

    // Filter hints
    const currentId = caseId || 1;
    if (!q.includes('case_id')) {
        return `Remember to filter by active case: add 'WHERE case_id = ${currentId}' to isolate relevant incident records.`;
    }

    // Misplaced columns
    if ((q.includes('alibi') || q.includes('motive')) && !q.includes('suspects')) {
        return "'alibi' and 'motive' exist in the 'suspects' table. JOIN suspects to view suspect background.";
    }
    if (q.includes('amount') && !q.includes('transactions')) {
        return "'amount' column exists in 'transactions'. JOIN transactions to examine monetary movements.";
    }

    if (err.includes('policy') || err.includes('syntax') || err.includes('validation')) {
        return "Minor Crimes OS strictly permits SELECT queries. Check for trailing commas or unescaped characters.";
    }

    return null;
}


// Auto-scope queries to active case if case_id predicate is missing
function autoScopeQuery(query, activeCaseId) {
    if (!query || !activeCaseId) return query;
    if (/\bcase_id\b/i.test(query)) return query;

    const clauseRegex = /\b(GROUP\s+BY|ORDER\s+BY|HAVING|LIMIT)\b/i;
    const match = query.match(clauseRegex);

    let mainPart = query;
    let trailingPart = '';
    if (match) {
        mainPart = query.substring(0, match.index).trim();
        trailingPart = ' ' + query.substring(match.index).trim();
    }

    if (/\bWHERE\b/i.test(mainPart)) {
        return `${mainPart} AND case_id = ${activeCaseId}${trailingPart}`;
    } else {
        return `${mainPart} WHERE case_id = ${activeCaseId}${trailingPart}`;
    }
}

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
        // Guard against multi-statement injection attempts
        if (/;\s*\S/.test(query)) {
            statusEl.textContent = 'Error: Only single SELECT statements are permitted. Remove the semicolon and anything after it.';
            statusEl.style.color = '#c00';
            headEl.innerHTML = '<tr><th>Security Check</th></tr>';
            bodyEl.innerHTML = '<tr><td style="color:#991b1b;background:#fee2e2;padding:12px;font-size:12px;">⚠️ Multi-statement queries are blocked. Use one SELECT at a time.</td></tr>';
            return;
        }

        // =========================================
        // SECRET TERMINAL & MAINFRAME COMMANDS
        // =========================================
        const cleanCmd = query.trim().toUpperCase();
        if (['HELP', ':HELP', 'COMMANDS', 'MAN'].includes(cleanCmd)) {
            headEl.innerHTML = '<tr><th>Command</th><th>Clearance</th><th>Description</th></tr>';
            bodyEl.innerHTML = `
                <tr><td><code>HINT</code></td><td>L1 Detective</td><td>Reveal an investigative lead for the active case</td></tr>
                <tr><td><code>STATUS</code></td><td>L1 Detective</td><td>Display case progress, query count, and warrant metrics</td></tr>
                <tr><td><code>CLEARANCE LEVEL 5</code></td><td>Admin / Chief</td><td>Override all investigation locks & unlock full toolkit</td></tr>
                <tr><td><code>CLEAR</code></td><td>Standard</td><td>Clear the terminal workspace</td></tr>
            `;
            statusEl.textContent = 'Mainframe Help System Active';
            statusEl.style.color = '#000080';
            playSfx('clue');
            return;
        }

        if (['HINT', ':HINT', 'CLUE'].includes(cleanCmd)) {
            const hintText = getCaseInvestigativeHint(caseId);
            headEl.innerHTML = '<tr><th>Lead / Forensic Advisory</th></tr>';
            bodyEl.innerHTML = `<tr><td style="background:#fef3c7;border:1px solid #f59e0b;padding:12px;color:#92400e;">💡 <strong>Forensic Lead (Case #${caseId}):</strong> ${hintText}</td></tr>`;
            statusEl.textContent = 'Forensic lead decrypted.';
            statusEl.style.color = '#92400e';
            playSfx('clue');
            return;
        }

        if (['CLEARANCE LEVEL 5', 'OVERRIDE', 'UNLOCK ALL', 'SUDO', 'ADMIN'].includes(cleanCmd)) {
            localStorage.setItem('qc_experienced_mode', 'true');
            const chk = document.getElementById('chkExperiencedMode');
            if (chk) chk.checked = true;
            updateInvestigationStage(3);
            if (typeof updateGatedIcons === 'function') updateGatedIcons();
            headEl.innerHTML = '<tr><th>Authorization Level</th><th>Security Clearance Status</th></tr>';
            bodyEl.innerHTML = '<tr><td><code>LEVEL 5 CHIEF</code></td><td style="color:#166534;background:#dcfce7;font-weight:bold;">ACCESS GRANTED: All police mainframe databases, warrants, and tools unlocked.</td></tr>';
            statusEl.textContent = 'Clearance override accepted.';
            statusEl.style.color = '#166534';
            playSfx('stamp');
            return;
        }

        if (['STATUS', 'INFO', 'PROGRESS'].includes(cleanCmd)) {
            const timeElapsed = Math.floor((Date.now() - sessionStartTime) / 1000);
            headEl.innerHTML = '<tr><th>Metric</th><th>Value</th></tr>';
            bodyEl.innerHTML = `
                <tr><td>Active Case</td><td>#${caseId} - ${esc(window.currentCaseData?.title || 'Active Investigation')}</td></tr>
                <tr><td>Queries Executed</td><td>${sessionQueriesCount}</td></tr>
                <tr><td>Denied Warrants</td><td>${sessionIncorrectAccusations}</td></tr>
                <tr><td>Clues Inspected</td><td>${window.inspectedCluesCount || 0}</td></tr>
                <tr><td>Investigation Stage</td><td>${currentInvestigationStage}/3</td></tr>
                <tr><td>Session Duration</td><td>${timeElapsed}s</td></tr>
            `;
            statusEl.textContent = 'Status report generated.';
            statusEl.style.color = '#000';
            playSfx('query');
            return;
        }

        if (cleanCmd === 'CLEAR' || cleanCmd === 'CLS') {
            headEl.innerHTML = '<tr><th>Status</th><th>Message</th></tr>';
            bodyEl.innerHTML = '<tr><td>READY</td><td>Workspace cleared.</td></tr>';
            statusEl.textContent = 'Terminal cleared.';
            queryInput.value = '';
            return;
        }

        // Auto-scope query to active case if missing, or translate sequential number
        let queryToSend = autoScopeQuery(query, caseId);
        if (window.activeCaseIndex && Number(window.activeCaseIndex) !== Number(caseId)) {
            queryToSend = queryToSend.replace(new RegExp(`\\bcase_id\\s*=\\s*0*${window.activeCaseIndex}\\b`, 'gi'), `case_id = ${caseId}`);
        }

        statusEl.textContent = 'Executing...';
        statusEl.style.color = '#000';
        btnExecute.disabled = true;
        playSfx('query');

        try {
            const res = await apiFetch(`/query/execute`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ caseId, query: queryToSend })
            });
            const data = await res.json();

            if (!res.ok) {
                const hint = getSqlDiagnosticHint(queryToSend, data.message);
                statusEl.textContent = `Error: ${data.message || 'Execution failed'}`;
                statusEl.style.color = '#c00';
                headEl.innerHTML = '<tr><th>Execution Diagnostic</th></tr>';
                bodyEl.innerHTML = `
                    <tr>
                        <td style="color:#991b1b;background:#fee2e2;padding:12px;font-size:12px;border:1px solid #f87171;">
                            <strong>⚠️ Query Failed:</strong> ${esc(data.message || 'Execution error')}
                            ${hint ? `<div style="margin-top:8px;padding:6px 10px;background:#fef3c7;border:1px solid #f59e0b;color:#92400e;font-size:11px;border-radius:3px;font-weight:normal;">💡 <strong>Detective Hint:</strong> ${hint}</div>` : ''}
                        </td>
                    </tr>
                `;
                return;
            }

            sessionQueriesCount++;
            if (typeof completeObjective === 'function') completeObjective(2, 'Query Police Database');
            if (typeof checkUnlockLatentEvidence === 'function') checkUnlockLatentEvidence('query');
            if (typeof dispatchVanceMessage === 'function') dispatchVanceMessage(2);
            if (typeof updateGatedIcons === 'function') updateGatedIcons();
            if (currentInvestigationStage < 2) {
                updateInvestigationStage(2);
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
                    td.textContent = cleanMojibake(cell);
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
        if (window.caseWarrantAttemptsRemaining <= 0) {
            statusEl.textContent = 'Warrant quota exceeded. Reset case file first.';
            statusEl.style.color = '#c00';
            return;
        }
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
            if (data.correct) {
                playSfx('stamp');
            } else {
                playSfx('denied');
                sessionIncorrectAccusations++;
                window.caseWarrantAttemptsRemaining = Math.max(0, (window.caseWarrantAttemptsRemaining || 3) - 1);
                if (typeof updateWarrantQuotaDisplay === 'function') updateWarrantQuotaDisplay();
                if (typeof dispatchVanceMessage === 'function') dispatchVanceMessage(4);
            }
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

            if (data.correct) {
                // Confession typewriter reveal
                const confessionBox = document.getElementById('confessionRevealModal');
                const confessionText = document.getElementById('confessionText');
                if (confessionBox && confessionText) {
                    confessionBox.style.display = 'block';
                    let confessionSpeech;
                    if (Number(caseId) === 1) {
                        confessionSpeech = `"Alright... alright! Put the cuffs on! I never meant for Sarah to get hurt. She discovered the altered ledger balances and was preparing to report me to the oversight committee on Monday. When I unlocked the office at 21:20 to retrieve the physical ledger, she was still at her desk. She confronted me... a struggle ensued... I struck her, grabbed the ledger, and fled through the stairwell. I'm sorry..."`;
                    } else if (Number(caseId) === 2) {
                        confessionSpeech = `"Fine... you have it all, don't you? The badge swipe at 22:30, the red hoodie receipt, the fingerprint on the rack. Jordan stole my promotion — THREE years of work, and they handed it to him like a gift. I went in to wipe the proof of what he had been doing. I didn't plan for it to go that far... I just panicked. You win, Detective."`;
                    } else if (Number(caseId) === 11) {
                        confessionSpeech = `"Alright! Yes, it was me. Samira Khan. I was supposed to guard him but Victor's money was too good. I let the crew in through the back, kept the CCTV angle blind. Nobody was supposed to get hurt — it was just a snatch job. The access logs don't lie. I was right there. You've got me cold."`;
                    } else if (Number(caseId) === 12) {
                        confessionSpeech = `"You found the receipt. I knew you would eventually. Silverwind was going to be put down anyway — too aggressive, too dangerous. But Whitfield's Pride? She had a real shot. I cut the brake line on the training rig. A scratch, nothing more — but enough to pull Silverwind from the race. The cutting tool receipt sealed it. I had no choice."`;
                    } else if (Number(caseId) === 13) {
                        confessionSpeech = `"The scarf on the latch... I should have grabbed it. Three years of watching him parade through that casino like he owned me — he DID own me. The .38 was from the lost and found locker. Nobody checks the back hallway at 22:12. Almost nobody. You're better than I gave you credit for, Detective. I'll cooperate."`;
                    } else if (data.solution && data.solution.explanation) {
                        confessionSpeech = `"Fine, you caught me. I have nothing left to hide. ${data.solution.explanation} Let the records show I am cooperating with authorities."`;
                    } else {
                        confessionSpeech = `"You got me, Detective. The forensic evidence is indisputable. I submit to apprehension."`;
                    }
                    typewriterText(confessionText, confessionSpeech);
                }

                // Advance to Stage 3 Apprehended
                updateInvestigationStage(3);

                // Successfully apprehended suspect -> complete objective 4
                if (typeof completeObjective === 'function') completeObjective(4, 'Execute Warrant');

                // Save persistent progress and show debrief
                saveCaseCompleted(caseId, data, sessionQueriesCount, sessionIncorrectAccusations);

                const taskDebrief = document.getElementById('taskItemDebrief');
                if (taskDebrief) taskDebrief.style.display = 'flex';
            }
        } catch (e) {
            statusEl.textContent = `Network Error: ${e.message}`;
            statusEl.style.color = '#c00';
        } finally {
            btnSubmitAccusation.disabled = false;
        }
    });
}

// Typewriter effect for confession speech
function typewriterText(el, text, speed = 18) {
    el.textContent = '';
    let i = 0;
    const timer = setInterval(() => {
        el.textContent += text.charAt(i);
        i++;
        if (i >= text.length) clearInterval(timer);
    }, speed);
}

// =========================================
// PHASE 1: CASE BRIEFING CONTROLS
// =========================================

function initBriefingControls() {
    const btnStart = document.getElementById('btnBriefingStart');
    const btnSkip = document.getElementById('btnBriefingSkip');
    const btnReplay = document.getElementById('btnReplayBriefing');
    const overlay = document.getElementById('briefingOverlay');

    if (btnStart) {
        btnStart.addEventListener('click', () => {
            localStorage.setItem('qc_intro_seen_' + caseId, 'true');
            if (overlay) overlay.style.display = 'none';
            // Open clues locker if no window is active
            const anyOpen = Array.from(document.querySelectorAll('.retro-window')).some(w => !w.classList.contains('hidden'));
            if (!anyOpen) bringToFront('win-clues');
        });
    }

    if (btnSkip) {
        btnSkip.addEventListener('click', () => {
            localStorage.setItem('qc_intro_seen_' + caseId, 'true');
            if (overlay) overlay.style.display = 'none';
        });
    }

    if (btnReplay) {
        btnReplay.addEventListener('click', () => {
            if (overlay) {
                const skipBtn = document.getElementById('btnBriefingSkip');
                if (skipBtn) skipBtn.style.display = 'inline-block';
                overlay.style.display = 'flex';
            }
        });
    }
}

// =========================================
// PHASE 2: KEYBOARD SHORTCUTS & FOCUS MODE
// =========================================

function initFocusMode() {
    const btnFocus = document.getElementById('btnFocusMode');
    if (btnFocus) {
        btnFocus.addEventListener('click', () => {
            const isFocus = document.body.classList.toggle('focus-mode');
            btnFocus.textContent = isFocus ? '🎯 Focus [ON]' : '🎯 Focus';
            btnFocus.style.background = isFocus ? '#1e3a8a' : '';
            btnFocus.style.color = isFocus ? '#ffffff' : '';
        });
    }
}

function initKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        const tag = (e.target.tagName || '').toLowerCase();
        const isEditing = (tag === 'input' && e.target.type !== 'checkbox') || tag === 'textarea';

        if (e.key === 'Escape') {
            const overlay = document.getElementById('briefingOverlay');
            if (overlay && overlay.style.display === 'flex' && localStorage.getItem('qc_intro_seen_' + caseId)) {
                overlay.style.display = 'none';
                return;
            }
            const debrief = document.getElementById('win-debrief');
            if (debrief && !debrief.classList.contains('hidden')) {
                debrief.classList.add('hidden');
                updateTaskbar();
                return;
            }
            let topWin = null;
            let maxZ = -1;
            document.querySelectorAll('.retro-window:not(.hidden)').forEach(w => {
                const z = parseInt(w.style.zIndex || '0', 10);
                if (z > maxZ) { maxZ = z; topWin = w; }
            });
            if (topWin) {
                topWin.classList.add('hidden');
                updateTaskbar();
            }
            return;
        }

        if (isEditing) return;

        if ((e.altKey && (e.key === 'f' || e.key === 'F')) || (e.key === 'f' && !e.ctrlKey && !e.metaKey)) {
            e.preventDefault();
            const btnFocus = document.getElementById('btnFocusMode');
            if (btnFocus) btnFocus.click();
            return;
        }

        if (e.key === 'Tab' && !e.shiftKey) {
            const openWindows = Array.from(document.querySelectorAll('.retro-window:not(.hidden)'));
            if (openWindows.length > 1) {
                e.preventDefault();
                openWindows.sort((a, b) => parseInt(a.style.zIndex || '0', 10) - parseInt(b.style.zIndex || '0', 10));
                bringToFront(openWindows[0]);
            }
            return;
        }

        if (e.altKey) {
            const num = parseInt(e.key, 10);
            const mapping = {
                1: 'win-guide',
                2: 'win-manual',
                3: 'win-search',
                4: 'win-clues',
                5: 'win-suspects',
                6: 'win-arrest'
            };
            if (mapping[num]) {
                e.preventDefault();
                bringToFront(mapping[num]);
            }
        }
    });
}

// =========================================
// PHASE 3: INTERROGATION & EVIDENCE CHIPS
// =========================================

function initArrestInterrogation() {
    const btnDebrief = document.getElementById('btnOpenDebrief');
    if (btnDebrief) {
        btnDebrief.addEventListener('click', () => {
            showCaseDebrief(window.lastSolvedData || {}, sessionQueriesCount);
        });
    }

    const btnNextDebrief = document.getElementById('btnNextCaseDebrief');
    if (btnNextDebrief) {
        btnNextDebrief.addEventListener('click', () => {
            document.getElementById('win-debrief').classList.add('hidden');
            if (typeof updateTaskbar === 'function') updateTaskbar();

            if (Array.isArray(cachedCasesList) && cachedCasesList.length > 0) {
                const currentIdx = cachedCasesList.findIndex(c => Number(c.caseId) === Number(caseId));
                if (currentIdx >= 0 && currentIdx < cachedCasesList.length - 1) {
                    const nextCase = cachedCasesList[currentIdx + 1];
                    loadCaseContext(nextCase.caseId);
                    const modal = document.getElementById('modal-briefing');
                    if (modal) modal.classList.remove('hidden');
                    playSfx('clue');
                    return;
                }
            }
            openWindow('win-manual');
        });
    }

    document.querySelectorAll('.btn-interrogate').forEach(btn => {
        btn.addEventListener('click', () => {
            const topic = btn.getAttribute('data-topic');
            const select = document.getElementById('accusedSuspect');
            const suspectId = select ? parseInt(select.value, 10) : 0;
            const dialogueEl = document.getElementById('interrogationDialogue');
            if (!dialogueEl) return;

            const suspect = (window.currentCaseSuspects || []).find(s => Number(s.suspectId) === Number(suspectId));
            const sName = suspect ? suspect.name : 'Suspect';

            if (!suspectId) {
                dialogueEl.textContent = 'Please select a suspect above to begin questioning.';
                return;
            }

            let response = '';
            if (Number(caseId) === 1) {
                if (sName.includes('Daniel')) {
                    if (topic === 'alibi') response = `"${sName}: I was working late on the quarterly audit on the 7th floor. Anyone who stole the ledger could have grabbed my badge off my desk!"`;
                    else if (topic === 'motive') response = `"${sName}: Look, Sarah and I clashed over ledger accounting discrepancies, but I would never harm her! She was going to file a complaint on Monday..."`;
                    else response = `"${sName}: That $15,000 transaction into my account was an independent advisory consulting fee! It has nothing to do with the stolen ledger!"`;
                } else if (sName.includes('Rebecca')) {
                    if (topic === 'alibi') response = `"${sName}: I left the building at 8:30 PM sharp. The door logs and parking ticket will verify that."`;
                    else if (topic === 'motive') response = `"${sName}: Sarah and I had contract disputes, but they were in legal mediation. Resorting to physical violence makes zero sense for a lawyer."`;
                    else response = `"${sName}: All payments to my firm are fully invoiced and audited."`;
                } else if (sName.includes('Michael')) {
                    if (topic === 'alibi') response = `"${sName}: I was in the security surveillance room from 20:45 until the night sweep at 22:00. The camera feeds were my responsibility."`;
                    else if (topic === 'motive') response = `"${sName}: Sarah blamed me for past security lapses, but I wouldn't jeopardize my career over a disagreement."`;
                    else response = `"${sName}: I have no unlogged income or suspicious transfers. My record is spotless."`;
                } else {
                    if (topic === 'alibi') response = `"${sName}: I was dining at the bistro down the street until well after 9:30 PM. The waitstaff saw me."`;
                    else if (topic === 'motive') response = `"${sName}: Sarah and I had business friction, but killing the partnership ruins my investment."`;
                    else response = `"${sName}: The funds I received were regular business expense reimbursements."`;
                }
            } else {
                if (topic === 'alibi') {
                    response = `"${sName} (${suspect.occupation || 'Suspect'}): As stated in official records: '${suspect.alibi || 'I was elsewhere during the incident.'}' Cross-reference the access logs and camera timeline to verify it."`;
                } else if (topic === 'motive') {
                    response = `"${sName}: Rumours claim my motive was '${suspect.motive || 'friction with the victim'}', but having friction does not make someone guilty. You need forensic proof!"`;
                } else {
                    response = `"${sName}: My relationship to the victim was '${suspect.relationshipToVictim || 'professional'}'. Ask around — we had normal everyday interactions."`;
                }
            }

            typewriterText(dialogueEl, response, 12);
        });
    });
}

function renderArrestSuspectPicker(suspects) {
    const grid = document.getElementById('arrestSuspectPickerGrid');
    const select = document.getElementById('accusedSuspect');
    if (!grid) return;

    if (!suspects || !suspects.length) {
        grid.innerHTML = '<div style="font-size:11px;color:#666;">No suspects found.</div>';
        return;
    }

    grid.innerHTML = '';
    const avatars = ['🧑‍💼', '👩‍⚖️', '👮‍♂️', '👩‍💼', '🕵️‍♂️'];

    suspects.forEach((s, idx) => {
        const card = document.createElement('div');
        card.className = 'suspect-card-selectable';
        card.setAttribute('data-suspect-id', s.suspectId);
        card.innerHTML = `
            <div class="suspect-avatar">${avatars[idx % avatars.length]}</div>
            <div class="suspect-name">${esc(s.name)}</div>
            <div class="suspect-role">${esc(s.occupation || 'Suspect')}</div>
        `;

        card.addEventListener('click', () => {
            grid.querySelectorAll('.suspect-card-selectable').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');

            if (select) {
                select.value = s.suspectId;
            }

            const sec = document.getElementById('interrogationSection');
            const targetLabel = document.getElementById('interrogateTargetLabel');
            const dialogue = document.getElementById('interrogationDialogue');
            if (sec) sec.style.display = 'block';
            if (targetLabel) targetLabel.textContent = `INTERROGATING: ${s.name.toUpperCase()} (${s.occupation || 'SUSPECT'})`;
            if (dialogue) dialogue.textContent = `"You have no right holding me here, Detective. Ask your questions so I can leave."`;
            if (typeof completeObjective === 'function') completeObjective(3, 'Verify Alibis');
            if (typeof checkUnlockLatentEvidence === 'function') checkUnlockLatentEvidence('interrogation');;

            if (currentInvestigationStage < 3) {
                updateInvestigationStage(3);
            }

            const crossActions = document.getElementById('interrogationCrossActions');
            if (crossActions) {
                crossActions.innerHTML = `
                    <button type="button" class="retro-btn btn-cross-alibi" style="font-size:10px;padding:2px 8px;" title="Query access_logs for this suspect">🔍 Badge Logs</button>
                    <button type="button" class="retro-btn btn-cross-money" style="font-size:10px;padding:2px 8px;" title="Query transactions for this suspect">💳 Financials</button>
                    <button type="button" class="retro-btn btn-pin-interrogate" style="font-size:10px;padding:2px 8px;" title="Pin dialogue to Notepad">📌 Pin Statement</button>
                `;

                crossActions.querySelector('.btn-cross-alibi').onclick = () => {
                    const sql = `SELECT * FROM access_logs WHERE suspect_id = ${s.suspectId} AND case_id = ${caseId};`;
                    const input = document.getElementById('sqlQuery');
                    if (input) input.value = sql;
                    bringToFront('win-search');
                    playSfx('query');
                };

                crossActions.querySelector('.btn-cross-money').onclick = () => {
                    const sql = `SELECT * FROM transactions WHERE suspect_id = ${s.suspectId} AND case_id = ${caseId};`;
                    const input = document.getElementById('sqlQuery');
                    if (input) input.value = sql;
                    bringToFront('win-search');
                    playSfx('query');
                };

                crossActions.querySelector('.btn-pin-interrogate').onclick = () => {
                    const text = dialogue ? dialogue.textContent : '';
                    if (text) window.pinToNotepad(`[Interrogation: ${s.name}]: ${text}`);
                };
            }
        });

        grid.appendChild(card);
    });
}

function renderArrestEvidenceChips(evidence) {
    const container = document.getElementById('arrestEvidenceChips');
    const expText = document.getElementById('explanation');
    if (!container) return;

    if (!evidence || !evidence.length) {
        container.innerHTML = '<span style="font-size:11px;color:#666;">No evidence discovered yet.</span>';
        return;
    }

    container.innerHTML = '';
    evidence.forEach(e => {
        const chip = document.createElement('div');
        chip.className = 'evidence-chip';
        chip.innerHTML = `<span>📎</span><span>${esc(e.evidenceType || 'Exhibit')}: ${esc(e.description || '').substring(0, 32)}...</span>`;

        chip.addEventListener('click', () => {
            chip.classList.toggle('selected');
            if (expText) {
                const label = `[Evidence: ${e.evidenceType} - ${e.description}]`;
                if (chip.classList.contains('selected')) {
                    if (!expText.value.includes(label)) {
                        expText.value = (expText.value ? expText.value + '\n' : '') + label;
                    }
                } else {
                    expText.value = expText.value.replace(label, '').trim();
                }
            }
        });

        container.appendChild(chip);
    });
}

// =========================================
// PHASE 4: POST-CASE DEBRIEF & PERSISTENCE
// =========================================

function saveCaseCompleted(cId, data, queryCount, incorrectCount) {
    window.lastSolvedData = data;
    try {
        let rank = 'S';
        if ((incorrectCount || 0) > 0 || queryCount > 6) rank = 'A';
        if ((incorrectCount || 0) > 1 || queryCount > 12) rank = 'B';

        const record = {
            caseId: cId,
            rank: rank,
            queriesCount: queryCount,
            incorrectAccusations: incorrectCount || 0,
            completedAt: new Date().toISOString()
        };
        localStorage.setItem('qc_case_completed_' + cId, JSON.stringify(record));

        loadCaseList();
    } catch(e) {}
}

function showCaseDebrief(data, queryCount) {
    const win = document.getElementById('win-debrief');
    if (!win) return;

    const queriesEl = document.getElementById('statQueriesCount');
    const rankEl = document.getElementById('statEfficiencyRank');
    const badgeStamp = document.getElementById('debriefBadgeStamp');
    const timelineList = document.getElementById('debriefTimelineList');
    const chainEl = document.getElementById('debriefEvidenceChain');
    const timeEl = document.getElementById('statTimeElapsed');
    const attemptsEl = document.getElementById('statIncorrectAttempts');
    const xpEl = document.getElementById('statXpEarned');
    const titleEl = document.getElementById('debriefCaseTitle');

    if (titleEl && window.currentCaseData) {
        titleEl.textContent = `Case #${window.activeCaseIndex || caseId}: ${window.currentCaseData.title}`;
    }

    if (queriesEl) queriesEl.textContent = String(queryCount || sessionQueriesCount || 1);

    const totalSecs = Math.max(1, Math.floor((Date.now() - sessionStartTime) / 1000));
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    const timeStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
    if (timeEl) timeEl.textContent = timeStr;
    if (attemptsEl) attemptsEl.textContent = String(sessionIncorrectAccusations || 0);

    const totalQueries = queryCount || sessionQueriesCount || 1;
    const totalDenied = sessionIncorrectAccusations || 0;
    const hintsCount = window.caseHintsUsed || 0;
    const hintsPen = window.caseHintsPenalty || 0;

    // Multi-factor Score: Base 1000 - queries beyond 4 - time beyond 3m - wrong warrants - hints
    let calculatedScore = 1000;
    calculatedScore -= Math.max(0, (totalQueries - 4) * 25);
    calculatedScore -= Math.max(0, Math.floor(totalSecs / 60) * 10);
    calculatedScore -= (totalDenied * 150);
    calculatedScore -= (hintsPen * 80);
    calculatedScore = Math.max(100, calculatedScore);

    const scoreEl = document.getElementById('statTotalScore');
    if (scoreEl) scoreEl.textContent = String(calculatedScore);

    let rank = 'S';
    let title = '⭐ MASTER DETECTIVE';
    let awardedXp = 350;

    if (calculatedScore < 450 || hintsPen >= 5 || totalDenied >= 3) {
        rank = 'C';
        title = '📋 PROBATIONARY';
        awardedXp = 75;
    } else if (calculatedScore < 650 || totalDenied >= 2 || totalQueries > 14) {
        rank = 'B';
        title = '🔍 INVESTIGATOR';
        awardedXp = 150;
    } else if (calculatedScore < 850 || totalDenied >= 1 || hintsCount >= 1 || totalQueries > 6) {
        rank = 'A';
        title = '🎖️ SENIOR DETECTIVE';
        awardedXp = 250;
    }

    if (typeof savePlayerCaseSolve === 'function') {
        savePlayerCaseSolve(caseId, rank, calculatedScore, awardedXp);
    }

    if (typeof evaluateAchievements === 'function') {
        evaluateAchievements(caseId, rank, calculatedScore, totalQueries, totalSecs, totalDenied, hintsCount);
    }

    const hintsEl = document.getElementById('statHintsUsed');
    if (hintsEl) hintsEl.textContent = String(window.caseHintsUsed || 0);

    if (typeof renderDebriefRedHerrings === 'function') renderDebriefRedHerrings(caseId);

    if (rankEl) rankEl.textContent = rank;
    if (badgeStamp) badgeStamp.textContent = title;

    const curXp = parseInt(localStorage.getItem('qc_player_xp') || '0', 10);
    if (xpEl) xpEl.textContent = `+${awardedXp} (${curXp} Total)`;

    if (timelineList) {
        timelineList.innerHTML = `
            <div class="timeline-step">
                <div class="timeline-time">20:00</div>
                <div class="timeline-desc">Sarah Morgan enters the Executive Office to reconcile the ledger.</div>
            </div>
            <div class="timeline-step">
                <div class="timeline-time">20:30</div>
                <div class="timeline-desc">Rebecca Moore departs the main building (verified by lobby logs).</div>
            </div>
            <div class="timeline-step">
                <div class="timeline-time">20:45</div>
                <div class="timeline-desc">Michael Bennett begins camera monitoring in security suite.</div>
            </div>
            <div class="timeline-step critical">
                <div class="timeline-time">21:20</div>
                <div class="timeline-desc"><strong>Daniel Carter uses his security access card</strong> to enter the executive office floor.</div>
            </div>
            <div class="timeline-step critical">
                <div class="timeline-time">21:30</div>
                <div class="timeline-desc"><strong>Attack on Sarah Morgan &amp; Theft of Ledger:</strong> Physical struggle occurs; drawer is broken open.</div>
            </div>
            <div class="timeline-step">
                <div class="timeline-time">21:40</div>
                <div class="timeline-desc">Daniel Carter exits floor 7 with the ledger.</div>
            </div>
            <div class="timeline-step">
                <div class="timeline-time">22:00</div>
                <div class="timeline-desc">Security staff discovers the victim and sounds alarm.</div>
            </div>
        `;
    }

    if (chainEl) {
        chainEl.innerHTML = `
            <strong>Culprit:</strong> Daniel Carter (Accountant)<br>
            <strong>Motive Established:</strong> Wanted to hide financial fraud ($15,000 unrecorded wire transfer).<br>
            <strong>Forensic Corroboration:</strong> Security card found at crime scene matched Daniel Carter's credentials. Fingerprints on broken desk drawer matched suspect. Access logs place suspect inside the office from 21:20 to 21:40 during the precise time of the attack.<br>
            <strong>Result:</strong> Suspect confessed in full; arrest warrant executed with distinction.
        `;
    }

    bringToFront(win);
}

// =========================================
// PHASE 5: TOOL GATING & INVESTIGATION STAGES
// =========================================

function initStageTracker() {
    const chk = document.getElementById('chkExperiencedMode');
    if (chk) {
        const saved = localStorage.getItem('qc_experienced_mode') === 'true';
        chk.checked = saved;
        chk.addEventListener('change', () => {
            localStorage.setItem('qc_experienced_mode', chk.checked ? 'true' : 'false');
            updateInvestigationStage(currentInvestigationStage);
            if (typeof updateGatedIcons === 'function') updateGatedIcons();
        });
    }

    // Collapse toggle
    const collapseBtn = document.getElementById('stageCollapseBtn');
    const bar = document.getElementById('stageTrackerBar');
    if (collapseBtn && bar) {
        if (localStorage.getItem('qc_bar_collapsed') === 'true') {
            bar.classList.add('collapsed');
            collapseBtn.textContent = String.fromCharCode(9660); // down arrow
        }
        collapseBtn.addEventListener('click', () => {
            const isNowCollapsed = bar.classList.toggle('collapsed');
            collapseBtn.textContent = isNowCollapsed ? String.fromCharCode(9660) : String.fromCharCode(9650);
            localStorage.setItem('qc_bar_collapsed', isNowCollapsed ? 'true' : 'false');
        });
        bar.addEventListener('click', (e) => {
            if (bar.classList.contains('collapsed') && e.target !== collapseBtn) {
                bar.classList.remove('collapsed');
                collapseBtn.textContent = String.fromCharCode(9650);
                localStorage.setItem('qc_bar_collapsed', 'false');
            }
        });
    }
}

function updateInvestigationStage(stage) {
    currentInvestigationStage = stage;
    const isExp = localStorage.getItem('qc_experienced_mode') === 'true';

    const s1 = document.getElementById('stage1Ind');
    const s2 = document.getElementById('stage2Ind');
    const s3 = document.getElementById('stage3Ind');

    if (s1 && s2 && s3) {
        if (isExp) {
            s1.className = 'stage-indicator done';
            s2.className = 'stage-indicator done';
            s3.className = 'stage-indicator done';
            return;
        }

        s1.className = 'stage-indicator ' + (stage > 1 ? 'done' : (stage === 1 ? 'active' : ''));
        s2.className = 'stage-indicator ' + (stage > 2 ? 'done' : (stage === 2 ? 'active' : ''));
        s3.className = 'stage-indicator ' + (stage >= 3 ? 'active' : '');
    }
}

// =========================================
// UTILITY
// =========================================


// =========================================
// MOJIBAKE CLEANER & RETRO AUDIO SYNTHESIS
// =========================================

function cleanMojibake(str) {
    if (str == null) return '';
    return String(str)
        .replace(/[�?]{2,}/g, ' - ')
        .replace(/\?\?/g, ' - ')
        .replace(/â€™/g, "'")
        .replace(/â€œ/g, '"')
        .replace(/â€/g, '"')
        .replace(/â€”/g, '—')
        .replace(/â€“/g, '–')
        .replace(/\u0092/g, "'")
        .replace(/blood\s*-\s*stained/gi, 'blood-stained')
        .replace(/high\s*-\s*end/gi, 'high-end')
        .replace(/cover\s*-\s*up/gi, 'cover-up');
}

let sfxAudioCtx = null;
function playSfx(type) {
    const volStr = localStorage.getItem('qc_audio_volume');
    const masterVol = volStr !== null ? parseFloat(volStr) / 100 : 0.4;
    if (masterVol <= 0) return;

    try {
        if (!sfxAudioCtx) {
            sfxAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (sfxAudioCtx.state === 'suspended') {
            sfxAudioCtx.resume();
        }

        const now = sfxAudioCtx.currentTime;
        const gainNode = sfxAudioCtx.createGain();
        gainNode.gain.setValueAtTime(masterVol * 0.25, now);
        gainNode.connect(sfxAudioCtx.destination);

        if (type === 'query') {
            const osc = sfxAudioCtx.createOscillator();
            osc.type = 'square';
            osc.frequency.setValueAtTime(750, now);
            osc.frequency.exponentialRampToValueAtTime(1400, now + 0.07);
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
            osc.connect(gainNode);
            osc.start(now);
            osc.stop(now + 0.09);
        } else if (type === 'pin') {
            const osc = sfxAudioCtx.createOscillator();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(1050, now);
            osc.frequency.setValueAtTime(650, now + 0.04);
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
            osc.connect(gainNode);
            osc.start(now);
            osc.stop(now + 0.07);
        } else if (type === 'clue') {
            [523.25, 659.25, 783.99].forEach((freq, idx) => {
                const osc = sfxAudioCtx.createOscillator();
                const noteGain = sfxAudioCtx.createGain();
                const noteStart = now + idx * 0.05;
                noteGain.gain.setValueAtTime(masterVol * 0.2, noteStart);
                noteGain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.16);
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, noteStart);
                osc.connect(noteGain);
                noteGain.connect(sfxAudioCtx.destination);
                osc.start(noteStart);
                osc.stop(noteStart + 0.16);
            });
        } else if (type === 'stamp') {
            const osc = sfxAudioCtx.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(130, now);
            osc.frequency.exponentialRampToValueAtTime(32, now + 0.22);
            gainNode.gain.setValueAtTime(masterVol * 0.6, now);
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
            osc.connect(gainNode);
            osc.start(now);
            osc.stop(now + 0.25);

            const bell = sfxAudioCtx.createOscillator();
            const bellGain = sfxAudioCtx.createGain();
            bell.type = 'sine';
            bell.frequency.setValueAtTime(1046.5, now + 0.08);
            bellGain.gain.setValueAtTime(masterVol * 0.35, now + 0.08);
            bellGain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
            bell.connect(bellGain);
            bellGain.connect(sfxAudioCtx.destination);
            bell.start(now + 0.08);
            bell.stop(now + 0.55);
        } else if (type === 'denied') {
            [0, 0.12].forEach(offset => {
                const osc = sfxAudioCtx.createOscillator();
                const buzzGain = sfxAudioCtx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(130, now + offset);
                buzzGain.gain.setValueAtTime(masterVol * 0.35, now + offset);
                buzzGain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.09);
                osc.connect(buzzGain);
                buzzGain.connect(sfxAudioCtx.destination);
                osc.start(now + offset);
                osc.stop(now + offset + 0.09);
            });
        }
    } catch (e) {}
}

function esc(str) {
    return cleanMojibake(String(str ?? ''))
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
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
window.showCaseDebrief = showCaseDebrief;
window.updateInvestigationStage = updateInvestigationStage;


// =========================================
// FEATURE WAVE: SCHEMA DRAWER & QUERY HISTORY
// =========================================

const DB_SCHEMA = {
    suspects: ['suspect_id', 'name', 'age', 'occupation', 'relationship_to_victim', 'motive', 'alibi', 'case_id'],
    access_logs: ['log_id', 'suspect_id', 'location', 'access_time', 'exit_time', 'case_id'],
    evidence: ['evidence_id', 'description', 'location', 'evidence_type', 'date_found', 'case_id'],
    transactions: ['transaction_id', 'suspect_id', 'amount', 'transaction_date', 'description', 'case_id'],
    phone_records: ['record_id', 'caller_suspect_id', 'receiver_suspect_id', 'call_time', 'call_duration', 'case_id'],
    timeline_events: ['event_id', 'event_time', 'description', 'location', 'case_id'],
    crime_scenes: ['scene_id', 'name', 'location', 'description', 'case_id'],
    victims: ['victim_id', 'name', 'age', 'occupation', 'cause_of_crime', 'case_id']
};

function insertTextAtCursor(el, text) {
    const start = el.selectionStart || 0;
    const end = el.selectionEnd || 0;
    const val = el.value;
    el.value = val.substring(0, start) + text + val.substring(end);
    el.selectionStart = el.selectionEnd = start + text.length;
    el.focus();
}

function initSchemaDrawer() {
    const container = document.getElementById('schemaPillsContainer');
    const tabs = document.querySelectorAll('.schema-tab');
    const sqlInput = document.getElementById('sqlQuery');
    if (!container || !sqlInput) return;

    function renderColumns(tableName) {
        const cols = DB_SCHEMA[tableName] || [];
        const activeId = caseId || 1;
        container.innerHTML = `
            <span style="font-size:10px;font-weight:bold;color:#1e3a8a;margin-right:2px;">${tableName}:</span>
            ${cols.map(c => `<button type="button" class="schema-pill" data-insert="${c}" title="Insert column">${c}</button>`).join('')}
            <button type="button" class="schema-template-btn" data-template="SELECT * FROM ${tableName} WHERE case_id = ${activeId};">📋 SELECT * Template</button>
        `;
    }

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            renderColumns(tab.dataset.table);
        });
    });

    container.addEventListener('click', (e) => {
        const pill = e.target.closest('.schema-pill');
        if (pill) {
            insertTextAtCursor(sqlInput, pill.dataset.insert);
            return;
        }
        const tpl = e.target.closest('.schema-template-btn');
        if (tpl) {
            sqlInput.value = tpl.dataset.template;
            sqlInput.focus();
        }
    });

    renderColumns('suspects');
}

let queryHistoryCursor = -1;

function setupQueryHistoryNav() {
    const sqlInput = document.getElementById('sqlQuery');
    if (!sqlInput) return;

    sqlInput.addEventListener('keydown', (e) => {
        // Quick execute with Ctrl+Enter or Cmd+Enter
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            const btn = document.getElementById('executeQuery');
            if (btn) btn.click();
            return;
        }

        // Query history recall with ArrowUp and ArrowDown
        const hist = JSON.parse(localStorage.getItem('qc_query_history') || '[]');
        if (!hist.length) return;

        if (e.key === 'ArrowUp' && (sqlInput.selectionStart === 0 || sqlInput.value.trim() === '')) {
            if (queryHistoryCursor < hist.length - 1) {
                e.preventDefault();
                queryHistoryCursor++;
                sqlInput.value = hist[queryHistoryCursor];
            }
        } else if (e.key === 'ArrowDown' && queryHistoryCursor >= 0) {
            e.preventDefault();
            queryHistoryCursor--;
            if (queryHistoryCursor >= 0) {
                sqlInput.value = hist[queryHistoryCursor];
            } else {
                sqlInput.value = '';
            }
        }
    });
}

// =========================================
// FEATURE WAVE: WINDOW TILING & CASCADE
// =========================================

function cascadeWindows() {
    const wins = Array.from(document.querySelectorAll('.retro-window:not(.hidden)'));
    if (!wins.length) return;
    wins.forEach((w, idx) => {
        w.style.width = '580px';
        w.style.height = '430px';
        w.style.left = Math.min(260, 24 + idx * 32) + 'px';
        w.style.top = Math.min(200, 24 + idx * 32) + 'px';
        bringToFront(w);
    });
}

function tileWindows() {
    const mainIds = ['win-search', 'win-suspects', 'win-clues', 'win-arrest'];
    mainIds.forEach(id => {
        const w = document.getElementById(id);
        if (w) w.classList.remove('hidden');
    });
    updateTaskbar();

    const d = document.getElementById('desktop');
    const dw = d ? d.clientWidth : window.innerWidth;
    const dh = (d ? d.clientHeight : window.innerHeight) - 46;

    const halfW = Math.max(340, Math.floor(dw / 2) - 6);
    const halfH = Math.max(260, Math.floor(dh / 2) - 6);

    const positions = [
        { id: 'win-search', left: 4, top: 4, width: halfW, height: halfH },
        { id: 'win-suspects', left: halfW + 8, top: 4, width: halfW, height: halfH },
        { id: 'win-clues', left: 4, top: halfH + 8, width: halfW, height: halfH },
        { id: 'win-arrest', left: halfW + 8, top: halfH + 8, width: halfW, height: halfH }
    ];

    positions.forEach(p => {
        const w = document.getElementById(p.id);
        if (w) {
            w.style.left = p.left + 'px';
            w.style.top = p.top + 'px';
            w.style.width = p.width + 'px';
            w.style.height = p.height + 'px';
            bringToFront(w);
        }
    });
}

function initWindowTiling() {
    const btnCascade = document.getElementById('btnCascadeWindows');
    const btnTile = document.getElementById('btnTileWindows');

    if (btnCascade) btnCascade.addEventListener('click', cascadeWindows);
    if (btnTile) btnTile.addEventListener('click', tileWindows);
}

function initPrintDossier() {
    const btnPrint = document.getElementById('btnPrintDebrief');
    if (btnPrint) {
        btnPrint.addEventListener('click', () => {
            window.print();
        });
    }
}

// Quick Pinning to Detective Notepad from SQL, Exhibits, & Interrogations
function initNotepadPinning() {
    const btnPinTable = document.getElementById('btnPinToNotepad');
    if (btnPinTable) {
        btnPinTable.addEventListener('click', () => {
            const sqlInput = document.getElementById('sqlQuery');
            const query = (sqlInput ? sqlInput.value.trim() : '') || 'SELECT Query';
            const table = document.getElementById('resultsTable');
            if (!table) return;

            const headers = Array.from(table.querySelectorAll('thead th')).map(th => th.textContent.trim());
            const rows = Array.from(table.querySelectorAll('tbody tr')).map(tr => {
                return Array.from(tr.querySelectorAll('td')).map(td => td.textContent.trim()).join(' | ');
            });

            if (!rows.length || (rows.length === 1 && rows[0].includes('Enter a SELECT query'))) {
                window.pinToNotepad(`[Query: ${query}] No result rows returned.`);
                return;
            }

            const previewRows = rows.slice(0, 8).map(r => `  • ${r}`).join('\n');
            const summary = `[Query: ${query}]\nColumns: ${headers.join(', ')}\nRows (${rows.length}):\n${previewRows}`;
            window.pinToNotepad(summary);
        });
    }

    const btnPinEvidence = document.getElementById('btnPinEvidenceToNotes');
    if (btnPinEvidence) {
        btnPinEvidence.addEventListener('click', () => {
            const item = window.currentInspectedExhibit;
            if (!item) return;
            const isScene = !item.evidenceId;
            const note = isScene 
                ? `[Crime Scene: ${item.name || 'Site'} (${item.location || 'Location'})] ${item.description || ''}`
                : `[Exhibit #${item.evidenceId || '1'}: ${item.evidenceType || 'Clue'} (${item.location || 'Found on scene'})] ${item.description || ''}`;
            window.pinToNotepad(note);
        });
    }

    const resultsBody = document.getElementById('resultsBody');
    if (resultsBody) {
        resultsBody.addEventListener('dblclick', (e) => {
            const tr = e.target.closest('tr');
            if (!tr) return;
            const cells = Array.from(tr.querySelectorAll('td')).map(td => td.textContent.trim());
            if (!cells.length) return;
            window.pinToNotepad(`[Record Pin]: ${cells.join(' | ')}`);
        });
    }
}

// Notepad Export to Text File & Clear Page
function initNotepadExport() {
    const btnExport = document.getElementById('btnExportNotes');
    if (btnExport) {
        btnExport.addEventListener('click', () => {
            let combined = `=================================================\n`;
            combined += `LZPD MINOR CRIMES DIVISION — CASE #${caseId || 1} INVESTIGATION NOTES\n`;
            combined += `Exported: ${new Date().toLocaleString()}\n`;
            combined += `=================================================\n\n`;

            for (let p = 1; p <= 6; p++) {
                const note = localStorage.getItem(`qc_notepad_page_${p}`) || '';
                if (note.trim()) {
                    combined += `--- [PAGE ${p}] ---\n${note.trim()}\n\n`;
                }
            }

            const activeText = document.getElementById('notepadText')?.value || '';
            if (!combined.includes(activeText.trim()) && activeText.trim()) {
                combined += `--- [CURRENT ACTIVE NOTES] ---\n${activeText.trim()}\n\n`;
            }

            const blob = new Blob([combined], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `case-${caseId || 1}-detective-notes.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            playSfx('pin');
        });
    }

    const btnClear = document.getElementById('btnClearNotes');
    if (btnClear) {
        btnClear.addEventListener('click', () => {
            const notepad = document.getElementById('notepadText');
            if (!notepad) return;
            if (confirm('Clear current Notepad page?')) {
                notepad.value = '';
                const p = window.activeNotepadPage || 1;
                localStorage.setItem(`qc_notepad_page_${p}`, '');
                if (p === 1) localStorage.setItem('qc_notepad_notes', '');
                playSfx('pin');
            }
        });
    }
}


// =========================================
// STEP 2: GAMEPLAY & INVESTIGATION ENHANCEMENTS
// =========================================

// --- 1. OBJECTIVE TRACKER ---
window.caseObjectives = { 1: false, 2: false, 3: false, 4: false };

function resetObjectivesTracker() {
    window.caseObjectives = { 1: false, 2: false, 3: false, 4: false };
    for (let i = 1; i <= 4; i++) {
        const item = document.getElementById(`objBriefing${i}`);
        if (item) {
            item.classList.remove('obj-completed');
            const check = item.querySelector('.obj-check');
            if (check) check.textContent = '⬜';
        }
        const pill = document.getElementById(`pillObj${i}`);
        if (pill) pill.classList.remove('done');
    }
}

function completeObjective(num, title) {
    if (window.caseObjectives[num]) return;
    window.caseObjectives[num] = true;

    const item = document.getElementById(`objBriefing${num}`);
    if (item) {
        item.classList.add('obj-completed');
        const check = item.querySelector('.obj-check');
        if (check) check.textContent = '✅';
    }

    const pill = document.getElementById(`pillObj${num}`);
    if (pill) pill.classList.add('done');

    playSfx('clue');
    showDetectiveToast(`🎯 OBJECTIVE COMPLETE: ${title}`);
}

// --- 2. 3-LEVEL HINT SYSTEM ---
window.caseHintsUsed = 0;
window.caseHintsPenalty = 0;

const CASE_HINTS = {
    1: {
        nudge: "Focus on the access_logs table between 20:30 and 21:40 on Floor 7. Compare who entered with when Sarah was last seen.",
        clue: "Run: SELECT * FROM access_logs WHERE room = 'Executive Office' ORDER BY access_time; Note whose badge accessed the room without a matching exit before the breach.",
        nearAnswer: "Daniel Miller claims he was in the audit annex, but access_logs record his keycard opening the Executive Office door at 21:20."
    },
    2: {
        nudge: "Look at access_logs and transactions for anyone active in the building after 22:00 or with unusual late-night hardware purchases.",
        clue: "Query access_logs for swipes on server rack room B. Cross-reference suspect receipts or transactions.",
        nearAnswer: "Alex Rivera purchased a red hoodie seen on CCTV and swiped into server rack B at 22:30."
    },
    11: {
        nudge: "Investigate security shifts in access_logs during the syndicate kidnapping window. Who disabled or repositioned cameras?",
        clue: "Check phone_records between security personnel and external encrypted numbers.",
        nearAnswer: "Samira Khan was the on-duty security lead who received an outside wire transfer and disabled the rear perimeter gate."
    },
    12: {
        nudge: "Inspect physical evidence at the stable and look for recent cutting tool purchases in the transactions table.",
        clue: "Cross-reference who had access to the training rig and who recently purchased industrial cable shears.",
        nearAnswer: "Jasper Whitfield purchased the cutting tool found near the rig and had sole access to Silverwind's paddock."
    },
    13: {
        nudge: "Check casino back hallway surveillance access and missing vault keys in the timeline_events table.",
        clue: "Look for discarded accessories or uniforms logged in the evidence table and link them to suspect wardrobe.",
        nearAnswer: "Mira Duran left her distinctive silk scarf caught on the vault latch at 22:12."
    }
};

function getHintData(currentCaseId) {
    const id = Number(currentCaseId) || 1;
    if (CASE_HINTS[id]) return CASE_HINTS[id];
    return {
        nudge: `Review access_logs and timeline_events for Case #${id}. Filter by the critical 30-minute crime window.`,
        clue: `JOIN suspects and access_logs on suspect_id to verify which suspect's physical location contradicts their recorded alibi.`,
        nearAnswer: `The culprit's keycard or phone records directly contradict their claimed alibi during the incident window.`
    };
}

function initHintSystem() {
    const btn1 = document.getElementById('btnUnlockHint1');
    const btn2 = document.getElementById('btnUnlockHint2');
    const btn3 = document.getElementById('btnUnlockHint3');

    const content1 = document.getElementById('hintContent1');
    const content2 = document.getElementById('hintContent2');
    const content3 = document.getElementById('hintContent3');

    if (btn1 && content1) {
        btn1.onclick = () => {
            const h = getHintData(caseId);
            content1.textContent = h.nudge;
            content1.classList.add('revealed');
            btn1.disabled = true;
            btn1.textContent = 'Revealed';
            window.caseHintsUsed++;
            window.caseHintsPenalty += 1;
            playSfx('query');
            showDetectiveToast('💡 Level 1 Nudge Unlocked (-1 Rank Pt)');
        };
    }

    if (btn2 && content2) {
        btn2.onclick = () => {
            const h = getHintData(caseId);
            content2.textContent = h.clue;
            content2.classList.add('revealed');
            btn2.disabled = true;
            btn2.textContent = 'Revealed';
            window.caseHintsUsed++;
            window.caseHintsPenalty += 2;
            playSfx('query');
            showDetectiveToast('🔍 Level 2 Forensic Clue Unlocked (-2 Rank Pts)');
        };
    }

    if (btn3 && content3) {
        btn3.onclick = () => {
            const h = getHintData(caseId);
            content3.textContent = h.nearAnswer;
            content3.classList.add('revealed');
            btn3.disabled = true;
            btn3.textContent = 'Revealed';
            window.caseHintsUsed++;
            window.caseHintsPenalty += 5;
            playSfx('denied');
            showDetectiveToast('⚠️ Level 3 Contradiction Revealed (Rank C Cap)');
        };
    }
}

function resetHintSystemUI() {
    window.caseHintsUsed = 0;
    window.caseHintsPenalty = 0;
    ['btnUnlockHint1', 'btnUnlockHint2', 'btnUnlockHint3'].forEach(id => {
        const b = document.getElementById(id);
        if (b) {
            b.disabled = false;
            b.textContent = b.id.includes('1') ? 'Reveal (-1 Pt)' : b.id.includes('2') ? 'Reveal (-2 Pts)' : 'Reveal (Caps at Rank C)';
        }
    });
    ['hintContent1', 'hintContent2', 'hintContent3'].forEach(id => {
        const c = document.getElementById(id);
        if (c) {
            c.classList.remove('revealed');
            c.textContent = 'Awaiting reveal authorization...';
        }
    });
}

// --- 3. EVIDENCE-LINKED INTERROGATION & CONFRONTATION ---
function initEvidenceConfrontation() {
    const btnConfront = document.getElementById('btnConfrontEvidence');
    const select = document.getElementById('interrogateEvidenceSelect');
    const feedback = document.getElementById('confrontationFeedback');
    const dialogueEl = document.getElementById('interrogationDialogue');

    if (!btnConfront || !select) return;

    btnConfront.onclick = () => {
        const suspectSelect = document.getElementById('accusedSuspect');
        const suspectId = suspectSelect ? parseInt(suspectSelect.value, 10) : 0;
        const evidenceId = select.value;

        if (!suspectId) {
            showDetectiveToast('⚠️ Select a suspect to interrogate first.');
            return;
        }
        if (!evidenceId) {
            showDetectiveToast('⚠️ Choose an exhibit from the dropdown to present.');
            return;
        }

        const suspect = (window.currentCaseSuspects || []).find(s => Number(s.suspectId) === Number(suspectId));
        const sName = suspect ? suspect.name : 'The suspect';
        const opt = select.options[select.selectedIndex];

        let responseText = '';
        let isExposedLie = false;

        if (Number(caseId) === 1) {
            if (sName.includes('Daniel')) {
                isExposedLie = true;
                responseText = `[EXPOSED LIE] "${sName}: Wh-where did you find that?! My badge was supposed to be in my drawer! Look... Sarah caught me modifying the ledger balances. I never meant for her to get hurt! She confronted me at 21:20 and I panicked... Dammit, you've got me."`;
            } else if (sName.includes('Rebecca')) {
                responseText = `[ALIBI CONFIRMED] "${sName}: That's right, Detective. That parking receipt proves I drove out of the underground lot at 20:30 sharp. I was nowhere near Floor 7 when the ledger vanished."`;
            } else if (sName.includes('Michael')) {
                responseText = `[DEFLECTION] "${sName}: Check the camera logs, Detective. That exhibit wasn't logged during my shift. I was monitoring the main dispatch gate until 22:00."`;
            } else {
                responseText = `[DEFLECTION] "${sName}: That exhibit has zero connection to me. Check the fingerprints before throwing accusations around."`;
            }
        } else {
            const isLikelyCulprit = (suspect && suspect.alibi && suspect.alibi.toLowerCase().includes('alone')) || (opt && opt.text.toLowerCase().includes(sName.split(' ')[0].toLowerCase()));
            if (isLikelyCulprit) {
                isExposedLie = true;
                responseText = `[EXPOSED LIE] "${sName}: I... how did you tie that to me?! I took every precaution. Fine, you caught the contradiction. The timeline doesn't hold up."`;
            } else {
                responseText = `[DEFLECTION] "${sName}: That piece of evidence doesn't link to me, Detective. Look at the timestamps — I was elsewhere. You're barking up the wrong tree."`;
            }
        }

        if (dialogueEl) {
            typewriterText(dialogueEl, responseText, 12);
        }

        if (feedback) {
            feedback.style.display = 'block';
            feedback.className = isExposedLie ? 'confront-exposed' : 'confront-deflected';
            feedback.textContent = isExposedLie ? '⚖️ CONTRADICTION DETECTED: Suspect faltered and contradicted prior testimony!' : '🛡️ DEFLECTION: Suspect maintained composure and refuted the link.';
        }

        if (isExposedLie) {
            playSfx('stamp');
            completeObjective(3, 'Verify Alibis & Expose Discrepancy');
            dispatchVanceMessage(3);
        } else {
            playSfx('query');
            completeObjective(3, 'Verify Alibis');
        }
    };
}

function populateInterrogationEvidenceSelect(evidence) {
    const select = document.getElementById('interrogateEvidenceSelect');
    if (!select) return;

    select.innerHTML = '<option value="">-- Choose Exhibit to Present --</option>';
    if (!evidence || !evidence.length) return;

    evidence.forEach(e => {
        const opt = document.createElement('option');
        opt.value = e.evidenceId || e.id || Math.random();
        opt.textContent = `${e.evidenceType || 'Exhibit'}: ${(e.description || '').substring(0, 38)}...`;
        select.appendChild(opt);
    });
}

// --- 4. RED HERRINGS & DEBRIEF EXONERATIONS ---
const CASE_RED_HERRINGS = {
    1: [
        { name: "Rebecca Torres", role: "Corporate Counsel", reason: "Cleared. She was observed shredding confidential tax audit memoranda (an unrelated compliance issue), but garage security confirmed her vehicle departed at 20:30." },
        { name: "Michael Chang", role: "Night Security Officer", reason: "Cleared. Camera terminal 3 went dark because he was playing handheld video games during his shift, not aiding the intruder." }
    ],
    2: [
        { name: "Kevin Brooks", role: "Senior Developer", reason: "Cleared. His unrecorded $800 cash withdrawal was for a surprise anniversary gift, not corporate espionage." }
    ],
    11: [
        { name: "Dr. Hector Alvarez", role: "Staff Physician", reason: "Cleared. The missing sedative vials were used to care for his chronically ill daughter off-the-books, unrelated to the syndicate kidnapping." }
    ],
    12: [
        { name: "Pete Sullivan", role: "Head Stablehand", reason: "Cleared. He was spotted with wire pliers near the barn late at night because he was repairing a damaged paddock gate." }
    ],
    13: [
        { name: "Carlos Mendez", role: "Floor Pit Boss", reason: "Cleared. The unlogged chip transfer was him confiscating counterfeit casino tokens passed by foreign tourists." }
    ]
};

function renderDebriefRedHerrings(activeCaseId) {
    const listEl = document.getElementById('debriefRedHerringsList');
    if (!listEl) return;

    const id = Number(activeCaseId) || 1;
    const herrings = CASE_RED_HERRINGS[id] || [
        { name: "Persons of Interest", role: "Witnesses & Staff", reason: "All other questioned persons of interest were fully cleared after forensic verification of their timestamped movements." }
    ];

    listEl.innerHTML = '';
    herrings.forEach(h => {
        const li = document.createElement('li');
        li.style.marginBottom = '6px';
        li.innerHTML = `<strong>${esc(h.name)}</strong> (${esc(h.role)}): ${esc(h.reason)}`;
        listEl.appendChild(li);
    });
}

// --- 5. WRONG ARREST FEEDBACK & ATTEMPTS LIMIT ---
window.caseWarrantAttemptsRemaining = 3;

function updateWarrantQuotaDisplay() {
    const heartsEl = document.getElementById('warrantAttemptsHearts');
    const textEl = document.getElementById('warrantAttemptsText');
    const banner = document.getElementById('caseClosedIaBanner');
    const btnSubmit = document.getElementById('submitAccusation');

    const rem = window.caseWarrantAttemptsRemaining;
    if (textEl) textEl.textContent = `${rem} of 3 remaining`;

    let heartsStr = '❤️❤️❤️';
    if (rem === 2) heartsStr = '❤️❤️🖤';
    else if (rem === 1) heartsStr = '❤️🖤🖤';
    else if (rem <= 0) heartsStr = '🖤🖤🖤';
    if (heartsEl) heartsEl.textContent = heartsStr;

    if (rem <= 0) {
        if (btnSubmit) btnSubmit.disabled = true;
        if (banner) {
            banner.style.display = 'block';
            banner.innerHTML = `
                <strong>🚨 INVESTIGATION SUSPENDED BY INTERNAL AFFAIRS</strong><br>
                You have filed 3 rejected arrest warrants. The suspects have retained counsel and refused further interrogation.
                <div style="margin-top:6px;">
                    <button type="button" class="retro-btn" id="btnRestartWarrantQuota" style="font-weight:bold;padding:3px 12px;font-size:11px;">🔄 Reopen Case File &amp; Reset Quota</button>
                </div>
            `;
            const btnRestart = document.getElementById('btnRestartWarrantQuota');
            if (btnRestart) {
                btnRestart.onclick = () => {
                    window.caseWarrantAttemptsRemaining = 3;
                    updateWarrantQuotaDisplay();
                    banner.style.display = 'none';
                    if (btnSubmit) btnSubmit.disabled = false;
                    const resultEl = document.getElementById('accusationResult');
                    if (resultEl) resultEl.innerHTML = '';
                    showDetectiveToast('🔄 Case File Reopened. Proceed carefully.');
                };
            }
        }
    } else {
        if (banner) banner.style.display = 'none';
        if (btnSubmit) btnSubmit.disabled = false;
    }
}

// --- 6. UNLOCKABLE FORENSIC EVIDENCE ---
window.latentEvidenceUnlocked = false;

function checkUnlockLatentEvidence(actionType) {
    if (window.latentEvidenceUnlocked) return;
    window.latentEvidenceUnlocked = true;

    playSfx('clue');
    showDetectiveToast('🔓 FORENSIC LAB UPDATE: Latent Exhibit #E-CL Decrypted!');

    const lockedCard = document.querySelector('.clue-card-locked');
    if (lockedCard) {
        lockedCard.classList.remove('clue-card-locked');
        lockedCard.classList.add('clue-card-unlocked');
        const desc = lockedCard.querySelector('.clue-desc');
        if (desc) {
            desc.textContent = "LATENT ANALYSIS DECRYPTED: Access records prove terminal #4 at 21:20 required a physical bypass code known only to executive staff.";
        }
        const tag = lockedCard.querySelector('.clue-badge');
        if (tag) {
            tag.textContent = 'UNLOCKED EXHIBIT';
            tag.style.background = '#dcfce7';
            tag.style.color = '#166534';
        }
    }
}

// --- 7. CAPTAIN VANCE NARRATIVE BEATS ---
const VANCE_MEMOS = [
    {
        id: 1,
        trigger: 'start',
        subject: '📌 Case Directive: Initial Protocol',
        time: 'Today, 08:30 AM',
        body: 'Detective Miller,\n\nWe have a fresh incident file on your desk. Start by reviewing physical clues and crime scene exhibits before making assumptions. Work through the access records and verify every claimed alibi.\n\nDo not file an apprehension warrant without forensic proof.\n\n— Capt. R. Vance'
    },
    {
        id: 2,
        trigger: 'query',
        subject: '⚡ Mainframe Records Update',
        time: 'Today, 09:15 AM',
        body: 'Detective,\n\nI see you tapped into the precinct database. Good. Keep an eye on entry vs exit timestamps. In minor crimes and fraud, the cover-up is always clumsier than the deed. Look for whoever was in the wrong place at the wrong time.\n\n— Capt. R. Vance'
    },
    {
        id: 3,
        trigger: 'interrogation',
        subject: '🎙️ Interrogation Room Wiretap',
        time: 'Today, 10:02 AM',
        body: 'Miller,\n\nI monitored the audio from interrogation. One of those stories is crumbling under scrutiny. When you confront them with physical exhibits, they will break. Assemble your evidence chain and prepare the warrant.\n\n— Capt. R. Vance'
    },
    {
        id: 4,
        trigger: 'warrant_denied',
        subject: '⚠️ Internal Affairs Pushback: Warrant Rejected',
        time: 'Today, 10:45 AM',
        body: 'Detective!\n\nThe District Attorney just rejected that warrant. You are burning through our judicial quota. Cross-reference their verified phone calls and departure records before you submit another order! We only get 3 attempts before IA steps in.\n\n— Capt. R. Vance'
    }
];

window.receivedVanceMemos = [];

function initCaptainVanceInbox() {
    window.receivedVanceMemos = [VANCE_MEMOS[0]];
    renderVanceInbox();
}

function dispatchVanceMessage(memoId) {
    const memo = VANCE_MEMOS.find(m => m.id === memoId);
    if (!memo) return;
    if (window.receivedVanceMemos.some(m => m.id === memoId)) return;

    window.receivedVanceMemos.push(memo);
    renderVanceInbox();

    const badge = document.getElementById('msgUnreadBadge');
    if (badge) {
        badge.style.display = 'block';
        badge.textContent = String(window.receivedVanceMemos.length);
    }

    playSfx('clue');
    showDetectiveToast(`📻 RADIO: Captain Vance dispatched a new memo!`);
}

function renderVanceInbox() {
    const list = document.getElementById('msgInboxList');
    const countEl = document.getElementById('msgInboxCount');
    if (!list) return;

    if (countEl) countEl.textContent = `${window.receivedVanceMemos.length} Messages`;

    list.innerHTML = '';
    window.receivedVanceMemos.forEach((m, idx) => {
        const item = document.createElement('div');
        item.className = `inbox-item ${idx === 0 ? 'active' : ''}`;
        item.innerHTML = `
            <div>
                <div style="font-weight:bold;">${esc(m.subject)}</div>
                <div style="font-size:10px;color:#64748b;">${esc(m.time)}</div>
            </div>
            <span style="font-size:11px;">✉️</span>
        `;

        item.onclick = () => {
            list.querySelectorAll('.inbox-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            viewVanceMemo(m);
        };

        list.appendChild(item);
    });

    if (window.receivedVanceMemos.length > 0) {
        viewVanceMemo(window.receivedVanceMemos[window.receivedVanceMemos.length - 1]);
    }
}

function viewVanceMemo(memo) {
    const subjEl = document.getElementById('msgViewSubject');
    const metaEl = document.getElementById('msgViewMeta');
    const bodyEl = document.getElementById('msgViewBody');

    if (subjEl) subjEl.textContent = memo.subject;
    if (metaEl) metaEl.textContent = `FROM: Captain Vance • ${memo.time}`;
    if (bodyEl) bodyEl.innerHTML = memo.body.replace(/\n/g, '<br>');

    const badge = document.getElementById('msgUnreadBadge');
    if (badge) badge.style.display = 'none';
}



// =========================================
// STEP 3: PROGRESSION, REPLAY & LEADERBOARD
// =========================================

// --- 1. SQL CONCEPT MINI-TUTORIALS ---
const SQL_DIFFICULTY_CONCEPTS = {
    EASY: {
        concept: "SELECT & WHERE Filters",
        desc: "Filter access logs and incident timestamps to isolate who was in the critical area.",
        template: "SELECT * FROM access_logs WHERE room = 'Executive Office' ORDER BY access_time;"
    },
    MEDIUM: {
        concept: "INNER JOIN Suspects & Logs",
        desc: "Join suspects table with access_logs or transactions on suspect_id to link names with forensic activity.",
        template: "SELECT s.name, s.occupation, a.room, a.access_time FROM suspects s JOIN access_logs a ON s.suspect_id = a.suspect_id;"
    },
    HARD: {
        concept: "GROUP BY, HAVING & Aggregations",
        desc: "Detect suspicious multi-room sweeps or financial totals exceeding typical operational thresholds.",
        template: "SELECT suspect_id, COUNT(*) AS room_swipes FROM access_logs GROUP BY suspect_id HAVING COUNT(*) > 1;"
    }
};

function updateSqlConceptCard(caseData) {
    const cardTitle = document.getElementById('conceptCardTitle');
    const cardDesc = document.getElementById('conceptCardDesc');
    const cardSql = document.getElementById('conceptCardSql');
    const btnPaste = document.getElementById('btnPasteConceptSql');

    if (!caseData) return;
    const diff = (caseData.difficulty || 'Normal').toUpperCase();
    const config = SQL_DIFFICULTY_CONCEPTS[diff] || SQL_DIFFICULTY_CONCEPTS.EASY;

    if (cardTitle) cardTitle.textContent = `💡 SQL Concept Focus: ${config.concept} (Difficulty: ${diff})`;
    if (cardDesc) cardDesc.textContent = config.desc;
    if (cardSql) cardSql.textContent = config.template;

    if (btnPaste) {
        btnPaste.onclick = () => {
            const sqlInput = document.getElementById('sqlQuery');
            if (sqlInput) sqlInput.value = config.template;
            bringToFront('win-search');
            playSfx('query');
            showDetectiveToast(`📋 Pasted ${config.concept} template into Search!`);
        };
    }
}

// --- 2. PERSISTENT PROGRESS & PLAYER PROFILE ---
function getPlayerProgress() {
    let xp = parseInt(localStorage.getItem('qc_player_xp') || '0', 10);
    let solvedCases = [];
    let caseRanks = {};
    try {
        solvedCases = JSON.parse(localStorage.getItem('qc_solved_cases') || '[]');
        caseRanks = JSON.parse(localStorage.getItem('qc_case_ranks') || '{}');
    } catch (e) {}
    return { xp, solvedCases, caseRanks };
}

function updatePlayerProfileUI() {
    const { xp, solvedCases } = getPlayerProgress();
    const level = Math.floor(xp / 400) + 1;
    const pill = document.getElementById('playerStatusPill');
    if (pill) {
        pill.textContent = `🕵️ Miller • Lvl ${level} (${xp} XP)`;
    }
}

function savePlayerCaseSolve(solvedCaseId, rank, score, awardedXp) {
    let { xp, solvedCases, caseRanks } = getPlayerProgress();
    xp += awardedXp;
    if (!solvedCases.includes(Number(solvedCaseId))) {
        solvedCases.push(Number(solvedCaseId));
    }
    caseRanks[solvedCaseId] = rank;

    localStorage.setItem('qc_player_xp', String(xp));
    localStorage.setItem('qc_solved_cases', JSON.stringify(solvedCases));
    localStorage.setItem('qc_case_ranks', JSON.stringify(caseRanks));

    // Save to local leaderboard
    try {
        let board = JSON.parse(localStorage.getItem('qc_leaderboard_runs') || '[]');
        board.unshift({
            date: new Date().toLocaleDateString(),
            caseId: solvedCaseId,
            caseTitle: (window.currentCaseData && window.currentCaseData.title) || `Case #${solvedCaseId}`,
            rank: rank,
            score: score,
            xp: awardedXp
        });
        if (board.length > 10) board.pop();
        localStorage.setItem('qc_leaderboard_runs', JSON.stringify(board));
    } catch (e) {}

    updatePlayerProfileUI();
    renderLeaderboard();
}

// --- 3. DAILY FEATURED CASE & LEADERBOARD ---
function getDailyCaseIndex(totalCases) {
    if (!totalCases || totalCases <= 0) return 0;
    const today = new Date().toISOString().slice(0, 10);
    let hash = 0;
    for (let i = 0; i < today.length; i++) {
        hash = (hash << 5) - hash + today.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash) % totalCases;
}

function initDailyCaseAndLeaderboard() {
    renderLeaderboard();
    renderAchievements();
}

// =========================================
// ACHIEVEMENTS & COMMENDATIONS SYSTEM
// =========================================

const ACHIEVEMENTS_LIST = [
    {
        id: 'first_solve',
        icon: '🎖️',
        title: 'First Case Closed',
        desc: 'Successfully apprehend the culprit in any criminal investigation.',
        xp: 100
    },
    {
        id: 'master_s',
        icon: '⭐',
        title: 'Master Detective',
        desc: 'Earn an S-Rank on any case with a score of 850 or higher.',
        xp: 200
    },
    {
        id: 'clean_sheet',
        icon: '🎯',
        title: 'Clean Sheet',
        desc: 'Execute an arrest warrant without a single rejected accusation.',
        xp: 150
    },
    {
        id: 'speed_demon',
        icon: '⚡',
        title: 'Rapid Response',
        desc: 'Solve an entire case in under 2 minutes.',
        xp: 150
    },
    {
        id: 'sql_prodigy',
        icon: '💻',
        title: 'SQL Prodigy',
        desc: 'Solve a case using 4 or fewer mainframe queries.',
        xp: 150
    },
    {
        id: 'no_hints',
        icon: '🧠',
        title: 'Pure Intuition',
        desc: 'Solve a case without consulting Vance or using hints.',
        xp: 100
    },
    {
        id: 'daily_case',
        icon: '📅',
        title: 'Daily Duty',
        desc: 'Inspect and complete the featured Daily Case.',
        xp: 150
    },
    {
        id: 'veteran',
        icon: '🏆',
        title: 'Precinct Veteran',
        desc: 'Accumulate 1,000 or more Total XP across your career.',
        xp: 250
    }
];

function getUnlockedAchievements() {
    try {
        return JSON.parse(localStorage.getItem('qc_unlocked_achievements') || '[]');
    } catch (e) {
        return [];
    }
}

function saveUnlockedAchievements(unlocked) {
    localStorage.setItem('qc_unlocked_achievements', JSON.stringify(unlocked));
}

function evaluateAchievements(cId, rank, score, queries, secs, wrongAccusations, hints) {
    let unlocked = getUnlockedAchievements();
    let newlyUnlocked = [];

    function grant(achId) {
        if (!unlocked.includes(achId)) {
            unlocked.push(achId);
            newlyUnlocked.push(achId);
        }
    }

    // 1. first_solve
    grant('first_solve');

    // 2. master_s
    if (rank === 'S' || score >= 850) {
        grant('master_s');
    }

    // 3. clean_sheet
    if (wrongAccusations === 0) {
        grant('clean_sheet');
    }

    // 4. speed_demon
    if (secs < 120) {
        grant('speed_demon');
    }

    // 5. sql_prodigy
    if (queries <= 4) {
        grant('sql_prodigy');
    }

    // 6. no_hints
    if (hints === 0 && (!window.caseHintsPenalty || window.caseHintsPenalty === 0)) {
        grant('no_hints');
    }

    // 7. daily_case
    if (cachedCasesList && cachedCasesList.length > 0) {
        const dailyIdx = getDailyCaseIndex(cachedCasesList.length);
        const dailyCase = cachedCasesList[dailyIdx];
        if (dailyCase && Number(dailyCase.caseId) === Number(cId)) {
            grant('daily_case');
        }
    }

    // 8. veteran
    const { xp } = getPlayerProgress();
    if (xp >= 1000) {
        grant('veteran');
    }

    if (newlyUnlocked.length > 0) {
        saveUnlockedAchievements(unlocked);
        let bonusXp = 0;
        newlyUnlocked.forEach(achId => {
            const ach = ACHIEVEMENTS_LIST.find(a => a.id === achId);
            if (ach) {
                bonusXp += ach.xp;
                setTimeout(() => {
                    playSfx('stamp');
                    showDetectiveToast(`🎖️ Commendation Unlocked: ${ach.title} (+${ach.xp} XP)!`);
                }, 800);
            }
        });
        if (bonusXp > 0) {
            let curXp = parseInt(localStorage.getItem('qc_player_xp') || '0', 10);
            localStorage.setItem('qc_player_xp', String(curXp + bonusXp));
            updatePlayerProfileUI();
        }
    }

    renderAchievements();
}

function renderAchievements() {
    const grid = document.getElementById('achievementsGrid');
    const countEl = document.getElementById('unlockedAchCount');
    const pill = document.getElementById('achievementsProgressPill');
    const unlocked = getUnlockedAchievements();

    if (countEl) countEl.textContent = String(unlocked.length);
    if (pill) pill.textContent = `${unlocked.length} / ${ACHIEVEMENTS_LIST.length} Unlocked`;

    if (!grid) return;
    grid.innerHTML = '';

    ACHIEVEMENTS_LIST.forEach(ach => {
        const isUnlocked = unlocked.includes(ach.id);
        const card = document.createElement('div');
        card.className = `achievement-card ${isUnlocked ? 'unlocked' : 'locked'}`;
        card.innerHTML = `
            <div class="achievement-badge">${ach.icon}</div>
            <div class="achievement-info">
                <div class="achievement-title">
                    <span>${esc(ach.title)}</span>
                    <span class="achievement-xp">+${ach.xp} XP</span>
                </div>
                <div class="achievement-desc">${esc(ach.desc)}</div>
                <div class="achievement-status ${isUnlocked ? 'status-unlocked' : 'status-locked'}">
                    ${isUnlocked ? '✓ UNLOCKED' : '🔒 LOCKED'}
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

function switchLeaderboardTab(tabId) {
    const tabs = ['tab-roster', 'tab-achievements', 'tab-guide'];
    tabs.forEach(t => {
        const el = document.getElementById(t);
        if (el) el.style.display = (t === tabId) ? 'block' : 'none';
    });
    const btns = [
        { id: 'tabBtnRoster', tab: 'tab-roster' },
        { id: 'tabBtnAchievements', tab: 'tab-achievements' },
        { id: 'tabBtnGuide', tab: 'tab-guide' }
    ];
    btns.forEach(b => {
        const btn = document.getElementById(b.id);
        if (btn) btn.classList.toggle('active', b.tab === tabId);
    });
    if (tabId === 'tab-achievements') {
        renderAchievements();
    }
}

window.switchLeaderboardTab = switchLeaderboardTab;
window.renderAchievements = renderAchievements;
window.evaluateAchievements = evaluateAchievements;


function renderLeaderboard() {
    const tbody = document.getElementById('leaderboardTbody');
    const dailyTitle = document.getElementById('dailyCaseTitle');
    const btnPlayDaily = document.getElementById('btnPlayDailyCase');

    if (cachedCasesList && cachedCasesList.length > 0) {
        const dailyIdx = getDailyCaseIndex(cachedCasesList.length);
        const dailyCase = cachedCasesList[dailyIdx];
        if (dailyTitle && dailyCase) {
            dailyTitle.textContent = `Case #${dailyIdx + 1}: ${dailyCase.title}`;
        }
        if (btnPlayDaily && dailyCase) {
            btnPlayDaily.onclick = () => {
                loadCaseContext(dailyCase.caseId);
                const win = document.getElementById('win-leaderboard');
                if (win) win.classList.add('hidden');
                showDetectiveToast(`📅 Daily Challenge Activated: ${dailyCase.title}!`);
            };
        }
    }

    if (!tbody) return;

    const { xp, solvedCases } = getPlayerProgress();
    let playerBest = 950;
    let playerRuns = [];
    try {
        playerRuns = JSON.parse(localStorage.getItem('qc_leaderboard_runs') || '[]');
        if (playerRuns.length > 0) {
            playerBest = Math.max(...playerRuns.map(r => r.score || 0));
        }
    } catch (e) {}

    const entries = [
        { rankNum: 1, name: "Capt. Raymond Vance", title: "⭐ MASTER", solved: 14, xp: 4850, bestScore: 990 },
        { rankNum: 2, name: "Detective Miller (You)", title: xp > 1000 ? "🎖️ SENIOR" : "🔍 DETECTIVE", solved: solvedCases.length, xp: xp, bestScore: playerBest },
        { rankNum: 3, name: "Officer Elena Ramirez", title: "🎖️ SENIOR", solved: 9, xp: 2600, bestScore: 920 },
        { rankNum: 4, name: "Sgt. David Chen", title: "🔍 INVESTIGATOR", solved: 6, xp: 1850, bestScore: 875 },
        { rankNum: 5, name: "Cadet Marcus Bell", title: "📋 PROBATIONARY", solved: 2, xp: 450, bestScore: 710 }
    ];

    entries.sort((a, b) => b.xp - a.xp);

    tbody.innerHTML = '';
    entries.forEach((e, idx) => {
        const tr = document.createElement('tr');
        const isUser = e.name.includes('(You)');
        if (isUser) tr.style.background = '#e0f2fe';
        tr.innerHTML = `
            <td style="font-weight:bold;text-align:center;">${idx + 1}</td>
            <td style="font-weight:${isUser ? 'bold' : 'normal'};">${esc(e.name)}</td>
            <td><span style="font-size:10px;padding:1px 4px;background:#fef3c7;border:1px solid #f59e0b;border-radius:2px;">${e.title}</span></td>
            <td style="text-align:center;">${e.solved}</td>
            <td style="font-weight:bold;color:#0284c7;">${e.xp}</td>
            <td style="font-weight:bold;color:#166534;">${e.bestScore}</td>
        `;
        tbody.appendChild(tr);
    });
}
