import React from 'react';
import {
  RefreshCw, SlidersHorizontal, X,
} from 'lucide-react';

/**
 * @param {{
 *   onRefresh: () => void;
 *   isLoading: boolean;
 *   activeFilterCount: number;
 *   onClearFilters: () => void;
 *   selectedCount: number;
 *   density: 'compact'|'normal'|'comfortable';
 *   onDensityChange: (d: 'compact'|'normal'|'comfortable') => void;
 * }} props
 */
export default function StudentGridToolbar({
  onRefresh, isLoading,
  activeFilterCount, onClearFilters,
  selectedCount,
  density, onDensityChange,
}) {
  return (
    <div className="sg-toolbar" role="toolbar" aria-label="Grid controls">
      {/* ── Left ── */}
      <div className="sg-toolbar-left">
        {/* Active filter badge */}
        {activeFilterCount > 0 && (
          <button
            className="sg-btn active"
            onClick={onClearFilters}
            title="Clear all column filters"
            aria-label={`${activeFilterCount} active filters — click to clear`}
          >
            <SlidersHorizontal size={13} />
            {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''}
            <X size={11} />
          </button>
        )}

        {/* Selection badge */}
        {selectedCount > 0 && (
          <span className="sg-selection-badge" role="status" aria-live="polite">
            {selectedCount} selected
          </span>
        )}
      </div>

      {/* ── Right ── */}
      <div className="sg-toolbar-right">
        {/* Density */}
        <div className="sg-density-group" role="group" aria-label="Row density">
          {(['compact', 'normal', 'comfortable']).map(d => (
            <button
              key={d}
              className={`sg-density-opt${density === d ? ' active' : ''}`}
              onClick={() => onDensityChange(d)}
              aria-pressed={density === d}
              title={`${d.charAt(0).toUpperCase() + d.slice(1)} density`}
            >
              {d === 'compact' ? '▤' : d === 'normal' ? '▥' : '▦'}
            </button>
          ))}
        </div>

        {/* Refresh */}
        <button
          className="sg-btn"
          onClick={onRefresh}
          disabled={isLoading}
          title="Refresh data"
          aria-label="Refresh student list"
        >
          <RefreshCw
            size={14}
            style={{
              animation: isLoading ? 'sg-spin 0.7s linear infinite' : 'none',
            }}
          />
        </button>
      </div>
    </div>
  );
}
