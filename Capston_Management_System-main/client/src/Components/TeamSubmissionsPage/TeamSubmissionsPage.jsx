import { useState, useEffect } from "react"
import { FileText, Loader2, Send, Check, X, Users, BookOpen, Search, MessageSquare, Filter } from "lucide-react"
import { useNotification } from "../../contexts/NotificationContext"
import { API_BASE_URL, isDevelopment } from '../../config/apiConfig.js'
import { axiosInstance } from '../../utils/authService'
import { isEngineer, isReviewer } from "../../utils/roleUtils"
import { format, parseISO } from "date-fns"
import { getTaskAssignmentType } from "../../utils/taskFiltering"
import TaskDetailsDialog from "../TaskDetailsDialog/TaskDetailsDialog"

const TeamSubmissionsPage = ({ user = null, currentUserId = null, setCurrentPage = null }) => {
  const [loading, setLoading] = useState(true)
  const [submissions, setSubmissions] = useState([])
  const [tasks, setTasks] = useState([])
  const [teams, setTeams] = useState([])
  const [grades, setGrades] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [selectedSubmission, setSelectedSubmission] = useState(null)
  const [feedbackText, setFeedbackText] = useState("")
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const [showRejectConfirm, setShowRejectConfirm] = useState(false)
  const [submissionToReject, setSubmissionToReject] = useState(null)
  const [selectedTaskDetails, setSelectedTaskDetails] = useState(null)
  const [filterGrade, setFilterGrade] = useState("")
  const [filterTask, setFilterTask] = useState("")
  const [filterStatus, setFilterStatus] = useState("")
  const [filterTeam, setFilterTeam] = useState("")
  const [searchTerm, setSearchTerm] = useState("")

  const [assignedClasses, setAssignedClasses] = useState([])
  const { showSuccess, showError } = useNotification()

  useEffect(() => {
    fetchData()
  }, [user, currentUserId])

  const fetchData = async () => {
    setLoading(true)
    try {
      let teamsEndpoint = `${API_BASE_URL}/Teams`
      if ((isEngineer(user) || isReviewer(user)) && currentUserId) {
        teamsEndpoint = `${API_BASE_URL}/Teams/ByEngineer/${currentUserId}`
      }

      const [submissionsRes, tasksRes, teamsRes, gradesRes] = await Promise.all([
        axiosInstance.get(`/TaskSubmissions`),
        axiosInstance.get(`/AccountTask`),
        axiosInstance.get(teamsEndpoint.replace(API_BASE_URL, '')),
        axiosInstance.get(`/Grades`)
      ])

      const submissionsRaw = submissionsRes.data
      const submissionsList = Array.isArray(submissionsRaw) ? submissionsRaw : submissionsRaw?.$values ? submissionsRaw.$values : []
      setSubmissions(submissionsList)

      const tasksRaw = tasksRes.data
      const tasksList = Array.isArray(tasksRaw) ? tasksRaw : tasksRaw?.$values ? tasksRaw.$values : []
      setTasks(tasksList)

      const teamsRaw = teamsRes.data
      const teamsList = Array.isArray(teamsRaw) ? teamsRaw : teamsRaw?.$values ? teamsRaw.$values : []
      setTeams(teamsList)

      if ((isEngineer(user) || isReviewer(user)) && currentUserId) {
        const uniqueClasses = new Map()
        teamsList.forEach(team => {
          if (team.classId && !uniqueClasses.has(team.classId)) {
            uniqueClasses.set(team.classId, {
              classId: team.classId,
              className: team.className,
              gradeId: team.gradeId,
              gradeName: team.gradeName
            })
          }
        })
        setAssignedClasses(Array.from(uniqueClasses.values()))
      }

      const gradesRaw = gradesRes.data
      const gradesList = Array.isArray(gradesRaw) ? gradesRaw : gradesRaw?.$values ? gradesRaw.$values : []
      setGrades(gradesList)

    } catch (err) {
      if (isDevelopment() === 'development') {
        console.error("Error loading data:", err)
      }
      showError("Failed to load submissions data")
    } finally {
      setLoading(false)
    }
  }

  const getFilteredSubmissions = () => {
    let filtered = [...submissions]

    if (isEngineer(user) || isReviewer(user)) {
      const assignedTeamIds = teams
        .filter(t => t.classId && assignedClasses.some(ac => Number(ac.classId) === Number(t.classId)))
        .map(t => t.id)
      
      if (isDevelopment() === 'development') {
        console.log("TeamSubmissionsPage - Assigned team IDs:", assignedTeamIds)
        console.log("TeamSubmissionsPage - Assigned classes:", assignedClasses)
        console.log("TeamSubmissionsPage - Teams:", teams.map(t => ({ id: t.id, classId: t.classId, teamName: t.teamName })))
      }
      
      filtered = filtered.filter(s => assignedTeamIds.includes(Number(s.teamId)))
    }

    if (filterTeam) {
      filtered = filtered.filter(s => s.teamId === Number(filterTeam))
    }

    if (filterGrade) {
      filtered = filtered.filter(s => s.gradeId === Number(filterGrade))
    }

    if (filterTask) {
      filtered = filtered.filter(s => s.taskId === Number(filterTask))
    }

    if (filterStatus) {
      filtered = filtered.filter(s => s.statusId === Number(filterStatus))
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(s => {
        const team = teams.find(t => t.id === s.teamId)
        const task = tasks.find(t => t.id === s.taskId)
        const teamName = team?.teamName?.toLowerCase() || ""
        const taskName = task?.taskName?.toLowerCase() || ""
        const leaderName = s.teamLeaderName?.toLowerCase() || ""
        return teamName.includes(term) || taskName.includes(term) || leaderName.includes(term)
      })
    }

    return filtered
  }

  const getTaskName = (taskId) => {
    const task = tasks.find(t => t.id === taskId || t.Id === taskId)
    return task ? (task.taskName || task.TaskName) : `Task ${taskId}`
  }

  const getTeamName = (teamId) => {
    const team = teams.find(t => t.id === teamId || t.Id === teamId)
    return team ? (team.teamName || team.TeamName) : `Team ${teamId}`
  }

  const getGradeName = (gradeId) => {
    const grade = grades.find(g => g.id === gradeId || g.Id === gradeId)
    return grade ? (grade.gradeName || grade.GradeName) : `Grade ${gradeId}`
  }

  const getStatusInfo = (statusId) => {
    const statusMap = {
      1: { label: "Pending", color: "text-amber-700", bg: "bg-amber-100" },
      2: { label: "In Progress", color: "text-blue-700", bg: "bg-blue-100" },
      10: { label: "Submitted", color: "text-cyan-700", bg: "bg-cyan-100" },
      11: { label: "Submitted Late", color: "text-orange-700", bg: "bg-orange-100" },
      12: { label: "Completed", color: "text-emerald-700", bg: "bg-emerald-100" },
      13: { label: "Completed Late", color: "text-purple-700", bg: "bg-purple-100" },
      6: { label: "Rejected", color: "text-red-700", bg: "bg-red-100" },
    }
    return statusMap[statusId] || { label: `Status ${statusId}`, color: "text-gray-700", bg: "bg-gray-100" }
  }

  const formatDate = (dateString) => {
    if (!dateString) return "N/A"
    try {
      const date = parseISO(dateString)
      return format(date, "MMM dd, yyyy hh:mm a")
    } catch {
      return "Invalid date"
    }
  }

  const handleOpenFeedback = (submission) => {
    setSelectedSubmission(submission)
    setFeedbackText(submission.feedback || "")
    setShowFeedbackModal(true)
  }

  const handleSubmitFeedback = async () => {
    if (!selectedSubmission) return
    setSubmitting(true)
    try {
      await axiosInstance.post(`/TaskSubmissions/${selectedSubmission.taskSubmissionId}/feedback`, {
        Feedback: feedbackText
      })
      showSuccess("Feedback Sent", "Feedback has been added successfully!")
      setShowFeedbackModal(false)
      setSelectedSubmission(null)
      setFeedbackText("")
      await fetchData()
    } catch (err) {
      if (isDevelopment() === 'development') {
        console.error("Error sending feedback:", err)
      }
      showError("Failed to send feedback")
    } finally {
      setSubmitting(false)
    }
  }

  const handleMarkCompleted = async (submissionId) => {
    setSubmitting(true)
    try {
      await axiosInstance.post(`/TaskSubmissions/${submissionId}/review`, {
        Feedback: null
      })
      showSuccess("Marked Completed", "Submission has been marked as completed!")
      await fetchData()
    } catch (err) {
      if (isDevelopment() === 'development') {
        console.error("Error marking completed:", err)
      }
      showError("Failed to update submission")
    } finally {
      setSubmitting(false)
    }
  }

  const handleReject = (submissionId) => {
    setSubmissionToReject(submissionId)
    setShowRejectConfirm(true)
  }

  const handleOpenTaskDetails = (submission) => {
    const task = tasks.find((item) => Number(item.id ?? item.Id) === Number(submission.taskId))
    const team = teams.find((item) => Number(item.id ?? item.Id) === Number(submission.teamId))
    const statusInfo = getStatusInfo(submission.statusId)

    setSelectedTaskDetails({
      id: task?.id ?? task?.Id ?? submission.taskId,
      taskId: task?.id ?? task?.Id ?? submission.taskId,
      title: task?.taskName || task?.TaskName || `Task ${submission.taskId}`,
      description: task?.taskDescription || task?.TaskDescription || "",
      teamId: submission.teamId,
      teamName: team?.teamName || team?.TeamName || `Team ${submission.teamId}`,
      className: team?.className || team?.ClassName || "N/A",
      gradeName: getGradeName(submission.gradeId),
      teamLeaderName: submission.teamLeaderName || submission.TeamLeaderName || "",
      assignmentType: task ? getTaskAssignmentType({
        assignedToId: task.assignedToId ?? task.AssignedToId,
        gradeId: task.gradeId ?? task.GradeId,
        classId: task.classId ?? task.ClassId,
        teamId: task.teamId ?? task.TeamId,
      }) : null,
      statusLabel: statusInfo.label,
      deadlineText: task?.taskDeadline || task?.TaskDeadline ? formatDate(task.taskDeadline || task.TaskDeadline) : "Not specified",
      submittedDateText: submission.createdAt || submission.CreatedAt || submission.submittedDate || submission.SubmittedDate
        ? formatDate(submission.createdAt || submission.CreatedAt || submission.submittedDate || submission.SubmittedDate)
        : "Not submitted yet",
      submissionLink: submission.glink || submission.Glink || "",
      note: submission.note || submission.Note || "",
      feedback: submission.feedback || submission.Feedback || "",
    })
  }

  const confirmReject = async () => {
    if (!submissionToReject) return
    setSubmitting(true)
    try {
      await axiosInstance.post(`/TaskSubmissions/${submissionToReject}/reject`)
      showSuccess("Rejected", "Submission has been rejected!")
      await fetchData()
    } catch (err) {
      if (isDevelopment() === 'development') {
        console.error("Error rejecting:", err)
      }
      showError("Failed to reject submission")
    } finally {
      setSubmitting(false)
      setShowRejectConfirm(false)
      setSubmissionToReject(null)
    }
  }

  const cancelReject = () => {
    setShowRejectConfirm(false)
    setSubmissionToReject(null)
  }

  const getAvailableTeams = () => {
    if (isEngineer(user) || isReviewer(user)) {
      return teams.filter(t => assignedClasses.some(ac => ac.classId === t.classId))
    }
    return teams
  }

  const getAvailableGrades = () => {
    if (isEngineer(user) || isReviewer(user)) {
      const assignedGradeIds = assignedClasses.map(ac => ac.gradeId).filter(Boolean)
      return grades.filter(g => assignedGradeIds.includes(g.id))
    }
    return grades
  }

  const getAvailableTasks = () => {
    let filteredTasks = tasks
    if (isEngineer(user) || isReviewer(user)) {
      const assignedGradeIds = assignedClasses.map(ac => ac.gradeId).filter(Boolean)
      filteredTasks = tasks.filter(t => t.gradeId && assignedGradeIds.includes(t.gradeId))
    }
    if (filterGrade) {
      filteredTasks = filteredTasks.filter(t => t.gradeId === Number(filterGrade))
    }
    return filteredTasks
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 text-gray-500">
        <Loader2 className="w-8 h-8 animate-spin" />
        <p>Loading submissions...</p>
      </div>
    )
  }

  return (
    <div className="flex-1 p-6 bg-gray-100 min-w-0 overflow-x-hidden animate-fadeIn">
      <div className="mb-8 animate-fadeInDown">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Teams Submissions</h1>
        <p className="text-gray-600">
          {(isEngineer(user) || isReviewer(user))
            ? `Review submissions from your assigned class (${assignedClasses.map(ac => ac.className).join(', ')})`
            : "Review and provide feedback on all team submissions"
          }
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
        {(isEngineer(user) || isReviewer(user)) && assignedClasses.length > 0 && (
          <div className="w-full flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-700 mb-2">
            <BookOpen className="w-4 h-4" />
            <span>Showing submissions for: <strong>{assignedClasses.map(ac => ac.className).join(', ')}</strong></span>
          </div>
        )}

        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-gray-500" />
          <label className="text-sm font-medium text-gray-700">Team:</label>
          <select
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            value={filterTeam}
            onChange={(e) => setFilterTeam(e.target.value)}
          >
            <option value="">All Teams</option>
            {getAvailableTeams().map(team => (
              <option key={team.id} value={team.id}>{team.teamName}</option>
            ))}
          </select>
        </div>

        {!(isEngineer(user) || isReviewer(user)) && (
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <label className="text-sm font-medium text-gray-700">Grade:</label>
            <select
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              value={filterGrade}
              onChange={(e) => setFilterGrade(e.target.value)}
            >
              <option value="">All Grades</option>
              {getAvailableGrades().map(grade => (
                <option key={grade.id} value={grade.id}>{grade.gradeName}</option>
              ))}
            </select>
          </div>
        )}

        {!(isEngineer(user) || isReviewer(user)) && (
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-gray-500" />
            <label className="text-sm font-medium text-gray-700">Task:</label>
            <select
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              value={filterTask}
              onChange={(e) => setFilterTask(e.target.value)}
            >
              <option value="">All Tasks</option>
              {getAvailableTasks().map(task => (
                <option key={task.id} value={task.id}>{task.taskName}</option>
              ))}
            </select>
          </div>
        )}

        <div className="flex items-center gap-2">
          <Check className="w-4 h-4 text-gray-500" />
          <label className="text-sm font-medium text-gray-700">Status:</label>
          <select
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="1">Pending</option>
            <option value="2">In Progress</option>
            <option value="10">Submitted</option>
            <option value="11">Submitted Late</option>
            <option value="12">Completed</option>
            <option value="13">Completed Late</option>
            <option value="6">Rejected</option>
          </select>
        </div>

        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search by team, task, or leader..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {getFilteredSubmissions().length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[300px] text-gray-400 gap-4">
            <FileText className="w-12 h-12" />
            <p>No submissions found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Team</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Task</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Grade</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Class</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Team Leader</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Submitted</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Feedback</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {getFilteredSubmissions().map(submission => {
                  const statusInfo = getStatusInfo(submission.statusId)
                  return (
                    <tr key={submission.taskSubmissionId} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <Users className="w-4 h-4 text-gray-400" />
                          <span>{getTeamName(submission.teamId)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <FileText className="w-4 h-4 text-gray-400" />
                          <button
                            type="button"
                            className="truncate max-w-[150px] text-left text-blue-700 hover:text-blue-900 hover:underline"
                            onClick={() => handleOpenTaskDetails(submission)}
                            title="View task details"
                          >
                            {getTaskName(submission.taskId)}
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <BookOpen className="w-4 h-4 text-gray-400" />
                          <span>{getGradeName(submission.gradeId)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <span>{(() => {
                            const team = teams.find(t => t.id === submission.teamId)
                            return team?.className || "N/A"
                          })()}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{submission.teamLeaderName || "N/A"}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{formatDate(submission.createdAt)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${statusInfo.bg} ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {submission.feedback ? (
                          <span className="text-emerald-500">
                            <MessageSquare className="w-4 h-4" />
                          </span>
                        ) : (
                          <span className="text-gray-300">
                            <MessageSquare className="w-4 h-4" />
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            className="p-2 rounded-md bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
                            onClick={() => handleOpenFeedback(submission)}
                            title="View/Add Feedback"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>
                          {(submission.statusId === 10 || submission.statusId === 11) && (
                            <>
                              <button
                                className="p-2 rounded-md bg-emerald-100 text-emerald-600 hover:bg-emerald-200 transition-colors"
                                onClick={() => handleMarkCompleted(submission.taskSubmissionId)}
                                title="Mark as Completed"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                className="p-2 rounded-md bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                                onClick={() => handleReject(submission.taskSubmissionId)}
                                title="Reject"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      <TaskDetailsDialog
        isOpen={Boolean(selectedTaskDetails)}
        task={selectedTaskDetails}
        onClose={() => setSelectedTaskDetails(null)}
        showTaskId={false}
      />

      {showFeedbackModal && selectedSubmission && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">Submission Feedback</h2>
              <button 
                onClick={() => setShowFeedbackModal(false)} 
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="bg-gray-50 p-4 rounded-lg space-y-3 mb-6">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-gray-700">Team:</span>
                  <span className="text-gray-600">{getTeamName(selectedSubmission.teamId)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-gray-700">Task:</span>
                  <span className="text-gray-600">{getTaskName(selectedSubmission.taskId)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-gray-700">Status:</span>
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusInfo(selectedSubmission.statusId).bg} ${getStatusInfo(selectedSubmission.statusId).color}`}>
                    {getStatusInfo(selectedSubmission.statusId).label}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-gray-700">Submitted:</span>
                  <span className="text-gray-600">{formatDate(selectedSubmission.createdAt)}</span>
                </div>
                {selectedSubmission.glink && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-gray-700">Link:</span>
                    <a 
                      href={selectedSubmission.glink} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-blue-600 hover:underline"
                    >
                      View Submission
                    </a>
                  </div>
                )}
                {selectedSubmission.note && (
                  <div className="flex items-start gap-2 text-sm">
                    <span className="font-medium text-gray-700">Note:</span>
                    <span className="text-gray-600">{selectedSubmission.note}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Feedback:</label>
                <textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Enter your feedback for this submission..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  rows={5}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              <button
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                onClick={() => setShowFeedbackModal(false)}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium flex items-center gap-2"
                onClick={handleSubmitFeedback}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Save
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Confirmation Dialog */}
      {showRejectConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-2xl">
            <div className="p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                <X className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Reject Submission</h3>
              <p className="text-gray-600">
                Are you sure you want to reject this submission? This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-3 p-6 border-t border-gray-200">
              <button
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                onClick={cancelReject}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                onClick={confirmReject}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Rejecting...
                  </>
                ) : (
                  <>
                    <X className="w-4 h-4" />
                    Reject
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    )
  }

export default TeamSubmissionsPage

