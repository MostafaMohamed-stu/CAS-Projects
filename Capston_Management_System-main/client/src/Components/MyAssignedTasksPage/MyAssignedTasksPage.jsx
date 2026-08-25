
import { useState, useEffect } from "react"
import { useNotification } from "../../contexts/NotificationContext"
import { API_BASE_URL, isDevelopment } from '../../config/apiConfig.js';
import { axiosInstance } from '../../utils/authService';
import { format, parseISO } from "date-fns"
import { Clock, Calendar, AlertTriangle, CheckCircle, Upload, X, AlertCircle } from "lucide-react"
import { STATUS_CONSTANTS, StatusHelpers } from "../../utils/statusConstants"
import { getCurrentWeekNumber, getWeekDateRange, groupTasksByWeek } from "../../utils/weekUtils";
import "../PhasesPage/PhasesPage.css" // Use PhasesPage design

const MyAssignedTasksPage = ({ user, currentUserId, setCurrentPage, setSelectedTask }) => {
    const [tasks, setTasks] = useState([])
    const [submissions, setSubmissions] = useState([])
    const [loading, setLoading] = useState(true)
    const [weeks, setWeeks] = useState([]) // Store fetched weeks
    const { showError } = useNotification()

    const CURRENT_USER_ID = currentUserId || user?.id

    useEffect(() => {
        fetchData()
    }, [CURRENT_USER_ID])

    const fetchData = async () => {
        setLoading(true)
        try {
            const [tasksRes, submissionsRes, leadsRes, superAdminsRes, weeksRes] = await Promise.all([
                axiosInstance.get(`/AccountTask`),
                axiosInstance.get(`/TaskSubmissions`),
                axiosInstance.get(`/Account/ByRoleName/CapstoneLead`).catch(err => {
                    if (err.response?.status === 403) {
                        console.warn('No permission to fetch Capstone Leads - continuing without this data')
                        return { data: [] }
                    }
                    throw err
                }),
                axiosInstance.get(`/Account/ByRoleName/SuperAdmin`).catch(err => {
                    if (err.response?.status === 403) {
                        console.warn('No permission to fetch SuperAdmins - continuing without this data')
                        return { data: [] }
                    }
                    throw err
                }),
                axiosInstance.get(`/Weeks?businessEntityName=CapstoneProject`)
            ])

            const allTasks = tasksRes.data?.$values || tasksRes.data || []
            const allSubmissions = submissionsRes.data?.$values || submissionsRes.data || []
            const leads = leadsRes.data?.$values || leadsRes.data || []
            const superAdmins = superAdminsRes.data?.$values || superAdminsRes.data || []
            const weeksRaw = weeksRes.data
            const weeksData = Array.isArray(weeksRaw) ? weeksRaw : weeksRaw?.$values || []

            setWeeks(weeksData.sort((a, b) => a.id - b.id))

            const leadIds = leads.map(u => u.id)
            const superAdminIds = superAdmins.map(u => u.id)

            setSubmissions(allSubmissions)

            // Determine my role context
            // If I am a Capstone Lead, I look for tasks from Super Admins.
            // If I am an Engineer, I look for tasks from Capstone Leads.
            // We can check user role from 'user' prop or current context
            // Assuming 'user' prop has roles.
            const isMyRoleLead = user?.roles?.includes("CapstoneLead") || user?.roles?.includes("capstone lead") || user?.role === "CapstoneLead"
            const isMyRoleEngineer = user?.roles?.includes("Engineer") || user?.roles?.includes("engineer") || user?.role === "Engineer"

            // Filter tasks
            const myTasks = allTasks.filter(t => {
                const assigneeId = t.assignedToId ?? t.AssignedToId
                const creatorId = t.adminAccountId ?? t.AdminAccountId
                const isGeneric = (assigneeId === null) && (t.gradeId === null) && (t.teamId === null)

                // 1. Explicit assignment
                if (assigneeId === CURRENT_USER_ID) return true

                // 2. Generic Task Logic
                if (isGeneric) {
                    if (isMyRoleLead && superAdminIds.includes(creatorId)) return true
                    if (isMyRoleEngineer && leadIds.includes(creatorId)) return true
                }

                return false
            })

            // Format tasks for display (matching PhasesPage structure)
            const formattedTasks = myTasks.map(t => {
                // Find if there is a submission for this task where THIS user is the TeamLeader (or involved)
                // Since Engineers might not be in teams in the same way, we check if ANY submission exists for this task
                // created by this user (TeamLeaderId) OR linked to their team.
                // For simplicity, let's check TeamLeaderId == CURRENT_USER_ID first.

                const submission = allSubmissions.find(s =>
                    s.taskId === t.id && (s.teamLeaderId === CURRENT_USER_ID)
                )

                // Determine status
                let status = "Pending"
                let statusId = STATUS_CONSTANTS.TASK_PENDING
                let isPendingTask = false

                if (submission) {
                    statusId = submission.statusId
                    const effectiveIsLate = t.isLate || false
                    status = StatusHelpers.getStatusText(statusId, t.taskDeadline, false, effectiveIsLate, submission.createdAt || submission.submittedDate)
                } else {
                    isPendingTask = true
                    const clientLate = new Date(t.taskDeadline) < new Date()
                    const effectiveIsLate = t.isLate || clientLate
                    status = StatusHelpers.getStatusText(STATUS_CONSTANTS.TASK_PENDING, t.taskDeadline, true, effectiveIsLate)
                }

                return {
                    id: t.id,
                    title: t.taskName || t.TaskName,
                    description: t.taskDescription || t.TaskDescription,
                    deadline: t.taskDeadline || t.TaskDeadline,
                    gradeId: t.gradeId || t.GradeId,
                    weekNumber: t.weekNumber || t.WeekNumber || 1,
                    weekId: t.weekId || t.WeekId,
                    status: status,
                    statusId: statusId,
                    isPendingTask: isPendingTask,
                    isLate: t.isLate || false,
                    submission: submission,
                    // Raw data for details page
                    raw: t
                }
            })

            setTasks(formattedTasks)

        } catch (err) {
            console.error("Error loading my tasks:", err)
            showError("Failed to load your assigned tasks.")
        } finally {
            setLoading(false)
        }
    }

    const formatCairoDate = (dateString) => {
        if (!dateString) return "No deadline"
        try {
            const utcDate = parseISO(dateString)
            const cairoTime = new Date(utcDate.toLocaleString("en-US", { timeZone: "Africa/Cairo" }))
            return format(cairoTime, "MMM dd, yyyy, hh:mm a")
        } catch { return "Invalid date" }
    }

    const getStatusColor = (status) => {
        switch (status) {
            case "Completed": return "#38a169"
            case "Completed Late": return "#d69e2e"
            case "Completed Very Late": return "#b7791f"
            case "Submitted": return "#3182ce"
            case "Submitted On Time": return "#3182ce"
            case "Submitted Late": return "#e53e3e"
            case "Submitted Very Late": return "#c53030"
            case "Rejected": return "#e53e3e"
            case "Pending": return "#d69e2e"
            case "Late": return "#e53e3e"
            case "Deadline Passed": return "#e53e3e"
            default: return "#718096"
        }
    }

    const getStatusBgColor = (status) => getStatusColor(status) + '20'

    const getStatusIcon = (status) => {
        if (status.includes("Completed")) return <CheckCircle size={16} />
        if (status.includes("Submitted")) return <Upload size={16} />
        if (status === "Rejected") return <X size={16} />
        if (status === "Pending") return <Clock size={16} />
        return <AlertTriangle size={16} />
    }

    const handleDetailsClick = (task) => {
        // Construct data for TaskDetailsPage
        const taskData = {
            id: task.id,
            title: task.title,
            description: task.description,
            status: task.status,
            deadline: task.deadline,
            gradeId: task.gradeId,
            submission: task.submission,
            // Pass raw for extra safety
            ...task.raw
        }
        setSelectedTask(taskData)
        setCurrentPage("task-details")
    }

    const isWeekCompleted = (weekTasks) => {
        if (weekTasks.length === 0) return false
        return weekTasks.every(t => t.status.includes("Completed"))
    }

    const getWeekCompletionStatus = (weekTasks) => {
        if (weekTasks.length === 0) return "no-tasks"
        if (isWeekCompleted(weekTasks)) return "completed"
        return "in-progress"
    }

    return (
        <div className="phases-page"> {/* Reuse PhasesPage layout/CSS */}
            <div className="phases-page-header">
                <h1 className="phases-page-title">My Assigned Tasks</h1>
            </div>

            <div className="phases-weeks">
                <div className="phases-weeks-header">
                    <h2>Weekly Tasks Overview</h2>
                    <div className="current-week">{/* Current Week display removed */}</div>
                </div>

                {loading ? (
                    <div className="loading-container"><p>Loading tasks...</p></div>
                ) : tasks.length === 0 ? (
                    <div className="no-tasks">
                        <p>No tasks assigned to you yet.</p>
                    </div>
                ) : (
                    <div className="weeks-grid">
                        {weeks.map((week) => {
                            const weekTasks = tasks.filter(t => t.weekId === week.id)

                            const now = new Date()
                            const startDate = parseISO(week.startDate)
                            const endDate = parseISO(week.endDate)
                            const isCurrent = now >= startDate && now <= endDate

                            const completionStatus = getWeekCompletionStatus(weekTasks)
                            const isCompleted = completionStatus === "completed"

                            return (
                                <div key={week.id} className={`week-card ${isCurrent ? 'current-week' : ''} ${isCompleted ? 'completed-week' : ''}`}>
                                    <div className="week-header">
                                        <h3 className="week-title">
                                            {week.weekTitle}
                                            {isCurrent && <span className="current-badge">Current</span>}
                                            {isCompleted && <span className="completed-badge">✓ Completed</span>}
                                        </h3>
                                        <div className="week-dates">
                                            {format(startDate, 'MMM dd')} - {format(endDate, 'MMM dd, yyyy')}
                                        </div>
                                    </div>

                                    <div className="week-tasks">
                                        {weekTasks.length === 0 ? (
                                            <div className="week-empty">No tasks this week</div>
                                        ) : weekTasks.map(task => {
                                            const isLate = task.isLate || (new Date(task.deadline) < new Date() && task.isPendingTask)
                                            const showRedBorder = task.isPendingTask && isLate

                                            return (
                                                <div key={task.id} className={`week-task-item ${showRedBorder ? 'deadline-passed' : ''}`}>
                                                    <div className="week-task-content">
                                                        <div className="week-task-info">
                                                            <div className="week-task-header">
                                                                <h4 className="week-task-title">{task.title}</h4>
                                                            </div>
                                                            <p className="week-task-description">
                                                                {(task.description || '').slice(0, 100)}
                                                                {(task.description || '').length > 100 ? '...' : ''}
                                                            </p>
                                                            <div className="week-task-meta">
                                                                <div className="week-task-deadline">Deadline: {formatCairoDate(task.deadline)}</div>
                                                                <div className="week-task-status" style={{ padding: "5px", width: "110px", borderRadius: "5px", color: getStatusColor(task.status), backgroundColor: getStatusBgColor(task.status) }}>
                                                                    {getStatusIcon(task.status)} {task.status}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <button className="week-task-action" onClick={() => handleDetailsClick(task)}>Details</button>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}

export default MyAssignedTasksPage
