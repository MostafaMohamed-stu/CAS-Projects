import { useState, useEffect, useCallback, useMemo } from "react";
import { adminAPI } from "../utils/api";
import {
  getExamAdmissionContribution,
  getExamTotal,
} from "../utils/examScoring";

const formatDateOnly = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getStudentDateKey = (student) => {
  const dateValue =
    student.CreatedAt ||
    student.createdAt ||
    student.Created_At ||
    student.created_At ||
    student.createdDate ||
    student.createdOn ||
    student.appliedAt ||
    student.AppliedAt;

  if (!dateValue) return null;
  const dateObj = new Date(dateValue);
  if (Number.isNaN(dateObj.getTime())) return null;
  return formatDateOnly(dateObj);
};

const getStudentCity = (student) =>
  (
    student.city ||
    student.City ||
    student.governorate ||
    student.Governorate ||
    ""
  )
    .toString()
    .trim();

export const usePagination = () => {
  const [allStudents, setAllStudents] = useState([]); // all students loaded once
  const [students, setStudents] = useState([]); // filtered and paginated students
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [currentAdminRole, setCurrentAdminRole] = useState("");
  const [fromDate, setFromDate] = useState("2025-01-06");
  const [toDate, setToDate] = useState(() => formatDateOnly(new Date()));

  // Fetch all students once on mount
  const fetchAllStudents = useCallback(async () => {
    // Don't fetch if not authenticated
    const token = localStorage.getItem("adminToken");
    if (!token) return;

    setIsLoading(true);
    setError("");
    try {
      const response = await adminAPI.getStudentsPaginated({
        pageNumber: 1,
        pageSize: 10000, // large number to get all
        searchTerm: "",
        statusFilter: "all",
        sortBy: "name",
        sortOrder: "asc",
      });
      const { data } = response.data;
      setAllStudents(data || []);
      setError("");
      if (data && data.length > 0) {
        const firstStudent = data[0];
        if (
          Object.prototype.hasOwnProperty.call(firstStudent, "interviewScore") ||
          Object.prototype.hasOwnProperty.call(firstStudent, "InterviewScore")
        ) {
          setCurrentAdminRole("Interviewer");
        } else {
          setCurrentAdminRole("Board");
        }
      }
    } catch (err) {
      setAllStudents([]);
      const errMsg = err.response?.data?.message || err.response?.data || err.message || "Failed to fetch students";
      setError(typeof errMsg === "string" ? errMsg : "Failed to fetch students");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle page change
  const handlePageChange = useCallback((newPage) => {
    setCurrentPage(newPage);
  }, []);

  // Handle page size change
  const handlePageSizeChange = useCallback((newPageSize) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page when changing page size
  }, []);

  const handleFromDateChange = useCallback((newFromDate) => {
    setFromDate(newFromDate);
    setCurrentPage(1);
  }, []);

  const handleToDateChange = useCallback((newToDate) => {
    setToDate(newToDate);
    setCurrentPage(1);
  }, []);

  // Handle search (immediate UI update, instant filter)
  const handleSearch = useCallback((newSearchTerm) => {
    setSearchTerm(newSearchTerm);
    setCurrentPage(1); // Reset to first page when searching
  }, []);

  // Handle status filter
  const handleStatusFilter = useCallback((newStatusFilter) => {
    setStatusFilter(newStatusFilter);
    setCurrentPage(1); // Reset to first page when filtering
  }, []);

  const handleCityFilter = useCallback((newCityFilter) => {
    setCityFilter(newCityFilter);
    setCurrentPage(1); // Reset to first page when filtering
  }, []);

  // Handle sorting
  const handleSort = useCallback(
    (newSortBy) => {
      if (newSortBy === sortBy) {
        setSortOrder(sortOrder === "asc" ? "desc" : "asc");
      } else {
        setSortBy(newSortBy);
        setSortOrder("asc");
      }
      setCurrentPage(1);
    },
    [sortBy, sortOrder]
  );

  // Refresh data (re-fetch all students)
  const refreshData = useCallback(() => {
    fetchAllStudents();
  }, [fetchAllStudents]);

  // Fetch all students on mount
  useEffect(() => {
    fetchAllStudents();
  }, [fetchAllStudents]);

  const filteredAllStudents = useMemo(() => {
    if (!fromDate && !toDate) return allStudents;

    const startDate = fromDate || "0000-01-01";
    const endDate = toDate || "9999-12-31";

    return allStudents.filter((student) => {
      const dateKey = getStudentDateKey(student);
      if (!dateKey) return false;
      return dateKey >= startDate && dateKey <= endDate;
    });
  }, [allStudents, fromDate, toDate]);

  // Memoized filtered and paginated students
  const filteredStudents = useMemo(() => {
    let filtered = filteredAllStudents;
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          (s.fullName && s.fullName.toLowerCase().includes(lower)) ||
          (s.nationalId && s.nationalId.toLowerCase().includes(lower)) ||
          (s.email && s.email.toLowerCase().includes(lower))
      );
    }
    if (statusFilter !== "all") {
      filtered = filtered.filter((s) => {
        // Handle different status formats
        const studentStatus = s.Status || s.status;
        
        // Convert status numbers to text for comparison
        const getStatusText = (status) => {
          switch (status) {
            case 1:
            case "1":
              return "Pending";
            case 2:
            case "2":
              return "Accepted";
            case 3:
            case "3":
              return "Rejected";
            case 4:
            case "4":
              return "Waitlisted";
            default:
              return "Pending";
          }
        };
        
        const statusText = getStatusText(studentStatus);
        return statusText === statusFilter;
      });
    }
    if (cityFilter !== "all") {
      const targetCity = cityFilter.toLowerCase();
      filtered = filtered.filter((s) =>
        getStudentCity(s).toLowerCase() === targetCity
      );
    }
    // Sorting
    filtered = [...filtered].sort((a, b) => {
      let aVal, bVal;
      
      switch (sortBy) {
        case "name":
          aVal = a.fullName || "";
          bVal = b.fullName || "";
          break;
        case "finalYearScore":
          aVal = parseFloat(a.finalYearScore) || 0;
          bVal = parseFloat(b.finalYearScore) || 0;
          break;
        case "totalScore": {
          // Sort by exam total (for Super Admin dashboard)
          const aExamTotal = getExamTotal(a);
          const bExamTotal = getExamTotal(b);
          aVal = Number(aExamTotal);
          bVal = Number(bExamTotal);
          break;
        }
        case "percentage": {
          // Calculate the same way as the Percentage column displays
          const aExamContribution = getExamAdmissionContribution(a);
          const bExamContribution = getExamAdmissionContribution(b);
          const aInterviewTotal = a.interviewScore || 0;
          const bInterviewTotal = b.interviewScore || 0;
          
          // Prefer the normalized backend percentage when it is available.
          if (a.totalPercentage !== undefined && b.totalPercentage !== undefined) {
            // Super admin - use totalPercentage from backend
            aVal = Number(a.totalPercentage || 0);
            bVal = Number(b.totalPercentage || 0);
          } else {
            // Regular admin: 60-point exam contribution plus interview score.
            aVal = Number(aExamContribution + aInterviewTotal);
            bVal = Number(bExamContribution + bInterviewTotal);
          }
          break;
        }
        case "interviewScore":
          aVal = parseFloat(a.interviewScore) || 0;
          bVal = parseFloat(b.interviewScore) || 0;
          break;
        default:
          aVal = a[sortBy] || "";
          bVal = b[sortBy] || "";
      }
      
      // Handle string values (like names)
      if (typeof aVal === "string") aVal = aVal.toLowerCase();
      if (typeof bVal === "string") bVal = bVal.toLowerCase();
      
      // Handle number values (like percentages, scores)
      if (typeof aVal === "number" && typeof bVal === "number") {
        if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
        if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
        return 0;
      }
      
      // Handle string comparison
      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
    // Pagination
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return filtered.slice(start, end);
  }, [filteredAllStudents, searchTerm, statusFilter, cityFilter, sortBy, sortOrder, currentPage, pageSize]);

  // Update students and total counts when filteredStudents changes
  useEffect(() => {
    setStudents(filteredStudents);
    // Update totalItems and totalPages for pagination
    let filtered = filteredAllStudents;
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          (s.fullName && s.fullName.toLowerCase().includes(lower)) ||
          (s.nationalId && s.nationalId.toLowerCase().includes(lower)) ||
          (s.email && s.email.toLowerCase().includes(lower))
      );
    }
    if (statusFilter !== "all") {
      filtered = filtered.filter((s) => {
        // Handle different status formats
        const studentStatus = s.Status || s.status;
        
        // Convert status numbers to text for comparison
        const getStatusText = (status) => {
          switch (status) {
            case 1:
            case "1":
              return "Pending";
            case 2:
            case "2":
              return "Accepted";
            case 3:
            case "3":
              return "Rejected";
            case 4:
            case "4":
              return "Waitlisted";
            default:
              return "Pending";
          }
        };
        
        const statusText = getStatusText(studentStatus);
        return statusText === statusFilter;
      });
    }
    if (cityFilter !== "all") {
      const targetCity = cityFilter.toLowerCase();
      filtered = filtered.filter((s) =>
        getStudentCity(s).toLowerCase() === targetCity
      );
    }
    setTotalItems(filtered.length);
    setTotalPages(Math.ceil(filtered.length / pageSize));
  }, [filteredStudents, filteredAllStudents, searchTerm, statusFilter, cityFilter, pageSize]);

  return {
    students,
    allStudents,
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
  };
};
