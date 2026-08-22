import React, { useState, useCallback } from 'react';
import { Sparkles } from 'lucide-react';
import { STATUS_MAP } from './studentGrid.types.js';

/**
 * Quick-command chips shown beneath the input.
 * @type {{ label: string; command: string }[]}
 */
const EXAMPLE_CHIPS = [
  { label: 'Show pending',    command: 'show pending' },
  { label: 'Show accepted',   command: 'show accepted' },
  { label: 'Show rejected',   command: 'show rejected' },
  { label: 'Sort by name ↑',  command: 'sort by name asc' },
  { label: 'Sort by score ↓', command: 'sort by score desc' },
  { label: 'Clear filters',   command: 'clear filters' },
  { label: 'Select all',      command: 'select all' },
  { label: 'Show all',        command: 'show all' },
];

/**
 * Parse a natural-language string into a typed GridAgentAction.
 * This is intentionally simple — no LLM call, pure deterministic pattern matching.
 * Replace the body of this function with an LLM call to scale up.
 *
 * @param {string} input
 * @returns {import('./studentGrid.types.js').GridAgentAction | null}
 */
function parseCommand(input) {
  const s = input.trim().toLowerCase();

  // Status filters
  if (s.includes('pending'))    return { type: 'SET_STATUS_FILTER', status: 1 };
  if (s.includes('accepted'))   return { type: 'SET_STATUS_FILTER', status: 2 };
  if (s.includes('rejected'))   return { type: 'SET_STATUS_FILTER', status: 3 };
  if (s.includes('waitlist'))   return { type: 'SET_STATUS_FILTER', status: 4 };

  // Clear
  if (s.includes('clear') || s.includes('show all') || s.includes('reset'))
    return { type: 'CLEAR_FILTERS' };

  // Selection
  if (s.includes('select all'))   return { type: 'SELECT_ROWS', ids: [] }; // empty = select all
  if (s.includes('deselect') || s.includes('clear selection'))
    return { type: 'CLEAR_SELECTION' };

  // Sort patterns: "sort by <column> <direction>"
  const sortMatch = s.match(/sort\s+by\s+(\w+)(?:\s+(asc|desc))?/);
  if (sortMatch) {
    const colMap = {
      name: 'fullName', fullname: 'fullName',
      id: 'nationalId', national: 'nationalId',
      city: 'city',
      exam: 'examScore',
      math: 'mathScore', mathprep: 'mathScore',
      english: 'englishScore', englishprep: 'englishScore',
      prep: 'finalYearScore', finalyear: 'finalYearScore', finalprep: 'finalYearScore',
      score: 'totalPct', percentage: 'totalPct', total: 'totalPct',
      interviewer1: 'interviewer1', interviewer2: 'interviewer2', interviewer3: 'interviewer3',
      ministry: 'ministryExamPercentage',
      status: 'status',
    };
    const col = colMap[sortMatch[1]] || sortMatch[1];
    const dir = (sortMatch[2] === 'desc') ? 'desc' : 'asc';
    return { type: 'SORT', column: col, direction: dir };
  }

  // Global search
  const searchMatch = s.match(/(?:search|find|filter)\s+(?:for\s+)?(.+)/);
  if (searchMatch) return { type: 'GLOBAL_SEARCH', query: searchMatch[1] };

  return null;
}

/**
 * Execute a typed GridAgentAction against the AG Grid API and the search setter.
 *
 * @param {import('./studentGrid.types.js').GridAgentAction} action
 * @param {import('ag-grid-community').GridApi} gridApi
 * @param {(q: string) => void} setSearch
 * @returns {string} Human-readable feedback message
 */
export function executeAgentAction(action, gridApi, setSearch) {
  if (!gridApi) return 'Grid not ready.';

  switch (action.type) {
    case 'SET_STATUS_FILTER': {
      const label = STATUS_MAP[action.status]?.label ?? 'Unknown';
      gridApi.setFilterModel({
        status: { filterType: 'number', type: 'equals', filter: action.status },
      });
      gridApi.onFilterChanged();
      return `Filtered by status: ${label}`;
    }
    case 'CLEAR_FILTERS': {
      gridApi.setFilterModel(null);
      setSearch('');
      return 'All filters cleared.';
    }
    case 'SORT': {
      gridApi.applyColumnState({
        state: [{ colId: action.column, sort: action.direction }],
        defaultState: { sort: null },
      });
      return `Sorted by ${action.column} (${action.direction}).`;
    }
    case 'GLOBAL_SEARCH': {
      setSearch(action.query);
      return `Searching for "${action.query}".`;
    }
    case 'SELECT_ROWS': {
      if (action.ids.length === 0) {
        gridApi.selectAll();
        return 'All visible rows selected.';
      }
      gridApi.forEachNode((node) => {
        if (action.ids.includes(node.data?.id)) node.setSelected(true);
      });
      return `${action.ids.length} rows selected.`;
    }
    case 'CLEAR_SELECTION': {
      gridApi.deselectAll();
      return 'Selection cleared.';
    }
    default:
      return 'Unknown action.';
  }
}

/**
 * AI Command panel — translates typed commands into structured grid operations.
 *
 * @param {{
 *   gridApi: import('ag-grid-community').GridApi | null;
 *   setSearch: (q: string) => void;
 * }} props
 */
export default function StudentGridAICommand({ gridApi, setSearch }) {
  const [input, setInput]       = useState('');
  const [feedback, setFeedback] = useState(/** @type {{ msg: string; ok: boolean } | null} */(null));

  const run = useCallback((cmd) => {
    const text = cmd ?? input;
    if (!text.trim()) return;

    const action = parseCommand(text);
    if (!action) {
      setFeedback({ msg: `Couldn't understand: "${text}". Try "show pending" or "sort by name".`, ok: false });
      return;
    }
    const msg = executeAgentAction(action, gridApi, setSearch);
    setFeedback({ msg, ok: true });
    if (!cmd) setInput('');
  }, [input, gridApi, setSearch]);

  return (
    <div className="sg-ai-panel">
      <div className="sg-ai-label">
        <Sparkles size={13} />
        AI Command
      </div>

      <div className="sg-ai-input-row">
        <input
          className="sg-ai-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && run()}
          placeholder='e.g. "show pending" · "sort by name" · "clear filters"'
          aria-label="AI grid command"
        />
        <button className="sg-ai-run" onClick={() => run()} disabled={!input.trim()}>
          Run
        </button>
      </div>

      <div className="sg-ai-chips" role="list" aria-label="Quick commands">
        {EXAMPLE_CHIPS.map(chip => (
          <button
            key={chip.command}
            className="sg-ai-chip"
            role="listitem"
            onClick={() => { setInput(chip.command); run(chip.command); }}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {feedback && (
        <div className={`sg-ai-feedback ${feedback.ok ? 'ok' : 'err'}`} role="status">
          {feedback.msg}
        </div>
      )}
    </div>
  );
}
