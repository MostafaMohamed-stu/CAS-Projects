
/**
 * ViewTasks Component - Role-Based Access Control
 * 
 * Student: No restrictions - can see all teams
 * Engineer: Can only see teams from classes assigned to them via ReviewerSupervisorExtension
 * Super Admin: No restrictions - can see all teams
 */

import { useEffect, useState } from "react"
import { Search, CheckCircle, Eye, Send, Clock, LinkIcon, StickyNote, Upload, X, Users, Loader2, FileText, ArrowLeft, AlertTriangle, Plus, AlertCircle } from "lucide-react"
import { useNotification } from "../../contexts/NotificationContext"
import { API_BASE_URL, isDevelopment } from '../../config/apiConfig.js';
import { axiosInstance } from '../../utils/authService';
import { format, parseISO, addHours } from "date-fns"
import { isEngineer, isBoard, isSuperAdmin, isStaffAdmin, isCapstoneLead } from "../../utils/roleUtils"
import { STATUS_CONSTANTS, StatusHelpers } from "../../utils/statusConstants"
import { filterTasksForTeam, getTaskAssignmentType } from "../../utils/taskFiltering";
import SubmissionLinkModal from '../SubmissionLinkModal/SubmissionLinkModal';
import TaskDetailsDialog from "../TaskDetailsDialog/TaskDetailsDialog";
import "./ViewTasks.css"

const ViewTasks = ({ teamIdFilter: initialTeamIdFilter = null, currentUserId = null, user = null, openTeamProfile = null, setCurrentPage = null }) => {
  if (isDevelopment() === 'development') {
    console.log("ViewTasks component rendering");
  }

  const [currentInitialTeamIdFilter, setCurrentInitialTeamIdFilter] = useState(initialTeamIdFilter)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTask, setSelectedTask] = useState(null)
  const [selectedTaskDetails, setSelectedTaskDetails] = useState(null)
  const [feedback, setFeedback] = useState("")
  const [submissions, setSubmissions] = useState([])
  const [tasks, setTasks] = useState([])
  const [grades, setGrades] = useState([])
  const [classes, setClasses] = useState([])
  const [teams, setTeams] = useState([])
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedTeam, setSelectedTeam] = useState(null)
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [viewMode, setViewMode] = useState("teams") // 'teams', 'tasks', 'team-info', 'student-reports'
  const [reviewingStudentId, setReviewingStudentId] = useState(null)
  const [confirmingReportId, setConfirmingReportId] = useState(null)
  const [reportStatusFilter, setReportStatusFilter] = useState('all')
  const [submissionLinkModal, setSubmissionLinkModal] = useState({
    isOpen: false,
    submissionData: null
  })
  const [statusFilter, setStatusFilter] = useState("all") // all | pending | submitted | completed
  const [gradeFilter, setGradeFilter] = useState("")
  const [classFilter, setClassFilter] = useState("")
  const [teamIdFilter, setTeamIdFilter] = useState(initialTeamIdFilter || "")
  const [assignedClasses, setAssignedClasses] = useState([])
  const { showSuccess, showError, showWarning, showInfo } = useNotification()

  // Cairo timezone offset - Egypt is UTC+3 (daylight saving time)
  const CAIRO_TIMEZONE_OFFSET = 3

  // Convert UTC date to Cairo timezone and format with AM/PM
  const formatCairoDate = (dateString) => {
    if (!dateString) return "No date";

    try {
      // Parse the UTC date string
      const utcDate = parseISO(dateString);

      // Add Cairo timezone offset (UTC+3)
      const cairoTime = addHours(utcDate, CAIRO_TIMEZONE_OFFSET);

      // Format using date-fns with clear AM/PM display
      const formattedDate = format(cairoTime, "MMM dd, yyyy, hh:mm a");

      return formattedDate;
    } catch (error) {
      if (isDevelopment() === 'development') {
        console.error("Error formatting date:", error);
      }
      return "Invalid date";
    }
  };

  // Format date only (without time) for Cairo timezone
  const formatCairoDateOnly = (dateString) => {
    if (!dateString) return "N/A";

    try {
      const utcDate = parseISO(dateString);
      const cairoTime = addHours(utcDate, CAIRO_TIMEZONE_OFFSET);
      return format(cairoTime, "MMM dd, yyyy");
    } catch (error) {
      if (isDevelopment() === 'development') {
        console.error("Error formatting date:", error);
      }
      return "Invalid date";
    }
  };

  // Format time only for Cairo timezone
  const formatCairoTimeOnly = (dateString) => {
    if (!dateString) return "N/A";

    try {
      const utcDate = parseISO(dateString);
      const cairoTime = addHours(utcDate, CAIRO_TIMEZONE_OFFSET);
      return format(cairoTime, "hh:mm a");
    } catch (error) {
      if (isDevelopment() === 'development') {
        console.error("Error formatting time:", error);
      }
      return "Invalid time";
    }
  };

  useEffect(() => {
    if (initialTeamIdFilter) {
      setTeamIdFilter(initialTeamIdFilter)
      setCurrentInitialTeamIdFilter(initialTeamIdFilter)
    }
  }, [initialTeamIdFilter])

  // Handle switching to tasks view when team data is loaded and initialTeamIdFilter is set
  useEffect(() => {
    if (initialTeamIdFilter && teams.length > 0) {
      const team = teams.find((t) => t.id === initialTeamIdFilter)
      if (team) {
        setSelectedTeam(team)
        setViewMode("tasks")
      }
    }
  }, [initialTeamIdFilter, teams])

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {


        // Determine which teams endpoint to use based on user role
        let teamsEndpoint = `${API_BASE_URL}/Teams`
        if (isEngineer(user) && currentUserId) {
          teamsEndpoint = `${API_BASE_URL}/Teams/ByEngineer/${currentUserId}`
          if (isDevelopment() === 'development') {
            console.log(`ViewTasks - Using engineer-specific endpoint`);
          }
        }

        // Fetch all data in parallel
        const assignmentsPromise = (isEngineer(user) && currentUserId)
          ? axiosInstance.get(`/Teams/Assignments`)
          : Promise.resolve({ data: [] })

        console.log('ViewTasks - Fetching data from endpoints...');

        const [submissionsRes, tasksRes, gradesRes, classesRes, teamsRes, teamMembersRes, reportsRes, assignmentsRes] = await Promise.all([
          axiosInstance.get(`/TaskSubmissions`),
          axiosInstance.get(`/AccountTask`),
          axiosInstance.get(`/Grades`),
          axiosInstance.get(`/Class`),
          axiosInstance.get(teamsEndpoint.replace(API_BASE_URL, '')),
          axiosInstance.get(`/TeamMembers`),
          axiosInstance.get(`/Reports`),
          assignmentsPromise,
        ])



        // Process submissions
        const submissionsRaw = submissionsRes.data
        const submissionsList = Array.isArray(submissionsRaw)
          ? submissionsRaw
          : submissionsRaw?.$values
            ? submissionsRaw.$values
            : []
        const normalizedSubmissions = submissionsList.map((s) => ({
          id: s.taskSubmissionId ?? s.TaskSubmissionId ?? s.id,
          taskId: s.taskId ?? s.TaskId ?? null,
          teamId: s.teamId ?? s.TeamId,
          teamLeaderId: s.teamLeaderId ?? s.TeamLeaderId,
          teamLeaderName: s.teamLeaderName ?? s.TeamLeaderName ?? "",
          gradeId: s.gradeId ?? s.GradeId,
          glink: s.glink ?? s.Glink ?? "",
          note: s.note ?? s.Note ?? "",
          feedback: s.feedback ?? s.Feedback ?? "",
          submittedDate: s.createdAt ?? s.CreatedAt ?? null,
          statusId: s.statusId ?? s.StatusId,
          isLate: s.isLate ?? false, // Include isLate from server
        }))

        if (isDevelopment() === 'development') {
          console.log("Raw submissions data loaded");
          console.log("Normalized submissions:", normalizedSubmissions.length);
        }

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
          teamId: t.teamId ?? t.TeamId,
          assignedToId: t.assignedToId ?? t.AssignedToId ?? null,
          statusId: t.statusId ?? t.StatusId,
          taskDeadline: t.taskDeadline ?? t.TaskDeadline,
          weekId: t.weekId ?? t.WeekId,
          weekTitle: t.weekTitle ?? t.WeekTitle,
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

        // Process reports
        const reportsRaw = reportsRes.data
        const reportsList = Array.isArray(reportsRaw) ? reportsRaw : reportsRaw?.$values ? reportsRaw.$values : []
        const normalizedReports = reportsList.map((r) => ({
          id: r.id ?? r.Id,
          reportTitle: r.title ?? r.Title ?? `Report ${r.id ?? r.Id}`,
          reportContent: r.reportMessage ?? r.ReportMessage ?? "",
          submitterAccountId: r.submitterAccountId ?? r.SubmitterAccountId,
          authorName: r.submitterAccount?.fullNameEn ?? r.submitterAccount?.fullNameAr ?? "Unknown Author",
          submittedDate: r.submissionDate ?? r.SubmissionDate ?? r.createdAt ?? r.CreatedAt,
          statusId: r.statusId ?? r.StatusId ?? STATUS_CONSTANTS.REPORT_SUBMITTED,
          status: r.status?.name ?? r.Status?.Name ?? "Pending",
        }))

        // Process team members (using same approach as dashboard)
        const teamMembersRaw = teamMembersRes.data
        const teamMembersList = Array.isArray(teamMembersRaw) ? teamMembersRaw : teamMembersRaw?.$values ? teamMembersRaw.$values : []
        const normalizedTeamMembers = teamMembersList.map((tm) => ({
          id: tm.id ?? tm.Id,
          teamId: tm.teamId ?? tm.TeamId,
          teamMemberAccountId: tm.teamMemberAccountId ?? tm.TeamMemberAccountId,
          teamMemberDescription: tm.teamMemberDescription ?? tm.TeamMemberDescription,
          memberName: tm.memberName ?? tm.MemberName,
          memberEmail: tm.memberEmail ?? tm.MemberEmail,
          classId: tm.classId ?? tm.ClassId,
          gradeId: tm.gradeId ?? tm.GradeId,
        }))

        // Process teams
        const teamsRaw = teamsRes.data
        if (isDevelopment() === 'development') {
          console.log("ViewTasks - Teams response loaded");
        }

        // Safely extract teams array with better error handling
        let teamsList = []
        try {
          if (Array.isArray(teamsRaw)) {
            teamsList = teamsRaw
          } else if (teamsRaw && typeof teamsRaw === 'object') {
            // Try different possible property names
            teamsList = teamsRaw.$values || teamsRaw.data || teamsRaw.teams || teamsRaw.results || teamsRaw.items || []

            // If still not an array, try to convert object to array
            if (!Array.isArray(teamsList) && teamsRaw && typeof teamsRaw === 'object') {
              // Check if it's an object with numeric keys
              const keys = Object.keys(teamsRaw)
              if (keys.length > 0 && keys.every(key => !isNaN(key))) {
                teamsList = Object.values(teamsRaw)
              }
            }
          }
        } catch (error) {
          if (isDevelopment() === 'development') {
            console.error("Error extracting teams list:", error)
          }
          teamsList = []
        }

        if (isDevelopment() === 'development') {
          console.log("ViewTasks - Extracted teams list:", teamsList.length);
        }

        // Ensure teamsList is an array before proceeding
        if (!Array.isArray(teamsList)) {
          if (isDevelopment() === 'development') {
            console.error("Teams list is not an array, defaulting to empty array")
          }
          teamsList = []
        }

        const normalizedTeams = teamsList.map((t) => {
          // Find the class to get grade information
          const classInfo = normalizedClasses.find((c) => c.id === (t.classId ?? t.ClassId))

          // Get team members for this team
          const teamMembers = normalizedTeamMembers
            .filter((tm) => tm.teamId === (t.teamId ?? t.id ?? t.Id))
            .map((tm) => {
              // Count reports for this member (excluding confirmed reports)
              const memberReports = normalizedReports.filter(r =>
                r.submitterAccountId === tm.teamMemberAccountId && r.statusId !== STATUS_CONSTANTS.REPORT_CONFIRMED
              )
              return {
                id: tm.teamMemberAccountId,
                fullName: tm.memberName || `Member ${tm.teamMemberAccountId}`,
                email: tm.memberEmail || '',
                role: tm.teamMemberDescription || 'Team Member',
                reportsCount: memberReports.length,
              }
            })

          // Use gradeId and gradeName directly from team data (from API) if available, otherwise fallback to classInfo
          const teamGradeId = t.gradeId || t.GradeId || classInfo?.gradeId || classInfo?.GradeId
          const teamGradeName = t.gradeName || t.GradeName || classInfo?.gradeName || classInfo?.GradeName

          // Debug logging for grade information
          if (isDevelopment() === 'development') {
            console.log(`ViewTasks - Processing team:`, t.teamName || t.TeamName);
          }

          return {
            id: t.teamId ?? t.id ?? t.Id,
            teamName: t.teamName ?? t.TeamName,
            classId: t.classId ?? t.ClassId,
            className: t.className ?? t.ClassName,
            gradeId: teamGradeId,
            gradeName: teamGradeName,
            teamMembers,
            SupervisorAccountId: t.SupervisorAccountId ?? t.supervisorAccountId ?? t.supervisorAccountId ?? null,
            // We'll fetch reviewers and supervisor dynamically for each team
          }
        })

        if (isDevelopment() === 'development') {
          console.log("Raw data loaded - teams:", normalizedTeams.length, "classes:", normalizedClasses.length, "grades:", normalizedGrades.length);
        }

        // Safely handle teams data
        let teamsWithSupervisor = []
        if (Array.isArray(teamsRaw)) {
          teamsWithSupervisor = teamsRaw.filter(t => t.SupervisorAccountId || t.supervisorAccountId)
        } else if (teamsRaw && typeof teamsRaw === 'object') {
          // Handle case where data might be wrapped in an object
          const teamsArray = teamsRaw.$values || teamsRaw.data || teamsRaw.teams || []
          if (Array.isArray(teamsArray)) {
            teamsWithSupervisor = teamsArray.filter(t => t.SupervisorAccountId || t.supervisorAccountId)
          }
        }

        if (isDevelopment() === 'development') {
          console.log("Teams with supervisors:", teamsWithSupervisor.length);
        }

        // Process assignments to compute engineer-assigned classes (even if no teams)
        let normalizedAssignments = []
        try {
          const assignmentsRaw = assignmentsRes?.data
          const assignmentsList = Array.isArray(assignmentsRaw) ? assignmentsRaw : assignmentsRaw?.$values ? assignmentsRaw.$values : []
          normalizedAssignments = assignmentsList.map(a => ({
            accountId: a.accountId ?? a.AccountId,
            assignedClassId: a.assignedClassId ?? a.AssignedClassId,
          }))
        } catch (e) {
          if (isDevelopment() === 'development') {
            console.warn('Assignments processing failed or not available')
          }
        }

        if (isEngineer(user) && currentUserId) {
          const assignedIdsSet = new Set(
            normalizedAssignments
              .filter(a => Number(a.accountId) === Number(currentUserId))
              .map(a => a.assignedClassId)
              .filter(Boolean)
          )
          const assignedClassesFromAll = normalizedClasses.filter(c => assignedIdsSet.has(c.id))
          setAssignedClasses(assignedClassesFromAll)
        } else {
          setAssignedClasses([])
        }

        setSubmissions(normalizedSubmissions)
        setTasks(normalizedTasks)
        setGrades(normalizedGrades)
        setClasses(normalizedClasses)
        setTeams(normalizedTeams)
        setReports(normalizedReports)
      } catch (e) {
        if (isDevelopment() === 'development') {
          console.error("Failed to load data", e)
        }
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // SECURITY: Deadline checking is now handled by the server
  // Client-side deadline checking can be manipulated by users
  // Always rely on server-side validation for security

  const getStatusText = (statusId, deadline = null, isPendingTask = false, isLate = false, submittedDate = null) => {
    return StatusHelpers.getStatusText(statusId, deadline, isPendingTask, isLate, submittedDate);
  };

  const getStatusColor = (statusId, deadline = null, isPendingTask = false, isLate = false) => {
    return StatusHelpers.getStatusColor(statusId, deadline, isPendingTask, isLate);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Completed":
        return <CheckCircle size={16} />
      case "Completed Late":
        return <CheckCircle size={16} />
      case "Completed Very Late":
        return <CheckCircle size={16} />
      case "Submitted":
        return <Upload size={16} />
      case "Submitted On Time":
        return <Upload size={16} />
      case "Submitted Late":
        return <Upload size={16} />
      case "Submitted Very Late":
        return <Upload size={16} />
      case "Rejected":
        return <X size={16} />
      case "Pending":
        return <Clock size={16} />
      case "Late":
        return <AlertTriangle size={16} />
      case "Deadline Passed":
        return <AlertTriangle size={16} />
      default:
        return <AlertCircle size={16} />
    }
  };

  const getTeamStats = (teamId) => {
    // Get all tasks for this team (including those without submissions)
    const teamTasks = getTasksForTeam(teamId)

    if (isDevelopment() === 'development') {
      console.log(`getTeamStats called for teamId: ${teamId}, task count: ${teamTasks.length}`)
    }

    // Count different statuses
    const completed = teamTasks.filter((task) => task.statusId === STATUS_CONSTANTS.TASK_COMPLETED).length
    const submitted = teamTasks.filter((task) => task.statusId === STATUS_CONSTANTS.TASK_SUBMITTED_ON_TIME || task.statusId === STATUS_CONSTANTS.TASK_SUBMITTED_LATE).length
    const rejected = teamTasks.filter((task) => task.statusId === STATUS_CONSTANTS.TASK_REJECTED).length
    const pending = teamTasks.filter((task) => task.statusId === STATUS_CONSTANTS.TASK_PENDING || task.isPendingTask).length
    const submittedLate = teamTasks.filter((task) => task.statusId === STATUS_CONSTANTS.TASK_SUBMITTED_LATE).length
    const completedLate = teamTasks.filter((task) => task.statusId === STATUS_CONSTANTS.TASK_COMPLETED_LATE).length

    // New counter for overdue tasks (التاسكات المتأخرة) - tasks that passed deadline without submission
    const overdue = teamTasks.filter((task) => {
      // SECURITY: Use server-provided isLate instead of client-side deadline checking
      if (task.isPendingTask) {
        return task.isLate || false
      }
      // Also check submitted/completed tasks that were late
      if (task.statusId === STATUS_CONSTANTS.TASK_SUBMITTED_ON_TIME || task.statusId === STATUS_CONSTANTS.TASK_COMPLETED) {
        return task.isLate || false
      }
      // Status 11 and 13 are already marked as late
      if (task.statusId === STATUS_CONSTANTS.TASK_SUBMITTED_LATE || task.statusId === STATUS_CONSTANTS.TASK_COMPLETED_LATE) {
        return true
      }
      return false
    }).length

    const total = teamTasks.length

    // Debug logging
    console.log(`Team ${teamId} stats calculation:`, {
      teamTasksCount: teamTasks.length,
      completed,
      submitted,
      rejected,
      pending,
      submittedLate,
      completedLate,
      overdue,
      total
    })

    return {
      completed,
      submitted,
      rejected,
      pending,
      submittedLate,
      completedLate,
      overdue,
      total
    }
  }

  if (isDevelopment() === 'development') {
    console.log("ViewTasks - User role filtering:", {
      userRole: user?.role,
      totalTeams: teams.length
    })
  }

  // Filter teams based on grade, class, and search filters
  const filteredTeams = teams.filter((team) => {
    // Engineer: Teams are already filtered by the API endpoint based on assigned classes
    // Role ID = 1 (Admin): Show all teams (no restrictions)
    // Role ID = 4 (Student): Show all teams (no restrictions)

    const matchesGrade =
      String(gradeFilter || "").trim().length === 0 ||
      (team.gradeName || "").toLowerCase().includes(String(gradeFilter || "").toLowerCase())

    const matchesClass =
      String(classFilter || "").trim().length === 0 ||
      (team.className || "").toLowerCase().includes(String(classFilter || "").toLowerCase())

    // Search filter - matches team name, class name, or grade name
    const matchesSearch =
      String(searchTerm || "").trim().length === 0 ||
      (team.teamName || "").toLowerCase().includes(String(searchTerm || "").toLowerCase()) ||
      (team.className || "").toLowerCase().includes(String(searchTerm || "").toLowerCase()) ||
      (team.gradeName || "").toLowerCase().includes(String(searchTerm || "").toLowerCase())

    // Debug logging for filtering
    if (isDevelopment() === 'development' && (gradeFilter || classFilter || searchTerm)) {
      console.log(`Team filtering - Grade: ${matchesGrade}, Class: ${matchesClass}, Search: ${matchesSearch}`)
    }

    return matchesGrade && matchesClass && matchesSearch
  })

  // Combine submissions with task data to get real task names
  // Show all tasks for the team's grade/class, not just submitted ones
  const getTasksForTeam = (teamId) => {
    if (!teams || teams.length === 0 || !tasks || tasks.length === 0) return []
    
    const team = teams.find((t) => t.id === teamId)
    if (!team) return []

    // Get all tasks for this team's grade
    const teamTasks = tasks.filter((task) => {
      const taskGradeId = task.gradeId
      const taskClassId = task.classId
      const taskTeamId = task.teamId

      // Task is for this team
      if (taskTeamId === team.id) return true
      
      // Task is for this team's class (no specific team)
      if (taskClassId === team.classId && !taskTeamId) return true
      
      // Task is for this team's grade (no specific class or team)
      if (taskGradeId === team.gradeId && !taskClassId && !taskTeamId) return true

      return false
    })

    return teamTasks.map((task) => {
      // Find submission for this task
      const submission = submissions.find((s) => s.taskId === task.id && s.teamId === team.id)

      return {
        ...task,
        submissionId: submission?.id || null,
        taskId: task.id,
        taskName: task.taskName || `Task #${task.id}`,
        taskDescription: task.taskDescription || "",
        taskDeadline: task.taskDeadline || null,
        gradeName: team.gradeName || "",
        className: team.className || "",
        teamId: team.id,
        // Use submission status if exists, otherwise task status
        statusId: submission?.statusId || task.statusId || 1,
        submittedDate: submission?.submittedDate || null,
        glink: submission?.glink || "",
        note: submission?.note || "",
        feedback: submission?.feedback || "",
        isLate: submission?.isLate || false,
        isPendingTask: !submission,
      }
    })
  }

  // For the selected team, get all tasks
  const teamTasks = selectedTeam ? getTasksForTeam(selectedTeam.id) : []
  
  // Combine with submissions for display
  const submissionsWithTasks = submissions.map((submission) => {
    const task = tasks.find((t) => t.id === submission.taskId)
    const team = teams.find((t) => t.id === submission.teamId)
    const grade = grades.find((g) => g.id === submission.gradeId)

    return {
      ...submission,
      taskName: task?.taskName || `Task #${submission.taskId ?? "N/A"}`,
      taskDescription: task?.taskDescription || "",
      taskDeadline: task?.taskDeadline || null,
      gradeName: team?.gradeName || grade?.gradeName || "",
      className: team?.className || "",
      isLate: submission.isLate || false,
    }
  })

  // Show only real submissions; do not synthesize pending tasks when none exist
  const allTasksWithStatus = submissionsWithTasks.slice()

  if (isDevelopment() === 'development') {
    console.log("All tasks with status:", allTasksWithStatus.length)
    console.log("Current status filter:", statusFilter)
  }

  // Debug: Always log submission counts for troubleshooting
  console.log('ViewTasks - Submission counts:', {
    totalSubmissions: submissions.length,
    submissionsWithTasks: submissionsWithTasks.length,
    allTasksWithStatus: allTasksWithStatus.length,
    userRole: user?.role,
    statusFilter: statusFilter
  });

  const filteredSubmissions = allTasksWithStatus.filter((submission) => {
    const matchesSearch =
      String(searchTerm || "").trim().length === 0 ||
      String(submission.taskId ?? "").includes(String(searchTerm || "")) ||
      String(submission.teamId ?? "").includes(String(searchTerm || "")) ||
      (submission.taskName || "").toLowerCase().includes(String(searchTerm || "").toLowerCase()) ||
      (submission.teamLeaderName || "").toLowerCase().includes(String(searchTerm || "").toLowerCase())

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "pending" && (submission.statusId === STATUS_CONSTANTS.TASK_PENDING || submission.isPendingTask)) ||
      (statusFilter === "submitted" && (submission.statusId === STATUS_CONSTANTS.TASK_SUBMITTED_ON_TIME || submission.statusId === STATUS_CONSTANTS.TASK_SUBMITTED_LATE)) ||
      (statusFilter === "rejected" && submission.statusId === STATUS_CONSTANTS.TASK_REJECTED) ||
      (statusFilter === "completed" && (submission.statusId === STATUS_CONSTANTS.TASK_COMPLETED || submission.statusId === STATUS_CONSTANTS.TASK_COMPLETED_LATE))

    const matchesGrade =
      String(gradeFilter || "").trim().length === 0 ||
      (submission.gradeName || "").toLowerCase().includes(String(gradeFilter || "").toLowerCase())

    const matchesClass =
      String(classFilter || "").trim().length === 0 ||
      (submission.className || "").toLowerCase().includes(String(classFilter || "").toLowerCase())

    const matchesTeam =
      String(teamIdFilter || "").trim().length === 0 ||
      String(submission.teamId ?? "").includes(String(teamIdFilter || ""))

    // Debug logging for status filtering
    if (isDevelopment() === 'development' && statusFilter !== "all") {
      console.log(`Task filtering - statusId=${submission.statusId}, matchesStatus=${matchesStatus}`)
    }

    return matchesSearch && matchesStatus && matchesGrade && matchesClass && matchesTeam
  })

  const handleMarkCompleted = async (submissionId) => {
    try {
      await axiosInstance.post(`/TaskSubmissions/${submissionId}/review`, {
        feedback: String(feedback || "").trim() || undefined,
      })
      setSubmissions((prev) =>
        prev.map((s) =>
          s.id === submissionId ? { ...s, statusId: STATUS_CONSTANTS.TASK_COMPLETED, feedback: String(feedback || "").trim() || s.feedback } : s,
        ),
      )
      setFeedback("")
      setSelectedTask(null)
    } catch (e) {
      if (isDevelopment() === 'development') {
        console.error("Failed to mark completed", e)
      }
    }
  }

  const handleRejectTask = async (submissionId) => {
    if (isDevelopment() === 'development') {
      console.log("handleRejectTask called with submissionId:", submissionId)
    }
    try {
      if (isDevelopment() === 'development') {
        console.log("Attempting to update task submission status to rejected")
      }

      // Verify the submission exists
      const currentSubmission = submissions.find((s) => s.id === submissionId)
      if (!currentSubmission) {
        if (isDevelopment() === 'development') {
          console.error("Submission not found:", submissionId)
        }
        showError("Submission Not Found", "Submission not found!")
        return
      }

      if (isDevelopment() === 'development') {
        console.log("Rejecting submission");
      }

      // Use the specific reject endpoint
      const response = await axiosInstance.post(`/TaskSubmissions/${submissionId}/reject`)
      if (isDevelopment() === 'development') {
        console.log("Reject response received");
      }

      // Update local state
      setSubmissions((prev) => {
        const updated = prev.map((s) => (s.id === submissionId ? { ...s, statusId: STATUS_CONSTANTS.TASK_REJECTED } : s))
        return updated
      })
      setSelectedTask(null)
      if (isDevelopment() === 'development') {
        console.log(`Task ${submissionId} rejected successfully`)
      }

      // Show success message
      showSuccess("Task Rejected", "Task rejected successfully!")
    } catch (e) {
      if (isDevelopment() === 'development') {
        console.error("Failed to reject task", e)
      }

      // Show error message to user
      showError("Rejection Failed", `Failed to reject task: ${e.response?.data || e.message}`)

      // Don't update UI if API call fails
      setSelectedTask(null)
    }
  }

  const handleAddFeedback = async (submissionId, feedback) => {
    if (isDevelopment() === 'development') {
      console.log("handleAddFeedback called with submissionId:", submissionId)
    }
    try {
      // Use the existing feedback endpoint instead of PUT
      const response = await axiosInstance.post(`/TaskSubmissions/${submissionId}/feedback`, {
        Feedback: feedback,
      })

      setSubmissions((prev) => {
        const updated = prev.map((s) => (s.id === submissionId ? { ...s, feedback: feedback } : s))
        return updated
      })
      setFeedback("") // Clear the feedback input
      setSelectedTask(null)
      showSuccess("Feedback Added", "Feedback added successfully!")
    } catch (e) {
      if (isDevelopment() === 'development') {
        console.error("Failed to add feedback", e)
      }
      showError("Feedback Failed", `Failed to add feedback: ${e.response?.data || e.message}`)
      setSelectedTask(null)
    }
  }

  const handleSubmitFeedback = (submissionId) => {
    if (String(feedback || "").trim()) {
      // In a real app, this would update the database
      if (isDevelopment() === 'development') {
        console.log(`Submitted feedback for ${submissionId}`);
      }
      setFeedback("")
      setSelectedTask(null)
    }
  }

  const handleTeamClick = (team) => {
    setSelectedTeam(team)
    setViewMode("tasks")
    setTeamIdFilter(team.id)
  }

  const handleTeamInfoClick = async (team) => {
    // Fetch team info first
    const teamInfo = await fetchTeamInfo(team.id)

    // Set selected team with all data including reviewers and supervisor
    setSelectedTeam({
      ...team,
      reviewers: teamInfo.reviewers,
      supervisor: teamInfo.supervisor
    })

    // Then set view mode
    setViewMode("team-info")
  }



  // Function to fetch team info (reviewers and supervisor) dynamically
  const fetchTeamInfo = async (teamId) => {
    try {
      // Get team details to find classId
      const team = teams.find(t => t.id === teamId)
      if (!team) return { reviewers: [], supervisor: null }

      const classId = team.classId
      if (!classId) return { reviewers: [], supervisor: null }

      // Fetch reviewers for this class (same as dashboard)
      const reviewersResponse = await axiosInstance.get(`/Account/Reviewers/ByClass/${classId}`)
      const reviewersData = reviewersResponse.data
      const reviewersList = Array.isArray(reviewersData) ? reviewersData : reviewersData?.$values || []

      const reviewers = reviewersList.map(reviewer => ({
        id: reviewer.accountId,
        fullName: reviewer.fullNameEn || reviewer.fullNameAr || "Engineer",
        role: "Engineer",
      }))

      // Fetch capstone supervisors from accounts with role Super Admin in CapstoneProject (same as dashboard)
      if (isDevelopment() === 'development') {
        console.log("Fetching capstone supervisors...")
      }
      const capstoneSupervisorsResponse = await axiosInstance.get(`/Account/CapstoneSupervisors`)

      // Use the same data extraction logic as BottomSection
      const capstoneSupervisorsData = capstoneSupervisorsResponse.data
      const capstoneSupervisorsList = Array.isArray(capstoneSupervisorsData) ? capstoneSupervisorsData : capstoneSupervisorsData?.$values || []
      if (isDevelopment() === 'development') {
        console.log("Capstone supervisors list:", capstoneSupervisorsList.length);
      }

      // Map all capstone supervisors from the CapstoneSupervisorExtension table
      const supervisors = capstoneSupervisorsList.map((supervisor) => ({
        id: supervisor.accountId || supervisor.AccountId || supervisor.id || supervisor.Id,
        fullName: supervisor.fullNameEn || supervisor.FullNameEn || supervisor.fullNameAr || supervisor.FullNameAr || "Capstone Supervisor",
        role: "Capstone Supervisor"
      }))
      if (isDevelopment() === 'development') {
        console.log("All supervisors:", supervisors.length);
      }

      return { reviewers, supervisor: supervisors }
    } catch (error) {
      if (isDevelopment() === 'development') {
        console.error("Error fetching team info:", error)
      }
      return {
        reviewers: [],
        supervisor: null
      }
    }
  }

  // Get reports for a specific student (filter out confirmed reports)
  const getStudentReports = (studentId) => {
    return reports.filter(report => report.submitterAccountId === studentId)
  }

  // Handle viewing student reports
  const handleViewStudentReports = (student) => {
    setSelectedStudent(student)
    setViewMode("student-reports")
  }

  // Handle going back to team info
  const handleBackToTeamInfo = () => {
    setSelectedStudent(null)
    setViewMode("team-info")
  }

  // Handle going back to teams overview
  const handleBackToTeams = () => {
    setSelectedTeam(null)
    setSelectedStudent(null)
    setViewMode("teams")
  }

  const handleViewSubmissionLink = (submission) => {
    setSubmissionLinkModal({
      isOpen: true,
      submissionData: submission
    })
  }

  const handleCloseSubmissionLinkModal = () => {
    setSubmissionLinkModal({
      isOpen: false,
      submissionData: null
    })
  }

  const handleOpenTaskDetails = (task) => {
    const team = teams.find((item) => Number(item.id) === Number(task.teamId)) || selectedTeam

    setSelectedTaskDetails({
      id: task.id,
      taskId: task.taskId || task.id,
      title: task.taskName || task.name || `Task ${task.id ?? "N/A"}`,
      description: task.taskDescription || task.description || "",
      teamId: task.teamId || team?.id || null,
      teamName: team?.teamName || null,
      className: task.className || team?.className || null,
      gradeName: task.gradeName || team?.gradeName || null,
      assignmentType: getTaskAssignmentType(task),
      statusLabel: getStatusText(task.statusId, task.taskDeadline, task.isPendingTask, task.isLate, task.submittedDate),
      deadlineText: task.taskDeadline ? formatCairoDate(task.taskDeadline) : "Not specified",
      submittedDateText: task.submittedDate ? formatCairoDate(task.submittedDate) : "Not submitted yet",
      submissionLink: task.glink || "",
      note: task.note || "",
      feedback: task.feedback || "",
    })
  }

  // Handle marking all reports as reviewed for a student
  const handleMarkAsReviewed = async (student) => {
    try {
      setReviewingStudentId(student.id) // Start loading

      const studentReports = getStudentReports(student.id)
      if (studentReports.length === 0) {
        showWarning("No Reports", "No reports found for this student.")
        return
      }

      // Update all reports for this student to confirmed status
      const updatePromises = studentReports.map(report =>
        axiosInstance.put(`/Reports/${report.id}`, {
          Id: report.id,
          Title: report.reportTitle,
          ReportMessage: report.reportContent,
          SubmitterAccountId: report.submitterAccountId,
          StatusId: STATUS_CONSTANTS.REPORT_CONFIRMED
        }, {
          headers: { "Content-Type": "application/json" }
        })
      )

      await Promise.all(updatePromises)

      // Update local state
      setReports(prevReports => prevReports.map(report => (
        report.submitterAccountId === student.id
          ? { ...report, statusId: STATUS_CONSTANTS.REPORT_CONFIRMED, status: "Confirmed" }
          : report
      )))

      showSuccess("Reports Confirmed", `All reports for ${student.fullName} have been marked as confirmed!`)
    } catch (error) {
      if (isDevelopment() === 'development') {
        console.error("Error marking reports as reviewed:", error)
      }
      showError("Confirmation Failed", "Failed to mark reports as reviewed. Please try again.")
    } finally {
      setReviewingStudentId(null) // Stop loading
    }
  }

  // Handle confirming a single report (change status to 5)
  const handleConfirmSingleReport = async (reportId) => {
    try {
      setConfirmingReportId(reportId);

      // Find the report to get its current data
      const reportToUpdate = reports.find(r => r.id === reportId);
      if (!reportToUpdate) {
        showError("Report not found");
        return;
      }

      if (isDevelopment() === 'development') {
        console.log("Confirming report:", reportId);
      }

      const updateData = {
        Id: reportId,
        Title: reportToUpdate.reportTitle,
        ReportMessage: reportToUpdate.reportContent,
        SubmitterAccountId: reportToUpdate.submitterAccountId,
        StatusId: STATUS_CONSTANTS.REPORT_CONFIRMED
      };

      if (isDevelopment() === 'development') {
        console.log("Sending update data");
      }

      const response = await axiosInstance.put(`/Reports/${reportId}`, updateData, {
        headers: { "Content-Type": "application/json" }
      })

      if (isDevelopment() === 'development') {
        console.log("Update response received");
      }

      if (response.status === 200 || response.status === 204) {
        // Update the local reports state
        setReports(prevReports =>
          prevReports.map(report =>
            report.id === reportId
              ? { ...report, statusId: STATUS_CONSTANTS.REPORT_CONFIRMED, status: "Confirmed" }
              : report
          )
        )

        // Update the teams state to reflect the new reports count
        setTeams(prevTeams =>
          prevTeams.map(team => ({
            ...team,
            teamMembers: team.teamMembers.map(member => {
              if (member.id === reportToUpdate.submitterAccountId) {
                // Recalculate reports count for this member (excluding confirmed reports)
                const updatedReports = reports.map(r => (r.id === reportId ? { ...r, statusId: STATUS_CONSTANTS.REPORT_CONFIRMED, status: "Confirmed" } : r));
                const memberReports = updatedReports.filter(r => r.submitterAccountId === member.id);
                return {
                  ...member,
                  reportsCount: memberReports.length
                };
              }
              return member;
            })
          }))
        );

        showSuccess("Report confirmed successfully!")
      } else {
        showError("Failed to confirm report")
      }
    } catch (error) {
      if (isDevelopment() === 'development') {
        console.error("Error confirming report:", error)
      }
      showError("Error confirming report: " + (error.response?.data || error.message))
    } finally {
      setConfirmingReportId(null);
    }
  }

  if (isDevelopment() === 'development') {
    console.log("ViewTasks render - viewMode:", viewMode, "loading:", loading, "filteredTeams:", filteredTeams?.length, "filteredSubmissions:", filteredSubmissions?.length)
  }

  return (
    <div className="view-tasks">
      <div className="view-tasks-header">
        <h1 className="view-tasks-title">
          {viewMode === "teams"
            ? "Teams Overview"
            : viewMode === "team-info"
              ? `${selectedTeam?.teamName} - Team Reports`
              : viewMode === "student-reports"
                ? `${selectedStudent?.fullName || "Student"} - Reports`
                : `${selectedTeam?.teamName} - Tasks`}
        </h1>
        {viewMode === "tasks" && (
          <button className="back-button" onClick={handleBackToTeams}>
            ← Back to Teams
          </button>
        )}
        {viewMode === "team-info" && (
          <button className="back-button" onClick={handleBackToTeams}>
            ← Back to Teams
          </button>
        )}
        {viewMode === "student-reports" && (
          <button className="back-button" onClick={handleBackToTeamInfo}>
            ← Back to Team Info
          </button>
        )}

        {viewMode === "teams" ? (
          <div className="filters-row">
            {(() => {
              const isEngineerUser = isEngineer(user);

              // For engineers: only show options from their assigned classes (even if no teams)
              const assignedGradeOptions = Array.from(new Set(assignedClasses.map(c => c.gradeName).filter(Boolean)))
              const assignedClassOptions = Array.from(new Set(assignedClasses.map(c => `${c.className}||${c.gradeName || ""}`).filter(Boolean)))

              const gradeOptions = isEngineerUser ? assignedGradeOptions : grades.map((g) => g.gradeName)
              const classOptions = isEngineerUser ? assignedClassOptions : classes.map((c) => `${c.className}||${c.gradeName}`)

              return (
                <>
                  <div className="search-input-wrapper">
                    <Search className="search-icon" size={18} />
                    <input
                      type="text"
                      placeholder="Search teams, classes, or grades..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="search-input"
                    />
                    {searchTerm && (
                      <button
                        className="clear-search-btn"
                        onClick={() => setSearchTerm("")}
                        aria-label="Clear search"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                  <select value={gradeFilter} onChange={(e) => setGradeFilter(e.target.value)} className="filter-select">
                    <option value="">All Grades</option>
                    {gradeOptions.map((gName, idx) => (
                      <option key={`g-${idx}`} value={gName}>
                        {gName}
                      </option>
                    ))}
                  </select>
                  <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)} className="filter-select">
                    <option value="">All Classes</option>
                    {classOptions.map((entry, idx) => {
                      const [cName, gName] = entry.split("||");
                      return (
                        <option key={`c-${idx}`} value={cName}>
                          {cName}{gName ? ` (${gName})` : ""}
                        </option>
                      );
                    })}
                  </select>
                </>
              );
            })()}
          </div>
        ) : viewMode === "tasks" ? (
          <div className="filters-row">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="filter-select">
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="submitted">Submitted</option>
              <option value="rejected">Rejected</option>
              <option value="completed">Completed</option>
            </select>

          </div>
        ) : null}
      </div>

      {viewMode === "teams" && (
        <div className="teams-list">
          {loading ? (
            <div className="loading-container">
              <Loader2 size={24} className="animate-spin" />
              <p>Loading teams...</p>
            </div>
          ) : filteredTeams.length === 0 ? (
            <div className="no-results">
              {(() => {
                const engineerUser = isEngineer(user);
                const classMatch = String(classFilter || "").trim().length > 0 && assignedClasses.some(c => (c.className || "").toLowerCase().includes(String(classFilter || "").toLowerCase()));
                const gradeMatch = String(gradeFilter || "").trim().length > 0 && assignedClasses.some(c => (c.gradeName || "").toLowerCase().includes(String(gradeFilter || "").toLowerCase()));
                const engineerHasAccessToSelected = engineerUser && (classMatch || gradeMatch);

                if (engineerHasAccessToSelected) {
                  return (
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                      <AlertTriangle size={48} style={{ color: '#f59e0b', marginBottom: '16px' }} />
                      <h3 style={{ color: '#111827', marginBottom: '8px' }}>No Teams Found</h3>
                      <p style={{ color: '#6b7280' }}>
                        You have access to this class/grade, but no teams exist yet.
                      </p>
                    </div>
                  );
                }

                if (engineerUser) {
                  return (
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                      <AlertTriangle size={48} style={{ color: '#f59e0b', marginBottom: '16px' }} />
                      <h3 style={{ color: '#dc2626', marginBottom: '8px' }}>Access Restricted</h3>
                      <p style={{ color: '#6b7280', marginBottom: '12px' }}>
                        You don't have access to teams matching the selected filters.
                      </p>
                      <p style={{ color: '#9ca3af', fontSize: '14px' }}>
                        Please contact your administrator to assign you to the appropriate classes.
                      </p>
                    </div>
                  );
                }

                return <p>No teams found matching your filters.</p>;
              })()}
            </div>
          ) : (
            filteredTeams.map((team) => {
              const stats = getTeamStats(team.id)
              if (isDevelopment() === 'development') {
                console.log(`Team ${team.teamName} stats:`, stats)
              }
              return (
                <div key={team.id} className="team-card" onClick={() => handleTeamClick(team)}>
                  <div className="team-info">
                    <h1 className="team-name" style={{ fontSize: "20px" }}>
                      {team.teamName}
                    </h1>

                    <div className="team-details">
                      <span className="team-class">Class: {team.className || "N/A"}</span>
                      <span className="team-grade">Grade: {team.gradeName || "N/A"}</span>
                    </div>
                    <div className="team-stats">
                      <div className="stat-item">
                        <span className="stat-label">Completed:</span>
                        <span className="stat-value completed">{stats.completed}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Submitted:</span>
                        <span className="stat-value submitted">{stats.submitted}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Rejected:</span>
                        <span className="stat-value rejected">{stats.rejected}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Overdue Tasks:</span>
                        <span className="stat-value overdue">{stats.overdue}</span>
                      </div>
                    </div>
                  </div>
                  <div className="team-actions">
                    <button
                      className="view-tasks-btn"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleTeamClick(team)
                      }}
                    >
                      <Eye size={16} />
                      View Tasks
                    </button>
                    <button
                      className="team-info-btn"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleTeamInfoClick(team)
                      }}
                    >
                      <Users size={16} />
                      Team Reports
                    </button>
                    {openTeamProfile && (
                      <button
                        className="team-profile-btn"
                        onClick={(e) => {
                          e.stopPropagation()
                          openTeamProfile(team.id)
                        }}
                      >
                        <Users size={16} />
                        Team Profile
                      </button>
                    )}
                    {!isBoard(user) && (isSuperAdmin(user) || isStaffAdmin(user) || isEngineer(user) || isCapstoneLead(user)) && setCurrentPage && (
                      <button
                        className="add-task-btn"
                        onClick={(e) => {
                          e.stopPropagation()
                          // Navigate to admin-tasks page with team pre-selected
                          if (setCurrentPage) {
                            // Store team info in sessionStorage to pass to AdminTasksPage
                            sessionStorage.setItem('addTaskForTeam', JSON.stringify({
                              teamId: team.id,
                              teamName: team.teamName,
                              classId: team.classId,
                              gradeId: team.gradeId
                            }))
                            setCurrentPage('admin-tasks')
                          }
                        }}
                        title="Add Task for this Team"
                      >
                        <Plus size={16} />
                        Add Task
                      </button>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {viewMode === "tasks" && (
        <div className="submissions-list">
          {loading ? (
            <div className="loading-container">
              <Loader2 size={24} className="animate-spin" />
              <p>Loading...</p>
            </div>
          ) : teamTasks.length === 0 ? (
            <div className="no-results">
              <p>No tasks found for this team.</p>
            </div>
          ) : (
            teamTasks.map((task) => (
              <div key={task.id} className="task-item" style={{ padding: '20px', marginBottom: '16px', background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {/* Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => handleOpenTaskDetails(task)}
                      title="View task details"
                      style={{
                        fontSize: '18px',
                        fontWeight: '700',
                        color: '#1a202c',
                        margin: 0,
                        flex: 1,
                        minWidth: '200px',
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        textAlign: 'left',
                        cursor: 'pointer',
                      }}
                    >
                      {task.taskName || `Task #${task.id ?? "N/A"}`}
                    </button>
                    <span
                      style={{
                        padding: '6px 12px',
                        borderRadius: '20px',
                        fontSize: '11px',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        backgroundColor: getStatusColor(task.statusId, task.taskDeadline, task.isPendingTask, task.isLate) + '20',
                        color: getStatusColor(task.statusId, task.taskDeadline, task.isPendingTask, task.isLate),
                        display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        {getStatusIcon(getStatusText(task.statusId, task.taskDeadline, task.isPendingTask, task.isLate, task.submittedDate))}
                        {getStatusText(task.statusId, task.taskDeadline, task.isPendingTask, task.isLate, task.submittedDate)}
                      </span>
                    </div>

                  {/* Description */}
                  {task.taskDescription && (
                    <p style={{ fontSize: '14px', color: '#64748b', margin: 0, lineHeight: '1.5' }}>{task.taskDescription}</p>
                  )}

                  {/* Meta Info */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}>
                      <span style={{ color: '#64748b', fontWeight: '500' }}>Team:</span>
                      <span style={{ color: '#1a202c', fontWeight: '600', background: 'rgba(239,68,68,0.08)', padding: '2px 8px', borderRadius: '6px', fontSize: '12px' }}>#{task.teamId}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}>
                      <span style={{ color: '#64748b', fontWeight: '500' }}>Grade:</span>
                      <span style={{ color: '#1a202c', fontWeight: '600' }}>{task.gradeName || "N/A"}</span>
                    </div>
                    {task.taskDeadline && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}>
                        <span style={{ color: '#64748b', fontWeight: '500' }}>Deadline:</span>
                        <span style={{ color: '#1a202c', fontWeight: '600' }}>{formatCairoDate(task.taskDeadline)}</span>
                      </div>
                    )}
                    {task.submittedDate && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}>
                        <span style={{ color: '#64748b', fontWeight: '500' }}>Submitted:</span>
                        <span style={{ color: '#1a202c', fontWeight: '600' }}>{formatCairoDate(task.submittedDate)}</span>
                      </div>
                    )}
                  </div>

                  {/* Submission Details */}
                  {task.submissionId && (
                    <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', borderTop: '2px solid #e2e8f0', marginTop: '4px' }}>
                      {task.glink && (
                        <a
                          href={task.glink}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#3b82f6', textDecoration: 'none', fontSize: '14px', marginRight: '12px' }}
                        >
                          <LinkIcon size={14} />
                          View Submission
                        </a>
                      )}
                      {task.note && (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: '#64748b', marginTop: '4px' }}>
                          <StickyNote size={14} />
                          <span>{task.note}</span>
                        </div>
                      )}
                      {task.feedback && (
                        <div style={{ marginTop: '8px', padding: '8px', background: 'white', borderRadius: '6px', fontSize: '13px' }}>
                          <span style={{ fontWeight: '600', color: '#64748b' }}>Feedback: </span>
                          <span style={{ color: '#1a202c' }}>{task.feedback}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Buttons - Show for all roles that can access this page */}
                  {task.submissionId && (
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
                      <button
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', borderRadius: '6px', border: 'none', background: '#dbeafe', color: '#2563eb', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}
                        onClick={() => {
                          console.log("View/Add Feedback clicked, task:", task)
                          setSelectedTask(task)
                          setFeedback(task.feedback || "")
                        }}
                      >
                        <Eye size={14} />
                        View/Add Feedback
                      </button>
                      {task.statusId !== STATUS_CONSTANTS.TASK_COMPLETED && task.statusId !== STATUS_CONSTANTS.TASK_COMPLETED_LATE && (
                        <button
                          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', borderRadius: '6px', border: 'none', background: '#d1fae5', color: '#059669', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}
                          onClick={() => handleMarkCompleted(task.submissionId)}
                        >
                          <CheckCircle size={14} />
                          Mark Completed
                        </button>
                      )}
                      {task.statusId !== STATUS_CONSTANTS.TASK_REJECTED && task.statusId !== STATUS_CONSTANTS.TASK_COMPLETED && task.statusId !== STATUS_CONSTANTS.TASK_COMPLETED_LATE && (
                        <button
                          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', borderRadius: '6px', border: 'none', background: '#fee2e2', color: '#dc2626', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}
                          onClick={() => handleRejectTask(task.submissionId)}
                        >
                          <X size={14} />
                          Reject
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {viewMode === "team-info" && (
        <div className="team-info-view">
          {loading ? (
            <div className="loading-container">
              <Loader2 size={24} className="animate-spin" />
              <p>Loading team information...</p>
            </div>
          ) : selectedTeam ? (
            <div className="team-info-container">
              <div className="team-info-header">
                <h2>{selectedTeam.teamName}</h2>
                <p className="project-name">Project: {selectedTeam.teamName} Capstone Project</p>
              </div>

              <div className="team-info-sections">
                <div className="team-section">
                  <h3>Team Members</h3>
                  <div className="team-members-list">
                    {selectedTeam.teamMembers?.map((member, index) => (
                      <div key={index} className="team-member-item">
                        <div className="member-avatar">{member.fullName?.charAt(0) || "M"}</div>
                        <div className="member-info">
                          <span className="member-name">{member.fullName || `Member ${index + 1}`}</span>
                          <span className="member-role">{member.role || "Team Member"}</span>
                          <span className="member-reports-count">
                            <FileText size={14} />
                            {member.reportsCount || 0} New Reports
                          </span>
                        </div>
                        <div className="member-actions">
                          <button
                            className="view-reports-btn"
                            onClick={() => handleViewStudentReports(member)}
                          >
                            <Eye size={14} />
                            View Reports
                          </button>
                          {(() => {
                            const studentReports = getStudentReports(member.id);
                            const hasUnreviewedReports = studentReports.some(report => report.statusId === STATUS_CONSTANTS.REPORT_SUBMITTED);

                          })()}
                        </div>
                      </div>
                    )) || <p className="no-members">No team members found</p>}
                  </div>
                </div>

                <div className="team-section">
                  <h3>Engineers</h3>
                  <div className="reviewers-list">
                    {selectedTeam.reviewers?.map((reviewer, index) => (
                      <div key={index} className="reviewer-item">
                        <div className="reviewer-avatar">{reviewer.fullName?.charAt(0) || "E"}</div>
                        <div className="reviewer-info">
                          <span className="reviewer-name">{reviewer.fullName || `Engineer ${index + 1}`}</span>
                          <span className="reviewer-role">{reviewer.role || "Engineer"}</span>
                        </div>
                      </div>
                    )) || <p className="no-reviewers">No engineers assigned</p>}
                  </div>
                </div>

                <div className="team-section">
                  <h3>Supervisors</h3>
                  <div className="supervisors-list">
                    {selectedTeam.supervisor?.length > 0 ? (
                      selectedTeam.supervisor.map((supervisor, index) => (
                        <div key={index} className="supervisor-item">
                          <div className="supervisor-avatar">
                            {supervisor?.fullName?.charAt(0) || "S"}
                          </div>
                          <div className="supervisor-details">
                            <span className="supervisor-name">
                              {supervisor?.fullName || `Supervisor ${index + 1}`}
                            </span>
                            <span className="supervisor-role">{supervisor?.role || "Capstone Supervisor"}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="no-supervisor">No supervisors assigned</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="no-results">
              <p>No team selected</p>
            </div>
          )}
        </div>
      )}

      {viewMode === "student-reports" && (
        <div className="student-reports-view">
          {loading ? (
            <div className="loading-container">
              <Loader2 size={24} className="animate-spin" />
              <p>Loading student reports...</p>
            </div>
          ) : selectedStudent ? (
            <div className="student-reports-container">
              <div className="student-reports-header">
                <h2>{selectedStudent.fullName || "Student"} Reports</h2>
              </div>

              <div className="reports-list">
                {(() => {
                  const studentReports = getStudentReports(selectedStudent.id);
                  return (
                    <>
                      <div className="filters-row" style={{ marginBottom: 12 }}>
                        <select value={reportStatusFilter} onChange={(e) => setReportStatusFilter(e.target.value)} className="filter-select">
                          <option value="all">All</option>
                          <option value="submitted">Submitted</option>
                          <option value="reviewed">Reviewed</option>
                        </select>
                      </div>
                      {(() => {
                        const sel = reportStatusFilter;
                        const filtered = studentReports.filter(r => {
                          if (sel === 'all') return true;
                          if (sel === 'submitted') return r.statusId === STATUS_CONSTANTS.REPORT_SUBMITTED;
                          if (sel === 'reviewed') return r.statusId === STATUS_CONSTANTS.REPORT_CONFIRMED;
                          return true;
                        });
                        return filtered.length === 0 ? (
                          <div className="no-reports">
                            <p>No reports found for {selectedStudent.fullName || "this student"}.</p>
                          </div>
                        ) : (
                          filtered.map((report) => (
                            <div key={report.id} className="report-item">
                              <div className="report-header">
                                <h4>{report.reportTitle}</h4>
                                <div className="report-status">
                                  <span className="status-text">
                                    {report.statusId === STATUS_CONSTANTS.REPORT_CONFIRMED ? "Reviewed" : "Submitted"}
                                  </span>
                                  <span className="status-icon">
                                    <CheckCircle size={12} />
                                  </span>
                                </div>
                              </div>
                              <div className="report-content">
                                <p>{report.reportContent}</p>
                                <div className="report-meta">
                                  <span className="report-date">Submitted on {formatCairoDateOnly(report.submittedDate)}</span>
                                  {report.statusId !== STATUS_CONSTANTS.REPORT_CONFIRMED && (
                                    <button
                                      className="confirm-report-btn"
                                      onClick={() => handleConfirmSingleReport(report.id)}
                                      title="Mark as reviewed"
                                      disabled={confirmingReportId === report.id}
                                    >
                                      {confirmingReportId === report.id ? (
                                        <Loader2 size={14} className="animate-spin" />
                                      ) : (
                                        <CheckCircle size={14} />
                                      )}
                                      {confirmingReportId === report.id ? "Marking as Reviewed..." : "Mark as Reviewed"}
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))
                        );
                      })()}
                    </>
                  );
                })()}
              </div>
            </div>
          ) : (
            <div className="no-results">
              <p>No student selected</p>
            </div>
          )}
        </div>
      )}

      {/* Submission Link Modal */}
      <SubmissionLinkModal
        isOpen={submissionLinkModal.isOpen}
        onClose={handleCloseSubmissionLinkModal}
        submissionData={submissionLinkModal.submissionData}
      />

      <TaskDetailsDialog
        isOpen={Boolean(selectedTaskDetails)}
        task={selectedTaskDetails}
        onClose={() => setSelectedTaskDetails(null)}
      />

      {/* Feedback Modal */}
      {selectedTask && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', borderBottom: '1px solid #e5e7eb' }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#111827' }}>Add Feedback</h2>
              <button 
                onClick={() => setSelectedTask(null)} 
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px', borderRadius: '6px' }}
              >
                <X size={20} style={{ color: '#6b7280' }} />
              </button>
            </div>

            <div style={{ padding: '20px' }}>
              {/* Task Info */}
              <div style={{ backgroundColor: '#f9fafb', padding: '16px', borderRadius: '8px', marginBottom: '20px' }}>
                <div style={{ marginBottom: '8px', fontSize: '14px' }}>
                  <span style={{ fontWeight: '600', color: '#374151' }}>Task: </span>
                  <span style={{ color: '#111827' }}>{selectedTask.taskName}</span>
                </div>
                <div style={{ marginBottom: '8px', fontSize: '14px' }}>
                  <span style={{ fontWeight: '600', color: '#374151' }}>Team: </span>
                  <span style={{ color: '#111827' }}>#{selectedTask.teamId}</span>
                </div>
                {selectedTask.feedback && (
                  <div style={{ marginTop: '12px', padding: '12px', backgroundColor: 'white', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#64748b', marginBottom: '4px' }}>Previous Feedback:</div>
                    <div style={{ fontSize: '14px', color: '#111827' }}>{selectedTask.feedback}</div>
                  </div>
                )}
              </div>

              {/* Feedback Input */}
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                  New Feedback:
                </label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Enter your feedback here..."
                  style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', color: '#374151', resize: 'vertical', minHeight: '100px', fontFamily: 'inherit' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', padding: '16px 20px', borderTop: '1px solid #e5e7eb' }}>
              <button
                onClick={() => setSelectedTask(null)}
                style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: 'white', color: '#374151', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleAddFeedback(selectedTask.submissionId, feedback)}
                disabled={!String(feedback || "").trim()}
                style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#ef4444', color: 'white', cursor: 'pointer', fontSize: '14px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px', opacity: !String(feedback || "").trim() ? 0.6 : 1 }}
              >
                <Send size={16} />
                Add Feedback
              </button>
            </div>
          </div>
        </div>
        )}
      </div>
    )
  }

export default ViewTasks

// Note: This component now receives dynamic user data from the Dashboard
// No more hardcoded fallback values, uses currentUserId prop instead
