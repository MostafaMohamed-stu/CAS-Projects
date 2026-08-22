import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../Contexts/AuthContext";
import api from "../Services/api";
import { absenceService } from "../Services/absenceService";
import MultiSelectDropdown from "../Components/MultiSelectDropdown";
import { ToastContainer, useToast } from "../Components/Popups";

import "./Styles/AbsenceRecordPage.css";

/* =================================================================
   Main AbsenceRecordPage (Exact Sync from StudentDashboard.js)
   ================================================================= */
const AbsenceRecordPage = () => {
  const navigate = useNavigate();
  const { toasts, addToast, removeToast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);

  const persistedStateRef = useRef(null);

  // filters
  const [selectedGrade, setSelectedGrade] = useState(""); // gradeId
  const [selectedClass, setSelectedClass] = useState(""); // classId
  const [selectedSessions, setSelectedSessions] = useState([]); // Array of session numbers
  const [selectedClassName, setSelectedClassName] = useState("");
  const [isSessionDropdownOpen, setIsSessionDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsSessionDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  // backend data
  const [availableGrades, setAvailableGrades] = useState([]);
  const [availableClasses, setAvailableClasses] = useState([]);
  const [availableSessions, setAvailableSessions] = useState([]);

  // students
  const [students, setStudents] = useState([]);

  // Language toggle
  const [nameLanguage, setNameLanguage] = useState("en");

  // statuses  { studentId: { isPresent: bool, hasExcuse: bool, isAbsentEntireDay: bool } }
  const [studentStatuses, setStudentStatuses] = useState({});

  useEffect(() => {
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    try {
      const keysToRemove = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (!key || !key.startsWith("attendance_session_")) continue;
        const raw = sessionStorage.getItem(key);
        if (!raw) {
          keysToRemove.push(key);
          continue;
        }
        try {
          const parsed = JSON.parse(raw);
          const expiresAt =
            parsed && parsed.expiresAt
              ? new Date(parsed.expiresAt).getTime()
              : 0;
          const isExpired = expiresAt && expiresAt <= now.getTime();
          const isNotToday = parsed && parsed.date && parsed.date !== todayStr;
          if (isExpired || isNotToday) keysToRemove.push(key);
        } catch (e) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((k) => sessionStorage.removeItem(k));
    } catch (e) {}
    const msUntilMidnight =
      new Date(new Date().setHours(24, 0, 0, 0)).getTime() - now.getTime();
    const timer = setTimeout(() => {
      try {
        const keys = [];
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i);
          if (key && key.startsWith("attendance_session_")) keys.push(key);
        }
        keys.forEach((k) => sessionStorage.removeItem(k));
      } catch (e) {}
    }, msUntilMidnight);
    return () => clearTimeout(timer);
  }, []);

  // Helper function to capitalize the first letter of each word
  const capitalizeWords = (str) => {
    if (!str) return "";
    return str.replace(/\b\w/g, (char) => char.toUpperCase());
  };

  // Restore dashboard state
  useEffect(() => {
    if (!user?.id) return;

    try {
      const key = `attendance_session_${user.id}`;
      const raw = sessionStorage.getItem(key);
      if (!raw) return;

      const parsed = JSON.parse(raw);
      const todayStr = new Date().toISOString().split("T")[0];
      if (!parsed || parsed.date !== todayStr) return;

      persistedStateRef.current = parsed;

      if (parsed.selectedGrade) setSelectedGrade(String(parsed.selectedGrade));
      if (parsed.selectedClass) setSelectedClass(String(parsed.selectedClass));
      if (Array.isArray(parsed.selectedSessions)) {
        setSelectedSessions(
          parsed.selectedSessions
            .map((s) => parseInt(s))
            .filter((n) => !Number.isNaN(n))
            .sort((a, b) => a - b)
        );
      }
      if (parsed.studentStatuses && typeof parsed.studentStatuses === "object") {
        setStudentStatuses(parsed.studentStatuses);
      }
    } catch (e) {
      // ignore invalid persisted data
    }
  }, [user?.id]);

  // load grades
  useEffect(() => {
    const loadGrades = async () => {
      try {
        setIsLoading(true);
        const response = await api.get("/api/Grade");
        if (response.status === 200 && Array.isArray(response.data)) {
          const gradeOrder = {
            junior: 1, juniors: 1,
            wheeler: 2, wheelers: 2,
            senior: 3, seniors: 3,
          };

          const sortedGrades = response.data.sort((a, b) => {
            const gradeA = a.gradeName.toLowerCase().trim();
            const gradeB = b.gradeName.toLowerCase().trim();
            return (gradeOrder[gradeA] || 99) - (gradeOrder[gradeB] || 99);
          });

          setAvailableGrades(sortedGrades);
        }
      } catch (error) {
        console.error("Error loading grades:", error);
        if (error.response?.status === 401) {
          navigate("/login");
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadGrades();
  }, [navigate]);

  // load classes when grade changes
  useEffect(() => {
    const loadClassesForGrade = async () => {
      if (!selectedGrade) {
        setAvailableClasses([]);
        setSelectedClass("");
        setAvailableSessions([]);
        setSelectedSessions([]);
        return;
      }

      try {
        setIsLoading(true);
        const resp = await api.get(`/api/Classes/by-grade/${selectedGrade}`);
        if (resp.status === 200 && Array.isArray(resp.data)) {
          setAvailableClasses(resp.data);
          const currentClass = resp.data.find(c => String(c.id) === selectedClass);
          if (currentClass) {
            setSelectedClassName(currentClass.className);
          } else {
            setSelectedClassName("");
          }
        }
      } catch (err) {
        console.error("Error fetching classes:", err);
        setAvailableClasses([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadClassesForGrade();
  }, [selectedGrade]);

  // load sessions when class changes
  useEffect(() => {
    const loadSessions = async () => {
      if (selectedClass) {
        try {
          setIsLoadingSessions(true);
          const response = await api.get("/api/Session");
          if (response.status === 200 && Array.isArray(response.data) && response.data.length > 0) {
            const sessions = response.data
              .map((s) => ({
                sessionNo: parseInt(s.sessionNo),
                name: s.displayName || `Session ${s.sessionNo}`,
              }))
              .sort((a, b) => a.sessionNo - b.sessionNo);
            setAvailableSessions(sessions);
          } else {
            const defaultSessions = Array.from({ length: 8 }, (_, i) => ({
              sessionNo: i + 1,
              name: `Session ${i + 1}`,
            }));
            setAvailableSessions(defaultSessions);
          }
        } catch (error) {
          console.error("Error loading sessions:", error);
          const defaultSessions = Array.from({ length: 8 }, (_, i) => ({
            sessionNo: i + 1,
            name: `Session ${i + 1}`,
          }));
          setAvailableSessions(defaultSessions);
        } finally {
          setIsLoadingSessions(false);
        }
      } else {
        setAvailableSessions([]);
      }
    };

    loadSessions();
  }, [selectedClass]);

  // load students
  useEffect(() => {
    const loadStudents = async () => {
      if (selectedGrade && selectedClass && selectedSessions.length > 0) {
        try {
          setIsLoading(true);
          const response = await api.get("/api/StudentExtension/FetchStudentsForAbsence", {
            params: {
              classId: parseInt(selectedClass),
              gradeId: parseInt(selectedGrade),
            },
          });

          if (response.status === 200 && Array.isArray(response.data)) {
            const mapped = response.data.map((s) => ({
              id: s.studentId,
              name: s.studentName,
              nameAr: s.studentNameAr,
            }));
            setStudents(mapped);

            // Fetch existing absences for today to identify full-day absences
            const todayStr = new Date().toISOString().split("T")[0];
            let existingAbsences = [];
            try {
              const absResp = await api.get("/api/Absence/GetFilteredAbsences", {
                params: {
                  className: selectedClassName,
                  fromDate: todayStr,
                  toDate: todayStr
                }
              });
              if (absResp.status === 200 && Array.isArray(absResp.data)) {
                existingAbsences = absResp.data;
              }
            } catch (e) {
              console.warn("Failed to fetch existing absences", e);
            }

            const initial = {};
            mapped.forEach((student) => {
              const isFullDayAbsent = existingAbsences.some(a => 
                a.studentId === student.id && (a.session === -1 || a.session === 0)
              );

              initial[student.id] = {
                isPresent: isFullDayAbsent ? false : true,
                hasExcuse: false,
                isLate: false,
                isAbsentEntireDay: isFullDayAbsent
              };
            });

            // Merge persisted statuses
            try {
              const persisted = persistedStateRef.current;
              const todayStr = new Date().toISOString().split("T")[0];
              if (
                persisted &&
                persisted.date === todayStr &&
                String(persisted.selectedGrade || "") === String(selectedGrade) &&
                String(persisted.selectedClass || "") === String(selectedClass) &&
                Array.isArray(persisted.selectedSessions) &&
                persisted.selectedSessions.join(",") === selectedSessions.join(",") &&
                persisted.studentStatuses
              ) {
                Object.entries(persisted.studentStatuses).forEach(([id, st]) => {
                  const sid = parseInt(id);
                  if (initial[sid]) {
                    initial[sid] = { ...initial[sid], ...st };
                  }
                });
              }
            } catch (e) {}

            setStudentStatuses(initial);
          } else {
            setStudents([]);
            setStudentStatuses({});
          }
        } catch (error) {
          console.error("Error loading students:", error);
          setStudents([]);
          setStudentStatuses({});
        } finally {
          setIsLoading(false);
        }
      } else {
        setStudents([]);
        setStudentStatuses({});
      }
    };

    loadStudents();
  }, [selectedGrade, selectedClass, selectedSessions]);

  // handle updates
  const handleStudentUpdate = (studentId, updatedValues) => {
    setStudentStatuses((prev) => {
      const current = prev[studentId] || { isPresent: true, hasExcuse: false, isLate: false };
      const next = { ...current, ...updatedValues };

      // Mutual exclusivity: if marked as Absent (isPresent: false), it cannot be Late.
      if (updatedValues.isPresent === false) {
        next.isLate = false;
      }
      // If marked as Late, it must be Present (in class but late)
      if (updatedValues.isLate === true) {
        next.isPresent = true;
      }

      return {
        ...prev,
        [studentId]: next,
      };
    });
  };

  // persist state
  useEffect(() => {
    if (!user?.id) return;
    try {
      const todayStr = new Date().toISOString().split("T")[0];
      const expiresAt = new Date(new Date().setHours(24, 0, 0, 0)).toISOString();
      const payload = {
        date: todayStr,
        expiresAt,
        selectedGrade,
        selectedClass,
        selectedSessions,
        studentStatuses,
      };
      sessionStorage.setItem(`attendance_session_${user.id}`, JSON.stringify(payload));
    } catch (e) {}
  }, [user?.id, selectedGrade, selectedClass, selectedSessions, studentStatuses]);

  // save attendance
  const handleSaveAttendance = async () => {
    if (!selectedGrade || !selectedClass || selectedSessions.length === 0) {
      addToast("Please select Grade, Class, and at least one Session.", "warning");
      return;
    }

    if (students.length === 0) {
      addToast("No students found for the selected class.", "info");
      return;
    }

    setIsSaving(true);
    try {
      const todayStr = new Date().toISOString().split("T")[0];
      let totalSuccessCount = 0;
      let totalErrorCount = 0;
      let totalSkippedCount = 0;

      let allExistingAbsences = [];
      try {
        allExistingAbsences = await absenceService.getAllAbsences();
      } catch (e) {}

      const studentTrueAbsenceMap = {}; // studentId -> Set of session IDs they are truly absent in today
      const studentAllAbsenceMap = {}; // studentId -> Set of all session IDs (even late) for today
      const studentRecordIdsMap = {}; // studentId -> Array of { sessionId, recordId }
      const existingByStudentSession = {}; // studentId -> session -> { id, absenceTypeId }
      
      allExistingAbsences.forEach(a => {
        if (a.date === todayStr) {
          if (!studentTrueAbsenceMap[a.studentId]) studentTrueAbsenceMap[a.studentId] = new Set();
          if (!studentAllAbsenceMap[a.studentId]) studentAllAbsenceMap[a.studentId] = new Set();
          if (!studentRecordIdsMap[a.studentId]) studentRecordIdsMap[a.studentId] = [];
          if (!existingByStudentSession[a.studentId]) existingByStudentSession[a.studentId] = {};
          
          const isTrueAbsent = a.absenceTypeId === 10 || a.absenceTypeId === 20;
          if (isTrueAbsent) {
            studentTrueAbsenceMap[a.studentId].add(parseInt(a.session));
          }
          studentAllAbsenceMap[a.studentId].add(parseInt(a.session));
          studentRecordIdsMap[a.studentId].push({ sessionId: parseInt(a.session), recordId: a.id });
          existingByStudentSession[a.studentId][parseInt(a.session)] = { id: a.id, absenceTypeId: a.absenceTypeId };
        }
      });

      for (const [studentIdStr, data] of Object.entries(studentStatuses)) {
        const studentId = parseInt(studentIdStr);
        if (data.isPresent && !data.isLate) continue; // Only process absent/late students

        // Determine if they should be marked as "Entire Day" (-1)
        // This triggers if Session 1 and 2 are both marked as absent (either already in DB or currently selected)
        const isCurrentlyAbsent = !data.isPresent && !data.isLate;
        const willHaveSession1 = selectedSessions.includes(1) && isCurrentlyAbsent;
        const willHaveSession2 = selectedSessions.includes(2) && isCurrentlyAbsent;
        
        const hasSession1InDb = studentTrueAbsenceMap[studentId]?.has(1);
        const hasSession2InDb = studentTrueAbsenceMap[studentId]?.has(2);
        const hasEntireDayInDb = studentAllAbsenceMap[studentId]?.has(-1);

        const shouldBeEntireDay = !hasEntireDayInDb && (
          (willHaveSession1 && willHaveSession2) ||
          (willHaveSession1 && hasSession2InDb) ||
          (willHaveSession2 && hasSession1InDb)
        );

        if (shouldBeEntireDay) {
          try {
            // Delete existing individual session records for this student today to avoid duplication
            const existingRecords = studentRecordIdsMap[studentId] || [];
            for (const record of existingRecords) {
              await absenceService.deleteAbsence(record.recordId);
            }

            // Save entire day record
            const absencePayload = {
              studentId,
              classId: parseInt(selectedClass),
              dateOfAbsence: todayStr,
              lectuerID: user?.id,
              sessionID: -1, // Entire day
              absenceTypeId: data.hasExcuse ? 20 : 10,
            };
            await api.post("/api/Absence/AddAbsenceRecord", absencePayload);
            totalSuccessCount++;
            continue; // Move to next student
          } catch (err) {
            totalErrorCount++;
            continue;
          }
        }

        // Normal processing if not "Entire Day"
        if (hasEntireDayInDb) {
          totalSkippedCount += selectedSessions.length;
          continue;
        }

        for (const sessionNum of selectedSessions) {
          const desiredTypeId = data.isLate
            ? (data.hasExcuse ? 55 : 50)
            : (data.hasExcuse ? 20 : 10);

          // If a record exists for this student/session today, update it if type differs
          const existing = existingByStudentSession[studentId]?.[sessionNum];
          if (existing) {
            try {
              if (existing.absenceTypeId !== desiredTypeId) {
                await absenceService.updateAbsenceType(existing.id, desiredTypeId);
                totalSuccessCount++;
              } else {
                totalSkippedCount++;
              }
            } catch (err) {
              totalErrorCount++;
            }
            continue;
          }

          try {
            const absencePayload = {
              studentId,
              classId: parseInt(selectedClass),
              dateOfAbsence: todayStr,
              lectuerID: user?.id,
              sessionID: sessionNum,
              absenceTypeId: desiredTypeId,
            };

            await api.post("/api/Absence/AddAbsenceRecord", absencePayload);
            totalSuccessCount++;
          } catch (err) {
            totalErrorCount++;
          }
        }
      }

      if (totalErrorCount === 0 && totalSuccessCount > 0) {
        addToast(`Saved ${totalSuccessCount} records.${totalSkippedCount > 0 ? ` Skipped ${totalSkippedCount} duplicates.` : ""}`, "success");
      } else if (totalSuccessCount > 0) {
        addToast(`Partially saved: ${totalSuccessCount} successful, ${totalErrorCount} failed.`, "warning");
      } else if (totalErrorCount > 0) {
        addToast("Failed to save absences.", "error");
      } else {
        addToast(totalSkippedCount > 0 ? `Skipped ${totalSkippedCount} duplicates.` : "No absences recorded.", "info");
      }
    } catch (error) {
      addToast(`Error: ${error.message}`, "error");
    } finally {
      setIsSaving(false);
      // Notify Student Affair via backend (file-backed store) about any missing sessions
      try {
        const dateStr = new Date().toISOString().split("T")[0];
        const classIdInt = parseInt(selectedClass);

        // 1. Check for missing "in-between" sessions
        await api.post("/api/Notifications/report-missing", {
          classId: classIdInt,
          selectedSessions: selectedSessions,
          date: dateStr,
        });

        // 2. Check for students absent in 3-8 or entire day
        await api.post("/api/Notifications/check-absent-range", {
          classId: classIdInt,
          date: dateStr,
        });
      } catch (e) {
        console.error("Failed to report notifications:", e);
      }
    }
  };

  const handleCopyAttendance = () => {
    if (Object.keys(studentStatuses).length === 0) return;
    localStorage.setItem("attendance_clipboard", JSON.stringify(studentStatuses));
    addToast("Records copied.", "success");
  };

  const handlePasteAttendance = () => {
    try {
      const storedData = localStorage.getItem("attendance_clipboard");
      if (!storedData) {
        addToast("No copied records found.", "info");
        return;
      }
      const clipboardData = JSON.parse(storedData);
      setStudentStatuses(prev => {
        const next = { ...prev };
        let count = 0;
        students.forEach(s => {
          if (clipboardData[s.id]) {
            next[s.id] = { ...next[s.id], ...clipboardData[s.id] };
            count++;
          }
        });
        if (count > 0) addToast(`Pasted for ${count} students.`, "success");
        return next;
      });
    } catch (e) {
      addToast("Failed to paste records.", "error");
    }
  };

  const handleSessionToggle = (sessionNo) => {
    setSelectedSessions(prev => 
      prev.includes(sessionNo) ? prev.filter(s => s !== sessionNo) : [...prev, sessionNo].sort((a,b) => a-b)
    );
  };

  const handleSelectAllSessions = () => {
    if (selectedSessions.length === availableSessions.length) {
      setSelectedSessions([]);
    } else {
      setSelectedSessions(availableSessions.map(s => s.sessionNo));
    }
  };

  return (
    <>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <div className="content-area">
        {user && (
          <div className="welcome-section">
            <div className="welcome-content">
              <h1>Welcome, {user.name || user.fullName || "User"}!</h1>
              <p>Here's what's happening with attendance today.</p>
            </div>
          </div>
        )}

        <div className="content-header">
          <h2>Record Student Absences</h2>
        </div>

        <div className="card attendance-filters">
          <div className="filter-group">
            <label>Grade</label>
            <select value={selectedGrade} onChange={(e) => setSelectedGrade(e.target.value)}>
              <option value="">Select Grade</option>
              {availableGrades.map(g => <option key={g.id} value={g.id}>{g.gradeName}</option>)}
            </select>
          </div>
          <div className="filter-group">
            <label>Class</label>
            <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} disabled={!selectedGrade}>
              <option value="">Select Class</option>
              {availableClasses.map(c => <option key={c.id} value={c.id}>{c.className}</option>)}
            </select>
          </div>
          <div className="filter-group" style={{ flex: 2 }}>
            <label>Sessions</label>
            <MultiSelectDropdown
              options={availableSessions.map(s => ({ id: s.sessionNo, label: s.name }))}
              selectedIds={selectedSessions}
              onChange={setSelectedSessions}
              placeholder="Select Sessions..."
              selectAllExcludeIds={[]}
            />
          </div>
          <div className="filter-group">
            <label>Name Language</label>
            <select value={nameLanguage} onChange={(e) => setNameLanguage(e.target.value)}>
              <option value="en">English (En)</option>
              <option value="ar">Arabic (Ar)</option>
            </select>
          </div>
        </div>

        {selectedSessions.length > 0 && students.length > 0 && (
          <div className="students-list-container card">
            <div className="attendance-stats">
              <div className="stat-card">
                <span className="stat-label">Total Students</span>
                <span className="stat-value">{students.length}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Total Attended</span>
                <span className="stat-value text-green">
                  {Object.values(studentStatuses).filter(s => s.isPresent).length}
                </span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Total Absence</span>
                <span className="stat-value text-red">
                  {Object.values(studentStatuses).filter(s => !s.isPresent).length}
                </span>
              </div>
            </div>

            <div className="table-controls">
              <button className="card-button save-btn" onClick={handleSaveAttendance} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save All Absences"}
              </button>
              <button className="card-button" style={{ background: '#4a5568' }} onClick={handleCopyAttendance}>Copy</button>
              <button className="card-button" style={{ background: '#4a5568' }} onClick={handlePasteAttendance}>Paste</button>
            </div>
            
            <div className="table-wrapper">
              <table className="attendance-table">
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>Status</th>
                    <th>Excuse</th>
                    <th>Late</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(s => {
                    const status = studentStatuses[s.id] || { isPresent: true, hasExcuse: false, isLate: false };
                    return (
                      <tr key={s.id}>
                        <td className="student-name-cell">
                          {nameLanguage === "ar"
                            ? capitalizeWords(s.nameAr || s.name || "")
                            : capitalizeWords(s.name || s.nameAr || "")}
                        </td>
                        <td className="status-cell">
                          <div className="modern-status-toggle">
                            <button 
                              className={`status-option present ${status.isPresent ? "active" : ""}`}
                              onClick={() => handleStudentUpdate(s.id, { isPresent: true })}
                            >
                              <span className="dot"></span> Present
                            </button>
                            <button 
                              className={`status-option absent ${!status.isPresent ? "active" : ""}`}
                              onClick={() => handleStudentUpdate(s.id, { isPresent: false })}
                            >
                              <span className="dot"></span> Absent
                            </button>
                          </div>
                        </td>
                        <td className="toggle-cell">
                          <label className="modern-switch">
                            <input 
                              type="checkbox" 
                              checked={status.hasExcuse} 
                              onChange={(e) => handleStudentUpdate(s.id, { hasExcuse: e.target.checked })}
                            />
                            <span className="slider round"></span>
                          </label>
                        </td>
                        <td className="toggle-cell">
                          <label className="modern-switch late">
                            <input 
                              type="checkbox" 
                              checked={status.isLate} 
                              onChange={(e) => handleStudentUpdate(s.id, { isLate: e.target.checked })}
                            />
                            <span className="slider round"></span>
                          </label>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile View - Card List */}
            <div className="mobile-student-list">
              {students.map(s => {
                const status = studentStatuses[s.id] || { isPresent: true, hasExcuse: false, isLate: false };
                return (
                  <div key={s.id} className="student-card">
                    <div className="student-card-header">
                      <span className="student-card-name">
                        {nameLanguage === "ar"
                          ? capitalizeWords(s.nameAr || s.name || "")
                          : capitalizeWords(s.name || s.nameAr || "")}
                      </span>
                    </div>
                    <div className="student-card-controls">
                      {status.isAbsentEntireDay ? (
                        <div className="full-day-absent-notice">
                          Absent Entire Day
                        </div>
                      ) : (
                        <>
                          <div className="control-row">
                            <span className="control-label">Status</span>
                            <div className="modern-status-toggle">
                              <button 
                                className={`status-option present ${status.isPresent ? "active" : ""}`}
                                onClick={() => handleStudentUpdate(s.id, { isPresent: true })}
                              >
                                <span className="dot"></span> Present
                              </button>
                              <button 
                                className={`status-option absent ${!status.isPresent ? "active" : ""}`}
                                onClick={() => handleStudentUpdate(s.id, { isPresent: false })}
                              >
                                <span className="dot"></span> Absent
                              </button>
                            </div>
                          </div>
                          <div className="control-row">
                            <span className="control-label">Has Excuse</span>
                            <label className="modern-switch">
                              <input 
                                type="checkbox" 
                                checked={status.hasExcuse} 
                                onChange={(e) => handleStudentUpdate(s.id, { hasExcuse: e.target.checked })}
                              />
                              <span className="slider round"></span>
                            </label>
                          </div>
                          <div className="control-row">
                            <span className="control-label">Late</span>
                            <label className="modern-switch late">
                              <input 
                                type="checkbox" 
                                checked={status.isLate} 
                                onChange={(e) => handleStudentUpdate(s.id, { isLate: e.target.checked })}
                              />
                              <span className="slider round"></span>
                            </label>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default AbsenceRecordPage;
