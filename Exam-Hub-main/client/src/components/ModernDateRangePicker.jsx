import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Calendar, Clock, ChevronLeft, ChevronRight, X, Check, Zap, CalendarDays } from 'lucide-react';

export default function ModernDateRangePicker({
    startDate,
    endDate,
    onChange,
    label = "Exam Availability Range"
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [viewDate, setViewDate] = useState(new Date(startDate || Date.now()));
    const [tempStart, setTempStart] = useState(startDate ? new Date(startDate) : null);
    const [tempEnd, setTempEnd] = useState(endDate ? new Date(endDate) : null);
    const [selecting, setSelecting] = useState('start'); // 'start' or 'end'
    const [activeTab, setActiveTab] = useState('calendar'); // 'calendar' or 'time'
    const dropdownRef = useRef(null);

    // App Theme Colors (Red)
    const colors = {
        primary: '#dc2626', // Red-600
        primaryLight: 'rgba(220, 38, 38, 0.1)',
        primaryHover: '#b91c1c', // Red-700
        accent: '#ef4444', // Red-500
        text: '#1f2937',
        textMuted: '#6b7280',
        border: '#d1d5db',
        bg: '#ffffff'
    };

    useEffect(() => {
        setTempStart(startDate ? new Date(startDate) : null);
        setTempEnd(endDate ? new Date(endDate) : null);
    }, [startDate, endDate]);

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        if (isOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

    const handlePrevMonth = () => {
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
    };

    const handleDateClick = (day) => {
        const selectedDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);

        if (selecting === 'start') {
            // Maintain time if exist
            if (tempStart) {
                selectedDate.setHours(tempStart.getHours(), tempStart.getMinutes());
            } else {
                selectedDate.setHours(new Date().getHours(), new Date().getMinutes());
            }

            setTempStart(selectedDate);

            // If there's an end date and it's now before the new start, clear it or adjust it
            if (tempEnd && selectedDate >= tempEnd) {
                const adjustedEnd = new Date(selectedDate);
                adjustedEnd.setHours(adjustedEnd.getHours() + 1);
                setTempEnd(adjustedEnd);
            }
            setSelecting('end'); // Auto switch to end selection
        } else {
            // End date selection
            if (tempEnd) {
                selectedDate.setHours(tempEnd.getHours(), tempEnd.getMinutes());
            } else {
                selectedDate.setHours((tempStart || new Date()).getHours() + 1, (tempStart || new Date()).getMinutes());
            }

            if (selectedDate < tempStart) {
                // If end < start, swap them or make end current and reset start?
                // Standard UX: Clicked date < start -> set new start
                setTempStart(selectedDate);
                setSelecting('end');
            } else {
                setTempEnd(selectedDate);
                setSelecting('start'); // Done with range, next click starts over
            }
        }
    };

    const handleTimeChange = (type, unit, value) => {
        const target = type === 'start' ? new Date(tempStart || Date.now()) : new Date(tempEnd || Date.now());

        if (unit === 'hours') {
            let h = parseInt(value) || 0;
            const isPM = target.getHours() >= 12;
            if (isPM) {
                if (h < 12) h += 12;
            } else {
                if (h === 12) h = 0;
            }
            target.setHours(h);
        }
        if (unit === 'minutes') target.setMinutes(parseInt(value) || 0);
        if (unit === 'period') {
            let h = target.getHours();
            if (value === 'PM' && h < 12) target.setHours(h + 12);
            if (value === 'AM' && h >= 12) target.setHours(h - 12);
        }

        if (type === 'start') {
            setTempStart(target);
            if (tempEnd && target >= tempEnd) {
                const newEnd = new Date(target);
                newEnd.setHours(newEnd.getHours() + 1);
                setTempEnd(newEnd);
            }
        } else {
            if (tempStart && target <= tempStart) {
                return;
            }
            setTempEnd(target);
        }
    };

    const applyChanges = () => {
        if (tempStart && tempEnd) {
            onChange(tempStart.toISOString(), tempEnd.toISOString());
            setIsOpen(false);
        }
    };

    const setPreset = (preset) => {
        const start = new Date();
        const end = new Date();

        switch (preset) {
            case 'today':
                end.setHours(23, 59, 0);
                break;
            case 'tomorrow':
                start.setDate(start.getDate() + 1);
                start.setHours(8, 0, 0);
                end.setDate(end.getDate() + 1);
                end.setHours(17, 0, 0);
                break;
            case 'week':
                end.setDate(end.getDate() + 7);
                break;
            default:
                break;
        }

        setTempStart(start);
        setTempEnd(end);
        onChange(start.toISOString(), end.toISOString());
        setIsOpen(false);
    };

    const formatDate = (date) => {
        if (!date) return 'Not set';
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    const getDisplayHour = (date) => {
        if (!date) return 12;
        let h = date.getHours();
        if (h === 0) return 12;
        if (h > 12) return h - 12;
        return h;
    };

    const getPeriod = (date) => {
        if (!date) return 'AM';
        return date.getHours() >= 12 ? 'PM' : 'AM';
    };

    const renderCalendar = () => {
        const days = [];
        const month = viewDate.getMonth();
        const year = viewDate.getFullYear();
        const totalDays = daysInMonth(year, month);
        const firstDay = firstDayOfMonth(year, month);

        // Padding for first day
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} style={{ padding: '0.5rem' }}></div>);
        }

        for (let day = 1; day <= totalDays; day++) {
            const current = new Date(year, month, day);
            const isStart = tempStart && current.toDateString() === tempStart.toDateString();
            const isEnd = tempEnd && current.toDateString() === tempEnd.toDateString();
            const inRange = tempStart && tempEnd && current > tempStart && current < tempEnd;
            const isToday = new Date().toDateString() === current.toDateString();

            days.push(
                <div
                    key={day}
                    onClick={() => handleDateClick(day)}
                    style={{
                        padding: '0.5rem',
                        textAlign: 'center',
                        cursor: 'pointer',
                        borderRadius: '8px',
                        fontSize: '0.875rem',
                        fontWeight: (isStart || isEnd) ? '700' : '400',
                        position: 'relative',
                        background: isStart || isEnd ? colors.primary : inRange ? colors.primaryLight : 'transparent',
                        color: isStart || isEnd ? 'white' : inRange ? colors.primary : colors.text,
                        transition: 'all 0.2s',
                        border: isToday && !isStart && !isEnd ? `1px solid ${colors.border}` : 'none',
                        zIndex: isStart || isEnd ? 2 : 1
                    }}
                    onMouseEnter={(e) => {
                        if (!isStart && !isEnd) e.currentTarget.style.background = '#f3f4f6';
                    }}
                    onMouseLeave={(e) => {
                        if (!isStart && !isEnd) e.currentTarget.style.background = inRange ? colors.primaryLight : 'transparent';
                    }}
                >
                    {day}
                    {isToday && !isStart && !isEnd && (
                        <div style={{ position: 'absolute', bottom: '4px', left: '50%', transform: 'translateX(-50%)', width: '4px', height: '4px', borderRadius: '50%', background: colors.primary }}></div>
                    )}
                </div>
            );
        }
        return days;
    };

    return (
        <div className="modern-date-picker" ref={dropdownRef} style={{ position: 'relative', width: '100%' }}>
            <label style={{ display: 'block', fontSize: '.875rem', fontWeight: 600, color: '#374151', marginBottom: '.5rem' }}>
                {label} <span style={{ color: '#dc2626' }}>*</span>
            </label>

            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '0.75rem 1rem',
                    background: 'white',
                    border: `2px solid ${isOpen ? colors.primary : colors.border}`,
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: isOpen ? `0 0 0 4px ${colors.primaryLight}` : 'none'
                }}
            >
                <div
                    onClick={() => { setIsOpen(true); setSelecting('start'); }}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, padding: '4px', borderRadius: '8px', background: selecting === 'start' && isOpen ? '#f3f4f6' : 'transparent' }}
                >
                    <div style={{ padding: '0.5rem', background: colors.primaryLight, borderRadius: '8px', color: colors.primary }}>
                        <CalendarDays size={20} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '0.75rem', color: colors.textMuted, fontWeight: 500, lineHeight: 1 }}>Start</span>
                        <span style={{ fontSize: '0.9rem', color: tempStart ? colors.text : '#9ca3af', fontWeight: 600 }}>
                            {tempStart ? formatDate(tempStart) : 'Select Start'}
                        </span>
                    </div>
                </div>

                <div style={{ width: '1px', height: '24px', background: colors.border }}></div>

                <div
                    onClick={() => { setIsOpen(true); setSelecting('end'); }}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, padding: '4px', borderRadius: '8px', background: selecting === 'end' && isOpen ? '#f3f4f6' : 'transparent' }}
                >
                    <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'right', flex: 1 }}>
                        <span style={{ fontSize: '0.75rem', color: colors.textMuted, fontWeight: 500, lineHeight: 1 }}>End</span>
                        <span style={{ fontSize: '0.9rem', color: tempEnd ? colors.text : '#9ca3af', fontWeight: 600 }}>
                            {tempEnd ? formatDate(tempEnd) : 'Select End'}
                        </span>
                    </div>
                    <div style={{ padding: '0.5rem', background: colors.primaryLight, borderRadius: '8px', color: colors.primary }}>
                        <Clock size={20} />
                    </div>
                </div>
            </div>

            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 12px)',
                    left: 0,
                    right: 0,
                    minWidth: '320px',
                    background: 'white',
                    borderRadius: '16px',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04), 0 0 0 1px rgba(0, 0, 0, 0.05)',
                    zIndex: 10000,
                    overflow: 'hidden',
                    animation: 'pickerFade 0.2s ease-out'
                }}>
                    <style>{`
            @keyframes pickerFade {
              from { opacity: 0; transform: translateY(-10px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `}</style>

                    <div style={{ display: 'flex', borderBottom: '1px solid #f3f4f6' }}>
                        <button
                            onClick={() => setActiveTab('calendar')}
                            style={{
                                flex: 1,
                                padding: '1rem',
                                border: 'none',
                                background: activeTab === 'calendar' ? 'white' : '#f9fafb',
                                color: activeTab === 'calendar' ? colors.primary : colors.textMuted,
                                fontWeight: 600,
                                fontSize: '0.875rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            <Calendar size={16} /> Calendar
                        </button>
                        <button
                            onClick={() => setActiveTab('time')}
                            style={{
                                flex: 1,
                                padding: '1rem',
                                border: 'none',
                                background: activeTab === 'time' ? 'white' : '#f9fafb',
                                color: activeTab === 'time' ? colors.primary : colors.textMuted,
                                fontWeight: 600,
                                fontSize: '0.875rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            <Clock size={16} /> Time
                        </button>
                    </div>

                    <div style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', padding: '0.25rem', background: '#f3f4f6', borderRadius: '10px' }}>
                            <button
                                onClick={() => setSelecting('start')}
                                style={{ flex: 1, padding: '0.5rem', borderRadius: '8px', border: 'none', background: selecting === 'start' ? 'white' : 'transparent', color: selecting === 'start' ? colors.primary : colors.textMuted, fontWeight: 700, fontSize: '0.75rem', boxShadow: selecting === 'start' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', cursor: 'pointer' }}
                            >SELECT START</button>
                            <button
                                onClick={() => setSelecting('end')}
                                style={{ flex: 1, padding: '0.5rem', borderRadius: '8px', border: 'none', background: selecting === 'end' ? 'white' : 'transparent', color: selecting === 'end' ? colors.primary : colors.textMuted, fontWeight: 700, fontSize: '0.75rem', boxShadow: selecting === 'end' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', cursor: 'pointer' }}
                            >SELECT END</button>
                        </div>

                        {activeTab === 'calendar' ? (
                            <>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                    <button onClick={handlePrevMonth} style={{ padding: '0.25rem', borderRadius: '6px', border: '1px solid #e5e7eb', background: 'white', cursor: 'pointer' }}>
                                        <ChevronLeft size={16} />
                                    </button>
                                    <span style={{ fontWeight: 700, color: colors.text }}>
                                        {viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                                    </span>
                                    <button onClick={handleNextMonth} style={{ padding: '0.25rem', borderRadius: '6px', border: '1px solid #e5e7eb', background: 'white', cursor: 'pointer' }}>
                                        <ChevronRight size={16} />
                                    </button>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', marginBottom: '0.5rem' }}>
                                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                                        <div key={d} style={{ textAlign: 'center', fontSize: '0.75rem', color: '#9ca3af', fontWeight: 600, padding: '0.25rem' }}>{d}</div>
                                    ))}
                                    {renderCalendar()}
                                </div>
                            </>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div>
                                    <h4 style={{ fontSize: '0.75rem', fontWeight: 700, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>Start Time</h4>
                                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.75rem' }}>
                                        <input
                                            type="number" min="1" max="12"
                                            value={getDisplayHour(tempStart)}
                                            onChange={(e) => handleTimeChange('start', 'hours', e.target.value)}
                                            style={{ width: '60px', padding: '0.5rem', borderRadius: '8px', border: `1px solid ${colors.border}`, textAlign: 'center' }}
                                        />
                                        <span>:</span>
                                        <input
                                            type="number" min="0" max="59"
                                            value={tempStart ? tempStart.getMinutes() : 0}
                                            onChange={(e) => handleTimeChange('start', 'minutes', e.target.value)}
                                            style={{ width: '60px', padding: '0.5rem', borderRadius: '8px', border: `1px solid ${colors.border}`, textAlign: 'center' }}
                                        />
                                    </div>
                                    <div style={{ display: 'flex', background: '#f3f4f6', padding: '3px', borderRadius: '8px', gap: '2px' }}>
                                        <button
                                            onClick={() => handleTimeChange('start', 'period', 'AM')}
                                            style={{ flex: 1, padding: '0.375rem', borderRadius: '6px', border: 'none', background: getPeriod(tempStart) === 'AM' ? 'white' : 'transparent', color: getPeriod(tempStart) === 'AM' ? colors.primary : colors.textMuted, fontWeight: 700, fontSize: '0.7rem', cursor: 'pointer' }}
                                        >AM</button>
                                        <button
                                            onClick={() => handleTimeChange('start', 'period', 'PM')}
                                            style={{ flex: 1, padding: '0.375rem', borderRadius: '6px', border: 'none', background: getPeriod(tempStart) === 'PM' ? 'white' : 'transparent', color: getPeriod(tempStart) === 'PM' ? colors.primary : colors.textMuted, fontWeight: 700, fontSize: '0.7rem', cursor: 'pointer' }}
                                        >PM</button>
                                    </div>
                                </div>

                                <div>
                                    <h4 style={{ fontSize: '0.75rem', fontWeight: 700, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>End Time</h4>
                                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.75rem' }}>
                                        <input
                                            type="number" min="1" max="12"
                                            value={getDisplayHour(tempEnd)}
                                            onChange={(e) => handleTimeChange('end', 'hours', e.target.value)}
                                            style={{ width: '60px', padding: '0.5rem', borderRadius: '8px', border: `1px solid ${colors.border}`, textAlign: 'center' }}
                                        />
                                        <span>:</span>
                                        <input
                                            type="number" min="0" max="59"
                                            value={tempEnd ? tempEnd.getMinutes() : 0}
                                            onChange={(e) => handleTimeChange('end', 'minutes', e.target.value)}
                                            style={{ width: '60px', padding: '0.5rem', borderRadius: '8px', border: `1px solid ${colors.border}`, textAlign: 'center' }}
                                        />
                                    </div>
                                    <div style={{ display: 'flex', background: '#f3f4f6', padding: '3px', borderRadius: '8px', gap: '2px' }}>
                                        <button
                                            onClick={() => handleTimeChange('end', 'period', 'AM')}
                                            style={{ flex: 1, padding: '0.375rem', borderRadius: '6px', border: 'none', background: getPeriod(tempEnd) === 'AM' ? 'white' : 'transparent', color: getPeriod(tempEnd) === 'AM' ? colors.primary : colors.textMuted, fontWeight: 700, fontSize: '0.7rem', cursor: 'pointer' }}
                                        >AM</button>
                                        <button
                                            onClick={() => handleTimeChange('end', 'period', 'PM')}
                                            style={{ flex: 1, padding: '0.375rem', borderRadius: '6px', border: 'none', background: getPeriod(tempEnd) === 'PM' ? 'white' : 'transparent', color: getPeriod(tempEnd) === 'PM' ? colors.primary : colors.textMuted, fontWeight: 700, fontSize: '0.7rem', cursor: 'pointer' }}
                                        >PM</button>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #f3f4f6' }}>
                            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                                <button
                                    onClick={() => setPreset('today')}
                                    style={{ flex: 1, padding: '0.5rem', borderRadius: '8px', border: `1px solid ${colors.border}`, background: '#f9fafb', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                                >Today</button>
                                <button
                                    onClick={() => setPreset('tomorrow')}
                                    style={{ flex: 1, padding: '0.5rem', borderRadius: '8px', border: `1px solid ${colors.border}`, background: '#f9fafb', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                                >Tomorrow</button>
                                <button
                                    onClick={() => setPreset('week')}
                                    style={{ flex: 1, padding: '0.5rem', borderRadius: '8px', border: `1px solid ${colors.border}`, background: '#f9fafb', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                                >Next Week</button>
                            </div>

                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.75rem', borderRadius: '10px', border: `1px solid ${colors.border}`, background: 'white', color: colors.textMuted, fontWeight: 600, cursor: 'pointer' }}
                                >
                                    <X size={16} /> Cancel
                                </button>
                                <button
                                    onClick={applyChanges}
                                    disabled={!tempStart || !tempEnd}
                                    style={{
                                        flex: 1,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.5rem',
                                        padding: '0.75rem',
                                        borderRadius: '10px',
                                        border: 'none',
                                        background: (tempStart && tempEnd) ? colors.primary : '#9ca3af',
                                        color: 'white',
                                        fontWeight: 600,
                                        cursor: (tempStart && tempEnd) ? 'pointer' : 'not-allowed',
                                        boxShadow: (tempStart && tempEnd) ? `0 4px 6px -1px ${colors.primaryLight}` : 'none'
                                    }}
                                >
                                    <Check size={16} /> Apply Range
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
