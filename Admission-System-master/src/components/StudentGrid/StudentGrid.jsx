/**
 * StudentGrid — Production-grade AG Grid component.
 *
 * Architecture:
 *  - themeQuartz (Community) as base, no Enterprise license needed
 *  - Pointer Events for horizontal grab-scroll on the body viewport only
 *    (does NOT interfere with AG Grid's native column drag/resize)
 *  - All column defs memoized, all callbacks stable
 *  - AI command panel executes typed GridAgentAction via AG Grid API only
 *  - localStorage prefs: column visibility, widths, order, sort, density
 *  - Dark-mode via MutationObserver on <html class="dark">
 */

import React, {
  useState, useEffect, useRef, useMemo, useCallback,
} from 'react';
import { AgGridReact } from 'ag-grid-react';
import {
  AllCommunityModule,
  ModuleRegistry,
  themeQuartz,
  colorSchemeDark,
} from 'ag-grid-community';

import './studentGrid.css';
import { DENSITY_ROW_HEIGHT } from './studentGrid.types.js';
import { buildColumnDefs } from './studentGrid.utils.jsx';
import { loadPrefs, savePrefs, applyPrefsToGrid } from './studentGrid.prefs.js';
import StudentGridToolbar   from './StudentGridToolbar.jsx';
import StudentGridEmptyState from './StudentGridEmptyState.jsx';

ModuleRegistry.registerModules([AllCommunityModule]);

// ── Themes ────────────────────────────────────────────────────────────────────
const LIGHT_THEME = themeQuartz.withParams({
  accentColor:               '#3b82f6',
  headerBackgroundColor:     '#f8fafc',
  headerTextColor:           '#475569',
  headerFontWeight:          600,
  headerFontSize:            12,
  rowHoverColor:             '#f1f5f9',
  selectedRowBackgroundColor:'#eff6ff',
  borderColor:               '#e2e8f0',
  rowBorder:                 { color: '#f1f5f9', width: 1 },
  fontFamily:                "Inter, 'Segoe UI', system-ui, sans-serif",
  fontSize:                  13,
  checkboxBorderRadius:      4,
  checkboxIndeterminateBackgroundColor: '#3b82f6',
  wrapperBorderRadius:       0,
  cellHorizontalPaddingScale: 0.8,
});

const DARK_THEME = LIGHT_THEME.withPart(colorSchemeDark).withParams({
  accentColor:               '#60a5fa',
  headerBackgroundColor:     '#1e293b',
  headerTextColor:           '#94a3b8',
  rowHoverColor:             '#1e293b',
  selectedRowBackgroundColor:'#1e3a5f',
  borderColor:               '#334155',
  rowBorder:                 { color: '#1e293b', width: 1 },
  backgroundColor:           '#0f172a',
  foregroundColor:           '#f1f5f9',
});

// ── Debounce hook ─────────────────────────────────────────────────────────────
function useDebounce(value, ms) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

// ── Main component ─────────────────────────────────────────────────────────────
/**
 * @param {{
 *   students?: import('./studentGrid.types.js').StudentRow[];
 *   isLoading?: boolean;
 *   error?: string | null;
 *   onRefresh?: () => void;
 *   getExamTotal?: (s: any) => number;
 *   getExamMaximum?: (s: any) => number;
 *   handleViewStudentDetails?: (s: any) => void;
 *   canEditStatus?: boolean;
 * }} props
 */
export default function StudentGrid({
  students = [],
  isLoading = false,
  error = null,
  onRefresh,
  getExamTotal,
  getExamMaximum,
  handleViewStudentDetails,
  onGiveScore,
  canEditStatus = false,
}) {
  // ── Theme ─────────────────────────────────────────────────────────────────
  const [theme, setTheme] = useState(LIGHT_THEME);
  useEffect(() => {
    const apply = () =>
      setTheme(document.documentElement.classList.contains('dark') ? DARK_THEME : LIGHT_THEME);
    apply();
    const obs = new MutationObserver(apply);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  // ── Preferences ──────────────────────────────────────────────────────────
  const prefs = useMemo(() => loadPrefs(), []);
  const [density, setDensity] = useState(
    /** @type {'compact'|'normal'|'comfortable'} */ (prefs.density ?? 'normal')
  );
  const rowHeight = DENSITY_ROW_HEIGHT[density];

  // ── Grid state ───────────────────────────────────────────────────────────
  const gridRef     = useRef(null);
  const [gridApi, setGridApi] = useState(/** @type {import('ag-grid-community').GridApi|null} */(null));
  const [search,    setSearch]    = useState('');
  const [selectedCount, setSelectedCount] = useState(0);
  const [activeFilterCount, setActiveFilterCount] = useState(0);

  /** @type {[{ colId: string; label: string; hidden: boolean }[], Function]} */
  const [managedCols, setManagedCols] = useState([]);

  const debouncedSearch = useDebounce(search, 250);

  // ── Pointer-event grab-scroll ─────────────────────────────────────────────
  const wrapRef   = useRef(null);
  const dragState = useRef(/** @type {{ startX: number; scrollLeft: number; pointerId: number } | null} */(null));
  const [isGrabbing, setIsGrabbing] = useState(false);

  const getScrollViewport = useCallback(() => {
    const el = wrapRef.current;
    if (!el) return null;
    return el.querySelector('.ag-center-cols-viewport') || el.querySelector('.ag-body-viewport');
  }, []);

  const onPointerDown = useCallback((e) => {
    if (e.button !== 0) return;
    // Don't initiate drag-scroll if clicking action buttons, checkboxes, links, or column headers
    if (e.target.closest('button, a, input, .ag-selection-checkbox, .ag-checkbox-input, .ag-header-cell-resize, .ag-drag-handle, [role="columnheader"]')) return;

    const vp = getScrollViewport();
    if (!vp) return;

    try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
    dragState.current = { startX: e.clientX, scrollLeft: vp.scrollLeft, pointerId: e.pointerId };
    setIsGrabbing(true);
  }, [getScrollViewport]);

  const onPointerMove = useCallback((e) => {
    if (!dragState.current) return;
    const vp = getScrollViewport();
    if (!vp) return;
    const dx = (e.clientX - dragState.current.startX) * 1.2;
    vp.scrollLeft = dragState.current.scrollLeft - dx;
  }, [getScrollViewport]);

  const releasePointer = useCallback((e) => {
    if (dragState.current) {
      try {
        if (e.currentTarget.hasPointerCapture(dragState.current.pointerId)) {
          e.currentTarget.releasePointerCapture(dragState.current.pointerId);
        }
      } catch {}
    }
    dragState.current = null;
    setIsGrabbing(false);
  }, []);

  const onPointerUp = releasePointer;
  const onPointerCancel = releasePointer;

  // ── Column defs ───────────────────────────────────────────────────────────
  const columnDefs = useMemo(
    () => buildColumnDefs({ getExamTotal, getExamMaximum, showInterviewScoreAction: !!onGiveScore, canEditStatus }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [!!onGiveScore, canEditStatus]
  );

  const defaultColDef = useMemo(() => ({
    resizable: true,
    sortable:  true,
    filter:    true,
    minWidth:  60,
    suppressMovable: false,
  }), []);

  // ── Global quick-filter (debounced) ──────────────────────────────────────
  useEffect(() => {
    if (!gridApi) return;
    gridApi.setGridOption('quickFilterText', debouncedSearch);
  }, [debouncedSearch, gridApi]);

  // ── On grid ready ────────────────────────────────────────────────────────
  const onGridReady = useCallback((params) => {
    setGridApi(params.api);
    applyPrefsToGrid(params.api, prefs);

    // Sync managed columns list for the column manager popover
    const cols = params.api.getColumns() ?? [];
    setManagedCols(
      cols
        .filter(c => c.getColId() !== '__check__')
        .map(c => ({
          colId:  c.getColId(),
          label:  c.getColDef().headerName ?? c.getColId(),
          hidden: !c.isVisible(),
        }))
    );
  }, [prefs]);

  // ── Selection change ─────────────────────────────────────────────────────
  const onSelectionChanged = useCallback((e) => {
    setSelectedCount(e.api.getSelectedRows().length);
  }, []);

  // ── Filter change → update badge + persist ────────────────────────────────
  const onFilterChanged = useCallback((e) => {
    const model = e.api.getFilterModel();
    setActiveFilterCount(Object.keys(model).length);
  }, []);

  // ── Column state change → persist prefs ──────────────────────────────────
  const onColumnStateChanged = useCallback((e) => {
    if (!e.api) return;
    const cols  = e.api.getColumns() ?? [];
    const order = cols.map(c => c.getColId());
    const widths  = {};
    const hidden  = [];
    cols.forEach(c => {
      widths[c.getColId()] = c.getActualWidth();
      if (!c.isVisible()) hidden.push(c.getColId());
    });
    savePrefs({ columnOrder: order, columnWidths: widths, hiddenColumns: hidden });

    // Sync managed cols
    setManagedCols(
      cols
        .filter(c => c.getColId() !== '__check__')
        .map(c => ({
          colId: c.getColId(),
          label: c.getColDef().headerName ?? c.getColId(),
          hidden: !c.isVisible(),
        }))
    );
  }, []);

  // ── Sort change → persist ────────────────────────────────────────────────
  const onSortChanged = useCallback((e) => {
    const sortState = (e.api.getColumns() ?? [])
      .filter(c => c.getSort())
      .map(c => ({ colId: c.getColId(), sort: c.getSort() }));
    savePrefs({ sortState });
  }, []);

  // ── Density change ───────────────────────────────────────────────────────
  const handleDensityChange = useCallback((d) => {
    setDensity(d);
    savePrefs({ density: d });
  }, []);

  // ── Clear filters ────────────────────────────────────────────────────────
  const handleClearFilters = useCallback(() => {
    if (!gridApi) return;
    gridApi.setFilterModel(null);
    setSearch('');
  }, [gridApi]);

  // ── Toggle column visibility ─────────────────────────────────────────────
  const handleToggleCol = useCallback((colId) => {
    if (!gridApi) return;
    const col = gridApi.getColumn(colId);
    if (!col) return;
    gridApi.setColumnVisible(colId, !col.isVisible());
  }, [gridApi]);

  // ── Reset columns ────────────────────────────────────────────────────────
  const handleResetCols = useCallback(() => {
    if (!gridApi) return;
    gridApi.resetColumnState();
  }, [gridApi]);

  // ── Row double-click → view details ──────────────────────────────────────
  const onRowDoubleClicked = useCallback((e) => {
    if (handleViewStudentDetails && e.data) {
      handleViewStudentDetails(e.data);
    }
  }, [handleViewStudentDetails]);

  // ── Determine empty state variant ─────────────────────────────────────────
  const emptyVariant = (() => {
    if (isLoading)       return 'loading';
    if (error)           return 'error';
    if (!students.length) return 'empty';
    if (debouncedSearch) return 'no-results';
    if (activeFilterCount > 0) return 'no-filter-results';
    return null;
  })();

  // Whether to show overlay — only when we actually have NO rows to display
  // (AG Grid handles its own row rendering, overlay is for zero-state)
  const showOverlay = emptyVariant !== null && students.length === 0;

  return (
    <div data-sg style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Toolbar */}
      <StudentGridToolbar
        search={search}
        onSearch={setSearch}
        onRefresh={onRefresh ?? (() => {})}
        isLoading={isLoading}
        activeFilterCount={activeFilterCount}
        onClearFilters={handleClearFilters}
        selectedCount={selectedCount}
        density={density}
        onDensityChange={handleDensityChange}
        managedCols={managedCols}
        onToggleCol={handleToggleCol}
        onResetCols={handleResetCols}
        gridApi={gridApi}
        rowData={students}
      />

      {/* Grid wrapper with pointer-event grab-scroll */}
      <div
        ref={wrapRef}
        className={`sg-grid-wrap${isGrabbing ? ' is-grabbing' : ''}`}
        style={{
          height: 540,
          cursor: isGrabbing ? 'grabbing' : 'default',
          // Prevent text selection during drag
          userSelect: isGrabbing ? 'none' : 'auto',
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
      >
        {showOverlay ? (
          // Full-height empty/loading/error state
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--sg-bg)' }}>
            <StudentGridEmptyState
              variant={emptyVariant}
              error={error}
              onRetry={onRefresh}
              onClearSearch={() => setSearch('')}
              onClearFilters={handleClearFilters}
            />
          </div>
        ) : (
          <AgGridReact
            ref={gridRef}
            theme={theme}
            rowData={students}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            rowHeight={rowHeight}
            headerHeight={40}
            // Selection — only via checkbox tick column, NOT by clicking row body
            rowSelection="multiple"
            suppressRowClickSelection={true}
            // Context — passes callbacks into cell renderers
            context={{ onGiveScore, onRefresh }}
            // Callbacks
            onGridReady={onGridReady}
            onSelectionChanged={onSelectionChanged}
            onFilterChanged={onFilterChanged}
            onColumnMoved={onColumnStateChanged}
            onColumnResized={onColumnStateChanged}
            onColumnVisible={onColumnStateChanged}
            onSortChanged={onSortChanged}
            onRowDoubleClicked={onRowDoubleClicked}
            // UX
            animateRows
            enableCellTextSelection={false}
            suppressCellFocus={false}
            suppressScrollOnNewData
            getRowId={(p) => String(p.data?.id ?? p.data?.nationalId)}
            // Loading overlay
            loading={isLoading && students.length === 0}
          />
        )}
      </div>
    </div>
  );
}
