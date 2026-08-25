
/**
 * TeamsProgress Component - Role-Based Access Control
 *
 * Student: No restrictions - can see all teams
 * Engineer: Can only see teams from classes assigned to them via ReviewerSupervisorExtension
 * Super Admin: No restrictions - can see all teams
 */

import { useState, useEffect } from "react"
import { Search, Users, Building, Grid, ChevronLeft, AlertTriangle, FileText } from "lucide-react"
import { useNotification } from "../../contexts/NotificationContext"
import { API_BASE_URL } from '../../config/apiConfig.js';
import { parseISO, format } from "date-fns"
import { isStudent, isEngineer } from "../../utils/roleUtils"
import { STATUS_CONSTANTS, StatusHelpers } from "../../utils/statusConstants"
import { filterTasksForTeam, getTaskAssignmentType } from "../../utils/taskFiltering";
import { axiosInstance } from "../../utils/authService";
import TaskDetailsDialog from "../TaskDetailsDialog/TaskDetailsDialog";
import "./TeamsProgress.css"

const TeamsProgress = ({ setCurrentPage, currentUserId = null, user = null }) => {
  const [teams, setTeams] = useState([])
  const [tasks, setTasks] = useState([])
  const [submissions, setSubmissions] = useState([])
  const [grades, setGrades] = useState([])
  const [classes, setClasses] = useState([])
  const [teamMembers, setTeamMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedTeam, setSelectedTeam] = useState(null)
  const [viewMode, setViewMode] = useState("teams") // 'teams' or 'grid'
  const [searchTerm, setSearchTerm] = useState("")
  const [filterGrade, setFilterGrade] = useState("")
  const [studentTeam, setStudentTeam] = useState(null)
  const [assignedClasses, setAssignedClasses] = useState([])
  const [selectedTaskDetails, setSelectedTaskDetails] = useState(null)
  const { showError, showSuccess } = useNotification()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)

      // Get current user ID from user object
      const currentUserId = user?.id

      // Determine which teams endpoint to use based on user role
      let teamsEndpoint = `${API_BASE_URL}/Teams`
      if (isEngineer(user) && currentUserId) {
        teamsEndpoint = `${API_BASE_URL}/Teams/ByEngineer/${currentUserId}`
        console.log(`TeamsProgress - Using engineer-specific endpoint: ${teamsEndpoint}`)
      }

      // Fetch all data in parallel
      const assignmentsPromise = (isEngineer(user) && currentUserId)
        ? axiosInstance.get(`/Teams/Assignments`)
        : Promise.resolve({ data: [] })

      const [teamsRes, submissionsRes, gradesRes, classesRes, teamMembersRes, assignmentsRes] = await Promise.all([
        axiosInstance.get(teamsEndpoint.replace(API_BASE_URL, '')),
        axiosInstance.get(`/TaskSubmissions`),
        axiosInstance.get(`/Grades`),
        axiosInstance.get(`/Class`),
        axiosInstance.get(`/TeamMembers`),
        assignmentsPromise,
      ])

      // Process teams data using the same robust approach as ViewTasks
      const teamsRaw = teamsRes.data
      console.log("TeamsProgress - Raw teams response:", teamsRaw)
      console.log("TeamsProgress - Teams response type:", typeof teamsRaw, "Is array:", Array.isArray(teamsRaw))
      
      // Safely extract teams array with better error handling (same as ViewTasks)
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
        console.error("Error extracting teams list:", error)
        teamsList = []
      }
      
      console.log("TeamsProgress - Extracted teams list:", teamsList)
      console.log("TeamsProgress - Teams list type:", typeof teamsList, "Is array:", Array.isArray(teamsList))
      
      // Ensure teamsList is an array before proceeding
      if (!Array.isArray(teamsList)) {
        console.error("Teams list is not an array, defaulting to empty array")
        teamsList = []
      }

      const teamsData = teamsList
      console.log("TeamsProgress - Extracted teams data:", teamsData)
      console.log("TeamsProgress - Teams data type:", typeof teamsData, "Is array:", Array.isArray(teamsData))

      // Process other data using the same robust approach
      const submissionsRaw = submissionsRes.data
      const submissionsList = Array.isArray(submissionsRaw)
        ? submissionsRaw
        : submissionsRaw?.$values
          ? submissionsRaw.$values
          : []
      const submissionsData = submissionsList

      const gradesRaw = gradesRes.data
      const gradesList = Array.isArray(gradesRaw) ? gradesRaw : gradesRaw?.$values ? gradesRaw.$values : []
      const gradesData = gradesList

      const classesRaw = classesRes.data
      const classesList = Array.isArray(classesRaw) ? classesRaw : classesRaw?.$values ? classesRaw.$values : []
      const classesData = classesList

      const teamMembersRaw = teamMembersRes.data
      const teamMembersList = Array.isArray(teamMembersRaw) ? teamMembersRaw : teamMembersRaw?.$values ? teamMembersRaw.$values : []
      const teamMembersData = teamMembersList

      // Process teams with class and grade info (using same approach as ViewTasks)
      const processedTeams = teamsData.map((team) => {
        // Find the class to get grade information
        const classInfo = classesData.find((c) => c.id === (team.classId ?? team.ClassId))
        
        // Get team members for this team
        const teamMembers = teamMembersData
          .filter((tm) => tm.teamId === (team.teamId ?? team.id ?? team.Id))
          .map((tm) => ({
            id: tm.teamMemberAccountId || tm.TeamMemberAccountId,
            fullName: tm.memberName || tm.MemberName || `Member ${tm.teamMemberAccountId || tm.TeamMemberAccountId}`,
            email: tm.memberEmail || tm.MemberEmail || "",
            role: tm.teamMemberDescription || tm.TeamMemberDescription || "Team Member",
          }))

        // Use gradeId and gradeName directly from team data (from API) if available, otherwise fallback to classInfo
        const teamGradeId = team.gradeId || team.GradeId || classInfo?.gradeId || classInfo?.GradeId
        const teamGradeName = team.gradeName || team.GradeName || classInfo?.gradeName || classInfo?.GradeName

        // Debug logging for grade information
        console.log(`TeamsProgress - Processing team ${team.teamName || team.TeamName}:`, {
          teamGradeId: teamGradeId,
          teamGradeName: team.gradeName || team.GradeName,
          classInfoGradeId: classInfo?.gradeId || classInfo?.GradeId,
          finalGradeId: teamGradeId,
          finalGradeName: teamGradeName
        })

        return {
          id: team.teamId ?? team.id ?? team.Id,
          name: team.teamName ?? team.TeamName,
          classId: team.classId ?? team.ClassId,
          className: team.className ?? team.ClassName,
          gradeId: teamGradeId,
          gradeName: teamGradeName,
          teamMembers,
          SupervisorAccountId: team.SupervisorAccountId ?? team.supervisorAccountId ?? team.supervisorAccountId ?? null,
          teamLeaderAccountId: team.teamLeaderAccountId || team.TeamLeaderAccountId,
          teamLeaderName: team.teamLeaderName || team.TeamLeaderName,
        }
      })

      // Fetch tasks based on role
      let tasksEndpoint = `${API_BASE_URL}/AccountTask`
      let rawTasks = []
      if (isStudent(user)) {
        if (!currentUserId) {
          console.error('TeamsProgress - No current user ID found for student')
        } else {
          console.log(`TeamsProgress - Fetching tasks for student ${currentUserId}`)
          const userTasksRes = await axiosInstance.get(`/AccountTask/StudentTasks/${currentUserId}`)
          rawTasks = userTasksRes.data.$values || userTasksRes.data || []
        }
      } else {
        console.log(`TeamsProgress - Fetching all tasks for admin/engineer/reviewer from: ${tasksEndpoint}`)
        const allTasksRes = await axiosInstance.get(tasksEndpoint.replace(API_BASE_URL, ''))
        rawTasks = allTasksRes.data.$values || allTasksRes.data || []
      }

      const processedTasks = rawTasks.map((task) => ({
        id: task.id || task.Id,
        name: task.taskName || task.TaskName,
        description: task.taskDescription || task.TaskDescription,
        deadline: task.taskDeadline || task.TaskDeadline,
        gradeId: task.gradeId || task.GradeId,
        classId: task.classId || task.ClassId,
        teamId: task.teamId || task.TeamId,
        assignedToId: task.assignedToId || task.AssignedToId || null,
        statusId: task.statusId || task.StatusId,
        adminAccountId: task.adminAccountId || task.AdminAccountId,
      }))
      
      console.log(`TeamsProgress - Tasks loaded: ${processedTasks.length}`)

      // Process submissions
      const processedSubmissions = submissionsData.map((submission) => ({
        id: submission.taskSubmissionId || submission.TaskSubmissionId || submission.id,
        taskId: submission.taskId || submission.TaskId,
        teamId: submission.teamId || submission.TeamId,
        statusId: submission.statusId || submission.StatusId,
        createdAt: submission.createdAt || submission.CreatedAt || submission.submittedDate || submission.SubmittedDate,
        submittedDate:
          submission.createdAt || submission.CreatedAt || submission.submittedDate || submission.SubmittedDate,
        glink: submission.glink || submission.Glink || "",
        note: submission.note || submission.Note || "",
        feedback: submission.feedback || submission.Feedback || "",
        isLate: submission.isLate || submission.IsLate || false,
      }))

      // Process team members
      const processedTeamMembers = teamMembersData.map((member) => ({
        id: member.teamMemberAccountId || member.TeamMemberAccountId,
        teamId: member.teamId || member.TeamId,
        name: member.memberName || member.MemberName || `Member ${member.teamMemberAccountId}`,
        role: member.teamMemberDescription || member.TeamMemberDescription || "Team Member",
      }))

      // Compute assigned classes for engineer even if there are no teams
      try {
        if (isEngineer(user) && currentUserId) {
          const assignmentsRaw = assignmentsRes?.data
          const assignmentsList = Array.isArray(assignmentsRaw) ? assignmentsRaw : (assignmentsRaw?.$values || [])
          const normalizedAssignments = assignmentsList.map(a => ({
            accountId: a.accountId || a.AccountId,
            assignedClassId: a.assignedClassId || a.AssignedClassId
          }))
          const assignedIdsSet = new Set(
            normalizedAssignments
              .filter(a => Number(a.accountId) === Number(currentUserId))
              .map(a => a.assignedClassId)
              .filter(Boolean)
          )
          const engineerAssignedClasses = classesData.filter(c => assignedIdsSet.has(c.id || c.Id))
          setAssignedClasses(engineerAssignedClasses)
        } else {
          setAssignedClasses([])
        }
      } catch (e) {
        setAssignedClasses([])
      }

      setTeams(processedTeams)
      setTasks(processedTasks)
      setSubmissions(processedSubmissions)
      setGrades(gradesData)
      setClasses(classesData)
      setTeamMembers(processedTeamMembers)

      // If user is a student, find their team and set it automatically
      if (isStudent(user) && currentUserId) {
        const userTeamMember = processedTeamMembers.find(tm => tm.id === currentUserId)
        if (userTeamMember) {
          const userTeam = processedTeams.find(team => team.id === userTeamMember.teamId)
          if (userTeam) {
            setStudentTeam(userTeam)
            setSelectedTeam(userTeam)
            setViewMode("grid")
          }
        }
        if (!userTeamMember) {
          const virtualTeam = {
            id: null,
            name: "My Class Tasks",
            className: "",
            gradeName: "",
            gradeId: null,
            classId: null,
            teamLeaderName: null
          }
          setStudentTeam(virtualTeam)
          setSelectedTeam(virtualTeam)
          setViewMode("grid")
        }
      }

      // Debug: Log SupervisorAccountId in raw teams data
      console.log("TeamsProgress - Raw teams data type:", typeof teamsData, "Is array:", Array.isArray(teamsData))
      console.log("TeamsProgress - Raw teams data structure:", teamsData)

      // Safely handle teams data
      let teamsWithSupervisor = []
      if (Array.isArray(teamsData)) {
        teamsWithSupervisor = teamsData.filter((t) => t.SupervisorAccountId || t.supervisorAccountId)
      } else if (teamsData && typeof teamsData === "object") {
        // Handle case where data might be wrapped in an object
        const teamsArray = teamsData.$values || teamsData.data || teamsData.teams || []
        if (Array.isArray(teamsArray)) {
          teamsWithSupervisor = teamsArray.filter((t) => t.SupervisorAccountId || t.supervisorAccountId)
        }
      }

      console.log(
        "TeamsProgress - Teams with SupervisorAccountId:",
        teamsWithSupervisor.map((t) => ({
          teamId: t.teamId || t.id || t.Id,
          teamName: t.teamName || t.TeamName,
          SupervisorAccountId: t.SupervisorAccountId || t.supervisorAccountId,
        })),
      )

      console.log("Data loaded:", {
        teams: processedTeams,
        tasks: processedTasks,
        submissions: processedSubmissions,
        teamMembers: processedTeamMembers,
      })
    } catch (error) {
      console.error("Error fetching data:", error)
      showError("Failed to load data. Please check your connection and try again.")
    } finally {
      setLoading(false)
    }
  }

  const selectTeam = (team) => {
    setSelectedTeam(team)
    setViewMode("grid")
  }

  // Function to get time remaining until deadline (similar to PhasesSection)
  const getTimeRemaining = (deadlineString) => {
    if (!deadlineString) return null
    
    try {
      const utcDate = parseISO(deadlineString)
      const cairoDeadline = new Date(utcDate.toLocaleString("en-US", { timeZone: "Africa/Cairo" }))
      const now = new Date()
      const diff = cairoDeadline - now
      
      if (diff <= 0) return null // Deadline has passed
      
      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      
      if (days > 0) return `${days} day${days > 1 ? 's' : ''} remaining`
      if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} remaining`
      if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} remaining`
      return "Less than 1 minute remaining"
    } catch (error) {
      console.error("Error calculating time remaining:", error)
      return null
    }
  }

  // SECURITY: Deadline checking is now handled by the server
  // Client-side deadline checking can be manipulated by users
  // Always rely on server-side validation for security

  const getTaskStatus = (taskId, teamId) => {
    const submission = submissions.find((s) => s.taskId === taskId && s.teamId === teamId)
    const task = tasks.find((t) => t.id === taskId)

    // Default status is "Pending" (like PhasesPage)
    let status = "not-completed-yet"
    let isPendingTask = false

    if (submission) {
      // Use server isLate for submitted tasks only
      const effectiveIsLate = task?.isLate || false
      
      // Check if submission is more than 3 days late
      let isVeryLate = false
      if (task?.deadline && submission.createdAt) {
        const deadlineDate = new Date(task.deadline)
        const submissionDate = new Date(submission.createdAt)
        const daysLate = Math.ceil((submissionDate - deadlineDate) / (1000 * 60 * 60 * 24))
        isVeryLate = daysLate > 3
        
        // Debug logging
        console.log(`Task ${taskId} deadline calculation:`, {
          deadline: task.deadline,
          deadlineDate: deadlineDate,
          submissionCreatedAt: submission.createdAt,
          submissionDate: submissionDate,
          daysLate: daysLate,
          isVeryLate: isVeryLate
        })
      }
      
      status = StatusHelpers.getStatusText(submission.statusId, task?.deadline, false, effectiveIsLate, submission.createdAt)
      
      // Convert StatusHelpers text to our internal status format
      switch (status) {
        case "Completed":
          status = effectiveIsLate ? (isVeryLate ? "completed-very-late" : "completed-late") : "completed-on-time"
          break
        case "Completed Late":
          status = isVeryLate ? "completed-very-late" : "completed-late"
          break
        case "Submitted On Time":
          status = "submitted"
          break
        case "Submitted Late":
          status = isVeryLate ? "submitted-very-late" : "submitted-late"
          break
        case "Rejected":
          status = "rejected"
          break
        case "Submitted Very Late":
          status = "submitted-very-late"
          break
        case "Completed Very Late":
          status = "completed-very-late"
          break
        default:
          status = "pending"
          break
      }
    } else {
      // No submission exists - this is a pending task
      isPendingTask = true
      const timeRemaining = getTimeRemaining(task?.deadline)
      const isClientLate = timeRemaining === null // If timeRemaining is null, deadline has passed
      const effectiveIsLate = task?.isLate || isClientLate // Use server value or client fallback
      
      if (effectiveIsLate) {
        status = "deadline-passed" // Red for deadline passed without submission
      } else {
        status = "pending" // Gray for pending tasks (deadline not passed)
      }
    }

    console.log(
      `Task ${taskId} for team ${teamId}: submission=${submission?.statusId}, deadline=${task?.deadline}, isLate=${task?.isLate}, isPendingTask=${isPendingTask}, finalStatus=${status}`,
    )

    return status
  }

  const getStatusBox = (status) => {
    const statusLabels = {
      "completed-on-time": "Completed",
      "completed-late": "Completed Late",
      "completed-very-late": "Completed Very Late",
      submitted: "Submitted",
      "submitted-late": "Submitted Late",
      "submitted-very-late": "Submitted Very Late",
      rejected: "Rejected",
      "deadline-passed": "Deadline Passed",
      pending: "Pending",
      "not-completed-yet": "Not Completed Yet",
    }

    const label = statusLabels[status] || "Unknown Status"

    switch (status) {
      case "completed-on-time":
        return <div className="status-box completed-on-time" title="Completed on time"><span className="status-box-label">{label}</span></div>
      case "completed-late":
        return <div className="status-box completed-late" title="Completed late"><span className="status-box-label">{label}</span></div>
      case "completed-very-late":
        return <div className="status-box completed-very-late" title="Completed very late (3+ days)"><span className="status-box-label">{label}</span></div>
      case "submitted":
        return <div className="status-box submitted" title="Submitted"><span className="status-box-label">{label}</span></div>
      case "submitted-late":
        return <div className="status-box submitted-late" title="Submitted late"><span className="status-box-label">{label}</span></div>
      case "submitted-very-late":
        return <div className="status-box submitted-very-late" title="Submitted very late (3+ days)"><span className="status-box-label">{label}</span></div>
      case "rejected":
        return <div className="status-box rejected" title="Rejected"><span className="status-box-label">{label}</span></div>
      case "deadline-passed":
        return <div className="status-box deadline-passed" title="Deadline passed"><span className="status-box-label">{label}</span></div>
      case "pending":
        return <div className="status-box pending" title="Pending"><span className="status-box-label">{label}</span></div>
      case "not-completed-yet":
        return <div className="status-box not-completed-yet" title="Not completed yet"><span className="status-box-label">{label}</span></div>
      default:
        return <div className="status-box not-completed-yet" title="Unknown status"><span className="status-box-label">{label}</span></div>
    }
  }

  const formatTaskDate = (dateString) => {
    if (!dateString) return "Not specified"

    try {
      return format(parseISO(dateString), "MMM dd, yyyy hh:mm a")
    } catch (error) {
      console.error("Failed to format task date:", error)
      return "Invalid date"
    }
  }

  const getTaskStatusLabel = (task, teamId) => {
    const submission = submissions.find((item) => item.taskId === task.id && item.teamId === teamId)
    return StatusHelpers.getStatusText(
      submission?.statusId || task.statusId,
      task.deadline,
      !submission,
      submission?.isLate ?? task.isLate ?? null,
      submission?.createdAt,
    )
  }

  const handleOpenTaskDetails = (task) => {
    if (!selectedTeam) return

    const submission = submissions.find((item) => item.taskId === task.id && item.teamId === selectedTeam.id)

    setSelectedTaskDetails({
      id: task.id,
      taskId: task.id,
      title: task.name || `Task ${task.id}`,
      description: task.description || "",
      teamId: selectedTeam.id,
      teamName: selectedTeam.name,
      className: selectedTeam.className || null,
      gradeName: selectedTeam.gradeName || null,
      teamLeaderName: selectedTeam.teamLeaderName || null,
      assignmentType: getTaskAssignmentType(task),
      statusLabel: getTaskStatusLabel(task, selectedTeam.id),
      deadlineText: formatTaskDate(task.deadline),
      submittedDateText: submission?.submittedDate ? formatTaskDate(submission.submittedDate) : "Not submitted yet",
      submissionLink: submission?.glink || "",
      note: submission?.note || "",
      feedback: submission?.feedback || "",
    })
  }

  // Debug logging for role-based filtering
  console.log("TeamsProgress - User role filtering:", {
    userRole: user?.role,
    currentUserId,
    totalTeams: teams.length,
    teamsWithSupervisor: teams
      .filter((t) => t.SupervisorAccountId)
      .map((t) => ({
        teamId: t.id,
        teamName: t.name,
        SupervisorAccountId: t.SupervisorAccountId,
      })),
  })

  const filteredTeams = (() => {
    return teams.filter((team) => {
      // Student: Only show their own team
      if (isStudent(user) && currentUserId) {
        const userTeamMember = teamMembers.find(tm => tm.id === currentUserId)
        if (userTeamMember) {
          return team.id === userTeamMember.teamId
        }
        return false // Student without team - don't show any teams
      }

      // Engineer/Reviewer: Teams are already filtered by the API endpoint based on assigned classes
      // Admin/Super Admin: Show all teams (no restrictions)

      const matchesSearch =
        team.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        team.className?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesGrade = !filterGrade || team.gradeId === Number.parseInt(filterGrade)
      return matchesSearch && matchesGrade
    })
  })()

  const renderTeamsView = () => {
    // If user is a student and has a team, show a message that they'll be redirected to their team
    if (isStudent(user) && studentTeam && studentTeam.id) {
      return (
        <div className="teams-vieww">
          <div className="head">
            <h1>Teams Progress</h1>
          </div>
          <div className="student-redirect-message">
            <Users size={48} />
            <h3>Redirecting to your team...</h3>
            <p>You will be automatically shown your team's progress grid.</p>
          </div>
        </div>
      )
    }

    // If user is a student without a team, show class-level tasks
    if (isStudent(user) && currentUserId && studentTeam && !studentTeam.id) {
      return null
    }

    // Fallback: if user is a student with no team and no studentTeam (shouldn't happen), show message
    if (isStudent(user) && currentUserId && !studentTeam) {
      return (
        <div className="teams-vieww">
          <div className="head">
            <h1>Teams Progress</h1>
          </div>
          <div className="no-teams">
            <AlertTriangle size={48} style={{ color: '#f59e0b', marginBottom: '16px' }} />
            <h3 style={{ color: '#dc2626', marginBottom: '8px' }}>No Team Assigned</h3>
            <p style={{ color: '#6b7280', marginBottom: '12px' }}>
              You are not currently assigned to any team.
            </p>
            <p style={{ color: '#9ca3af', fontSize: '14px' }}>
              Please contact your instructor or administrator to be assigned to a team.
            </p>
          </div>
        </div>
      )
    }

    return (
      <div className="teams-vieww">
        <div className="head">
          <h1>Teams Progress</h1>
        </div>

        {isEngineer(user) && assignedClasses && assignedClasses.length > 0 && (
          <div className="assigned-info" style={{ margin: '12px 0 4px 0', color: '#6b7280' }}>
            <span style={{ fontWeight: 600, color: '#374151' }}>Your grades:</span>{' '}
            {Array.from(new Set(assignedClasses.map(c => c.gradeName).filter(Boolean))).join(', ')}
          </div>
        )}

        <div className="filters">
          <div className="search-box">
            <Search size={20} />
            <input
              type="text"
              placeholder="Search teams..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select value={filterGrade} onChange={(e) => setFilterGrade(e.target.value)} className="grade-filter">
            <option value="">All Grades</option>
            {(() => {
              const engineerUser = isEngineer(user)
              if (engineerUser) {
                // Only grades from assigned classes (even if no teams)
                const uniqueAssignedGrades = Array.from(
                  new Map(
                    (assignedClasses || [])
                      .filter(c => (c.gradeId || c.GradeId) && (c.gradeName || c.GradeName))
                      .map(c => [String(c.gradeId || c.GradeId), { id: c.gradeId || c.GradeId, name: c.gradeName || c.GradeName }])
                  ).values()
                )
                return uniqueAssignedGrades.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))
              }
              return grades.map((grade) => (
                <option key={grade.id || grade.Id} value={grade.id || grade.Id}>
                  {grade.gradeName || grade.GradeName}
                </option>
              ))
            })()}
          </select>
        </div>

        <div className="teams-progress-grid">
          {filteredTeams.map((team) => (
            <div key={team.id} className="teams-progress-card" onClick={() => selectTeam(team)}>
              <div className="teams-progress-card-header">
                <Building size={24} />
                <h3>{team.name}</h3>
              </div>
              <div className="teams-progress-card-info">
                <p>
                  <strong>Class:</strong> {team.className}
                </p>
                <p>
                  <strong>Grade:</strong> {team.gradeName}
                </p>
              </div>
              <div className="teams-progress-card-actions">
                <button className="teams-progress-view-grid-btn">
                  <Grid size={16} />
                  View Task Grid
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredTeams.length === 0 && (
          <div className="no-teams">
            {(() => {
              const engineerUser = isEngineer(user)
              const selectedGradeId = filterGrade ? Number(filterGrade) : null
              // Engineer considered has access when specific grade is selected and assigned OR when no grade is selected but they have assigned classes
              const engineerHasAccessToSelected = engineerUser && (
                (selectedGradeId && assignedClasses.some(c => Number(c.gradeId || c.GradeId) === selectedGradeId)) ||
                (!selectedGradeId && assignedClasses.length > 0)
              )

              if (engineerHasAccessToSelected) {
                return (
                  <>
                    <Users size={48} />
                    <h3>No teams found</h3>
                    <p>You have access to these classes, but there are no teams yet.</p>
                  </>
                )
              }

              if (engineerUser) {
                return (
                  <>
                    <AlertTriangle size={48} style={{ color: '#f59e0b', marginBottom: '16px' }} />
                    <h3 style={{ color: '#dc2626', marginBottom: '8px' }}>Access Restricted</h3>
                    <p style={{ color: '#6b7280', marginBottom: '12px' }}>You don't have access to any teams.</p>
                    <p style={{ color: '#9ca3af', fontSize: '14px' }}>
                      Please contact your administrator to assign you to the appropriate classes.
                    </p>
                  </>
                )
              }

              return (
                <>
                  <Users size={48} />
                  <h3>No teams found</h3>
                  <p>Try adjusting your search or filters</p>
                </>
              )
            })()}
          </div>
        )}
      </div>
    )
  }

  const renderTaskGrid = () => {
    if (!selectedTeam) return null

    let teamTasks = []
    
    // For students, show all tasks assigned to them (like PhasesSection)
    // For other roles, filter tasks by team criteria
    if (isStudent(user)) {
      // Students should see all tasks assigned to them, not filtered by team
      teamTasks = tasks
      console.log(`TeamsProgress - Student: Showing all ${teamTasks.length} tasks assigned to student`)
    } else {
      // For admins/engineers/reviewers, filter tasks for the selected team
      const teamInfo = {
        gradeId: selectedTeam.gradeId,
        classId: selectedTeam.classId,
        teamId: selectedTeam.id
      }
      teamTasks = filterTasksForTeam(tasks, teamInfo)
      console.log(`TeamsProgress - Admin/Engineer: Showing ${teamTasks.length} tasks filtered for selected team`)
    }
    
    console.log("TeamsProgress - Selected Team:", selectedTeam);
    console.log("TeamsProgress - All tasks:", tasks);
    console.log("TeamsProgress - Tasks to show:", teamTasks);
    
    // Debug: Log each task's assignment details
    teamTasks.forEach((task, index) => {
      console.log(`TeamsProgress - Task ${index + 1}:`, {
        id: task.id,
        name: task.name,
        gradeId: task.gradeId,
        classId: task.classId,
        teamId: task.teamId,
        assignmentType: getTaskAssignmentType(task)
      });
    });
    // Get team members for this team
    const currentTeamMembers = teamMembers.filter((member) => member.teamId === selectedTeam.id)

    // Get all submissions for this team to see which tasks they have
    const teamSubmissions = submissions.filter((sub) => sub.teamId === selectedTeam.id)
    const teamTaskIds = [...new Set(teamSubmissions.map((sub) => sub.taskId))]

    console.log("Selected Team:", selectedTeam)
    console.log("All Tasks:", tasks)
    console.log("Team Tasks (filtered for selected team):", teamTasks)
    console.log("Team Members:", currentTeamMembers)
    console.log("Team Submissions:", teamSubmissions)
    console.log("Team Task IDs:", teamTaskIds)

    return (
      <div className="task-grid-view">
        <div className="grid-header">
          {/* Only show back button for non-student users */}
          {!isStudent(user) && (
            <button className="back-btn" onClick={() => setViewMode("teams")}>
              <ChevronLeft size={20} />
              Back to Teams
            </button>
          )}
          <h2>Task Status Grid - {selectedTeam.name}</h2>
          <div className="legend">
            <div className="legend-item">
              <div className="status-box completed-on-time"></div>
              <span>Completed (On Time)</span>
            </div>
            <div className="legend-item">
              <div className="status-box completed-late"></div>
              <span>Completed Late</span>
            </div>
            <div className="legend-item">
              <div className="status-box completed-very-late"></div>
              <span>Completed Very Late (3+ days)</span>
            </div>
            <div className="legend-item">
              <div className="status-box submitted"></div>
              <span>Submitted</span>
            </div>
            <div className="legend-item">
              <div className="status-box submitted-late"></div>
              <span>Submitted Late</span>
            </div>
            <div className="legend-item">
              <div className="status-box submitted-very-late"></div>
              <span>Submitted Very Late (3+ days)</span>
            </div>
            <div className="legend-item">
              <div className="status-box deadline-passed"></div>
              <span>Deadline Passed</span>
            </div>
            <div className="legend-item">
              <div className="status-box not-completed-yet"></div>
              <span>Pending</span>
            </div>
            <div className="legend-item">
              <div className="status-box rejected"></div>
              <span>Rejected</span>
            </div>
          </div>
        </div>

        <div className="task-grid">
          {teamTasks.length === 0 ? (
            <div className="no-tasks-message">
              <div className="no-tasks-icon">
                <FileText size={48} />
              </div>
              <h3>No tasks for this team</h3>
              <p>There are currently no tasks assigned to this team.</p>
            </div>
          ) : (
            /* Split tasks into chunks of 8 */
            (() => {
              const tasksPerRow = 8;
              const taskChunks = [];
              for (let i = 0; i < teamTasks.length; i += tasksPerRow) {
                taskChunks.push(teamTasks.slice(i, i + tasksPerRow));
              }
              
              return taskChunks.map((chunk, chunkIndex) => (
              <div key={chunkIndex} className="grid-section">
                {/* Header row for this chunk */}
                <div className="grid-row header-row">
                  {chunk.map((task) => (
                    <div
                      key={task.id}
                      className="grid-cell header-cell task-header"
                      role="button"
                      tabIndex={0}
                      title="View task details"
                      onClick={() => handleOpenTaskDetails(task)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault()
                          handleOpenTaskDetails(task)
                        }
                      }}
                    >
                      <div className="task-name">{task.name}</div>
                      <div className="task-assignment-type">{getTaskAssignmentType(task)}</div>
                      <div className="task-deadline">
                        {task.deadline ? format(parseISO(task.deadline), "MMM dd, yyyy") : "No deadline"}
                        {(() => {
                          const timeRemaining = getTimeRemaining(task.deadline)
                          const isLate = task.isLate || timeRemaining === null
                          if (isLate && !submissions.find(s => s.taskId === task.id && s.teamId === selectedTeam.id)) {
                            return <div className="deadline-warning">⚠️ Deadline Passed</div>
                          } else if (timeRemaining) {
                            return <div className="time-remaining">{timeRemaining}</div>
                          }
                          return null
                        })()}
                      </div>
                    </div>
                  ))}
                  {/* Fill remaining cells if chunk has less than 8 tasks */}
                  {chunk.length < tasksPerRow && Array.from({ length: tasksPerRow - chunk.length }, (_, i) => (
                    <div key={`empty-${i}`} className="grid-cell header-cell task-header empty-cell">
                      <div className="task-name">-</div>
                      <div className="task-assignment-type">-</div>
                      <div className="task-deadline">-</div>
                    </div>
                  ))}
                </div>

                {/* Data row for this chunk */}
                <div className="grid-row data-row">
                  {chunk.map((task) => {
                    const status = getTaskStatus(task.id, selectedTeam.id)
                    console.log(`Task ${task.id} status: ${status}`)
                    return (
                      <div key={task.id} className="grid-cell status-cell">
                        {getStatusBox(status)}
                      </div>
                    )
                  })}
                  {/* Fill remaining cells if chunk has less than 8 tasks */}
                  {chunk.length < tasksPerRow && Array.from({ length: tasksPerRow - chunk.length }, (_, i) => (
                    <div key={`empty-status-${i}`} className="grid-cell status-cell empty-cell">
                      <div className="status-box empty"></div>
                    </div>
                  ))}
                </div>
              </div>
            ));
          })()
          )}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="teams-progress-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <div className="loading-text">
            <div className="loading-title">Loading Teams Data</div>
            <div className="loading-subtitle">Please wait while we fetch teams information...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="teams-progress-container">
      {viewMode === "teams" ? renderTeamsView() : renderTaskGrid()}
      <TaskDetailsDialog
        isOpen={Boolean(selectedTaskDetails)}
        task={selectedTaskDetails}
        onClose={() => setSelectedTaskDetails(null)}
      />
    </div>
  )
}

export default TeamsProgress
