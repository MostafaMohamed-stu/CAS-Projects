import { logoutFromAdmission } from "../utils/casAuth";
"use client";

import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import Label from "../components/ui/Label";
import Badge from "../components/ui/Badge";
import Checkbox from "../components/ui/Checkbox";
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
import { usePagination } from "../hooks/usePagination";
import Pagination from "../components/ui/Pagination";
import StudentAgGrid from "../components/StudentAgGrid";
import AdmissionSettingsPanel from "../components/AdmissionSettingsPanel";
import { ArrowLeft, Settings } from "lucide-react";
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

const SuperAdminDashboardPage = () => {
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

  const [showStatusConfirmation, setShowStatusConfirmation] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("Pending");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportColumns, setExportColumns] = useState([]);
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [exportFromDate, setExportFromDate] = useState("");
  const [exportToDate, setExportToDate] = useState("");
  const [exportStudentCount, setExportStudentCount] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [isLoadingColumns, setIsLoadingColumns] = useState(false);
  const [activeTab, setActiveTab] = useState("charts");
  const [userInfo, setUserInfo] = useState({ fullName: "", role: "" });
  const governorates = [
    "Ø§Ù„Ù‚Ø§Ù‡Ø±Ø©",
    "Ø§Ù„Ø¥Ø³ÙƒÙ†Ø¯Ø±ÙŠØ©",
    "Ø§Ù„Ø¬ÙŠØ²Ø©",
    "Ø§Ù„Ø´Ø±Ù‚ÙŠØ©",
    "Ø§Ù„ØºØ±Ø¨ÙŠØ©",
    "Ø§Ù„Ù…Ù†ÙˆÙÙŠØ©",
    "Ø§Ù„Ù‚Ù„ÙŠÙˆØ¨ÙŠØ©",
    "Ø§Ù„Ø¨Ø­ÙŠØ±Ø©",
    "ÙƒÙØ± Ø§Ù„Ø´ÙŠØ®",
    "Ø¯Ù…ÙŠØ§Ø·",
    "Ø§Ù„Ø¯Ù‚Ù‡Ù„ÙŠØ©",
    "Ø§Ù„Ù…Ù†ÙŠØ§",
    "Ø£Ø³ÙŠÙˆØ·",
    "Ø³ÙˆÙ‡Ø§Ø¬",
    "Ù‚Ù†Ø§",
    "Ø§Ù„Ø£Ù‚ØµØ±",
    "Ø£Ø³ÙˆØ§Ù†",
    "Ø¨Ù†ÙŠ Ø³ÙˆÙŠÙ",
    "Ø§Ù„ÙÙŠÙˆÙ…",
    "Ø§Ù„ÙˆØ§Ø¯ÙŠ Ø§Ù„Ø¬Ø¯ÙŠØ¯",
    "Ù…Ø·Ø±ÙˆØ­",
    "Ø´Ù…Ø§Ù„ Ø³ÙŠÙ†Ø§Ø¡",
    "Ø¬Ù†ÙˆØ¨ Ø³ÙŠÙ†Ø§Ø¡",
    "Ø§Ù„Ø¨Ø­Ø± Ø§Ù„Ø£Ø­Ù…Ø±",
    "Ø¨ÙˆØ±Ø³Ø¹ÙŠØ¯",
    "Ø§Ù„Ø¥Ø³Ù…Ø§Ø¹ÙŠÙ„ÙŠØ©",
    "Ø§Ù„Ø³ÙˆÙŠØ³",
  ];

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

  useEffect(() => {
    if (!successMessage) return;

    const timeoutId = window.setTimeout(() => setSuccessMessage(null), 3000);
    return () => window.clearTimeout(timeoutId);
  }, [successMessage]);

  // Authentication is handled by SessionManager component

  useEffect(() => {
    if (showStatusConfirmation || showExportModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [showStatusConfirmation, showExportModal]);

  const getInterviewScore = (student, interviewerIndex) => {
    const interviewScores = student.interviewScores || [];
    if (interviewScores.length > interviewerIndex) {
      return interviewScores[interviewerIndex];
    }
    return null;
  };

  const chartColors = [
    "#ef3131",
    "#0ea5e9",
    "#22c55e",
    "#f97316",
    "#7c3aed",
    "#14b8a6",
  ];

  const fetchExportColumns = async () => {
    try {
      setIsLoadingColumns(true);
      setError("");
      const response = await adminAPI.getExportColumns();
      const columns = response.data || [];
      setExportColumns(columns);
      setSelectedColumns(
        columns
          .filter((column) => column.defaultSelected !== false)
          .map((column) => column.key)
      );
    } catch (err) {
      setError(
        err.response?.data || "Failed to load export options. Please try again."
      );
      throw err;
    } finally {
      setIsLoadingColumns(false);
    }
  };

  const handleExportButtonClick = async () => {
    try {
      if (!exportColumns.length) {
        await fetchExportColumns();
      }
      setShowExportModal(true);
    } catch {
      // error already handled
    }
  };

  const handleToggleColumn = (key) => {
    setSelectedColumns((prev) =>
      prev.includes(key)
        ? prev.filter((columnKey) => columnKey !== key)
        : [...prev, key]
    );
  };

  const handleSelectAllColumns = () => {
    setSelectedColumns(exportColumns.map((column) => column.key));
  };

  const handleClearColumns = () => {
    setSelectedColumns([]);
  };

  const handleExportToExcel = async (columnsToInclude = selectedColumns) => {
    try {
      setError("");
      const response = await adminAPI.exportStudentsToExcel(columnsToInclude, {
        fromDate: exportFromDate || null,
        toDate: exportToDate || null,
        studentCount: exportStudentCount ? Number(exportStudentCount) : null,
      });

      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      const contentDisposition = response.headers["content-disposition"];
      let filename = "Students_Export.xlsx";
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setSuccessMessage("Excel file downloaded successfully!");
    } catch (err) {
      setError(err.response?.data || "Failed to export Excel file. Please try again.");
      throw err;
    }
  };

  const handleConfirmExport = async () => {
    if (!selectedColumns.length) {
      setError("Please select at least one column to export.");
      return;
    }

    try {
      setIsExporting(true);
      await handleExportToExcel(selectedColumns);
      setShowExportModal(false);
    } catch {
      // errors handled above
    } finally {
      setIsExporting(false);
    }
  };



  // Update student status function
  const updateStudentStatus = async (studentId, status) => {
    try {
      setIsSubmitting(true);
      setError(null);
      setSuccessMessage(null);

      await adminAPI.updateStudentStatus(studentId, status);

      // Refresh data to get updated status
      refreshData();

      // Set success message
      setSuccessMessage(`Student status updated successfully to ${status}`);

    } catch (err) {
      setError(err.response?.data || "Failed to update student status");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate stats for dashboard cards using date-filtered students
  const stats = useMemo(
    () => buildDashboardStats(filteredAllStudents, currentAdminRole),
    [filteredAllStudents, currentAdminRole]
  );

  const analyticsData = useMemo(
    () => buildDashboardAnalytics(filteredAllStudents),
    [filteredAllStudents]
  );

  const averages = useMemo(
    () => buildDashboardAverages(filteredAllStudents),
    [filteredAllStudents]
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading students data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">Error</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Success Message */}
      {successMessage && (
        <div className="fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded z-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg
                className="w-5 h-5 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              {successMessage}
            </div>
            <button
              onClick={() => setSuccessMessage(null)}
              className="ml-4 text-green-700 hover:text-green-900"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg
                className="w-5 h-5 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              {error}
            </div>
            <button
              onClick={() => setError("")}
              className="ml-4 text-red-700 hover:text-red-900"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#ef3131]">
                Super Admin Dashboard
              </h1>
              {userInfo.fullName && (
                <p className="text-sm text-gray-600 mt-1">
                  Welcome {userInfo.fullName} ({userInfo.role})
                </p>
              )}
            </div>
            <div className="flex flex-wrap justify-end gap-3">
              {activeTab === "settings" ? (
                <Button
                  variant="outline"
                  onClick={() => setActiveTab("charts")}
                  className="border-gray-400 text-gray-800 hover:bg-gray-100"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Dashboard
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={handleExportButtonClick}
                    className="border-green-500 text-green-600 hover:bg-green-50"
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
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Export as Excel
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate("/admin/excel-upload")}
                    className="border-blue-500 text-blue-600 hover:bg-blue-50"
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
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                  />
                </svg>
                Upload Questions
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setActiveTab("settings")}
                    className="border-gray-500 text-gray-800 hover:bg-gray-100"
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Button>
                </>
              )}
              <Button
                variant="outline"
                onClick={() => {
                  logoutFromAdmission();
                }}
                className="border-red-500 text-red-500 hover:bg-red-50"
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
        </div>

        {activeTab !== "settings" && (
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
        )}
      </div>

      {activeTab === "dashboard" && (
        <div className="py-8">
          <div className="max-w-7xl mx-auto px-4">
            {/* Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mr-4">
                      <svg
                        className="w-6 h-6 text-red-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                        />
                      </svg>
                    </div>
                    <div>
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

              <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                      <svg
                        className="w-6 h-6 text-green-600"
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
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Accepted
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {stats.accepted}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
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
                    <div>
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

              <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mr-4">
                      <svg
                        className="w-6 h-6 text-yellow-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Pending</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {stats.pending}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Search Bar */}
            <Card className="border-0 shadow-lg mb-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-bold">Filter</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
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
                      <input
                        type="text"
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

            {/* Students Table */}
            <Card className="border-0 shadow-lg overflow-hidden">
              <CardHeader>
                <CardTitle className="text-xl font-bold">
                  Student Applications ({students.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <StudentAgGrid
                  students={students}
                  getExamTotal={getExamTotal}
                  getExamMaximum={getExamMaximum}
                  getExamPercentage={getExamPercentage}
                  hasIqExamScore={hasIqExamScore}
                  canEditStatus={true}
                />
              </CardContent>
            </Card>

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
        </div>
      )}

      {activeTab === "charts" && (
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

      {activeTab === "settings" && (
        <AdmissionSettingsPanel onSaved={refreshData} />
      )}

      {/* Status Change Confirmation Modal */}
      {showStatusConfirmation && (
        <div className="fixed inset-0 backdrop-blur-sm bg-opacity-10 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                <svg
                  className="w-6 h-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                Change Status?
              </h3>
            </div>
            <div className="mb-4">
              <Label
                htmlFor="status-select"
                className="block mb-2 text-sm font-medium text-gray-700"
              >
                Select New Status for {pendingStatusChange?.studentName}:
              </Label>
              <select
                id="status-select"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                disabled={isSubmitting}
              >
                <option value="Pending">Pending</option>
                <option value="Accepted">Accepted</option>
                <option value="Rejected">Rejected</option>
                <option value="Waitlisted">Waitlisted</option>
              </select>
            </div>
            <p className="text-gray-600 mb-6">
              Current status: <strong>{pendingStatusChange?.oldStatus}</strong>
              <br />
              New status: <strong>{selectedStatus}</strong>
            </p>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowStatusConfirmation(false);
                  setPendingStatusChange(null);
                  setSelectedStatus("Pending");
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (pendingStatusChange) {
                    updateStudentStatus(
                      pendingStatusChange.studentId,
                      selectedStatus
                    );
                    setShowStatusConfirmation(false);
                    setPendingStatusChange(null);
                    setSelectedStatus("Pending");
                  }
                }}
                className="flex-1 bg-red-600 hover:bg-red-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Updating..." : "Confirm Change"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {showExportModal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-3xl w-full shadow-2xl">
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-sm uppercase text-gray-500 tracking-wide">
                  Export Options
                </p>
                <h3 className="text-2xl font-bold text-gray-900">
                  Customize Excel Columns
                </h3>
                <p className="text-sm text-gray-500">
                  Choose which columns to include before downloading the Excel file.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                className="text-gray-400 hover:text-gray-600"
                disabled={isExporting}
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" stroke="currentColor" fill="none">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {isLoadingColumns ? (
              <div className="py-16 text-center text-gray-500">
                Loading available columns...
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div className="text-sm text-gray-600">
                    {selectedColumns.length} of {exportColumns.length} columns selected
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleClearColumns}
                      disabled={!selectedColumns.length || isExporting}
                    >
                      Clear All
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleSelectAllColumns}
                      disabled={
                        selectedColumns.length === exportColumns.length || isExporting
                      }
                    >
                      Select All
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  <label className="text-sm font-medium text-gray-700">
                    From date
                    <input
                      type="date"
                      value={exportFromDate}
                      onChange={(event) => setExportFromDate(event.target.value)}
                      disabled={isExporting}
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
                    />
                  </label>
                  <label className="text-sm font-medium text-gray-700">
                    To date
                    <input
                      type="date"
                      value={exportToDate}
                      onChange={(event) => setExportToDate(event.target.value)}
                      disabled={isExporting}
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
                    />
                  </label>
                </div>

                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Number of students
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={exportStudentCount}
                    onChange={(event) => setExportStudentCount(event.target.value)}
                    placeholder="All students"
                    disabled={isExporting}
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2"
                  />
                </label>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[360px] overflow-y-auto pr-1">
                  {exportColumns.map((column) => (
                    <label
                      key={column.key}
                      className="flex items-start gap-3 border border-gray-200 rounded-xl p-4 hover:border-[#ef3131]/60 transition-colors cursor-pointer"
                      htmlFor={`column-${column.key}`}
                    >
                      <Checkbox
                        id={`column-${column.key}`}
                        checked={selectedColumns.includes(column.key)}
                        onCheckedChange={() => handleToggleColumn(column.key)}
                        disabled={isExporting}
                      />
                      <div>
                        <p className="font-semibold text-gray-900">{column.label}</p>
                        {column.description && (
                          <p className="text-sm text-gray-500">{column.description}</p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-3 mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowExportModal(false)}
                    disabled={isExporting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={handleConfirmExport}
                    disabled={isExporting}
                  >
                    {isExporting ? "Preparing File..." : "Export Excel"}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminDashboardPage;
