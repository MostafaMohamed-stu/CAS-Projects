import { useState, useEffect } from 'react'

export default function DashboardLeaderboard({ leaderboard, loading, examTitle, userRole, currentUserId, onSeeAll, sliderGrade, showSlider, onNextGrade, onPrevGrade, groupBy = 'Student' }) {
    const [animationClass, setAnimationClass] = useState('')
    const [prevGrade, setPrevGrade] = useState(sliderGrade)
    const [displayLeaderboard, setDisplayLeaderboard] = useState(leaderboard)

    useEffect(() => {
        if (!loading && leaderboard) {
            setDisplayLeaderboard(leaderboard)
        }
    }, [leaderboard, loading])

    useEffect(() => {
        if (showSlider && sliderGrade !== prevGrade) {
            const grades = ['Junior', 'Wheeler', 'Senior']
            const prevIdx = grades.indexOf(prevGrade)
            const currIdx = grades.indexOf(sliderGrade)
            const direction = (currIdx > prevIdx || (prevIdx === 2 && currIdx === 0)) ? 'slide-left' : 'slide-right'

            setAnimationClass(direction)
            setPrevGrade(sliderGrade)
            const timer = setTimeout(() => setAnimationClass(''), 800)
            return () => clearTimeout(timer)
        }
    }, [sliderGrade, showSlider, prevGrade])

    // Smarter loading: only show shimmer on INITIAL load, not grade transitions
    if (loading && (!displayLeaderboard || displayLeaderboard.length === 0)) {
        return (
            <div style={{
                background: 'var(--bg-main)',
                borderRadius: '16px',
                padding: '1.5rem',
                boxShadow: 'var(--shadow-sm)'
            }}>
                <div style={{
                    height: '1.5rem',
                    width: '200px',
                    background: 'linear-gradient(90deg, var(--bg-surface-hover) 25%, var(--bg-surface) 50%, var(--bg-surface-hover) 75%)',
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 2.5s infinite linear',
                    borderRadius: '4px',
                    marginBottom: '1.5rem'
                }}></div>
                {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} style={{
                        height: '60px',
                        background: 'linear-gradient(90deg, var(--bg-surface-hover) 25%, var(--bg-surface) 50%, var(--bg-surface-hover) 75%)',
                        backgroundSize: '200% 100%',
                        animation: 'shimmer 2.5s infinite linear',
                        borderRadius: '8px',
                        marginBottom: '0.75rem'
                    }}></div>
                ))}
            </div>
        )
    }

    const getMedalColor = (rank) => {
        switch (rank) {
            case 1:
                return { bg: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)', border: '#f59e0b', emoji: '🥇' }
            case 2:
                return { bg: 'linear-gradient(135deg, #d1d5db 0%, #9ca3af 100%)', border: '#9ca3af', emoji: '🥈' }
            case 3:
                return { bg: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)', border: '#ea580c', emoji: '🥉' }
            default:
                return { bg: 'var(--bg-surface)', border: 'var(--border-color)', emoji: null }
        }
    }

    return (
        <div style={{
            background: 'var(--bg-main)',
            borderRadius: '16px',
            padding: '1.5rem',
            boxShadow: 'var(--shadow-sm)',
            position: 'relative',
            transition: 'all 0.3s ease',
            margin: showSlider ? '0 50px' : '0' // Add margin for arrows
        }}>
            <style>
                {`
                    @keyframes slideFromRight {
                        0% { opacity: 0; transform: translateX(80px); }
                        100% { opacity: 1; transform: translateX(0); }
                    }
                    @keyframes slideFromLeft {
                        0% { opacity: 0; transform: translateX(-80px); }
                        100% { opacity: 1; transform: translateX(0); }
                    }
                    .slide-left {
                        animation: slideFromRight 0.8s cubic-bezier(0.16, 1, 0.3, 1);
                    }
                    .slide-right {
                        animation: slideFromLeft 0.8s cubic-bezier(0.16, 1, 0.3, 1);
                    }
                    .arrow-btn {
                        position: absolute;
                        top: 50%;
                        transform: translateY(-50%);
                        width: 64px;
                        height: 64px;
                        border-radius: 50%;
                        background: #dc2626; /* Premium Red */
                        border: none;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        cursor: pointer;
                        box-shadow: 0 12px 24px rgba(220, 38, 38, 0.3);
                        transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                        z-index: 2000;
                        color: white !important;
                        padding: 0;
                    }
                    .arrow-btn svg {
                        display: block;
                        margin: auto;
                        color: white !important;
                    }
                    .arrow-btn:hover {
                        transform: translateY(-50%) scale(1.1);
                        filter: brightness(1.1);
                        box-shadow: 0 15px 35px rgba(220, 38, 38, 0.4);
                    }
                    .arrow-btn:active {
                        transform: translateY(-50%) scale(0.9);
                    }
                    .arrow-left { left: -60px; }
                    .arrow-right { right: -60px; }
                    
                    @media (max-width: 1400px) {
                        .arrow-left { left: -20px; }
                        .arrow-right { right: -20px; }
                        .arrow-btn { width: 50px; height: 50px; }
                        .arrow-btn svg { width: 28px; height: 28px; }
                    }
                    @media (max-width: 1200px) {
                        .arrow-btn { 
                            position: static; 
                            transform: none; 
                            width: 44px; 
                            height: 44px; 
                            box-shadow: none;
                            border: 1px solid var(--border-color);
                            background: white;
                            color: var(--primary) !important;
                        }
                        .arrow-btn svg { color: var(--primary) !important; width: 24px; height: 24px; }
                        .arrow-left, .arrow-right { 
                            left: auto; 
                            right: auto; 
                        }
                        .mobile-arrows-container {
                            display: flex !important;
                            justify-content: center;
                            gap: 2rem;
                            margin-top: 1rem;
                        }
                    }
                `}
            </style>

            {showSlider && (
                <div className="desktop-arrows-only">
                    <button
                        className="arrow-btn arrow-left"
                        onClick={(e) => { e.stopPropagation(); onPrevGrade(); }}
                        aria-label="Previous Grade"
                    >
                        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
                    </button>
                    <button
                        className="arrow-btn arrow-right"
                        onClick={(e) => { e.stopPropagation(); onNextGrade(); }}
                        aria-label="Next Grade"
                    >
                        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
                    </button>
                </div>
            )}
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                marginBottom: '1rem'
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem'
                }}>
                    <svg style={{ width: '28px', height: '28px', fill: 'var(--primary)' }} viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                    <h3 style={{
                        fontSize: '1.5rem',
                        fontWeight: '700',
                        color: 'var(--text-primary)',
                        margin: 0,
                        letterSpacing: '-0.5px'
                    }}>
                        {groupBy === 'Class' ? 'Class Leaderboard' : 'Leaderboard'}
                    </h3>
                    {examTitle && (
                        <span style={{
                            marginLeft: '0.5rem',
                            fontSize: '0.875rem',
                            color: 'var(--text-secondary)',
                            background: 'var(--bg-surface)',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '99px',
                            border: '1px solid var(--border-color)'
                        }}>
                            {examTitle}
                        </span>
                    )}
                </div>

                {showSlider && (
                    <div style={{
                        textAlign: 'center',
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                        padding: '1rem',
                        borderRadius: '16px',
                        border: '1px solid rgba(0,0,0,0.05)',
                        marginTop: '0.5rem'
                    }}>
                        <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--text-secondary)', fontWeight: 700, marginBottom: '0.25rem' }}>Selected Grade</div>
                        <span style={{
                            fontSize: '1.75rem',
                            fontWeight: 800,
                            color: 'var(--primary)',
                            textShadow: '0 2px 4px rgba(0,0,0,0.05)',
                        }}>
                            {sliderGrade}
                        </span>
                    </div>
                )}
            </div>

            <div className={animationClass} style={{
                width: '100%',
                overflow: 'hidden',
                position: 'relative',
                minHeight: (displayLeaderboard && displayLeaderboard.length > 0) ? 'auto' : '200px',
                opacity: loading && displayLeaderboard?.length > 0 ? 0.75 : 1,
                filter: loading && displayLeaderboard?.length > 0 ? 'blur(1px)' : 'none',
                transition: 'opacity 0.4s ease, filter 0.4s ease'
            }}>
                {(!displayLeaderboard || displayLeaderboard.length === 0) ? (
                    <div style={{
                        padding: '2rem 1rem',
                        textAlign: 'center'
                    }}>
                        <svg style={{ width: '48px', height: '48px', fill: 'var(--text-light)', margin: '0 auto 1rem' }} viewBox="0 0 24 24">
                            <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
                        </svg>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                            No Data Available
                        </h3>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>
                            No records found for this view
                        </p>
                    </div>
                ) : (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.75rem',
                        maxHeight: '450px',
                        overflowY: 'auto',
                        paddingRight: '0.5rem',
                        paddingBottom: '0.5rem',
                        scrollbarWidth: 'thin',
                        scrollbarColor: 'var(--primary) transparent'
                    }}>
                        {displayLeaderboard.map((entry, index) => {
                            const medal = getMedalColor(entry.rank)
                            const isCurrentUser = groupBy !== 'Class' && currentUserId && entry.studentId === currentUserId
                            const isTopThree = entry.rank <= 3

                            return (
                                <div
                                    key={entry.studentId || index}
                                    className={`animate-card stagger-${(index % 5) + 1}`}
                                    style={{
                                        background: isTopThree ? medal.bg : 'var(--bg-surface)',
                                        border: `2px solid ${isCurrentUser ? 'var(--primary)' : medal.border}`,
                                        borderRadius: '12px',
                                        padding: '1rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '1rem',
                                        transition: 'all 0.3s ease',
                                        position: 'relative',
                                        overflow: 'hidden'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateX(4px)'
                                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,.1)'
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateX(0)'
                                        e.currentTarget.style.boxShadow = 'none'
                                    }}
                                >
                                    {/* Rank Badge */}
                                    <div style={{
                                        width: '48px',
                                        height: '48px',
                                        borderRadius: '10px',
                                        background: isTopThree ? 'rgba(255,255,255,0.3)' : 'var(--bg-main)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '1.25rem',
                                        fontWeight: '700',
                                        color: isTopThree ? '#fff' : 'var(--text-primary)',
                                        flexShrink: 0
                                    }}>
                                        {medal.emoji || `#${entry.rank}`}
                                    </div>

                                    {/* Student Info */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{
                                            fontSize: '1rem',
                                            fontWeight: '600',
                                            color: isTopThree ? '#fff' : 'var(--text-primary)',
                                            marginBottom: '0.25rem',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap'
                                        }}>
                                            {entry.studentName}
                                            {isCurrentUser && (
                                                <span style={{
                                                    marginLeft: '0.5rem',
                                                    fontSize: '0.75rem',
                                                    padding: '0.125rem 0.5rem',
                                                    borderRadius: '4px',
                                                    background: 'var(--primary)',
                                                    color: 'white'
                                                }}>
                                                    You
                                                </span>
                                            )}
                                        </div>
                                        <div style={{
                                            fontSize: '0.875rem',
                                            color: isTopThree ? 'rgba(255,255,255,0.9)' : 'var(--text-secondary)'
                                        }}>
                                            {groupBy === 'Class' ? 'Avg Score' : `Rank #${entry.rank}`}
                                        </div>
                                    </div>

                                    {/* Score */}
                                    <div style={{
                                        textAlign: 'right',
                                        flexShrink: 0
                                    }}>
                                        <div style={{
                                            fontSize: '1.5rem',
                                            fontWeight: '700',
                                            color: isTopThree ? '#fff' : 'var(--primary)',
                                            lineHeight: 1
                                        }}>
                                            {entry.score.toFixed(1)}%
                                        </div>
                                        {groupBy !== 'Class' && entry.earnedMarks !== undefined && entry.totalMarks !== undefined && (
                                            <div style={{
                                                fontSize: '0.75rem',
                                                color: isTopThree ? 'rgba(255,255,255,0.8)' : 'var(--text-secondary)',
                                                marginTop: '0.25rem'
                                            }}>
                                                {entry.earnedMarks}/{entry.totalMarks}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}


                {leaderboard && leaderboard.length >= 10 && (
                    <div style={{
                        marginTop: '1rem',
                        padding: '0.75rem',
                        background: 'var(--bg-surface)',
                        borderRadius: '8px',
                        textAlign: 'center',
                        fontSize: '0.875rem',
                        color: 'var(--text-secondary)'
                    }}>
                        Showing top {leaderboard.length} {groupBy === 'Class' ? 'classes' : 'students'}
                    </div>
                )}

                {onSeeAll && (
                    <button
                        onClick={onSeeAll}
                        style={{
                            width: '100%',
                            marginTop: '1rem',
                            padding: '0.75rem',
                            background: 'transparent',
                            border: '1px dashed #d1d5db',
                            borderRadius: '8px',
                            color: 'var(--primary)',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            fontSize: '0.9rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.borderColor = 'var(--primary)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#d1d5db'; }}
                    >
                        {groupBy === 'Class' ? 'See All Class Scores' : 'See All Student Scores'}
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                    </button>
                )}
            </div>

            {/* Mobile Arrows Container */}
            {showSlider && (
                <div className="mobile-arrows-container" style={{
                    display: 'none', // Hidden by default, shown via media queries
                    position: 'absolute',
                    top: '50%',
                    left: '-50px', // Moved further out
                    right: '-50px', // Moved further out
                    transform: 'translateY(-50%)',
                    justifyContent: 'space-between',
                    width: 'calc(100% + 100px)', // Adjust width to cover new left/right
                    pointerEvents: 'none', // Allow clicks to pass through container
                    zIndex: 10
                }}>
                    <button
                        className="arrow-btn"
                        onClick={(e) => { e.stopPropagation(); onPrevGrade(); }}
                        style={{
                            pointerEvents: 'auto', // Re-enable clicks for buttons
                            background: 'var(--bg-main)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '50%',
                            width: '40px',
                            height: '40px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                            color: 'var(--text-primary)',
                            transition: 'all 0.2s ease',
                            opacity: '0.8'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = '0.8'}
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
                    </button>
                    <button
                        className="arrow-btn"
                        onClick={(e) => { e.stopPropagation(); onNextGrade(); }}
                        style={{
                            pointerEvents: 'auto', // Re-enable clicks for buttons
                            background: 'var(--bg-main)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '50%',
                            width: '40px',
                            height: '40px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                            color: 'var(--text-primary)',
                            transition: 'all 0.2s ease',
                            opacity: '0.8'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = '0.8'}
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
                    </button>
                </div>
            )}
        </div>
    )
}
