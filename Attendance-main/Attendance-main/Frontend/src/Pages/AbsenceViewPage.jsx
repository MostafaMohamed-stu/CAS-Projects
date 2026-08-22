import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAbsence } from "../Contexts/AbsenceContext";
import { FiTrash2, FiDownload } from "react-icons/fi";
import { FaFileExcel, FaFileImage } from "react-icons/fa";
import * as XLSX from "xlsx";
import { toJpeg } from "html-to-image";
import api from "../Services/api";
import { absenceService } from "../Services/absenceService";
import { staffService } from "../Services/staffService";
import MultiSelectDropdown from "../Components/MultiSelectDropdown";
import { ConfirmDialog, ToastContainer, useToast } from "../Components/Popups";

import "./Styles/AbsenceViewPage.css";

// ================= ABSENCE TYPE HELPERS =================
const ABSENCE_TYPES = {
  ABSENT_NO_EXCUSE: 10,
  ABSENT_WITH_EXCUSE: 20,
  LATE_NO_EXCUSE: 50,
  LATE_WITH_EXCUSE: 55,
};

const getAbsenceTypeId = (isCurrentlyLate, isCurrentlyExcused, toggleField) => {
  let late = isCurrentlyLate;
  let excused = isCurrentlyExcused;
  if (toggleField === "late") late = !late;
  if (toggleField === "excuse") excused = !excused;
  if (late && excused) return ABSENCE_TYPES.LATE_WITH_EXCUSE;
  if (late && !excused) return ABSENCE_TYPES.LATE_NO_EXCUSE;
  if (!late && excused) return ABSENCE_TYPES.ABSENT_WITH_EXCUSE;
  return ABSENCE_TYPES.ABSENT_NO_EXCUSE;
};

const isLate = (typeId) => typeId === ABSENCE_TYPES.LATE_NO_EXCUSE || typeId === ABSENCE_TYPES.LATE_WITH_EXCUSE;
const hasExcuse = (typeId) => typeId === ABSENCE_TYPES.ABSENT_WITH_EXCUSE || typeId === ABSENCE_TYPES.LATE_WITH_EXCUSE;

const AbsenceViewPage = () => {
  const navigate = useNavigate();
  const { absences, setAbsences, loading, error, getAbsences, removeAbsence, loadAbsences } = useAbsence();
  const { toasts, addToast, removeToast } = useToast();

  const [user, setUser] = useState(null);
  const [grades, setGrades] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [allStudents, setAllStudents] = useState([]); // Store all students fetched once
  const [students, setStudents] = useState([]); // Filtered students for dropdown
  const [studentsWithAbsences, setStudentsWithAbsences] = useState([]);
  const [selectedGrade, setSelectedGrade] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [selectedSessions, setSelectedSessions] = useState([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [filterLate, setFilterLate] = useState(null);
  const [nameLanguage, setNameLanguage] = useState("en");
  const [allStudentsMap, setAllStudentsMap] = useState({});
  const [gradeClassEnrollment, setGradeClassEnrollment] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 30;

  const fullReportRef = useRef(null);
  const simpleReportRef = useRef(null);



  const userRole = user?.role?.toLowerCase().trim();
  const normalizedRole = (userRole || '').replace(/\s+/g, '');
  const isBoard = normalizedRole === 'board';
  const isTeacher = normalizedRole === 'teacher';
  const isStudent = normalizedRole === 'student';
  const isStudentAffair = normalizedRole === 'studentaffair';

  // Fetch enrollment data for reporting
  useEffect(() => {
    const fetchEnrollment = async () => {
      try {
        // This is a placeholder. Ideally we'd have an endpoint that returns 
        // student counts per class. For now, we'll try to deduce it or 
        // use a fallback if not available.
        const response = await api.get("/api/StudentExtension/GetEnrollmentStats");
        if (response.status === 200) {
          setGradeClassEnrollment(response.data);
        }
      } catch (e) {
        console.error("Failed to fetch enrollment stats:", e);
      }
    };
    if (isStudentAffair) fetchEnrollment();
  }, [isStudentAffair]);

  const [confirmState, setConfirmState] = useState({
    open: false,
    type: "warning",
    title: "",
    message: "",
    onConfirm: null,
  });

  // Board and Student cannot modify or delete records
  const canModify =
    !isBoard &&
    !isStudent &&
    (normalizedRole === 'superadmin' || normalizedRole === 'teacher' || normalizedRole === 'studentaffair');

  const canDelete = canModify && !isTeacher;

  useEffect(() => {
    console.log("AbsenceViewPage: allStudents changed", allStudents);
  }, [allStudents]);

  useEffect(() => {
    console.log("AbsenceViewPage: students (for dropdown) changed", students);
  }, [students]);

  useEffect(() => {
    console.log("AbsenceViewPage: selectedGrade changed", selectedGrade);
  }, [selectedGrade]);

  useEffect(() => {
    console.log("AbsenceViewPage: selectedClass changed", selectedClass);
  }, [selectedClass]);

  useEffect(() => {
    console.log("AbsenceViewPage: selectedStudents changed", selectedStudents);
  }, [selectedStudents]);

  // Load filters from sessionStorage
  useEffect(() => {
    const savedFilters = sessionStorage.getItem("absence_view_filters");
    if (savedFilters) {
      try {
        const parsed = JSON.parse(savedFilters);
        if (parsed.selectedGrade) setSelectedGrade(parsed.selectedGrade);
        if (parsed.selectedClass) setSelectedClass(parsed.selectedClass);
        if (parsed.selectedStudents) setSelectedStudents(parsed.selectedStudents);
        if (parsed.selectedSessions) setSelectedSessions(parsed.selectedSessions);
        if (parsed.fromDate) setFromDate(parsed.fromDate);
        if (parsed.toDate) setToDate(parsed.toDate);
        if (parsed.filterLate !== undefined) setFilterLate(parsed.filterLate);
        if (parsed.nameLanguage) setNameLanguage(parsed.nameLanguage);
        if (parsed.currentPage) setCurrentPage(parsed.currentPage);
      } catch (e) {
        console.error("Failed to parse saved filters", e);
      }
    }
  }, []);

  // Save filters to sessionStorage
  useEffect(() => {
    const filtersToSave = {
      selectedGrade,
      selectedClass,
      selectedStudents,
      selectedSessions,
      fromDate,
      toDate,
      filterLate,
      nameLanguage,
      currentPage
    };
    sessionStorage.setItem("absence_view_filters", JSON.stringify(filtersToSave));
  }, [selectedGrade, selectedClass, selectedStudents, selectedSessions, fromDate, toDate, filterLate, nameLanguage, currentPage]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedGrade, selectedClass, selectedStudents, selectedSessions, fromDate, toDate, filterLate, nameLanguage]);

  // moved below to avoid referencing before initialization

  // Fetch initial data
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      loadAbsences();
      absenceService.getAllGrades().then(setGrades);
      absenceService.getAllSessions().then(setSessions);
      absenceService.getAllStudents().then(res => {
        const normalized = (res || []).map(s => ({
          ...s,
          id: s.id || s.studentId || s.studentID,
          name: s.name || s.fullName || s.studentName,
          gradeName: s.gradeName || (s.grade && typeof s.grade === 'object' ? (s.grade.gradeName || s.grade.name) : s.grade),
          className: s.className || (s.class && typeof s.class === 'object' ? (s.class.className || s.class.name) : s.class)
        }));
        setAllStudents(normalized);
        setStudents(normalized);
        const map = {};
        normalized.forEach(s => { if (s?.id) map[s.id] = s; });
        setAllStudentsMap(map);
      });
    } else {
      navigate("/login");
    }
  }, [loadAbsences, navigate]);

  // Handle grade change and class fetch
  useEffect(() => {
    if (selectedGrade) {
      absenceService.getClassesByGrade(selectedGrade).then(setClasses);
    } else {
      setClasses([]);
    }
    setSelectedClass("");
  }, [selectedGrade]);

  // Handle student fetching for dropdown
  useEffect(() => {
    const fetchStudents = async () => {
      let studentsToSet = [];
      if (selectedGrade && selectedClass) {
        const res = await absenceService.getStudentsByClass(selectedGrade, selectedClass);
        studentsToSet = (res || []).map(s => ({
          ...s,
          id: s.id || s.studentId || s.studentID,
          name: s.name || s.fullName || s.studentName,
          gradeName: s.gradeName || (s.grade && typeof s.grade === 'object' ? (s.grade.gradeName || s.grade.name) : s.grade),
          className: s.className || (s.class && typeof s.class === 'object' ? (s.class.className || s.class.name) : s.class)
        }));
      } else if (selectedGrade && !selectedClass) {
        // If only grade is selected, filter from allStudents
        const gMatch = selectedGrade.toLowerCase().trim();
        studentsToSet = allStudents.filter(s => (s.gradeName || "").toString().toLowerCase().trim() === gMatch);
      } else {
        // No grade or class selected, show all students
        studentsToSet = allStudents;
      }

      // Fallback: if no students found, derive from current absences
      if ((!studentsToSet || studentsToSet.length === 0) && Array.isArray(absences) && absences.length > 0) {
        const gMatch = selectedGrade ? selectedGrade.toLowerCase().trim() : null;
        const cMatch = selectedClass ? selectedClass.toLowerCase().trim() : null;
        const map = new Map();
        absences.forEach(a => {
          const gradeOk = gMatch ? String(a.grade || "").toLowerCase().trim() === gMatch : true;
          const classOk = cMatch ? String(a.class || "").toLowerCase().trim() === cMatch : true;
          if (gradeOk && classOk && a.studentId) {
            const key = String(a.studentId);
            if (!map.has(key)) {
              map.set(key, { id: a.studentId, name: a.studentName || "Unknown", gradeName: a.grade || "", className: a.class || "" });
            }
          }
        });
        studentsToSet = Array.from(map.values());
      }

      setStudents(studentsToSet);
    };

    fetchStudents();
  }, [selectedGrade, selectedClass, allStudents, absences]);

  // Sync selectedStudents with available students in the dropdown
  useEffect(() => {
    if (students.length > 0 && selectedStudents.length > 0) {
      const availableIds = new Set(students.map(s => String(s.id)));
      const validSelected = selectedStudents.filter(id => availableIds.has(String(id)));
      if (validSelected.length !== selectedStudents.length) {
        setSelectedStudents(validSelected);
      }
    } else if (students.length === 0 && selectedStudents.length > 0) {
      // If no students are available in the dropdown, clear selected students
      setSelectedStudents([]);
    }
  }, [students]);

  useEffect(() => {
    if (!absences?.length) {
      setStudentsWithAbsences([]);
      return;
    }
    const studentMap = new Map();
    absences.forEach(a => {
      if (a?.studentId && !studentMap.has(a.studentId)) {
        studentMap.set(a.studentId, { id: a.studentId, name: a.studentName || "Unknown" });
      }
    });
    setStudentsWithAbsences(Array.from(studentMap.values()).sort((a, b) => a.name.localeCompare(b.name)));
  }, [absences]);

  const toggleAbsenceField = async (absenceId, field) => {
    // Prevent modification if user is Board or Student
    if (isBoard || isStudent) return;

    const target = absences.find((a) => a.id === absenceId);
    if (!target) return;

    const currentlyLate = isLate(target.absenceTypeId);
    const currentlyExcused = hasExcuse(target.absenceTypeId);

    const newTypeId = getAbsenceTypeId(currentlyLate, currentlyExcused, field);

    // Optimistic UI update
    setAbsences((prev) =>
      prev.map((a) => (a.id === absenceId ? { ...a, absenceTypeId: newTypeId } : a))
    );

    try {
      await absenceService.updateAbsenceType(absenceId, newTypeId);
    } catch (err) {
      console.error("Failed to update absence type:", err);
      addToast("Failed to update absence type.", "error");
    }
  };

  const handleRequestDelete = (id) => {
    setConfirmState({
      open: true,
      type: "danger",
      title: "Delete Record",
      message: "Are you sure you want to delete this record?",
      onConfirm: async () => {
        setConfirmState(prev => ({ ...prev, open: false }));
        try {
          await removeAbsence(id);
          addToast("Record deleted.", "success");
        } catch (e) {
          addToast("Failed to delete.", "error");
        }
      }
    });
  };

  const formatStudentName = (name) => {
    if (!name) return "";
    const words = name.trim().split(/\s+/);
    // Take first 3 names and capitalize each word
    return words
      .slice(0, 3)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  const exportToExcel = () => {
    if (!filteredAbsences.length) return;
    const data = filteredAbsences.map(a => ({
      Student: nameLanguage === 'ar' && a.studentNameAr ? a.studentNameAr : formatStudentName(a.studentName),
      Grade: a.grade,
      Class: a.class,
      Session: a.session === -1 ? "Entire Day" : a.session,
      Date: a.date,
      Status: isLate(a.absenceTypeId) ? (hasExcuse(a.absenceTypeId) ? "Late (Excused)" : "Late") : (hasExcuse(a.absenceTypeId) ? "Absent (Excused)" : "Absent")
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Absences");
    XLSX.writeFile(wb, "AbsenceRecords.xlsx");
  };

  const handleExportImage = async (ref, fileName) => {
    if (!ref.current) return;
    try {
      addToast("Preparing image...", "info");
      const dataUrl = await toJpeg(ref.current, { quality: 0.95, bgcolor: 'white' });
      const link = document.createElement('a');
      link.download = `${fileName}_${new Date().toISOString().split('T')[0]}.jpg`;
      link.href = dataUrl;
      link.click();
      addToast("Export successful!", "success");
    } catch (err) {
      console.error('Export failed', err);
      addToast("Failed to export image", "error");
    }
  };

  const filteredAbsences = useMemo(() => {
    // When specific students are selected, ignore grade/class to avoid over-filtering
    const filters = { sessions: selectedSessions };
    if (selectedStudents.length > 0) {
      filters.studentIds = selectedStudents;
    } else {
      filters.grade = selectedGrade;
      filters.class = selectedClass;
    }
    let list = getAbsences(filters) || [];

    // STRICT SECURITY: Students can only see their own records
    if (isStudent && user?.id) {
      list = list.filter((a) => String(a.studentId) === String(user.id));
    }

    // STRICT SECURITY: Teachers can only see absences THEY recorded
    if (isTeacher && user?.id) {
      list = list.filter((a) => 
        String(a.lecturerId) === String(user.id) || 
        String(a.userId) === String(user.id) ||
        String(a.recordedBy) === String(user.id)
      );
    }

    if (fromDate || toDate) {
      list = list.filter(a => {
        const d = new Date(a.date);
        if (fromDate && d < new Date(fromDate)) return false;
        if (toDate && d > new Date(toDate)) return false;
        return true;
      });
    }

    if (filterLate !== null) {
      list = list.filter(a => isLate(a.absenceTypeId) === filterLate);
    }

    return list;
  }, [getAbsences, selectedGrade, selectedClass, selectedStudents, selectedSessions, fromDate, toDate, filterLate, isStudent, isTeacher, user?.id]);

  const paginatedAbsences = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAbsences.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAbsences, currentPage]);

  const totalPages = Math.ceil(filteredAbsences.length / itemsPerPage);

  const getReportData = useMemo(() => {
    // Group filtered absences by grade and class for the reports
    const reportDate = fromDate || new Date().toISOString().split('T')[0];
    const grouped = {};

    const gradeTranslation = {
      "grade 1": "الأول",
      "junior": "الأول",
      "grade 2": "الثاني",
      "wheeler": "الثاني",
      "grade 3": "الثالث",
      "senior": "الثالث"
    };

    filteredAbsences.forEach(a => {
      let grade = a.grade || "Other";
      const cls = a.class || "Other";
      
      // Translate grade if needed
      const normalizedGrade = grade.toLowerCase().trim();
      grade = gradeTranslation[normalizedGrade] || grade;

      if (!grouped[grade]) grouped[grade] = {};
      if (!grouped[grade][cls]) grouped[grade][cls] = [];
      
      // Use Arabic name if available, otherwise format and capitalize English name
      const displayName = a.studentNameAr && /[\u0600-\u06FF]/.test(a.studentNameAr) 
        ? a.studentNameAr.split(/\s+/).slice(0, 3).join(" ")
        : formatStudentName(a.studentName || "Unknown");
        
      grouped[grade][cls].push(displayName);
    });

    return {
      date: reportDate,
      dayName: new Date(reportDate).toLocaleDateString('ar-EG', { weekday: 'long' }),
      arabicDate: new Date(reportDate).toLocaleDateString('ar-EG'),
      data: grouped
    };
  }, [filteredAbsences, fromDate]);

  useEffect(() => {
    console.log("AbsenceViewPage: filteredAbsences changed", filteredAbsences);
  }, [filteredAbsences]);

  const resetFilters = () => {
    setSelectedGrade("");
    setSelectedClass("");
    setSelectedStudents([]);
    setSelectedSessions([]);
    setFromDate("");
    setToDate("");
    setFilterLate(null);
  };

  return (
    <>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      {confirmState.open && (
        <ConfirmDialog
          title={confirmState.title}
          message={confirmState.message}
          type={confirmState.type}
          onCancel={() => setConfirmState(prev => ({ ...prev, open: false }))}
          onConfirm={confirmState.onConfirm}
        />
      )}

      <div className="content-area">
        {user && (
          <div className="welcome-section">
            <div className="welcome-content">
              <h1>Welcome, {user.name || user.fullName || "User"}!</h1>
              <p>Manage and monitor student absences.</p>
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button onClick={exportToExcel} className="card-button" style={{ background: 'white', color: '#dc2626' }}>
                <FaFileExcel /> Export Excel
              </button>
              {isStudentAffair && (
                <>
                  <button 
                    onClick={() => handleExportImage(fullReportRef, "Full_Absence_Report")} 
                    className="card-button" 
                    style={{ background: 'white', color: '#dc2626' }}
                    title="Export full Arabic report with counts"
                  >
                    <FaFileImage /> Full Report (JPG)
                  </button>
                  <button 
                    onClick={() => handleExportImage(simpleReportRef, "Simple_Absence_Report")} 
                    className="card-button" 
                    style={{ background: 'white', color: '#dc2626' }}
                    title="Export simple Arabic report"
                  >
                    <FaFileImage /> Simple Report (JPG)
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        <div className="content-header">
          <h2>Detailed Absence Logs</h2>
        </div>

        <div className="absence-log-filters card">
          {!isStudent && (
            <>
              <div className="filter-group" style={{ minWidth: '240px' }}>
                <MultiSelectDropdown
                  label="Filter by Students"
                  options={students.map(s => ({ 
                    id: s.id, 
                    label: nameLanguage === 'ar' && (s.nameAr || s.studentNameAr)
                      ? (s.nameAr || s.studentNameAr) 
                      : (s.name || s.fullName || s.studentName) 
                  }))}
                  selectedIds={selectedStudents}
                  onChange={(ids) => setSelectedStudents(ids)}
                  placeholder="Select students..."
                  searchable={true}
                />
              </div>
              <div className="filter-group">
                <label>Grade</label>
                <select value={selectedGrade} onChange={(e) => setSelectedGrade(e.target.value)}>
                  <option value="">All Grades</option>
                  {grades.map(g => <option key={g.id} value={g.gradeName}>{g.gradeName}</option>)}
                </select>
              </div>
              <div className="filter-group">
                <label>Class</label>
                <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} disabled={!selectedGrade}>
                  <option value="">All Classes</option>
                  {classes.map(c => <option key={c.id} value={c.className}>{c.className}</option>)}
                </select>
              </div>
            </>
          )}
          <div className="filter-group">
            <label>Name Language</label>
            <select value={nameLanguage} onChange={(e) => setNameLanguage(e.target.value)}>
              <option value="en">English (En)</option>
              <option value="ar">Arabic (Ar)</option>
            </select>
          </div>
          <div className="filter-group" style={{ minWidth: '240px' }}>
            <MultiSelectDropdown
              label="Filter by Sessions"
              options={[{ id: -1, label: 'Entire Day' }, ...sessions.map(s => ({ id: s.sessionNo, label: `Session ${s.sessionNo}` }))]}
              selectedIds={selectedSessions}
              onChange={(ids) => setSelectedSessions(ids)}
              placeholder="Select sessions..."
            />
          </div>
          <div className="filter-group">
            <label>From Date</label>
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          </div>
          <div className="filter-group">
            <label>To Date</label>
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </div>
          <div className="filter-group">
            <label>Status</label>
            <select value={filterLate === null ? "" : filterLate ? "late" : "absent"} onChange={(e) => setFilterLate(e.target.value === "" ? null : e.target.value === "late")}>
              <option value="">All</option>
              <option value="late">Late Only</option>
              <option value="absent">Absent Only</option>
            </select>
          </div>
          <div className="filter-group" style={{ alignSelf: 'flex-end' }}>
            <button onClick={resetFilters} className="card-button" style={{ background: '#6c757d' }}>Reset All</button>
          </div>
        </div>

        <div className="current-filters-container">
          <div className="filters-title">Active Filters</div>
          <div className="filters-cards-grid">
            {!isStudent && (
              <>
                <div className="filter-card">
                  <div className="filter-card-label">Grade</div>
                  <div className="filter-card-value">{selectedGrade || "All"}</div>
                </div>
                <div className="filter-card">
                  <div className="filter-card-label">Class</div>
                  <div className="filter-card-value">{selectedClass || "All"}</div>
                </div>
              </>
            )}
            <div className="filter-card">
              <div className="filter-card-label">Sessions</div>
              <div className="filter-card-value">{selectedSessions.length ? `${selectedSessions.length} selected` : "All"}</div>
            </div>
            <div className="filter-card">
              <div className="filter-card-label">From</div>
              <div className="filter-card-value">{fromDate || "—"}</div>
            </div>
            <div className="filter-card">
              <div className="filter-card-label">To</div>
              <div className="filter-card-value">{toDate || "—"}</div>
            </div>
            <div className="filter-card records-card">
              <div className="filter-card-label">Records</div>
              <div className="filter-card-value">{filteredAbsences.length}</div>
            </div>
          </div>
        </div>

        <div className="absence-log-container card" dir={nameLanguage === 'ar' ? 'rtl' : 'ltr'}>
        <h3>{nameLanguage === 'ar' ? 'سجلات الغياب' : 'Absence Records'}</h3>
        <div className="table-container">
          <table className="absence-table">
            <thead>
              <tr>
                <th className="student-name-col" style={{ width: '220px' }}>{nameLanguage === 'ar' ? 'اسم الطالب' : 'Student Name'}</th>
                <th style={{ width: '80px' }}>{nameLanguage === 'ar' ? 'الصف' : 'Class'}</th>
                <th className="session-col">{nameLanguage === 'ar' ? 'الحصة' : 'Session'}</th>
                {!(isBoard || isStudent) && <th>{nameLanguage === 'ar' ? 'الحالة' : 'Status'}</th>}
                {(isBoard || isStudent) ? (
                  <th>{nameLanguage === 'ar' ? 'حالة الغياب' : 'Absence Status'}</th>
                ) : (
                  <>
                    <th>{nameLanguage === 'ar' ? 'تأخير' : 'Late'}</th>
                    <th>{nameLanguage === 'ar' ? 'عذر' : 'Excuse'}</th>
                  </>
                )}
                <th className="date-col">{nameLanguage === 'ar' ? 'التاريخ' : 'Date'}</th>
                {!isTeacher && <th>{nameLanguage === 'ar' ? 'سجل بواسطة' : 'Recorded By'}</th>}
                {canDelete && <th>{nameLanguage === 'ar' ? 'إجراءات' : 'Actions'}</th>}
              </tr>
            </thead>
            <tbody>
              {paginatedAbsences.map((absence) => (
                <tr key={absence.id}>
                  <td className="student-name-cell">
                    <span className="student-name-text">
                      {nameLanguage === 'ar' && absence.studentNameAr
                        ? absence.studentNameAr.replace(/\s+/g, ' ').trim()
                        : String(absence.studentName || "Unknown").replace(/\s+/g, ' ').trim()}
                    </span>
                  </td>
                  <td>{absence.class || "—"}</td>
                  <td className="session-cell">
                    {absence.session === -1
                      ? (nameLanguage === 'ar' ? "اليوم كاملاً" : "Entire day")
                      : absence.session
                      ? (nameLanguage === 'ar' ? `الحصة ${absence.session}` : `Session ${absence.session}`)
                      : "—"}
                  </td>
                  {!(isBoard || isStudent) && (
                    <td>
                      <span className={`status-badge ${isLate(absence.absenceTypeId) ? 'status-late' : 'status-absent'}`}>
                        {nameLanguage === 'ar' 
                          ? (isLate(absence.absenceTypeId) ? "تأخير" : "غياب") + " " + (hasExcuse(absence.absenceTypeId) ? "بعذر" : "بدون عذر")
                          : (isLate(absence.absenceTypeId) ? "Late" : "Absent") + " " + (hasExcuse(absence.absenceTypeId) ? "with Excuse" : "without Excuse")}
                      </span>
                    </td>
                  )}
                  {/* Show enhanced status for Board and Student roles, toggles for Teacher */}
                  {(isBoard || isStudent) ? (
                    <td>
                      {(() => {
                        const late = isLate(absence.absenceTypeId);
                        const excused = hasExcuse(absence.absenceTypeId);

                        const label = nameLanguage === 'ar'
                          ? (late ? "تأخير" : "غياب") + " " + (excused ? "بعذر" : "بدون عذر")
                          : (late ? "Late" : "Absent") + " " + (excused ? "with Excuse" : "without Excuse");

                        return (
                          <span className={`status-badge ${late ? 'status-late' : 'status-absent'}`}>
                            {label}
                          </span>
                        );
                      })()}
                    </td>
                  ) : (
                    <>
                      <td>
                        <label className="modern-switch late">
                          <input
                            type="checkbox"
                            checked={isLate(absence.absenceTypeId)}
                            onChange={() => toggleAbsenceField(absence.id, "late")}
                            disabled={loading || !canModify}
                          />
                          <span className="slider round" />
                        </label>
                      </td>
                      <td>
                        <label className="modern-switch">
                          <input
                            type="checkbox"
                            checked={hasExcuse(absence.absenceTypeId)}
                            onChange={() => toggleAbsenceField(absence.id, "excuse")}
                            disabled={loading || !canModify}
                          />
                          <span className="slider round" />
                        </label>
                      </td>
                    </>
                  )}
                  <td className="date-cell">
                    {absence.dateOfAbsence
                      ? new Date(absence.dateOfAbsence).toLocaleDateString(nameLanguage === 'ar' ? 'ar-EG' : undefined)
                      : absence.date
                        ? new Date(absence.date).toLocaleDateString(nameLanguage === 'ar' ? 'ar-EG' : undefined)
                        : "—"}
                  </td>
                  {!isTeacher && (
                    <td>
                      {nameLanguage === 'ar' && absence.lecturerNameAr 
                        ? absence.lecturerNameAr 
                        : (absence.lecturerName || "N/A")}
                    </td>
                  )}
                  {canDelete && (
                    <td>
                      <button
                        className="delete-btn"
                        onClick={() => handleRequestDelete(absence.id)}
                        title="Delete record"
                        disabled={loading}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#dc2626",
                          cursor: loading ? "not-allowed" : "pointer",
                          fontSize: "1.1rem",
                          opacity: loading ? 0.5 : 1,
                        }}
                      >
                        <FiTrash2 />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="pagination-container">
            <button 
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="pagination-btn"
            >
              {nameLanguage === 'ar' ? 'السابق' : 'Previous'}
            </button>
            
            <div className="pagination-info">
              {nameLanguage === 'ar' 
                ? `صفحة ${currentPage} من ${totalPages}`
                : `Page ${currentPage} of ${totalPages}`}
            </div>

            <button 
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="pagination-btn"
            >
              {nameLanguage === 'ar' ? 'التالي' : 'Next'}
            </button>
          </div>
        )}

        {/* Mobile View - Card List */}
        <div className="mobile-records-list">
          {paginatedAbsences.map((absence) => (
            <div key={absence.id} className="record-card">
              <div className="record-card-header">
                <div className="record-card-student">
                  <span className="record-card-name">
                    {nameLanguage === 'ar' && absence.studentNameAr
                      ? absence.studentNameAr.replace(/\s+/g, ' ').trim()
                      : String(absence.studentName || "Unknown").replace(/\s+/g, ' ').trim()}
                  </span>
                  <span className="record-card-class">{absence.class || "—"}</span>
                </div>
                <span className="record-card-date">
                  {absence.dateOfAbsence
                    ? new Date(absence.dateOfAbsence).toLocaleDateString(nameLanguage === 'ar' ? 'ar-EG' : undefined)
                    : absence.date
                      ? new Date(absence.date).toLocaleDateString(nameLanguage === 'ar' ? 'ar-EG' : undefined)
                      : "—"}
                </span>
              </div>
              <div className="record-card-body">
                <div className="record-info-row">
                  <span className="info-label">Session</span>
                  <span className="info-value">
                    {absence.session === -1
                      ? "Entire day"
                      : absence.session
                      ? `Session ${absence.session}`
                      : "—"}
                  </span>
                </div>
                {!(isBoard || isStudent) && (
                  <div className="record-info-row">
                    <span className="info-label">
                      {nameLanguage === 'ar' ? 'الحالة الحالية' : 'Current Status'}
                    </span>
                    <span className={`status-badge ${isLate(absence.absenceTypeId) ? 'status-late' : 'status-absent'}`}>
                      {nameLanguage === 'ar' 
                        ? (isLate(absence.absenceTypeId) ? "تأخير" : "غياب")
                        : (isLate(absence.absenceTypeId) ? "Late" : "Absent")}
                    </span>
                  </div>
                )}
                
                {/* Status Controls */}
                {(isBoard || isStudent) ? (
                  <div className="record-info-row">
                    <span className="info-label">Status</span>
                    {(() => {
                      const late = isLate(absence.absenceTypeId);
                      const excused = hasExcuse(absence.absenceTypeId);
                      const label = nameLanguage === 'ar'
                        ? (late ? "تأخير" : "غياب") + " " + (excused ? "بعذر" : "بدون عذر")
                        : (late ? "Late" : "Absent") + " " + (excused ? "with Excuse" : "without Excuse");
                      return (
                        <span className={`status-badge ${late ? 'status-late' : 'status-absent'}`}>
                          {label}
                        </span>
                      );
                    })()}
                  </div>
                ) : (
                  <>
                    <div className="record-info-row">
                      <span className="info-label">Late</span>
                      <label className="modern-switch late">
                        <input
                          type="checkbox"
                          checked={isLate(absence.absenceTypeId)}
                          onChange={() => toggleAbsenceField(absence.id, "late")}
                          disabled={loading || !canModify}
                        />
                        <span className="slider round" />
                      </label>
                    </div>
                    <div className="record-info-row">
                      <span className="info-label">Excused</span>
                      <label className="modern-switch">
                        <input
                          type="checkbox"
                          checked={hasExcuse(absence.absenceTypeId)}
                          onChange={() => toggleAbsenceField(absence.id, "excuse")}
                          disabled={loading || !canModify}
                        />
                        <span className="slider round" />
                      </label>
                    </div>
                  </>
                )}
              </div>
              <div className="record-card-footer">
                <span className="recorded-by">
                  {nameLanguage === 'ar' ? 'بواسطة: ' : 'By: '}
                  {nameLanguage === 'ar' && absence.lecturerNameAr 
                    ? absence.lecturerNameAr 
                    : (absence.lecturerName || "N/A")}
                </span>
                {canDelete && (
                  <button
                    className="delete-btn-mobile"
                    onClick={() => handleRequestDelete(absence.id)}
                    title="Delete record"
                    disabled={loading}
                    style={{ opacity: loading ? 0.5 : 1 }}
                  >
                    <FiTrash2 />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      </div>

      {/* Hidden Templates for Export */}
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
        {/* Template 1: Full Report with Counts */}
        <div ref={fullReportRef} className="export-template full-report" dir="rtl">
          <h2 className="report-title">
            إحصاء بغياب الطلاب اليوم {getReportData.dayName} الموافق {getReportData.arabicDate}
          </h2>
          <table className="report-table">
            <thead>
              <tr>
                <th>الصف</th>
                <th>الفصل</th>
                <th>عدد المقيدين</th>
                <th>عدد الغائبين</th>
                <th>عدد الحضور</th>
                <th>أسماء الغائبين</th>
                <th>ملاحظات</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(getReportData.data).map(([grade, classes]) => (
                Object.entries(classes).map(([cls, students], idx) => {
                  const total = gradeClassEnrollment[`${grade}_${cls}`] || 22; // fallback if no data
                  const absent = students.length;
                  const present = total - absent;
                  return (
                    <tr key={`${grade}-${cls}`}>
                      {idx === 0 && <td rowSpan={Object.keys(classes).length}>{grade}</td>}
                      <td>{cls}</td>
                      <td>{total}</td>
                      <td>{absent}</td>
                      <td>{present}</td>
                      <td>{students.join(" - ") || "لا غائب"}</td>
                      <td></td>
                    </tr>
                  );
                })
              ))}
            </tbody>
          </table>
        </div>

        {/* Template 2: Simple Report */}
        <div ref={simpleReportRef} className="export-template simple-report" dir="rtl">
          <h2 className="report-title">
            إحصاء بغياب الطلاب اليوم {getReportData.dayName} الموافق {getReportData.arabicDate}
          </h2>
          <table className="report-table simple">
            <thead>
              <tr>
                <th>الصف</th>
                <th>الفصل</th>
                <th>أسماء الغائبين</th>
                <th>ملاحظات</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(getReportData.data).map(([grade, classes]) => (
                Object.entries(classes).map(([cls, students], idx) => (
                  <tr key={`${grade}-${cls}`}>
                    {idx === 0 && <td rowSpan={Object.keys(classes).length}>{grade}</td>}
                    <td>{cls}</td>
                    <td>{students.join(" - ") || "لا غائب"}</td>
                    <td></td>
                  </tr>
                ))
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default AbsenceViewPage;
