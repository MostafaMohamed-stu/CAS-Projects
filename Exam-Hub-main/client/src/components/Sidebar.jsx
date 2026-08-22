import { useState, useEffect } from "react";
import {
  BarChart3,
  User,
  FileText,
  LogOut,
  Settings,
  Users,
  TrendingUp,
  ScrollText,
  PlusCircle,
  ArrowRight,
  ArrowDown,
  Eye,
  CalendarCheck,
  PartyPopper,
  Shield,
  Menu,
  X,
  PlusSquare,
  ListTodo,
  Database
} from "lucide-react";
import { isStudent, isTeacher, isSuperAdmin } from "../utils/roleUtils";
import "./Sidebar.css";

const Sidebar = ({
  currentSection,
  showSection,
  handleLogout,
  userRole,
  isExamActive,
  availableExamsCount
}) => {
  const [isOpen, setIsOpen] = useState(window.innerWidth > 768);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  // Close sidebar when clicking on a nav item on mobile
  const handleNavClick = (section) => {
    if (isExamActive) return; // Prevent navigation during exam
    showSection(section);
    if (windowWidth <= 768) {
      setIsOpen(false);
    }
  };

  // Handle responsiveness
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      if (window.innerWidth > 768) {
        setIsOpen(true);
      } else {
        setIsOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const role = userRole ? userRole.toLowerCase() : '';
  const isStudent = role === 'student';
  const isTeacher = role === 'teacher';
  const isAdmin = role === 'admin' || role === 'superadmin' || role === 'board';

  return (
    <>
      {/* Mobile Overlay */}
      {windowWidth <= 768 && isOpen && (
        <div className="sidebar-overlay" onClick={() => setIsOpen(false)} />
      )}

      {/* Hamburger Menu Button */}
      <button
        className="hamburger-menu"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle sidebar"
        style={{ display: windowWidth <= 768 ? 'flex' : 'none' }}
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <div className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo-section">
            <div className="logo-icon-wrapper">
              <img
                src="/logo.png"
                className="logo-img"
                alt="Exams Hub Logo"
              />
            </div>
            <div className="logo-text">
              <span className="brand-name">Exams <span className="highlight">Hub</span></span>
              <span className="brand-tagline">Academic Excellence</span>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {/* Dashboard - Always 'main' for Teacher/Admin, 'dashboard' for Student */}
          <div
            className={`nav-item ${(currentSection === 'main' || currentSection === 'dashboard') ? 'active' : ''}`}
            onClick={() => handleNavClick(isStudent ? 'dashboard' : 'main')}
          >
            <div className="nav-item-content">
              <BarChart3 size={20} />
              <span>Dashboard</span>
            </div>
          </div>

          {/* Student Specific */}
          {isStudent && (
            <>
              <div
                className={`nav-item ${currentSection === 'available' ? 'active' : ''}`}
                onClick={() => handleNavClick('available')}
              >
                <div className="nav-item-content">
                  <ScrollText size={20} />
                  <span>Available Exams</span>
                </div>
                {availableExamsCount > 0 && (
                  <span className="count-badge">{availableExamsCount}</span>
                )}
              </div>
              <div
                className={`nav-item ${currentSection === 'completed' ? 'active' : ''}`}
                onClick={() => handleNavClick('completed')}
              >
                <div className="nav-item-content">
                  <CalendarCheck size={20} />
                  <span>Completed Exams</span>
                </div>
              </div>
            </>
          )}

          {/* Teacher Specific */}
          {isTeacher && (
            <>
              <div
                className={`nav-item ${currentSection === 'my-quizzes' ? 'active' : ''}`}
                onClick={() => handleNavClick('my-quizzes')}
              >
                <div className="nav-item-content">
                  <ListTodo size={20} />
                  <span>Manage Exams</span>
                </div>
              </div>
              <div
                className={`nav-item ${currentSection === 'question-banks' ? 'active' : ''}`}
                onClick={() => handleNavClick('question-banks')}
              >
                <div className="nav-item-content">
                  <Database size={20} />
                  <span>Question Banks</span>
                </div>
              </div>
              <div
                className={`nav-item ${currentSection === 'students' ? 'active' : ''}`}
                onClick={() => handleNavClick('students')}
              >
                <div className="nav-item-content">
                  <Users size={20} />
                  <span>Students</span>
                </div>
              </div>
            </>
          )}

          {/* Admin Specific */}
          {isAdmin && (
            <>
              <div
                className={`nav-item ${currentSection === 'my-quizzes' ? 'active' : ''}`}
                onClick={() => handleNavClick('my-quizzes')}
              >
                <div className="nav-item-content">
                  <ListTodo size={20} />
                  <span>All Exams</span>
                </div>
              </div>
              <div
                className={`nav-item ${currentSection === 'teachers' ? 'active' : ''}`}
                onClick={() => handleNavClick('teachers')}
              >
                <div className="nav-item-content">
                  <Shield size={20} />
                  <span>Teachers</span>
                </div>
              </div>
              <div
                className={`nav-item ${currentSection === 'students' ? 'active' : ''}`}
                onClick={() => handleNavClick('students')}
              >
                <div className="nav-item-content">
                  <Users size={20} />
                  <span>Students</span>
                </div>
              </div>
            </>
          )}

        </nav>

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={20} />
            <span>Log Out</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
