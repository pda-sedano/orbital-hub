/*
 * State shared by every orbit level and the mini orbits:
 *
 *   clock    one orbital clock for the whole site, so a group's mini orbit and
 *            its expanded view always show the same configuration. It only
 *            advances while an orrery is on screen and nothing is held. Saved
 *            when the page is hidden or closed, so a reload resumes where you left off.
 *   offsets  how far each body has been dragged from its natural position, keyed
 *            by its path in the tree ("test-system/gamma/gamma-ii"). Saved in this
 *            browser's localStorage, so positions survive navigation and reloads.
 */

const STORAGE_KEY = 'orbital-hub:orbit-offsets';
const CLOCK_KEY = 'orbital-hub:orbit-clock';
const TAU = 2 * Math.PI;

const loadClock = () => {
    try {
        const t = parseFloat(window.localStorage.getItem(CLOCK_KEY));
        return Number.isFinite(t) ? t : 0;
    } catch {
        return 0;
    }
};

export const clock = { t: typeof window === 'undefined' ? 0 : loadClock() };

const saveClock = () => {
    try {
        window.localStorage.setItem(CLOCK_KEY, String(clock.t));
    } catch {
        /* storage unavailable */
    }
};

if (typeof window !== 'undefined') {
    window.addEventListener('pagehide', saveClock);
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) saveClock();
    });
}

const load = () => {
    try {
        const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}');
        return saved && typeof saved === 'object' ? saved : {};
    } catch {
        return {}; // storage blocked (private mode, etc.): positions just won't persist
    }
};

let offsets = typeof window === 'undefined' ? {} : load();

export const bodyPath = (ids) => ids.join('/');

export const getOffset = (path) => offsets[path] ?? 0;

// Keep offsets in [-π, π) so they don't grow without bound.
const wrap = (angle) => ((((angle + Math.PI) % TAU) + TAU) % TAU) - Math.PI;

export const setOffset = (path, angle) => {
    offsets[path] = wrap(angle);
};

export const saveOffsets = () => {
    saveClock(); // offsets are relative to the clock, so keep the two in step
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(offsets));
    } catch {
        /* storage unavailable: keep them for this visit only */
    }
};

// Forget every dragged position.
export const resetOffsets = () => {
    offsets = {};
    saveOffsets();
};

// Forget everything: positions and the clock.
export const resetOrbits = () => {
    clock.t = 0;
    resetOffsets();
};

// For tests
export const _reloadFromStorage = () => {
    offsets = load();
    clock.t = loadClock();
};
