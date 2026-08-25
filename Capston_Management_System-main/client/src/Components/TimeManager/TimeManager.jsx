import React, { useState, useEffect } from "react";
import { STATUS_CONSTANTS, StatusHelpers } from "../../utils/statusConstants";
import { axiosInstance } from "../../utils/authService";
import "./TimeManager.css";

const TimeManager = ({ currentStudentId, user = null }) => {
  const [progress, setProgress] = useState(0);
  const [totalTasks, setTotalTasks] = useState(0);
  const [submittedTasks, setSubmittedTasks] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusCounts, setStatusCounts] = useState({
    completed: 0, submitted: 0, submittedLate: 0, completedLate: 0
  });

  useEffect(() => {
    const fetchTaskProgress = async () => {
      if (!currentStudentId) return;
      try {
        setLoading(true);
        const tasksRes = await axiosInstance.get(`/AccountTask/StudentTasks/${currentStudentId}`);
        const tasksData = tasksRes.data;
        const tasksArray = Array.isArray(tasksData) ? tasksData : (tasksData?.$values || tasksData?.data || []);

        const subsRes = await axiosInstance.get(`/TaskSubmissions`);
        const subsData = subsRes.data;
        const allSubs = Array.isArray(subsData) ? subsData : (subsData?.$values || []);

        let userTeamId = null;
        try {
          const leaderRes = await axiosInstance.get(`/Teams/ByLeader/${currentStudentId}`);
          if (leaderRes.data && leaderRes.data.id) userTeamId = leaderRes.data.id;
        } catch (_) {}
        if (!userTeamId) {
          const membersRes = await axiosInstance.get(`/TeamMembers`);
          const membersData = membersRes.data;
          const membersArr = Array.isArray(membersData) ? membersData : (membersData?.$values || []);
          const found = membersArr.find(tm => tm.teamMemberAccountId === currentStudentId);
          if (found) userTeamId = found.teamId;
        }

        const userSubs = userTeamId
          ? allSubs.filter(s => Number(s.teamId ?? s.TeamId) === Number(userTeamId))
          : allSubs.filter(s => Number(s.teamLeaderId ?? s.TeamLeaderId) === Number(currentStudentId));
        let cOT = 0, sOT = 0, sL = 0, cL = 0;
        tasksArray.forEach(task => {
          const sub = userSubs.find(s => Number(s.taskId ?? s.TaskId) === Number(task.id ?? task.Id));
          if (sub) {
            const deadline = task.taskDeadline ?? task.TaskDeadline;
            const effectiveIsLate = task.isLate || false;
            const statusText = StatusHelpers.getStatusText(
              sub.statusId ?? sub.StatusId,
              deadline,
              false,
              effectiveIsLate,
              sub.createdAt ?? sub.CreatedAt ?? sub.submittedDate ?? sub.SubmittedDate
            );
            if (statusText === "Completed" || statusText === "Completed Late" || statusText === "Completed Very Late") cOT++;
            else if (statusText === "Submitted On Time") sOT++;
            else if (statusText === "Submitted Late" || statusText === "Submitted Very Late") sL++;
          }
        });
        const comp = cOT + cL, sub = sOT + sL, totalSub = comp + sub;
        const pct = tasksArray.length > 0 ? Math.round((totalSub / tasksArray.length) * 100) : 0;
        setTotalTasks(tasksArray.length); setSubmittedTasks(totalSub);
        setProgress(pct); setStatusCounts({ completed: comp, submitted: sub, submittedLate: sL, completedLate: cL });
      } catch (e) {
        console.error("TimeManager error:", e);
        setProgress(0); setTotalTasks(0); setSubmittedTasks(0);
        setStatusCounts({ completed: 0, submitted: 0, submittedLate: 0, completedLate: 0 });
      } finally { setLoading(false); }
    };
    fetchTaskProgress();
  }, [currentStudentId, user]);

  if (loading) return (
    <div className="time-manager">
      <div className="time-manager-header"><h3>Time Manager</h3><span className="time-manager-subtitle">Loading progress...</span></div>
    </div>
  );

  return (
    <div className="time-manager">
      <div className="time-manager-header"><h3>Time Manager</h3><span className="time-manager-subtitle">Your progress</span></div>
      <div className="progress-container">
        <div className="progress-bar"><div className="progress-fill" style={{ width: `${progress}%` }}></div></div>
        <span className="progress-text">{progress}% submitted</span>
      </div>
      <div className="task-summary"><p>{submittedTasks} of {totalTasks} tasks submitted</p></div>
    </div>
  );
};
export default TimeManager;
