import { useEffect } from "react"
import { X, Calendar, FileText, Users, BookOpen, LinkIcon, StickyNote, MessageSquare, ClipboardList } from "lucide-react"
import "./TaskDetailsDialog.css"

const STATUS_STYLES = {
  Pending: { color: "#b45309", background: "#fef3c7" },
  "In Progress": { color: "#1d4ed8", background: "#dbeafe" },
  Submitted: { color: "#0f766e", background: "#ccfbf1" },
  "Submitted On Time": { color: "#0f766e", background: "#ccfbf1" },
  "Submitted Late": { color: "#c2410c", background: "#fed7aa" },
  "Submitted Very Late": { color: "#9a3412", background: "#ffedd5" },
  Completed: { color: "#047857", background: "#d1fae5" },
  "Completed Late": { color: "#7c3aed", background: "#ede9fe" },
  "Completed Very Late": { color: "#7c2d12", background: "#ffedd5" },
  Rejected: { color: "#b91c1c", background: "#fee2e2" },
  "Deadline Passed": { color: "#b91c1c", background: "#fee2e2" },
}

const getStatusStyle = (statusLabel) => {
  return STATUS_STYLES[statusLabel] || { color: "#334155", background: "#e2e8f0" }
}

const getTitle = (task) => {
  return task?.title || task?.taskName || task?.name || `Task ${task?.taskId || task?.id || ""}`.trim()
}

const getDescription = (task) => {
  return task?.description || task?.taskDescription || "No description available for this task."
}

const DetailRow = ({ icon: Icon, label, value, multiline = false }) => {
  if (!value) return null

  return (
    <div className={`task-details-dialog__detail-row${multiline ? " task-details-dialog__detail-row--multiline" : ""}`}>
      <div className="task-details-dialog__detail-label">
        <Icon size={16} />
        <span>{label}</span>
      </div>
      <div className="task-details-dialog__detail-value">{value}</div>
    </div>
  )
}

const TaskDetailsDialog = ({ isOpen, task, onClose, showTaskId = true }) => {
  useEffect(() => {
    if (!isOpen) return undefined

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose?.()
      }
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    window.addEventListener("keydown", handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen || !task) return null

  const statusStyle = getStatusStyle(task.statusLabel)
  const description = getDescription(task)

  return (
    <div className="task-details-dialog__overlay" onClick={onClose}>
      <div
        className="task-details-dialog"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-details-dialog-title"
      >
        <div className="task-details-dialog__header">
          <div>
            <p className="task-details-dialog__eyebrow">Task Details</p>
            <h2 id="task-details-dialog-title" className="task-details-dialog__title">
              {getTitle(task)}
            </h2>
          </div>
          <button type="button" className="task-details-dialog__close" onClick={onClose} aria-label="Close task details">
            <X size={18} />
          </button>
        </div>

        <div className="task-details-dialog__meta">
          {task.statusLabel && (
            <span
              className="task-details-dialog__badge"
              style={{ color: statusStyle.color, backgroundColor: statusStyle.background }}
            >
              {task.statusLabel}
            </span>
          )}
          {task.assignmentType && (
            <span className="task-details-dialog__badge task-details-dialog__badge--neutral">
              {task.assignmentType}
            </span>
          )}
          {showTaskId && (task.taskId || task.id) && (
            <span className="task-details-dialog__badge task-details-dialog__badge--neutral">
              ID: {task.taskId || task.id}
            </span>
          )}
        </div>

        <div className="task-details-dialog__body">
          <section className="task-details-dialog__section">
            <h3>Description</h3>
            <p>{description}</p>
          </section>

          <section className="task-details-dialog__section">
            <h3>Overview</h3>
            <div className="task-details-dialog__details-grid">
              <DetailRow
                icon={Users}
                label="Team"
                value={task.teamName || (task.teamId ? `Team #${task.teamId}` : null)}
              />
              <DetailRow icon={BookOpen} label="Grade" value={task.gradeName} />
              <DetailRow icon={ClipboardList} label="Class" value={task.className} />
              <DetailRow icon={Users} label="Team Leader" value={task.teamLeaderName} />
              <DetailRow icon={Calendar} label="Deadline" value={task.deadlineText} />
              <DetailRow icon={Calendar} label="Submitted" value={task.submittedDateText} />
            </div>
          </section>

          {(task.submissionLink || task.note || task.feedback) && (
            <section className="task-details-dialog__section">
              <h3>Submission Details</h3>
              <div className="task-details-dialog__details-grid">
                {task.submissionLink && (
                  <div className="task-details-dialog__detail-row task-details-dialog__detail-row--multiline">
                    <div className="task-details-dialog__detail-label">
                      <LinkIcon size={16} />
                      <span>Submission Link</span>
                    </div>
                    <div className="task-details-dialog__detail-value">
                      <a href={task.submissionLink} target="_blank" rel="noreferrer">
                        {task.submissionLink}
                      </a>
                    </div>
                  </div>
                )}
                <DetailRow icon={StickyNote} label="Note" value={task.note} multiline />
                <DetailRow icon={MessageSquare} label="Feedback" value={task.feedback} multiline />
              </div>
            </section>
          )}

          {!task.submissionLink && !task.note && !task.feedback && (
            <section className="task-details-dialog__section">
              <h3>Submission Details</h3>
              <div className="task-details-dialog__empty">
                <FileText size={18} />
                <span>No submission details available yet.</span>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}

export default TaskDetailsDialog

