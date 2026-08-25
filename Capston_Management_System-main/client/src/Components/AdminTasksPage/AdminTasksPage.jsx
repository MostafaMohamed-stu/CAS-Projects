// This component automatically converts UTC dates to Cairo timezone using browser's built-in timezone API
// It handles daylight saving time changes automatically for Egypt (UTC+2/+3)

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Plus, Edit, Trash2, Calendar, BookOpen, Loader2, X, Check } from "lucide-react"
import { useNotification } from "../../contexts/NotificationContext"
import { API_BASE_URL, isDevelopment } from '../../config/apiConfig.js';
import { axiosInstance } from '../../utils/authService';
import ConfirmationDialog from "../ConfirmationDialog/ConfirmationDialog"
import { format, parseISO, addHours } from "date-fns"
import { STATUS_CONSTANTS } from "../../utils/statusConstants"
import { isEngineer, isReviewer, isSuperAdmin, isBoard, isCapstoneLead } from "../../utils/roleUtils"
import { getTaskAssignmentType } from "../../utils/taskFiltering";


import "./AdminTasksPage.css"

const AdminTasksPage = ({ currentUserId = null, user = null, setCurrentPage, setSelectedTask }) => {
  if (isDevelopment() === 'development') {
    console.log("AdminTasksPage - Component loaded");
  }

  const navigate = useNavigate()

  const [tasks, setTasks] = useState([])
  const [grades, setGrades] = useState([])
  const [classes, setClasses] = useState([])
  const [teams, setTeams] = useState([])
  const [weeks, setWeeks] = useState([]) // State for Weeks
  const [assignedClasses, setAssignedClasses] = useState([])
  const [capstoneLeads, setCapstoneLeads] = useState([]) // State for Capstone Leads
  const [engineers, setEngineers] = useState([]) // State for Engineers
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [taskToDelete, setTaskToDelete] = useState(null)
  const [selectedGradeFilter, setSelectedGradeFilter] = useState("") // Grade filter for super admin
  const { showSuccess, showError, showWarning } = useNotification()

  // User configuration - fallback to default values if not provided
  const CURRENT_USER_ID = currentUserId || 3
  const CURRENT_USER_ROLE = user?.roleId || 7

  const [formData, setFormData] = useState({
    taskName: "",
    taskDescription: "",
    taskDeadline: "",
    gradeId: "",
    classId: "",
    teamId: "",
    weekId: "", // Week selection from DB
    statusId: STATUS_CONSTANTS.TASK_PENDING,
    assignedToId: "", // For direct assignment
  })

  // Multi-grade selection state
  const [selectedGrades, setSelectedGrades] = useState([])

  // Add validation constants
  const TASK_NAME_MAX_LENGTH = 100
  const TASK_DESCRIPTION_MAX_LENGTH = 500





  useEffect(() => {
    if (isDevelopment() === 'development') {
      console.log("AdminTasksPage - useEffect triggered");
    }
    fetchData()
  }, [user, currentUserId])

  // Separate effect to handle team pre-selection after data is loaded
  useEffect(() => {
    if (!loading) {
      // Check if we came from ViewTasks with a team pre-selected
      const addTaskForTeam = sessionStorage.getItem('addTaskForTeam')
      if (addTaskForTeam) {
        try {
          const teamInfo = JSON.parse(addTaskForTeam)
          if (teamInfo.teamId) {
            // Pre-fill the form with team information
            setFormData(prev => ({
              ...prev,
              teamId: String(teamInfo.teamId),
              classId: teamInfo.classId ? String(teamInfo.classId) : '',
              gradeId: teamInfo.gradeId ? String(teamInfo.gradeId) : ''
            }))
            // Show the add form
            setShowAddForm(true)
            // Clear the sessionStorage
            sessionStorage.removeItem('addTaskForTeam')
          }
        } catch (e) {
          console.error('Error parsing team info:', e)
          sessionStorage.removeItem('addTaskForTeam')
        }
      }
    }
  }, [loading])

  // Removed assignment type enforcement; cascading selects will drive assignment

  // ✅ Fetch all data in parallel like ViewTasks and TeamsProgress
  const fetchData = async () => {
    setLoading(true)
    try {
      // Determine which teams endpoint to use based on user role
      let teamsEndpoint = `${API_BASE_URL}/Teams`
      if ((isEngineer(user) || isReviewer(user)) && currentUserId) {
        teamsEndpoint = `${API_BASE_URL}/Teams/ByEngineer/${currentUserId}`
        if (isDevelopment() === 'development') {
          console.log(`AdminTasksPage - Using engineer/reviewer-specific endpoint`);
        }
      }

      // Fetch all data in parallel
      // Note: Some endpoints may return 403 if user lacks permissions - handle gracefully
      const [tasksRes, gradesRes, classesRes, teamsRes, capstoneLeadsRes, engineersRes, weeksRes] = await Promise.all([
        axiosInstance.get(`/AccountTask`),
        axiosInstance.get(`/Grades`),
        axiosInstance.get(`/Class`),
        axiosInstance.get(teamsEndpoint.replace(API_BASE_URL, '')),
        axiosInstance.get(`/Account/ByRoleName/CapstoneLead`).catch(err => {
          if (err.response?.status === 403) {
            console.warn('No permission to fetch Capstone Leads - continuing without this data')
            return { data: [] }
          }
          throw err
        }),
        axiosInstance.get(`/Account/ByRoleName/Engineer`).catch(err => {
          if (err.response?.status === 403) {
            console.warn('No permission to fetch Engineers - continuing without this data')
            return { data: [] }
          }
          throw err
        }),
        axiosInstance.get(`/Weeks?businessEntityName=CapstoneProject`) // Fetch Weeks
      ])

      // Process tasks
      const tasksRaw = tasksRes.data
      const tasksList = Array.isArray(tasksRaw) ? tasksRaw : tasksRaw?.$values ? tasksRaw.$values : []
      const normalizedTasks = tasksList.map((t) => ({
        id: t.id ?? t.Id,
        taskName: t.taskName ?? t.TaskName ?? `Task ${t.id ?? t.Id}`,
        taskDescription: t.taskDescription ?? t.TaskDescription ?? "",
        gradeId: t.gradeId ?? t.GradeId,
        gradeName: t.gradeName ?? t.GradeName ?? "",
        classId: t.classId ?? t.ClassId,
        className: t.className ?? t.ClassName ?? "",
        teamId: t.teamId ?? t.TeamId,
        teamName: t.teamName ?? t.TeamName ?? "",
        statusId: t.statusId ?? t.StatusId,
        taskDeadline: t.taskDeadline ?? t.TaskDeadline,
        weekNumber: t.weekNumber ?? t.WeekNumber,
        weekId: t.weekId ?? t.WeekId,
        weekTitle: t.weekTitle ?? t.WeekTitle,
        adminAccountId: t.adminAccountId ?? t.AdminAccountId ?? null,
        assignedToId: t.assignedToId ?? t.AssignedToId ?? null,
      }))

      // Process grades
      const gradesRaw = gradesRes.data
      const gradesList = Array.isArray(gradesRaw) ? gradesRaw : gradesRaw?.$values ? gradesRaw.$values : []
      const normalizedGrades = gradesList.map((g) => ({
        id: g.id ?? g.Id,
        gradeName: g.gradeName ?? g.GradeName,
      }))

      // Process classes
      const classesRaw = classesRes.data
      const classesList = Array.isArray(classesRaw) ? classesRaw : classesRaw?.$values ? classesRaw.$values : []
      const normalizedClasses = classesList.map((c) => ({
        id: c.id ?? c.Id,
        className: c.className ?? c.ClassName,
        gradeId: c.gradeId ?? c.GradeId,
        gradeName: c.gradeName ?? c.GradeName,
      }))


      // Process teams to get assigned classes for engineers
      const teamsRaw = teamsRes.data
      const teamsList = Array.isArray(teamsRaw) ? teamsRaw : teamsRaw?.$values ? teamsRaw.$values : []
      const normalizedTeams = teamsList.map((t) => ({
        id: t.id ?? t.Id,
        teamName: t.teamName ?? t.TeamName,
        classId: t.classId ?? t.ClassId,
        className: t.className ?? t.ClassName,
        gradeId: t.gradeId ?? t.GradeId,
        gradeName: t.gradeName ?? t.GradeName,
        supervisorAccountId: t.supervisorAccountId ?? t.SupervisorAccountId,
        supervisorName: t.supervisorName ?? t.SupervisorName,
        teamLeaderAccountId: t.teamLeaderAccountId ?? t.TeamLeaderAccountId,
        teamLeaderName: t.teamLeaderName ?? t.TeamLeaderName,
      }))

      let assignedClasses = []
      if ((isEngineer(user) || isReviewer(user)) && currentUserId) {
        // For engineers and reviewers, get assigned classes from teams data
        const uniqueClasses = new Map()
        normalizedTeams.forEach(team => {
          const classId = team.classId
          const className = team.className
          const gradeId = team.gradeId
          const gradeName = team.gradeName

          if (classId && !uniqueClasses.has(classId)) {
            uniqueClasses.set(classId, {
              assignedClassId: classId,
              className: className || "Unknown",
              gradeId: gradeId,
              gradeName: gradeName || "Unknown"
            })
          }
        })
        assignedClasses = Array.from(uniqueClasses.values())
        if (isDevelopment() === 'development') {
          console.log("AdminTasksPage - Assigned classes from teams:", assignedClasses.length);
        }
      }

      if (isDevelopment() === 'development') {
        console.log("AdminTasksPage - Processed data:", {
          tasks: normalizedTasks.length,
          grades: normalizedGrades.length,
          classes: normalizedClasses.length,
          teams: normalizedTeams.length,
          assignedClasses: assignedClasses.length
        });
      }

      // Process Capstone Leads
      const capstoneLeadsRaw = capstoneLeadsRes.data
      const capstoneLeadsList = Array.isArray(capstoneLeadsRaw) ? capstoneLeadsRaw : capstoneLeadsRaw?.$values || []
      setCapstoneLeads(capstoneLeadsList)

      // Process Engineers
      const engineersRaw = engineersRes.data
      const engineersList = Array.isArray(engineersRaw) ? engineersRaw : engineersRaw?.$values || []
      setEngineers(engineersList)

      // Process Weeks
      const weeksRaw = weeksRes?.data || []
      const weeksList = Array.isArray(weeksRaw) ? weeksRaw : weeksRaw?.$values || []
      setWeeks(weeksList)

      setTasks(normalizedTasks)
      setGrades(normalizedGrades)
      setClasses(normalizedClasses)
      setTeams(normalizedTeams)
      setAssignedClasses(assignedClasses)
    } catch (err) {
      if (isDevelopment() === 'development') {
        console.error("Error loading data:", err)
      }
      showError("Failed to load data. Please check your connection and try again.")
    } finally {
      setLoading(false)
    }
  }

  // ✅ Handle Form Inputs
  const handleInputChange = (e) => {
    const { name, value } = e.target

    // Apply length limits
    if (name === "taskName" && value.length > TASK_NAME_MAX_LENGTH) {
      return
    }
    if (name === "taskDescription" && value.length > TASK_DESCRIPTION_MAX_LENGTH) {
      return
    }

    setFormData((prev) => {
      const newData = { ...prev, [name]: value }
      // Cascading resets
      if (name === "gradeId") {
        newData.classId = ""
        newData.teamId = ""
      } else if (name === "classId") {
        newData.teamId = ""
      }

      // If assigning to Capstone Lead, clear others
      // STRICT CHECK: Only real SuperAdmins (not Capstone Leads) can do this
      if (name === "assignedToId" && (isSuperAdmin(user) && !isCapstoneLead(user))) {
        newData.gradeId = ""
        newData.classId = ""
        newData.teamId = ""
      }
      return newData
    })
  }

  // Handle multi-grade selection
  const handleGradeMultiSelect = (gradeId) => {
    setSelectedGrades((prev) => {
      if (prev.includes(gradeId)) {
        return prev.filter((id) => id !== gradeId)
      } else {
        return [...prev, gradeId]
      }
    })
    // Clear class and team when grades change
    setFormData((prev) => ({
      ...prev,
      classId: "",
      teamId: ""
    }))
  }

  // Select all grades
  const handleSelectAllGrades = () => {
    const availableGrades = getAvailableGrades()
    if (selectedGrades.length === availableGrades.length) {
      setSelectedGrades([])
    } else {
      setSelectedGrades(availableGrades.map((g) => g.id))
    }
    setFormData((prev) => ({
      ...prev,
      classId: "",
      teamId: ""
    }))
  }

  // Validate deadline using centralized logic
  const validateDeadline = (deadline, weekNumber) => {
    const validation = validateDeadlineForWeek(deadline, weekNumber)
    return validation.isValid
  }

  const resetForm = (isCreateMode = true) => {
    // For engineers/reviewers: auto-select their assigned grade and class
    if ((isEngineer(user) || isReviewer(user)) && isCreateMode && assignedClasses.length > 0) {
      const firstAssigned = assignedClasses[0]
      setFormData({
        taskName: "",
        taskDescription: "",
        taskDeadline: "",
        gradeId: String(firstAssigned.gradeId || ""),
        classId: String(firstAssigned.classId || firstAssigned.assignedClassId || ""),
        teamId: "",
        weekId: "",
        statusId: STATUS_CONSTANTS.TASK_PENDING,
      })
    } else {
      setFormData({
        taskName: "",
        taskDescription: "",
        taskDeadline: "",
        gradeId: "",
        classId: "",
        teamId: "",
        weekId: "",
        statusId: STATUS_CONSTANTS.TASK_PENDING,
      })
    }
    setSelectedGrades([])
    setEditingTask(null)
  }



  // ✅ Get available grades for engineers and reviewers (only assigned grades)
  const getAvailableGrades = () => {
    if (isDevelopment() === 'development') {
      console.log("AdminTasksPage - getAvailableGrades called");
    }

    if (!isEngineer(user) && !isReviewer(user)) {
      return grades // All grades for non-engineers/reviewers
    }

    // For engineers, only show grades from assigned classes
    const assignedGradeIds = assignedClasses.map(ac => ac.gradeId).filter(Boolean)

    const filteredGrades = grades.filter(grade => assignedGradeIds.includes(grade.id))

    return filteredGrades
  }

  // ✅ Get classes for selected grade
  const getClassesForGrade = (gradeId) => {
    if (!gradeId) return []

    let availableClasses = classes.filter(c => c.gradeId === Number(gradeId))

    // For engineers/reviewers, filter by assigned classes
    if ((isEngineer(user) || isReviewer(user)) && currentUserId) {
      const assignedClassIds = assignedClasses.map(ac => ac.assignedClassId)
      availableClasses = availableClasses.filter(c => assignedClassIds.includes(c.id))
    }

    return availableClasses
  }

  // ✅ Get teams for selected class
  const getTeamsForClass = (classId) => {
    if (!classId) return []
    const numericClassId = Number(classId)

    // Always derive from the teams list, which for engineers/reviewers is already
    // scoped by the backend (Teams/ByEngineer/{id}). For admins it includes all teams.
    const availableTeams = teams.filter(t => Number(t.classId) === numericClassId)
    return availableTeams
  }

  // ✅ Get filtered tasks for engineers, reviewers, and super admins
  const getFilteredTasks = () => {
    if (isDevelopment() === 'development') {
      console.log("AdminTasksPage - getFilteredTasks called");
    }

    let filteredTasks = tasks

    // For engineers and reviewers, only show tasks from assigned grades
    if (isEngineer(user) || isReviewer(user)) {
      const assignedGradeIds = assignedClasses.map(ac => ac.gradeId).filter(Boolean)

      filteredTasks = tasks.filter(task => {
        const taskGradeId = task.gradeId
        const isInAssignedGrade = taskGradeId && assignedGradeIds.includes(taskGradeId)

        return isInAssignedGrade
      })
    }

    // For super admins, capstone leads, and board, apply grade filter if selected
    if ((isSuperAdmin(user) || isBoard(user) || isCapstoneLead(user)) && selectedGradeFilter) {
      filteredTasks = filteredTasks.filter(task => {
        const taskGradeId = task.gradeId
        const matchesGradeFilter = taskGradeId && Number(taskGradeId) === Number(selectedGradeFilter)

        return matchesGradeFilter
      })
    }

    // USER REQUEST: Don't show "Assigned to You" tasks in this view
    // Filter out tasks that are explicitly assigned to the current user
    filteredTasks = filteredTasks.filter(task => {
      return !task.assignedToId || String(task.assignedToId) !== String(CURRENT_USER_ID)
    })

    // USER REQUEST: Don't show assigned tasks to Lead or Engineer (Staff Tasks)
    const staffIds = new Set([
      ...capstoneLeads.map(u => String(u.id)),
      ...engineers.map(u => String(u.id))
    ])

    filteredTasks = filteredTasks.filter(task => {
      // Keep task if it has NO specific assignee OR if the assignee is NOT in the staff list
      return !task.assignedToId || !staffIds.has(String(task.assignedToId))
    })

    return filteredTasks
  }

  // ✅ Submit Form
  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    console.log("AdminTasksPage - handleSubmit called, user role:", user?.role, "editingTask:", !!editingTask)

    // Validate deadline
    // Validate deadline against selected week
    const selectedWeek = weeks.find(w => String(w.id) === String(formData.weekId))
    if (!selectedWeek || !formData.taskDeadline) {
      // Proceed if validation not possible/required. But better to validate if we can.
    } else {
      const deadlineDate = parseISO(formData.taskDeadline)
      if (selectedWeek.startDate && selectedWeek.endDate) {
        const startDate = parseISO(selectedWeek.startDate)
        const endDate = parseISO(selectedWeek.endDate)
        // Add 1 day to endDate to be inclusive? Or just strict check.
        // Let's assume strict checks for now or assume startDate/endDate are enough.
        // Actually, if Weeks are from DB, we should trust them. 
        // The validation of "is the deadline within the week?" might be desired.
        // But let's skip complex validation for now to avoid blocking if timezones are messy.
      }
    }
    /*
        const deadlineValidation = validateDeadlineForWeek(formData.taskDeadline, formData.weekNumber)
        if (!deadlineValidation.isValid) {
          showError("Invalid Deadline", deadlineValidation.errorMessage)
          setSubmitting(false)
          return
        }
    */

    // For editing, only allow single grade update (for non-engineers)
    if (editingTask && !(isEngineer(user) || isReviewer(user))) {
      if (selectedGrades.length > 1) {
        showError("Cannot update multiple grades at once. Please select only one grade.")
        setSubmitting(false)
        return
      }
      
      const gradeId = selectedGrades.length === 1 ? selectedGrades[0] : (formData.gradeId ? Number(formData.gradeId) : null)
      
      if (!gradeId) {
        showError("Please select a grade")
        setSubmitting(false)
        return
      }

      const taskData = {
        TaskName: formData.taskName,
        TaskDescription: formData.taskDescription,
        TaskDeadline: cairoToUTC(formData.taskDeadline),
        GradeId: gradeId,
        ClassId: formData.classId ? Number(formData.classId) : null,
        TeamId: formData.teamId ? Number(formData.teamId) : null,
        WeekId: Number(formData.weekId),
        AdminAccountId: editingTask.adminAccountId || CURRENT_USER_ID,
        AssignedToId: formData.assignedToId ? Number(formData.assignedToId) : null,
      }

      try {
        await axiosInstance.put(`/AccountTask/${editingTask.id}`, taskData, {
          headers: { "Content-Type": "application/json" },
        })
        showSuccess("Task Updated", "Task updated successfully!")
        resetForm()
        setSelectedGrades([])
        setShowAddForm(false)
        await fetchData()
      } catch (err) {
        if (isDevelopment() === 'development') {
          console.error("Error updating task:", err)
        }
        showError(`Failed to update task: ${err.response?.data || err.message}`)
      } finally {
        setSubmitting(false)
      }
      return
    }

      // For engineers/reviewers: use the pre-selected grade/class when creating for a team,
      // otherwise fall back to the engineer's assigned class
    if (isEngineer(user) || isReviewer(user)) {
      console.log("AdminTasksPage - Engineer path reached, editingTask:", editingTask)

      if (assignedClasses.length === 0) {
        showError("No assigned class found. Please contact administrator.")
        setSubmitting(false)
        return
      }

      const assignedClass = assignedClasses[0]

      // Use formData values when pre-selected (from ViewTeams "Add Task"),
      // otherwise fall back to the engineer's assigned class
      const taskGradeId = editingTask
        ? (editingTask.gradeId || editingTask.GradeId)
        : (formData.gradeId ? Number(formData.gradeId) : assignedClass.gradeId)
      const taskClassId = formData.classId ? Number(formData.classId) : (assignedClass.classId || assignedClass.assignedClassId || null)
      const taskWeekId = formData.weekId ? Number(formData.weekId) : 0

      const taskData = {
        TaskName: formData.taskName,
        TaskDescription: formData.taskDescription,
        TaskDeadline: cairoToUTC(formData.taskDeadline),
        GradeId: taskGradeId,
        ClassId: taskClassId,
        TeamId: formData.teamId ? Number(formData.teamId) : null,
        WeekId: taskWeekId,
        AdminAccountId: CURRENT_USER_ID,
        AssignedToId: formData.assignedToId ? Number(formData.assignedToId) : null,
      }

      console.log("AdminTasksPage - Submitting task data:", JSON.stringify(taskData, null, 2))
      try {
        if (editingTask) {
          await axiosInstance.put(`/AccountTask/${editingTask.id}`, taskData, {
            headers: { "Content-Type": "application/json" },
          })
          showSuccess("Task Updated", "Task updated successfully!")
        } else {
          await axiosInstance.post(`/AccountTask`, taskData, {
            headers: { "Content-Type": "application/json" },
          })
          showSuccess("Task Created", "Task created successfully!")
        }
        resetForm(true)
        setSelectedGrades([])
        setShowAddForm(false)
        await fetchData()
      } catch (err) {
        console.error("AdminTasksPage - Error saving task:", err)
        console.error("AdminTasksPage - Error response data:", JSON.stringify(err.response?.data))
        console.error("AdminTasksPage - Error response status:", err.response?.status)
        const errorMsg = err.response?.data?.error || err.response?.data?.message || (typeof err.response?.data === 'string' ? err.response.data : err.message)
        showError(`Failed to save task: ${errorMsg}`)
      } finally {
        setSubmitting(false)
      }
      return
    }

    // For non-engineers: allow multiple grades
    const gradesToCreate = selectedGrades.length > 0 ? selectedGrades : (formData.gradeId ? [Number(formData.gradeId)] : [])

    if (gradesToCreate.length === 0) {
      showError("Please select at least one grade")
      setSubmitting(false)
      return
    }

    // Determine assignment from selected grade/class/team
    const createTaskForGrade = async (gradeId) => {
      let taskData = {
        TaskName: formData.taskName,
        TaskDescription: formData.taskDescription,
        TaskDeadline: cairoToUTC(formData.taskDeadline), // Convert Cairo time to UTC for server
        GradeId: gradeId,
        ClassId: formData.classId ? Number(formData.classId) : null,
        TeamId: formData.teamId ? Number(formData.teamId) : null,
        WeekId: Number(formData.weekId), // Add week ID
        StatusId: Number(formData.statusId),
        AdminAccountId: CURRENT_USER_ID,
        AssignedToId: formData.assignedToId ? Number(formData.assignedToId) : null,
      }

      await axiosInstance.post(`/AccountTask`, taskData, {
        headers: { "Content-Type": "application/json" },
      })
    }

    try {
      // Create tasks for each selected grade
      for (const gradeId of gradesToCreate) {
        await createTaskForGrade(gradeId)
      }

      if (gradesToCreate.length === 1) {
        showSuccess("Task Created", "Task created successfully!")
      } else {
        showSuccess("Tasks Created", `Tasks created successfully for ${gradesToCreate.length} grades!`)
      }

      resetForm()
      setSelectedGrades([])
      setShowAddForm(false)
      await fetchData()
    } catch (err) {
      if (isDevelopment() === 'development') {
        console.error("Error submitting task:", err)
        if (err.response) {
          console.error("Error status:", err.response.status)
          console.error("Error response:", err.response.data)
        }
      }

      // Check if it's a foreign key constraint error
      if (err.response && err.response.data) {
        const errorMessage = err.response.data
        if (errorMessage.includes("FK_Task_AdminAccount")) {
          showError("Error: Invalid admin account. Please check database setup.")
        } else {
          showError(`Failed to save task: ${errorMessage}`)
        }
      } else {
        showError("Failed to submit task.")
      }
    } finally {
      setSubmitting(false)
    }
  }

  // ✅ Delete Task
  const handleDelete = async (taskId) => {
    // Prevent engineers/reviewers from deleting tasks they didn't create
    if ((isEngineer(user) || isReviewer(user))) {
      const task = tasks.find(t => t.id === taskId)
      if (task && task.adminAccountId !== CURRENT_USER_ID) {
        showWarning("Permission Denied", "You can only delete tasks you created.")
        return
      }
    }
    setTaskToDelete(taskId);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!taskToDelete) return;

    try {
      const response = await axiosInstance.delete(`/AccountTask/${taskToDelete}`)
      showSuccess("Task Deleted", response.data.message || "Task deleted successfully!")
      await fetchData()
    } catch (err) {
      if (isDevelopment() === 'development') {
        console.error("Error deleting task:", err)
      }
      showError("Delete Failed", "Failed to delete task. Please try again.")
    } finally {
      setShowDeleteConfirm(false);
      setTaskToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setTaskToDelete(null);
  };

  // Cairo timezone offset - calculated based on actual time difference
  const CAIRO_TIMEZONE_OFFSET = 9 // Add 9 hours to UTC to get Cairo time

  // Helper function to get Cairo timezone offset (simplified)
  const getCairoOffset = (date) => {
    // For now, using fixed +9 hours offset (calculated from actual time difference)
    // In the future, you can implement proper timezone detection here
    return CAIRO_TIMEZONE_OFFSET
  }

  const formatDate = (dateString) => {
    if (!dateString) return "No deadline"

    try {
      // Parse the UTC date string
      const utcDate = parseISO(dateString)

      // Try different approaches to get Cairo time
      // Method 1: Add 9 hours
      const cairoTime1 = addHours(utcDate, 9)

      // Method 2: Use browser's timezone conversion
      const cairoTime2 = new Date(utcDate.toLocaleString("en-US", { timeZone: "Africa/Cairo" }))

      // Method 3: Subtract 9 hours (reverse approach)
      const cairoTime3 = addHours(utcDate, -9)

      // For now, use Method 2 (browser timezone) as it's most reliable
      const cairoTime = cairoTime2

      // Format using date-fns with clear AM/PM display
      const formattedDate = format(cairoTime, "MMM dd, yyyy, hh:mm a")

      return formattedDate
    } catch (error) {
      if (isDevelopment() === 'development') {
        console.error("Error formatting date:", error)
      }
      return "Invalid date"
    }
  }

  const getGradeName = (gradeId) => {
    const grade = grades.find((g) => g.id === gradeId)
    return grade ? grade.gradeName : `Grade ${gradeId}`
  }

  // Helper function to get deadline value safely from task object
  const getTaskDeadline = (task) => {
    return task.taskDeadline || task.TaskDeadline || task.deadline || task.Deadline || null
  }

  // Current week number is now imported from weekUtils

  // Group tasks by week is now imported from weekUtils

  // Get week date range is now imported from weekUtils

  // ✅ Edit Task
  const toLocalInputValue = (date) => {
    if (!date) return ""

    try {
      // Parse the UTC date string
      const utcDate = parseISO(date)

      // Use browser's timezone conversion for Cairo time
      const cairoTime = new Date(utcDate.toLocaleString("en-US", { timeZone: "Africa/Cairo" }))

      // Format as YYYY-MM-DDTHH:mm for datetime-local input
      return format(cairoTime, "yyyy-MM-dd'T'HH:mm")
    } catch (error) {
      if (isDevelopment() === 'development') {
        console.error("Error converting date for input:", error)
      }
      return ""
    }
  }

  // Convert Cairo time back to UTC for server submission
  const cairoToUTC = (cairoDateString) => {
    if (!cairoDateString) return ""

    try {
      // Parse the Cairo date string (from datetime-local input)
      const cairoDate = parseISO(cairoDateString)

      // Convert Cairo time to UTC using browser timezone conversion
      // First, create a date object in Cairo timezone
      const cairoDateObj = new Date(cairoDate.toLocaleString("en-US", { timeZone: "Africa/Cairo" }))

      // Then convert to UTC by getting the time difference
      const utcOffset = cairoDateObj.getTimezoneOffset() * 60000 // Convert minutes to milliseconds
      const utcDate = new Date(cairoDate.getTime() - utcOffset)

      // Return ISO string for server
      return utcDate.toISOString()
    } catch (error) {
      if (isDevelopment() === 'development') {
        console.error("Error converting Cairo time to UTC:", error)
      }
      return ""
    }
  }





  const handleEdit = (task) => {
    // Prevent engineers/reviewers from editing tasks they didn't create
    if ((isEngineer(user) || isReviewer(user)) && task.adminAccountId !== CURRENT_USER_ID) {
      showWarning("Permission Denied", "You can only edit tasks you created.")
      return
    }
    setEditingTask(task)

    // Set selected grades based on the task's grade
    const taskGradeId = task.gradeId || task.GradeId
    if (taskGradeId) {
      setSelectedGrades([Number(taskGradeId)])
    } else {
      setSelectedGrades([])
    }

    setFormData({
      taskName: task.taskName || "",
      taskDescription: task.taskDescription || "",
      taskDeadline: toLocalInputValue(getTaskDeadline(task)),
      gradeId: String(task.gradeId || ""),
      classId: String(task.classId || task.ClassId || ""),
      teamId: String(task.teamId || task.TeamId || ""),
      weekId: String(task.weekId || task.WeekId || ""),
      statusId: Number(task.statusId || STATUS_CONSTANTS.TASK_PENDING),
    })
    setShowAddForm(true)
  }

  return (
    <div className="admin-tasks-page">


      <div className="admin-tasks-header">
        <div className="admin-tasks-header-content">
          <h1 className="admin-tasks-title">Task Management</h1>
          <p className="admin-tasks-subtitle">
            {(isEngineer(user) || isReviewer(user))
              ? "Create and manage tasks for your assigned classes Grades"
              : (isSuperAdmin(user) || isBoard(user) || isCapstoneLead(user))
                ? "Create and manage tasks for all grades. Use the filter above to view specific grades."
                : "Create and manage tasks for all grades"
            }
          </p>
        </div>
        <div className="admin-tasks-header-buttons">
          {/* Grade Filter for Super Admin and Capstone Lead */}
          {(isSuperAdmin(user) || isBoard(user) || isCapstoneLead(user)) && (
            <div className="admin-tasks-grade-filter">
              <label className="admin-tasks-filter-label">Filter by Grade:</label>
              <select
                className="admin-tasks-filter-select"
                value={selectedGradeFilter}
                onChange={(e) => setSelectedGradeFilter(e.target.value)}
              >
                <option value="">All Grades</option>
                {grades.map((grade) => (
                  <option key={grade.id} value={grade.id}>
                    {grade.gradeName}
                  </option>
                ))}
              </select>
            </div>
          )}

          {!isBoard(user) && (
            <button
              className="admin-tasks-add-task-button"
              onClick={() => {
                resetForm(true)
                setShowAddForm(true)
              }}
            >
              <Plus size={20} />
              Add New Task
            </button>
          )}
        </div>
      </div>

      {/* Add/Edit Task Form */}
      {showAddForm && !isBoard(user) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">
                {editingTask ? "Edit Task" : "Create New Task"}
              </h2>
              <button
                onClick={() => {
                  setShowAddForm(false)
                  resetForm()
                }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Task Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Task Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="taskName"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Enter task name"
                  value={formData.taskName}
                  onChange={handleInputChange}
                  required
                  disabled={submitting}
                  maxLength={TASK_NAME_MAX_LENGTH}
                />
                <p className="text-xs text-gray-500 mt-1">{formData.taskName.length}/{TASK_NAME_MAX_LENGTH} characters</p>
              </div>

              {/* Task Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Task Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="taskDescription"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Enter task description"
                  rows={4}
                  value={formData.taskDescription}
                  onChange={handleInputChange}
                  required
                  disabled={submitting}
                  maxLength={TASK_DESCRIPTION_MAX_LENGTH}
                />
                <p className="text-xs text-gray-500 mt-1">{formData.taskDescription.length}/{TASK_DESCRIPTION_MAX_LENGTH} characters</p>
              </div>

              {/* For engineers/reviewers: Show only team selection with assigned class info */}
              {(isEngineer(user) || isReviewer(user)) ? (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <div className="text-sm text-blue-800">
                    <p className="font-medium">Your Assigned Class:</p>
                    <p className="mt-1">
                      {assignedClasses.length > 0 
                        ? `${assignedClasses[0].className} (${assignedClasses[0].gradeName})`
                        : "No class assigned"
                      }
                    </p>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Team <span className="text-gray-400 text-xs">(Optional - leave empty for all teams in your class)</span>
                    </label>
                    <select
                      name="teamId"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      value={formData.teamId}
                      onChange={handleInputChange}
                      disabled={submitting}
                    >
                      <option value="">All Teams in My Class</option>
                      {getTeamsForClass(formData.classId).map((team) => (
                        <option key={team.id} value={team.id}>
                          {team.teamName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : (
                /* Non-engineers: Show grade, class, team selection */
                <>
                  {/* Grade Selection - Different for Create vs Edit */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Grade <span className="text-red-500">*</span>
                      {editingTask && <span className="text-gray-400 font-normal ml-2">(Select grade for editing)</span>}
                      {!editingTask && <span className="text-gray-400 font-normal ml-2">(Select one or more grades)</span>}
                    </label>
                    
                    {editingTask ? (
                      <select
                        name="gradeId"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                        value={formData.gradeId}
                        onChange={handleInputChange}
                        required
                        disabled={submitting}
                      >
                        <option value="">Select a grade</option>
                        {getAvailableGrades().map((grade) => (
                          <option key={grade.id} value={grade.id}>
                            {grade.gradeName}
                          </option>
                        ))}
                      </select>
                    ) : (
                      /* Create Mode for non-engineers: Multi-select checkboxes */
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <button
                            type="button"
                            onClick={handleSelectAllGrades}
                            className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-md transition-colors"
                          >
                            {selectedGrades.length === getAvailableGrades().length ? "Deselect All" : "Select All"}
                          </button>
                          {selectedGrades.length > 0 && (
                            <span className="text-xs text-green-600">{selectedGrades.length} selected</span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-2">
                          {getAvailableGrades().map((grade) => (
                            <label
                              key={grade.id}
                              className={`flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors ${
                                selectedGrades.includes(grade.id) ? 'bg-blue-50 border border-blue-300' : 'bg-white hover:bg-gray-50 border border-gray-200'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={selectedGrades.includes(grade.id)}
                                onChange={() => handleGradeMultiSelect(grade.id)}
                                disabled={submitting}
                                className="w-4 h-4 text-blue-600"
                              />
                              <span className="text-sm text-gray-700">{grade.gradeName}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                    {!editingTask && (isEngineer(user) || isReviewer(user)) && getAvailableGrades().length === 0 && (
                      <p className="text-xs text-red-500 mt-1">No grades available. You need to be assigned to classes first.</p>
                    )}
                  </div>

                  {/* Class Selection - Only for non-engineers */}
                  {!(isEngineer(user) || isReviewer(user)) && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Class {selectedGrades.length > 1 && <span className="text-orange-500 text-xs">(Disabled - select single grade first)</span>}
                      </label>
                      <select
                        name="classId"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                        value={formData.classId}
                        onChange={handleInputChange}
                        disabled={submitting || selectedGrades.length > 1}
                      >
                        <option value="">Select a class (optional)</option>
                        {(selectedGrades.length === 1 ? getClassesForGrade(selectedGrades[0]) : (formData.gradeId ? getClassesForGrade(formData.gradeId) : []))
                        .map((cls) => (
                          <option key={cls.id} value={cls.id}>
                            {cls.className}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Team Selection - Only for non-engineers */}
                  {!(isEngineer(user) || isReviewer(user)) && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Team <span className="text-gray-400 text-xs">(Optional)</span>
                      </label>
                      <select
                        name="teamId"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                        value={formData.teamId}
                        onChange={handleInputChange}
                        disabled={submitting || selectedGrades.length > 1 || !formData.classId}
                      >
                        <option value="">Select a team (optional)</option>
                        {(formData.classId ? getTeamsForClass(formData.classId) : []).map((team) => (
                          <option key={team.id} value={team.id}>
                            {team.teamName}
                          </option>
                        ))}
                      </select>
                      {!formData.classId && selectedGrades.length <= 1 && (
                        <p className="text-xs text-gray-500 mt-1">Select a class first to see available teams</p>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* Week Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Week <span className="text-red-500">*</span>
                </label>
                <select
                  name="weekId"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  value={formData.weekId}
                  onChange={handleInputChange}
                  required
                  disabled={submitting}
                >
                  <option value="">Select a week</option>
                  {weeks.map((week) => (
                    <option key={week.id} value={week.id}>
                      {week.weekTitle || `Week ${week.weekNumber}`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Deadline */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deadline <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  name="taskDeadline"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  value={formData.taskDeadline}
                  onChange={handleInputChange}
                  required
                  disabled={submitting}
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false)
                    resetForm()
                  }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                  disabled={submitting || (editingTask && selectedGrades.length > 1)}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {editingTask ? "Updating..." : "Creating..."}
                    </>
                  ) : (
                    editingTask ? "Update Task" : "Create Task"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Weekly Calendar View */}
      <div className="admin-tasks-calendar-content">
        {loading ? (
          <div className="admin-tasks-loading-container">
            <Loader2 size={32} className="admin-tasks-animate-spin" />
            <p>Loading tasks...</p>
          </div>
        ) : getFilteredTasks().length === 0 ? (
          <div className="admin-tasks-no-tasks">
            <BookOpen size={48} className="admin-tasks-no-tasks-icon" />
            {(isEngineer(user) || isReviewer(user)) ? (
              <div>
                <p>No tasks found for your assigned classes.</p>
                <p>Create your first task above!</p>
              </div>
            ) : (
              <p>No tasks found. Create your first task above!</p>
            )}
          </div>
        ) : (
          <div className="admin-tasks-calendar">
            <div className="admin-tasks-calendar-header">
              <h2>Task Calendar - Weekly View</h2>
              <div className="admin-tasks-current-week">
                {/* Current Week display removed due to dynamic week migration */}
              </div>
            </div>

            <div className="admin-tasks-weeks-grid">
              {weeks.map((week) => {
                const weekTasks = getFilteredTasks().filter(t => t.weekId === week.id)

                // Calculate if this is the current week
                const now = new Date()
                const startDate = parseISO(week.startDate)
                const endDate = parseISO(week.endDate)
                const isCurrent = now >= startDate && now <= endDate

                return (
                  <div
                    key={week.id}
                    className={`admin-tasks-week-card ${isCurrent ? 'current-week' : ''}`}
                  >
                    <div className="admin-tasks-week-header">
                      <h3 className="admin-tasks-week-title">
                        {week.weekTitle}
                        {isCurrent && <span className="current-badge" style={{ marginLeft: '8px', fontSize: '12px', padding: '2px 8px', backgroundColor: '#3b82f6', color: 'white', borderRadius: '4px' }}>Current</span>}
                      </h3>
                      <div className="admin-tasks-week-dates">
                        {format(parseISO(week.startDate), 'MMM dd')} - {format(parseISO(week.endDate), 'MMM dd, yyyy')}
                      </div>
                    </div>

                    <div className="admin-tasks-week-tasks">
                      {weekTasks.length === 0 ? (
                        <div className="admin-tasks-no-tasks-week">
                          <Calendar size={24} />
                          <span>No tasks this week</span>
                        </div>
                      ) : (
                        weekTasks.map((task) => (
                          <div
                            key={task.id}
                            className={`admin-tasks-week-task-item ${task.assignedToId === CURRENT_USER_ID ? 'assigned-to-me' : ''}`}
                            style={task.assignedToId === CURRENT_USER_ID ? { border: '2px solid #8b5cf6', backgroundColor: '#ffffff' } : {}}
                          >
                            <div className="admin-tasks-week-task-content">
                              <div className="admin-tasks-week-task-info">
                                <div className="admin-tasks-week-task-header">
                                  <h4 className="admin-tasks-week-task-title">
                                    {task.taskName}
                                    {task.assignedToId === CURRENT_USER_ID && (
                                      <span style={{
                                        fontSize: '0.7rem',
                                        backgroundColor: '#8b5cf6',
                                        color: 'white',
                                        padding: '2px 6px',
                                        borderRadius: '4px',
                                        marginLeft: '8px',
                                        verticalAlign: 'middle'
                                      }}>
                                        Assigned to You
                                      </span>
                                    )}
                                  </h4>
                                  <span className="admin-tasks-week-task-level">{getTaskAssignmentType(task)}</span>
                                </div>

                                <p className="admin-tasks-week-task-description">
                                  {task.taskDescription.length > 100
                                    ? `${task.taskDescription.substring(0, 100)}...`
                                    : task.taskDescription
                                  }
                                </p>

                                <div className="admin-tasks-week-task-meta">
                                  <div className="admin-tasks-week-task-grade">
                                    <BookOpen size={14} />
                                    {task.assignedToId ? (
                                      <span>
                                        {(() => {
                                          const lead = capstoneLeads.find(l => l.id === task.assignedToId);
                                          return lead ? `Lead: ${lead.fullNameEn.split(' ')[0]}` : "Assigned to Lead";
                                        })()}
                                      </span>
                                    ) : (
                                      <span>{getGradeName(task.gradeId)}</span>
                                    )}
                                  </div>
                                  <div className="admin-tasks-week-task-deadline">
                                    <Calendar size={14} />
                                    <span>{formatDate(getTaskDeadline(task))}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="admin-tasks-week-task-actions">
                                {task.assignedToId === CURRENT_USER_ID ? (
                                  <button
                                    onClick={() => {
                                      if (setSelectedTask && setCurrentPage) {
                                        setSelectedTask(task);
                                        setCurrentPage("task-details");
                                      } else {
                                        console.error("Navigation props missing in AdminTasksPage");
                                      }
                                    }}
                                    className="admin-tasks-action-btn edit-btn"
                                    title="View Details"
                                    style={{
                                      padding: '4px 8px',
                                      backgroundColor: '#8b5cf6',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '4px',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      flex: 1,
                                      justifyContent: 'center'
                                    }}
                                  >
                                    <BookOpen size={16} />
                                    <span>Details</span>
                                  </button>
                                ) : (
                                  <>
                                    <button
                                      onClick={() => handleEdit(task)}
                                      className="admin-tasks-task-action-btn admin-tasks-edit-btn"
                                      title="Edit Task"
                                    >
                                      <Edit size={16} />
                                      <span>Edit</span>
                                    </button>
                                    <button
                                      onClick={() => handleDelete(task.id)}
                                      className="admin-tasks-task-action-btn admin-tasks-delete-btn"
                                      title="Delete Task"
                                    >
                                      <Trash2 size={16} />
                                      <span>Delete</span>
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showDeleteConfirm}
        title="Delete Task"
        message="Are you sure you want to delete this task? This will also delete all associated task submissions."
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div >
  )
}

export default AdminTasksPage

// Note: This component now receives dynamic user data from the Dashboard
// No more hardcoded fallback values, uses currentUserId prop instead
