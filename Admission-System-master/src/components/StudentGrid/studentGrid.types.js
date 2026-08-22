/**
 * @fileoverview JSDoc type definitions for the StudentGrid component system.
 * These types document the data contracts across all grid modules.
 */

/**
 * A single student record as returned by the backend API.
 * @typedef {Object} StudentRow
 * @property {number}  id
 * @property {string}  fullName
 * @property {string}  nationalId
 * @property {string}  city
 * @property {number}  examArabicScore
 * @property {number}  examEnglishScore
 * @property {number}  examMathScore
 * @property {number}  examSoftwareScore
 * @property {number}  interviewScore
 * @property {number}  ministryExamPercentage
 * @property {boolean} hasOnlineTrainingCourses
 * @property {boolean} hasICDLLicense
 * @property {boolean} hasLaptop
 * @property {number}  status  - 1=Pending 2=Accepted 3=Rejected 4=Waitlisted
 * @property {string}  [phoneNumber]
 * @property {string}  [parentPhoneNumber]
 * @property {number}  [interviewPercentage]
 * @property {number}  [totalPercentage]
 * @property {Array}   [interviewers]
 */

/**
 * Typed AI agent actions that translate natural-language commands into
 * deterministic grid operations. The grid's action executor is the ONLY
 * place that calls AG Grid API — keeping the grid deterministic and testable.
 *
 * @typedef {
 *   | { type: 'FILTER';         column: string; value: unknown }
 *   | { type: 'SORT';           column: string; direction: 'asc' | 'desc' }
 *   | { type: 'CLEAR_FILTERS' }
 *   | { type: 'GLOBAL_SEARCH';  query: string }
 *   | { type: 'SELECT_ROWS';    ids: number[] }
 *   | { type: 'CLEAR_SELECTION' }
 *   | { type: 'SET_STATUS_FILTER'; status: number }
 * } GridAgentAction
 */

/**
 * Persisted user preferences stored in localStorage.
 * @typedef {Object} GridPrefs
 * @property {string[]}               [hiddenColumns]
 * @property {Record<string, number>} [columnWidths]
 * @property {string[]}               [columnOrder]
 * @property {'compact'|'normal'|'comfortable'} [density]
 * @property {{ colId: string; sort: 'asc'|'desc' }[]} [sortState]
 */

/**
 * Row height in pixels for each density setting.
 * @type {Record<'compact'|'normal'|'comfortable', number>}
 */
export const DENSITY_ROW_HEIGHT = {
  compact:      44,
  normal:       60,
  comfortable:  80,
};

/**
 * Status config map — drives badge colors and labels.
 * @type {Record<number, { label: string; bg: string; color: string; border: string; dot: string }>}
 */
export const STATUS_MAP = {
  1: { label: 'Pending',    bg: 'rgba(245,158,11,0.10)', color: '#b45309', border: 'rgba(245,158,11,0.35)', dot: '#f59e0b' },
  2: { label: 'Accepted',   bg: 'rgba(16,185,129,0.10)', color: '#047857', border: 'rgba(16,185,129,0.35)', dot: '#10b981' },
  3: { label: 'Rejected',   bg: 'rgba(239,68,68,0.10)',  color: '#b91c1c', border: 'rgba(239,68,68,0.35)',  dot: '#ef4444' },
  4: { label: 'Waitlisted', bg: 'rgba(99,102,241,0.10)', color: '#4338ca', border: 'rgba(99,102,241,0.35)', dot: '#6366f1' },
};
