import { useMemo, useRef, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import UserProfile from '../components/UserProfile'
import Sidebar from '../components/Sidebar'
import QuizModal from '../components/QuizModal'
import ErrorBoundary from '../components/ErrorBoundary'
import UnifiedDashboard from '../components/UnifiedDashboard'
import { Shield, Users, ListTodo, Database, Mail, FileText } from 'lucide-react'
import api from '../api/axios.js'
import { storage } from '../utils/storage'
import StudentsDataGrid from '../components/Teacher/StudentsDataGrid.jsx'
import DashboardFilters from '../components/DashboardFilters'
import { Calendar, Clock, BookOpen, GraduationCap } from 'lucide-react'

export default function SuperAdminPage() {
  const navigate = useNavigate()

  // State Management
  const [currentSection, setCurrentSection] = useState('main')
  const [currentClass, setCurrentClass] = useState(null)
  const [currentGrade, setCurrentGrade] = useState(null)
  const [userRole, setUserRole] = useState(null)
  const [teacherName, setTeacherName] = useState('Admin')
  const [teachers, setTeachers] = useState([])
  const [quizzes, setQuizzes] = useState([])
  const [students, setStudents] = useState([])
  const [dbGrades, setDbGrades] = useState([])
  const [dbClasses, setDbClasses] = useState([])
  const [dbSubjects, setDbSubjects] = useState([])
  const [selectedStudentId, setSelectedStudentId] = useState(null)

  // Filter and Search State
  const [filters, setFilters] = useState({
    gradeId: null,
    classId: null,
    startDate: null,
    endDate: null
  })
  const [teacherSearchQuery, setTeacherSearchQuery] = useState('')

  // Modal State
  const [isModalActive, setIsModalActive] = useState(false)
  const [modalTitle, setModalTitle] = useState('')
  const [modalMessage, setModalMessage] = useState('')
  const modalResolveRef = useRef(null)

  const [studentFilterExamId, setStudentFilterExamId] = useState(null)
  const [studentFilterGrade, setStudentFilterGrade] = useState(null)

  // Auth and Profile Initialization
  useEffect(() => {
    const token = storage.getItem('token')
    const storedUserRole = storage.getItem('userRole')
    setUserRole(storedUserRole)

    if (!token) {
      navigate('/')
      return
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      const userId = payload.AccountId || payload.accountId || payload.sub || payload.id
      if (userId) {
        api.get(`/auth/profile/${userId}`).then(res => {
          if (res.data && (res.data.fullNameEn || res.data.fullNameAr)) {
            setTeacherName(res.data.fullNameEn || res.data.fullNameAr)
          }
        }).catch(err => console.error("Failed to fetch profile", err))
      }
    } catch (e) {
      console.error('Error parsing token:', e)
    }
  }, [navigate])

  // Data Fetching
  useEffect(() => {
    const fetchData = async () => {
      try {
        const results = await Promise.allSettled([
          api.get("/examdetail"),
          api.get("/dashboard/lookup-data"),
          api.get("/dashboard/students"),
          api.get("/dashboard/teachers")
        ])

        const [quizRes, lookupRes, studentRes, teachersRes] = results.map(r => r.status === 'fulfilled' ? r.value : { data: null });

        if (lookupRes?.data) {
          setDbGrades(lookupRes.data.grades || [])
          setDbClasses(lookupRes.data.classes || [])
          setDbSubjects(lookupRes.data.subjects || [])
        }

        if (studentRes?.data) {
          setStudents(studentRes.data);
        }

        if (quizRes?.data) {
          const quizData = quizRes.data.value || quizRes.data || [];
          const mappedQuizzes = quizData.map(quiz => {
            const rawQuestions = quiz.questions || quiz.Questions || [];
            const marks = quiz.totalMarks || quiz.TotalMarks || quiz.marks || quiz.Marks ||
              rawQuestions.reduce((sum, q) => sum + (q.mark || q.Mark || 0), 0);

            return {
              id: quiz.examId || quiz.ExamId,
              examId: quiz.examId || quiz.ExamId,
              title: quiz.title || quiz.Title,
              description: quiz.examDescription || quiz.ExamDescription || quiz.description,
              grade: quiz.grade || quiz.Grade || '',
              gradeId: quiz.gradeId || quiz.GradeId,
              class: quiz.class || quiz.Class || '',
              classId: quiz.classId || quiz.ClassId,
              classIds: quiz.classIds || quiz.ClassIds || (quiz.classId ? [quiz.classId] : []),
              subject: quiz.subjectName || quiz.SubjectName || quiz.examSubject || quiz.subject || quiz.Subject,
              startDate: quiz.startDate || quiz.StartDate,
              endDate: quiz.endDate || quiz.EndDate,
              created: quiz.createdDate || quiz.created,
              marks: marks
            };
          });
          setQuizzes(mappedQuizzes);
        }

        if (teachersRes?.data) {
          setTeachers(teachersRes.data);
        }

      } catch (err) {
        console.error("Error fetching admin data:", err)
      }
    }

    fetchData()
  }, [])

  // Navigation Handlers
  const showSection = (section) => {
    setCurrentSection(section)
    setCurrentClass(null)
    setCurrentGrade(null)
  }

  const handleSeeAllScores = (examId, gradeName = null) => {
    setStudentFilterExamId(examId)
    setStudentFilterGrade(gradeName)
    setCurrentSection('students')
  }

  const showStudentDetail = (studentId) => {
    setCurrentSection('student-detail')
    setSelectedStudentId(studentId)
  }

  const handleLogout = () => {
    showModal('Confirm Logout', 'Are you sure you want to logout?').then((confirmed) => {
      if (confirmed) {
        storage.clear()
        // Show CAS login again but keep the shared SSO session for Capstone.
        const casUrl = 'http://localhost:5174'
        const callbackUrl = encodeURIComponent(`${window.location.origin}/sso-callback`)
        window.location.href = `${casUrl}/login?prompt=login&logout=true&redirect=${callbackUrl}&businessEntityId=9`
      }
    })
  }

  // Modal Helper
  const showModal = (title, message) => {
    return new Promise((resolve) => {
      setIsModalActive(true)
      setModalTitle(title)
      setModalMessage(message)
      modalResolveRef.current = resolve
    })
  }

  const handleModalConfirm = () => {
    setIsModalActive(false)
    modalResolveRef.current?.(true)
  }

  const handleModalCancel = () => {
    setIsModalActive(false)
    modalResolveRef.current?.(false)
  }

  // Memoized Views
  const currentView = useMemo(() => {
    switch (currentSection) {
      case 'my-quizzes':
        const filteredQuizzes = quizzes.filter(quiz => {
          if (filters.gradeId && String(quiz.gradeId) !== String(filters.gradeId)) return false
          if (filters.classId) {
            const cIds = quiz.classIds || []
            if (!cIds.some(id => String(id) === String(filters.classId)) && String(quiz.classId) !== String(filters.classId)) return false
          }
          if (filters.startDate && new Date(quiz.startDate) < new Date(filters.startDate)) return false
          if (filters.endDate && new Date(quiz.endDate) > new Date(filters.endDate)) return false
          return true
        })

        return (
          <div style={{ padding: '2rem', background: '#f9fafb', minHeight: '100vh' }}>
            <div className="content-header" style={{ marginBottom: '2rem' }}>
              <h1 className="content-title" style={{ fontSize: '2.5rem', fontWeight: 800, color: '#111827', margin: 0 }}>All Exams</h1>
              <p className="content-subtitle" style={{ fontSize: '1.125rem', color: '#6b7280', marginTop: '0.5rem' }}>View and manage all exams across the platform</p>
            </div>

            <DashboardFilters
              onFilterChange={(newFilters) => setFilters(newFilters)}
              userRole="SuperAdmin"
              grades={dbGrades}
              classes={dbClasses}
              subjects={dbSubjects}
            />

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '2rem'
            }}>
              {filteredQuizzes.length === 0 ? (
                <div style={{
                  gridColumn: '1 / -1',
                  textAlign: 'center',
                  padding: '5rem 2rem',
                  background: 'white',
                  borderRadius: '16px',
                  color: '#6b7280'
                }}>
                  <ListTodo size={64} style={{ margin: '0 auto 1.5rem', opacity: 0.3 }} />
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#374151' }}>No exams found</h3>
                  <p>Try adjusting your filters to find what you're looking for.</p>
                </div>
              ) : (
                filteredQuizzes.map((quiz) => (
                  <div key={quiz.id} style={{
                    background: 'white',
                    borderRadius: '16px',
                    padding: '1.5rem',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    borderLeft: '5px solid #dc2626',
                    position: 'relative',
                    transition: 'transform 0.2s ease',
                    cursor: 'default'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', margin: 0, flex: 1, paddingRight: '3rem' }}>
                        {quiz.title}
                      </h3>
                      <span style={{
                        background: '#fee2e2',
                        color: '#dc2626',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        position: 'absolute',
                        top: '1.5rem',
                        right: '1.5rem'
                      }}>
                        #{quiz.id}
                      </span>
                    </div>

                    <p style={{
                      color: '#6b7280',
                      fontSize: '0.95rem',
                      marginBottom: '1.5rem',
                      lineHeight: '1.5',
                      minHeight: '2.8rem'
                    }}>
                      {quiz.description || 'No description provided.'}
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', borderTop: '1px solid #f3f4f6', paddingTop: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#4b5563', fontSize: '0.875rem' }}>
                        <BookOpen size={16} />
                        <span>{quiz.subject || 'N/A'}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#059669', fontSize: '0.875rem', justifyContent: 'flex-end', fontWeight: 700 }}>
                        <span>{quiz.marks || 0} Marks</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#4b5563', fontSize: '0.875rem' }}>
                        <Calendar size={16} />
                        <span>{quiz.startDate ? new Date(quiz.startDate).toLocaleDateString() : 'N/A'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <span style={{
                          background: '#eff6ff',
                          color: '#2563eb',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 600
                        }}>
                          {quiz.grade || 'General'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )
      case 'main':
        return (
          <UnifiedDashboard
            userRole="SuperAdmin"
            userId={null}
            allExams={quizzes}
            grades={dbGrades}
            classes={dbClasses}
            subjects={dbSubjects}
            onSeeAllScores={handleSeeAllScores}
          />
        )
      case 'teachers':
        return (
          <div style={{ padding: '2.5rem', background: 'var(--bg-surface)', minHeight: '100vh' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '2.5rem',
              background: 'white',
              padding: '1.5rem 2rem',
              borderRadius: '16px',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div>
                <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Teachers</h1>
                <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Manage and monitor system teacher accounts</p>
              </div>
              <div style={{
                display: 'flex',
                gap: '1rem',
                alignItems: 'center'
              }}>
                <div style={{ position: 'relative', width: '300px' }}>
                  <svg style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '18px', height: '18px', fill: '#9ca3af' }} viewBox="0 0 24 24">
                    <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search teachers..."
                    value={teacherSearchQuery}
                    onChange={(e) => setTeacherSearchQuery(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.625rem 0.625rem 0.625rem 2.5rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '10px',
                      fontSize: '0.9rem',
                      background: 'white',
                      transition: 'all 0.2s',
                    }}
                  />
                </div>
                <div style={{
                  background: 'rgba(59, 130, 246, 0.1)',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  border: '1px solid rgba(59, 130, 246, 0.2)'
                }}>
                  <Users size={20} color="var(--primary)" />
                  <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '1.1rem' }}>{teachers.length} <span style={{ fontWeight: 500, opacity: 0.8 }}>Total</span></span>
                </div>
              </div>
            </div>

            {teachers.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '5rem',
                background: 'white',
                borderRadius: '20px',
                boxShadow: 'var(--shadow-sm)',
                border: '2px dashed #e5e7eb'
              }}>
                <div style={{
                  width: '100px',
                  height: '100px',
                  background: '#f3f4f6',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.5rem'
                }}>
                  <Users size={48} color="#9ca3af" />
                </div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#374151' }}>No Teachers Found</h3>
                <p style={{ color: '#6b7280', maxWidth: '300px', margin: '0.5rem auto' }}>System accounts with the 'Teacher' role will appear here.</p>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: '1.5rem'
              }}>
                {teachers.filter(t => {
                  const q = teacherSearchQuery.toLowerCase();
                  return (t.fullNameEn || '').toLowerCase().includes(q) ||
                    (t.fullNameAr || '').toLowerCase().includes(q) ||
                    (t.email || '').toLowerCase().includes(q);
                }).map((teacher) => (
                  <div
                    key={teacher.id}
                    className="teacher-card"
                    style={{
                      background: 'white',
                      borderRadius: '16px',
                      padding: '1.5rem',
                      boxShadow: 'var(--shadow-sm)',
                      border: '1px solid #f3f4f6',
                      transition: 'all 0.3s ease',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '4px',
                      height: '100%',
                      background: teacher.isActive ? '#10b981' : '#ef4444'
                    }} />

                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{
                          width: '56px',
                          height: '56px',
                          borderRadius: '12px',
                          background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: '1.25rem',
                          fontWeight: 700,
                          boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)'
                        }}>
                          {(teacher.fullNameEn || teacher.fullNameAr || 'T').charAt(0).toUpperCase()}
                        </div>
                        <div style={{ maxWidth: '160px' }}>
                          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {teacher.fullNameEn || teacher.fullNameAr}
                          </h3>
                          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            <Mail size={14} />
                            {teacher.email}
                          </p>
                        </div>
                      </div>
                      <span style={{
                        padding: '0.4rem 0.8rem',
                        borderRadius: '8px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        background: teacher.isActive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        color: teacher.isActive ? '#059669' : '#dc2626',
                        border: `1px solid ${teacher.isActive ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
                        whiteSpace: 'nowrap'
                      }}>
                        {teacher.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </div>

                    <div style={{
                      background: '#f9fafb',
                      borderRadius: '12px',
                      padding: '1rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Exams Created
                        </span>
                        <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                          {teacher.totalExams || 0}
                        </span>
                      </div>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        background: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: 'var(--shadow-xs)',
                        color: 'var(--primary)'
                      }}>
                        <FileText size={20} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      case 'students':
      case 'classes':
      case 'class-students':
        return (
          <StudentsDataGrid
            students={students}
            allExams={quizzes}
            initialExamId={studentFilterExamId}
            initialGrade={studentFilterGrade}
            onStudentClick={showStudentDetail}
          />
        )
      case 'student-detail':
        const student = students.find((s) => s.id === selectedStudentId)
        if (!student) return null

        const scores = Object.values(student.quizScores || {})
        const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0
        const completedExams = scores.length
        const highestScore = scores.length > 0 ? Math.max(...scores) : 0
        const lowestScore = scores.length > 0 ? Math.min(...scores) : 0

        return (
          <div style={{ padding: '2rem', background: '#f9fafb', minHeight: '100vh' }}>
            <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
              <button
                onClick={() => setCurrentSection('students')}
                style={{ padding: '0.75rem 1.5rem', background: '#6b7280', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <Shield size={16} /> Back to Students
              </button>
              <div style={{ background: 'white', borderRadius: '16px', padding: '2rem', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.07)', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginBottom: '2rem' }}>
                  <div style={{ width: '96px', height: '96px', borderRadius: '50%', background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: '700', color: 'white' }}>
                    {student.name?.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: '700', color: '#1f2937', margin: 0 }}>{student.name}</h1>
                    <p style={{ fontSize: '1.125rem', color: '#6b7280', margin: '0.5rem 0 0 0' }}>{student.grade} - {student.class}</p>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  <div style={{ background: '#f0f9ff', padding: '1.5rem', borderRadius: '12px' }}>
                    <div style={{ color: '#0c4a6e', fontWeight: 600 }}>Exams Completed</div>
                    <div style={{ fontSize: '2rem', fontWeight: 700, color: '#0369a1' }}>{completedExams}</div>
                  </div>
                  <div style={{ background: '#f0fdf4', padding: '1.5rem', borderRadius: '12px' }}>
                    <div style={{ color: '#14532d', fontWeight: 600 }}>Average Score</div>
                    <div style={{ fontSize: '2rem', fontWeight: 700, color: '#15803d' }}>{avgScore}%</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      case 'profile':
        return <UserProfile userRole={userRole || 'SuperAdmin'} onBack={() => showSection('main')} />
      default:
        return null
    }
  }, [currentSection, quizzes, teachers, students, dbGrades, dbClasses, selectedStudentId, studentFilterExamId, studentFilterGrade, teacherName, userRole, filters, teacherSearchQuery])

  return (
    <ErrorBoundary>
      <div className="dashboard-container" style={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar
          isExamActive={false}
          currentSection={currentSection}
          showSection={showSection}
          handleLogout={handleLogout}
          userRole={userRole || 'SuperAdmin'}
        />
        <div className="main-content" style={{
          flex: 1,
          overflowY: 'auto',
          animation: 'fadeIn 0.6s ease-out'
        }}>
          <style>
            {`
              @keyframes fadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
              }
            `}
          </style>
          {currentSection !== 'profile' && (
            <div style={{ padding: '1.5rem 2rem 0' }}>
              <div style={{ background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)', padding: '1.5rem 2rem', borderRadius: '16px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ margin: 0 }}>Hello, {teacherName}!</h2>
                  <p style={{ margin: '0.25rem 0 0', color: 'rgba(255,255,255,0.9)' }}>Logged in as <span style={{ color: '#ffffff', fontWeight: 700 }}>{userRole || 'SuperAdmin'}</span></p>
                </div>
                <div style={{ textAlign: 'right', opacity: 0.8 }}>
                  <div>{new Date().toLocaleDateString('en-US', { weekday: 'long' })}</div>
                  <div style={{ fontWeight: 700 }}>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                </div>
              </div>
            </div>
          )}
          {currentView}
        </div>
        <QuizModal title={modalTitle} message={modalMessage} onConfirm={handleModalConfirm} onCancel={handleModalCancel} isActive={isModalActive} />
      </div>
    </ErrorBoundary>
  )
}
