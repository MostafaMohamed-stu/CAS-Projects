
import React, { Suspense, lazy, useState, useEffect } from "react"
import { Users, Shield, ScrollText, Eye, PartyPopper, CalendarCheck, BarChart3 } from "lucide-react"
import Header from "../Header/Header"
import { isStudent, isEngineer, isReviewer, isSuperAdmin, isStaffAdmin, isBoard, isCapstoneLead } from "../../utils/roleUtils"
import "./MainContent.css"

// Lazy load components for better performance
const TimeManager = lazy(() => import("../TimeManager/TimeManager"))
const PhasesSection = lazy(() => import("../PhasesSection/PhasesSection"))
const BottomSection = lazy(() => import("../BottomSection/BottomSection"))

// Enhanced loading fallback component
const ComponentLoader = ({ className = "", componentName = "content" }) => (
  <div className={`component-loading ${className}`} role="status" aria-label={`Loading ${componentName}`}>
    <div className="loading-spinner" aria-hidden="true"></div>
    <div className="loading-text">
      <span className="loading-title">Loading {componentName}...</span>
      <span className="loading-subtitle">Please wait</span>
    </div>
    <span className="sr-only">Loading {componentName}, please wait...</span>
  </div>
)

// Enhanced error boundary fallback
const ErrorFallback = ({ error, retry, componentName }) => (
  <div className="error-container" role="alert">
    <div className="error-icon" aria-hidden="true">
      ⚠️
    </div>
    <h3 className="error-title">Failed to load {componentName}</h3>
    <p className="error-message">{error?.message || "Something went wrong"}</p>
    {retry && (
      <button onClick={retry} className="retry-button" aria-label={`Retry loading ${componentName}`}>
        Try Again
      </button>
    )}
  </div>
)

const MainContent = ({ currentStudentId, setCurrentPage, setSelectedPhase, user = null }) => {
  // currentStudentId: The ID of the currently logged-in user (passed from Dashboard)
  // No more hardcoded default value
  const [isVisible, setIsVisible] = useState(false)

  console.log("MainContent - User role:", user?.role);

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 100)
    return () => clearTimeout(timer)
  }, [])

  return (
    <main className={`main-content ${isVisible ? "visible" : ""}`} role="main">
      {/* Header section with enhanced semantics */}
      <section className="header-section" aria-labelledby="main-header">
        <Header user={user} studentId={currentStudentId} />
      </section>

      {/* Main content with full width */}
      <div className="content-grid">
        {/* Main dashboard content */}
        <div className="left-column" role="region" aria-label="Main dashboard content">
          {/* Student - Show normal dashboard content */}
          {isStudent(user) && (
            <>
              <Suspense fallback={<ComponentLoader className="time-manager-loader" componentName="Time Manager" />}>
                <section aria-labelledby="time-manager-heading" className="content-section">
                  <TimeManager currentStudentId={currentStudentId} user={user} />
                </section>
              </Suspense>

              <Suspense fallback={<ComponentLoader className="phases-section-loader" componentName="Phases Section" />}>
                <section aria-labelledby="phases-section-heading" className="content-section">
                  <PhasesSection setCurrentPage={setCurrentPage} setSelectedPhase={setSelectedPhase} currentStudentId={currentStudentId} />
                </section>
              </Suspense>

              <Suspense fallback={<ComponentLoader className="bottom-section-loader" componentName="Team Information" />}>
                <section aria-labelledby="bottom-section-heading" className="content-section">
                  <BottomSection currentStudentId={currentStudentId} user={user} />
                </section>
              </Suspense>
            </>
          )}

          {/* Engineer and Reviewer - Show limited dashboard */}
          {(isEngineer(user) || isReviewer(user)) && (
            <div className="admin-dashboard-content">
              <section className="content-section admin-welcome">
                <h2>Welcome to Engineer Dashboard</h2>
                <p>Manage your teams and view progress</p>
              </section>

              <section className="content-section admin-navigation">
                <h3>Quick Navigation</h3>
                <div className="admin-buttons-grid">
                  <button 
                    className="admin-nav-button"
                    onClick={() => setCurrentPage("view-tasks")}
                  >
                    <Users size={24} />
                    <span>Teams Overview</span>
                  </button>
                  
                  <button 
                    className="admin-nav-button"
                    onClick={() => setCurrentPage("teams-progress")}
                  >
                    <BarChart3 size={24} />
                    <span>Teams Progress</span>
                  </button>
                  
                  <button 
                    className="admin-nav-button"
                    onClick={() => setCurrentPage("admin-tasks")}
                  >
                    <Shield size={24} />
                    <span>Task Management</span>
                  </button>
                </div>
              </section>
            </div>
          )}

          {/* Super Admin and Capstone Lead - Show same design as Engineer but with full access */}
          {(isSuperAdmin(user) || isCapstoneLead(user)) && (
            <div className="admin-dashboard-content">
              <section className="content-section admin-welcome">
                <h2>Welcome to {isCapstoneLead(user) ? 'Capstone Lead' : 'Super Admin'} Dashboard</h2>
                <p>Full system access - Manage all teams, tasks, and system settings</p>
              </section>

              <section className="content-section admin-navigation">
                <h3>Quick Navigation</h3>
                <div className="admin-buttons-grid">
                  <button 
                    className="admin-nav-button"
                    onClick={() => setCurrentPage("view-tasks")}
                  >
                    <Users size={24} />
                    <span>Teams Overview</span>
                  </button>
                  
                  <button 
                    className="admin-nav-button"
                    onClick={() => setCurrentPage("teams-progress")}
                  >
                    <BarChart3 size={24} />
                    <span>Teams Progress</span>
                  </button>
                  
                  <button 
                    className="admin-nav-button"
                    onClick={() => setCurrentPage("admin-tasks")}
                  >
                    <Shield size={24} />
                    <span>Manage Tasks</span>
                  </button>
                  
                  <button 
                    className="admin-nav-button"
                    onClick={() => setCurrentPage("super-admin")}
                  >
                    <Shield size={24} />
                    <span>Account Management</span>
                  </button>
                  
                  <button 
                    className="admin-nav-button"
                    onClick={() => setCurrentPage("user-reports")}
                  >
                    <ScrollText size={24} />
                    <span>User Reports</span>
                  </button>
                </div>
              </section>
            </div>
          )}

          {/* Staff Admin - Show same design as Super Admin with Staff Admin specific features */}
          {isStaffAdmin(user) && (
            <div className="admin-dashboard-content">
              <section className="content-section admin-welcome">
                <h2>Welcome to Staff Admin Dashboard</h2>
                <p>Full system access - Manage all teams, tasks, accounts, and system settings</p>
              </section>

              <section className="content-section admin-navigation">
                <h3>Quick Navigation</h3>
                <div className="admin-buttons-grid">
                  <button 
                    className="admin-nav-button"
                    onClick={() => setCurrentPage("view-tasks")}
                  >
                    <Users size={24} />
                    <span>Teams Overview</span>
                  </button>
                  
                  <button 
                    className="admin-nav-button"
                    onClick={() => setCurrentPage("teams-progress")}
                  >
                    <BarChart3 size={24} />
                    <span>Teams Progress</span>
                  </button>
                  
                  <button 
                    className="admin-nav-button"
                    onClick={() => setCurrentPage("admin-tasks")}
                  >
                    <Shield size={24} />
                    <span>Manage Tasks</span>
                  </button>
                  
                  <button 
                    className="admin-nav-button"
                    onClick={() => setCurrentPage("super-admin")}
                  >
                    <Shield size={24} />
                    <span>Account Management</span>
                  </button>
                  
                  <button 
                    className="admin-nav-button"
                    onClick={() => setCurrentPage("staff-admin")}
                  >
                    <Shield size={24} />
                    <span>Staff Admin Panel</span>
                  </button>
                </div>
              </section>
            </div>
          )}
        </div>
      </div>

      {/* Skip to top button for accessibility */}
      <button
        className="skip-to-top"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="Skip to top of page"
        title="Back to top"
      >
        ↑
      </button>
    </main>
  )
}

export default React.memo(MainContent)

// Note: This component now receives dynamic user data from the Dashboard
// No more hardcoded default values, uses currentStudentId prop instead
 