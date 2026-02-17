/**
 * bo-shell.js — Vertex Backoffice
 * Shared utilities: auth guard, topbar, clock, storage helpers, toast
 * Include this script in every module page BEFORE module-specific code.
 */

/* ── AUTH GUARD ─────────────────────────────────────────────────────────── */
(function() {
    if (sessionStorage.getItem('vtx_bo_auth') !== '1') {
        window.location.replace('backoffice.html');
    }
})();

/* ── STORAGE HELPERS ────────────────────────────────────────────────────── */
const BO = {
    /**
     * Read a key from window.storage (artifact env) or localStorage.
     * Returns parsed value or `fallback`.
     */
    async read(key, fallback = null) {
        try {
            if (window.storage) {
                const res = await window.storage.get(key);
                return res ? JSON.parse(res.value) : fallback;
            }
        } catch {}
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : fallback;
        } catch {}
        return fallback;
    },

    /**
     * Write a value to window.storage and localStorage (dual write for compatibility).
     */
    async write(key, value) {
        const json = JSON.stringify(value);
        try {
            if (window.storage) await window.storage.set(key, json);
        } catch {}
        try { localStorage.setItem(key, json); } catch {}
    },

    /* Storage keys */
    KEYS: {
        interventions: 'vtx_interventions',
        clients:       'vtx_clients',
        stocks:        'vtx_stocks',
    },

    /* ── TOAST ── */
    toast(msg, type = 'info') {
        document.querySelectorAll('.bo-toast').forEach(t => t.remove());
        const colors = { success:'#10b981', error:'#ef4444', info:'#3b82f6', warn:'#f59e0b' };
        const icons  = { success:'check-circle', error:'alert-circle', info:'info', warn:'alert-triangle' };
        const el = document.createElement('div');
        el.className = 'bo-toast';
        el.style.cssText = `
            position:fixed; top:1.5rem; left:50%; transform:translateX(-50%) translateY(-80px);
            background:rgba(15,23,42,0.97); border:1px solid rgba(255,255,255,0.1);
            border-left:3px solid ${colors[type]||colors.info};
            border-radius:0.875rem; padding:0.875rem 1.25rem;
            display:flex; align-items:center; gap:0.75rem;
            box-shadow:0 12px 40px rgba(0,0,0,0.6); z-index:9999;
            backdrop-filter:blur(20px); transition:all 0.3s cubic-bezier(0.4,0,0.2,1);
            font-family:'Outfit',sans-serif; font-size:0.8rem; font-weight:600; color:white;
            min-width:220px; max-width:400px; white-space:nowrap;
        `;
        el.innerHTML = `<i data-lucide="${icons[type]||'info'}" style="width:16px;height:16px;color:${colors[type]};flex-shrink:0;"></i><span>${msg}</span>`;
        document.body.appendChild(el);
        lucide.createIcons();
        requestAnimationFrame(() => requestAnimationFrame(() => {
            el.style.transform = 'translateX(-50%) translateY(0)';
        }));
        setTimeout(() => {
            el.style.transform = 'translateX(-50%) translateY(-80px)';
            el.style.opacity = '0';
            setTimeout(() => el.remove(), 350);
        }, 3000);
    },

    /* ── CLOCK ── */
    startClock(elId = 'bo-clock') {
        const el = document.getElementById(elId);
        if (!el) return;
        const tick = () => el.textContent = new Date().toLocaleTimeString('fr-FR');
        tick();
        setInterval(tick, 1000);
    },

    /* ── UTILS ── */
    uid: () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2,6)}`,
    today: () => new Date().toISOString().slice(0, 10),
    fmt: (date) => date ? new Date(date).toLocaleDateString('fr-FR') : '—',
};

/* ── TOPBAR INJECTION ───────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
    // Inject shared CSS
    const style = document.createElement('style');
    style.textContent = `
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;900&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
            --gold: #FFD700; --gold-dim: #B8860B;
            --bg: #020617; --card: rgba(15,23,42,0.6);
            --border: rgba(255,255,255,0.06); --muted: #64748b;
        }
        html { scroll-behavior: smooth; }
        body {
            background: var(--bg); color: white;
            font-family: 'Outfit', sans-serif;
            -webkit-font-smoothing: antialiased;
            padding-top: 64px; /* topbar height */
        }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 99px; }
        select option { background: #0f172a; }
        input[type=number]::-webkit-inner-spin-button { opacity: 1; }

        /* ── TOPBAR ── */
        .bo-topbar {
            position: fixed; top: 0; left: 0; right: 0; height: 64px; z-index: 50;
            background: rgba(2,6,23,0.9); backdrop-filter: blur(20px);
            border-bottom: 1px solid var(--border);
            display: flex; align-items: center; justify-content: space-between;
            padding: 0 2rem; gap: 1rem;
        }
        .bo-topbar-left { display: flex; align-items: center; gap: 1rem; }
        .bo-topbar-logo {
            width: 32px; height: 32px; border-radius: 50%;
            border: 1.5px solid rgba(255,215,0,0.25);
            background: rgba(255,215,0,0.06);
            display: flex; align-items: center; justify-content: center;
        }
        .bo-topbar-name {
            font-size: 0.75rem; font-weight: 900; font-style: italic;
            text-transform: uppercase; letter-spacing: -0.02em;
        }
        .bo-topbar-name span { color: var(--gold); }
        .bo-topbar-divider {
            width: 1px; height: 20px;
            background: var(--border);
        }
        .bo-module-title {
            font-size: 0.65rem; font-weight: 800; text-transform: uppercase;
            letter-spacing: 0.15em; color: var(--muted);
        }
        .bo-topbar-right { display: flex; align-items: center; gap: 1rem; }
        #bo-clock {
            font-size: 0.65rem; color: var(--muted);
            font-weight: 600; font-variant-numeric: tabular-nums;
        }
        .bo-btn-back, .bo-btn-logout {
            display: flex; align-items: center; gap: 0.4rem;
            background: rgba(255,255,255,0.04); border: 1px solid var(--border);
            border-radius: 0.5rem; padding: 0.375rem 0.875rem;
            font-size: 0.6rem; font-weight: 800; text-transform: uppercase;
            letter-spacing: 0.1em; color: var(--muted); cursor: pointer;
            font-family: 'Outfit', sans-serif; text-decoration: none;
            transition: all 0.2s;
        }
        .bo-btn-back:hover { border-color: rgba(255,215,0,0.3); color: var(--gold); }
        .bo-btn-logout:hover { border-color: rgba(239,68,68,0.3); color: #f87171; }

        /* ── PAGE ── */
        .bo-page {
            max-width: 1280px; margin: 0 auto;
            padding: 2rem 2rem 4rem;
        }
        .bo-page-header {
            display: flex; justify-content: space-between; align-items: flex-end;
            flex-wrap: wrap; gap: 1rem; margin-bottom: 2rem;
        }
        .bo-eyebrow {
            font-size: 0.55rem; font-weight: 800; letter-spacing: 0.3em;
            text-transform: uppercase; color: var(--gold); margin-bottom: 0.35rem;
        }
        .bo-page-title {
            font-size: 2rem; font-weight: 900; font-style: italic;
            text-transform: uppercase; letter-spacing: -0.04em; line-height: 1;
        }

        /* ── CARDS ── */
        .bo-card {
            background: var(--card); border: 1px solid var(--border);
            border-radius: 1.25rem; backdrop-filter: blur(20px);
        }
        .bo-card-p { padding: 1.5rem; }

        /* ── STAT CARD ── */
        .bo-stat {
            background: var(--card); border: 1px solid var(--border);
            border-radius: 1.25rem; padding: 1.25rem 1.5rem;
        }
        .bo-stat-label {
            font-size: 0.55rem; font-weight: 800; text-transform: uppercase;
            letter-spacing: 0.2em; color: var(--muted); margin-bottom: 0.4rem;
        }
        .bo-stat-value {
            font-size: 1.75rem; font-weight: 900; font-style: italic; color: var(--gold);
        }
        .bo-stat-sub { font-size: 0.6rem; color: #334155; margin-top: 0.15rem; }

        /* ── TABLE ROWS ── */
        .bo-row {
            display: flex; align-items: center; gap: 1rem;
            padding: 0.875rem 1.5rem; cursor: pointer;
            transition: background 0.15s;
        }
        .bo-row:hover { background: rgba(255,255,255,0.02); }
        .bo-row + .bo-row { border-top: 1px solid var(--border); }

        /* ── BUTTONS ── */
        .bo-btn-gold {
            background: linear-gradient(135deg, var(--gold), var(--gold-dim));
            color: black; border: none; border-radius: 0.625rem;
            padding: 0.65rem 1.25rem; font-size: 0.65rem; font-weight: 900;
            text-transform: uppercase; letter-spacing: 0.1em;
            cursor: pointer; font-family: 'Outfit', sans-serif;
            display: inline-flex; align-items: center; gap: 0.4rem;
            transition: transform 0.15s, box-shadow 0.15s; white-space: nowrap;
        }
        .bo-btn-gold:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(255,215,0,0.25); }
        .bo-btn-ghost {
            background: rgba(255,255,255,0.05); border: 1px solid var(--border);
            color: var(--muted); border-radius: 0.625rem;
            padding: 0.65rem 1.25rem; font-size: 0.65rem; font-weight: 800;
            text-transform: uppercase; letter-spacing: 0.1em;
            cursor: pointer; font-family: 'Outfit', sans-serif;
            display: inline-flex; align-items: center; gap: 0.4rem;
            transition: all 0.2s;
        }
        .bo-btn-ghost:hover { border-color: rgba(255,255,255,0.15); color: white; }
        .bo-btn-icon {
            background: rgba(255,255,255,0.04); border: 1px solid var(--border);
            border-radius: 0.5rem; padding: 0.4rem; cursor: pointer;
            display: inline-flex; align-items: center; justify-content: center;
            transition: all 0.2s;
        }
        .bo-btn-icon:hover { background: rgba(255,255,255,0.08); }
        .bo-btn-danger {
            background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2);
            border-radius: 0.5rem; padding: 0.4rem; cursor: pointer;
            display: inline-flex; align-items: center; justify-content: center;
            transition: all 0.2s;
        }
        .bo-btn-danger:hover { background: rgba(239,68,68,0.15); }

        /* ── BADGE ── */
        .bo-badge {
            font-size: 0.55rem; font-weight: 800; text-transform: uppercase;
            letter-spacing: 0.08em; padding: 3px 9px; border-radius: 4px;
            white-space: nowrap;
        }

        /* ── SEARCH ── */
        .bo-search-wrap { position: relative; }
        .bo-search-wrap .bo-search-icon {
            position: absolute; left: 0.875rem; top: 50%; transform: translateY(-50%);
            pointer-events: none; color: var(--muted);
        }
        .bo-search {
            background: var(--card); border: 1px solid var(--border); border-radius: 0.75rem;
            padding: 0.65rem 0.875rem 0.65rem 2.5rem; font-size: 0.875rem;
            color: white; font-family: 'Outfit', sans-serif; outline: none; width: 100%;
            transition: border-color 0.2s;
        }
        .bo-search:focus { border-color: rgba(255,215,0,0.35); }
        .bo-search::placeholder { color: var(--muted); }

        /* ── FILTER PILLS ── */
        .bo-pill {
            padding: 0.4rem 1rem; border-radius: 99px; font-size: 0.6rem;
            font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em;
            border: 1px solid var(--border); background: transparent;
            color: var(--muted); cursor: pointer; font-family: 'Outfit', sans-serif;
            transition: all 0.2s;
        }
        .bo-pill:hover { border-color: rgba(255,215,0,0.25); color: white; }
        .bo-pill.active {
            background: rgba(255,215,0,0.12); border-color: rgba(255,215,0,0.4);
            color: var(--gold);
        }

        /* ── FIELD ── */
        .bo-field { margin-bottom: 1rem; }
        .bo-label {
            font-size: 0.6rem; font-weight: 800; text-transform: uppercase;
            letter-spacing: 0.15em; color: var(--muted); display: block;
            margin-bottom: 0.4rem;
        }
        .bo-label .req { color: var(--gold); }
        .bo-input, .bo-select, .bo-textarea {
            width: 100%; background: rgba(255,255,255,0.04);
            border: 1px solid var(--border); border-radius: 0.75rem;
            padding: 0.7rem 0.875rem; font-size: 0.875rem;
            color: white; font-family: 'Outfit', sans-serif; outline: none;
            transition: border-color 0.2s;
        }
        .bo-input:focus, .bo-select:focus, .bo-textarea:focus {
            border-color: rgba(255,215,0,0.35);
        }
        .bo-select { background-color: rgba(10,18,40,0.9); cursor: pointer; }
        .bo-textarea { resize: vertical; min-height: 80px; }

        /* ── MODAL ── */
        .bo-modal-overlay {
            position: fixed; inset: 0; background: rgba(0,0,0,0.75);
            backdrop-filter: blur(8px); z-index: 9998;
            display: flex; align-items: center; justify-content: center; padding: 1rem;
        }
        .bo-modal {
            background: rgba(12,18,36,0.98); border: 1px solid var(--border);
            border-radius: 1.5rem; padding: 2rem; width: 100%;
            max-height: 90vh; overflow-y: auto;
            box-shadow: 0 30px 80px rgba(0,0,0,0.8);
        }
        .bo-modal-header {
            display: flex; justify-content: space-between;
            align-items: center; margin-bottom: 1.5rem;
        }
        .bo-modal-title {
            font-size: 1.1rem; font-weight: 900; font-style: italic;
            text-transform: uppercase; color: var(--gold);
        }
        .bo-modal-close {
            width: 30px; height: 30px; border-radius: 50%;
            background: rgba(255,255,255,0.06); border: 1px solid var(--border);
            cursor: pointer; display: flex; align-items: center; justify-content: center;
        }
        .bo-modal-footer {
            display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem;
            padding-top: 1.25rem; border-top: 1px solid var(--border);
        }

        /* ── EMPTY STATE ── */
        .bo-empty {
            text-align: center; padding: 3rem 2rem; color: var(--muted);
        }
        .bo-empty-title {
            font-size: 1.1rem; font-weight: 700; margin-bottom: 0.4rem; color: #334155;
        }
        .bo-empty-desc { font-size: 0.75rem; }

        /* ── PROGRESS BAR ── */
        .bo-progress-track {
            height: 4px; background: rgba(255,255,255,0.05);
            border-radius: 99px; overflow: hidden;
        }
        .bo-progress-bar {
            height: 100%; border-radius: 99px;
            transition: width 0.4s ease;
        }

        /* ── ALERT BANNER ── */
        .bo-alert-banner {
            border-radius: 0.875rem; padding: 0.875rem 1.25rem;
            display: flex; align-items: center; gap: 0.875rem; margin-bottom: 1.5rem;
        }

        /* ── TAG CHIP ── */
        .bo-chip {
            display: inline-flex; align-items: center; gap: 0.3rem;
            background: rgba(255,255,255,0.05); border: 1px solid var(--border);
            border-radius: 99px; padding: 3px 10px;
            font-size: 0.65rem; font-weight: 700;
        }
        .bo-chip-btn {
            background: none; border: none; cursor: pointer;
            display: flex; align-items: center; color: var(--muted);
            padding: 0;
        }

        /* ── AVATAR ── */
        .bo-avatar {
            border-radius: 50%; display: flex; align-items: center;
            justify-content: center; font-weight: 900; font-style: italic;
            flex-shrink: 0;
        }

        /* ── RESPONSIVE ── */
        @media (max-width: 768px) {
            .bo-page { padding: 1.25rem 1rem 3rem; }
            .bo-topbar { padding: 0 1rem; }
            #bo-clock { display: none; }
        }

        /* ── ANIMATIONS ── */
        @keyframes bo-fade-up {
            from { opacity: 0; transform: translateY(16px); }
            to   { opacity: 1; transform: translateY(0); }
        }
        .bo-animate { animation: bo-fade-up 0.4s ease both; }
        @keyframes bo-spin { to { transform: rotate(360deg); } }
        .bo-spinner {
            width: 28px; height: 28px;
            border: 2px solid rgba(255,215,0,0.2);
            border-top-color: var(--gold);
            border-radius: 50%; animation: bo-spin 0.7s linear infinite;
        }
    `;
    document.head.appendChild(style);

    // Inject topbar HTML
    const moduleTitle = document.querySelector('[data-module-title]')?.dataset.moduleTitle || '';
    const topbar = document.createElement('div');
    topbar.className = 'bo-topbar';
    topbar.innerHTML = `
        <div class="bo-topbar-left">
            <div class="bo-topbar-logo">
                <i data-lucide="monitor-dot" style="width:14px;height:14px;color:#FFD700;"></i>
            </div>
            <span class="bo-topbar-name">Back<span>Office</span></span>
            <div class="bo-topbar-divider"></div>
            <span class="bo-module-title">${moduleTitle}</span>
        </div>
        <div class="bo-topbar-right">
            <span id="bo-clock"></span>
            <a href="backoffice.html" class="bo-btn-back">
                <i data-lucide="layout-grid" style="width:12px;height:12px;"></i>
                Accueil
            </a>
            <button class="bo-btn-logout" onclick="BO._logout()">
                <i data-lucide="log-out" style="width:12px;height:12px;"></i>
                Déco.
            </button>
        </div>
    `;
    document.body.insertBefore(topbar, document.body.firstChild);
    lucide.createIcons();
    BO.startClock();
});

BO._logout = function() {
    sessionStorage.removeItem('vtx_bo_auth');
    window.location.replace('backoffice.html');
};
