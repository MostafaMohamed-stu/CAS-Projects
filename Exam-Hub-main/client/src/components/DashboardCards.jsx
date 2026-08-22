import { useEffect, useState, useRef } from 'react'

export default function DashboardCards({ data, loading, userRole, selectedExamId = null, leaderboard = null }) {
    const [animatedTotal, setAnimatedTotal] = useState(0)
    const [animatedPass, setAnimatedPass] = useState(0)
    const [animatedFail, setAnimatedFail] = useState(0)
    const [animatedAverage, setAnimatedAverage] = useState(0)

    const calculateFromLeaderboard = () => {
        if (!selectedExamId || !leaderboard || !Array.isArray(leaderboard) || leaderboard.length === 0) {
            return { avgScore: 0, passPercentage: 0, failPercentage: 0 }
        }

        let totalScore = 0
        let passCount = 0

        leaderboard.forEach(entry => {
            const score = typeof entry.score === 'number' ? entry.score : 0
            totalScore += score
            if (score >= 50) passCount += 1
        })

        const count = leaderboard.length
        if (count === 0) return { avgScore: 0, passPercentage: 0, failPercentage: 0 }

        const avgScore = totalScore / count
        const passPercentage = (passCount / count) * 100
        const failPercentage = 100 - passPercentage

        return { avgScore, passPercentage, failPercentage }
    }

    // Calculate average score based on selected exam or overall
    const calculateAverageScore = () => {
        if (!data) return 0

        // If an exam is selected, get its average score
        if (selectedExamId && data.examBreakdown) {
            const exam = data.examBreakdown.find(e =>
                String(e.examId) === String(selectedExamId)
            )
            if (exam && exam.averageScore) {
                return exam.averageScore
            }
        }

        // Fallback: derive from leaderboard when breakdown has no stats
        if (selectedExamId && (!data.examBreakdown || data.examBreakdown.length === 0)) {
            const fromLb = calculateFromLeaderboard()
            if (fromLb.avgScore > 0) return fromLb.avgScore
        }

        // Otherwise calculate overall average (weighted by number of students per exam when available)
        if (data.examBreakdown && data.examBreakdown.length > 0) {
            let weightedSum = 0
            let totalStudents = 0

            data.examBreakdown.forEach(exam => {
                const avg = exam.averageScore || 0
                const students = exam.totalStudents || 0
                if (students > 0) {
                    weightedSum += avg * students
                    totalStudents += students
                }
            })

            if (totalStudents > 0) {
                return weightedSum / totalStudents
            }

            // Fallback to simple average if no student counts are available
            const total = data.examBreakdown.reduce((sum, exam) => sum + (exam.averageScore || 0), 0)
            return total / data.examBreakdown.length
        }

        // For students, calculate from recent exams
        if (data.recentExams && data.recentExams.length > 0) {
            const total = data.recentExams.reduce((sum, exam) => sum + (exam.averageScore || 0), 0)
            return total / data.recentExams.length
        }

        return data.averageScore || 0
    }

    // Calculate pass percentage based on selected exam or overall
    const calculatePassPercentage = () => {
        if (!data) return 0

        let val = 0

        // Check for selected specific exam first
        if (selectedExamId && data.examBreakdown) {
            const exam = data.examBreakdown.find(e =>
                String(e.examId || e.ExamId) === String(selectedExamId)
            )
            if (exam) {
                val = exam.passPercentage || exam.PassPercentage || exam.averageScore || 0
                return val
            }
        }

        // Fallback: check for top-level aggregate values (case-insensitive)
        val = data.passPercentage || data.PassPercentage || data.averagePassPercentage || data.AveragePassPercentage || 0

        // If still 0, derive from score distribution if available
        if (val === 0 && data.scoreDistribution) {
            const dist = data.scoreDistribution
            const passBucket = dist.find(d => (d.Name || d.name || '').includes('85-100'))
            if (passBucket) {
                const passVal = passBucket.Value || passBucket.value || 0
                const totalVal = dist.reduce((sum, d) => sum + (d.Value || d.value || 0), 0)
                if (totalVal > 0) val = (passVal / totalVal) * 100
            }
        }

        return val
    }

    // Calculate fail percentage - MUST be 100 - passPercentage for consistency
    const calculateFailPercentage = () => {
        const pass = calculatePassPercentage()
        if (pass > 0) return 100 - pass
        if (pass === 0 && data) {
            // If pass is 0, check if we have explicit fail data for selected exam
            if (selectedExamId && data.examBreakdown) {
                const exam = data.examBreakdown.find(e =>
                    String(e.examId || e.ExamId) === String(selectedExamId)
                )
                if (exam && (exam.failPercentage !== undefined || exam.FailedStudents !== undefined)) {
                    return exam.failPercentage || exam.FailedStudents || 100
                }
            }
        }
        return 100 - pass
    }

    // Refs to track current animated values for smooth transitions
    const currentValues = useRef({
        total: 0,
        pass: 0,
        fail: 0,
        average: 0
    })

    // Animate numbers when data changes
    useEffect(() => {
        if (!loading && data) {
            // Helper to wrap setter and update ref
            const createSetter = (key, stateSetter) => (val) => {
                currentValues.current[key] = val
                stateSetter(val)
            }

            const cleanupTotal = animateValue(
                currentValues.current.total,
                data.totalExams || 0,
                600,
                createSetter('total', setAnimatedTotal)
            )

            const cleanupPass = animateValue(
                currentValues.current.pass,
                calculatePassPercentage(),
                600,
                createSetter('pass', setAnimatedPass)
            )

            const cleanupFail = animateValue(
                currentValues.current.fail,
                calculateFailPercentage(),
                600,
                createSetter('fail', setAnimatedFail)
            )

            const cleanupAvg = animateValue(
                currentValues.current.average,
                calculateAverageScore(),
                600,
                createSetter('average', setAnimatedAverage)
            )

            return () => {
                cleanupTotal()
                cleanupPass()
                cleanupFail()
                cleanupAvg()
            }
        }
    }, [data, loading, selectedExamId])

    const animateValue = (start, end, duration, setter) => {
        if (start === end) {
            setter(end)
            return () => { }
        }

        let startTime = null
        let animationFrameId = null

        const step = (timestamp) => {
            if (!startTime) startTime = timestamp
            const progress = Math.min((timestamp - startTime) / duration, 1)

            // Ease Out Quad interpolation: f(t) = t * (2 - t)
            const easeOut = progress * (2 - progress)
            const current = start + (end - start) * easeOut

            setter(Math.round(current * 100) / 100)

            if (progress < 1) {
                animationFrameId = requestAnimationFrame(step)
            } else {
                setter(end)
            }
        }

        animationFrameId = requestAnimationFrame(step)
        return () => cancelAnimationFrame(animationFrameId)
    }

    const getRoleSpecificLabels = () => {
        switch (userRole) {
            case 'Teacher':
                return {
                    total: 'Total Exams Created',
                    pass: 'Average Pass %',
                    fail: 'Average Fail %',
                    average: 'Average Score'
                }
            case 'Superadmin':
            case 'Admin':
                return {
                    total: 'Total Exams',
                    pass: 'Overall Pass %',
                    fail: 'Overall Fail %',
                    average: 'Average Score'
                }
            default: // Student
                return {
                    total: 'Total Exams Taken',
                    pass: 'Pass %',
                    fail: 'Fail %',
                    average: 'Average Score'
                }
        }
    }

    const labels = getRoleSpecificLabels()

    if (loading) {
        return (
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                marginBottom: '2rem'
            }}>
                {[1, 2, 3, 4].map(i => (
                    <div key={i} style={{
                        background: 'var(--bg-main)',
                        borderRadius: '12px',
                        padding: '1rem',
                        boxShadow: 'var(--shadow-sm)'
                    }}>
                        <div style={{
                            height: '1rem',
                            width: '60%',
                            background: 'linear-gradient(90deg, var(--bg-surface-hover) 25%, var(--bg-surface) 50%, var(--bg-surface-hover) 75%)',
                            backgroundSize: '200% 100%',
                            animation: 'shimmer 2.5s infinite linear',
                            borderRadius: '4px',
                            marginBottom: '1rem'
                        }}></div>
                        <div style={{
                            height: '3rem',
                            width: '40%',
                            background: 'linear-gradient(90deg, var(--bg-surface-hover) 25%, var(--bg-surface) 50%, var(--bg-surface-hover) 75%)',
                            backgroundSize: '200% 100%',
                            animation: 'shimmer 2.5s infinite linear',
                            borderRadius: '4px'
                        }}></div>
                    </div>
                ))}
            </div>
        )
    }

    // Calculate total exams value - if an exam is selected, show 1, otherwise show the total
    const totalExamsValue = selectedExamId ? 1 : Math.round(animatedTotal)

    const cards = [
        {
            label: labels.total,
            value: totalExamsValue,
            icon: (
                <svg viewBox="0 0 24 24">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
                </svg>
            ),
            color: 'var(--primary)',
            bgColor: 'rgba(59, 130, 246, 0.1)'
        },
        {
            label: labels.pass,
            value: Math.ceil(animatedPass), // Round up (ceiling) for pass rate
            suffix: '%',
            icon: (
                <svg viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
            ),
            color: '#10b981',
            bgColor: 'rgba(16, 185, 129, 0.1)'
        },
        {
            label: labels.fail,
            value: Math.floor(animatedFail), // Round down (floor) for fail rate
            suffix: '%',
            icon: (
                <svg viewBox="0 0 24 24">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                </svg>
            ),
            color: '#ef4444',
            bgColor: 'rgba(239, 68, 68, 0.1)'
        },
        {
            label: labels.average,
            value: Math.round(animatedAverage), // Round to nearest integer for average score
            suffix: '%',
            icon: (
                <svg viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
            ),
            color: '#8b5cf6',
            bgColor: 'rgba(139, 92, 246, 0.1)'
        }
    ]

    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            marginBottom: '2rem'
        }}>
            {cards.map((card, index) => (
                <div
                    key={index}
                    className={`animate-card stagger-${index + 1}`}
                    style={{
                        background: 'var(--bg-main)',
                        borderRadius: '12px',
                        padding: '1rem',
                        boxShadow: 'var(--shadow-sm)',
                        border: '2px solid transparent',
                        transition: 'all 0.3s ease',
                        cursor: 'default'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = card.color
                        e.currentTarget.style.transform = 'translateY(-4px)'
                        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,.12)'
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'transparent'
                        e.currentTarget.style.transform = 'translateY(0)'
                        e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
                    }}
                >
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '0.75rem'
                    }}>
                        <div style={{
                            fontSize: '0.75rem',
                            fontWeight: '500',
                            color: 'var(--text-secondary)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                        }}>
                            {card.label}
                        </div>
                        <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            background: card.bgColor,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <div style={{ width: '18px', height: '18px', fill: card.color }}>
                                {card.icon}
                            </div>
                        </div>
                    </div>
                    <div style={{
                        fontSize: '2rem',
                        fontWeight: '700',
                        color: card.color,
                        lineHeight: 1
                    }}>
                        {card.value}{card.suffix || ''}
                    </div>
                </div>
            ))}
        </div>
    )
}
