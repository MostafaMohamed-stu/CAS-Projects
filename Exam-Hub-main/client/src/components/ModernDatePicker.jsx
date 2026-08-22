import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Clock, ChevronLeft, ChevronRight, X, Check, CalendarDays } from 'lucide-react';

export default function ModernDatePicker({
    value,
    onChange,
    label = "Select Date & Time",
    placeholder = "Select Date",
    required = false
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [viewDate, setViewDate] = useState(new Date(value || Date.now()));
    const [tempValue, setTempValue] = useState(value ? new Date(value) : null);
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
        setTempValue(value ? new Date(value) : null);
    }, [value]);

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
        if (tempValue) {
            selectedDate.setHours(tempValue.getHours(), tempValue.getMinutes());
        } else {
            const now = new Date();
            selectedDate.setHours(now.getHours(), now.getMinutes());
        }
        setTempValue(selectedDate);
        setActiveTab('time'); // Auto switch to time selection
    };

    const handleTimeChange = (unit, val) => {
        const target = new Date(tempValue || Date.now());
        if (unit === 'hours') {
            let nextH = parseInt(val);
            const currentH = getDisplayHour(target);
            const period = getPeriod(target);
            
            // Wrap logic for type-in values or spin-buttons
            if (nextH > 12) nextH = currentH === 12 ? 1 : nextH % 12 || 12;
            if (nextH < 1) nextH = 12;
            
            let finalPeriod = period;
            // AM/PM Toggle behavior: Flip period when crossing 11 <-> 12
            if ((currentH === 11 && nextH === 12) || (currentH === 12 && nextH === 11)) {
                finalPeriod = period === 'AM' ? 'PM' : 'AM';
            }
            
            // Convert to 24h internal representation
            let h24 = nextH;
            if (finalPeriod === 'PM' && nextH < 12) h24 = nextH + 12;
            if (finalPeriod === 'AM' && nextH === 12) h24 = 0;
            
            target.setHours(h24);
        }
        if (unit === 'minutes') target.setMinutes(parseInt(val) || 0);
        if (unit === 'period') {
            let h = target.getHours();
            if (val === 'PM' && h < 12) target.setHours(h + 12);
            if (val === 'AM' && h >= 12) target.setHours(h - 12);
        }
        setTempValue(target);
    };

    const applyChanges = () => {
        if (tempValue) {
            onChange(tempValue.toISOString());
            setIsOpen(false);
        }
    };

    const formatDate = (date) => {
        if (!date) return placeholder;
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
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

        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} style={{ padding: '0.5rem' }}></div>);
        }

        for (let day = 1; day <= totalDays; day++) {
            const current = new Date(year, month, day);
            const isSelected = tempValue && current.toDateString() === tempValue.toDateString();
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
                        fontWeight: isSelected ? '700' : '400',
                        position: 'relative',
                        background: isSelected ? colors.primary : 'transparent',
                        color: isSelected ? 'white' : colors.text,
                        transition: 'all 0.2s',
                        border: isToday && !isSelected ? `1px solid ${colors.border}` : 'none',
                        zIndex: isSelected ? 2 : 1
                    }}
                    onMouseEnter={(e) => {
                        if (!isSelected) e.currentTarget.style.background = '#f3f4f6';
                    }}
                    onMouseLeave={(e) => {
                        if (!isSelected) e.currentTarget.style.background = 'transparent';
                    }}
                >
                    {day}
                    {isToday && !isSelected && (
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
                {label} {required && <span style={{ color: '#dc2626' }}>*</span>}
            </label>

            <div
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    height: '48px', // Fixed height
                    padding: '0.75rem 1rem', // Adjusted padding for vertical centering
                    background: 'white',
                    border: `2px solid ${isOpen ? colors.primary : colors.border}`,
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: isOpen ? `0 0 0 4px ${colors.primaryLight}` : 'none'
                }}
            >
                <div style={{ padding: '0.5rem', background: colors.primaryLight, borderRadius: '8px', color: colors.primary }}>
                    <CalendarDays size={20} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <span style={{ fontSize: '1rem', color: tempValue ? colors.text : '#9ca3af', fontWeight: 600 }}>
                        {formatDate(tempValue)}
                    </span>
                </div>
                <ChevronRight size={18} style={{ transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.3s', color: colors.textMuted }} />
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
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div style={{ textAlign: 'center' }}>
                                    <h4 style={{ fontSize: '0.75rem', fontWeight: 700, color: colors.textMuted, textTransform: 'uppercase', marginBottom: '1rem' }}>Selected Time</h4>
                                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                                        <input
                                            type="number"
                                            value={getDisplayHour(tempValue)}
                                            onChange={(e) => handleTimeChange('hours', e.target.value)}
                                            style={{ width: '70px', padding: '0.75rem', borderRadius: '10px', border: `2px solid ${colors.border}`, textAlign: 'center', fontSize: '1.25rem', fontWeight: 700 }}
                                        />
                                        <span style={{ fontSize: '1.5rem', fontWeight: 700, color: colors.border }}>:</span>
                                        <input
                                            type="number"
                                            value={tempValue ? tempValue.getMinutes() : 0}
                                            onChange={(e) => handleTimeChange('minutes', e.target.value)}
                                            style={{ width: '70px', padding: '0.75rem', borderRadius: '10px', border: `2px solid ${colors.border}`, textAlign: 'center', fontSize: '1.25rem', fontWeight: 700 }}
                                        />
                                    </div>

                                    <div style={{ display: 'flex', background: '#f3f4f6', padding: '4px', borderRadius: '12px', gap: '4px' }}>
                                        <button
                                            onClick={() => handleTimeChange('period', 'AM')}
                                            style={{
                                                flex: 1,
                                                padding: '0.625rem',
                                                borderRadius: '8px',
                                                border: 'none',
                                                background: getPeriod(tempValue) === 'AM' ? 'white' : 'transparent',
                                                color: getPeriod(tempValue) === 'AM' ? colors.primary : colors.textMuted,
                                                fontWeight: 700,
                                                fontSize: '0.875rem',
                                                cursor: 'pointer',
                                                boxShadow: getPeriod(tempValue) === 'AM' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            AM
                                        </button>
                                        <button
                                            onClick={() => handleTimeChange('period', 'PM')}
                                            style={{
                                                flex: 1,
                                                padding: '0.625rem',
                                                borderRadius: '8px',
                                                border: 'none',
                                                background: getPeriod(tempValue) === 'PM' ? 'white' : 'transparent',
                                                color: getPeriod(tempValue) === 'PM' ? colors.primary : colors.textMuted,
                                                fontWeight: 700,
                                                fontSize: '0.875rem',
                                                cursor: 'pointer',
                                                boxShadow: getPeriod(tempValue) === 'PM' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            PM
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #f3f4f6', display: 'flex', gap: '0.75rem' }}>
                            <button
                                onClick={() => setIsOpen(false)}
                                style={{ flex: 1, padding: '0.75rem', borderRadius: '10px', border: `1px solid ${colors.border}`, background: 'white', color: colors.textMuted, fontWeight: 600, cursor: 'pointer' }}
                            >
                                <X size={16} /> Cancel
                            </button>
                            <button
                                onClick={applyChanges}
                                disabled={!tempValue}
                                style={{
                                    flex: 1,
                                    padding: '0.75rem',
                                    borderRadius: '10px',
                                    border: 'none',
                                    background: tempValue ? colors.primary : '#9ca3af',
                                    color: 'white',
                                    fontWeight: 600,
                                    cursor: tempValue ? 'pointer' : 'not-allowed',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem'
                                }}
                            >
                                <Check size={16} /> Apply
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
