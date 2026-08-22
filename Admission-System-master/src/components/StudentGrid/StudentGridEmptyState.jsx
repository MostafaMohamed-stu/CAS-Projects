import React from 'react';
import { AlertCircle, Database, SearchX, FilterX, RefreshCw } from 'lucide-react';

/**
 * @param {{
 *   variant: 'loading'|'empty'|'error'|'no-results'|'no-filter-results';
 *   error?: string;
 *   onRetry?: () => void;
 *   onClearSearch?: () => void;
 *   onClearFilters?: () => void;
 * }} props
 */
export default function StudentGridEmptyState({
  variant,
  error,
  onRetry,
  onClearSearch,
  onClearFilters,
}) {
  if (variant === 'loading') {
    return (
      <div className="sg-state">
        <div className="sg-spinner" role="status" aria-label="Loading students" />
        <p>Loading students…</p>
      </div>
    );
  }

  if (variant === 'error') {
    return (
      <div className="sg-state">
        <AlertCircle className="sg-state-icon" style={{ color: '#ef4444', opacity: 1 }} />
        <h3>Something went wrong</h3>
        <p>{error || 'Failed to load student data. Check your connection and try again.'}</p>
        <div className="sg-state-actions">
          {onRetry && (
            <button className="sg-btn active" onClick={onRetry} style={{ color: '#fff', background: '#ef4444', border: 'none' }}>
              <RefreshCw size={13} /> Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  if (variant === 'no-results') {
    return (
      <div className="sg-state">
        <SearchX className="sg-state-icon" />
        <h3>No search results</h3>
        <p>No students matched your search. Try a different name or national ID.</p>
        <div className="sg-state-actions">
          {onClearSearch && (
            <button className="sg-btn" onClick={onClearSearch}>Clear search</button>
          )}
        </div>
      </div>
    );
  }

  if (variant === 'no-filter-results') {
    return (
      <div className="sg-state">
        <FilterX className="sg-state-icon" />
        <h3>No matching students</h3>
        <p>Your active filters returned no results. Try adjusting or clearing them.</p>
        <div className="sg-state-actions">
          {onClearFilters && (
            <button className="sg-btn" onClick={onClearFilters}>Clear all filters</button>
          )}
        </div>
      </div>
    );
  }

  // empty
  return (
    <div className="sg-state">
      <Database className="sg-state-icon" />
      <h3>No students yet</h3>
      <p>No student records have been registered. Students will appear here once added.</p>
    </div>
  );
}
