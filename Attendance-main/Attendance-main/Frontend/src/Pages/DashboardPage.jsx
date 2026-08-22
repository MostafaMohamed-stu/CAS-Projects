import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
// Import Chart.js components
import { Bar, Line, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

// Import reusable components
import { FaFileExcel, FaFileImage, FaSyncAlt } from "react-icons/fa";
import * as XLSX from "xlsx";
import MultiSelectDropdown from "../Components/MultiSelectDropdown";
import { ToastContainer, useToast } from "../Components/Popups";

// Import services
import { absenceService } from "../Services/absenceService";

import "./Styles/DashboardPage.css";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const DashboardPage = () => {
  const navigate = useNavigate();
  const { toasts, addToast, removeToast } = useToast();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filter states
  const [grades, setGrades] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [allStudents, setAllStudents] = useState([]); // Store all students fetched once
  const [students, setStudents] = useState([]); // Filtered students for dropdown
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [selectedGrade, setSelectedGrade] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Session filter - -1 means "Entire day"
  const [selectedSessions, setSelectedSessions] = useState([-1]);

  // Student filter states
  const [minAbsences, setMinAbsences] = useState(0);
  const [maxAbsences, setMaxAbsences] = useState(1000);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const SESSIONS_PER_DAY = 8;

  // Data states
  const [statistics, setStatistics] = useState(null);
  const [filteredAbsences, setFilteredAbsences] = useState([]);
  const [chartGroupMode, setChartGroupMode] = useState("class");

  const countSchoolDaysInclusive = (startDateStr, endDateStr) => {
    if (!startDateStr || !endDateStr) return 0;
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) return 0;

    let days = 0;
    const d = new Date(start);
    d.setHours(0, 0, 0, 0);
    const endDay = new Date(end);
    endDay.setHours(0, 0, 0, 0);

    while (d <= endDay) {
      const dow = d.getDay();
      if (dow !== 5 && dow !== 6) days += 1;
      d.setDate(d.getDate() + 1);
    }
    return days;
  };

  const userRole = user?.role?.toLowerCase().trim();
  const normalizedRole = (userRole || '').replace(/\s+/g, '');

  const [notifPermission, setNotifPermission] = useState(Notification.permission);

  const requestNotificationPermission = async () => {
    const permission = await Notification.requestPermission();
    setNotifPermission(permission);
    if (permission === 'granted') {
      addToast("Notifications enabled!", "success");
      // Trigger a reload or context update to register service worker if needed
      window.location.reload(); 
    }
  };
  const isBoard = normalizedRole === 'board';
  const isTeacher = normalizedRole === 'teacher';
  const isStudent = normalizedRole === 'student';
  const isStudentAffair = normalizedRole === 'studentaffair';

  const absencesForCharts = useMemo(() => {
    let base = filteredAbsences || [];

    if (isStudent && user?.id) {
      base = base.filter((a) => String(a.studentId) === String(user.id));
    }

    if (isTeacher && user?.id) {
      base = base.filter((a) => 
        String(a.lecturerId) === String(user.id) || 
        String(a.userId) === String(user.id) ||
        String(a.recordedBy) === String(user.id)
      );
    }

    if (selectedStudents.length > 0) {
      const studentSet = new Set(selectedStudents.map(id => String(id)));
      base = base.filter((a) => a.studentId && studentSet.has(String(a.studentId)));
    }

    const isEntireDayMode = selectedSessions.includes(-1);
    if (!isEntireDayMode) {
      if (selectedSessions.length === 0) return base;
      const sessionSet = new Set(selectedSessions.map(String));
      return base.filter((a) => {
        const sess = String(a.session ?? a.sessionId ?? a.sessionNo ?? a.session_number ?? -999);
        return sessionSet.has(sess);
      });
    }

    // Entire day mode: keep one record per student per date (any session or session === -1)
    const uniqueByStudentDay = new Map();
    base.forEach((a) => {
      const d = new Date(a.date).toDateString();
      const key = `${a.studentId}_${d}`;
      if (!uniqueByStudentDay.has(key)) uniqueByStudentDay.set(key, a);
    });
    return Array.from(uniqueByStudentDay.values());
  }, [filteredAbsences, selectedSessions, selectedStudents, isStudent, isTeacher, user?.id]);

  const availableStudents = useMemo(() => {
    if (!filteredAbsences?.length) return [];
    const studentMap = new Map();
    filteredAbsences.forEach((a) => {
      if (a.studentId && !studentMap.has(a.studentId)) {
        studentMap.set(a.studentId, { id: a.studentId, name: a.studentName || "Unknown" });
      }
    });
    return Array.from(studentMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [filteredAbsences]);

  // Calculate student statistics from filtered absences
  const studentStatistics = useMemo(() => {
    if (!filteredAbsences?.length || !fromDate || !toDate) return [];

    const ABSENT_TYPES = new Set([10, 20]);
    const isEntireDayMode = selectedSessions.includes(-1);
    
    // Calculate total days in date range
    const totalDays = countSchoolDaysInclusive(fromDate, toDate);

    const studentMap = new Map();

    // Filter by selected students first
    let filteredByStudents = filteredAbsences;
    if (selectedStudents.length > 0) {
      const studentSet = new Set(selectedStudents.map(id => String(id)));
      filteredByStudents = filteredAbsences.filter((a) => 
        a.studentId && studentSet.has(String(a.studentId))
      );
    }

    // Only count true absences (exclude late records)
    filteredByStudents = filteredByStudents.filter((a) =>
      ABSENT_TYPES.has(Number(a.absenceTypeId))
    );

    if (isEntireDayMode) {
      // Count entire days absent per student
      const byStudentAndDate = new Map();

      filteredByStudents.forEach((absence) => {
        const studentId = absence.studentId;
        if (!studentId) return;

        const dateKey = new Date(absence.date).toDateString();
        const studentDateKey = `${studentId}_${dateKey}`;

        if (!byStudentAndDate.has(studentDateKey)) {
          byStudentAndDate.set(studentDateKey, {
            studentId: studentId,
            date: dateKey,
            count: 0,
          });
        }

        const entry = byStudentAndDate.get(studentDateKey);
        entry.count += 1;
      });

      // Count entire days (days where student was absent in all sessions)
      byStudentAndDate.forEach((entry) => {
        if (entry.count >= SESSIONS_PER_DAY) {
          const studentId = entry.studentId;
          
          if (!studentMap.has(studentId)) {
            // Find student info from first absence
            const firstAbsence = filteredByStudents.find(a => a.studentId === studentId);
            studentMap.set(studentId, {
              studentId: studentId,
              studentName: firstAbsence?.studentName || "Unknown Student",
              class: firstAbsence?.class || "",
              grade: firstAbsence?.grade || "",
              absentDays: new Set(),
            });
          }

          const student = studentMap.get(studentId);
          student.absentDays.add(entry.date);
        }
      });

      // Convert to array and calculate rates
      const stats = Array.from(studentMap.values()).map((student) => {
        const daysAbsent = student.absentDays.size;
        const rate = totalDays > 0 
          ? Math.round(((totalDays - daysAbsent) / totalDays) * 100)
          : 0;

        return {
          studentId: student.studentId,
          studentName: student.studentName,
          class: `${student.grade || ""} ${student.class || ""}`.trim() || "Unknown",
          absences: daysAbsent,
          rate: Math.max(0, Math.min(100, rate)),
        };
      });

      return stats.sort((a, b) => b.absences - a.absences);
    } else {
      // Count absences for specific sessions
      const sessionSet = new Set(selectedSessions.map(String));
      const sessionFiltered = filteredByStudents.filter((a) => {
        const sess = String(a.session ?? a.sessionNo ?? a.session_number ?? -999);
        return sessionSet.has(sess);
      });

      sessionFiltered.forEach((absence) => {
        const studentId = absence.studentId;
        if (!studentId) return;

        if (!studentMap.has(studentId)) {
          studentMap.set(studentId, {
            studentId: studentId,
            studentName: absence.studentName || "Unknown Student",
            class: absence.class || "",
            grade: absence.grade || "",
            absences: 0,
            uniqueDays: new Set(),
          });
        }

        const student = studentMap.get(studentId);
        student.absences += 1;
        const dateKey = new Date(absence.date).toDateString();
        student.uniqueDays.add(dateKey);
      });

      // Convert to array and calculate rates
      const stats = Array.from(studentMap.values()).map((student) => {
        const daysAbsent = student.uniqueDays.size;
        const rate = totalDays > 0 
          ? Math.round(((totalDays - daysAbsent) / totalDays) * 100)
          : 0;

        return {
          studentId: student.studentId,
          studentName: student.studentName,
          class: `${student.grade || ""} ${student.class || ""}`.trim() || "Unknown",
          absences: student.absences,
          rate: Math.max(0, Math.min(100, rate)),
        };
      });

      return stats.sort((a, b) => b.absences - a.absences);
    }
  }, [filteredAbsences, selectedStudents, selectedSessions, fromDate, toDate, SESSIONS_PER_DAY]);

  const filteredStudentStatistics = useMemo(() => {
    return studentStatistics.filter(s => s.absences >= minAbsences && s.absences <= maxAbsences);
  }, [studentStatistics, minAbsences, maxAbsences]);

  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredStudentStatistics.slice(start, start + itemsPerPage);
  }, [filteredStudentStatistics, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredStudentStatistics.length / itemsPerPage);

  const kpiData = useMemo(() => {
    const ABSENT_TYPES = new Set([10, 20]);
    const LATE_TYPES = new Set([50, 55]);
    const isEntireDayMode = selectedSessions.includes(-1);

    let totalAbsences = 0;
    let totalLates = 0;

    if (isEntireDayMode) {
      const absentDays = new Set();
      const lateDays = new Set();
      (filteredAbsences || []).forEach((a) => {
        const sid = a?.studentId;
        const typeId = Number(a?.absenceTypeId);
        if (!sid || !Number.isFinite(typeId)) return;
        const d = a.date ? new Date(a.date).toDateString() : null;
        if (!d) return;
        const key = `${sid}_${d}`;
        if (ABSENT_TYPES.has(typeId)) absentDays.add(key);
        else if (LATE_TYPES.has(typeId)) lateDays.add(key);
      });
      totalAbsences = absentDays.size;
      totalLates = lateDays.size;
    } else {
      // Normal session mode
      totalAbsences = (absencesForCharts || []).filter((a) =>
        ABSENT_TYPES.has(Number(a.absenceTypeId))
      ).length;
      totalLates = (absencesForCharts || []).filter((a) =>
        LATE_TYPES.has(Number(a.absenceTypeId))
      ).length;
    }

    // Top performing class (lowest absences) comes from server-side statistics
    const topClass = statistics?.topPerformingClass
      ? `${statistics.topPerformingClass.gradeName || ""} ${
          statistics.topPerformingClass.className || ""
        }`.trim() || "N/A"
      : "N/A";

    let attendanceRate = 0;
    let formula = {
      studentCount: 0,
      totalDays: 0,
      sessionsCount: 0,
      totalUnits: 0,
      absentUnits: 0,
      isEntireDayMode,
    };

    if (fromDate && toDate) {
      const totalDays = countSchoolDaysInclusive(fromDate, toDate);

      const studentCountFromStats =
        statistics?.studentCount ??
        statistics?.studentsCount ??
        statistics?.totalStudents ??
        statistics?.totalStudentCount ??
        null;

      const studentCountFromSelected = selectedStudents.length > 0 ? selectedStudents.length : null;

      const fallbackStudentIdsInData = new Set(
        (filteredAbsences || [])
          .map((a) => a?.studentId)
          .filter((id) => id !== undefined && id !== null)
      );

      const studentCount =
        Number.isFinite(Number(studentCountFromSelected)) && studentCountFromSelected !== null
          ? Number(studentCountFromSelected)
          : Number.isFinite(Number(studentCountFromStats)) && studentCountFromStats !== null
          ? Number(studentCountFromStats)
          : fallbackStudentIdsInData.size;

      const sessionsCount = isEntireDayMode
        ? 0
        : Array.from(new Set((selectedSessions || []).map(Number))).filter((n) => Number.isFinite(n)).length;

      const totalUnits = isEntireDayMode
        ? Math.max(0, studentCount) * Math.max(0, totalDays)
        : Math.max(0, studentCount) * Math.max(0, totalDays) * Math.max(0, sessionsCount);

      let absentUnits = 0;
      if (isEntireDayMode) {
        const uniqueAbsentDays = new Set();
        (filteredAbsences || [])
          .filter((a) => ABSENT_TYPES.has(Number(a?.absenceTypeId)))
          .forEach((a) => {
            const sid = a?.studentId;
            const d = a.date ? new Date(a.date).toDateString() : null;
            if (!sid || !d) return;
            if (selectedStudents.length > 0 && !selectedStudents.map(String).includes(String(sid))) return;
            uniqueAbsentDays.add(`${sid}_${d}`);
          });
        absentUnits = uniqueAbsentDays.size;
      } else {
        absentUnits = (filteredAbsences || []).filter(
          (a) => {
            const typeOk = ABSENT_TYPES.has(Number(a?.absenceTypeId));
            const sess = String(a.session ?? a.sessionId ?? a.sessionNo ?? a.session_number ?? -999);
            const sessionOk = selectedSessions.length === 0 ? true : new Set(selectedSessions.map(String)).has(sess);
            const studentOk = selectedStudents.length === 0 ? true : selectedStudents.map(String).includes(String(a?.studentId));
            return typeOk && sessionOk && studentOk;
          }
        ).length;
      }

      formula = {
        studentCount,
        totalDays: Math.max(0, totalDays),
        sessionsCount,
        totalUnits,
        absentUnits,
        isEntireDayMode,
      };

      attendanceRate =
        totalUnits > 0
          ? Math.max(0, Math.min(100, (1 - absentUnits / totalUnits) * 100))
          : 0;
    }

    return {
      attendanceRate: attendanceRate,
      totalAbsences: totalAbsences,
      totalLates: totalLates,
      topClass: topClass,
      attendanceFormula: formula,
    };
  }, [absencesForCharts, filteredAbsences, statistics, selectedSessions, fromDate, toDate, selectedStudents]);

  // Fetch initial data
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      
      const today = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(today.getDate() - 30);
      setFromDate(thirtyDaysAgo.toISOString().split("T")[0]);
      setToDate(today.toISOString().split("T")[0]);

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
      });
    } else {
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    console.log("DashboardPage: allStudents changed", allStudents);
  }, [allStudents]);

  useEffect(() => {
    console.log("DashboardPage: students (for dropdown) changed", students);
  }, [students]);

  const handleSelectedSessionsChange = (newSelected) => {
    const next = Array.isArray(newSelected) ? newSelected : [];
    const hasEntireDay = next.includes(-1);
    if (!hasEntireDay) {
      setSelectedSessions(next);
      return;
    }
    if (next.length === 1) {
      setSelectedSessions([-1]);
      return;
    }
    const filtered = next.filter((id) => id !== -1);
    setSelectedSessions(filtered.length ? filtered : [-1]);
  };

  useEffect(() => {
    console.log("DashboardPage: selectedGrade changed", selectedGrade);
  }, [selectedGrade]);

  useEffect(() => {
    console.log("DashboardPage: selectedClass changed", selectedClass);
  }, [selectedClass]);

  useEffect(() => {
    console.log("DashboardPage: selectedStudents changed", selectedStudents);
  }, [selectedStudents]);

  useEffect(() => {
    console.log("DashboardPage: filteredAbsences changed", filteredAbsences);
  }, [filteredAbsences]);

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

      // Fallback: if no students found, derive from current filteredAbsences
      if ((!studentsToSet || studentsToSet.length === 0) && Array.isArray(filteredAbsences) && filteredAbsences.length > 0) {
        const gMatch = selectedGrade ? selectedGrade.toLowerCase().trim() : null;
        const cMatch = selectedClass ? selectedClass.toLowerCase().trim() : null;
        const map = new Map();
        filteredAbsences.forEach(a => {
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
  }, [selectedGrade, selectedClass, allStudents, filteredAbsences]);

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

  const exportToExcel = () => {
    if (!filteredStudentStatistics.length) {
      addToast("No data to export.", "info");
      return;
    }
    const data = filteredStudentStatistics.map(s => ({
      "Student Name": s.studentName,
      "Class": s.class,
      "Total Absences": s.absences,
      "Attendance Rate (%)": s.rate
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Ranking");
    XLSX.writeFile(wb, "StudentAbsenceRanking.xlsx");
    addToast("Ranking exported to Excel.", "success");
  };

  const exportToSVG = () => {
    if (!filteredStudentStatistics.length) {
      addToast("No data to export.", "info");
      return;
    }

    // Since we don't have a library to convert DOM to SVG, 
    // we'll create a simple SVG representation of the table data
    const rowHeight = 30;
    const headerHeight = 40;
    const padding = 20;
    const width = 800;
    const height = headerHeight + (filteredStudentStatistics.length * rowHeight) + (padding * 2);

    let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <rect width="100%" height="100%" fill="white" />
      <style>
        .header { font: bold 14px sans-serif; fill: #333; }
        .cell { font: 12px sans-serif; fill: #666; }
        .line { stroke: #eee; stroke-width: 1; }
        .rate-bg { fill: #eee; rx: 4; ry: 4; }
        .rate-bar { rx: 4; ry: 4; }
      </style>
      
      <!-- Headers -->
      <text x="${padding}" y="${padding + 25}" class="header">Student Name</text>
      <text x="${padding + 300}" y="${padding + 25}" class="header">Class</text>
      <text x="${padding + 500}" y="${padding + 25}" class="header">Absences</text>
      <text x="${padding + 600}" y="${padding + 25}" class="header">Rate</text>
      <line x1="${padding}" y1="${padding + 35}" x2="${width - padding}" y2="${padding + 35}" class="line" />
    `;

    filteredStudentStatistics.forEach((s, i) => {
      const y = padding + headerHeight + (i * rowHeight);
      const rateColor = s.rate > 80 ? '#28a745' : s.rate > 50 ? '#ffc107' : '#dc3545';
      
      svgContent += `
        <text x="${padding}" y="${y + 20}" class="cell">${s.studentName}</text>
        <text x="${padding + 300}" y="${y + 20}" class="cell">${s.class}</text>
        <text x="${padding + 500}" y="${y + 20}" class="cell" font-weight="bold" fill="#dc2626">${s.absences}</text>
        
        <!-- Rate bar -->
        <rect x="${padding + 600}" y="${y + 8}" width="100" height="12" class="rate-bg" />
        <rect x="${padding + 600}" y="${y + 8}" width="${s.rate}" height="12" fill="${rateColor}" class="rate-bar" />
        <text x="${padding + 710}" y="${y + 20}" class="cell">${s.rate}%</text>
        
        <line x1="${padding}" y1="${y + 30}" x2="${width - padding}" y2="${y + 30}" class="line" />
      `;
    });

    svgContent += `</svg>`;

    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'StudentAbsenceRanking.svg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    addToast("Ranking exported as SVG.", "success");
  };

  const loadData = async () => {
    if (!fromDate || !toDate) return;
    setLoading(true);
    try {
      const [stats, absences] = await Promise.all([
        absenceService.getAttendanceStatistics(selectedGrade, selectedClass, fromDate, toDate),
        absenceService.getFilteredAbsences(selectedGrade, selectedClass, fromDate, toDate),
      ]);

      let processed = absences || [];
      if (isStudent && user?.id) {
        processed = processed.filter(a => Number(a.studentId) === Number(user.id));
      } else if (isTeacher && user?.id) {
        processed = processed.filter(a => Number(a.lecturerId || a.lectuerID) === Number(user.id));
      }
      
      setStatistics(stats);
      setFilteredAbsences(processed);
    } catch (err) {
      addToast("Failed to load data.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedGrade, selectedClass, fromDate, toDate, user]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' },
    }
  };

  const trendData = useMemo(() => {
    if (!absencesForCharts?.length) {
      return {
        labels: [],
        datasets: [
          {
            label: "Daily Absences",
            data: [],
            fill: true,
            backgroundColor: "rgba(62, 139, 255, 0.1)",
            borderColor: "rgba(62, 139, 255, 1)",
            borderWidth: 3,
            tension: 0.4,
            pointBackgroundColor: "rgba(62, 139, 255, 1)",
            pointBorderColor: "#fff",
            pointBorderWidth: 2,
            pointRadius: 5,
            pointHoverRadius: 7,
          },
        ],
      };
    }

    const absencesByDate = {};
    absencesForCharts.forEach((absence) => {
      const date = new Date(absence.date).toLocaleDateString();
      absencesByDate[date] = (absencesByDate[date] || 0) + 1;
    });

    const sortedDates = Object.keys(absencesByDate).sort(
      (a, b) => new Date(a) - new Date(b)
    );
    const labels = sortedDates.map((date) => {
      const d = new Date(date);
      return `${d.getMonth() + 1}/${d.getDate()}`;
    });
    const data = sortedDates.map((date) => absencesByDate[date]);

    return {
      labels,
      datasets: [
        {
          label: "Daily Absences",
          data,
          fill: true,
          backgroundColor: "rgba(62, 139, 255, 0.1)",
          borderColor: "rgba(62, 139, 255, 1)",
          borderWidth: 3,
          tension: 0.4,
          pointBackgroundColor: "rgba(62, 139, 255, 1)",
          pointBorderColor: "#fff",
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 7,
        },
      ],
    };
  }, [absencesForCharts]);

  const classData = useMemo(() => {
    if (!absencesForCharts?.length) {
      return {
        labels: [],
        datasets: [
          {
            label: "Absence Count",
            data: [],
            backgroundColor: "rgba(230, 0, 40, 0.6)",
            borderColor: "rgba(230, 0, 40, 1)",
            borderWidth: 1,
          },
        ],
      };
    }

    if (chartGroupMode === "grade") {
      // Group by grade and date
      const gradesByDate = {};
      absencesForCharts.forEach((absence) => {
        const date = new Date(absence.date).toLocaleDateString("en-US", {
          month: "numeric",
          day: "numeric",
        });
        const grade = absence.grade || "Unknown";
        if (!gradesByDate[date]) gradesByDate[date] = {};
        gradesByDate[date][grade] = (gradesByDate[date][grade] || 0) + 1;
      });

      const allGrades = [
        ...new Set(absencesForCharts.map((a) => a.grade || "Unknown")),
      ];
      const sortedDates = Object.keys(gradesByDate).sort(
        (a, b) => new Date(a) - new Date(b)
      );

      const colors = [
        { bg: "rgba(230, 0, 40, 0.7)", border: "rgba(230, 0, 40, 1)" },
        { bg: "rgba(62, 139, 255, 0.7)", border: "rgba(62, 139, 255, 1)" },
        { bg: "rgba(40, 167, 69, 0.7)", border: "rgba(40, 167, 69, 1)" },
        { bg: "rgba(255, 193, 7, 0.7)", border: "rgba(255, 193, 7, 1)" },
        { bg: "rgba(108, 117, 125, 0.7)", border: "rgba(108, 117, 125, 1)" },
      ];

      const datasets = allGrades.map((grade, index) => {
        const color = colors[index % colors.length];
        return {
          label: grade,
          data: sortedDates.map((date) => gradesByDate[date]?.[grade] || 0),
          backgroundColor: color.bg,
          borderColor: color.border,
          borderWidth: 2,
        };
      });

      return { labels: sortedDates, datasets };
    }

    // Group by class
    const byClass = {};
    absencesForCharts.forEach((a) => {
      const key = `${a.grade || "Unknown"} ${a.class || "Unknown"}`.trim();
      byClass[key] = (byClass[key] || 0) + 1;
    });

    const labels = Object.keys(byClass);
    const absenceCounts = labels.map((k) => byClass[k]);

    return {
      labels,
      datasets: [
        {
          label: "Absence Count",
          data: absenceCounts,
          backgroundColor: "rgba(230, 0, 40, 0.6)",
          borderColor: "rgba(230, 0, 40, 1)",
          borderWidth: 2,
        },
      ],
    };
  }, [absencesForCharts, chartGroupMode]);

  const typeData = useMemo(() => {
    const isEntireDayMode = selectedSessions.includes(-1);
    const ABSENT_TYPES = new Set([10, 20]);
    const LATE_TYPES = new Set([50, 55]);
    
    let absentCount = 0;
    let lateCount = 0;
    
    if (isEntireDayMode) {
      const studentDateMap = new Map();
      (filteredAbsences || []).forEach(a => {
        const d = new Date(a.date).toDateString();
        const key = `${a.studentId}_${d}`;
        if (!studentDateMap.has(key)) studentDateMap.set(key, { absent: 0, late: 0 });
        const typeId = Number(a.absenceTypeId);
        if (ABSENT_TYPES.has(typeId)) studentDateMap.get(key).absent++;
        else if (LATE_TYPES.has(typeId)) studentDateMap.get(key).late++;
      });

      studentDateMap.forEach(val => {
        if (val.absent >= SESSIONS_PER_DAY) absentCount++;
        if (val.late >= SESSIONS_PER_DAY) lateCount++;
      });
    } else {
      (absencesForCharts || []).forEach(a => {
        const typeId = Number(a.absenceTypeId);
        if (ABSENT_TYPES.has(typeId)) absentCount++;
        else if (LATE_TYPES.has(typeId)) lateCount++;
      });
    }

    return {
      labels: ["Absent", "Late"],
      datasets: [{
        data: [absentCount, lateCount],
        backgroundColor: ["#dc2626", "#f59e0b"],
        hoverOffset: 4
      }]
    };
  }, [absencesForCharts, filteredAbsences, selectedSessions, SESSIONS_PER_DAY]);

  const statusDistributionData = useMemo(() => {
    const rate = Number(kpiData.attendanceRate) || 0;
    return {
      labels: ["Present", "Absent"],
      datasets: [{
        data: [rate.toFixed(1), (100 - rate).toFixed(1)],
        backgroundColor: ["rgba(40, 167, 69, 0.8)", "rgba(220, 53, 69, 0.8)"],
        borderColor: ["rgba(40, 167, 69, 1)", "rgba(220, 53, 69, 1)"],
        borderWidth: 2,
      }]
    };
  }, [kpiData.attendanceRate]);

  return (
    <>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      
      <div className="content-area">
        {user && (
          <div className="welcome-section">
            <div className="welcome-content">
              <h1>Welcome, {user.name || user.fullName || "User"}!</h1>
              <p>
                {isStudent 
                  ? "Track your attendance trends and streaks." 
                  : "Monitor trends and statistics across your classes."}
              </p>
              {normalizedRole === 'studentaffair' && notifPermission !== 'granted' && (
                <button 
                  onClick={requestNotificationPermission} 
                  className="card-button" 
                  style={{ marginTop: '10px', background: '#007bff', color: 'white' }}
                >
                  Enable Desktop Notifications
                </button>
              )}
            </div>
            {!isStudent && (
              <button onClick={loadData} className="card-button" style={{ background: 'white', color: '#dc2626' }} disabled={loading}>
                {loading ? "Loading..." : "Refresh Data"}
              </button>
            )}
          </div>
        )}

        <div className="content-header">
          <h2>{isStudent ? "Your Attendance Overview" : "Performance Overview"}</h2>
        </div>

        {!isStudent && (
          <div className="absence-log-filters card">
            <div className="filter-group" style={{ minWidth: '240px' }}>
              <label>Filter by Student</label>
              <MultiSelectDropdown
                options={students.map(s => ({ id: s.id, label: s.name || s.fullName || s.studentName }))}
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
            <div className="filter-group">
              <label>Sessions</label>
              <MultiSelectDropdown
                options={[{ id: -1, label: 'Entire Day' }, ...sessions.map(s => ({ id: s.sessionNo, label: `Session ${s.sessionNo}` }))]}
                selectedIds={selectedSessions}
                onChange={handleSelectedSessionsChange}
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
            <div className="filter-group" style={{ alignSelf: 'flex-end' }}>
              <button onClick={() => {
                setSelectedGrade("");
                setSelectedClass("");
                setSelectedStudents([]);
                setSelectedSessions([-1]);
                const today = new Date();
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(today.getDate() - 30);
                setFromDate(thirtyDaysAgo.toISOString().split("T")[0]);
                setToDate(today.toISOString().split("T")[0]);
              }} className="card-button" style={{ background: '#6c757d' }}>Reset</button>
            </div>
          </div>
        )}

        <div className="kpi-grid">
          <div className="kpi-card kpi-card-with-formula">
            <div className="kpi-value">{kpiData.attendanceRate.toFixed(1)}%</div>
            <div className="kpi-label">Overall Attendance</div>
            <div className="kpi-formula-popover">
              <div className="kpi-formula-title">Calculation Method</div>
              <div className="kpi-formula-row">
                <span>Formula:</span>
                <span>(1 - AbsentUnits / TotalUnits) * 100</span>
              </div>
              <div className="kpi-formula-subtitle">Parameters Used:</div>
              <div className="kpi-formula-row">
                <span>Students:</span>
                <span>{kpiData.attendanceFormula.studentCount}</span>
              </div>
              <div className="kpi-formula-row">
                <span>Days:</span>
                <span>{kpiData.attendanceFormula.totalDays}</span>
              </div>
              {!kpiData.attendanceFormula.isEntireDayMode && (
                <div className="kpi-formula-row">
                  <span>Sessions:</span>
                  <span>{kpiData.attendanceFormula.sessionsCount}</span>
                </div>
              )}
              <div className="kpi-formula-row">
                <span>Total Units:</span>
                <span>{kpiData.attendanceFormula.totalUnits}</span>
              </div>
              <div className="kpi-formula-row">
                <span>Absent Units:</span>
                <span>{kpiData.attendanceFormula.absentUnits}</span>
              </div>
              <div className="kpi-formula-result">
                <span>Final Attendance Rate:</span>
                <span>{kpiData.attendanceRate.toFixed(1)}%</span>
              </div>
            </div>
          </div>
          {!isStudent && (
            <div className="kpi-card">
              <div className="kpi-value">{kpiData.topClass}</div>
              <div className="kpi-label">Top Performing Class</div>
            </div>
          )}
          <div className="kpi-card">
            <div className="kpi-value">{kpiData.totalAbsences}</div>
            <div className="kpi-label">Total Absences</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-value">{kpiData.totalLates}</div>
            <div className="kpi-label">Total Lates</div>
          </div>
        </div>

        <div className="charts-grid">
          <div className="chart-card">
            <h3>Daily Absence Trend</h3>
            <div className="chart-responsive-wrapper">
              <Line data={trendData} options={chartOptions} />
            </div>
          </div>
          {!isStudent && (
            <div className="chart-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h3 style={{ margin: 0 }}>Absences by {chartGroupMode === "class" ? "Class" : "Grade"}</h3>
                <select 
                  value={chartGroupMode} 
                  onChange={(e) => setChartGroupMode(e.target.value)}
                  style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '12px' }}
                >
                  <option value="class">Group by Class</option>
                  <option value="grade">Group by Grade</option>
                </select>
              </div>
              <div className="chart-responsive-wrapper">
                <Bar data={classData} options={chartOptions} />
              </div>
            </div>
          )}
          <div className="chart-card">
            <h3>Attendance Distribution</h3>
            <div className="chart-responsive-wrapper">
              <Doughnut data={statusDistributionData} options={chartOptions} />
            </div>
          </div>
          <div className="chart-card">
            <h3>Absence vs Late Analysis</h3>
            <div className="chart-responsive-wrapper">
              <Doughnut data={typeData} options={chartOptions} />
            </div>
          </div>
        </div>

        {!isStudent && (
          <div className="absence-log-container card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                <h3 style={{ margin: 0 }}>Student Absence Ranking</h3>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button 
                    onClick={exportToExcel} 
                    className="card-button" 
                    style={{ background: '#28a745', padding: '6px 12px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
                    title="Export as Excel"
                  >
                    <FaFileExcel /> Excel
                  </button>
                  <button 
                    onClick={exportToSVG} 
                    className="card-button" 
                    style={{ background: '#3e8bff', padding: '6px 12px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
                    title="Export as SVG"
                  >
                    <FaFileImage /> SVG
                  </button>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', fontWeight: '600' }}>Min Absences:</span>
                <input 
                  type="number" 
                  value={minAbsences} 
                  onChange={(e) => setMinAbsences(Number(e.target.value))} 
                  style={{ width: '60px', padding: '5px', borderRadius: '4px', border: '1px solid #ddd' }}
                />
              </div>
            </div>
            
            <div className="table-container">
              <table className="absence-table">
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>Class</th>
                    <th>Total Absences</th>
                    <th>Attendance Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedStudents.map((s, idx) => (
                    <tr key={idx}>
                      <td className="student-name-cell">{s.studentName}</td>
                      <td>{s.class}</td>
                      <td style={{ color: '#dc2626', fontWeight: 'bold' }}>{s.absences}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ flex: 1, height: '8px', background: '#eee', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ width: `${s.rate}%`, height: '100%', background: s.rate > 80 ? '#28a745' : s.rate > 50 ? '#ffc107' : '#dc3545' }} />
                          </div>
                          <span style={{ minWidth: '40px' }}>{s.rate}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {paginatedStudents.length === 0 && (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', padding: '30px', color: '#6c757d' }}>No data found for the current filters.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '20px' }}>
                <button 
                  className="card-button" 
                  style={{ background: '#eee', color: '#333' }} 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                >Prev</button>
                <span style={{ alignSelf: 'center' }}>Page {currentPage} of {totalPages}</span>
                <button 
                  className="card-button" 
                  style={{ background: '#eee', color: '#333' }} 
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => p + 1)}
                >Next</button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default DashboardPage;
