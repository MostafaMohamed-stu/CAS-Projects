/**
 * Task Filtering Utility
 * Handles the cascading assignment system for tasks.
 */

const getNormalizedIds = (entity = {}) => ({
  gradeId: entity.gradeId ?? entity.GradeId ?? null,
  classId: entity.classId ?? entity.ClassId ?? null,
  teamId: entity.teamId ?? entity.TeamId ?? null,
  assignedToId: entity.assignedToId ?? entity.AssignedToId ?? null,
})

/**
 * Determines if a task should be shown to a specific student/team.
 * Team-level tasks may arrive without a classId, so teamId takes priority.
 */
export const shouldShowTask = (task, studentInfo) => {
  const taskIds = getNormalizedIds(task)
  const viewerIds = getNormalizedIds(studentInfo)

  if (taskIds.gradeId && viewerIds.gradeId && taskIds.gradeId !== viewerIds.gradeId) {
    return false
  }

  if (taskIds.teamId) {
    return taskIds.teamId === viewerIds.teamId
  }

  if (taskIds.classId) {
    return taskIds.classId === viewerIds.classId
  }

  if (taskIds.gradeId) {
    return taskIds.gradeId === viewerIds.gradeId
  }

  return false
}

/**
 * Filters tasks for a specific student/team.
 */
export const filterTasksForStudent = (tasks, studentInfo) => {
  return tasks.filter((task) => shouldShowTask(task, studentInfo))
}

/**
 * Filters tasks for a specific team.
 */
export const filterTasksForTeam = (tasks, teamInfo) => {
  return tasks.filter((task) => shouldShowTask(task, teamInfo))
}

/**
 * Gets task assignment type description.
 */
export const getTaskAssignmentType = (task) => {
  const { gradeId, classId, teamId, assignedToId } = getNormalizedIds(task)

  if (assignedToId) {
    return "Direct assignment"
  }

  if (teamId) {
    return "Team-level"
  }

  if (classId) {
    return "Class-level"
  }

  if (gradeId) {
    return "Grade-level"
  }

  return "Unknown"
}
