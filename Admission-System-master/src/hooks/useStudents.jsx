"use client";

import { useState, useEffect } from "react";
import { adminAPI } from "../utils/api";
import { getExamAdmissionContribution } from "../utils/examScoring";

export const useStudents = () => {
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingStudent, setEditingStudent] = useState(null);
  const [editScores, setEditScores] = useState({
    softwareInterviewScore: 0,
    mathInterviewScore: 0,
    englishInterviewScore: 0,
    arabicInterviewScore: 0,
  });
  const [interviewScore, setInterviewScore] = useState(0);
  const [editingInterviewScore, setEditingInterviewScore] = useState(null);
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentAdminRole, setCurrentAdminRole] = useState("");
  const [successMessage, setSuccessMessage] = useState(null);

  // Simplified list state (no pagination)

  const clearError = () => setError("");
  const clearSuccessMessage = () => setSuccessMessage(null);

  // Fetch students data
  const fetchStudents = async () => {
    try {
      setIsLoading(true);
      setError("");
      const response = await adminAPI.getAllStudents();

      // Handle response
      const studentsData = response.data || [];
      setStudents(studentsData);
      // no pagination: all data in memory

      // Determine admin role based on response structure
      if (studentsData.length > 0) {
        const firstStudent = studentsData[0];
        if (
          Object.prototype.hasOwnProperty.call(
            firstStudent,
            "interviewScores"
          ) &&
          Array.isArray(firstStudent.interviewScores)
        ) {
          // This is board view
          setCurrentAdminRole("board");
        } else if (
          Object.prototype.hasOwnProperty.call(firstStudent, "phoneNumber") ||
          Object.prototype.hasOwnProperty.call(firstStudent, "city")
        ) {
          // This is staff admin view
        } else {
          // This is interviewer view
          setCurrentAdminRole("interviewer");
        }
      }
    } catch (err) {
      setError(err.response?.data || "Failed to fetch students");
    } finally {
      setIsLoading(false);
    }
  };

  // Pagination removed

  useEffect(() => {
    fetchStudents();
  }, []);

  // Read backend-computed TotalPercentage for sorting purposes
  const getBackendPercentage = (student) => {
    if (!student) return 0;
    const v = student.totalPercentage ?? student.TotalPercentage;
    return v != null ? Number(v) : 0;
  };

  const filteredStudents = students
    .filter(
      (student) =>
        (student.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          student.nationalId?.includes(searchTerm) ||
          student.email?.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (statusFilter === "all" ||
          (statusFilter === "Pending" &&
            (student.Status === "1" ||
              student.status === "1" ||
              student.status === 1)) ||
          (statusFilter === "Accepted" &&
            (student.Status === "2" ||
              student.status === "2" ||
              student.status === 2)) ||
          (statusFilter === "Rejected" &&
            (student.Status === "3" ||
              student.status === "3" ||
              student.status === 3)) ||
          (statusFilter === "Waitlisted" &&
            (student.Status === "4" ||
              student.status === "4" ||
              student.status === 4)))
    )
    .sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case "finalYearScore":
          aValue = a.finalYearScore || 0;
          bValue = b.finalYearScore || 0;
          break;
        case "percentage":
          aValue = getBackendPercentage(a);
          bValue = getBackendPercentage(b);
          break;
        case "status":
          aValue = a.status || 1;
          bValue = b.status || 1;
          break;
        case "interviewScore":
          aValue = a.interviewScore || 0;
          bValue = b.interviewScore || 0;
          break;
        case "name":
        default:
          aValue = a.fullName || "";
          bValue = b.fullName || "";
          break;
      }

      if (sortOrder === "desc") {
        return bValue > aValue ? 1 : bValue < aValue ? -1 : 0;
      } else {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      }
    });

  const handleEditScores = (studentId) => {
    const student = students.find((s) => s.id === studentId);
    if (student) {
      setEditingStudent(studentId);
      setEditScores({
        softwareInterviewScore: student.examSoftwareScore || 0,
        mathInterviewScore: student.examMathScore || 0,
        englishInterviewScore: student.examEnglishScore || 0,
        arabicInterviewScore: student.examArabicScore || 0,
      });
    }
  };

  const saveScores = async () => {
    if (editingStudent) {
      try {
        setIsSubmitting(true);
        // Note: This would need to be implemented in the backend
        // For now, we'll just update the local state
        setStudents((prev) =>
          prev.map((student) => {
            if (student.id === editingStudent) {
              return {
                ...student,
                examSoftwareScore: editScores.softwareInterviewScore,
                examMathScore: editScores.mathInterviewScore,
                examEnglishScore: editScores.englishInterviewScore,
                examArabicScore: editScores.arabicInterviewScore,
              };
            }
            return student;
          })
        );
        setEditingStudent(null);
      } catch {
        setError("Failed to save scores");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const updateStudentStatus = async (studentId, status) => {
    try {
      setIsSubmitting(true);
      setError(null); // Clear any previous errors
      setSuccessMessage(null); // Clear any previous success messages

      await adminAPI.updateStudentStatus(studentId, status);

      // Convert status string to number for local state
      const getStatusNumber = (statusText) => {
        switch (statusText) {
          case "Pending":
            return 1;
          case "Accepted":
            return 2;
          case "Rejected":
            return 3;
          case "Waitlisted":
            return 4;
          default:
            return 1;
        }
      };

      const statusNumber = getStatusNumber(status);

      // Update local state - handle both Status and status field names
      setStudents((prev) =>
        prev.map((student) =>
          student.id === studentId
            ? {
                ...student,
                Status: statusNumber.toString(), // Backend expects string
                status: statusNumber, // Frontend compatibility
              }
            : student
        )
      );

      // Set success message
      setSuccessMessage(`Student status updated successfully to ${status}`);

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err) {
      setError(err.response?.data || "Failed to update student status");
    } finally {
      setIsSubmitting(false);
    }
  };

  const stats = {
    totalStudents: students.length,
    withAcceptanceLetter: students.filter((s) => s.ministryExamPercentage >= 50)
      .length,
    interviewed: students.filter((s) => {
      if (currentAdminRole === "board") {
        return s.interviewScores && s.interviewScores.length > 0;
      } else {
        return s.interviewScore > 0;
      }
    }).length,
    averageScore:
      students
        .filter((s) => {
          if (currentAdminRole === "board") {
            return s.interviewScores && s.interviewScores.length > 0;
          } else {
            return s.interviewScore > 0;
          }
        })
        .reduce((sum, s) => {
          if (currentAdminRole === "board") {
            return sum + (s.interviewPercentage || 0);
          } else {
            return sum + (s.interviewScore || 0);
          }
        }, 0) /
        students.filter((s) => {
          if (currentAdminRole === "board") {
            return s.interviewScores && s.interviewScores.length > 0;
          } else {
            return s.interviewScore > 0;
          }
        }).length || 0,
  };

  const handleSort = (newSortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(newSortBy);
      setSortOrder("desc"); // Default to descending for scores
    }
  };

  const handleEditInterviewScore = (studentId) => {
    const student = students.find((s) => s.id === studentId);
    if (student) {
      setEditingInterviewScore(studentId);
      setInterviewScore(student.interviewScore || 0);
    }
  };

  const saveInterviewScore = async () => {
    if (editingInterviewScore) {
      try {
        setIsSubmitting(true);
        await adminAPI.setInterviewScore(editingInterviewScore, interviewScore);

        // Update local state
        setStudents((prev) =>
          prev.map((student) => {
            if (student.id === editingInterviewScore) {
              return {
                ...student,
                interviewScore: interviewScore,
              };
            }
            return student;
          })
        );
        setEditingInterviewScore(null);
        setInterviewScore(0);
      } catch (err) {
        setError(err.response?.data || "Failed to save interview score");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return {
    students,
    searchTerm,
    setSearchTerm,
    editingStudent,
    setEditingStudent,
    editScores,
    setEditScores,
    interviewScore,
    setInterviewScore,
    editingInterviewScore,
    setEditingInterviewScore,
    filteredStudents,
    handleEditScores,
    saveScores,
    handleEditInterviewScore,
    saveInterviewScore,
    calculatePercentage: getBackendPercentage,
    updateStudentStatus,
    stats,
    sortBy,
    sortOrder,
    handleSort,
    statusFilter,
    setStatusFilter,
    isLoading,
    error,
    successMessage,
    isSubmitting,
    fetchStudents,
    currentAdminRole,
    clearError,
    clearSuccessMessage,
  };
};
