import { useState, useEffect } from "react";
import { useNotification } from "../../contexts/NotificationContext";
import { format, parseISO } from "date-fns";
import { AlertTriangle, Clock, CheckCircle, Upload, X } from "lucide-react";
import { STATUS_CONSTANTS, StatusHelpers } from "../../utils/statusConstants";
import { axiosInstance } from "../../utils/authService";
import { getCurrentWeekNumber, getWeekDateRange, groupTasksByWeek } from "../../utils/weekUtils";
import "./PhasesPage.css";

const PhasesPage = ({ setCurrentPage, setSelectedTask, currentUserId = null, user = null }) => {
  const [tasks, setTasks] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [userTeam, setUserTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [weeks, setWeeks] = useState([]); // Store fetched weeks
  const { showError } = useNotification();

  // Use the passed currentUserId or fall back to user.id
  const effectiveUserId = currentUserId || user?.id;

  // Function to format UTC dates to Cairo timezone
  const formatCairoDate = (dateString) => {
    if (!dateString) return "No deadline"

    try {
      // Parse the UTC date string
      const utcDate = parseISO(dateString)

      // Use browser's timezone conversion for Cairo time
      const cairoTime = new Date(utcDate.toLocaleString("en-US", { timeZone: "Africa/Cairo" }))

      // Format using date-fns with clear AM/PM display
      return format(cairoTime, "MMM dd, yyyy, hh:mm a")
    } catch (error) {
      console.error("Error formatting date:", error)
      return "Invalid date"
    }
  }

  // SECURITY: Deadline checking is now handled by the server
  // Client-side deadline checking can be manipulated by users
  // Always rely on server-side validation for security

  // Function to get time remaining until deadline
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

  const getStatusColor = (status) => {
    switch (status) {
      case "Completed":
        return "#38a169"
      case "Completed Late":
        return "#d69e2e"
      case "Completed Very Late":
        return "#b7791f"
      case "Submitted":
        return "#3182ce"
      case "Submitted On Time":
        return "#3182ce"
      case "Submitted Late":
        return "#e53e3e"
      case "Submitted Very Late":
        return "#c53030"
      case "Rejected":
        return "#e53e3e"
      case "Pending":
        return "#d69e2e"
      case "Late":
        return "#e53e3e"
      case "Deadline Passed":
        return "#e53e3e"
      default:
        return "#718096"
    }
  }

  const getStatusBgColor = (status) => {
    const color = getStatusColor(status);
    return color + '20'; // Add 20% opacity
  }

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
  }

  const fetchTasks = async () => {
    try {
      setLoading(true);

      // Fetch tasks for the user's grade - use same endpoint as PhasesSection
      const tasksResponse = await axiosInstance.get(`/AccountTask/StudentTasks/${effectiveUserId}`);
      const tasksArray = tasksResponse.data.$values || tasksResponse.data || [];

      // Fetch submissions for the user's team - use same endpoint as PhasesSection
      const submissionsResponse = await axiosInstance.get(`/TaskSubmissions`);
      const submissionsArray = submissionsResponse.data.$values || submissionsResponse.data || [];

      // Get user's team information - improved logic to check both leader and member
      let teamId = null;
      let teamName = "";
      let userTeamMember = null;

      // 1. Check if user is a team leader
      try {
        const leaderTeamRes = await axiosInstance.get(`/Teams/ByLeader/${effectiveUserId}`);
        if (leaderTeamRes.data && leaderTeamRes.data.id) {
          teamId = leaderTeamRes.data.id;
          teamName = leaderTeamRes.data.teamName;
          userTeamMember = { teamId, teamName, isLeader: true };
          console.log("PhasesPage - User is team leader:", userTeamMember);
        }
      } catch (e) {
        console.log("PhasesPage - User not a team leader");
      }

      // 2. If not a leader, check team membership
      if (!teamId) {
        const teamMembersResponse = await axiosInstance.get(`/TeamMembers`);
        const teamMembersArray = teamMembersResponse.data.$values || teamMembersResponse.data || [];
        const memberFound = teamMembersArray.find(tm => String(tm.teamMemberAccountId) === String(effectiveUserId));

        if (memberFound) {
          teamId = memberFound.teamId;
          teamName = memberFound.teamName || "My Team";
          userTeamMember = { teamId, teamName, isLeader: false };
          console.log("PhasesPage - User is team member:", userTeamMember);
        }
      }



      // Fetch Weeks
      const weeksResponse = await axiosInstance.get(`/Weeks?businessEntityName=CapstoneProject`);
      const weeksRaw = weeksResponse.data;
      const weeksData = Array.isArray(weeksRaw) ? weeksRaw : weeksRaw?.$values || [];
      const sortedWeeks = [...weeksData].sort((a, b) => a.id - b.id); // Ensure sorted by ID
      setWeeks(sortedWeeks);

      // Determine user's active team ID for task status filtering
      const userTeamId = userTeamMember?.teamId;

      const formatted = tasksArray.map(task => {
        // Find submission for this task by user's team
        const submission = userTeamId ?
          submissionsArray.find(s => s.taskId === task.id && s.teamId === userTeamId) :
          null;

        // Determine status based on submission and deadline using StatusHelpers
        let status = "Pending"; // Default status
        let statusId = STATUS_CONSTANTS.TASK_PENDING;
        let isPendingTask = false;

        if (submission) {
          statusId = submission.statusId;
          const effectiveIsLate = task.isLate || false;
          status = StatusHelpers.getStatusText(submission.statusId, task.taskDeadline, false, effectiveIsLate, submission.createdAt || submission.submittedDate);
        } else {
          // No submission exists - use server-provided isLate or client-side check
          isPendingTask = true;
          const clientLate = getTimeRemaining(task.taskDeadline) === null;
          const effectiveIsLate = task.isLate || clientLate;
          status = StatusHelpers.getStatusText(STATUS_CONSTANTS.TASK_PENDING, task.taskDeadline, true, effectiveIsLate);
        }

        console.log(`Final status for task ${task.id}: ${status}`);

        return {
          id: task.id,
          title: task.taskName || "Untitled Task",
          description: task.taskDescription || "No description available",
          status: status,
          statusId: statusId,
          isPendingTask: isPendingTask,
          isLate: task.isLate || false, // Include isLate from server
          deadline: task.taskDeadline,
          deadlineFormatted: task.taskDeadline ? formatCairoDate(task.taskDeadline) : "No deadline",
          gradeId: task.gradeId,
          adminAccountId: task.adminAccountId,
          weekId: task.weekId, // Use weekId
          weekTitle: task.weekTitle, // Use weekTitle
          submission: submission
        };
      });

      console.log("PhasesPage - Formatted tasks:", formatted);

      setTasks(formatted);
      setSubmissions(submissionsArray);
      setUserTeam(userTeamMember);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching tasks:", err);
      showError("Failed to load tasks");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [effectiveUserId]);

  const handleDetailsClick = (task) => {
    console.log("PhasesPage - handleDetailsClick called with task:", task);

    // Create the task data object that TaskDetailsPage expects
    const taskData = {
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      deadline: task.deadline || task.taskDeadline,
      gradeId: task.gradeId,
      adminAccountId: task.adminAccountId,
      // Include the raw data for additional information
      raw: task,
      studentTaskData: task.studentTaskData,
      // Include submission data with feedback
      submission: task.submission ? {
        id: task.submission.id,
        taskId: task.submission.taskId,
        teamId: task.submission.teamId,
        teamLeaderId: task.submission.teamLeaderId,
        glink: task.submission.glink,
        note: task.submission.note,
        feedback: task.submission.feedback,
        statusId: task.submission.statusId,
        submittedDate: task.submission.submittedDate,
        createdAt: task.submission.createdAt,
        updatedAt: task.submission.updatedAt
      } : null
    };
    console.log("PhasesPage - Complete task data for details:", taskData);
    console.log("PhasesPage - Setting selectedTask with ID:", taskData.id, "Title:", taskData.title);
    console.log("PhasesPage - About to call setSelectedTask...");
    setSelectedTask(taskData);
    console.log("PhasesPage - setSelectedTask called successfully");
    console.log("PhasesPage - Navigating to task-details page");

    // Navigate to task details page (same as PhasesSection)
    console.log("PhasesPage - Navigating to task-details page");
    setCurrentPage("task-details");
  };

  // Current week utilities are now imported from weekUtils

  // Function to check if all tasks in a week are completed
  const isWeekCompleted = (weekTasks) => {
    if (weekTasks.length === 0) return false // No tasks means not completed

    // Check if all tasks are completed (either "Completed" or "Completed Late")
    return weekTasks.every(task =>
      task.status === "Completed" || task.status === "Completed Late" || task.status === "Completed Very Late"
    )
  }

  // Function to get week completion status
  const getWeekCompletionStatus = (weekTasks) => {
    if (weekTasks.length === 0) return "no-tasks"
    if (isWeekCompleted(weekTasks)) return "completed"
    return "in-progress"
  }

  if (loading) return (
    <div className="phases-page">
      <div className="phases-page-header">
        <h1 className="phases-page-title">My Project Tasks</h1>
      </div>
      <div className="loading-container">
        <p>Loading your tasks...</p>
      </div>
    </div>
  );

  // If student doesn't have a team, show same alert and hide rest of page (like PhasesSection)
  if (!userTeam) {
    return (
      <div className="phases-page">
        <div className="phases-page-header">
          <h1 className="phases-page-title">My Project Tasks</h1>
        </div>
        <div className="no-team-message">
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
    <div className="phases-page">
      <div className="phases-page-header">
        <h1 className="phases-page-title">My Project Tasks</h1>
        {userTeam && (
          <div className="team-info">
            <span className="team-name">Team: {userTeam.teamName}</span>
          </div>
        )}
      </div>

      <div className="phases-weeks">
        <div className="phases-weeks-header">
          <h2>My Weekly Tasks</h2>
          {/* We can determine current week dynamically if needed, or just show list */}
        </div>
        {tasks.length === 0 ? (
          <div className="no-tasks">
            <p>No tasks found for your grade.</p>
          </div>
        ) : (
          <div className="weeks-grid">
            {weeks.map((week) => {
              const weekTasks = tasks.filter(t => t.weekId === week.id);

              // Check if current date is within this week
              const now = new Date();
              const startDate = parseISO(week.startDate);
              const endDate = parseISO(week.endDate);
              const isCurrent = now >= startDate && now <= endDate;

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
                      const timeRemaining = getTimeRemaining(task.deadline)
                      const isClientLate = timeRemaining === null
                      const isLate = task.isLate || isClientLate
                      const showRedBorder = task.isPendingTask && isLate
                      return (
                        <div key={task.id} className={`week-task-item ${showRedBorder ? 'deadline-passed' : ''}`}>
                          <div className="week-task-content">
                            <div className="week-task-info">
                              <div className="week-task-header">
                                <h4 className="week-task-title">{task.title}</h4>
                              </div>
                              <p className="week-task-description">{(task.description || '').slice(0, 100)}{(task.description || '').length > 100 ? '...' : ''}</p>
                              <div className="week-task-meta">
                                <div className="week-task-deadline">Deadline: {task.deadline ? formatCairoDate(task.deadline) : 'No deadline'}</div>
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
  );
};

export default PhasesPage;

// Note: This component now receives dynamic user data from the Dashboard
// No more hardcoded fallback values, uses currentUserId prop instead
