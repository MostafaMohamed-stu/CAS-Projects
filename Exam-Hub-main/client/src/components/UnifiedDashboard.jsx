import { useState, useEffect } from 'react'
import DashboardFilters from './DashboardFilters'
import DashboardCards from './DashboardCards'
import DashboardLeaderboard from './DashboardLeaderboard'
import api from '../api/axios'
import StatsPieChart from './charts/StatsPieChart'
import StatsLineChart from './charts/StatsLineChart'
import StatsBarChart from './charts/StatsBarChart'
import DashboardCharts from './DashboardCharts'
import LoadingSpinner from './LoadingSpinner'

export default function UnifiedDashboard({ userRole, userId, allExams = [], grades = [], classes = [], subjects = [], onSeeAllScores }) {
    console.log('[UnifiedDashboard] Grades received:', grades)
    const GRADES_ORDER = ['Junior', 'Wheeler', 'Senior']
    const [sliderGradeIndex, setSliderGradeIndex] = useState(0) // Default to Junior (index 0)
    const [filters, setFilters] = useState({
        gradeId: null,
        classId: null,
        subjectId: null,
        startDate: null,
        endDate: null,
        groupBy: 'Student'
    })

    const [dashboardData, setDashboardData] = useState(null)
    const [leaderboardData, setLeaderboardData] = useState(null)
    const [recentExams, setRecentExams] = useState([])
    const [selectedExamId, setSelectedExamId] = useState(null)
    const [loading, setLoading] = useState(true)
    const [leaderboardLoading, setLeaderboardLoading] = useState(true)
    const [error, setError] = useState(null)
    const [autoExamSelected, setAutoExamSelected] = useState(false)

    // Normalize role for comparison
    const roleNorm = String(userRole || '').toLowerCase()

    // Fetch dashboard data based on role, filters and selected exam
    useEffect(() => {
        fetchDashboardData()
    }, [userRole, userId, filters, selectedExamId, sliderGradeIndex, grades])

    // Fetch leaderboard when filters, exam selection, or slider grade changes
    useEffect(() => {
        // If an exam is selected (manually or default), always fetch its specific leaderboard
        if (selectedExamId) {
            fetchLeaderboard()
            return
        }

        if (roleNorm === 'student' && dashboardData?.latestExamLeaderboard) {
            setLeaderboardData(dashboardData.latestExamLeaderboard.topStudents || [])
            setLeaderboardLoading(false)
        } else if (dashboardData || selectedExamId || (!selectedExamId && (roleNorm === 'teacher' || roleNorm === 'admin' || roleNorm === 'superadmin'))) {
            fetchLeaderboard()
        }
    }, [filters, dashboardData, selectedExamId, roleNorm, sliderGradeIndex, grades])

    // Auto-select a meaningful exam when "All Exams" view has no leaderboard data
    // Only do this for students or on initial load if desired. 
    // For teachers/admins, "All Exams" should be a valid aggregate view.
    useEffect(() => {
        if (roleNorm !== 'student') return // Disable auto-select for teachers/admins to allow "All Exams" aggregate view
        if (autoExamSelected) return
        if (selectedExamId) return
        if (!leaderboardData || leaderboardData.length > 0) return
        if (!dashboardData || !dashboardData.examBreakdown || dashboardData.examBreakdown.length === 0) return

        const breakdown = dashboardData.examBreakdown
        const candidate = breakdown.find(e =>
            (e.totalStudents || e.passedStudents || e.failedStudents || 0) > 0
        ) || breakdown[0]

        if (candidate && candidate.examId) {
            setSelectedExamId(candidate.examId)
            setAutoExamSelected(true)
        }
    }, [leaderboardData, selectedExamId, autoExamSelected, dashboardData, roleNorm])

    const handleNextGrade = () => {
        setSliderGradeIndex(prev => (prev + 1) % GRADES_ORDER.length)
    }

    const handlePrevGrade = () => {
        setSliderGradeIndex(prev => (prev - 1 + GRADES_ORDER.length) % GRADES_ORDER.length)
    }

    const fetchDashboardData = async () => {
        try {
            setLoading(!dashboardData)
            setError(null)

            // Build filter query string
            const queryParams = new URLSearchParams()
            
            // Determine active gradeId (either from explicit filters or slider)
            let activeGradeId = filters.gradeId
            if (!activeGradeId && (roleNorm === 'teacher' || roleNorm === 'admin' || roleNorm === 'superadmin') && grades && grades.length > 0) {
                const sliderGradeName = GRADES_ORDER[sliderGradeIndex].toLowerCase()
                const gObj = grades.find(g => {
                    const gn = (g.gradeName || g.name || '').toLowerCase()
                    return gn === sliderGradeName || gn.includes(sliderGradeName) || sliderGradeName.includes(gn) ||
                           (sliderGradeName === 'wheeler' && (gn.includes('wheel') || gn.includes('prep') || gn.includes('foundation')))
                })
                if (gObj) activeGradeId = gObj.id
            }

            if (activeGradeId) queryParams.append('gradeId', activeGradeId)
            if (filters.classId) queryParams.append('classId', filters.classId)
            if (filters.subjectId) queryParams.append('subjectId', filters.subjectId)
            if (filters.startDate) queryParams.append('startDate', filters.startDate)
            if (filters.endDate) queryParams.append('endDate', filters.endDate)
            if (selectedExamId) queryParams.append('examId', selectedExamId)

            let resolvedUserId = userId
            if (!resolvedUserId || resolvedUserId === 'undefined') {
                const token = localStorage.getItem('token') || sessionStorage.getItem('token')
                if (token) {
                    try {
                        const payload = JSON.parse(atob(token.split('.')[1]))
                        resolvedUserId = payload.AccountId || payload.accountId || payload.sub || payload.id || payload.nameid || payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier']
                    } catch (e) {}
                }
            }

            let endpoint = ''
            switch (roleNorm) {
                case 'student':
                    endpoint = `/dashboard/student/${resolvedUserId}`
                    break
                case 'teacher':
                    endpoint = `/dashboard/teacher/${resolvedUserId}`
                    break
                case 'superadmin':
                case 'admin':
                case 'board':
                    endpoint = '/dashboard/superadmin'
                    break
                default:
                    throw new Error('Invalid user role')
            }

            const response = await api.get(`${endpoint}?${queryParams.toString()}`)
            const data = response.data

            console.log('[UnifiedDashboard] API Response:', data)
            console.log('[UnifiedDashboard] scoreDistribution:', data.scoreDistribution)
            console.log('[UnifiedDashboard] recentExams:', data.recentExams)
            console.log('[UnifiedDashboard] examBreakdown:', data.examBreakdown)

            // Transform data to match card component expectations while preserving original field names
            const transformedData = {
                ...data, // Spread to preserve all original fields including averagePassPercentage
                totalExams: data.totalExamsTaken || data.totalExamsCreated || data.totalExams || 0,
                scoreDistribution: data.scoreDistribution || [],
                recentExams: data.recentExams || [],
                examBreakdown: data.examBreakdown || []
            }

            // Common logic for all roles to set recent exams and default selection
            const recent = data.recentExams || []
            setRecentExams(recent)

            // If the currently selected exam is not in the new batch, or none selected, pick the first one
            // We only auto-select if there WAS a selected exam and it's now gone.
            // If it was null ("All Exams"), we keep it null to allow the slider to show if intended.
            if (recent.length > 0) {
                const currentStillExists = recent.some(e => String(e.examId) === String(selectedExamId))
                if (selectedExamId && !currentStillExists) {
                    setSelectedExamId(recent[0].examId)
                }
            } else {
                setSelectedExamId(null)
            }

            setDashboardData(transformedData)
        } catch (err) {
            console.error('Error fetching dashboard data:', err)
            setError(err.response?.data?.message || 'Failed to load dashboard data')
        } finally {
            setLoading(false)
        }
    }

    const fetchLeaderboard = async () => {
        try {
            setLeaderboardLoading(!leaderboardData)

            // Priority: Fetch specific exam leaderboard if selected
            if (selectedExamId) {
                console.log(`[UnifiedDashboard] Fetching leaderboard for exam ${selectedExamId}`)
                const params = new URLSearchParams()

                if (filters.gradeId) params.append('gradeId', filters.gradeId)
                if (filters.classId) params.append('classId', filters.classId)
                if (filters.subjectId) params.append('subjectId', filters.subjectId)
                if (filters.startDate) params.append('startDate', filters.startDate)
                if (filters.endDate) params.append('endDate', filters.endDate)
                if (filters.groupBy) params.append('groupBy', filters.groupBy)

                try {
                    const response = await api.get(`/dashboard/leaderboard/${selectedExamId}?${params.toString()}`)
                    setLeaderboardData(response.data.topStudents || [])
                } catch (e) {
                    console.error("[UnifiedDashboard] Error fetching exam leaderboard:", e)
                    setLeaderboardData([])
                }
                setLeaderboardLoading(false)
                return
            }

            // Fallback: Aggregated Leaderboard (Combined)
            if (!selectedExamId) {
                // Allow Teachers, Admins, and Superadmins to see the combined leaderboard based on grade
                if (roleNorm === 'teacher' || roleNorm === 'admin' || roleNorm === 'superadmin') {
                    // Get current slider grade ID
                    const sliderGradeName = GRADES_ORDER[sliderGradeIndex].toLowerCase()
                    let gradeId = null

                    if (filters.gradeId) {
                        gradeId = filters.gradeId
                    } else if (grades && grades.length > 0) {
                        // Case-insensitive search with multiple variations for Wheeler
                        const gObj = grades.find(g => {
                            const gn = (g.gradeName || g.name || '').toLowerCase()
                            const target = sliderGradeName.toLowerCase()
                            
                            // Exact match or contains
                            if (gn === target || gn.includes(target) || target.includes(gn)) return true
                            
                            // Special case for Wheeler variations
                            if (target === 'wheeler' && (gn.includes('wheel') || gn.includes('prep') || gn.includes('foundation'))) return true
                            
                            return false
                        })

                        if (gObj) {
                            gradeId = gObj.id
                        } else {
                            // Fallback to index-based mapping if name match fails
                            console.warn(`[UnifiedDashboard] Could not map slider grade '${sliderGradeName}' to DB grade.`)
                            if (grades[sliderGradeIndex]) gradeId = grades[sliderGradeIndex].id
                            else gradeId = grades[0].id
                        }
                    }

                    if (gradeId) {
                        console.log(`[UnifiedDashboard] Fetching COMBINED leaderboard for grade ${gradeId} (${sliderGradeName})`)
                        try {
                            const params = new URLSearchParams()
                            params.append('gradeId', gradeId)
                            if (filters.classId) params.append('classId', filters.classId)
                            if (filters.subjectId) params.append('subjectId', filters.subjectId)
                            if (filters.startDate) params.append('startDate', filters.startDate)
                            if (filters.endDate) params.append('endDate', filters.endDate)
                            if (filters.groupBy) params.append('groupBy', filters.groupBy)

                            const response = await api.get(`/dashboard/leaderboard/combined?${params.toString()}`)
                            console.log(`[UnifiedDashboard] Combined leaderboard response for grade ${gradeId}:`, response.data)
                            setLeaderboardData(response.data.topStudents || [])
                        } catch (e) {
                            console.error("[UnifiedDashboard] Error fetching combined leaderboard:", e)
                            setLeaderboardData([])
                        }
                        setLeaderboardLoading(false)
                        return
                    } else {
                        console.warn(`[UnifiedDashboard] No gradeId found for slider grade '${sliderGradeName}'. Available grades:`, grades)
                    }
                }
            }

            setLeaderboardData([])
            setLeaderboardLoading(false)
        } catch (err) {
            console.error('Error fetching leaderboard:', err)
            setLeaderboardData([])
            setLeaderboardLoading(false)
        }
    }

    const handleFilterChange = (newFilters) => {
        setSelectedExamId(null) // Explicitly reset exam when global filters change
        setFilters(newFilters)
    }

    const handleExamChange = (e) => {
        setSelectedExamId(e.target.value)
    }

    if (error) {
        return (
            <div style={{
                padding: '2rem',
                background: 'var(--bg-surface)',
                minHeight: '100vh'
            }}>
                <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                    <div style={{
                        background: 'var(--bg-main)',
                        borderRadius: '16px',
                        padding: '3rem 2rem',
                        textAlign: 'center',
                        boxShadow: 'var(--shadow-sm)'
                    }}>
                        <svg style={{ width: '64px', height: '64px', fill: '#ef4444', margin: '0 auto 1rem' }} viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                        </svg>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                            Error Loading Dashboard
                        </h3>
                        <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                            {error}
                        </p>
                        <button
                            onClick={fetchDashboardData}
                            style={{
                                padding: '0.75rem 1.5rem',
                                borderRadius: '8px',
                                border: 'none',
                                background: 'var(--primary)',
                                color: 'white',
                                fontSize: '0.875rem',
                                fontWeight: '500',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div style={{
            padding: '2rem',
            background: 'var(--bg-surface)',
            minHeight: '100vh',
            animation: 'fadeIn 0.5s ease-out'
        }}>
            <style>
                {`
                    @keyframes fadeIn {
                        from { opacity: 0; transform: translateY(10px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    @keyframes slideProgress {
                        0% { transform: translateX(-100%); }
                        50% { transform: translateX(0); }
                        100% { transform: translateX(100%); }
                    }
                `}
            </style>

            {/* Top Loading Progress Bar (for background refreshes) */}
            {loading && dashboardData && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '3px',
                    zIndex: 9999,
                    overflow: 'hidden',
                    background: 'rgba(239, 68, 68, 0.1)'
                }}>
                    <div style={{
                        width: '40%',
                        height: '100%',
                        background: 'var(--primary)',
                        animation: 'slideProgress 1.5s infinite ease-in-out'
                    }}></div>
                </div>
            )}

            <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                {/* Initial Loading State */}
                {loading && !dashboardData && (
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        minHeight: '70vh'
                    }}>
                        <LoadingSpinner message="Optimizing your data..." />
                    </div>
                )}

                {/* Main Content (Optimistic) */}
                <div style={{
                    opacity: (!dashboardData && loading) ? 0 : 1,
                    transition: 'opacity 0.4s ease-in-out',
                    visibility: (!dashboardData && loading) ? 'hidden' : 'visible'
                }}>
                    {/* Header */}
                    <div style={{ marginBottom: '2rem' }}>
                        <h1 style={{
                            fontSize: '2rem',
                            fontWeight: '700',
                            color: 'var(--text-primary)',
                            marginBottom: '0.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem'
                        }}>
                            <svg style={{ width: '32px', height: '32px', fill: 'var(--primary)' }} viewBox="0 0 24 24">
                                <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
                            </svg>
                            Dashboard
                        </h1>
                        <p style={{
                            fontSize: '1rem',
                            color: 'var(--text-secondary)',
                            margin: 0
                        }}>
                            {roleNorm === 'student' && 'Track your exam performance and progress'}
                            {roleNorm === 'teacher' && 'Monitor your exams and student performance'}
                            {(roleNorm === 'superadmin' || roleNorm === 'admin') && 'System-wide statistics and insights'}
                        </p>
                    </div>

                    {/* Filters */}
                    <DashboardFilters
                        onFilterChange={handleFilterChange}
                        userRole={userRole}
                        grades={grades}
                        classes={classes}
                        subjects={subjects}
                        allExams={allExams}
                        recentExams={recentExams}
                        selectedExamId={selectedExamId}
                        onExamChange={handleExamChange}
                        currentFilters={filters}
                    />

                    {/* Statistics Cards */}
                    <DashboardCards
                        data={dashboardData}
                        loading={loading}
                        userRole={userRole}
                        selectedExamId={selectedExamId}
                        leaderboard={leaderboardData}
                    />

                    <DashboardLeaderboard
                        leaderboard={leaderboardData}
                        loading={leaderboardLoading}
                        examTitle={
                            (allExams.find(e => String(e.examId || e.id) === String(selectedExamId)) ||
                                recentExams.find(e => String(e.examId) === String(selectedExamId)))?.title || 'Exam Leaderboard'
                        }
                        userRole={userRole}
                        currentUserId={roleNorm === 'student' ? parseInt(userId) : null}
                        onSeeAll={roleNorm === 'student' ? null : () => {
                            console.log('[UnifiedDashboard] See All Clicked. ExamId:', selectedExamId)
                            if (onSeeAllScores) {
                                if (selectedExamId) {
                                    onSeeAllScores(selectedExamId, null)
                                } else {
                                    // Pass the current slider grade name to filter by grade
                                    const sliderGradeName = GRADES_ORDER[sliderGradeIndex]
                                    onSeeAllScores(null, sliderGradeName)
                                }
                            }
                        }}
                        // Slider Props
                        sliderGrade={GRADES_ORDER[sliderGradeIndex]}
                        showSlider={!selectedExamId && (roleNorm === 'teacher' || roleNorm === 'admin' || roleNorm === 'superadmin') && !filters.gradeId && !filters.classId}
                        onNextGrade={handleNextGrade}
                        onPrevGrade={handlePrevGrade}
                        groupBy={filters.groupBy}
                    />

                    {/* Performance Charts */}
                    <DashboardCharts
                        dashboardData={dashboardData}
                        userRole={userRole}
                        selectedExamId={selectedExamId}
                        filters={filters}
                    />
                </div>
            </div>
        </div>
    )
}
