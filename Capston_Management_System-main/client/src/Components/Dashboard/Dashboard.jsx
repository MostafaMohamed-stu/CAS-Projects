import React from "react";
import Sidebar from "../Sidebar/Sidebar";
import MainContent from "../MainContent/MainContent";
import PhasesPage from "../PhasesPage/PhasesPage";
import TaskDetailsPage from "../TaskDetailsPage/TaskDetailsPage";
import ReportsPage from "../ReportsPage/ReportsPage";
import TeamsProgress from "../TeamsProgress/TeamsProgress";
import ViewTasks from "../ViewTasks/ViewTasks";
import AdminTasksPage from "../AdminTasksPage/AdminTasksPage";
import SuperAdminPage from "../SuperAdminPage/SuperAdminPage";
import StaffAdminPage from "../StaffAdminPage/StaffAdminPage";
import MyProjectPage from "../MyProjectPage/MyProjectPage";
import TeamProfile from "../TeamProfile/TeamProfile";
import UserReportsPage from "../UserReportsPage/UserReportsPage";
import MyAssignedTasksPage from "../MyAssignedTasksPage/MyAssignedTasksPage";
import EngineersTasksPage from "../EngineersTasksPage/EngineersTasksPage";
import BoardDashboard from "../BoardDashboard/BoardDashboard";
import TeamSubmissionsPage from "../TeamSubmissionsPage/TeamSubmissionsPage";
import { canAccessPage, isStudent, isBoard, isCapstoneLead, isSuperAdmin, isEngineer, isReviewer } from "../../utils/roleUtils";
import { isDevelopment } from "../../config/apiConfig";
import "./Dashboard.css";

const Dashboard = ({ onLogout, user }) => {
  const [currentPage, setCurrentPage] = React.useState("dashboard");
  const [selectedPhase, setSelectedPhase] = React.useState(null);
  const [selectedTask, setSelectedTask] = React.useState(null);
  const [previousPage, setPreviousPage] = React.useState("dashboard");
  const [teamIdFilter, setTeamIdFilter] = React.useState(null);
  const [selectedTeamId, setSelectedTeamId] = React.useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  // Get the current user's ID from the user object
  const currentUserId = user?.id || null;

  const handlePageChange = (newPage, teamId = null) => {
    // Check if user can access the requested page based on their role
    if (!canAccessPage(user, newPage)) {
      if (isDevelopment() === 'development') {
        console.log("Access denied to:", newPage, "for role:", user?.role || "Unknown");
      }
      return; // Don't allow access to restricted pages
    }

    setPreviousPage(currentPage);
    setCurrentPage(newPage);
    setTeamIdFilter(teamId);
    if (newPage === "team-profile") {
      setSelectedTeamId(teamId);
    }
  };

  const handleSidebarPageChange = (newPage) => {
    // Check if user can access the requested page based on their role
    if (!canAccessPage(user, newPage)) {
      if (isDevelopment() === 'development') {
        console.log("Access denied to:", newPage, "for role:", user?.role || "Unknown");
      }
      return; // Don't allow access to restricted pages
    }

    setPreviousPage(currentPage);
    setCurrentPage(newPage);
    setTeamIdFilter(null); // Clear team filter when navigating from sidebar
  };

  const renderCurrentPage = () => {
    // For students, only allow access to specific pages
    if (isStudent(user)) {
      if (currentPage === "task-details" && (selectedPhase || selectedTask)) {
        return (
          <TaskDetailsPage
            task={selectedTask}
            phase={selectedPhase}
            selectedTask={selectedTask}
            setCurrentPage={handlePageChange}
            previousPage={previousPage}
            currentUserId={currentUserId}
            user={user}
          />
        );
      } else if (currentPage === "phase-details" && selectedPhase) {
        return (
          <PhasesPage
            setCurrentPage={handlePageChange}
            setSelectedPhase={setSelectedPhase}
            currentUserId={currentUserId}
            user={user}
          />
        );
      } else if (currentPage === "my-project") {
        return <MyProjectPage user={user} />
      } else if (currentPage === "phases") {
        return (
          <PhasesPage
            setCurrentPage={handlePageChange}
            setSelectedPhase={setSelectedPhase}
            setSelectedTask={setSelectedTask}
            currentUserId={currentUserId}
            user={user}
            previousPage={previousPage}
          />
        );
      } else if (currentPage === "reports") {
        return <ReportsPage currentUserId={currentUserId} user={user} />;
      } else if (currentPage === "teams-progress") {
        return <TeamsProgress setCurrentPage={handlePageChange} currentUserId={currentUserId} user={user} />;
      } else {
        // Default to dashboard for students
        return <MainContent
          currentStudentId={currentUserId}
          setCurrentPage={handlePageChange}
          setSelectedPhase={setSelectedPhase}
          user={user}
        />;
      }
    }

    // For other roles, allow access to all pages
    if (currentPage === "task-details" && (selectedPhase || selectedTask)) {
      return (
        <TaskDetailsPage
          task={selectedTask}
          phase={selectedPhase}
          selectedTask={selectedTask}
          setCurrentPage={handlePageChange}
          previousPage={previousPage}
          currentUserId={currentUserId}
          user={user}
        />
      );
    } else if (currentPage === "phase-details" && selectedPhase) {
      return (
        <PhasesPage
          setCurrentPage={handlePageChange}
          setSelectedPhase={setSelectedPhase}
          currentUserId={currentUserId}
          user={user}
        />
      );
    } else if (currentPage === "phases") {
      return (
        <PhasesPage
          setCurrentPage={handlePageChange}
          setSelectedPhase={setSelectedPhase}
          setSelectedTask={setSelectedTask}
          currentUserId={currentUserId}
          user={user}
          previousPage={previousPage}
        />
      );
    } else if (currentPage === "reports") {
      return <ReportsPage currentUserId={currentUserId} user={user} />;
    } else if (currentPage === "teams-progress") {
      return <TeamsProgress setCurrentPage={handlePageChange} currentUserId={currentUserId} user={user} />;
    } else if (currentPage === "view-tasks") {
      return <ViewTasks
        teamIdFilter={teamIdFilter}
        currentUserId={currentUserId}
        user={user}
        openTeamProfile={(teamId) => handlePageChange("team-profile", teamId)}
        setCurrentPage={handlePageChange}
      />;
    } else if (currentPage === "team-profile") {
      return <TeamProfile teamId={selectedTeamId} user={user} setCurrentPage={handlePageChange} />
    } else if (currentPage === "admin-tasks") {
      return <AdminTasksPage
        currentUserId={currentUserId}
        user={user}
        setCurrentPage={handlePageChange}
        setSelectedTask={setSelectedTask}
      />;
    } else if (currentPage === "super-admin") {
      return <SuperAdminPage user={user} />;
    } else if (currentPage === "staff-admin") {
      return <StaffAdminPage user={user} />;
    } else if (currentPage === "user-reports") {
      return <UserReportsPage user={user} currentUserId={currentUserId} />;
    } else if (currentPage === "my-assigned-tasks") {
      return <MyAssignedTasksPage user={user} currentUserId={currentUserId} setCurrentPage={handlePageChange} setSelectedTask={setSelectedTask} />;
    } else if (currentPage === "engineers-tasks") {
      return <EngineersTasksPage user={user} currentUserId={currentUserId} setCurrentPage={handlePageChange} />;
    } else if (currentPage === "team-submissions") {
      return <TeamSubmissionsPage user={user} currentUserId={currentUserId} setCurrentPage={handlePageChange} />;
    } else if (currentPage === "dashboard" && (isBoard(user) || isSuperAdmin(user) || isCapstoneLead(user))) {
      // Board, SuperAdmin, and CapstoneLead roles see the Board Dashboard with charts
      return <BoardDashboard user={user} setCurrentPage={handlePageChange} />;
    } else {
      // Use the logged-in user's ID (no more hardcoded ID 9)
      return <MainContent
        currentStudentId={currentUserId}
        setCurrentPage={handlePageChange}
        setSelectedPhase={setSelectedPhase}
        user={user}
      />;
    }
  };

  return (
    <div className="dashboard">
      <Sidebar
        currentPage={currentPage}
        setCurrentPage={handleSidebarPageChange}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        onLogout={onLogout}
        user={user}
      />
      {renderCurrentPage()}
    </div>
  );
};

export default Dashboard;

// Note: This component now passes dynamic user data to all child components
// No more hardcoded IDs, uses user.id from login instead

