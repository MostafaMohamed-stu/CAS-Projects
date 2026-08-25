/**
 * @fileoverview Column definitions, cell renderers, formatters, and utility
 * functions for the StudentGrid. All pure functions — no React state.
 */

import React, { useState } from 'react';
import { ChevronDown, RefreshCw } from 'lucide-react';
import { STATUS_MAP } from './studentGrid.types.js';
import { adminAPI } from '../../utils/api.js';

// ─── Interview Score Action Cell ───────────────────────────────────────────────

/**
 * Give / Edit Interview Score button cell.
 * Calls `onGiveScore(student)` passed via gridContext.
 */
export function InterviewScoreActionCell({ data, context }) {
  if (!data) return null;
  const onGiveScore = context?.onGiveScore;
  if (!onGiveScore) return null;

  const hasScore = data.interviewScore != null && data.interviewScore !== 0;

  return (
    <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
      <button
        onClick={(e) => { e.stopPropagation(); onGiveScore(data); }}
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: hasScore ? '#f59e0b' : '#ef3131',
          background: hasScore ? 'rgba(245,158,11,0.08)' : 'rgba(239,49,49,0.08)',
          border: `1px solid ${hasScore ? 'rgba(245,158,11,0.3)' : 'rgba(239,49,49,0.3)'}`,
          borderRadius: 6,
          padding: '3px 10px',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          transition: 'background 0.15s',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = hasScore ? 'rgba(245,158,11,0.18)' : 'rgba(239,49,49,0.18)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = hasScore ? 'rgba(245,158,11,0.08)' : 'rgba(239,49,49,0.08)';
        }}
      >
        {hasScore ? '✏ Edit Score' : '＋ Give Score'}
      </button>
    </div>
  );
}

// Note: Total % is calculated by the backend using the latest dbo.HUB_Settings row.
// The frontend only displays the value sent by the server (TotalPercentage / totalPercentage).

// ─── Formatters ───────────────────────────────────────────────────────────────

/** @param {string|undefined} phone @returns {string} */
export function buildWaUrl(phone) {
  if (!phone) return '';
  const normalized = phone.startsWith('+') ? phone : `+20${phone}`;
  return `https://wa.me/${normalized.replace(/\s/g, '')}`;
}

/**
 * Compute exam total from individual scores or precalculated examTotal.
 * @param {import('./studentGrid.types.js').StudentRow} s
 * @param {((s: any) => number)|undefined} externalFn
 */
export function computeExamTotal(s, externalFn) {
  if (externalFn) return externalFn(s);
  if (s?.examTotal != null && !isNaN(Number(s.examTotal))) return Number(s.examTotal);
  return (Number(s?.examArabicScore) || 0) +
         (Number(s?.examEnglishScore) || 0) +
         (Number(s?.examMathScore) || 0) +
         (Number(s?.examSoftwareScore) || 0) +
         (Number(s?.examIqScore) || 0);
}

/**
 * Compute exam maximum dynamically from student metadata or settings.
 * @param {import('./studentGrid.types.js').StudentRow} s
 * @param {((s: any) => number)|undefined} externalFn
 */
export function computeExamMax(s, externalFn) {
  if (externalFn) return externalFn(s);
  if (s?.examMaxScore != null && !isNaN(Number(s.examMaxScore))) return Number(s.examMaxScore);
  const hasIq = s?.examIqScore != null && s?.examIqScore !== undefined;
  return hasIq ? 100 : 60;
}

// ─── Cell Renderers ───────────────────────────────────────────────────────────

/** Monospace national-ID cell */
export function NationalIdCell({ value }) {
  return (
    <span style={{
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      fontSize: 11,
      color: 'var(--sg-muted)',
      letterSpacing: '0.03em',
    }}>
      {value}
    </span>
  );
}

/** Student name with subtle avatar initial */
export function NameCell({ value }) {
  if (!value) return null;
  const initials = value.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('');
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, height: '100%' }}>
      <div style={{
        width: 32, height: 32, borderRadius: 8,
        background: 'var(--sg-avatar-bg)',
        color: 'var(--sg-avatar-color)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, fontWeight: 700, flexShrink: 0,
        fontFamily: 'system-ui',
      }}>
        {initials}
      </div>
      <span style={{ fontWeight: 500, fontSize: 13, color: 'var(--sg-text)' }}>{value}</span>
    </div>
  );
}

/** Exam score bar cell: total / max with mini progress bar */
export function ExamScoreCell({ data, getExamTotal, getExamMaximum }) {
  if (!data) return null;
  const total = computeExamTotal(data, getExamTotal);
  const max   = computeExamMax(data, getExamMaximum);
  const pct   = max > 0 ? (total / max) * 100 : 0;
  const color = pct >= 70 ? '#10b981' : pct >= 45 ? '#f59e0b' : '#ef4444';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 4, height: '100%', padding: '6px 0' }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--sg-text)' }}>{total} / {max}</span>
      <div style={{ height: 3, borderRadius: 99, background: 'var(--sg-track)', width: 70, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 99, transition: 'width 0.4s ease' }} />
      </div>
    </div>
  );
}

/** Final year preparatory certificate score cell: score / 280 with percentage badge */
export function PrepFinalCell({ value }) {
  if (value == null || isNaN(Number(value))) {
    return <span style={{ color: 'var(--sg-muted)' }}>—</span>;
  }
  const score = Number(value);
  const pct = Math.round((score / 280) * 1000) / 10;
  const color = pct >= 70 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, height: '100%' }}>
      <span style={{ fontWeight: 600, fontSize: 12, color: 'var(--sg-text)' }}>
        {score} <span style={{ color: 'var(--sg-muted)', fontWeight: 400, fontSize: 11 }}>/ 280</span>
      </span>
      <span style={{
        fontSize: 10,
        fontWeight: 700,
        color,
        background: `${color}14`,
        padding: '1px 5px',
        borderRadius: 4,
        border: `1px solid ${color}30`,
      }}>
        {pct}%
      </span>
    </div>
  );
}

/** Interviewer score cell: score / 40 with percentage badge and interviewer name */
export function InterviewerScoreCell({ value, name }) {
  if (value == null || isNaN(Number(value))) {
    return <span style={{ color: 'var(--sg-muted)' }}>—</span>;
  }
  const val = Number(value);
  const pct = Math.round((val / 40) * 100);
  const color = pct >= 70 ? '#10b981' : pct >= 45 ? '#f59e0b' : '#ef4444';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', gap: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontWeight: 600, fontSize: 12, color: 'var(--sg-text)' }}>
          {val} <span style={{ color: 'var(--sg-muted)', fontWeight: 400, fontSize: 11 }}>/ 40</span>
        </span>
        <span style={{
          fontSize: 10,
          fontWeight: 700,
          color,
          background: `${color}14`,
          padding: '1px 5px',
          borderRadius: 4,
          border: `1px solid ${color}30`,
        }}>
          {pct}%
        </span>
      </div>
      {name && (
        <span style={{ fontSize: 9, color: 'var(--sg-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 130 }}>
          {name}
        </span>
      )}
    </div>
  );
}

/**
 * Read the backend-computed TotalPercentage. No client-side calculation.
 */
export function getStudentTotalPercentage(student) {
  if (!student) return null;
  const v = student.totalPercentage ??
            student.TotalPercentage ??
            student.percentage ??
            student.Percentage ??
            student.interviewPercentage ??
            student.InterviewPercentage;
  if (v == null || isNaN(Number(v))) return null;
  return Math.round(Number(v) * 100) / 100;
}

/** Total percentage pill — displays the server-computed value only */
export function TotalPctCell({ data, value }) {
  const raw = value !== undefined && value !== null ? value : getStudentTotalPercentage(data);
  if (raw === null || raw === undefined || isNaN(Number(raw))) return <span style={{ color: 'var(--sg-muted)' }}>—</span>;
  const pct = Math.round(Number(raw) * 100) / 100;
  const color = pct >= 70 ? '#10b981' : pct >= 45 ? '#f59e0b' : '#ef4444';
  return (
    <span style={{
      fontWeight: 700, fontSize: 13, color,
      background: `${color}14`,
      padding: '2px 10px', borderRadius: 99,
      border: `1px solid ${color}30`,
    }}>
      {pct}%
    </span>
  );
}

/** Boolean badge: Yes / No */
export function BoolCell({ value }) {
  return value
    ? <span style={{ color: '#10b981', fontWeight: 600, fontSize: 12 }}>✓</span>
    : <span style={{ color: 'var(--sg-muted)', fontWeight: 400, fontSize: 12 }}>—</span>;
}

export const STATUS_LOOKUP = {
  1: { id: 1, name: 'Pending', label: 'Pending', color: '#b45309', bg: '#fef3c7', border: '#fcd34d' },
  2: { id: 2, name: 'Accepted', label: 'Accepted', color: '#047857', bg: '#d1fae5', border: '#6ee7b7' },
  3: { id: 3, name: 'Rejected', label: 'Rejected', color: '#b91c1c', bg: '#fee2e2', border: '#fca5a5' },
  4: { id: 4, name: 'Waitlisted', label: 'Waitlisted', color: '#4338ca', bg: '#e0e7ff', border: '#a5b4fc' },
};

export function normalizeStatus(raw) {
  if (raw === null || raw === undefined) return 1;
  if (typeof raw === 'number' && STATUS_LOOKUP[raw]) return raw;
  const str = String(raw).trim().toLowerCase();
  if (str === '2' || str === 'accepted') return 2;
  if (str === '3' || str === 'rejected') return 3;
  if (str === '4' || str === 'waitlisted') return 4;
  return 1;
}

/** Inline status dropdown — updates in-place, no full grid reload */
export function StatusDropdownCell({ data, node, context, editable = false }) {
  const [saving, setSaving] = useState(false);

  // Read status directly from row data
  const statusNum = normalizeStatus(data?.status ?? data?.Status);
  const cfg = STATUS_LOOKUP[statusNum] || STATUS_LOOKUP[1];

  if (!editable) {
    return <span style={{ color: cfg.color, fontWeight: 700, fontSize: 11 }}>{cfg.label}</span>;
  }

  const handleChange = async (e) => {
    e.stopPropagation();
    const nextNum = Number(e.target.value);
    if (nextNum === statusNum || saving) return;

    const nextConfig = STATUS_LOOKUP[nextNum];
    if (!nextConfig) return;

    // Optimistic update in node data immediately
    if (node) {
      node.setDataValue('status', nextNum);
    }
    if (data) {
      data.status = nextNum;
    }

    setSaving(true);
    try {
      const studentId = data.id ?? data.Id;
      await adminAPI.updateStudentStatus(studentId, nextConfig.name);
    } catch (err) {
      console.error('Failed to update student status:', err);
      // Revert node data on failure
      if (node) {
        node.setDataValue('status', statusNum);
      }
      if (data) {
        data.status = statusNum;
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
      <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
        <select
          value={statusNum}
          onChange={handleChange}
          disabled={saving}
          onClick={(e) => e.stopPropagation()}
          style={{
            appearance: 'none',
            WebkitAppearance: 'none',
            MozAppearance: 'none',
            backgroundColor: saving ? '#f3f4f6' : cfg.bg,
            color: saving ? '#9ca3af' : cfg.color,
            border: `1.5px solid ${saving ? '#d1d5db' : cfg.border}`,
            borderRadius: '9999px',
            padding: '3px 26px 3px 10px',
            fontSize: '11px',
            fontWeight: 700,
            lineHeight: 1.4,
            cursor: saving ? 'wait' : 'pointer',
            outline: 'none',
            transition: 'background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease',
            minWidth: '112px',
          }}
        >
          <option value={1} style={{ backgroundColor: '#ffffff', color: '#b45309', fontWeight: 600 }}>Pending</option>
          <option value={2} style={{ backgroundColor: '#ffffff', color: '#047857', fontWeight: 600 }}>Accepted</option>
          <option value={3} style={{ backgroundColor: '#ffffff', color: '#b91c1c', fontWeight: 600 }}>Rejected</option>
          <option value={4} style={{ backgroundColor: '#ffffff', color: '#4338ca', fontWeight: 600 }}>Waitlisted</option>
        </select>
        <span
          style={{
            position: 'absolute',
            right: '8px',
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: saving ? '#9ca3af' : cfg.color,
          }}
        >
          {saving ? (
            <RefreshCw size={11} style={{ animation: 'sg-spin 0.7s linear infinite' }} />
          ) : (
            <ChevronDown size={12} strokeWidth={2.5} />
          )}
        </span>
      </div>
    </div>
  );
}

/** WhatsApp contact buttons */
export function ContactsCell({ data }) {
  if (!data) return null;
  const open = (phone) => {
    const url = buildWaUrl(phone);
    if (url) window.open(url, '_blank', 'noopener');
  };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, height: '100%' }}>
      <button
        onClick={(e) => { e.stopPropagation(); open(data.phoneNumber); }}
        disabled={!data.phoneNumber}
        style={{
          fontSize: 11, fontWeight: 600, color: '#10b981',
          background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)',
          borderRadius: 6, padding: '2px 8px', cursor: data.phoneNumber ? 'pointer' : 'default',
          opacity: data.phoneNumber ? 1 : 0.35, transition: 'background 0.15s',
        }}
        onMouseEnter={e => { if (data.phoneNumber) e.currentTarget.style.background = 'rgba(16,185,129,0.16)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(16,185,129,0.08)'; }}
      >
        Student
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); open(data.parentPhoneNumber); }}
        disabled={!data.parentPhoneNumber}
        style={{
          fontSize: 11, fontWeight: 600, color: '#6366f1',
          background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.25)',
          borderRadius: 6, padding: '2px 8px', cursor: data.parentPhoneNumber ? 'pointer' : 'default',
          opacity: data.parentPhoneNumber ? 1 : 0.35, transition: 'background 0.15s',
        }}
        onMouseEnter={e => { if (data.parentPhoneNumber) e.currentTarget.style.background = 'rgba(99,102,241,0.16)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.08)'; }}
      >
        Parent
      </button>
    </div>
  );
}

/**
 * Find the score record belonging to a fixed interviewer slot.
 * The roster is required because a missing score must not shift later scores left.
 */
function getInterviewerItem(s, idx) {
  const arr = s?.interviewScores ?? s?.InterviewScores;
  if (!Array.isArray(arr)) return null;

  const roster = s?.interviewerIds ?? s?.InterviewerIds;
  if (Array.isArray(roster)) {
    if (roster[idx] == null) return null;

    const interviewerId = Number(roster[idx]);
    return arr.find((item) => {
      if (!item || typeof item !== 'object') return false;
      const itemId = item.interviewerId ?? item.InterviewerId;
      return itemId != null && Number(itemId) === interviewerId;
    }) ?? null;
  }

  return arr[idx] ?? null;
}

/**
 * Safely extract score for a given interviewer index (0, 1, 2).
 * @param {import('./studentGrid.types.js').StudentRow} s
 * @param {number} idx - 0 for slot 1, 1 for slot 2, 2 for slot 3
 */
export function getInterviewerScore(s, idx) {
  if (!s) return null;

  const item = getInterviewerItem(s, idx);
  if (typeof item === 'number') return item;
  if (item && typeof item === 'object') {
    const val = item.score ?? item.Score ?? item.totalScore ?? item.value ?? item.interviewScore;
    if (val != null && !isNaN(Number(val))) return Number(val);
  }

  // 2. Direct properties on student object
  const keys = [
    `interviewer${idx + 1}Score`,
    `interviewer${idx + 1}`,
    `interviewerScore${idx + 1}`,
    `interviewScore${idx + 1}`,
  ];
  for (const key of keys) {
    if (s[key] != null && !isNaN(Number(s[key]))) {
      return Number(s[key]);
    }
  }

  return null;
}

/**
 * Get interviewer display name for a given index slot.
 * @param {import('./studentGrid.types.js').StudentRow} s
 * @param {number} idx
 */
export function getInterviewerName(s, idx) {
  if (!s) return null;
  const item = getInterviewerItem(s, idx);
  if (item && typeof item === 'object') {
    return item.admin ?? item.Admin ?? item.email ?? item.Email ?? null;
  }
  return null;
}

// ─── Column Definitions ───────────────────────────────────────────────────────

/**
 * Build AG Grid column definitions.
 * Wrapped in useMemo in the parent to avoid re-creation on every render.
 *
 * @param {{ getExamTotal?: Function; getExamMaximum?: Function; showInterviewScoreAction?: boolean; canEditStatus?: boolean }} opts
 * @returns {import('ag-grid-community').ColDef[]}
 */
export function buildColumnDefs({ getExamTotal, getExamMaximum, showInterviewScoreAction = false, canEditStatus = false } = {}) {
  return [
    // Checkbox selection column next to National ID — pinned left
    {
      colId:          '__check__',
      headerName:     '',
      checkboxSelection: true,
      headerCheckboxSelection: true,
      pinned:         'left',
      width:          44,
      minWidth:       44,
      maxWidth:       44,
      resizable:      false,
      sortable:       false,
      filter:         false,
      suppressMovable: true,
    },

    {
      colId:        'nationalId',
      field:        'nationalId',
      headerName:   'National ID',
      width:        150,
      filter:       'agTextColumnFilter',
      cellRenderer: NationalIdCell,
    },

    {
      colId:        'fullName',
      field:        'fullName',
      headerName:   'Student Name',
      flex:         1.8,
      minWidth:     200,
      filter:       'agTextColumnFilter',
      cellRenderer: NameCell,
    },

    {
      colId:        'createdAt',
      field:        'createdAt',
      headerName:   'Created At',
      width:        125,
      sortable:     true,
      filter:       'agTextColumnFilter',
      valueGetter:  (p) => p.data?.createdAt ?? p.data?.CreatedAt ?? null,
      valueFormatter: (p) => p.value ? String(p.value).slice(0, 10) : '—',
    },

    {
      colId:        'city',
      field:        'city',
      headerName:   'City',
      width:        120,
      filter:       'agTextColumnFilter',
    },

    {
      colId:         'examScore',
      headerName:    'School Exam Score',
      width:         140,
      sortable:      true,
      filter:        'agNumberColumnFilter',
      valueGetter:   (p) => p.data ? computeExamTotal(p.data, getExamTotal) : 0,
      cellRenderer:  (p) => (
        <ExamScoreCell
          data={p.data}
          getExamTotal={getExamTotal}
          getExamMaximum={getExamMaximum}
        />
      ),
    },

    {
      colId:         'mathScore',
      field:         'mathScore',
      headerName:    'Math Prep',
      width:         110,
      sortable:      true,
      filter:        'agNumberColumnFilter',
      valueGetter:   (p) => p.data?.mathScore ?? p.data?.MathScore ?? null,
      valueFormatter: (p) => p.value != null && !isNaN(Number(p.value)) ? Number(p.value).toFixed(1) : '—',
    },

    {
      colId:         'englishScore',
      field:         'englishScore',
      headerName:    'English Prep',
      width:         115,
      sortable:      true,
      filter:        'agNumberColumnFilter',
      valueGetter:   (p) => p.data?.englishScore ?? p.data?.EnglishScore ?? null,
      valueFormatter: (p) => p.value != null && !isNaN(Number(p.value)) ? Number(p.value).toFixed(1) : '—',
    },

    {
      colId:         'finalYearScore',
      field:         'finalYearScore',
      headerName:    'Final Prep (280)',
      width:         145,
      sortable:      true,
      filter:        'agNumberColumnFilter',
      valueGetter:   (p) => p.data?.finalYearScore ?? p.data?.FinalYearScore ?? p.data?.thirdPrepScore ?? null,
      cellRenderer:  (p) => <PrepFinalCell value={p.value} />,
    },

    {
      colId:         'ministryExamPercentage',
      field:         'ministryExamPercentage',
      headerName:    'Ministry %',
      width:         110,
      filter:        'agNumberColumnFilter',
      sortable:      true,
      valueGetter:   (p) => p.data?.ministryExamPercentage ?? p.data?.MinistryExamPercentage ?? null,
      valueFormatter: (p) => p.value != null && !isNaN(Number(p.value)) ? `${Number(p.value).toFixed(1)}%` : '—',
    },

    {
      colId:         'interviewer1',
      headerName:    'Interviewer 1',
      width:         155,
      sortable:      true,
      filter:        'agNumberColumnFilter',
      valueGetter:   (p) => getInterviewerScore(p.data, 0),
      valueFormatter: (p) => {
        if (p.value == null) return '—';
        const name = getInterviewerName(p.data, 0);
        return `${p.value}/40${name ? ` · ${name}` : ''}`;
      },
      headerTooltip: 'Mapped by interviewer account',
      cellRenderer:  (p) => <InterviewerScoreCell value={p.value} name={getInterviewerName(p.data, 0)} />,
    },

    {
      colId:         'interviewer2',
      headerName:    'Interviewer 2',
      width:         155,
      sortable:      true,
      filter:        'agNumberColumnFilter',
      valueGetter:   (p) => getInterviewerScore(p.data, 1),
      valueFormatter: (p) => {
        if (p.value == null) return '—';
        const name = getInterviewerName(p.data, 1);
        return `${p.value}/40${name ? ` · ${name}` : ''}`;
      },
      headerTooltip: 'Mapped by interviewer account',
      cellRenderer:  (p) => <InterviewerScoreCell value={p.value} name={getInterviewerName(p.data, 1)} />,
    },

    {
      colId:         'interviewer3',
      headerName:    'Interviewer 3',
      width:         155,
      sortable:      true,
      filter:        'agNumberColumnFilter',
      valueGetter:   (p) => getInterviewerScore(p.data, 2),
      valueFormatter: (p) => {
        if (p.value == null) return '—';
        const name = getInterviewerName(p.data, 2);
        return `${p.value}/40${name ? ` · ${name}` : ''}`;
      },
      headerTooltip: 'Mapped by interviewer account',
      cellRenderer:  (p) => <InterviewerScoreCell value={p.value} name={getInterviewerName(p.data, 2)} />,
    },

    {
      colId:         'totalPct',
      field:         'totalPercentage',
      headerName:    'Average %',
      width:         110,
      sortable:      true,
      filter:        'agNumberColumnFilter',
      // Backend computes TotalPercentage using the latest HUB_Settings row.
      // Frontend only reads and displays it.
      valueGetter:   (p) => getStudentTotalPercentage(p.data),
      cellRenderer:  (p) => <TotalPctCell data={p.data} value={p.value} />,
    },

    {
      colId:         'hasOnlineTrainingCourses',
      field:         'hasOnlineTrainingCourses',
      headerName:    'Courses',
      width:         140,
      filter:        'agSetColumnFilter',
      filterParams:  { values: [true, false] },
      cellRenderer:  (p) => <BoolCell value={p.value} />,
    },

    {
      colId:        'hasICDLLicense',
      field:        'hasICDLLicense',
      headerName:   'ICDL',
      width:        80,
      filter:       'agSetColumnFilter',
      filterParams: { values: [true, false] },
      cellRenderer: (p) => <BoolCell value={p.value} />,
    },

    {
      colId:        'hasLaptop',
      field:        'hasLaptop',
      headerName:   'Laptop',
      width:        90,
      filter:       'agSetColumnFilter',
      filterParams: { values: [true, false] },
      cellRenderer: (p) => <BoolCell value={p.value} />,
    },

    {
      colId:        'status',
      field:        'status',
      headerName:   'Status',
      width:        155,
      filter:       'agNumberColumnFilter',
      sortable:     true,
      suppressMovable: false,
      cellRenderer: (p) => <StatusDropdownCell data={p.data} node={p.node} api={p.api} context={p.context} editable={canEditStatus} />,
    },

    {
      colId:        'contacts',
      headerName:   'Contacts',
      width:        170,
      sortable:     false,
      filter:       false,
      resizable:    false,
      cellRenderer: (p) => <ContactsCell data={p.data} />,
    },

    // Interview Score action — only visible when showInterviewScoreAction is true
    ...(showInterviewScoreAction ? [{
      colId:         'interviewScoreAction',
      headerName:    'Interview Score',
      width:         145,
      sortable:      false,
      filter:        false,
      resizable:     false,
      suppressMovable: true,
      pinned:        'right',
      cellRenderer:  (p) => <InterviewScoreActionCell data={p.data} context={p.context} />,
    }] : []),
  ];
}
