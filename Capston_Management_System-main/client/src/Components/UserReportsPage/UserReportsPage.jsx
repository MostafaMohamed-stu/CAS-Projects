import { useEffect, useMemo, useState } from "react";
import { CheckCircle, Filter, Loader2, Search, AlertTriangle } from "lucide-react";
import { axiosInstance } from "../../utils/authService";
import { isEngineer, isStaffAdmin, isSuperAdmin, isBoard, isCapstoneLead } from "../../utils/roleUtils";
import { useNotification } from "../../contexts/NotificationContext";
import { STATUS_CONSTANTS } from "../../utils/statusConstants";
import { parseISO, format, addHours } from "date-fns";
import "./UserReportsPage.css";

const UserReportsPage = ({ user = null, currentUserId = null }) => {
  const { showSuccess, showError } = useNotification();
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState([]);
  const [classes, setClasses] = useState([]);
  const [assignedClasses, setAssignedClasses] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("submitted"); // submitted | reviewed | all
  const [confirmingId, setConfirmingId] = useState(null);

  const canAccess = isEngineer(user) || isSuperAdmin(user) || isStaffAdmin(user) || isBoard(user) || isCapstoneLead(user);

  // Cairo timezone helpers (UTC+3)
  const CAIRO_TIMEZONE_OFFSET = 3;
  const formatCairoDateTime = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const utcDate = parseISO(dateString);
      const cairoTime = addHours(utcDate, CAIRO_TIMEZONE_OFFSET);
      return format(cairoTime, "MMM dd, yyyy hh:mm a");
    } catch {
      return "N/A";
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);

        const assignmentsPromise = isEngineer(user) && currentUserId ? axiosInstance.get(`/Teams/Assignments`) : Promise.resolve({ data: [] });

        const [reportsRes, classesRes, teamMembersRes, assignmentsRes] = await Promise.all([
          axiosInstance.get(`/Reports`),
          axiosInstance.get(`/Class`),
          axiosInstance.get(`/TeamMembers`),
          assignmentsPromise,
        ]);

        // Reports
        const rawReports = reportsRes.data;
        const list = Array.isArray(rawReports) ? rawReports : (rawReports?.$values || []);
        const normalizedReports = list.map(r => ({
          id: r.id ?? r.Id,
          title: r.title ?? r.Title ?? `Report ${r.id ?? r.Id}`,
          content: r.reportMessage ?? r.ReportMessage ?? "",
          submitterAccountId: r.submitterAccountId ?? r.SubmitterAccountId,
          authorName: r.submitterAccount?.fullNameEn ?? r.submitterAccount?.fullNameAr ?? r.SubmitterName ?? "Unknown",
          // server may not provide class/grade; we will enrich below using teamMembers
          classId: r.classId ?? r.ClassId ?? null,
          gradeId: r.gradeId ?? r.GradeId ?? null,
          statusId: r.statusId ?? r.StatusId ?? STATUS_CONSTANTS.REPORT_SUBMITTED,
          submittedDate: r.submissionDate ?? r.SubmissionDate ?? r.createdAt ?? r.CreatedAt,
        }));

        // Classes
        const rawClasses = classesRes.data;
        const classesList = Array.isArray(rawClasses) ? rawClasses : (rawClasses?.$values || []);
        const normalizedClasses = classesList.map(c => ({
          id: c.id ?? c.Id,
          className: c.className ?? c.ClassName,
          gradeId: c.gradeId ?? c.GradeId,
          gradeName: c.gradeName ?? c.GradeName,
        }));

        // Team Members (map submitter to class/grade)
        const rawTM = teamMembersRes.data;
        const listTM = Array.isArray(rawTM) ? rawTM : (rawTM?.$values || []);
        const normalizedTM = listTM.map(tm => ({
          accountId: tm.teamMemberAccountId ?? tm.TeamMemberAccountId,
          classId: tm.classId ?? tm.ClassId,
          gradeId: tm.gradeId ?? tm.GradeId,
          memberName: tm.memberName ?? tm.MemberName ?? null,
        }));

        // Assignments for engineer
        let engineerAssigned = [];
        if (isEngineer(user) && currentUserId) {
          const rawA = assignmentsRes?.data;
          const listA = Array.isArray(rawA) ? rawA : (rawA?.$values || []);
          const normalizedA = listA.map(a => ({
            accountId: a.accountId || a.AccountId,
            assignedClassId: a.assignedClassId || a.AssignedClassId,
          }));
          const ids = new Set(
            normalizedA.filter(a => Number(a.accountId) === Number(currentUserId)).map(a => a.assignedClassId)
          );
          engineerAssigned = normalizedClasses.filter(c => ids.has(c.id));
        }

        // Enrich reports with author name and class/grade via TeamMembers
        const tmByAccountId = new Map(normalizedTM.map(m => [Number(m.accountId), m]));
        const classById = new Map(normalizedClasses.map(c => [c.id, c]));

        let enrichedReports = normalizedReports.map(r => {
          const tm = tmByAccountId.get(Number(r.submitterAccountId));
          const classId = tm?.classId || r.classId;
          const gradeId = tm?.gradeId || r.gradeId;
          const cls = classId ? classById.get(classId) : null;
          const authorFromTM = tm ? (tm.memberName || tm.MemberName) : null;
          return {
            ...r,
            authorName: authorFromTM || r.authorName || 'Unknown Author',
            classId: classId || null,
            gradeId: gradeId || null,
            gradeName: cls?.gradeName || r.gradeName,
          };
        });

        // Fallback: fetch account names for any remaining unknown authors
        const unknownIds = Array.from(
          new Set(
            enrichedReports
              .filter(r => !r.authorName || r.authorName === 'Unknown Author')
              .map(r => r.submitterAccountId)
              .filter(Boolean)
          )
        );

        if (unknownIds.length > 0) {
          try {
            const results = await Promise.all(
              unknownIds.map(id => axiosInstance.get(`/Account/${id}`).then(res => ({ id, data: res.data })).catch(() => ({ id, data: null })))
            );
            const idToName = new Map(
              results.map(({ id, data }) => [
                Number(id),
                data ? (data.fullNameEn || data.fullNameAr || data.name || data.email || 'Unknown Author') : 'Unknown Author'
              ])
            );
            enrichedReports = enrichedReports.map(r => {
              if (!r.authorName || r.authorName === 'Unknown Author') {
                const name = idToName.get(Number(r.submitterAccountId));
                return { ...r, authorName: name || r.authorName };
              }
              return r;
            });
          } catch (_) {}
        }

        setReports(enrichedReports);
        setClasses(normalizedClasses);
        setAssignedClasses(engineerAssigned);
        setTeamMembers(normalizedTM);
      } catch (e) {
        showError("Failed to load user reports");
      } finally {
        setLoading(false);
      }
    };
    if (canAccess) load();
  }, [canAccess, user, currentUserId]);

  const filteredReports = useMemo(() => {
    let items = reports.slice();

    // Engineer limitation: only reports from assigned classes (exclude reports without class)
    if (isEngineer(user)) {
      const allowedClassIds = new Set(assignedClasses.map(c => c.id));
      items = items.filter(r => r.classId && allowedClassIds.has(r.classId));
    }

    // Filter by status (Submitted | Reviewed | All)
    items = items.filter(r => {
      if (statusFilter === "all") return true;
      if (statusFilter === "submitted") return r.statusId === STATUS_CONSTANTS.REPORT_SUBMITTED;
      if (statusFilter === "reviewed") return r.statusId === STATUS_CONSTANTS.REPORT_CONFIRMED;
      return true;
    });

    // Filter by class (drop down)
    if (String(classFilter || "").trim().length > 0) {
      items = items.filter(r => {
        const cls = classes.find(c => c.id === r.classId);
        return (cls?.className || "").toLowerCase().includes(String(classFilter).toLowerCase());
      });
    }

    // Search
    if (String(search || "").trim().length > 0) {
      const q = String(search).toLowerCase();
      items = items.filter(r =>
        (r.title || "").toLowerCase().includes(q) ||
        (r.content || "").toLowerCase().includes(q) ||
        (r.authorName || "").toLowerCase().includes(q)
      );
    }

    return items;
  }, [reports, classes, assignedClasses, user, statusFilter, classFilter, search]);

  const handleConfirm = async (reportId) => {
    try {
      setConfirmingId(reportId);
      const reportToUpdate = reports.find(r => r.id === reportId);
      if (!reportToUpdate) return;
      await axiosInstance.put(`/Reports/${reportId}`, {
        Id: reportId,
        Title: reportToUpdate.title,
        ReportMessage: reportToUpdate.content,
        SubmitterAccountId: reportToUpdate.submitterAccountId,
        StatusId: STATUS_CONSTANTS.REPORT_CONFIRMED
      }, { headers: { "Content-Type": "application/json" } });

      setReports(prev => prev.map(r => r.id === reportId ? { ...r, statusId: STATUS_CONSTANTS.REPORT_CONFIRMED } : r));
      showSuccess("Report marked as reviewed");
    } catch (e) {
      showError("Failed to mark as reviewed");
    } finally {
      setConfirmingId(null);
    }
  };

  if (!canAccess) {
    return (
      <div className="urp-page">
        <div className="urp-no-access">
          <AlertTriangle size={48} style={{ color: '#f59e0b', marginBottom: '16px' }} />
          <h3 style={{ color: '#dc2626', marginBottom: '8px' }}>Access Restricted</h3>
          <p style={{ color: '#6b7280' }}>You do not have permission to view user reports.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="urp-page">
      <div className="urp-header">
        <h1 className="urp-title">User Reports</h1>
      </div>

      <div className="urp-filters">
        <div className="urp-search">
          <Search size={18} />
          <input className="urp-input" placeholder="Search by title, content, or author" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        <div className="urp-filter-group">
          <Filter size={16} />
          <select className="urp-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="submitted">Submitted</option>
            <option value="reviewed">Reviewed</option>
            <option value="all">All</option>
          </select>

          <select className="urp-select" value={classFilter} onChange={(e) => setClassFilter(e.target.value)}>
            <option value="">All Classes</option>
            {(() => {
              // For engineers: only assigned classes; others: all classes
              const source = isEngineer(user) ? assignedClasses : classes;
              return source.map(c => (
                <option key={c.id} value={c.className}>{c.className} ({c.gradeName})</option>
              ))
            })()}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="urp-loading">
          <Loader2 size={24} className="animate-spin" /> <span>Loading reports...</span>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="urp-empty">
          <p>No reports found for the selected criteria.</p>
        </div>
      ) : (
        <div className="urp-reports-list">
          {filteredReports.map(r => (
            <div key={r.id} className="urp-report-card">
              <div className="urp-report-header">
                <h3 className="urp-report-title">{r.title}</h3>
                <div className={`urp-status-badge ${r.statusId === STATUS_CONSTANTS.REPORT_CONFIRMED ? 'confirmed' : 'submitted'}`}>
                  {r.statusId === STATUS_CONSTANTS.REPORT_CONFIRMED ? 'Reviewed' : 'Submitted'}
                </div>
              </div>
              <div className="urp-report-meta">
                <span className="urp-author">{r.authorName || 'Unknown Author'}</span>
                <span className="urp-class">
                  {(() => {
                    const cls = classes.find(c => c.id === r.classId);
                    return cls ? `${cls.className} (${cls.gradeName})` : 'Class N/A';
                  })()}
                </span>
                <span className="urp-date">{formatCairoDateTime(r.submittedDate)}</span>
              </div>
              <p className="urp-content">{r.content}</p>
              <div className="urp-actions">
                {r.statusId !== STATUS_CONSTANTS.REPORT_CONFIRMED && (
                  <button className="urp-confirm-btn" onClick={() => handleConfirm(r.id)} disabled={confirmingId === r.id}>
                    {confirmingId === r.id ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                    {confirmingId === r.id ? ' Marking...' : ' Mark as Reviewed'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserReportsPage;


