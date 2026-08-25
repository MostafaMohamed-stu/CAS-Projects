
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Plus, Trash2, Calendar, BookOpen, Loader2, X, User, CheckCircle, Github, FileText, ExternalLink, Edit2, CheckSquare, Square, Clock } from "lucide-react"
import { useNotification } from "../../contexts/NotificationContext"
import { API_BASE_URL } from '../../config/apiConfig.js';
import { axiosInstance } from '../../utils/authService';
import ConfirmationDialog from "../ConfirmationDialog/ConfirmationDialog"
import { format, parseISO } from "date-fns"
import { STATUS_CONSTANTS } from "../../utils/statusConstants"
import { isSuperAdmin, isCapstoneLead } from "../../utils/roleUtils"
import "../AdminTasksPage/AdminTasksPage.css" // Reuse CSS

const EngineersTasksPage = ({ currentUserId, user, setCurrentPage, setSelectedTask }) => {
    const { showSuccess, showError } = useNotification()

    // rawTasks stores the flat list from server
    const [rawTasks, setRawTasks] = useState([])
    // tasks stores the GROUPED tasks for display
    const [tasks, setTasks] = useState([])
    const [taskSubmissions, setTaskSubmissions] = useState([])
    const [weeks, setWeeks] = useState([]) // Store fetched weeks

    // Maintain separate lists for targeting
    const [capstoneLeads, setCapstoneLeads] = useState([])
    const [engineers, setEngineers] = useState([])

    // Combined map for name lookup
    const [userMap, setUserMap] = useState({})

    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [showAddForm, setShowAddForm] = useState(false)

    // Edit Mode State
    const [isEditing, setIsEditing] = useState(false)
    const [editingGroup, setEditingGroup] = useState(null) // Group being edited

    // User Selection State (Multi-select)
    const [selectedUserIds, setSelectedUserIds] = useState([])

    // Submissions Modal State
    const [showSubmissionsModal, setShowSubmissionsModal] = useState(false)
    const [selectedGroupForDetails, setSelectedGroupForDetails] = useState(null)

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [groupToDelete, setGroupToDelete] = useState(null)

    const CURRENT_USER_ID = currentUserId || user?.id

    const [formData, setFormData] = useState({
        taskName: "",
        taskDescription: "",
        taskDeadline: "",
        weekId: "",
        statusId: STATUS_CONSTANTS.TASK_PENDING,
    })

    const TASK_NAME_MAX_LENGTH = 100
    const TASK_DESCRIPTION_MAX_LENGTH = 500

    const PAGE_TITLE = (isSuperAdmin(user) && !isCapstoneLead(user)) ? "Capstone Leads Tasks" : "Engineers Tasks"
    const TARGET_ROLE_NAME = (isSuperAdmin(user) && !isCapstoneLead(user)) ? "Capstone Leads" : "Engineers"

    useEffect(() => {
        fetchData()
    }, [user, currentUserId])

    const fetchData = async () => {
        setLoading(true)
        try {
            const [tasksRes, submissionsRes, leadsRes, engRes, weeksRes] = await Promise.all([
                axiosInstance.get(`/AccountTask`),
                axiosInstance.get(`/TaskSubmissions`),
                axiosInstance.get(`/Account/ByRoleName/CapstoneLead`),
                axiosInstance.get(`/Account/ByRoleName/Engineer`),
                axiosInstance.get(`/Weeks?businessEntityName=CapstoneProject`)
            ])

            const leads = leadsRes.data?.$values || leadsRes.data || []
            const engs = engRes.data?.$values || engRes.data || []
            const weeksRaw = weeksRes.data
            const weeksData = Array.isArray(weeksRaw) ? weeksRaw : weeksRaw?.$values || []
            setWeeks(weeksData.sort((a, b) => a.id - b.id))

            setCapstoneLeads(leads)
            setEngineers(engs)

            // Build map for quick access
            const uMap = {}
            leads.forEach(u => uMap[u.id] = u)
            engs.forEach(u => uMap[u.id] = u)
            setUserMap(uMap)

            setTaskSubmissions(submissionsRes.data?.$values || submissionsRes.data || [])

            const tasksRawData = tasksRes.data?.$values || tasksRes.data || []

            // Filter: Show tasks that are explicitly assigned to a user AND belong to the target audience
            const isSuperAdminView = isSuperAdmin(user) && !isCapstoneLead(user)
            const targetIds = new Set((isSuperAdminView ? leads : engs).map(u => u.id))

            const filteredTasks = tasksRawData
                .filter(t => {
                    const aid = t.assignedToId || t.AssignedToId
                    return aid !== null && targetIds.has(aid)
                })
                .map((t) => ({
                    id: t.id ?? t.Id,
                    taskName: t.taskName ?? t.TaskName,
                    taskDescription: t.taskDescription ?? t.TaskDescription,
                    taskDeadline: t.taskDeadline ?? t.TaskDeadline,
                    weekNumber: t.weekNumber ?? t.WeekNumber,
                    weekId: t.weekId ?? t.WeekId,
                    weekTitle: t.weekTitle ?? t.WeekTitle,
                    statusId: t.statusId ?? t.StatusId,
                    assignedToId: t.assignedToId ?? t.AssignedToId,
                    adminAccountId: t.adminAccountId ?? t.AdminAccountId,
                }))

            setRawTasks(filteredTasks)

            // Group tasks by Name + Week (Assuming deadline is same for same task)
            const grouped = groupTasksAndAggregate(filteredTasks)
            setTasks(grouped)

        } catch (err) {
            console.error("Error loading data:", err)
            showError("Failed to load tasks.")
        } finally {
            setLoading(false)
        }
    }

    // Helper to group tasks
    const groupTasksAndAggregate = (flatTasks) => {
        const groups = {}

        flatTasks.forEach(task => {
            // Group by TaskName + WeekId for strict database alignment
            const key = `${task.taskName}-${task.weekId}`.toLowerCase().trim()

            if (!groups[key]) {
                groups[key] = {
                    ...task,
                    id: key,
                    weekId: task.weekId, // Explicitly preserve weekId
                    isGroup: true,
                    assignments: []
                }
            }

            groups[key].assignments.push({
                taskId: task.id,
                assignedToId: task.assignedToId,
                statusId: task.statusId
            })
        })

        return Object.values(groups)
    }

    const handleInputChange = (e) => {
        const { name, value } = e.target
        if (name === "taskName" && value.length > TASK_NAME_MAX_LENGTH) return
        if (name === "taskDescription" && value.length > TASK_DESCRIPTION_MAX_LENGTH) return
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const resetForm = () => {
        setFormData({
            taskName: "",
            taskDescription: "",
            taskDeadline: "",
            weekId: "",
            statusId: STATUS_CONSTANTS.TASK_PENDING,
        })
        setIsEditing(false)
        setEditingGroup(null)
        setSelectedUserIds([])
    }

    const handleEditGroup = (group) => {
        setFormData({
            taskName: group.taskName,
            taskDescription: group.taskDescription,
            taskDeadline: group.taskDeadline ? new Date(group.taskDeadline).toISOString().slice(0, 16) : "",
            weekId: group.weekId,
            statusId: group.statusId,
        })

        // Populate selected users based on current assignments
        const assignedUsers = group.assignments.map(a => a.assignedToId)
        setSelectedUserIds(assignedUsers)

        setEditingGroup(group)
        setIsEditing(true)
        setShowAddForm(true)
    }

    const toggleUserSelection = (userId) => {
        setSelectedUserIds(prev => {
            if (prev.includes(userId)) return prev.filter(id => id !== userId)
            return [...prev, userId]
        })
    }

    const handleSelectAll = (users) => {
        if (selectedUserIds.length === users.length) {
            setSelectedUserIds([])
        } else {
            setSelectedUserIds(users.map(u => u.id))
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSubmitting(true)

        // Validate against dynamic week data
        const selectedWeek = weeks.find(w => String(w.id) === String(formData.weekId))
        if (selectedWeek) {
            const d = new Date(formData.taskDeadline);
            const start = parseISO(selectedWeek.startDate);
            // Allow same day? Usually deadline should be > start. 
            // Let's just ensure it's not way before.
            if (d < start) {
                showError("Invalid Deadline", "Deadline cannot be before the start of the selected week.");
                setSubmitting(false);
                return;
            }
        }

        if (selectedUserIds.length === 0) {
            showError("Please select at least one user.")
            setSubmitting(false)
            return
        }

        try {
            if (isEditing) {
                // Determine changes in assignments
                const currentAssignments = editingGroup.assignments
                const currentAssignedUsers = currentAssignments.map(a => a.assignedToId)

                // Users to ADD (in selected but not in current)
                const usersToAdd = selectedUserIds.filter(uid => !currentAssignedUsers.includes(uid))

                // Users to REMOVE (in current but not in selected)
                const usersToRemove = currentAssignedUsers.filter(uid => !selectedUserIds.includes(uid))

                // Users to UPDATE (in both - update task details)
                const usersToUpdate = currentAssignedUsers.filter(uid => selectedUserIds.includes(uid))

                const promises = []

                // 1. Update existing tasks
                usersToUpdate.forEach(uid => {
                    const assignment = currentAssignments.find(a => a.assignedToId === uid)
                    if (assignment) {
                        const taskData = {
                            Id: assignment.taskId,
                            TaskName: formData.taskName,
                            TaskDescription: formData.taskDescription,
                            TaskDeadline: new Date(formData.taskDeadline).toISOString(),
                            GradeId: null,
                            ClassId: null,
                            TeamId: null,
                            WeekId: Number(formData.weekId),
                            StatusId: assignment.statusId, // Keep status
                            AdminAccountId: CURRENT_USER_ID,
                            AssignedToId: uid
                        }
                        promises.push(axiosInstance.put(`/AccountTask/${assignment.taskId}`, taskData))
                    }
                })

                // 2. Remove unselected tasks
                usersToRemove.forEach(uid => {
                    const assignment = currentAssignments.find(a => a.assignedToId === uid)
                    if (assignment) {
                        promises.push(axiosInstance.delete(`/AccountTask/${assignment.taskId}`))
                    }
                })

                // 3. Create new tasks
                usersToAdd.forEach(uid => {
                    const taskData = {
                        TaskName: formData.taskName,
                        TaskDescription: formData.taskDescription,
                        TaskDeadline: new Date(formData.taskDeadline).toISOString(),
                        GradeId: null,
                        ClassId: null,
                        TeamId: null,
                        WeekId: Number(formData.weekId),
                        StatusId: Number(formData.statusId),
                        AdminAccountId: CURRENT_USER_ID,
                        AssignedToId: uid
                    }
                    promises.push(axiosInstance.post(`/AccountTask`, taskData))
                })

                await Promise.all(promises)
                showSuccess("Task updated successfully.")

            } else {
                // Bulk Create Logic (Assign to SELECTED users)
                const createPromises = selectedUserIds.map(userId => {
                    const taskData = {
                        TaskName: formData.taskName,
                        TaskDescription: formData.taskDescription,
                        TaskDeadline: new Date(formData.taskDeadline).toISOString(),
                        GradeId: null,
                        ClassId: null,
                        TeamId: null,
                        WeekId: Number(formData.weekId),
                        StatusId: Number(formData.statusId),
                        AdminAccountId: CURRENT_USER_ID,
                        AssignedToId: userId
                    }
                    return axiosInstance.post(`/AccountTask`, taskData)
                })

                await Promise.all(createPromises)
                showSuccess(`Task assigned to ${selectedUserIds.length} users.`)
            }

            resetForm()
            setShowAddForm(false)
            fetchData()
        } catch (err) {
            console.error(err)
            showError("Operation failed.")
        } finally {
            setSubmitting(false)
        }
    }

    const handleDeleteGroup = async (group) => {
        setGroupToDelete(group)
        setShowDeleteConfirm(true)
    }

    const confirmDelete = async () => {
        try {
            const deletePromises = groupToDelete.assignments.map(a => axiosInstance.delete(`/AccountTask/${a.taskId}`))
            await Promise.all(deletePromises)
            showSuccess("Assignments Deleted")
            fetchData()
        } catch {
            showError("Delete Failed")
        } finally {
            setShowDeleteConfirm(false)
            setGroupToDelete(null)
        }
    }

    const handleViewDetails = (group) => {
        setSelectedGroupForDetails(group)
        setShowSubmissionsModal(true)
    }

    const formatDate = (dateString) => {
        if (!dateString) return "No Deadline";
        try { return format(parseISO(dateString), "MMM dd, hh:mm a") } catch { return "Invalid Date" }
    }

    const getUserName = (id) => {
        const u = userMap[id]
        return u ? (u.fullNameEn || u.email) : `User ${id}`
    }

    const isSubmissionCompleted = (statusId) => {
        return String(statusId) === String(STATUS_CONSTANTS.TASK_SUBMITTED_ON_TIME) ||
            String(statusId) === String(STATUS_CONSTANTS.TASK_SUBMITTED_LATE) ||
            String(statusId) === String(STATUS_CONSTANTS.TASK_COMPLETED) ||
            String(statusId) === String(STATUS_CONSTANTS.TASK_COMPLETED_LATE);
    }

    const getSubmissionForTask = (taskId) => {
        return taskSubmissions.find(s => s.taskId === taskId)
    }

    // Target users for display
    const targetUsersList = (isSuperAdmin(user) && !isCapstoneLead(user)) ? capstoneLeads : engineers

    return (
        <div className="admin-tasks-page">
            <div className="admin-tasks-header">
                <div className="admin-tasks-header-content">
                    <h1 className="admin-tasks-title">{PAGE_TITLE}</h1>
                    <p className="admin-tasks-subtitle">Assign tasks to {TARGET_ROLE_NAME}</p>
                </div>
                <div className="admin-tasks-header-buttons">
                    <button className="admin-tasks-add-task-button" onClick={() => { resetForm(); setShowAddForm(true) }}>
                        <Plus size={20} /> Assign New Task
                    </button>
                </div>
            </div>

            {/* Create/Edit Task Modal */}
            {showAddForm && (
                <div className="admin-tasks-task-form-overlay">
                    <div className="admin-tasks-task-form-modal">
                        <div className="admin-tasks-form-header">
                            <h2>{isEditing ? "Edit Assignment" : `Assign Task to ${TARGET_ROLE_NAME}`}</h2>
                            <button className="admin-tasks-close-button" onClick={() => setShowAddForm(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="admin-tasks-task-form">

                            {/* User Selection - Editable in both modes now */}
                            <div className="admin-tasks-form-group">
                                <label className="admin-tasks-form-label">Select Assignees ({selectedUserIds.length}) *</label>
                                <div style={{
                                    border: '2px solid #e2e8f0',
                                    borderRadius: '8px',
                                    maxHeight: '150px',
                                    overflowY: 'auto',
                                    padding: '5px'
                                }}>
                                    {targetUsersList.length > 0 && (
                                        <div style={{
                                            padding: '8px 12px',
                                            borderBottom: '1px solid #e2e8f0',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            fontWeight: '600',
                                            cursor: 'pointer',
                                            backgroundColor: '#f8fafc'
                                        }} onClick={() => handleSelectAll(targetUsersList)}>
                                            {selectedUserIds.length === targetUsersList.length ? <CheckSquare size={16} color="#e53e3e" /> : <Square size={16} color="#cbd5e0" />}
                                            Select All
                                        </div>
                                    )}
                                    {targetUsersList.map(u => (
                                        <div key={u.id} style={{
                                            padding: '8px 12px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            cursor: 'pointer',
                                            transition: 'background 0.2s'
                                        }} onClick={() => toggleUserSelection(u.id)}>
                                            {selectedUserIds.includes(u.id) ?
                                                <CheckSquare size={16} color="#e53e3e" /> :
                                                <Square size={16} color="#cbd5e0" />
                                            }
                                            <span>{u.fullNameEn || u.email}</span>
                                        </div>
                                    ))}
                                </div>
                                {targetUsersList.length === 0 && <p style={{ fontSize: '12px', color: '#e53e3e' }}>No users found.</p>}
                            </div>

                            <div className="admin-tasks-form-group">
                                <label className="admin-tasks-form-label">Task Name *</label>
                                <input name="taskName" className="admin-tasks-form-input" value={formData.taskName} onChange={handleInputChange} required />
                            </div>

                            <div className="admin-tasks-form-group">
                                <label className="admin-tasks-form-label">Description *</label>
                                <textarea name="taskDescription" className="admin-tasks-form-textarea" value={formData.taskDescription} onChange={handleInputChange} required />
                            </div>

                            <div className="admin-tasks-form-group">
                                <label className="admin-tasks-form-label">Week *</label>
                                <select name="weekId" className="admin-tasks-form-select" value={formData.weekId} onChange={handleInputChange} required>
                                    <option value="">Select a week</option>
                                    {weeks.map(week => <option key={week.id} value={week.id}>{week.weekTitle}</option>)}
                                </select>
                            </div>

                            <div className="admin-tasks-form-group">
                                <label className="admin-tasks-form-label">Deadline *</label>
                                <input type="datetime-local" name="taskDeadline" className="admin-tasks-form-input" value={formData.taskDeadline} onChange={handleInputChange} required />
                            </div>

                            <div className="admin-tasks-form-actions">
                                <button type="button" className="admin-tasks-cancel-button" onClick={() => setShowAddForm(false)}>Cancel</button>
                                <button type="submit" className="admin-tasks-submit-button" disabled={submitting}>
                                    {submitting ? <Loader2 className="animate-spin" /> : (isEditing ? "Update Assignment" : `Assign to ${selectedUserIds.length} Users`)}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Task Details & Submissions Modal */}
            {showSubmissionsModal && selectedGroupForDetails && (
                <div className="admin-tasks-task-form-overlay">
                    <div className="admin-tasks-task-form-modal" style={{ maxWidth: '700px', width: '90%' }}>
                        <div className="admin-tasks-form-header">
                            <div>
                                <h2 style={{ fontSize: '18px' }}>{selectedGroupForDetails.taskName}</h2>
                                <span style={{ fontSize: '13px', color: '#718096' }}> Assigned to {selectedGroupForDetails.assignments.length} users</span>
                            </div>
                            <button className="admin-tasks-close-button" onClick={() => setShowSubmissionsModal(false)}><X size={20} /></button>
                        </div>
                        <div className="admin-tasks-submissions-list">
                            {selectedGroupForDetails.assignments.map(assign => {
                                const submission = getSubmissionForTask(assign.taskId)
                                const isCompleted = submission && isSubmissionCompleted(submission.statusId)

                                return (
                                    <div key={assign.taskId} className={`admin-tasks-submission-card ${isCompleted ? 'completed' : ''}`}>
                                        <div className="admin-tasks-submission-header">
                                            <div className="admin-tasks-submission-user">
                                                <User size={18} /> {getUserName(assign.assignedToId)}
                                            </div>
                                            {isCompleted ? (
                                                <div className="admin-tasks-submission-status completed">
                                                    <CheckCircle size={12} /> Submitted
                                                </div>
                                            ) : (
                                                <div className="admin-tasks-submission-status" style={{ backgroundColor: '#f3f4f6', color: '#6b7280' }}>
                                                    <Clock size={12} /> Pending
                                                </div>
                                            )}
                                        </div>

                                        {isCompleted && (
                                            <div className="admin-tasks-submission-content">
                                                {submission.note && (
                                                    <div className="admin-tasks-submission-note">
                                                        <h4>Note:</h4>
                                                        {submission.note}
                                                    </div>
                                                )}

                                                {submission.glink && (
                                                    <div style={{ marginTop: '8px' }}>
                                                        <a href={submission.glink} target="_blank" rel="noopener noreferrer" className="admin-tasks-submission-link-btn">
                                                            <ExternalLink size={16} /> Open Link
                                                        </a>
                                                        <div style={{ fontSize: '12px', color: '#718096', marginTop: '6px', marginLeft: '4px', wordBreak: 'break-all' }}>
                                                            {submission.glink}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            )}

            <div className="admin-tasks-calendar-content">
                {loading ? <Loader2 className="animate-spin" /> : (
                    <div className="admin-tasks-weeks-grid">
                        {weeks.map(week => {
                            const weekTasks = tasks.filter(g => g.weekId === week.id)
                            if (weekTasks.length === 0) return null

                            return (
                                <div key={week.id} className="admin-tasks-week-card">
                                    <div className="admin-tasks-week-header"><h3>{week.weekTitle}</h3></div>
                                    <div className="admin-tasks-week-tasks">
                                        {weekTasks.map(group => {
                                            // Count submissions in this group
                                            const submittedCount = group.assignments.filter(a => {
                                                const sub = getSubmissionForTask(a.taskId)
                                                return sub && isSubmissionCompleted(sub.statusId)
                                            }).length
                                            const totalCount = group.assignments.length
                                            const allSubmitted = totalCount > 0 && submittedCount === totalCount
                                            const someSubmitted = submittedCount > 0

                                            return (
                                                <div key={group.id} className="admin-tasks-week-task-item"
                                                    style={allSubmitted ? {
                                                        borderLeft: '4px solid #10b981',
                                                        backgroundColor: '#f0fdf4'
                                                    } : {}}>
                                                    <div className="admin-tasks-week-task-content">
                                                        <div className="admin-tasks-week-task-header">
                                                            <h4 className="admin-tasks-week-task-title">{group.taskName}</h4>
                                                        </div>

                                                        <div className="admin-tasks-week-task-meta">
                                                            <div className="admin-tasks-week-task-grade">
                                                                <User size={14} /> Assigned to {totalCount} users
                                                            </div>
                                                            <div className="admin-tasks-week-task-deadline">
                                                                <Calendar size={14} /> {formatDate(group.taskDeadline)}
                                                            </div>
                                                            {someSubmitted && (
                                                                <div style={{ color: allSubmitted ? '#059669' : '#d97706', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                                                    <CheckCircle size={12} /> {submittedCount}/{totalCount} Submitted
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="admin-tasks-week-task-actions">
                                                        <button onClick={() => handleViewDetails(group)} className="admin-tasks-task-action-btn admin-tasks-edit-btn" style={{
                                                            backgroundColor: allSubmitted ? '#10b981' : 'white',
                                                            color: allSubmitted ? 'white' : '#3182ce',
                                                            borderColor: allSubmitted ? '#059669' : '#e2e8f0'
                                                        }}>
                                                            <BookOpen size={16} /> <span>Details</span>
                                                        </button>
                                                        <button onClick={() => handleEditGroup(group)} className="admin-tasks-task-action-btn admin-tasks-edit-btn">
                                                            <Edit2 size={16} />
                                                        </button>
                                                        <button onClick={() => handleDeleteGroup(group)} className="admin-tasks-task-action-btn admin-tasks-delete-btn">
                                                            <Trash2 size={16} />
                                                        </button>
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

            <ConfirmationDialog
                isOpen={showDeleteConfirm}
                title="Delete Assignment Group"
                message="This will delete the task for ALL assigned users. Are you sure?"
                onConfirm={confirmDelete}
                onCancel={() => setShowDeleteConfirm(false)}
                type="danger"
            />
        </div>
    )
}

export default EngineersTasksPage
