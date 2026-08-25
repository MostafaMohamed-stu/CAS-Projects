import React, { useState, useEffect, useMemo } from 'react';
import { axiosInstance } from '../../utils/authService';
import { showError } from '../../utils/toast';
import { getUserRole } from '../../utils/roleUtils';
import { 
  Users, 
  UserCheck, 
  ClipboardList, 
  TrendingUp, 
  Building2, 
  GraduationCap,
  Eye,
  ArrowRight,
  Loader2,
  Search,
  X
} from 'lucide-react';
import { Doughnut, Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
} from 'chart.js';
import TeamProjectModal from './TeamProjectModal';

// Register Chart.js components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

const BoardDashboard = ({ user, setCurrentPage }) => {
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState(null);
  const [engineersByClass, setEngineersByClass] = useState([]);
  const [teamsProgress, setTeamsProgress] = useState([]);
  const [userName, setUserName] = useState('Board Member');
  const [teamsCompletedAllTasks, setTeamsCompletedAllTasks] = useState([]);
  const [teamsByGrade, setTeamsByGrade] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [showTeamModal, setShowTeamModal] = useState(false);
  // All grades and classes for filter dropdowns
  const [allGrades, setAllGrades] = useState([]);
  const [allClasses, setAllClasses] = useState([]);
  // Global filters for all dashboard data
  const [globalGradeFilter, setGlobalGradeFilter] = useState('');
  const [globalClassFilter, setGlobalClassFilter] = useState('');
  // Filters for Teams Progress (search only)
  const [teamSearchQuery, setTeamSearchQuery] = useState('');
  // Local filters for Teams Progress section (only when global filters are "All")
  const [localTeamGradeFilter, setLocalTeamGradeFilter] = useState('');
  const [localTeamClassFilter, setLocalTeamClassFilter] = useState('');

  useEffect(() => {
    fetchDashboardData();
    fetchUserName();
  }, []);

  const fetchUserName = async () => {
    // If we have user data from props, use it directly
    if (user && user.fullNameEn) {
      setUserName(user.fullNameEn.trim());
      return;
    }

    // Fallback to API call if no user data provided
    if (!user?.id) {
      setUserName('Board Member');
      return;
    }

    try {
      const response = await axiosInstance.get(`/Account/${user.id}`);
      const data = response.data || {};
      const name = (data?.fullNameEn || data?.FullNameEn || data?.fullNameEN)?.trim();
      setUserName(name || 'Board Member');
    } catch (err) {
      console.error('Error fetching user name:', err);
      setUserName('Board Member');
    }
  };

  // Helper function to extract array from .NET API response
  const extractArray = (data) => {
    if (Array.isArray(data)) {
      return data;
    }
    if (data?.$values && Array.isArray(data.$values)) {
      return data.$values;
    }
    return [];
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, engineersRes, teamsRes, teamsCompletedRes, teamsGradeRes, gradesRes, classesRes] = await Promise.all([
        axiosInstance.get('/Dashboard/Board/Statistics'),
        axiosInstance.get('/Dashboard/Board/EngineersByClass'),
        axiosInstance.get('/Dashboard/Board/TeamsProgress'),
        axiosInstance.get('/Dashboard/Board/TeamsCompletedAllTasks'),
        axiosInstance.get('/Dashboard/Board/TeamsByGrade'),
        axiosInstance.get('/Grades'),
        axiosInstance.get('/Class')
      ]);

      // Handle statistics (object, not array)
      setStatistics(statsRes.data || {});

      // Extract arrays from responses (handles .NET $values wrapper)
      const engineersData = extractArray(engineersRes.data);
      const teamsData = extractArray(teamsRes.data);
      const teamsCompletedData = extractArray(teamsCompletedRes.data);
      const teamsGradeData = extractArray(teamsGradeRes.data);

      // Normalize data to handle both camelCase and PascalCase
      setEngineersByClass(engineersData.map(item => ({
        classId: item.classId || item.ClassId,
        className: item.className || item.ClassName || 'Unknown',
        gradeName: item.gradeName || item.GradeName || 'Unknown',
        engineerCount: item.engineerCount || item.EngineerCount || 0,
        engineers: extractArray(item.engineers || item.Engineers).map(eng => ({
          id: eng.id || eng.Id,
          name: eng.name || eng.Name || 'Unknown',
          email: eng.email || eng.Email || ''
        }))
      })));

      setTeamsProgress(teamsData.map(item => ({
        teamId: item.teamId || item.TeamId,
        teamName: item.teamName || item.TeamName || 'Unknown Team',
        className: item.className || item.ClassName || 'Unknown',
        gradeName: item.gradeName || item.GradeName || 'Unknown',
        classId: item.classId || item.ClassId || null,
        memberCount: item.memberCount || item.MemberCount || 0,
        leaderName: item.leaderName || item.LeaderName || 'No Leader',
        supervisorName: item.supervisorName || item.SupervisorName || 'No Supervisor'
      })));

      setTeamsCompletedAllTasks(teamsCompletedData.map(item => ({
        teamId: item.teamId || item.TeamId,
        teamName: item.teamName || item.TeamName || 'Unknown Team',
        gradeName: item.gradeName || item.GradeName || 'Unknown',
        className: item.className || item.ClassName || 'Unknown',
        totalTasks: item.totalTasks || item.TotalTasks || 0,
        completedTasks: item.completedTasks || item.CompletedTasks || 0,
        allTasksCompleted: item.allTasksCompleted || item.AllTasksCompleted || false
      })));

      setTeamsByGrade(teamsGradeData.map(item => ({
        gradeId: item.gradeId || item.GradeId,
        gradeName: item.gradeName || item.GradeName || 'Unknown',
        teamCount: item.teamCount || item.TeamCount || 0
      })));

      // Process all grades for filter dropdown
      const gradesRaw = gradesRes.data;
      const gradesList = Array.isArray(gradesRaw) ? gradesRaw : (gradesRaw?.$values ? gradesRaw.$values : []);
      const normalizedGrades = gradesList.map((g) => ({
        id: g.id || g.Id,
        gradeName: g.gradeName || g.GradeName,
      }));
      setAllGrades(normalizedGrades);

      // Process all classes for filter dropdown
      const classesRaw = classesRes.data;
      const classesList = Array.isArray(classesRaw) ? classesRaw : (classesRaw?.$values ? classesRaw.$values : []);
      const normalizedClasses = classesList.map((c) => ({
        id: c.id || c.Id,
        className: c.className || c.ClassName || 'Unknown',
        gradeId: c.gradeId || c.GradeId,
        gradeName: c.gradeName || c.GradeName || 'Unknown',
      }));
      setAllClasses(normalizedClasses);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      showError(`Error loading dashboard: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleViewTeamProfile = (teamId) => {
    setSelectedTeam(teamId);
    setShowTeamModal(true);
  };

  // Filter all data based on global grade and class filters
  const filteredTeamsProgress = useMemo(() => {
    let filtered = teamsProgress;

    // Global grade filter
    if (globalGradeFilter) {
      filtered = filtered.filter(team => team.gradeName === globalGradeFilter);
    }

    // Global class filter
    if (globalClassFilter) {
      filtered = filtered.filter(team => team.className === globalClassFilter);
    }

    return filtered;
  }, [teamsProgress, globalGradeFilter, globalClassFilter]);

  const filteredEngineersByClass = useMemo(() => {
    let filtered = engineersByClass;

    // Global grade filter
    if (globalGradeFilter) {
      filtered = filtered.filter(ec => ec.gradeName === globalGradeFilter);
    }

    // Global class filter
    if (globalClassFilter) {
      filtered = filtered.filter(ec => ec.className === globalClassFilter);
    }

    return filtered;
  }, [engineersByClass, globalGradeFilter, globalClassFilter]);

  // Filter teams based on search query and local filters (in addition to global filters)
  const filteredTeams = useMemo(() => {
    let filtered = filteredTeamsProgress;

    // Apply local filters only if global filters are "All"
    if (!globalGradeFilter && !globalClassFilter) {
      // Local grade filter
      if (localTeamGradeFilter) {
        filtered = filtered.filter(team => team.gradeName === localTeamGradeFilter);
      }

      // Local class filter
      if (localTeamClassFilter) {
        filtered = filtered.filter(team => team.className === localTeamClassFilter);
      }
    }

    // Search filter
    if (teamSearchQuery.trim()) {
      const query = teamSearchQuery.toLowerCase();
      filtered = filtered.filter(team =>
        (team.teamName || '').toLowerCase().includes(query) ||
        (team.leaderName || '').toLowerCase().includes(query) ||
        (team.supervisorName || '').toLowerCase().includes(query) ||
        (team.className || '').toLowerCase().includes(query) ||
        (team.gradeName || '').toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [filteredTeamsProgress, teamSearchQuery, globalGradeFilter, globalClassFilter, localTeamGradeFilter, localTeamClassFilter]);

  // Calculate filtered statistics
  const filteredStatistics = useMemo(() => {
    if (!statistics) return null;

    const filteredTeamsCount = filteredTeamsProgress.length;
    const filteredEngineersCount = filteredEngineersByClass.reduce(
      (total, classData) => total + (classData.engineerCount || 0), 
      0
    );

    // Calculate filtered students count based on filtered teams
    // Students are in teams, so count students from filtered teams
    const filteredStudentsCount = filteredTeamsProgress.reduce(
      (total, team) => total + (team.memberCount || 0),
      0
    );

    return {
      ...statistics,
      totalTeams: filteredTeamsCount,
      totalEngineers: filteredEngineersCount,
      totalStudents: filteredStudentsCount
    };
  }, [statistics, filteredTeamsProgress, filteredEngineersByClass]);

  // Get unique grades and classes for filter dropdowns (from all grades/classes, not just teams)
  const uniqueGrades = useMemo(() => {
    // Use all grades from API, sorted by custom order: Junior -> Wheeler -> Senior
    const gradeOrder = { "Junior": 1, "Wheeler": 2, "Senior": 3 };
    return allGrades
      .map(g => g.gradeName)
      .filter((name, index, self) => self.indexOf(name) === index) // Remove duplicates
      .sort((a, b) => {
        const orderA = gradeOrder[a] || 4;
        const orderB = gradeOrder[b] || 4;
        return orderA - orderB;
      });
  }, [allGrades]);

  const uniqueClasses = useMemo(() => {
    // Filter classes based on selected grade if grade filter is active
    let filteredClasses = allClasses;
    if (globalGradeFilter) {
      filteredClasses = allClasses.filter(c => c.gradeName === globalGradeFilter);
    }
    return filteredClasses
      .map(c => c.className)
      .filter((name, index, self) => self.indexOf(name) === index) // Remove duplicates
      .sort();
  }, [allClasses, globalGradeFilter]);

  // Helper function to get engineers for a team's class
  const getEngineersForTeam = (team) => {
    if (!team.className && !team.classId) return [];
    
    // Find engineers assigned to this class
    // First try to match by classId (more reliable), then by className
    const classEngineers = engineersByClass.find(ec => {
      // Match by classId if both are available
      if (team.classId && ec.classId) {
        return ec.classId === team.classId;
      }
      // Fallback to className match
      if (team.className && ec.className) {
        return ec.className === team.className;
      }
      return false;
    });
    
    return classEngineers?.engineers || [];
  };

  // Filter teams completed all tasks based on global filters
  const filteredTeamsCompleted = useMemo(() => {
    let filtered = teamsCompletedAllTasks;

    // Global grade filter
    if (globalGradeFilter) {
      filtered = filtered.filter(t => t.gradeName === globalGradeFilter);
    }

    // Global class filter
    if (globalClassFilter) {
      filtered = filtered.filter(t => t.className === globalClassFilter);
    }

    return filtered;
  }, [teamsCompletedAllTasks, globalGradeFilter, globalClassFilter]);

  // Chart data for teams completed all tasks
  const teamsCompletedChartData = useMemo(() => {
    if (!Array.isArray(filteredTeamsCompleted) || filteredTeamsCompleted.length === 0) {
      return {
        labels: [],
        datasets: [{
          label: 'Teams',
          data: [],
          backgroundColor: [],
          borderColor: [],
          borderWidth: 2
        }]
      };
    }

    const completedCount = filteredTeamsCompleted.filter(t => t.allTasksCompleted).length;
    const notCompletedCount = filteredTeamsCompleted.length - completedCount;

    return {
      labels: ['Completed All Tasks', 'In Progress'],
      datasets: [{
        label: 'Number of Teams',
        data: [completedCount, notCompletedCount],
        backgroundColor: [
          'rgba(229, 62, 62, 0.8)',   // Primary red for completed
          'rgba(229, 62, 62, 0.4)',   // Lighter red for in progress
        ],
        borderColor: [
          'rgba(229, 62, 62, 1)',
          'rgba(229, 62, 62, 0.6)',
        ],
        borderWidth: 2
      }]
    };
  }, [filteredTeamsCompleted]);

  // Filter teams by grade chart data based on global filters
  const filteredTeamsByGrade = useMemo(() => {
    if (!Array.isArray(teamsByGrade) || teamsByGrade.length === 0) return [];
    
    let filtered = teamsByGrade;
    
    // Apply global grade filter if active
    if (globalGradeFilter) {
      filtered = filtered.filter(item => item.gradeName === globalGradeFilter);
    }
    
    return filtered;
  }, [teamsByGrade, globalGradeFilter]);

  const teamsByGradeChartData = useMemo(() => {
    if (!Array.isArray(filteredTeamsByGrade) || filteredTeamsByGrade.length === 0) {
      return {
        labels: [],
        datasets: [{
          label: 'Number of Teams',
          data: [],
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 2
        }]
      };
    }
    
    return {
      labels: filteredTeamsByGrade.map(item => item.gradeName || 'Unknown'),
      datasets: [{
        label: 'Number of Teams',
        data: filteredTeamsByGrade.map(item => item.teamCount || 0),
        backgroundColor: 'rgba(229, 62, 62, 0.8)',
        borderColor: 'rgba(229, 62, 62, 1)',
        borderWidth: 2
      }]
    };
  }, [filteredTeamsByGrade]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 15,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        enabled: true
      }
    }
  };

  if (loading) {
    return (
      <div className="flex-1 w-full bg-gray-50 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" style={{ color: '#e53e3e' }} />
          <p className="text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full bg-gray-50 p-6 min-w-0 overflow-x-hidden">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          {(() => {
            const userRole = getUserRole(user);
            const normalizedRole = userRole?.toLowerCase().trim();
            
            if (normalizedRole === 'superadmin' || normalizedRole === 'super admin') {
              return `Welcome ${userName}, Super Admin Dashboard`;
            } else if (normalizedRole === 'capstonelead' || normalizedRole === 'capstone lead') {
              return `Welcome ${userName}, Capstone Lead Dashboard`;
            } else {
              return `Welcome, ${userName}`;
            }
          })()}
          {user && (() => {
            const userRole = getUserRole(user);
            const normalizedRole = userRole?.toLowerCase().trim();
            
            // Don't show role suffix for SuperAdmin and CapstoneLead since it's already in the title
            if (normalizedRole === 'superadmin' || normalizedRole === 'super admin' || 
                normalizedRole === 'capstonelead' || normalizedRole === 'capstone lead') {
              return null;
            }
            
            const formattedRole = userRole ? userRole
              .replace(/([A-Z])/g, ' $1')
              .replace(/^./, str => str.toUpperCase())
              .trim() : null;
            return formattedRole ? (
              <span className="text-2xl font-normal text-gray-600 ml-2">, {formattedRole}</span>
            ) : null;
          })()}
        </h1>
        <p className="text-lg text-gray-600">Comprehensive overview of the Capstone Project System</p>
      </div>

      {/* Global Filters */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Filter Dashboard Data</h3>
          {(globalGradeFilter || globalClassFilter) && (
            <button
              onClick={() => {
                setGlobalGradeFilter('');
                setGlobalClassFilter('');
              }}
              className="text-sm font-medium"
              style={{ color: '#e53e3e' }}
              onMouseEnter={(e) => e.target.style.color = '#c53030'}
              onMouseLeave={(e) => e.target.style.color = '#e53e3e'}
            >
              Clear All Filters
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Grade Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Grade</label>
            <select
              value={globalGradeFilter}
              onChange={(e) => {
                setGlobalGradeFilter(e.target.value);
                setGlobalClassFilter(''); // Reset class filter when grade changes
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-0 transition-colors"
              style={{ 
                '--tw-ring-color': '#e53e3e',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#e53e3e';
                e.target.style.boxShadow = '0 0 0 2px rgba(229, 62, 62, 0.2)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#d1d5db';
                e.target.style.boxShadow = 'none';
              }}
            >
              <option value="">All Grades</option>
              {uniqueGrades.map((grade) => (
                <option key={grade} value={grade}>
                  {grade}
                </option>
              ))}
            </select>
          </div>

          {/* Class Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Class</label>
            <select
              value={globalClassFilter}
              onChange={(e) => setGlobalClassFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-0 transition-colors"
              style={{ 
                '--tw-ring-color': '#e53e3e',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#e53e3e';
                e.target.style.boxShadow = '0 0 0 2px rgba(229, 62, 62, 0.2)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#d1d5db';
                e.target.style.boxShadow = 'none';
              }}
              disabled={!globalGradeFilter && uniqueClasses.length === 0}
            >
              <option value="">All Classes</option>
              {uniqueClasses.map((className) => (
                <option key={className} value={className}>
                  {className}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4" style={{ borderLeftColor: '#e53e3e' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Students</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {filteredStatistics?.totalStudents ?? (filteredTeamsProgress.reduce((total, team) => total + (team.memberCount || 0), 0))}
              </p>
            </div>
            <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(229, 62, 62, 0.1)' }}>
              <Users className="w-8 h-8" style={{ color: '#e53e3e' }} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border-l-4" style={{ borderLeftColor: '#e53e3e' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Teams</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{filteredStatistics?.totalTeams ?? filteredTeamsProgress.length}</p>
            </div>
            <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(229, 62, 62, 0.1)' }}>
              <Building2 className="w-8 h-8" style={{ color: '#e53e3e' }} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border-l-4" style={{ borderLeftColor: '#e53e3e' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Engineers</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {filteredStatistics?.totalEngineers ?? filteredEngineersByClass.reduce((total, classData) => total + (classData.engineerCount || 0), 0)}
              </p>
            </div>
            <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(229, 62, 62, 0.1)' }}>
              <UserCheck className="w-8 h-8" style={{ color: '#e53e3e' }} />
            </div>
          </div>
        </div>

       
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Teams Completed All Tasks Chart */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Teams Completed All Tasks</h3>
          <div className="h-64">
            {filteredTeamsCompleted.length > 0 ? (
              <Doughnut data={teamsCompletedChartData} options={chartOptions} />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                {teamsCompletedAllTasks.length === 0 
                  ? 'No team data available'
                  : 'No teams match the current filters'}
              </div>
            )}
          </div>
          {filteredTeamsCompleted.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold" style={{ color: '#e53e3e' }}>
                    {filteredTeamsCompleted.filter(t => t.allTasksCompleted).length}
                  </p>
                  <p className="text-sm text-gray-600">Completed All Tasks</p>
                </div>
                <div>
                  <p className="text-2xl font-bold" style={{ color: 'rgba(229, 62, 62, 0.6)' }}>
                    {filteredTeamsCompleted.filter(t => !t.allTasksCompleted).length}
                  </p>
                  <p className="text-sm text-gray-600">In Progress</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Teams by Grade Chart */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Teams by Grade</h3>
          <div className="h-64">
            {filteredTeamsByGrade.length > 0 ? (
              <Bar data={teamsByGradeChartData} options={chartOptions} />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                {teamsByGrade.length === 0 
                  ? 'No team data available'
                  : 'No teams match the current filters'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Engineers by Class Section */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <GraduationCap className="w-6 h-6" style={{ color: '#e53e3e' }} />
            Engineers by Class
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEngineersByClass.map((classData, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-semibold text-gray-900">{classData.className}</p>
                  <p className="text-sm text-gray-600">{classData.gradeName}</p>
                </div>
                <span className="px-3 py-1 rounded-full text-sm font-medium" style={{ backgroundColor: 'rgba(229, 62, 62, 0.1)', color: '#e53e3e' }}>
                  {classData.engineerCount} Engineer{classData.engineerCount !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="space-y-2">
                {classData.engineers.map((engineer, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#e53e3e' }}></div>
                    <span>{engineer.name}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {filteredEngineersByClass.length === 0 && (
            <div className="col-span-full text-center text-gray-500 py-8">
              {engineersByClass.length === 0 
                ? 'No engineers assigned to classes yet'
                : 'No engineers match the current filters'}
            </div>
          )}
        </div>
      </div>

      {/* Teams Progress Section */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <ClipboardList className="w-6 h-6" style={{ color: '#e53e3e' }} />
            Teams Progress & Project Profiles
          </h3>
        </div>

        {/* Filters */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search Filter */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search teams..."
              value={teamSearchQuery}
              onChange={(e) => setTeamSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-0 transition-colors"
              onFocus={(e) => {
                e.target.style.borderColor = '#e53e3e';
                e.target.style.boxShadow = '0 0 0 2px rgba(229, 62, 62, 0.2)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#d1d5db';
                e.target.style.boxShadow = 'none';
              }}
            />
            {teamSearchQuery && (
              <button
                onClick={() => setTeamSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Local Grade Filter - Only show when global filters are "All" */}
          {!globalGradeFilter && !globalClassFilter && (
            <>
              <select
                value={localTeamGradeFilter}
                onChange={(e) => {
                  setLocalTeamGradeFilter(e.target.value);
                  setLocalTeamClassFilter(''); // Reset class filter when grade changes
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-0 transition-colors"
              style={{ 
                '--tw-ring-color': '#e53e3e',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#e53e3e';
                e.target.style.boxShadow = '0 0 0 2px rgba(229, 62, 62, 0.2)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#d1d5db';
                e.target.style.boxShadow = 'none';
              }}
              >
                <option value="">All Grades</option>
                {uniqueGrades.map((grade) => (
                  <option key={grade} value={grade}>
                    {grade}
                  </option>
                ))}
              </select>

              <select
                value={localTeamClassFilter}
                onChange={(e) => setLocalTeamClassFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-0 transition-colors"
              style={{ 
                '--tw-ring-color': '#e53e3e',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#e53e3e';
                e.target.style.boxShadow = '0 0 0 2px rgba(229, 62, 62, 0.2)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#d1d5db';
                e.target.style.boxShadow = 'none';
              }}
                disabled={!localTeamGradeFilter && uniqueClasses.length === 0}
              >
                <option value="">All Classes</option>
                {(() => {
                  // Filter classes based on selected local grade from all classes
                  let filteredClasses = allClasses;
                  if (localTeamGradeFilter) {
                    filteredClasses = allClasses.filter(c => c.gradeName === localTeamGradeFilter);
                  }
                  return filteredClasses
                    .map(c => c.className)
                    .filter((name, index, self) => self.indexOf(name) === index) // Remove duplicates
                    .sort()
                    .map((className) => (
                      <option key={className} value={className}>
                        {className}
                      </option>
                    ));
                })()}
              </select>
            </>
          )}

          {/* Clear Filters Button */}
          {(teamSearchQuery || localTeamGradeFilter || localTeamClassFilter) && (
            <button
              onClick={() => {
                setTeamSearchQuery('');
                setLocalTeamGradeFilter('');
                setLocalTeamClassFilter('');
              }}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Clear Filters
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Team Name</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Grade</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Class</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Members</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Leader</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Engineers</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTeams.map((team) => {
                const teamEngineers = getEngineersForTeam(team);
                return (
                  <tr key={team.teamId} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-4 font-medium text-gray-900">{team.teamName}</td>
                    <td className="py-4 px-4 text-gray-700">{team.gradeName}</td>
                    <td className="py-4 px-4 text-gray-700">{team.className}</td>
                    <td className="py-4 px-4 text-gray-700">{team.memberCount}</td>
                    <td className="py-4 px-4 text-gray-700">{team.leaderName}</td>
                    <td className="py-4 px-4 text-gray-700">
                      {teamEngineers.length > 0 ? (
                        <div className="flex flex-col gap-1">
                          {teamEngineers.map((engineer, idx) => (
                            <span key={engineer.id || idx} className="text-sm">
                              {engineer.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">No engineers assigned</span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <button
                        onClick={() => handleViewTeamProfile(team.teamId)}
                        className="inline-flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-colors text-sm font-medium"
                      style={{ backgroundColor: '#e53e3e' }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#c53030'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = '#e53e3e'}
                      >
                        <Eye className="w-4 h-4" />
                        View Profile
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredTeams.length === 0 && (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-gray-500">
                    {teamsProgress.length === 0 
                      ? 'No teams found' 
                      : 'No teams match the current filters'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Team Project Modal */}
      {showTeamModal && selectedTeam && (
        <TeamProjectModal
          teamId={selectedTeam}
          engineersByClass={engineersByClass}
          onClose={() => {
            setShowTeamModal(false);
            setSelectedTeam(null);
          }}
        />
      )}
    </div>
  );
};

export default BoardDashboard;

