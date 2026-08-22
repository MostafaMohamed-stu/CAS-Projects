"use client";

import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { logoutFromAdmission } from "../utils/casAuth";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Label from "../components/ui/Label";
import Badge from "../components/ui/Badge";
import { Presentation, Cpu, Puzzle, Users, Award } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/Card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/Table";
import StudentAgGrid from "../components/StudentAgGrid";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";
import { usePagination } from "../hooks/usePagination";
import Pagination from "../components/ui/Pagination";
import { adminAPI } from "../utils/api";
import {
  buildDashboardAnalytics,
  buildDashboardAverages,
  buildDashboardStats,
} from "../utils/dashboardAnalytics";
import {
  getExamAdmissionContribution,
  getExamMaximum,
  getExamPercentage,
  getExamTotal,
  hasIqExamScore,
} from "../utils/examScoring";
import StudentDetailsModal from "../components/StudentDetailsModal";

const AdminDashboardPage = () => {
  const navigate = useNavigate();
  const {
    students,
    filteredAllStudents,
    currentPage,
    pageSize,
    totalItems,
    totalPages,
    isLoading,
    error,
    fromDate,
    toDate,
    searchTerm,
    debouncedSearchTerm,
    statusFilter,
    cityFilter,
    sortBy,
    sortOrder,
    currentAdminRole,
    handlePageChange,
    handlePageSizeChange,
    handleFromDateChange,
    handleToDateChange,
    handleSearch,
    handleStatusFilter,
    handleCityFilter,
    handleSort,
    refreshData,
    setError,
  } = usePagination();

  const [activeTab, setActiveTab] = useState("dashboard"); // 'dashboard' for list, 'charts' for stats

  const [editingStudent, setEditingStudent] = useState(null);
  const [editScores, setEditScores] = useState({
    softwareInterviewScore: 0,
    mathInterviewScore: 0,
    englishInterviewScore: 0,
    arabicInterviewScore: 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showInterviewConfirmation, setShowInterviewConfirmation] =
    useState(false);
  const [pendingInterviewChange, setPendingInterviewChange] = useState(null);
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [scoreModalStudent, setScoreModalStudent] = useState(null);
  const [scoreInputs, setScoreInputs] = useState({
    presentation: "",
    technical: "",
    problemSolving: "",
    communication: "",
  });
  const [scoreInputErrors, setScoreInputErrors] = useState({});
  const [showStudentDetailsModal, setShowStudentDetailsModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [userInfo, setUserInfo] = useState({ fullName: "", role: "" });
  const governorates = [
    "القاهرة",
    "الإسكندرية",
    "الجيزة",
    "الشرقية",
    "الغربية",
    "المنوفية",
    "القليوبية",
    "البحيرة",
    "كفر الشيخ",
    "دمياط",
    "الدقهلية",
    "المنيا",
    "أسيوط",
    "سوهاج",
    "قنا",
    "الأقصر",
    "أسوان",
    "بني سويف",
    "الفيوم",
    "الوادي الجديد",
    "مطروح",
    "شمال سيناء",
    "جنوب سيناء",
    "البحر الأحمر",
    "بورسعيد",
    "الإسماعيلية",
    "السويس",
  ];
  const scoreTotalPreview =
    (Number(scoreInputs.presentation) || 0) +
    (Number(scoreInputs.technical) || 0) +
    (Number(scoreInputs.problemSolving) || 0) +
    (Number(scoreInputs.communication) || 0);

  const chartColors = [
    "#ef3131",
    "#0ea5e9",
    "#22c55e",
    "#f97316",
    "#7c3aed",
    "#14b8a6",
  ];

  const analyticsData = useMemo(
    () =>
      buildDashboardAnalytics(filteredAllStudents, {
        interviewerFallbackName:
          userInfo.fullName || userInfo.role || "Interviewer",
      }),
    [filteredAllStudents, userInfo.fullName, userInfo.role]
  );

  const averages = useMemo(
    () => buildDashboardAverages(filteredAllStudents),
    [filteredAllStudents]
  );

  // Get user info from JWT token
  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setUserInfo({
          fullName: payload.fullName || payload.FullName || "",
          role: payload.role || payload.Role || "",
        });
      } catch (error) {
        console.error("Error decoding token:", error);
      }
    }
  }, []);



  // Handle edit scores
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

  // Save scores
  const saveScores = async () => {
    if (editingStudent) {
      try {
        setIsSubmitting(true);
        // Note: This would need to be implemented in the backend
        // For now, we'll just refresh the data
        refreshData();
        setEditingStudent(null);
      } catch {
        setError("Failed to save scores");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleOpenScoreModal = (studentOrId) => {
    // Accept either a student object (from AG Grid cell) or an ID (legacy)
    const student = typeof studentOrId === 'object' && studentOrId !== null
      ? studentOrId
      : students.find((s) => s.id === studentOrId);
    if (!student) return;
    setScoreModalStudent(student);
    setScoreInputs({
      presentation: "",
      technical: "",
      problemSolving: "",
      communication: "",
    });
    setScoreInputErrors({});
    setShowScoreModal(true);
  };

  const handleScoreInputChange = (field, rawValue) => {
    let value = rawValue;
    if (value === "") {
      setScoreInputs((prev) => ({ ...prev, [field]: "" }));
      return;
    }

    if (/^\d*\.?\d*$/.test(value)) {
      const numeric = Math.min(10, Math.max(0, parseFloat(value)));
      setScoreInputs((prev) => ({
        ...prev,
        [field]: Number.isNaN(numeric) ? "" : numeric,
      }));
    }
  };

  const closeScoreModal = () => {
    setShowScoreModal(false);
    setScoreModalStudent(null);
    setScoreInputErrors({});
  };

  const validateScoreInputs = () => {
    const errors = {};
    Object.entries(scoreInputs).forEach(([key, value]) => {
      if (value === "" || isNaN(value)) {
        errors[key] = "Required";
      } else if (value < 0 || value > 10) {
        errors[key] = "Score must be between 0 and 10";
      }
    });
    setScoreInputErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleScoreModalSubmit = (event) => {
    event.preventDefault();
    if (!scoreModalStudent) return;
    if (!validateScoreInputs()) return;

    const breakdown = {
      presentation: Number(scoreInputs.presentation) || 0,
      technical: Number(scoreInputs.technical) || 0,
      problemSolving: Number(scoreInputs.problemSolving) || 0,
      communication: Number(scoreInputs.communication) || 0,
    };
    const totalScore =
      breakdown.presentation +
      breakdown.technical +
      breakdown.problemSolving +
      breakdown.communication;

    setPendingInterviewChange({
      studentId: scoreModalStudent.id,
      studentName: scoreModalStudent.fullName,
      oldScore: scoreModalStudent.interviewScore || 0,
      totalScore: Math.round(totalScore * 10) / 10,
      breakdown,
    });
    closeScoreModal();
    setShowInterviewConfirmation(true);
  };

  // Save interview score
  const saveInterviewScore = async () => {
    if (pendingInterviewChange?.studentId) {
      try {
        setIsSubmitting(true);
        await adminAPI.setInterviewScore(
          pendingInterviewChange.studentId,
          pendingInterviewChange.totalScore
        );

        // Refresh data to get updated scores
        refreshData();
        setScoreModalStudent(null);
        setScoreInputs({
          presentation: "",
          technical: "",
          problemSolving: "",
          communication: "",
        });
        setScoreInputErrors({});
      } catch (err) {
        setError(err.response?.data || "Failed to save interview score");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // Handle student details modal
  const handleViewStudentDetails = (student) => {
    setSelectedStudent(student);
    setShowStudentDetailsModal(true);
  };

  const handleCloseStudentDetailsModal = () => {
    setShowStudentDetailsModal(false);
    setSelectedStudent(null);
  };

  // Calculate stats for dashboard cards using date-filtered students
  const stats = useMemo(
    () => buildDashboardStats(filteredAllStudents, currentAdminRole),
    [filteredAllStudents, currentAdminRole]
  );

  // Authentication is handled by SessionManager component

  useEffect(() => {
    if (showInterviewConfirmation) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [showInterviewConfirmation, showScoreModal]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ef3131] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading students data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">Error</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-2xl font-bold text-[#ef3131]">
                Interviewer Dashboard
              </h1>
              {userInfo.fullName && (
                <p className="text-sm text-gray-600 mt-1">
                  Welcome {userInfo.fullName} ({userInfo.role})
                </p>
              )}
            </div>
            <Button
              variant="outline"
              onClick={() => {
                logoutFromAdmission();
              }}
              className="text-red-600 border-red-600 hover:bg-red-50 bg-transparent"
            >
              <svg
                className="h-4 w-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              Logout
            </Button>
          </div>
        </div>
        <div className="bg-white">
          <div className="max-w-7xl mx-auto px-4 py-2 flex">
            <div className="inline-flex rounded-lg bg-gray-100 p-1">
              {[
                { id: "dashboard", label: "Student Applications" },
                { id: "charts", label: "Dashboard" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-red-500/40 ${activeTab === tab.id
                    ? "bg-white text-[#ef3131] shadow-sm"
                    : "text-gray-600 hover:bg-red-100 hover:text-gray-900"
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {activeTab === "dashboard" && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card className="border border-gray-200 shadow-none bg-white rounded-xl">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <svg
                    className="h-8 w-8 text-[#ef3131]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      Total Students
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.totalStudents}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 shadow-none bg-white rounded-xl">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <svg
                    className="h-8 w-8 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 14l9-5-9-5-9 5 9 5z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
                    />
                  </svg>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      Interviewed
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.interviewed}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="mb-6 border border-gray-200 shadow-none bg-white rounded-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-bold">Filter</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-gray-700 invisible">
                    Search
                  </span>
                  <div className="relative">
                    <svg
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                    <Input
                      placeholder="Search by name, national ID, or email..."
                      value={searchTerm}
                      onChange={(e) => handleSearch(e.target.value)}
                      className={`w-full h-11 pl-10 pr-4 py-0 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm ${searchTerm !== debouncedSearchTerm
                        ? "bg-blue-50 border-blue-300"
                        : ""
                        }`}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-gray-700">
                    Filter by Status:
                  </span>
                  <select
                    value={statusFilter}
                    onChange={(e) => handleStatusFilter(e.target.value)}
                    className="text-sm border border-gray-200 rounded-lg px-3 h-11 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white"
                  >
                    <option value="all">All Students</option>
                    <option value="Accepted">Accepted</option>
                    <option value="Pending">Pending</option>
                    <option value="Rejected">Rejected</option>
                    <option value="Waitlisted">Waitlisted</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-gray-700">
                    Filter by City:
                  </span>
                  <select
                    value={cityFilter}
                    onChange={(e) => handleCityFilter(e.target.value)}
                    className="text-sm border border-gray-200 rounded-lg px-3 h-11 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white"
                  >
                    <option value="all">All Governorates</option>
                    {governorates.map((governorate) => (
                      <option key={governorate} value={governorate}>
                        {governorate}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4 items-end">
                <div className="flex flex-col">
                  <Label className="text-xs text-gray-600">From</Label>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => handleFromDateChange(e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white"
                  />
                </div>
                <div className="flex flex-col">
                  <Label className="text-xs text-gray-600">To</Label>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => handleToDateChange(e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Students Table with AG Grid Community */}
          <div className="w-full">
            <StudentAgGrid
              students={students}
              isLoading={isLoading}
              error={error}
              onRefresh={refreshData}
              handleViewStudentDetails={handleViewStudentDetails}
              getExamTotal={getExamTotal}
              getExamMaximum={getExamMaximum}
              onGiveScore={handleOpenScoreModal}
            />
          </div>

          {/* Pagination */}
          {totalItems > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
              pageSize={pageSize}
              totalItems={totalItems}
              pageSizeOptions={[10, 20, 50]}
              showPageSizeSelector={true}
            />
          )}
        </div>
      )}

      {/* Interview Score Entry Modal */}
      {showScoreModal && scoreModalStudent && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-white via-[#fff5f5] to-white rounded-3xl p-5 md:p-6 max-w-2xl w-full shadow-2xl border border-[#ffd6d6] max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-xs font-semibold text-[#ef3131] uppercase tracking-[0.3em]">
                  Interview Evaluation
                </p>
                <h3 className="text-3xl font-bold text-gray-900 mt-1">
                  {scoreModalStudent.fullName}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  National ID ·{" "}
                  <span className="font-semibold text-gray-700">
                    {scoreModalStudent.nationalId}
                  </span>
                </p>
              </div>
              <button
                onClick={closeScoreModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                type="button"
              >
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  fill="none"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <form onSubmit={handleScoreModalSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {[
                  {
                    key: "presentation",
                    label: "Presentation Skills",
                    description: "Confidence, clarity and professionalism",
                    icon: Presentation,
                    accent: "from-red-50/80 to-red-100/80",
                  },
                  {
                    key: "technical",
                    label: "Technical / Software Skills",
                    description: "Coding logic, tool familiarity",
                    icon: Cpu,
                    accent: "from-blue-50/80 to-blue-100/80",
                  },
                  {
                    key: "problemSolving",
                    label: "Problem-Solving & Logical Thinking",
                    description: "Analytical depth, creativity",
                    icon: Puzzle,
                    accent: "from-emerald-50/80 to-emerald-100/80",
                  },
                  {
                    key: "communication",
                    label: "Communication & Teamwork",
                    description: "Listening, collaboration, empathy",
                    icon: Users,
                    accent: "from-amber-50/80 to-amber-100/80",
                  },
                ].map((field) => {
                  const Icon = field.icon;
                  return (
                    <label
                      key={field.key}
                      htmlFor={`score-${field.key}`}
                      className={`block rounded-2xl p-5 bg-gradient-to-br ${field.accent} border border-white/80 shadow-sm hover:shadow-lg transition-all cursor-pointer`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-white text-[#ef3131] flex items-center justify-center shadow">
                          <Icon className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                          <p className="text-base font-semibold text-gray-900">
                            {field.label}
                          </p>
                          <p className="text-xs text-gray-600 mt-1 h-8">
                            {field.description}
                          </p>
                          <Input
                            id={`score-${field.key}`}
                            type="text"
                            min="0"
                            max="10"
                            step="0.5"
                            value={scoreInputs[field.key]}
                            onChange={(e) =>
                              handleScoreInputChange(field.key, e.target.value)
                            }
                            className={`h-12 text-lg font-semibold bg-white/90 border-2 ${scoreInputErrors[field.key]
                              ? "border-red-400"
                              : "border-transparent"
                              } mt-3 focus:ring-2 focus:ring-[#ef3131]/30`}
                          />
                          {scoreInputErrors[field.key] && (
                            <p className="text-xs text-red-600 mt-2">
                              {scoreInputErrors[field.key]}
                            </p>
                          )}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>

              <div className="mt-6 bg-white/80 border border-[#ffd6d6] rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-[#ef3131]/10 flex items-center justify-center text-[#ef3131]">
                    <Award className="h-7 w-7" strokeWidth={1.8} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Interview Score</p>
                    <p className="text-4xl font-black text-[#ef3131] tracking-tight">
                      {scoreTotalPreview}/40
                    </p>
                  </div>
                </div>
                <div className="text-sm text-gray-500 max-w-md">
                  Please review each criterion carefully. You will confirm this
                  breakdown before saving the score.
                </div>
              </div>

              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeScoreModal}
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-[#ef3131] hover:bg-red-600"
                  disabled={isSubmitting}
                >
                  Review & Submit
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Interview Score Confirmation Modal */}
      {showInterviewConfirmation && pendingInterviewChange && (
        <div className="fixed inset-0 backdrop-blur-sm bg-opacity-10 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                Confirm Interview Score
              </h3>
            </div>
            <div className="mb-6">
              <p className="text-gray-600 mb-4">
                Are you sure you want to set the interview score for{" "}
                <span className="font-semibold text-gray-900">
                  {pendingInterviewChange.studentName}
                </span>{" "}
                to the following?
              </p>
              <div className="bg-gray-50 rounded-lg p-3 text-sm">
                <p className="font-medium text-gray-700 mb-1">
                  Interview Score Details:
                </p>
                <p className="text-gray-600">
                  Student: {pendingInterviewChange.studentName}
                </p>
                <p className="text-gray-600">
                  Current Score: {pendingInterviewChange.oldScore}/40
                </p>
                <div className="mt-2 space-y-1 text-gray-700">
                  <div>
                    Presentation:{" "}
                    {pendingInterviewChange.breakdown.presentation}/10
                  </div>
                  <div>
                    Technical/Software:{" "}
                    {pendingInterviewChange.breakdown.technical}/10
                  </div>
                  <div>
                    Problem-Solving:{" "}
                    {pendingInterviewChange.breakdown.problemSolving}/10
                  </div>
                  <div>
                    Communication:{" "}
                    {pendingInterviewChange.breakdown.communication}/10
                  </div>
                  <div className="border-t border-dashed border-gray-300 pt-2 font-semibold text-blue-600">
                    Total Score: {pendingInterviewChange.totalScore}/40
                  </div>
                </div>
              </div>
            </div>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowInterviewConfirmation(false);
                  setPendingInterviewChange(null);
                }}
                className="flex-1"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  saveInterviewScore();
                  setShowInterviewConfirmation(false);
                  setPendingInterviewChange(null);
                }}
                className="flex-1 bg-[#ef3131] hover:bg-red-600"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving..." : "Confirm Score"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Student Details Modal */}
      <StudentDetailsModal
        student={selectedStudent}
        isOpen={showStudentDetailsModal}
        onClose={handleCloseStudentDetailsModal}
      />


      {
        activeTab === "charts" && (
          <div className="py-8">
            <div className="max-w-7xl mx-auto px-4 space-y-6">
              <Card className="border-0 shadow-lg">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-bold">Filter</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-end">
                    <div className="flex flex-col">
                      <Label className="text-xs text-gray-600">From</Label>
                      <input
                        type="date"
                        value={fromDate}
                        onChange={(e) => handleFromDateChange(e.target.value)}
                        className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white"
                      />
                    </div>
                    <div className="flex flex-col">
                      <Label className="text-xs text-gray-600">To</Label>
                      <input
                        type="date"
                        value={toDate}
                        onChange={(e) => handleToDateChange(e.target.value)}
                        className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle>Average Prep Scores</CardTitle>
                    <p className="text-sm text-gray-500">
                      Ministry exam and prep score averages
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-semibold text-blue-700">
                              Ministry Exam
                            </p>
                            <p className="text-2xl font-bold text-blue-900">
                              {averages.ministryExamAverage.toFixed(2)}
                            </p>
                          </div>
                          <div className="h-10 w-10 rounded-full bg-white text-blue-600 flex items-center justify-center shadow-sm">
                            <svg
                              className="h-5 w-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12h6m-6 4h6m-2 4H7a2 2 0 01-2-2V6a2 2 0 012-2h5l5 5v9a2 2 0 01-2 2z"
                              />
                            </svg>
                          </div>
                        </div>
                      </div>
                      <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-semibold text-emerald-700">
                              Final Year
                            </p>
                            <p className="text-2xl font-bold text-emerald-900">
                              {averages.finalYearAverage.toFixed(2)}
                            </p>
                          </div>
                          <div className="h-10 w-10 rounded-full bg-white text-emerald-600 flex items-center justify-center shadow-sm">
                            <svg
                              className="h-5 w-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 14l9-5-9-5-9 5 9 5z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
                              />
                            </svg>
                          </div>
                        </div>
                      </div>
                      <div className="rounded-lg border border-amber-100 bg-amber-50 p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-semibold text-amber-700">
                              Math Prep
                            </p>
                            <p className="text-2xl font-bold text-amber-900">
                              {averages.mathPrepAverage.toFixed(2)}
                            </p>
                          </div>
                          <div className="h-10 w-10 rounded-full bg-white text-amber-600 flex items-center justify-center shadow-sm">
                            <svg
                              className="h-5 w-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 2h6a2 2 0 012 2v16a2 2 0 01-2 2H9a2 2 0 01-2-2V4a2 2 0 012-2z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 7h6M9 11h2m4 0h2M9 15h2m4 0h2"
                              />
                            </svg>
                          </div>
                        </div>
                      </div>
                      <div className="rounded-lg border border-indigo-100 bg-indigo-50 p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-semibold text-indigo-700">
                              English Prep
                            </p>
                            <p className="text-2xl font-bold text-indigo-900">
                              {averages.englishPrepAverage.toFixed(2)}
                            </p>
                          </div>
                          <div className="h-10 w-10 rounded-full bg-white text-indigo-600 flex items-center justify-center shadow-sm">
                            <svg
                              className="h-5 w-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 3c4.418 0 8 4.03 8 9s-3.582 9-8 9-8-4.03-8-9 3.582-9 8-9z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M2 12h20"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 3c-2.667 0-5 4.03-5 9s2.333 9 5 9 5-4.03 5-9-2.333-9-5-9z"
                              />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle>Average Exam Scores</CardTitle>
                    <p className="text-sm text-gray-500">
                      Section averages from the admission exam
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="rounded-lg border border-rose-100 bg-rose-50 p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-semibold text-rose-700">
                              Software
                            </p>
                            <p className="text-2xl font-bold text-rose-900">
                              {averages.examSoftwareAverage.toFixed(2)}%
                            </p>
                          </div>
                          <div className="h-10 w-10 rounded-full bg-white text-rose-600 flex items-center justify-center shadow-sm">
                            <svg
                              className="h-5 w-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 7h10v10H7z"
                              />
                            </svg>
                          </div>
                        </div>
                      </div>
                      <div className="rounded-lg border border-sky-100 bg-sky-50 p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-semibold text-sky-700">English</p>
                            <p className="text-2xl font-bold text-sky-900">
                              {averages.examEnglishAverage.toFixed(2)}%
                            </p>
                          </div>
                          <div className="h-10 w-10 rounded-full bg-white text-sky-600 flex items-center justify-center shadow-sm">
                            <svg
                              className="h-5 w-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 6a2 2 0 012-2h5v16h-5a2 2 0 00-2 2V6z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 6a2 2 0 00-2-2H5v16h5a2 2 0 012 2V6z"
                              />
                            </svg>
                          </div>
                        </div>
                      </div>
                      <div className="rounded-lg border border-teal-100 bg-teal-50 p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-semibold text-teal-700">Arabic</p>
                            <p className="text-2xl font-bold text-teal-900">
                              {averages.examArabicAverage.toFixed(2)}%
                            </p>
                          </div>
                          <div className="h-10 w-10 rounded-full bg-white text-teal-600 flex items-center justify-center shadow-sm">
                            <svg
                              className="h-5 w-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15.232 5.232l3.536 3.536M4 20h4.5L19.293 9.207a1 1 0 000-1.414l-3.086-3.086a1 1 0 00-1.414 0L4 15.5V20z"
                              />
                            </svg>
                          </div>
                        </div>
                      </div>
                      <div className="rounded-lg border border-orange-100 bg-orange-50 p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-semibold text-orange-700">Math</p>
                            <p className="text-2xl font-bold text-orange-900">
                              {averages.examMathAverage.toFixed(2)}%
                            </p>
                          </div>
                          <div className="h-10 w-10 rounded-full bg-white text-orange-600 flex items-center justify-center shadow-sm">
                            <svg
                              className="h-5 w-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M7 7h10v10H7z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M10 10h4v4h-4z"
                              />
                            </svg>
                          </div>
                        </div>
                      </div>
                      <div className="rounded-lg border border-indigo-100 bg-indigo-50 p-4">
                        <p className="text-xs font-semibold text-indigo-700">IQ</p>
                        <p className="text-2xl font-bold text-indigo-900">
                          {averages.examIqAverage.toFixed(2)}%
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle>Accepted vs Rejected Students</CardTitle>
                    <p className="text-sm text-gray-500">
                      Distribution of application outcomes
                    </p>
                  </CardHeader>
                  <CardContent className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={analyticsData.acceptanceData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={4}
                        >
                          {analyticsData.acceptanceData.map((entry, index) => (
                            <Cell
                              key={`acceptance-${entry.name}`}
                              fill={chartColors[index % chartColors.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle>Average Interview Scores</CardTitle>
                    <p className="text-sm text-gray-500">
                      Top interviewers by average scoring
                    </p>
                  </CardHeader>
                  <CardContent className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analyticsData.interviewerData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill="#ef3131" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="border-0 shadow-lg lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Applicants per School Type</CardTitle>
                    <p className="text-sm text-gray-500">
                      Top feeder schools submitting applications
                    </p>
                  </CardHeader>
                  <CardContent className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analyticsData.schoolData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" allowDecimals={false} />
                        <YAxis dataKey="name" type="category" width={140} />
                        <Tooltip />
                        <Bar dataKey="value" fill="#0ea5e9" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle>Laptop Ownership</CardTitle>
                    <p className="text-sm text-gray-500">Applicants has laptop or not</p>
                  </CardHeader>
                  <CardContent className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={analyticsData.laptopData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={60}
                          label
                        >
                          {analyticsData.laptopData.map((entry, index) => (
                            <Cell
                              key={`laptop-${entry.name}`}
                              fill={chartColors[index % chartColors.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>Daily Applications</CardTitle>
                  <p className="text-sm text-gray-500">Rolling trend of submissions</p>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analyticsData.dailyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#7c3aed"
                        strokeWidth={3}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
    </div>
  );
};

export default AdminDashboardPage;
