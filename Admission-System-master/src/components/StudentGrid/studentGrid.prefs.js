/**
 * @fileoverview LocalStorage persistence abstraction for grid user preferences.
 * Swap `loadPrefs` / `savePrefs` implementations to use a backend API later.
 */

const PREFS_KEY = 'sg_prefs_v1';

/**
 * Load persisted grid preferences from storage.
 * Returns an empty object if nothing is stored or storage is unavailable.
 * @returns {import('./studentGrid.types.js').GridPrefs}
 */
export function loadPrefs() {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/**
 * Merge and persist new preferences. Deep-merges with existing prefs so
 * callers can update individual keys without losing others.
 * @param {Partial<import('./studentGrid.types.js').GridPrefs>} patch
 */
export function savePrefs(patch) {
  try {
    const current = loadPrefs();
    localStorage.setItem(PREFS_KEY, JSON.stringify({ ...current, ...patch }));
  } catch {
    // Storage full or unavailable — silently ignore.
  }
}

/**
 * Wipe all persisted preferences (used by "Reset columns").
 */
export function clearPrefs() {
  try {
    localStorage.removeItem(PREFS_KEY);
  } catch {
    // ignore
  }
}

/**
 * Apply persisted column state to an AG Grid API instance.
 * Called once after the grid is ready.
 * @param {import('ag-grid-community').GridApi} api
 * @param {import('./studentGrid.types.js').GridPrefs} prefs
 */
export function applyPrefsToGrid(api, prefs) {
  try {
    if (prefs.sortState?.length) {
      api.applyColumnState({ state: prefs.sortState, defaultState: { sort: null } });
    }
    if (prefs.columnOrder?.length || prefs.columnWidths || prefs.hiddenColumns?.length) {
      const state = api.getColumns()?.map((col) => {
        const id = col.getColId();
        /** @type {import('ag-grid-community').ColumnState} */
        const s = { colId: id };
        if (prefs.hiddenColumns?.includes(id)) s.hide = true;
        if (prefs.columnWidths?.[id]) s.width = prefs.columnWidths[id];
        if (prefs.columnOrder?.length) s.pinned = null; // reset pins
        return s;
      }) ?? [];

      if (prefs.columnOrder?.length) {
        api.applyColumnState({
          state: prefs.columnOrder.map((id) => ({ colId: id })),
          applyOrder: true,
        });
      }
      if (state.length) api.applyColumnState({ state });
    }
  } catch (err) {
    console.warn('[StudentGrid] Failed to apply saved prefs:', err);
  }
}
