import { useMemo, useRef, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import FileUpload from '../components/FileUpload.jsx'
import RichTextEditor from '../components/RichTextEditor.jsx'
import ProfilePage from '../components/ProfilePage'
import UserProfile from '../components/UserProfile'
import Sidebar from '../components/Sidebar'
import DashboardView from '../components/DashboardView'
import QuizModal from '../components/QuizModal'
import ErrorBoundary from '../components/ErrorBoundary'
import UnifiedDashboard from '../components/UnifiedDashboard'
import DashboardFilters from '../components/DashboardFilters'
import api from '../api/axios.js'
import { storage } from '../utils/storage'
import MultiSelectDropdown from '../components/MultiSelectDropdown'
import ModernSelect from '../components/ModernSelect'
import ModernDatePicker from '../components/ModernDatePicker'
import StudentsDataGrid from '../components/Teacher/StudentsDataGrid'

export default function TeacherPage() {
  const navigate = useNavigate()



  // replicate Teacher.html state
  const [currentSection, setCurrentSection] = useState('main')
  const [currentQuizId, setCurrentQuizId] = useState(null)
  const [currentBankId, setCurrentBankId] = useState(null)
  const [currentClass, setCurrentClass] = useState(null)
  const [currentGrade, setCurrentGrade] = useState(null)
  const [currentQuizQuestions, setCurrentQuizQuestions] = useState([])
  const [selectedBankQuestions, setSelectedBankQuestions] = useState(new Set())
  const [showFileUpload, setShowFileUpload] = useState(false)
  const [isSuperAdminView, setIsSuperAdminView] = useState(false)
  const [selectedTeacherData, setSelectedTeacherData] = useState(null)
  const [currentSubject, setCurrentSubject] = useState(null)
  const [userRole, setUserRole] = useState(null)
  const [teacherName, setTeacherName] = useState('Teacher')
  const bankKeyRef = useRef(null)


  const [quizzes, setQuizzes] = useState([])
  const [questionBanks, setQuestionBanks] = useState([])
  const [currentBankSnapshot, setCurrentBankSnapshot] = useState(null)
  const [students, setStudents] = useState([])
  const [activeQuizSession, setActiveQuizSession] = useState(null)
  const [quizResults, setQuizResults] = useState([])
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false)
  const [quizModalData, setQuizModalData] = useState(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState({})
  const [dbGrades, setDbGrades] = useState([])
  const [dbClasses, setDbClasses] = useState([])
  const [dbSubjects, setDbSubjects] = useState([]) // New state for subjects
  const [filters, setFilters] = useState({
    gradeId: null,
    subjectId: '', // New field
    classId: null,
    startDate: null,
    endDate: null
  })
  const [bankSearchQuery, setBankSearchQuery] = useState('')

  // Modal state
  const [isModalActive, setIsModalActive] = useState(false)
  const [modalTitle, setModalTitle] = useState('')
  const [modalMessage, setModalMessage] = useState('')
  const modalResolveRef = useRef(null)

  const [studentFilterExamId, setStudentFilterExamId] = useState(null)
  const [studentFilterGrade, setStudentFilterGrade] = useState(null)

  function handleSeeAllScores(examId, gradeName = null) {
    console.log('👀 handleSeeAllScores triggered. Exam:', examId, 'Grade:', gradeName)
    setStudentFilterExamId(examId)
    setStudentFilterGrade(gradeName)
    console.log('🔄 Setting section to students')
    setCurrentSection('students')
  }

  useEffect(() => {
    const isSuperAdmin = storage.getItem('isSuperAdminView')
    if (isSuperAdmin === 'true') {
      setIsSuperAdminView(true)
      const teacherData = storage.getItem('selectedTeacherData')
      if (teacherData) {
        setSelectedTeacherData(JSON.parse(teacherData))
      }
      // Clear the flag after loading
      storage.removeItem('isSuperAdminView')
      storage.removeItem('selectedTeacherData')
    }
  }, [])


  useEffect(() => {
    const fetchData = async () => {
      try {
        // Simple Session Cache
        const cachedStudents = sessionStorage.getItem('teacher_students_cache')
        const cachedQuizzes = sessionStorage.getItem('teacher_quizzes_cache')
        const cachedLookup = sessionStorage.getItem('teacher_lookup_cache')

        if (cachedStudents) {
          setStudents(JSON.parse(cachedStudents))
        }
        if (cachedQuizzes) {
          setQuizzes(JSON.parse(cachedQuizzes))
        }
        if (cachedLookup) {
          const lookup = JSON.parse(cachedLookup)
          setDbGrades(lookup.grades || [])
          setDbClasses(lookup.classes || [])
          setDbSubjects(lookup.subjects || [])
        }

        const results = await Promise.allSettled([
          api.get("/examdetail"),    // quizzes [0]
          api.get("/questionbank"),  // question banks [1]
          api.get("/dashboard/lookup-data"), // lookup data (grades/classes) [2]
          api.get("/dashboard/students"), // students [3]
          api.get("/examdetail/subjects") // subjects [4]
        ])

        const quizRes = results[0].status === 'fulfilled' ? results[0].value : { data: [] };
        const questionRes = results[1].status === 'fulfilled' ? results[1].value : { data: [] };
        const lookupRes = results[2].status === 'fulfilled' ? results[2].value : { data: null };
        const studentRes = results[3].status === 'fulfilled' ? results[3].value : { data: [] };
        const subjectsRes = results[4].status === 'fulfilled' ? results[4].value : { data: [] };

        // Log errors
        results.forEach((result, index) => {
          if (result.status === 'rejected') {
            const endpoints = ['/examdetail', '/questionbank', '/dashboard/lookup-data', '/dashboard/students', '/examdetail/subjects'];
            console.error(`❌ API Error for ${endpoints[index]}:`, result.reason);
          }
        });

        if (lookupRes.data) {
          console.log('🔍 Lookup Data Received:', lookupRes.data);
          setDbGrades(lookupRes.data.grades || [])
          setDbClasses(lookupRes.data.classes || [])
          setDbSubjects(lookupRes.data.subjects || [])
          sessionStorage.setItem('teacher_lookup_cache', JSON.stringify(lookupRes.data))
        } else {
          console.warn('⚠️ No lookup data received');
        }

        if (studentRes.data) {
          setStudents(studentRes.data);
          sessionStorage.setItem('teacher_students_cache', JSON.stringify(studentRes.data))
        }

        if (subjectsRes.data) {
          setDbSubjects(subjectsRes.data);
        }

        const quizData = quizRes.data?.value || quizRes.data || [];
        const mappedQuizzes = quizData.map(quiz => {
          const questions = (quiz.questions || []).map(q => ({
            id: q.questionId || q.QuestionId,
            type: q.optionC ? (q.optionD ? 'mcq' : (q.optionA && q.optionB ? 'true_false' : 'fill_blank')) : 'fill_blank',
            question: q.questionTitle || q.QuestionTitle,
            options: [q.optionA, q.optionB, q.optionC, q.optionD].filter(Boolean),
            correct: q.correctAnswer || q.CorrectAnswer,
            marks: q.mark || q.Mark
          }));

          const gradeId = quiz.gradeId || quiz.GradeId;
          const subjectId = quiz.subjectId || quiz.SubjectId;
          
          // Parse raw ClassId string (format: ,10,12,)
          const rawClassId = quiz.classId || quiz.ClassId || '';
          const classIds = typeof rawClassId === 'string' 
            ? rawClassId.split(',').filter(s => s && !isNaN(s)).map(s => parseInt(s, 10))
            : (Array.isArray(quiz.classIds) ? quiz.classIds : []);
          const firstClassId = classIds[0] || null;

          const gradeName = lookupRes.data?.grades?.find(g => String(g.id) === String(gradeId))?.gradeName || '';
          const className = classIds.map(id => lookupRes.data?.classes?.find(c => String(c.id) === String(id))?.className).filter(Boolean).join(', ');

          return {
            examId: quiz.examId || quiz.ExamId,
            id: quiz.examId || quiz.ExamId,
            title: quiz.title || quiz.Title,
            description: quiz.examDescription || quiz.ExamDescription || quiz.description,
            examDescription: quiz.examDescription || quiz.ExamDescription || quiz.description,
            grade: gradeName,
            gradeId: gradeId,
            class: className,
            classId: firstClassId,
            classIds: classIds,
            classNames: quiz.classNames || quiz.ClassNames || [],
            subject: quiz.subjectName || quiz.SubjectName || quiz.examSubject || '',
            subjectId: subjectId,
            startDate: quiz.startDate || quiz.StartDate,
            datetime: quiz.endDate || quiz.EndDate || quiz.datetime,
            endDate: quiz.endDate || quiz.EndDate,
            created: quiz.createdDate || quiz.CreatedDate || quiz.created,
            questions: questions,
            questions_data: questions
          };
        })

        const groupedQuestionBanks = questionRes.data.reduce((acc, question) => {
          const gradeId = question.gradeId;
          const gradeName = lookupRes.data?.grades?.find(g => g.id == gradeId)?.gradeName || '';

          const key = question.bankKey || `${question.questionSubject}-${gradeId}`;
          if (!acc[key]) {
            acc[key] = {
              id: key,
              bankKey: key,
              title: question.bankTitle || `${question.questionSubject} - ${gradeName} Bank`,
              description: question.bankDescription || `Questions for ${question.questionSubject} in ${gradeName}`,
              grade: gradeName,
              gradeId: gradeId,
              subject: question.questionSubject || '',
              created: new Date().toISOString(),
              questions: []
            };
          }
          acc[key].questions.push({
            id: question.questionId,
            type: question.optionC ? (question.optionD ? 'mcq' : (question.optionA && question.optionB ? 'true_false' : 'fill_blank')) : 'fill_blank',
            question: question.questionTitle,
            options: [question.optionA, question.optionB, question.optionC, question.optionD].filter(Boolean),
            correct: question.correctAnswer,
            marks: question.mark
          });
          return acc;
        }, {});

        setQuizzes(mappedQuizzes);
        sessionStorage.setItem('teacher_quizzes_cache', JSON.stringify(mappedQuizzes));
        setQuestionBanks(Object.values(groupedQuestionBanks));
        // setStudents(studentRes.data)
      } catch (err) {
        console.error("Error fetching teacher data:", err)
      }
    }

    fetchData()
  }, [])

  function confirmModal(title, message) {
    return new Promise((resolve) => {
      if (window.confirm(`${title}\n\n${message}`)) {
        resolve(true)
      } else {
        resolve(false)
      }
    })
  }

  // Authentication & Authorization
  useEffect(() => {
    const token = storage.getItem('token')
    const storedUserRole = storage.getItem('userRole')
    setUserRole(storedUserRole)

    if (!token) {
      navigate('/')
    } else {
      // Fetch user profile if logged in
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
    }
  }, [navigate])



  function showModal(title, message) {
    return new Promise((resolve) => {
      setIsModalActive(true)
      setModalTitle(title)
      setModalMessage(message)
      modalResolveRef.current = resolve
    })
  }

  const handleModalConfirm = () => {
    setIsModalActive(false)
    if (modalResolveRef.current) {
      modalResolveRef.current(true)
    }
  }

  const handleModalCancel = () => {
    setIsModalActive(false)
    if (modalResolveRef.current) {
      modalResolveRef.current(false)
    }
  }

  const handleLogout = () => {
    showModal('Confirm Logout', 'Are you sure you want to logout?').then((confirmed) => {
      if (confirmed) {
        // Clear all session data
        storage.clear()
        // Reset state
        setCurrentSection('main')
        setCurrentQuizId(null)
        setCurrentBankId(null)
        // Show CAS login again but keep the shared SSO session for Capstone.
        const casUrl = 'http://localhost:5174'
        const callbackUrl = encodeURIComponent(`${window.location.origin}/sso-callback`)
        window.location.href = `${casUrl}/login?prompt=login&logout=true&redirect=${callbackUrl}&businessEntityId=9`
      }
    })
  }

  const showSection = (section) => {
    setCurrentSection(section)
    setCurrentQuizId(null)
    // Don't reset currentBankId when going to bank-editor (we need it for editing)
    if (section !== 'bank-editor') {
      setCurrentBankId(null)
    }
    setCurrentClass(null)
    setCurrentGrade(null)
    setStudentFilterExamId(null)
    setStudentFilterGrade(null)
    setCurrentQuizQuestions([])
    setSelectedBankQuestions(new Set())
    // setIsRichTextEditorOpen(false) // Removed as it's not defined
    // setEditorTarget(null) // Removed as it's not defined
    setShowFileUpload(false)
  }

  const getTimeUntilDeadline = (datetime) => {
    const now = new Date()
    const deadline = new Date(datetime)
    const diff = deadline - now
    if (diff < 0) return 'Expired'

    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    return `${days}d ${hours}h ${minutes}m`
  }

  function viewQuiz(quizId) {
    setCurrentQuizId(quizId)
    setCurrentSection('quiz-viewer')
  }

  function createNewQuiz() {
    setCurrentQuizId(null)
    setCurrentQuizQuestions([])
    setQuizForm({ title: '', description: '', grade: '', gradeId: '', subjectId: '', subject: '', className: '', classIds: [], datetime: '', startDate: '' })
    setCurrentSection('quiz-editor')
  }

  const [quizForm, setQuizForm] = useState({ title: '', description: '', grade: '', gradeId: '', subjectId: '', subject: '', className: '', classIds: [], datetime: '', startDate: '' })

  function editQuiz(quizId) {
    const quiz = quizzes.find((q) => q.examId === quizId)
    if (!quiz) return
    setCurrentQuizId(quizId)
    setQuizForm({
      title: quiz.title,
      gradeId: quiz.gradeId || '',
      grade: quiz.grade,
      subjectId: quiz.subjectId || '',
      subject: quiz.subject,
      className: quiz.class,
      classIds: (quiz.classIds && quiz.classIds.length > 0) ? quiz.classIds : (quiz.classId ? [quiz.classId] : []),
      datetime: quiz.endDate || '',
      startDate: quiz.startDate || '',
    })
    setCurrentQuizQuestions([...(quiz.questions || [])])
    setCurrentSection('quiz-editor')
  }

  async function deleteQuiz(quizId) {
    confirmModal('Delete Quiz', 'Are you sure you want to delete this quiz?').then(async (c) => {
      if (c) {
        try {
          await api.delete(`/examdetail/${quizId}`)
          setQuizzes((prev) => prev.filter((q) => q.examId !== quizId))
        } catch (err) {
          console.error("Error deleting quiz:", err)
          window.alert("Failed to delete quiz.")
        }
      }
    })
  }

  function renderQuizEditorQuestions() {
    if (currentQuizQuestions.length === 0) {
      return (
        <div className="empty-state" style={{ textAlign: 'center', padding: '3rem 2rem', color: '#94a3b8' }}>
          <h3 className="empty-title" style={{ fontSize: '1.25rem', fontWeight: 700, color: '#475569', marginBottom: '0.5rem' }}>No questions added yet</h3>
          <p className="empty-description" style={{ fontSize: '1rem', color: '#cbd5e1', margin: 0 }}>Add questions from your question banks to build your exam</p>
        </div>
      )
    }
    return currentQuizQuestions.map((questionData, index) => {
      const typeLabel = questionData.type === 'mcq' ? 'Multiple Choice' : questionData.type === 'true_false' ? 'True/False' : 'Fill in the Blank';
      const typeColor = questionData.type === 'mcq' ? '#6366f1' : questionData.type === 'true_false' ? '#f59e0b' : '#10b981';

      return (
        <div key={index} className="question-item" data-question-index={index} style={{
          textAlign: 'left',
          background: 'white',
          borderRadius: '20px',
          padding: '1.5rem',
          marginBottom: '1.5rem',
          border: '1.5px solid #f1f5f9',
          boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
          transition: 'all 0.3s ease',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Accent border */}
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '6px', background: typeColor, opacity: 0.8 }}></div>

          <div className="question-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', paddingBottom: '1rem', borderBottom: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                color: '#475569',
                fontSize: '0.9rem'
              }}>
                {index + 1}
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>
                  {typeof questionData.marks !== 'undefined' ? `Marks: ${questionData.marks}` : 'Question'}
                </h4>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: typeColor, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {typeLabel}
                </span>
              </div>
            </div>

            <button
              className="remove-question-btn"
              style={{
                padding: '.5rem 1rem',
                borderRadius: '10px',
                border: '1.5px solid #fee2e2',
                background: '#fef2f2',
                color: '#ef4444',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.85rem',
                transition: 'all 0.2s'
              }}
              onClick={() => removeQuestionFromQuiz(index)}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = '#ef4444'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.borderColor = '#fee2e2'; }}
            >
              Remove
            </button>
          </div>

          <div className="question-display-text" style={{
            padding: '1.25rem',
            background: '#fcfdfe',
            border: '1px solid #f1f5f9',
            borderRadius: '12px',
            marginBottom: '1.25rem',
            fontSize: '1.05rem',
            lineHeight: '1.6',
            color: '#334155'
          }} dangerouslySetInnerHTML={{ __html: renderRichText(questionData.question) }} />

          {questionData.type === 'mcq' && questionData.options ? (
            <div className="options-display" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {questionData.options.map((option, optionIndex) => {
                const isCorrect = questionData.correct === optionIndex
                return (
                  <div key={optionIndex} className={`option-display-item ${isCorrect ? 'correct' : ''}`} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '.75rem',
                    padding: '0.75rem 1rem',
                    border: `1.5px solid ${isCorrect ? '#86efac' : '#f1f5f9'}`,
                    borderRadius: '12px',
                    background: isCorrect ? '#f0fdf4' : '#ffffff'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', flex: 1 }}>
                      <div className={`option-indicator ${isCorrect ? 'correct' : ''}`} style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: `1.5px solid ${isCorrect ? '#86efac' : '#e2e8f0'}`,
                        background: isCorrect ? '#dcfce7' : '#f8fafc',
                        fontWeight: 800,
                        fontSize: '0.85rem',
                        color: isCorrect ? '#16a34a' : '#64748b'
                      }}>{String.fromCharCode(65 + optionIndex)}</div>
                      <span style={{ fontSize: '0.95rem', color: isCorrect ? '#166534' : '#475569' }} dangerouslySetInnerHTML={{ __html: renderRichText(option) }} />
                    </div>
                    {isCorrect ? (
                      <div style={{
                        color: '#16a34a',
                        background: '#dcfce7',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        textTransform: 'uppercase'
                      }}>Correct</div>
                    ) : null}
                  </div>
                )
              })}
            </div>
          ) : null}

          {questionData.type === 'true_false' ? (
            <div className="true-false-display" style={{ display: 'flex', gap: '1rem' }}>
              <div className={`tf-option ${questionData.correct === true ? 'correct' : ''}`} style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '.75rem',
                padding: '0.75rem 1.25rem',
                border: `1.5px solid ${questionData.correct === true ? '#86efac' : '#f1f5f9'}`,
                borderRadius: '12px',
                background: questionData.correct === true ? '#f0fdf4' : '#fff',
                fontWeight: 700,
                color: questionData.correct === true ? '#166534' : '#64748b'
              }}>
                {questionData.correct === true ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg> : null}
                True
              </div>
              <div className={`tf-option ${questionData.correct === false ? 'correct' : ''}`} style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '.75rem',
                padding: '0.75rem 1.25rem',
                border: `1.5px solid ${questionData.correct === false ? '#86efac' : '#f1f5f9'}`,
                borderRadius: '12px',
                background: questionData.correct === false ? '#f0fdf4' : '#fff',
                fontWeight: 700,
                color: questionData.correct === false ? '#166534' : '#64748b'
              }}>
                {questionData.correct === false ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg> : null}
                False
              </div>
            </div>
          ) : null}

          {questionData.type === 'fill_blank' ? (
            <div className="fill-blank-answer" style={{
              padding: '1rem 1.25rem',
              border: '1.5px solid #f1f5f9',
              borderRadius: '12px',
              background: '#f8fafc',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <span style={{ fontWeight: 800, color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase' }}>Key Answer:</span>
              <span style={{ color: '#1e293b', fontWeight: 600, fontSize: '1.05rem' }} dangerouslySetInnerHTML={{ __html: renderRichText(questionData.correct) }} />
            </div>
          ) : null}
        </div>
      );
    })
  }

  function removeQuestionFromQuiz(indexToRemove) {
    setCurrentQuizQuestions((prev) => prev.filter((_, i) => i !== indexToRemove))
  }

  function renderRichText(text) {
    if (!text) return ''

    let html = text

    // Convert markdown-like formatting to HTML
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>')
    html = html.replace(/__(.*?)__/g, '<u>$1</u>')
    html = html.replace(/\^(.*?)\^/g, '<sup>$1</sup>')
    html = html.replace(/~(.*?)~/g, '<sub>$1</sub>')
    html = html.replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" style="max-width: 100%; height: auto; margin: 10px 0; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" />')

    return html
  }

  function openQuestionBankSelector() {
    setCurrentSection('question-bank-selector')
  }

  function renderSelectableQuestionBanks() {
    const filteredBanks = questionBanks.filter(bank =>
      bank.title.toLowerCase().includes(bankSearchQuery.toLowerCase()) ||
      (bank.subject && bank.subject.toLowerCase().includes(bankSearchQuery.toLowerCase())) ||
      (bank.grade && bank.grade.toLowerCase().includes(bankSearchQuery.toLowerCase()))
    )

    if (filteredBanks.length === 0) {
      return (
        <div className="empty-state" style={{
          gridColumn: '1/-1',
          textAlign: 'center',
          padding: '4rem 2rem',
          background: 'white',
          borderRadius: '20px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
        }}>
          <div style={{ padding: '1rem', background: '#fef2f2', borderRadius: '12px', width: 'fit-content', margin: '0 auto 1.5rem', color: '#dc2626' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1f2937', marginBottom: '0.5rem' }}>No question banks found</h3>
          <p style={{ color: '#6b7280' }}>
            {bankSearchQuery ? `No banks match "${bankSearchQuery}"` : 'Create question banks first to add questions to exams.'}
          </p>
        </div>
      )
    }

    return filteredBanks.map((bank, index) => (
      <div
        key={bank.id}
        className="selectable-bank-item"
        onClick={() => viewSelectableBankQuestions(bank.id)}
        style={{
          background: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderRadius: '24px',
          padding: '2rem',
          boxShadow: '0 10px 30px rgba(0,0,0,0.04), 0 1px 8px rgba(0,0,0,0.02)',
          border: '1px solid rgba(255, 255, 255, 0.6)',
          transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
          position: 'relative',
          overflow: 'hidden',
          animation: `cardEntrance 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards ${index * 0.08}s`,
          opacity: 0,
          transform: 'translateY(30px)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-12px) scale(1.02)'
          e.currentTarget.style.boxShadow = '0 20px 40px rgba(220, 38, 38, 0.15)'
          e.currentTarget.style.borderColor = 'rgba(220, 38, 38, 0.3)'
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.95)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0) scale(1)'
          e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.04), 0 1px 8px rgba(0,0,0,0.02)'
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.6)'
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.8)'
        }}
      >
        {/* Decor Gradient */}
        <div style={{
          position: 'absolute',
          top: '-50px',
          right: '-50px',
          width: '120px',
          height: '120px',
          background: 'radial-gradient(circle, rgba(220, 38, 38, 0.08) 0%, transparent 70%)',
          borderRadius: '50%'
        }}></div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{
            padding: '1rem',
            background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
            borderRadius: '16px',
            color: 'white',
            boxShadow: '0 8px 16px rgba(220, 38, 38, 0.25)'
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.8rem', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Questions</span>
            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#111827', display: 'block' }}>{bank.questions ? bank.questions.length : 0}</span>
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.35rem', fontWeight: 800, color: '#111827', letterSpacing: '-0.01em' }}>{bank.title}</h3>
          <p style={{ fontSize: '0.95rem', color: '#6b7280', lineHeight: 1.6, margin: 0, display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {bank.description || 'No description provided.'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap' }}>
          <span style={{ padding: '0.4rem 0.875rem', borderRadius: '10px', background: '#f8fafc', color: '#475569', fontSize: '0.75rem', fontWeight: 700, border: '1px solid #e2e8f0' }}>{bank.grade}</span>
          <span style={{ padding: '0.4rem 0.875rem', borderRadius: '10px', background: '#fef2f2', color: '#dc2626', fontSize: '0.75rem', fontWeight: 700, border: '1px solid #fee2e2' }}>{bank.subject}</span>
        </div>

        <div style={{ borderTop: '1px solid #f1f3f5', paddingTop: '1.25rem', marginTop: '0.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#9ca3af', fontSize: '0.75rem', fontWeight: 500 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
            {new Date(bank.created).toLocaleDateString()}
          </div>
          <div style={{ color: '#dc2626', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.9rem', fontWeight: 700 }}>
            Open Bank <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
          </div>
        </div>
      </div>
    ))
  }

  function viewSelectableBankQuestions(bankId) {
    setCurrentBankId(bankId)
    setSelectedBankQuestions(new Set())
    setCurrentSection('question-bank-questions-selector')
  }

  const toggleQuestionSelection = (bankId, questionIndex, isSelected) => {
    setSelectedBankQuestions((prev) => {
      const next = new Set(prev)
      const key = `${String(bankId)}::${questionIndex}`
      if (isSelected) next.add(key)
      else next.delete(key)
      return next
    })
  }

  const isQuestionSelected = (bankId, questionIndex) => {
    return selectedBankQuestions.has(`${String(bankId)}::${questionIndex}`)
  }

  const getSelectedCount = () => selectedBankQuestions.size

  function addSelectedQuestionsToQuiz() {
    const added = []
    const normalizeFromBank = (q) => {
      const normalized = { type: q.type, question: q.question, options: q.options || [], correct: q.correct, marks: q.marks ?? 1 }
      if (q.type === 'mcq') {
        if (typeof normalized.correct === 'string') {
          const upper = normalized.correct.trim().toUpperCase()
          const map = { A: 0, B: 1, C: 2, D: 3 }
          if (upper in map) normalized.correct = map[upper]
        }
        if (!Array.isArray(normalized.options)) normalized.options = []
        while (normalized.options.length < 4) normalized.options.push('')
      } else if (q.type === 'true_false') {
        if (typeof normalized.correct === 'string') {
          const t = normalized.correct.trim().toLowerCase()
          if (t === 'true' || t === 't') normalized.correct = true
          if (t === 'false' || t === 'f') normalized.correct = false
        }
      }
      return normalized
    }
    selectedBankQuestions.forEach((key) => {
      const [bankIdStr, idxStr] = key.split('::')
      const bank = questionBanks.find((b) => String(b.id) === String(bankIdStr) || String(b.bankKey) === String(bankIdStr))
      const idx = Number(idxStr)
      if (bank && bank.questions && bank.questions[idx]) {
        const original = bank.questions[idx]
        const q = normalizeFromBank(original)
        if (original && original.id) q.id = original.id
        added.push(q)
      }
    })
    if (added.length === 0) {
      window.alert('Please select at least one question to add')
      return
    }
    setCurrentQuizQuestions((prev) => [...prev, ...added])
    setSelectedBankQuestions(new Set())
    setCurrentSection('quiz-editor')
  }

  function backToQuestionBankSelector() {
    setCurrentSection('question-bank-selector')
  }

  function backToQuizEditor() {
    setCurrentSection('quiz-editor')
  }

  async function saveQuiz() {
    const { title, description, gradeId, subjectId, className, classIds, datetime, startDate } = quizForm
    if (!title.trim()) return window.alert('Please enter a quiz title')
    if (!gradeId) return window.alert('Please select a grade')
    if (!subjectId) return window.alert('Please select a subject')
    if ((!className && (!classIds || classIds.length === 0))) return window.alert('Please select at least one class')
    if (!datetime) return window.alert('Please select date and time for the quiz')
    if (!startDate) return window.alert('Please select a start date for the quiz')
    if (new Date(datetime) <= new Date(startDate)) return window.alert('End date must be after start date')
    if (currentQuizQuestions.length === 0) return window.alert('Please add at least one question to the quiz')

    const quizData = {
      title,
      examSubject: dbSubjects.find(s => String(s.id) === String(subjectId))?.subjectName || '',
      subjectId: subjectId ? Number(subjectId) : null,
      examDescription: description || "",
      gradeId: gradeId ? Number(gradeId) : null,
      classId: classIds[0] ? Number(classIds[0]) : null, // Handle single classId if needed
      classIds: (classIds || []).map(Number),
      startDate,
      endDate: datetime,
      questionIds: currentQuizQuestions.map(q => q.id).filter(Boolean),
      createdBy: (() => { try { const t = storage.getItem('token'); if (!t) return 0; const payload = JSON.parse(atob(t.split('.')[1] || '')); return Number(payload.sub) || 0; } catch { return 0; } })()
    }

    try {
      if (currentQuizId) {
        const response = await api.put(`/examdetail/${currentQuizId}`, { ...quizData })
        const updated = response.data
        setQuizzes((prev) => prev.map((q) => (q.examId === currentQuizId || q.id === currentQuizId)
          ? {
            examId: updated.examId,
            id: updated.examId,
            title: updated.title,
            examDescription: updated.examDescription,
            description: updated.examDescription,
            grade: updated.grade,
            class: updated.class,
            subject: updated.examSubject,
            startDate: updated.startDate,
            datetime: updated.endDate,
            endDate: updated.endDate,
            created: q.created || new Date().toISOString(),
            questions: (updated.questions || []).map(qq => ({
              id: qq.questionId,
              type: qq.optionC ? (qq.optionD ? 'mcq' : (qq.optionA && qq.optionB ? 'true_false' : 'fill_blank')) : 'fill_blank',
              question: qq.questionTitle,
              options: [qq.optionA, qq.optionB, qq.optionC, qq.optionD].filter(Boolean),
              correct: qq.correctAnswer,
              marks: qq.mark
            })),
            questions_data: (updated.questions || []).map(qq => ({
              id: qq.questionId,
              type: qq.optionC ? (qq.optionD ? 'mcq' : (qq.optionA && qq.optionB ? 'true_false' : 'fill_blank')) : 'fill_blank',
              question: qq.questionTitle,
              options: [qq.optionA, qq.optionB, qq.optionC, qq.optionD].filter(Boolean),
              correct: qq.correctAnswer,
              marks: qq.mark
            }))
          }
          : q))
      } else {
        const response = await api.post('/examdetail', { ...quizData })
        const saved = response.data
        const newQuizQuestions = (saved.questions || []).map(qq => ({
          id: qq.questionId,
          type: qq.optionC ? (qq.optionD ? 'mcq' : (qq.optionA && qq.optionB ? 'true_false' : 'fill_blank')) : 'fill_blank',
          question: qq.questionTitle,
          options: [qq.optionA, qq.optionB, qq.optionC, qq.optionD].filter(Boolean),
          correct: qq.correctAnswer,
          marks: qq.mark
        }));

        setQuizzes((prev) => [...prev, {
          examId: saved.examId,
          id: saved.examId,
          title: saved.title,
          examDescription: saved.examDescription,
          description: saved.examDescription,
          grade: saved.grade,
          class: saved.class,
          subject: saved.examSubject,
          startDate: saved.startDate,
          datetime: saved.endDate,
          endDate: saved.endDate,
          created: new Date().toISOString(),
          questions: newQuizQuestions,
          questions_data: newQuizQuestions
        }])
      }
      confirmModal('Quiz Saved', 'Quiz saved successfully!').then(() => {
        showSection('my-quizzes')
      })
    } catch (err) {
      console.error("Error saving quiz:", err)
      console.log("Failed Payload:", quizData) // Log data for debugging

      let errorMsg = err.response?.data?.message || err.message || "Failed to save quiz."

      // Handle ASP.NET Core Validation Errors
      if (err.response?.data?.errors) {
        const validationErrors = Object.entries(err.response.data.errors)
          .map(([field, messages]) => `${field}: ${messages.join(", ")}`)
          .join("\n")
        errorMsg += `\n\nValidation Details:\n${validationErrors}`
      }

      window.alert(`Error: ${errorMsg}`)
    }
  }

  function cancelEdit() {
    confirmModal('Cancel Changes', 'Are you sure you want to cancel? Any unsaved changes will be lost.').then((c) => {
      if (c) setCurrentSection('my-quizzes')
    })
  }

  const [bankForm, setBankForm] = useState(() => ({ title: '', description: '', grade: '', gradeId: '' }))
  const [bankEditorQuestions, setBankEditorQuestions] = useState(() => [])
  const [forceRender, setForceRender] = useState(0)



  function renderQuestionBanksList() {
    if (questionBanks.length === 0) {
      return (
        <div className="empty-state" style={{ textAlign: 'center', padding: '3rem 2rem', color: '#6b7280' }}>
          <svg className="empty-icon" viewBox="0 0 24 24" style={{ width: '48px', height: '48px', fill: '#d1d5db', marginBottom: '1rem' }}>
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
          <h3 className="empty-title" style={{ fontSize: '1.25rem', fontWeight: 600, color: '#374151', margin: '0 0 0.5rem 0' }}>No question banks yet</h3>
          <p className="empty-description" style={{ fontSize: '1rem', color: '#6b7280', margin: 0 }}>Create your first question bank to get started</p>
        </div>
      )
    }
    return questionBanks.map((bank) => (
      <div key={bank.id} className="question-bank-item" style={{ background: 'linear-gradient(180deg,#ffffff 0%,#f9fafb 100%)', border: '1px solid #e5e7eb', borderRadius: '16px', padding: '1.25rem 1.5rem', marginBottom: '1rem', boxShadow: '0 10px 26px rgba(0,0,0,.06)' }}>
        <div className="bank-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
          <div style={{ flex: 1 }}>
            <h3 className="bank-title" style={{ fontSize: '1.25rem', fontWeight: 600, color: '#1f2937', margin: '0 0 0.5rem 0' }}>{bank.title}</h3>
            <div className="bank-meta" style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '.5rem' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '.4rem', background: '#eef2ff', color: '#4338ca', border: '1px solid #c7d2fe', padding: '.2rem .5rem', borderRadius: '999px', fontSize: '.8rem', fontWeight: 700 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M7 11h10v2H7z" /></svg>
                {bank.questions ? bank.questions.length : 0} questions
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '.4rem', background: '#ecfeff', color: '#0e7490', border: '1px solid #bae6fd', padding: '.2rem .5rem', borderRadius: '999px', fontSize: '.8rem', fontWeight: 700 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3h-1V1h-2v2H8V1H6v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" /></svg>
                {new Date(bank.created).toLocaleDateString()}
              </span>
            </div>
            <div className="bank-badges" style={{ display: 'flex', gap: '.5rem', marginBottom: '.5rem' }}>
              <span className="badge badge-grade" style={{ padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '.75rem', fontWeight: 600, background: '#dbeafe', color: '#1e40af' }}>{bank.grade}</span>
              <span className="badge badge-subject" style={{ padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '.75rem', fontWeight: 600, background: '#fef3c7', color: '#92400e' }}>{bank.subject}</span>
            </div>
            <p className="card-description" style={{ fontSize: '.875rem', color: '#6b7280', margin: '0 0 1rem 0' }}>{bank.description}</p>
          </div>
          <div className="bank-actions" style={{ display: 'flex', gap: '.5rem' }}>
            <button className="action-btn view-btn" style={{ padding: '.5rem .75rem', borderRadius: '8px', border: '1px solid #93c5fd', background: 'white', color: '#1d4ed8', cursor: 'pointer', fontWeight: 600, fontSize: '.875rem' }} onClick={() => { console.log('View bank clicked:', bank.id); viewQuestionBank(bank.id); }}>View</button>
            <button className="action-btn edit-btn" style={{ padding: '.5rem .75rem', borderRadius: '8px', border: '1px solid #fcd34d', background: 'white', color: '#92400e', cursor: 'pointer', fontWeight: 600, fontSize: '.875rem' }} onClick={() => editQuestionBank(bank.id)}>Edit</button>
            <button className="action-btn delete-btn" style={{ padding: '.5rem .75rem', borderRadius: '8px', border: '1px solid #fecaca', background: 'white', color: '#991b1b', cursor: 'pointer', fontWeight: 600, fontSize: '.875rem' }} onClick={() => deleteQuestionBank(bank.id)}>Delete</button>
          </div>
        </div>
      </div>
    ))
  }

  function createNewQuestionBank() {
    console.log('🔄 Creating new question bank');
    setCurrentBankId(null)
    setBankForm({ title: '', description: '', grade: '', gradeId: '' })
    setBankEditorQuestions([])
    try {
      bankKeyRef.current = (crypto && crypto.randomUUID) ? crypto.randomUUID() : `bank-${Date.now()}-${Math.random().toString(36).slice(2)}`
    } catch {
      bankKeyRef.current = `bank-${Date.now()}-${Math.random().toString(36).slice(2)}`
    }
    showSection('bank-editor')
  }

  function editQuestionBank(bankId) {
    const bank = questionBanks.find((b) => b.id === bankId)
    if (!bank) return
    setCurrentBankId(bankId)
    bankKeyRef.current = bank.bankKey || bank.id
    setBankForm({
      title: bank.title,
      description: bank.description,
      grade: bank.grade,
      gradeId: bank.gradeId || ''
    })
    setBankEditorQuestions(bank.questions.map(q => {
      let correctedQuestion = { ...q };
      // Preserve the original question ID
      if (q.id) correctedQuestion.id = q.id;

      if (q.type === 'mcq') {
        // Convert A,B,C,D to 0,1,2,3 for correct option
        correctedQuestion.correct = q.options.indexOf(q.correct) !== -1 ? q.options.indexOf(q.correct) : 0; // Default to 0 if not found
      } else if (q.type === 'true_false') {
        correctedQuestion.correct = q.correct === 'True';
      }
      return correctedQuestion;
    }) || []);
    showSection('bank-editor')
  }

  async function deleteQuestionBank(bankId) {
    confirmModal('Delete Question Bank', 'Are you sure you want to delete this question bank and all its questions?').then(async (c) => {
      if (c) {
        try {
          const bankToDelete = questionBanks.find(b => b.id === bankId);
          if (bankToDelete && bankToDelete.questions) {
            for (const question of bankToDelete.questions) {
              await api.delete(`/questionbank/${question.id}`);
            }
          }
          // Simply remove the bank from frontend state - no need to re-fetch
          setQuestionBanks((prev) => prev.filter((b) => b.id !== bankId));
        } catch (err) {
          console.error("Error deleting question bank:", err);
          window.alert("Failed to delete question bank.");
        }
      }
    });
  }

  function viewQuestionBank(bankId) {
    const bank = questionBanks.find((b) => String(b.id) === String(bankId))
    if (bank) {
      setCurrentBankSnapshot(bank)
    } else {
      // Fallback snapshot with minimal info to avoid blank view until data refresh
      setCurrentBankSnapshot({ id: bankId, title: 'Question Bank', description: '', grade: '', subject: '', created: new Date().toISOString(), questions: [] })
    }
    setCurrentBankId(bankId)
    // Navigate without resetting IDs
    setCurrentSection('bank-viewer')
  }

  function addBankQuestion(questionData) {
    setBankEditorQuestions((prev) => [
      // Prepend newest question to the top for faster editing
      questionData
        ? { marks: (questionData.marks ?? 1), ...questionData }
        : {
          type: 'mcq',
          question: '',
          options: ['', '', '', ''],
          correct: 0,
          marks: 1,
          // Don't add an ID for new questions - let the backend assign one
          id: undefined
        },
      ...prev,
    ])
  }

  function handleFileUploadQuestions(questions) {
    if (currentSection === 'bank-editor') {
      // Prepend uploaded questions (keep their order) to the top
      // Keep IDs from backend
      setBankEditorQuestions((prev) => [...questions, ...prev])
    } else if (currentSection === 'quiz-editor') {
      setCurrentQuizQuestions((prev) => [...questions, ...prev])
    }
    setShowFileUpload(false)
  }

  function changeBankQuestionType(index, newType) {
    setBankEditorQuestions((prev) =>
      prev.map((q, i) =>
        i === index
          ? newType === 'mcq'
            ? { type: 'mcq', question: q.question || '', options: ['', '', '', ''], correct: 0, marks: q.marks ?? 1, id: q.id }
            : newType === 'true_false'
              ? { type: 'true_false', question: q.question || '', correct: true, marks: q.marks ?? 1, id: q.id }
              : { type: 'fill_blank', question: q.question || '', correct: '', marks: q.marks ?? 1, id: q.id }
          : q,
      ),
    )
  }

  function removeBankQuestion(index) {
    setBankEditorQuestions((prev) => prev.filter((_, i) => i !== index))
  }

  async function saveQuestionBank() {
    const title = bankForm.title.trim()
    const gradeId = bankForm.gradeId
    const subject = 'Mathematics' // Assuming subject is always Mathematics for now

    if (!title) return window.alert('Please enter a bank title')
    if (!gradeId) return window.alert('Please select a grade')
    const questionsToSave = bankEditorQuestions.filter((q) => q.question.trim())
    if (questionsToSave.length === 0) return window.alert('Please add at least one question')

    try {
      if (currentBankId) {
        // For existing bank, get all current question IDs from the editor
        const currentQuestionIds = new Set(questionsToSave.map(q => q.id).filter(Boolean));
        const existingBank = questionBanks.find(b => b.id === currentBankId);
        const originalQuestionIds = new Set((existingBank?.questions || []).map(q => q.id));

        // Find questions that were removed (in original but not in current)
        const removedQuestionIds = Array.from(originalQuestionIds).filter(id => !currentQuestionIds.has(id));

        // Extract accountId from token once
        let accountId = 0;
        try {
          const token = storage.getItem('token');
          if (token) {
            const payload = JSON.parse(atob(token.split('.')[1] || ''));
            accountId = Number(payload.sub) || 0;
          }
        } catch (e) {
          console.error('Error extracting accountId from token:', e);
        }

        if (accountId <= 0) {
          throw new Error('Unable to get user account ID. Please log in again.');
        }

        // Update or create questions
        for (const q of questionsToSave) {
          const questionPayload = {
            bankKey: bankKeyRef.current || currentBankId,
            accountId: accountId,
            questionTitle: q.question,
            optionA: q.options[0] || '',
            optionB: q.options[1] || '',
            optionC: q.options[2] || '',
            optionD: q.options[3] || '',
            usedOptions: q.options.length,
            correctAnswer: q.type === 'mcq' ? String.fromCharCode(65 + (Number(q.correct) || 0)) : String(q.correct),
            questionSubject: 'Mathematics',
            mark: q.marks || 1,
            gradeId: bankForm.gradeId ? Number(bankForm.gradeId) : null,
            bankTitle: title,
            bankDescription: bankForm.description || '',
          };

          if (q.id && originalQuestionIds.has(q.id)) {
            // Update existing question
            await api.put(`/questionbank/${q.id}`, questionPayload);
          } else {
            // Create new question in this bank
            await api.post('/questionbank', questionPayload);
          }
        }

        // Delete questions that were removed from the bank
        for (const removedQuestionId of removedQuestionIds) {
          await api.delete(`/questionbank/${removedQuestionId}`);
        }

      } else {
        // For a new bank, create all questions
        // Extract accountId from token once
        let accountId = 0;
        try {
          const token = storage.getItem('token');
          if (token) {
            const payload = JSON.parse(atob(token.split('.')[1] || ''));
            accountId = Number(payload.sub) || 0;
          }
        } catch (e) {
          console.error('Error extracting accountId from token:', e);
        }

        if (accountId <= 0) {
          throw new Error('Unable to get user account ID. Please log in again.');
        }

        if (!bankKeyRef.current) {
          throw new Error('Bank key is missing. Please try creating the bank again.');
        }

        for (const q of questionsToSave) {
          const questionPayload = {
            bankKey: bankKeyRef.current,
            bankTitle: title,
            bankDescription: bankForm.description || '',
            gradeId: bankForm.gradeId ? Number(bankForm.gradeId) : null,
            questionTitle: q.question,
            optionA: q.options?.[0] || '',
            optionB: q.options?.[1] || '',
            optionC: q.options?.[2] || '',
            optionD: q.options?.[3] || '',
            usedOptions: q.options?.length || 4,
            correctAnswer: q.type === 'mcq' ? String.fromCharCode(65 + (Number(q.correct) || 0)) : String(q.correct),
            questionSubject: 'Mathematics',
            mark: q.marks ?? 1,
            accountId: accountId
          };

          if (q.id) {
            await api.put(`/questionbank/${q.id}`, questionPayload);
          } else {
            await api.post('/questionbank', questionPayload);
          }
        }
      }
      // Update the frontend state directly instead of re-fetching
      if (currentBankId) {
        // Update existing bank in state
        setQuestionBanks((prev) => prev.map((bank) =>
          bank.id === currentBankId
            ? {
              ...bank,
              title: title,
              description: bankForm.description || '',
              grade: dbGrades.find(g => g.id == bankForm.gradeId)?.gradeName || bank.grade,
              questions: questionsToSave.map(q => ({
                id: q.id,
                type: q.type,
                question: q.question,
                options: q.options || [],
                correct: q.correct,
                marks: q.marks ?? 1
              }))
            }
            : bank
        ));
      } else {
        // Add new bank to state
        const newBank = {
          id: bankKeyRef.current,
          bankKey: bankKeyRef.current,
          title: title,
          description: bankForm.description || '',
          gradeId: bankForm.gradeId,
          grade: dbGrades.find(g => g.id == bankForm.gradeId)?.gradeName || '',
          subject: subject,
          created: new Date().toISOString(),
          questions: questionsToSave.map(q => ({
            id: q.id,
            type: q.type,
            question: q.question,
            options: q.options || [],
            correct: q.correct,
            marks: q.marks ?? 1
          }))
        };
        setQuestionBanks((prev) => [...prev, newBank]);
      }

      confirmModal('Question Bank Saved', 'Question bank saved successfully!').then(() => {
        showSection('question-banks');
      });
    } catch (err) {
      console.error("Error saving question bank:", err);
      // Show detailed error message
      let errorMessage = "Failed to save question bank.";
      if (err.code === 'ERR_NETWORK' || err.message?.includes('Network Error') || !err.response) {
        errorMessage = "Failed to fetch (API error). Please check if the server is running and try again.";
      } else if (err.response?.data?.message) {
        errorMessage = `Failed to save question bank: ${err.response.data.message}`;
      } else if (err.response?.data?.errors) {
        errorMessage = `Validation errors: ${JSON.stringify(err.response.data.errors)}`;
      } else if (err.message) {
        errorMessage = `Failed to save question bank: ${err.message}`;
      }
      console.error("Full error response:", err.response?.data);
      window.alert(errorMessage);
    }
  }

  function cancelBankEdit() {
    confirmModal('Cancel Changes', 'Are you sure you want to cancel? Any unsaved changes will be lost.').then((c) => {
      if (c) showSection('question-banks')
    })
  }

  function getClassCategories() {
    const map = new Map()
    students.forEach((s) => {
      const key = `${s.grade}-${s.class}`
      if (!map.has(key)) map.set(key, { grade: s.grade, class: s.class, students: [] })
      map.get(key).students.push(s)
    })
    return Array.from(map.values())
  }

  function getGrades() {
    const grades = [...new Set(students.map(s => s.grade))].filter(g => g && g !== 'N/A')
    const order = ['Junior', 'Wheeler', 'Senior']
    return grades.sort((a, b) => {
      const idxA = order.indexOf(a)
      const idxB = order.indexOf(b)
      if (idxA !== -1 && idxB !== -1) return idxA - idxB
      if (idxA !== -1) return -1
      if (idxB !== -1) return 1
      return a.localeCompare(b)
    })
  }

  function getClassesForGrade(grade) {
    const classes = [...new Set(students.filter(s => s.grade === grade).map(s => s.class))]
    return classes.sort()
  }

  function getStudentsForClass(grade, className) {
    return students.filter(s => s.grade === grade && s.class === className)
  }

  function showGrades() {
    setCurrentSection('students')
    setCurrentGrade(null)
    setCurrentClass(null)
  }

  function showClassesForGrade(grade) {
    setCurrentGrade(grade)
    setCurrentSection('classes')
    setCurrentClass(null)
  }

  function showStudentsForClass(grade, className) {
    setCurrentGrade(grade)
    setCurrentClass({ grade, class: className })
    setCurrentSection('class-students')
  }

  function backToGrades() {
    setCurrentSection('students')
    setCurrentGrade(null)
    setCurrentClass(null)
  }

  function backToClasses() {
    setCurrentSection('classes')
    setCurrentClass(null)
  }

  function showClassStudents(grade, className) {
    setCurrentClass({ grade, class: className })
    setCurrentSection('class-students')
  }

  function backToStudents() {
    if (currentGrade) {
      setCurrentSection('classes')
      setCurrentClass(null)
    } else {
      setCurrentSection('students')
    }
  }

  function backToMain() {
    setCurrentSection('main')
  }

  function showStudentDetail(studentId) {
    setCurrentSection('student-detail')
    setSelectedStudentId(studentId)
  }

  const [selectedStudentId, setSelectedStudentId] = useState(null)

  const resolvedCurrentQuiz = useMemo(() => {
    if (!currentQuizId) return null;
    const byId = quizzes.find(q => String(q.id) === String(currentQuizId));
    if (byId) return byId;
    const byExam = quizzes.find(q => String(q.examId) === String(currentQuizId));
    return byExam || null;
  }, [currentQuizId, quizzes]);

  // IMPORTANT: Rendering guard with useMemo
  // Why: This component renders different large sub-views based on 'currentSection'.
  // We memoize the JSX tree to avoid re-computing heavy views on unrelated state changes.
  // Pitfall: If ANY state referenced inside this function is missing from the dependency array,
  // React will NOT recompute the memoized tree when that state changes. This causes inputs
  // and selects to appear "frozen" (no typing/selection effect) until a different state change
  // forces a re-render (e.g., hot reload), which looks like a rendering bug.
  // Fix: Always include ALL referenced state in the dependency array below. In particular,
  // quiz editor requires 'quizForm' and question bank editor requires 'bankForm',
  // 'bankEditorQuestions', and 'showFileUpload'. Omitting any of these recreates the bug.
  const currentView = useMemo(() => {
    const currentBank = currentBankId ? (questionBanks.find((b) => String(b.id) === String(currentBankId)) || currentBankSnapshot) : null;
    switch (currentSection) {
      case 'main':
        return (
          <UnifiedDashboard
            userRole="Teacher"
            userId={(() => {
              const token = storage.getItem('token')
              if (token) {
                try {
                  const payload = JSON.parse(atob(token.split('.')[1]))
                  return payload.sub || payload.id
                } catch (e) {
                  console.error('Error parsing token:', e)
                }
              }
              return null
            })()}
            allExams={quizzes}
            grades={dbGrades}
            classes={dbClasses}
            subjects={dbSubjects}
            onSeeAllScores={handleSeeAllScores}
          />
        )
      case 'my-quizzes':
        return (
          <div id="quizzes-view">
            <div className="content-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <div>
                <h1 className="content-title" style={{ margin: 0 }}><svg className="title-icon" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" /></svg>My Exams</h1>
                <p className="content-subtitle" style={{ marginTop: '0.25rem' }}>Create and manage your exams</p>
              </div>
              <button className="create-quiz-btn" style={{ background: 'var(--primary)', color: '#fff', border: 'none', padding: '.75rem 1.5rem', borderRadius: '12px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '.5rem', boxShadow: '0 4px 12px rgba(229, 57, 53, 0.3)', cursor: 'pointer', transition: 'all .2s ease' }} onClick={createNewQuiz}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" /></svg>
                Create New Exam
              </button>
            </div>
            <div style={{ marginBottom: '2rem' }}>
              <DashboardFilters
                onFilterChange={(newFilters) => setFilters(newFilters)}
                userRole="Teacher"
                grades={dbGrades}
                classes={dbClasses}
                subjects={dbSubjects}
              />
            </div>
            <div className="quiz-list" id="quiz-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
              {quizzes.filter(quiz => {
                if (filters.gradeId && String(quiz.gradeId) !== String(filters.gradeId)) return false
                if (filters.classId) {
                  const cIds = quiz.classIds || []
                  if (!cIds.some(id => String(id) === String(filters.classId)) && String(quiz.classId) !== String(filters.classId)) return false
                }
                if (filters.startDate && new Date(quiz.startDate) < new Date(filters.startDate)) return false
                if (filters.endDate && new Date(quiz.endDate) > new Date(filters.endDate)) return false
                return true
              }).length === 0 ? (
                <div className="empty-state animate-card" style={{ textAlign: 'center', padding: '4rem 2rem', background: 'var(--bg-main)', borderRadius: '16px', boxShadow: 'var(--shadow-sm)', gridColumn: '1 / -1' }}>
                  <svg className="empty-icon" style={{ width: '80px', height: '80px', fill: 'var(--text-light)', margin: '0 auto 1.5rem' }} viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" /></svg>
                  <h3 className="empty-title" style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '.5rem' }}>No exams match your filters</h3>
                  <p className="empty-description" style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>Try adjusting your filters or create a new exam</p>
                </div>
              ) : (
                quizzes.filter(quiz => {
                  if (filters.gradeId && String(quiz.gradeId) !== String(filters.gradeId)) return false
                  if (filters.classId) {
                    const cIds = quiz.classIds || []
                    if (!cIds.some(id => String(id) === String(filters.classId)) && String(quiz.classId) !== String(filters.classId)) return false
                  }
                  if (filters.startDate && new Date(quiz.startDate) < new Date(filters.startDate)) return false
                  if (filters.endDate && new Date(quiz.endDate) > new Date(filters.endDate)) return false
                  return true
                }).map((quiz, index) => (
                  <div key={quiz.id} className={`quiz-item animate-card stagger-${(index % 5) + 1}`} style={{ background: 'var(--bg-main)', borderRadius: '16px', padding: '1.5rem', boxShadow: 'var(--shadow-md)', borderLeft: '4px solid var(--primary)', transition: 'transform 0.2s ease' }}>
                    <div className="quiz-info">
                      <h3 className="quiz-title" style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>{quiz.title}</h3>
                      <p className="quiz-meta" style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z" /><path d="M12.5 7H11v6l5.25 3.15.75-1.23-4.5-2.67z" /></svg>
                        {new Date(quiz.startDate).toLocaleDateString()}
                      </p>
                      <p className="quiz-description" style={{ color: 'var(--text-secondary)', margin: '1rem 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{quiz.description}</p>
                    </div>
                    <div className="quiz-actions" style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                      <button className="action-btn edit-btn" style={{ flex: 1, padding: '0.5rem', background: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }} onClick={() => editQuiz(quiz.id)}>Edit</button>
                      <button className="action-btn view-btn" style={{ flex: 1, padding: '0.5rem', background: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }} onClick={() => viewQuiz(quiz.id)}>View</button>
                      <button className="action-btn delete-btn" style={{ padding: '0.5rem', background: 'var(--error-bg)', color: 'var(--error)', border: 'none', borderRadius: '8px', cursor: 'pointer' }} onClick={() => deleteQuiz(quiz.id)} aria-label="Delete"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" /></svg></button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )
      case 'available':
        return (
          <DashboardView
            currentSection='available'
            currentSubject={currentSubject}
            setCurrentSubject={setCurrentSubject}
            isQuizActive={activeQuizSession !== null}
            setIsQuizActive={() => { }}
            handleStartQuiz={() => { }}
            handleViewCompletedQuiz={() => { }}
            getTimeUntilDeadline={getTimeUntilDeadline}
            quizzes={quizzes.filter(q => new Date(q.startDate) <= new Date() && new Date(q.datetime) > new Date())}
          />
        )
      case 'completed':
        return (
          <DashboardView
            currentSection='completed'
            currentSubject={currentSubject}
            setCurrentSubject={setCurrentSubject}
            isQuizActive={activeQuizSession !== null}
            setIsQuizActive={() => { }}
            handleStartQuiz={() => { }}
            handleViewCompletedQuiz={() => { }}
            getTimeUntilDeadline={getTimeUntilDeadline}
            quizzes={quizzes.filter(q => new Date(q.datetime) <= new Date())}
          />
        )
      case 'question-banks':
        return (
          <div id="question-banks-view" className="question-banks-view active">
            <div className="content-header" style={{ marginBottom: '1.5rem' }}>
              <h1 className="content-title" style={{ display: 'flex', alignItems: 'center', gap: '.75rem', fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 .5rem 0' }}><svg className="title-icon" style={{ width: '32px', height: '32px', fill: 'var(--primary)' }} viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>Question Banks</h1>
              <p className="content-subtitle" style={{ fontSize: '1rem', color: 'var(--text-secondary)', margin: 0 }}>Create and manage reusable question collections for your exams</p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <div className="question-banks-header-actions">
                <button className="create-bank-btn" style={{ background: 'var(--primary)', color: '#fff', border: 'none', padding: '.75rem 1.25rem', borderRadius: '10px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '.5rem', boxShadow: '0 4px 12px rgba(229, 57, 53, 0.3)', cursor: 'pointer', transition: 'all .2s ease' }} onClick={createNewQuestionBank}><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" /></svg>Create New Bank</button>
              </div>
            </div>
            <div className="question-banks-grid" id="question-banks-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
              {questionBanks.length === 0 ? (
                <div className="empty-state animate-card" style={{ textAlign: 'center', padding: '4rem 2rem', background: 'var(--bg-main)', borderRadius: '16px', boxShadow: 'var(--shadow-sm)', gridColumn: '1 / -1' }}>
                  <svg className="empty-icon" style={{ width: '80px', height: '80px', fill: 'var(--text-light)', margin: '0 auto 1.5rem' }} viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                  <h3 className="empty-title" style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '.5rem' }}>No question banks yet</h3>
                  <p className="empty-description" style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>Create your first question bank to get started</p>
                </div>
              ) : (
                questionBanks.map((bank, index) => (
                  <div key={bank.id} className={`bank-card animate-card stagger-${(index % 5) + 1}`} style={{ background: 'var(--bg-main)', borderRadius: '16px', padding: '1.5rem', boxShadow: 'var(--shadow-md)', borderLeft: '4px solid var(--warning)', transition: 'transform 0.2s ease' }}>
                    <div className="bank-header">
                      <h3 className="bank-title" style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>{bank.title}</h3>
                      <div className="bank-meta" style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span>{bank.questions ? bank.questions.length : 0} questions</span>
                        <span>•</span>
                        <span>Created {new Date(bank.created).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="bank-actions" style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                      <button className="action-btn edit-btn" style={{ flex: 1, padding: '0.5rem', background: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }} onClick={() => editQuestionBank(bank.id)}>Edit</button>
                      <button className="action-btn delete-btn" style={{ padding: '0.5rem', background: 'var(--error-bg)', color: 'var(--error)', border: 'none', borderRadius: '8px', cursor: 'pointer' }} onClick={() => deleteQuestionBank(bank.id)} aria-label="Delete"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" /></svg></button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )
      case 'bank-editor':
        console.log('🏗️ RENDERING bank-editor case');
        console.log('bankForm state:', bankForm);
        console.log('bankEditorQuestions state:', bankEditorQuestions);
        return (
          <div id="bank-editor" className="bank-editor active" style={{ padding: '2rem', background: '#f8fafc', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: '100%', maxWidth: '1400px' }}>
              <div className="bank-editor-header" style={{ marginBottom: '2.5rem' }}>
                <h1 className="bank-editor-title" id="bank-editor-title" style={{ fontSize: '2.25rem', fontWeight: 800, color: '#0f172a', margin: '0 0 .5rem 0', letterSpacing: '-0.02em' }}>{currentBankId ? 'Edit Question Bank' : 'Create New Question Bank'}</h1>
                <p style={{ fontSize: '1.1rem', color: '#64748b', margin: 0, fontWeight: 500 }}>Build a collection of reusable questions for your exams</p>
              </div>
              <div className="bank-editor-content" style={{ background: 'white', borderRadius: '12px', padding: '2rem', boxShadow: '0 4px 18px rgba(0,0,0,.06)' }}>
                <div className="form-group" style={{ marginBottom: '2.5rem', background: '#f8fafc', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                  <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                    <div>
                      <label className="form-label" htmlFor="bank-title" style={{ display: 'block', fontSize: '.875rem', fontWeight: 700, color: '#1f2937', marginBottom: '.625rem', letterSpacing: '0.01em' }}>Bank Title <span className="required" style={{ color: '#dc2626' }}>*</span></label>
                      <input
                        type="text"
                        id="bank-title"
                        className="form-input"
                        style={{ width: '100%', padding: '0.875rem 1rem', border: '2px solid #e5e7eb', borderRadius: '12px', fontSize: '1rem', background: 'white', outline: 'none', transition: 'all 0.2s' }}
                        placeholder="e.g., Mathematics Midterm Bank"
                        value={bankForm?.title || ''}
                        onChange={(e) => setBankForm(prev => ({ ...prev, title: e.target.value }))}
                        onFocus={(e) => { e.target.style.borderColor = '#dc2626'; e.target.style.boxShadow = '0 0 0 4px rgba(220, 38, 38, 0.1)'; }}
                        onBlur={(e) => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none'; }}
                      />
                    </div>
                    <div>
                      <label className="form-label" htmlFor="bank-description" style={{ display: 'block', fontSize: '.875rem', fontWeight: 700, color: '#1f2937', marginBottom: '.625rem', letterSpacing: '0.01em' }}>Description</label>
                      <input
                        type="text"
                        id="bank-description"
                        className="form-input"
                        style={{ width: '100%', padding: '0.875rem 1rem', border: '2px solid #e5e7eb', borderRadius: '12px', fontSize: '1rem', background: 'white', outline: 'none', transition: 'all 0.2s' }}
                        placeholder="Briefly describe what this bank contains"
                        value={bankForm?.description || ''}
                        onChange={(e) => setBankForm(prev => ({ ...prev, description: e.target.value }))}
                        onFocus={(e) => { e.target.style.borderColor = '#dc2626'; e.target.style.boxShadow = '0 0 0 4px rgba(220, 38, 38, 0.1)'; }}
                        onBlur={(e) => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none'; }}
                      />
                    </div>
                  </div>
                  <div className="form-row-three" style={{ display: 'grid', gridTemplateColumns: 'minmax(250px, 1fr) auto', gap: '1.5rem', alignItems: 'end' }}>
                    <div>
                      <ModernSelect
                        id="bank-grade"
                        label="Target Grade"
                        placeholder="Select a grade"
                        value={bankForm?.gradeId || ''}
                        options={dbGrades.map(g => ({ id: g.id, value: g.id, label: g.gradeName }))}
                        onChange={(e) => setBankForm(prev => ({ ...prev, gradeId: e.target.value }))}
                      />
                    </div>
                    <div className="add-question-quiz-button-container" style={{ display: 'flex', gap: '1rem' }}>
                      <button
                        className="add-question-btn"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '.625rem',
                          padding: '0.875rem 1.75rem',
                          background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '12px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          boxShadow: '0 8px 20px rgba(220, 38, 38, 0.2)',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                        }}
                        onClick={() => addBankQuestion()}
                        onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                        onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
                        Add Question
                      </button>
                      <button
                        className="add-question-btn upload-file"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '.625rem',
                          padding: '0.875rem 1.75rem',
                          background: 'white',
                          color: '#dc2626',
                          border: '2px solid #dc2626',
                          borderRadius: '12px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                        }}
                        onClick={() => setShowFileUpload(true)}
                        onMouseEnter={(e) => { e.target.style.background = '#fef2f2'; e.target.style.transform = 'translateY(-2px)'; }}
                        onMouseLeave={(e) => { e.target.style.background = 'white'; e.target.style.transform = 'translateY(0)'; }}
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                        Upload File
                      </button>
                    </div>
                  </div>
                </div>

                <div className="questions-section" style={{ marginTop: '2rem', width: '100%', maxWidth: '1200px', margin: '2rem auto 0 auto' }}>
                  <div className="questions-header" style={{ marginBottom: '1.5rem' }}><h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Questions ({bankEditorQuestions.length})</h3></div>
                  <div id="bank-questions-container" style={{
                    minHeight: '300px',
                    background: '#f8fafc',
                    border: '2px dashed #e2e8f0',
                    borderRadius: '24px',
                    padding: '3rem',
                    textAlign: 'center',
                    marginBottom: '2.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1.5rem',
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}>
                    {bankEditorQuestions.length === 0 ? (
                      <div style={{ margin: 'auto' }}>
                        <div style={{ width: '64px', height: '64px', background: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><path d="M12 8v8" /><path d="M8 12h8" /></svg>
                        </div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', marginBottom: '0.5rem' }}>No questions added yet</h3>
                        <p style={{ color: '#6b7280' }}>Click "Add Question" to start building your question bank</p>
                      </div>
                    ) : bankEditorQuestions.map((q, i) => (
                      <div
                        key={i}
                        className="question-item animate-fadeIn"
                        style={{
                          background: 'white',
                          border: '1px solid #e2e8f0',
                          borderRadius: '24px',
                          padding: '2rem',
                          boxShadow: '0 10px 30px rgba(0,0,0,0.04)',
                          textAlign: 'left',
                          position: 'relative',
                          transition: 'transform 0.3s ease, box-shadow 0.3s ease'
                        }}
                      >
                        <div className="question-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', paddingBottom: '1.25rem', borderBottom: '1px solid #f1f5f9' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <span style={{
                              width: '40px',
                              height: '40px',
                              background: '#fef2f2',
                              color: '#dc2626',
                              borderRadius: '12px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              fontSize: '1.1rem'
                            }}>
                              {i + 1}
                            </span>
                            <h4 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111827', margin: 0 }}>Question Details</h4>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ width: '200px' }}>
                              <ModernSelect
                                value={q.type}
                                options={[
                                  { value: 'mcq', label: 'Multiple Choice' },
                                  { value: 'true_false', label: 'True/False' },
                                  { value: 'fill_blank', label: 'Fill in the Blank' }
                                ]}
                                onChange={(e) => changeBankQuestionType(i, e.target.value)}
                                placeholder="Question Type"
                              />
                            </div>
                            <button
                              className="remove-question-btn"
                              style={{
                                padding: '0.625rem 1.25rem',
                                borderRadius: '10px',
                                border: '1px solid #fee2e2',
                                background: '#fef2f2',
                                color: '#dc2626',
                                cursor: 'pointer',
                                fontWeight: 700,
                                fontSize: '.875rem',
                                transition: 'all 0.2s'
                              }}
                              onClick={() => removeBankQuestion(i)}
                              onMouseEnter={(e) => { e.target.style.background = '#dc2626'; e.target.style.color = 'white'; }}
                              onMouseLeave={(e) => { e.target.style.background = '#fef2f2'; e.target.style.color = '#dc2626'; }}
                            >
                              Remove
                            </button>
                          </div>
                        </div>

                        <div style={{ marginBottom: '2rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                            <label style={{ fontSize: '.95rem', color: '#4b5563', fontWeight: 700, letterSpacing: '0.01em' }}>Question Text</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <label style={{ fontSize: '.875rem', fontWeight: 700, color: '#4b5563' }}>Marks</label>
                              <input
                                type="number"
                                min="0"
                                step="0.5"
                                placeholder="1"
                                value={q.marks ?? 1}
                                onChange={(e) => setBankEditorQuestions((prev) => prev.map((qq, idx) => (idx === i ? { ...qq, marks: Number(e.target.value) } : qq)))}
                                style={{ width: '80px', padding: '0.5rem 0.75rem', border: '2px solid #e5e7eb', borderRadius: '10px', fontSize: '0.95rem', fontWeight: 700, outline: 'none', textAlign: 'center' }}
                              />
                            </div>
                          </div>
                          <div style={{ border: '2px solid #e5e7eb', borderRadius: '16px', minHeight: '160px', background: 'white', padding: '0.5rem', transition: 'border-color 0.2s' }} onFocusCapture={(e) => e.currentTarget.style.borderColor = '#dc2626'} onBlurCapture={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}>
                            <RichTextEditor
                              value={q.question}
                              onChange={(value) => setBankEditorQuestions((prev) => prev.map((qq, idx) => (idx === i ? { ...qq, question: value } : qq)))}
                              placeholder="Type your question content here..."
                              autoFocus={i === 0}
                            />
                          </div>
                        </div>

                        <div className="question-options" style={{ marginTop: '1.5rem' }}>
                          <label style={{ display: 'block', fontSize: '.95rem', color: '#4b5563', fontWeight: 700, marginBottom: '1rem', letterSpacing: '0.01em' }}>
                            {q.type === 'mcq' ? 'Define Options & Correct Answer' : q.type === 'true_false' ? 'Select Correct Statement' : 'Correct Answer'}
                          </label>

                          {q.type === 'mcq' && (
                            <div className="options-container" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                              {q.options.map((opt, idx) => (
                                <div
                                  key={idx}
                                  className="option-item"
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '1rem',
                                    padding: '1rem',
                                    border: `2px solid ${q.correct === idx ? '#dc2626' : '#f1f5f9'}`,
                                    borderRadius: '16px',
                                    background: q.correct === idx ? '#fef2f2' : 'white',
                                    transition: 'all 0.2s',
                                    boxShadow: q.correct === idx ? '0 4px 12px rgba(220, 38, 38, 0.08)' : 'none'
                                  }}
                                >
                                  <div
                                    onClick={() => setBankEditorQuestions((prev) => prev.map((qq, qi) => (qi === i ? { ...qq, correct: idx } : qq)))}
                                    style={{
                                      width: '32px',
                                      height: '32px',
                                      borderRadius: '50%',
                                      border: `2px solid ${q.correct === idx ? '#dc2626' : '#d1d5db'}`,
                                      background: q.correct === idx ? '#dc2626' : 'white',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      cursor: 'pointer',
                                      flexShrink: 0
                                    }}
                                  >
                                    {q.correct === idx && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
                                  </div>
                                  <div style={{ flex: 1 }}>
                                    <input
                                      type="text"
                                      value={opt}
                                      onChange={(e) => setBankEditorQuestions((prev) => prev.map((qq, qi) => (qi === i ? { ...qq, options: qq.options.map((o, oi) => (oi === idx ? e.target.value : o)) } : qq)))}
                                      placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                                      style={{ width: '100%', padding: '0.4rem', border: 'none', background: 'transparent', fontSize: '1rem', fontWeight: 600, color: '#1f2937', outline: 'none' }}
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {q.type === 'true_false' && (
                            <div className="true-false-options" style={{ display: 'flex', gap: '1.25rem' }}>
                              {['True', 'False'].map((val) => {
                                const boolVal = val === 'True';
                                const isSelected = q.correct === boolVal;
                                return (
                                  <button
                                    key={val}
                                    onClick={() => setBankEditorQuestions((prev) => prev.map((qq, qi) => (qi === i ? { ...qq, correct: boolVal } : qq)))}
                                    style={{
                                      flex: 1,
                                      padding: '1.25rem',
                                      borderRadius: '16px',
                                      border: `2px solid ${isSelected ? '#dc2626' : '#f1f5f9'}`,
                                      background: isSelected ? '#fef2f2' : 'white',
                                      color: isSelected ? '#dc2626' : '#64748b',
                                      fontWeight: 800,
                                      fontSize: '1.1rem',
                                      cursor: 'pointer',
                                      transition: 'all 0.2s',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      gap: '0.75rem'
                                    }}
                                  >
                                    <div style={{
                                      width: '24px',
                                      height: '24px',
                                      borderRadius: '50%',
                                      border: `2px solid ${isSelected ? '#dc2626' : '#cbd5e1'}`,
                                      background: isSelected ? '#dc2626' : 'white',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center'
                                    }}>
                                      {isSelected && <div style={{ width: '10px', height: '10px', background: 'white', borderRadius: '50%' }} />}
                                    </div>
                                    {val}
                                  </button>
                                );
                              })}
                            </div>
                          )}

                          {q.type === 'fill_blank' && (
                            <div style={{ border: '2px solid #e5e7eb', borderRadius: '16px', minHeight: '120px', background: 'white', padding: '0.5rem' }}>
                              <RichTextEditor
                                value={q.correct}
                                onChange={(value) => setBankEditorQuestions((prev) => prev.map((qq, qi) => (qi === i ? { ...qq, correct: value } : qq)))}
                                placeholder="Enter the correct answer text..."
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="editor-actions" style={{ display: 'flex', gap: '1.25rem', marginTop: '2.5rem', paddingTop: '2.5rem', borderTop: '1px solid #e5e7eb' }}>
                  <button
                    className="save-btn"
                    style={{
                      padding: '1rem 2.5rem',
                      background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '14px',
                      fontWeight: 800,
                      fontSize: '1.1rem',
                      cursor: 'pointer',
                      boxShadow: '0 8px 25px rgba(220, 38, 38, 0.25)',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                    onClick={saveQuestionBank}
                    onMouseEnter={(e) => e.target.style.transform = 'translateY(-3px)'}
                    onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                  >
                    Save Question Bank
                  </button>
                  <button
                    className="cancel-btn"
                    style={{
                      padding: '1rem 2.5rem',
                      background: 'white',
                      color: '#64748b',
                      border: '2px solid #e2e8f0',
                      borderRadius: '14px',
                      fontWeight: 700,
                      fontSize: '1.1rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onClick={cancelBankEdit}
                    onMouseEnter={(e) => { e.target.style.background = '#f8fafc'; e.target.style.borderColor = '#cbd5e1'; }}
                    onMouseLeave={(e) => { e.target.style.background = 'white'; e.target.style.borderColor = '#e2e8f0'; }}
                  >
                    Cancel
                  </button>
                </div>
                {showFileUpload ? (
                  <FileUpload
                    onQuestionsExtracted={handleFileUploadQuestions}
                    onClose={() => setShowFileUpload(false)}
                    bankKey={bankKeyRef.current}
                  />
                ) : null}
              </div>
            </div>
          </div>
        )
      case 'bank-viewer':
        return currentBank && (
          <div id="bank-viewer" className="bank-viewer active" style={{ padding: '2rem', background: '#f8fafc', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: '100%', maxWidth: '1400px' }}>
              <div className="bank-viewer-header" style={{ marginBottom: '2.5rem' }}>
                <h1 className="bank-viewer-title" id="bank-viewer-title" style={{ fontSize: '2.25rem', fontWeight: 800, color: '#0f172a', margin: '0 0 .5rem 0', letterSpacing: '-0.02em' }}>{currentBank.title}</h1>
                <p style={{ fontSize: '1.1rem', color: '#64748b', margin: 0, fontWeight: 500 }}>View question bank content and questions</p>
              </div>
              <div className="bank-viewer-content" style={{ background: 'white', borderRadius: '12px', padding: '2rem', boxShadow: '0 4px 18px rgba(0,0,0,.06)' }}>
                <div className="bank-info-section" style={{ marginBottom: '2rem' }}>
                  <div className="bank-info-grid" id="bank-info-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div className="bank-info-item" style={{ padding: '1rem', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}><div className="bank-info-label" style={{ fontSize: '.75rem', fontWeight: 600, color: '#6b7280', marginBottom: '0.25rem' }}>Subject</div><div className="bank-info-value" style={{ fontSize: '1rem', fontWeight: 600, color: '#1f2937' }}>{currentBank.subject}</div></div>
                    <div className="bank-info-item" style={{ padding: '1rem', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}><div className="bank-info-label" style={{ fontSize: '.75rem', fontWeight: 600, color: '#6b7280', marginBottom: '0.25rem' }}>Grade</div><div className="bank-info-value" style={{ fontSize: '1rem', fontWeight: 600, color: '#1f2937' }}>{currentBank.grade}</div></div>
                    <div className="bank-info-item" style={{ padding: '1rem', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}><div className="bank-info-label" style={{ fontSize: '.75rem', fontWeight: 600, color: '#6b7280', marginBottom: '0.25rem' }}>Questions</div><div className="bank-info-value" style={{ fontSize: '1rem', fontWeight: 600, color: '#1f2937' }}>{currentBank.questions ? currentBank.questions.length : 0}</div></div>
                    <div className="bank-info-item" style={{ padding: '1rem', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}><div className="bank-info-label" style={{ fontSize: '.75rem', fontWeight: 600, color: '#6b7280', marginBottom: '0.25rem' }}>Created</div><div className="bank-info-value" style={{ fontSize: '1rem', fontWeight: 600, color: '#1f2937' }}>{new Date(currentBank.created).toLocaleDateString()}</div></div>
                  </div>
                  <div id="bank-description-display" style={{ padding: '1rem', background: '#f0f9ff', borderRadius: '8px', border: '1px solid #bae6fd' }}>{currentBank.description ? <p className="description-text" style={{ fontSize: '.875rem', color: '#0c4a6e', margin: 0 }}>{currentBank.description}</p> : null}</div>
                </div>
                <div className="questions-display" id="bank-questions-display">
                  {currentBank.questions && currentBank.questions.length > 0 ? (
                    currentBank.questions.map((question, index) => (
                      <div key={index} className="question-display-item">
                        <div className="question-display-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '.75rem', marginBottom: '.5rem' }}>
                          <h4 style={{ margin: 0 }}>Question {index + 1} {typeof question.marks !== 'undefined' ? `(Marks: ${question.marks})` : ''}</h4>
                          <span className={`question-type-badge type-${question.type}`} style={{ padding: '.25rem .5rem', borderRadius: '999px', border: '1px solid #e5e7eb', fontSize: '.75rem', fontWeight: 700 }}>{question.type === 'mcq' ? 'Multiple Choice' : question.type === 'true_false' ? 'True/False' : 'Fill in the Blank'}</span>
                        </div>
                        <div className="question-stem" style={{ padding: '.5rem .75rem', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', marginBottom: '.75rem' }} dangerouslySetInnerHTML={{ __html: renderRichText(question.question) }} />
                        {question.type === 'mcq' && question.options ? (
                          <div className="options-display" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.5rem' }}>
                            {question.options.map((option, optionIndex) => (
                              <div key={optionIndex} className={`option-display-item ${question.correct === optionIndex ? 'correct' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '.5rem', padding: '.5rem .75rem', border: '1px solid #e5e7eb', borderRadius: '8px', background: '#ffffff' }}>
                                <div className={`option-indicator ${question.correct === optionIndex ? 'correct' : ''}`} style={{ width: '24px', height: '24px', borderRadius: '999px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e5e7eb', background: question.correct === optionIndex ? '#dcfce7' : '#f9fafb', fontWeight: 700 }}>{String.fromCharCode(65 + optionIndex)}</div>
                                <span dangerouslySetInnerHTML={{ __html: renderRichText(option) }} />
                              </div>
                            ))}
                          </div>
                        ) : null}
                        {question.type === 'true_false' ? (
                          <div className="true-false-display" style={{ display: 'flex', gap: '1rem' }}><div className={`tf-option ${question.correct === true ? 'correct' : ''}`} style={{ padding: '.5rem .75rem', border: '1px solid #e5e7eb', borderRadius: '6px', background: question.correct === true ? '#dcfce7' : '#fff' }}>True</div><div className={`tf-option ${question.correct === false ? 'correct' : ''}`} style={{ padding: '.5rem .75rem', border: '1px solid #e5e7eb', borderRadius: '6px', background: question.correct === false ? '#dcfce7' : '#fff' }}>False</div></div>
                        ) : null}
                        {question.type === 'fill_blank' ? (
                          <div className="fill-blank-answer" style={{ padding: '.5rem .75rem', border: '1px solid #e5e7eb', borderRadius: '6px', background: '#fff' }}><strong>Answer:</strong> <span dangerouslySetInnerHTML={{ __html: renderRichText(question.correct) }} /></div>
                        ) : null}
                      </div>
                    ))
                  ) : (
                    <div className="empty-state"><h3 className="empty-title">No questions added yet</h3><p className="empty-description">This question bank doesn't have any questions</p></div>
                  )}
                </div>
                <div className="submit-section" style={{ display: 'flex', gap: '1.5rem', marginTop: '3.5rem', paddingTop: '2.5rem', borderTop: '1px solid #e5e7eb' }}>
                  <button
                    type="button"
                    className="back-btn"
                    style={{
                      padding: '1rem 2.25rem',
                      background: 'white',
                      color: '#dc2626',
                      border: '2px solid #dc2626',
                      borderRadius: '14px',
                      fontWeight: 800,
                      fontSize: '1.1rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem'
                    }}
                    onClick={() => showSection('question-banks')}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#dc2626'; e.currentTarget.style.color = 'white'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = '#dc2626'; }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
                    Back to Question Banks
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      case 'quiz-viewer':
        return resolvedCurrentQuiz && (
          <div id="quiz-viewer" className="quiz-viewer active" style={{ padding: '2rem', background: '#f8fafc', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: '100%', maxWidth: '1400px' }}>
              <div className="viewer-header" style={{ marginBottom: '2.5rem' }}>
                <h1 className="viewer-title" id="viewer-title" style={{ fontSize: '2.25rem', fontWeight: 800, color: '#0f172a', margin: '0 0 .5rem 0', letterSpacing: '-0.02em' }}>{resolvedCurrentQuiz.title}</h1>
                <p style={{ fontSize: '1.1rem', color: '#64748b', margin: 0, fontWeight: 500 }}>View exam content and questions</p>
              </div>
              <div className="viewer-content" style={{ background: 'white', borderRadius: '12px', padding: '2rem', boxShadow: '0 4px 18px rgba(0,0,0,.06)' }}>
                <div className="quiz-info-section" style={{ marginBottom: '2rem' }}>
                  <div className="quiz-info-grid" id="quiz-info-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div className="quiz-info-item" style={{ padding: '1rem', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                      <div className="quiz-info-label" style={{ fontSize: '.75rem', fontWeight: 600, color: '#6b7280', marginBottom: '0.25rem' }}>Grade</div>
                      <div className="quiz-info-value" style={{ fontSize: '1rem', fontWeight: 600, color: '#1f2937' }}>{resolvedCurrentQuiz.grade}</div>
                    </div>
                    <div className="quiz-info-item" style={{ padding: '1rem', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                      <div className="quiz-info-label" style={{ fontSize: '.75rem', fontWeight: 600, color: '#6b7280', marginBottom: '0.25rem' }}>Class</div>
                      <div className="quiz-info-value" style={{ fontSize: '1rem', fontWeight: 600, color: '#1f2937' }}>{resolvedCurrentQuiz.class}</div>
                    </div>
                    <div className="quiz-info-item" style={{ padding: '1rem', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                      <div className="quiz-info-label" style={{ fontSize: '.75rem', fontWeight: 600, color: '#6b7280', marginBottom: '0.25rem' }}>Start Date</div>
                      <div className="quiz-info-value" style={{ fontSize: '1rem', fontWeight: 600, color: '#1f2937' }}>{resolvedCurrentQuiz.startDate ? new Date(resolvedCurrentQuiz.startDate).toLocaleDateString() : 'Not set'}</div>
                    </div>
                    <div className="quiz-info-item" style={{ padding: '1rem', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                      <div className="quiz-info-label" style={{ fontSize: '.75rem', fontWeight: 600, color: '#6b7280', marginBottom: '0.25rem' }}>Questions</div>
                      <div className="quiz-info-value" style={{ fontSize: '1rem', fontWeight: 600, color: '#1f2937' }}>{resolvedCurrentQuiz.questions_data ? resolvedCurrentQuiz.questions_data.length : 0}</div>
                    </div>
                    <div className="quiz-info-item" style={{ padding: '1rem', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                      <div className="quiz-info-label" style={{ fontSize: '.75rem', fontWeight: 600, color: '#6b7280', marginBottom: '0.25rem' }}>Scheduled</div>
                      <div className="quiz-info-value" style={{ fontSize: '1rem', fontWeight: 600, color: '#1f2937' }}>{new Date(resolvedCurrentQuiz.datetime).toLocaleDateString()} at {new Date(resolvedCurrentQuiz.datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                  </div >
                  <div id="quiz-description-display" style={{ padding: '1rem', background: '#f0f9ff', borderRadius: '8px', border: '1px solid #bae6fd' }}>
                    {resolvedCurrentQuiz.description ? <p style={{ fontSize: '.875rem', color: '#0c4a6e', margin: 0 }}>{resolvedCurrentQuiz.description}</p> : null}
                  </div>
                </div >
                <div className="questions-display" id="questions-display">
                  {resolvedCurrentQuiz.questions_data && resolvedCurrentQuiz.questions_data.length > 0 ? (
                    resolvedCurrentQuiz.questions_data.map((question, index) => (
                      <div key={index} className="question-display-item" style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '1rem 1.25rem', marginBottom: '0.75rem', boxShadow: '0 4px 14px rgba(0,0,0,.06)' }}>
                        <div className="question-display-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '.75rem', marginBottom: '.5rem' }}>
                          <h4 style={{ margin: 0 }}>Question {index + 1} {typeof question.marks !== 'undefined' ? `(Marks: ${question.marks})` : ''}</h4>
                          <span className={`question-type-badge type-${question.type}`} style={{ padding: '.25rem .5rem', borderRadius: '999px', border: '1px solid #e5e7eb', fontSize: '.75rem', fontWeight: 700 }}>{question.type === 'mcq' ? 'Multiple Choice' : question.type === 'true_false' ? 'True/False' : 'Fill in the Blank'}</span>
                        </div>
                        <div className="question-stem" style={{ padding: '.5rem .75rem', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', marginBottom: '.75rem' }} dangerouslySetInnerHTML={{ __html: renderRichText(question.question) }} />
                        {question.type === 'mcq' && question.options ? (
                          <div className="options-display" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.5rem' }}>
                            {question.options.map((option, optionIndex) => (
                              <div key={optionIndex} className={`option-display-item ${question.correct === optionIndex ? 'correct' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '.5rem', padding: '.5rem .75rem', border: '1px solid #e5e7eb', borderRadius: '8px', background: '#ffffff' }}>
                                <div className={`option-indicator ${question.correct === optionIndex ? 'correct' : ''}`} style={{ width: '24px', height: '24px', borderRadius: '999px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e5e7eb', background: question.correct === optionIndex ? '#dcfce7' : '#f9fafb', fontWeight: 700 }}>{String.fromCharCode(65 + optionIndex)}</div>
                                <span dangerouslySetInnerHTML={{ __html: renderRichText(option) }} />
                              </div>
                            ))}
                          </div>
                        ) : null}
                        {question.type === 'true_false' ? (
                          <div className="true-false-display" style={{ display: 'flex', gap: '1rem' }}>
                            <div className={`tf-option ${question.correct === true ? 'correct' : ''}`} style={{ padding: '.5rem .75rem', border: '1px solid #e5e7eb', borderRadius: '6px', background: question.correct === true ? '#dcfce7' : '#fff' }}>True</div>
                            <div className={`tf-option ${question.correct === false ? 'correct' : ''}`} style={{ padding: '.5rem .75rem', border: '1px solid #e5e7eb', borderRadius: '6px', background: question.correct === false ? '#dcfce7' : '#fff' }}>False</div>
                          </div>
                        ) : null}
                        {question.type === 'fill_blank' ? (
                          <div className="fill-blank-answer" style={{ padding: '.5rem .75rem', border: '1px solid #e5e7eb', borderRadius: '6px', background: '#fff' }}><strong>Answer:</strong> <span dangerouslySetInnerHTML={{ __html: renderRichText(question.correct) }} /></div>
                        ) : null}
                      </div>
                    ))
                  ) : (
                    <div className="empty-state" style={{ textAlign: 'center', padding: '3rem 2rem', color: '#6b7280' }}>
                      <svg className="empty-icon" viewBox="0 0 24 24" style={{ width: '48px', height: '48px', fill: '#d1d5db', marginBottom: '1rem' }}>
                        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
                      </svg>
                      <h3 className="empty-title" style={{ fontSize: '1.25rem', fontWeight: 600, color: '#374151', margin: '0 0 0.5rem 0' }}>No questions added yet</h3>
                      <p className="empty-description" style={{ fontSize: '1rem', color: '#6b7280', margin: 0 }}>This exam doesn't have any questions</p>
                    </div>
                  )}
                </div>
                <div className="submit-section" style={{ display: 'flex', gap: '1rem', marginTop: '2.5rem', paddingTop: '2rem', borderTop: '1px solid #e5e7eb' }}>
                  <button
                    type="button"
                    className="back-btn"
                    style={{
                      padding: '0.875rem 2.25rem',
                      background: 'white',
                      color: '#dc2626',
                      border: '2px solid #dc2626',
                      borderRadius: '12px',
                      fontWeight: 700,
                      fontSize: '1.1rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                    onClick={() => showSection('my-quizzes')}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#dc2626'; e.currentTarget.style.color = 'white'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = '#dc2626'; }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                    Back to Exams
                  </button>
                </div>
              </div >
            </div >
          </div >
        )
      case 'quiz-editor':
        return (
          <div id="quiz-editor" className="quiz-editor active" style={{ padding: '2rem', background: '#f8fafc', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: '100%', maxWidth: '1400px' }}>
              <div className="editor-header" style={{ marginBottom: '2.5rem' }}>
                <h1 className="editor-title" id="editor-title" style={{ fontSize: '2.25rem', fontWeight: 800, color: '#0f172a', margin: '0 0 .5rem 0', letterSpacing: '-0.02em' }}>{currentQuizId ? 'Edit Exam' : 'Create New Exam'}</h1>
                <p style={{ fontSize: '1.1rem', color: '#64748b', margin: 0, fontWeight: 500 }}>Design and organize your exam questions</p>
              </div>
              <div className="editor-content" style={{
                background: 'white',
                borderRadius: '24px',
                padding: '3rem',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
                overflow: 'visible',
                position: 'relative',
                border: '1px solid #f1f5f9'
              }}>
                <div className="form-group" style={{ marginBottom: '2rem' }}>
                  <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    <div><label className="form-label" htmlFor="quiz-title" style={{ display: 'block', fontSize: '.9rem', fontWeight: 700, color: '#334155', marginBottom: '.75rem' }}>Exam Title <span className="required" style={{ color: '#ef4444' }}>*</span></label><input type="text" id="quiz-title" className="form-input" style={{ width: '100%', padding: '1rem', border: '1.5px solid #e2e8f0', borderRadius: '12px', fontSize: '1rem', background: '#f8fafc', transition: 'all 0.2s' }} placeholder="Enter exam title" value={quizForm.title} onChange={(e) => setQuizForm({ ...quizForm, title: e.target.value })} onFocus={(e) => { e.target.style.borderColor = '#3b82f6'; e.target.style.background = 'white'; e.target.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.1)'; }} onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc'; e.target.style.boxShadow = 'none'; }} /></div>
                    <div><label className="form-label" htmlFor="quiz-description" style={{ display: 'block', fontSize: '.9rem', fontWeight: 700, color: '#334155', marginBottom: '.75rem' }}>Description</label><input type="text" id="quiz-description" className="form-input" style={{ width: '100%', padding: '1rem', border: '1.5px solid #e2e8f0', borderRadius: '12px', fontSize: '1rem', background: '#f8fafc', transition: 'all 0.2s' }} placeholder="Enter exam description" value={quizForm.description} onChange={(e) => setQuizForm({ ...quizForm, description: e.target.value })} onFocus={(e) => { e.target.style.borderColor = '#3b82f6'; e.target.style.background = 'white'; e.target.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.1)'; }} onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc'; e.target.style.boxShadow = 'none'; }} /></div>
                  </div>
                </div>
                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                    <ModernSelect
                      id="quiz-subject"
                      label="Subject"
                      placeholder="Select subject"
                      value={quizForm.subjectId || ''}
                      options={dbSubjects.map(s => ({ id: s.id, value: s.id, label: s.statusName }))}
                      onChange={(e) => {
                        const newSubjectId = e.target.value
                        const subjectObj = dbSubjects.find(s => String(s.id) === String(newSubjectId))
                        setQuizForm({
                          ...quizForm,
                          subjectId: newSubjectId,
                          subject: subjectObj ? subjectObj.statusName : ''
                        })
                      }}
                    />
                  </div>
                </div>
                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <ModernSelect
                      id="quiz-grade"
                      label="Grade"
                      placeholder="Select grade"
                      value={quizForm.gradeId || ''}
                      options={dbGrades.map(g => ({ id: g.id, value: g.id, label: g.gradeName }))}
                      onChange={(e) => {
                        const newGradeId = e.target.value
                        const gradeObj = dbGrades.find(g => String(g.id) === String(newGradeId))
                        setQuizForm({
                          ...quizForm,
                          gradeId: newGradeId,
                          grade: gradeObj ? gradeObj.gradeName : '',
                          classIds: []
                        })
                      }}
                    />
                    <div style={{ position: 'relative', zIndex: 1000 }}>
                      <MultiSelectDropdown
                        id="quiz-class"
                        label="Classes"
                        placeholder={quizForm.gradeId ? "Select classes" : "Select grade first"}
                        options={(dbClasses || []).filter(c => Number(c.gradeId) === Number(quizForm.gradeId)).map(c => ({ id: Number(c.id), label: c.className, value: Number(c.id) }))}
                        selectedIds={(quizForm.classIds || []).map(Number)}
                        onChange={(newIds) => setQuizForm({ ...quizForm, classIds: newIds })}
                        disabled={!quizForm.gradeId}
                      />
                    </div>
                  </div>
                </div>
                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <ModernDatePicker
                      label="Start Date & Time"
                      placeholder="Select start date"
                      value={quizForm.startDate}
                      onChange={(val) => setQuizForm({ ...quizForm, startDate: val })}
                    />
                    <ModernDatePicker
                      label="End Date & Time"
                      placeholder="Select end date"
                      value={quizForm.datetime}
                      onChange={(val) => setQuizForm({ ...quizForm, datetime: val })}
                    />
                  </div>
                </div>

                <div className="questions-section" style={{ marginTop: '3.5rem', width: '100%', maxWidth: '1200px', margin: '3.5rem auto 0 auto' }}>
                  <div className="questions-header" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Questions ({currentQuizQuestions.length})</h3>
                  </div>
                  <div id="questions-container" style={{
                    minHeight: '260px',
                    background: '#f8fafc',
                    border: '2px dashed #e2e8f0',
                    borderRadius: '24px',
                    padding: '3rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    textAlign: 'center',
                    marginBottom: '2.5rem',
                    transition: 'all 0.3s'
                  }}>
                    {currentQuizQuestions.length === 0 ? (
                      <div style={{ padding: '1rem' }}>
                        <div style={{ color: '#64748b', fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>No questions added yet</div>
                        <p style={{ color: '#94a3b8', fontSize: '1rem', fontWeight: 500 }}>Use the buttons below to build your exam</p>
                      </div>
                    ) : (
                      <div style={{ width: '100%', textAlign: 'left' }}>
                        {renderQuizEditorQuestions()}
                      </div>
                    )}
                  </div>

                  <div className="quiz-details-actions" style={{ display: 'flex', gap: '1.5rem', marginBottom: '3.5rem' }}>
                    <button
                      className="add-questions-bank-btn"
                      onClick={() => setCurrentSection('question-bank-selector')}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '1.1rem 2.25rem',
                        background: 'white',
                        color: '#dc2626',
                        border: '2.5px solid #dc2626',
                        borderRadius: '16px',
                        fontWeight: 800,
                        fontSize: '1.1rem',
                        cursor: 'pointer',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        boxShadow: '0 4px 12px rgba(220, 38, 38, 0.05)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#dc2626';
                        e.currentTarget.style.color = 'white';
                        e.currentTarget.style.transform = 'translateY(-3px)';
                        e.currentTarget.style.boxShadow = '0 8px 20px rgba(220, 38, 38, 0.15)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'white';
                        e.currentTarget.style.color = '#dc2626';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(220, 38, 38, 0.05)';
                      }}
                    >
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
                      Add Questions from Bank
                    </button>
                    <button
                      className="upload-questions-btn"
                      onClick={() => setShowFileUpload(true)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '1.1rem 2.25rem',
                        background: 'white',
                        color: '#dc2626',
                        border: '2.5px solid #dc2626',
                        borderRadius: '16px',
                        fontWeight: 800,
                        fontSize: '1.1rem',
                        cursor: 'pointer',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        boxShadow: '0 4px 12px rgba(220, 38, 38, 0.05)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#dc2626';
                        e.currentTarget.style.color = 'white';
                        e.currentTarget.style.transform = 'translateY(-3px)';
                        e.currentTarget.style.boxShadow = '0 8px 20px rgba(220, 38, 38, 0.15)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'white';
                        e.currentTarget.style.color = '#dc2626';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(220, 38, 38, 0.05)';
                      }}
                    >
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                      Upload Questions File
                    </button>
                  </div>
                </div>

                <div className="editor-actions" style={{ display: 'flex', gap: '1.25rem', marginTop: '2.5rem', paddingTop: '2.5rem', borderTop: '1px solid #e5e7eb' }}>
                  <button
                    className="save-btn"
                    style={{
                      padding: '1rem 2.5rem',
                      background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '14px',
                      fontWeight: 800,
                      fontSize: '1.1rem',
                      cursor: 'pointer',
                      boxShadow: '0 8px 25px rgba(220, 38, 38, 0.25)',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                    onClick={saveQuiz}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    Save Exam
                  </button>
                  <button
                    className="cancel-btn"
                    style={{
                      padding: '1rem 2.5rem',
                      background: 'white',
                      color: '#dc2626',
                      border: '2px solid #dc2626',
                      borderRadius: '14px',
                      fontWeight: 800,
                      fontSize: '1.1rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onClick={cancelEdit}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#fef2f2'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; }}
                  >
                    Cancel
                  </button>
                </div>
                {showFileUpload && (
                  <FileUpload
                    onQuestionsExtracted={handleFileUploadQuestions}
                    onClose={() => setShowFileUpload(false)}
                    bankKey={bankKeyRef.current}
                  />
                )}
              </div>
            </div>
          </div>
        )
      case 'question-bank-selector':
        return (
          <div id="question-bank-selector-view" className="question-bank-selector-view active" style={{ animation: 'fadeIn 0.5s ease-out' }}>
            <div className="selector-header" style={{ marginBottom: '2.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1.5rem' }}>
                <div>
                  <h1 className="selector-title" style={{ fontSize: '2.25rem', fontWeight: 800, color: '#111827', marginBottom: '0.5rem', letterSpacing: '-0.025em' }}>
                    Select Questions from Banks
                  </h1>
                  <p style={{ fontSize: '1.1rem', color: '#6b7280', margin: 0 }}>
                    Choose questions from your existing question banks to add to this exam.
                  </p>
                </div>

                <div style={{ position: 'relative', minWidth: '320px', flex: '1 1 auto' }}>
                  <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Search banks by name, subject, or grade..."
                    value={bankSearchQuery}
                    onChange={(e) => setBankSearchQuery(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.875rem 1rem 0.875rem 3rem',
                      borderRadius: '14px',
                      border: '2px solid #f1f3f5',
                      background: 'white',
                      fontSize: '0.95rem',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                      outline: 'none',
                      transition: 'all 0.2s'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#dc2626'
                      e.target.style.boxShadow = '0 4px 15px rgba(220, 38, 38, 0.08)'
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#f1f3f5'
                      e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.03)'
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="selector-content">
              <div id="selectable-question-banks-list" className="selectable-banks-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: '1.5rem'
              }}>
                {renderSelectableQuestionBanks()}
              </div>
              <div className="selector-actions" style={{ display: 'flex', gap: '1rem', marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid #f1f3f5' }}>
                <button
                  className="selector-btn selector-btn-secondary"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.875rem 2rem',
                    background: 'transparent',
                    color: '#dc2626',
                    border: '2px solid #dc2626',
                    borderRadius: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onClick={backToQuizEditor}
                  onMouseEnter={(e) => {
                    e.target.style.background = '#dc2626'
                    e.target.style.color = 'white'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'transparent'
                    e.target.style.color = '#dc2626'
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5" /><path d="m12 19-7-7 7-7" /></svg>
                  Back to Exam Editor
                </button>
              </div>
            </div>
          </div>
        )
      case 'question-bank-questions-selector':
        return currentBank && (
          <div id="question-bank-questions-selector-view" className="question-bank-questions-selector-view active" style={{ animation: 'fadeIn 0.5s ease-out' }}>
            <div className="selector-header" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h1 className="selector-title" style={{ fontSize: '2rem', fontWeight: 800, color: '#111827', margin: 0, letterSpacing: '-0.025em' }}>
                  {currentBank.title}
                </h1>
                <p style={{ color: '#6b7280', marginTop: '0.25rem' }}>{currentBank.description || 'Select questions to add to your exam.'}</p>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  onClick={() => {
                    const allIndices = currentBank.questions.map((_, i) => i);
                    setSelectedBankQuestions((prev) => {
                      const next = new Set(prev);
                      allIndices.forEach(idx => {
                        next.add(`${String(currentBank.id)}::${idx}`);
                      });
                      return next;
                    });
                  }}
                  style={{ padding: '0.625rem 1.25rem', background: '#fef2f2', color: '#dc2626', border: '1px solid #fee2e2', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseEnter={(e) => e.target.style.background = '#fee2e2'}
                  onMouseLeave={(e) => e.target.style.background = '#fef2f2'}
                >
                  Select All
                </button>
                <button
                  onClick={() => {
                    const allIndices = currentBank.questions.map((_, i) => i);
                    setSelectedBankQuestions((prev) => {
                      const next = new Set(prev);
                      allIndices.forEach(idx => {
                        next.delete(`${String(currentBank.id)}::${idx}`);
                      });
                      return next;
                    });
                  }}
                  style={{ padding: '0.625rem 1.25rem', background: 'white', color: '#dc2626', border: '1.5px solid #dc2626', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseEnter={(e) => { e.target.style.background = '#dc2626'; e.target.style.color = 'white'; }}
                  onMouseLeave={(e) => { e.target.style.background = 'white'; e.target.style.color = '#dc2626'; }}
                >
                  Clear Selection
                </button>
              </div>
            </div>

            <div className="selector-content">
              <div id="selectable-questions-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {currentBank.questions && currentBank.questions.length > 0 ? (
                  currentBank.questions.map((question, index) => {
                    const isSelected = isQuestionSelected(currentBank.id, index);
                    return (
                      <div
                        key={index}
                        className={`question-card-interactive ${isSelected ? 'selected' : ''}`}
                        style={{
                          background: isSelected ? '#fef2f2' : 'white',
                          border: `2px solid ${isSelected ? '#dc2626' : '#f1f3f5'}`,
                          borderRadius: '20px',
                          padding: '1.5rem',
                          boxShadow: isSelected ? '0 10px 25px rgba(220, 38, 38, 0.08)' : '0 4px 15px rgba(0,0,0,0.03)',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          cursor: 'pointer',
                          animation: `cardEntrance 0.5s ease-out forwards ${index * 0.04}s`,
                          opacity: 0,
                          transform: 'translateY(15px)',
                          position: 'relative'
                        }}
                        onClick={() => toggleQuestionSelection(currentBank.id, index, !isSelected)}
                      >
                        <div style={{ display: 'flex', gap: '1.25rem' }}>
                          <div style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            border: `2px solid ${isSelected ? '#dc2626' : '#d1d5db'}`,
                            background: isSelected ? '#dc2626' : 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            transition: 'all 0.2s',
                            marginTop: '0.25rem'
                          }}>
                            {isSelected && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
                          </div>

                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <span style={{ fontWeight: 800, color: '#111827' }}>Question {index + 1}</span>
                                <span style={{ background: '#f3f4f6', padding: '0.25rem 0.625rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, color: '#4b5563' }}>
                                  {question.marks || 1} Marks
                                </span>
                              </div>
                              <span style={{
                                padding: '0.35rem 0.75rem',
                                borderRadius: '8px',
                                background: isSelected ? 'white' : '#fef2f2',
                                color: '#dc2626',
                                fontSize: '0.75rem',
                                fontWeight: 800,
                                border: `1px solid ${isSelected ? '#fee2e2' : 'transparent'}`
                              }}>
                                {question.type === 'mcq' ? 'Multiple Choice' : question.type === 'true_false' ? 'True/False' : 'Fill in the Blank'}
                              </span>
                            </div>

                            <div
                              style={{ fontSize: '1.05rem', color: '#1f2937', fontWeight: 500, lineHeight: 1.5, marginBottom: '1.25rem' }}
                              dangerouslySetInnerHTML={{ __html: renderRichText(question.question) }}
                            />

                            {question.type === 'mcq' && question.options ? (
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                {question.options.map((option, optIdx) => {
                                  // Correct answer might be stored as letter "A", "B", etc. Index starts at 0 for A.
                                  const correctValue = question.correct;
                                  const isCorrect = typeof correctValue === 'string' && correctValue.length === 1 
                                    ? correctValue.toUpperCase().charCodeAt(0) - 65 === optIdx
                                    : Number(correctValue) === optIdx;

                                  return (
                                    <div
                                      key={optIdx}
                                      style={{
                                        padding: '0.875rem 1rem',
                                        background: 'white',
                                        border: `1px solid ${isCorrect ? '#10b981' : '#f1f3f5'}`,
                                        borderRadius: '12px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.75rem',
                                        boxShadow: isCorrect ? '0 4px 12px rgba(16, 185, 129, 0.08)' : 'none'
                                      }}
                                    >
                                      <div style={{
                                        width: '24px',
                                        height: '24px',
                                        borderRadius: '6px',
                                        background: isCorrect ? '#10b981' : '#f8fafc',
                                        color: isCorrect ? 'white' : '#6b7280',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontWeight: 800,
                                        fontSize: '0.75rem'
                                      }}>
                                        {String.fromCharCode(65 + optIdx)}
                                      </div>
                                      <span style={{ fontSize: '0.9rem', color: '#374151' }} dangerouslySetInnerHTML={{ __html: renderRichText(option) }} />
                                      {isCorrect && <svg style={{ marginLeft: 'auto', color: '#10b981' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
                                    </div>
                                  );
                                })}
                              </div>
                            ) : question.type === 'true_false' ? (
                              <div style={{ display: 'flex', gap: '0.75rem' }}>
                                {['True', 'False'].map((lbl, idx) => {
                                  const isCorrect = (lbl === 'True' && question.correct === true) || (lbl === 'False' && question.correct === false);
                                  return (
                                    <div key={idx} style={{
                                      padding: '0.75rem 1.5rem',
                                      background: isCorrect ? '#dcfce7' : 'white',
                                      border: `1px solid ${isCorrect ? '#10b981' : '#f1f3f5'}`,
                                      borderRadius: '10px',
                                      color: isCorrect ? '#16a34a' : '#6b7280',
                                      fontWeight: 700
                                    }}>
                                      {lbl}
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div style={{ padding: '0.875rem 1rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '0.95rem' }}>
                                <strong style={{ color: '#6b7280', marginRight: '0.5rem' }}>Correct Answer:</strong>
                                <span dangerouslySetInnerHTML={{ __html: renderRichText(question.correct) }} />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div style={{ textAlign: 'center', padding: '4rem', background: 'white', borderRadius: '24px', border: '1px dashed #e2e8f0' }}>
                    <div style={{ width: '64px', height: '64px', background: '#f1f3f5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><path d="M12 8v8" /><path d="M8 12h8" /></svg>
                    </div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', marginBottom: '0.5rem' }}>No questions in this bank</h3>
                    <button style={{ color: '#dc2626', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }} onClick={backToQuestionBankSelector}>Go back and choose another bank</button>
                  </div>
                )}
              </div>

              <div className="selector-actions" style={{ display: 'flex', gap: '1.25rem', marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid #f1f3f5' }}>
                <button
                  className="selector-btn selector-btn-primary"
                  style={{
                    flex: 1,
                    padding: '1rem 2rem',
                    background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '14px',
                    fontWeight: 800,
                    fontSize: '1rem',
                    cursor: 'pointer',
                    boxShadow: '0 8px 20px rgba(220, 38, 38, 0.25)',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.75rem'
                  }}
                  onClick={addSelectedQuestionsToQuiz}
                  onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                  onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
                  Add {getSelectedCount()} Questions to Exam
                </button>
                <button
                  className="selector-btn selector-btn-secondary"
                  style={{
                    padding: '1rem 2rem',
                    background: 'white',
                    color: '#dc2626',
                    border: '2px solid #dc2626',
                    borderRadius: '14px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                  onClick={backToQuestionBankSelector}
                  onMouseEnter={(e) => { e.target.style.background = '#fef2f2' }}
                  onMouseLeave={(e) => { e.target.style.background = 'white' }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                  Back to Banks
                </button>
              </div>
            </div>
          </div>
        )
      case 'students':
      case 'classes':
      case 'class-students':
        console.log('🏗️ RENDERING students grid case')
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
        return selectedStudentId && (() => {
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
                {/* Header with Back Button */}
                <button
                  onClick={() => showStudentsForClass(currentClass?.grade || currentGrade, currentClass?.class || '')}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'white',
                    color: '#dc2626',
                    border: '2px solid #dc2626',
                    borderRadius: '10px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    marginBottom: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.background = '#fef2f2'}
                  onMouseLeave={(e) => e.target.style.background = 'white'}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                  Back to Students
                </button>

                {/* Student Profile Card */}
                <div style={{ background: 'white', borderRadius: '16px', padding: '2rem', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.07)', marginBottom: '2rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginBottom: '2rem' }}>
                    <div style={{
                      width: '96px',
                      height: '96px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '2rem',
                      fontWeight: '700',
                      color: 'white',
                      boxShadow: '0 8px 16px rgba(220, 38, 38, 0.3)'
                    }}>
                      {student.initials || student.name?.substring(0, 2).toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <h1 style={{ fontSize: '2rem', fontWeight: '700', color: '#1f2937', margin: 0 }}>{student.name}</h1>
                      <p style={{ fontSize: '1.125rem', color: '#6b7280', margin: '0.5rem 0 0 0' }}>{student.grade} - {student.class}</p>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <div style={{ background: '#f0f9ff', borderRadius: '12px', padding: '1.5rem', border: '1px solid #bae6fd' }}>
                      <div style={{ fontSize: '0.875rem', color: '#0c4a6e', marginBottom: '0.5rem', fontWeight: '600' }}>Exams Completed</div>
                      <div style={{ fontSize: '2rem', fontWeight: '700', color: '#0369a1' }}>{completedExams}</div>
                    </div>
                    <div style={{ background: '#f0fdf4', borderRadius: '12px', padding: '1.5rem', border: '1px solid #bbf7d0' }}>
                      <div style={{ fontSize: '0.875rem', color: '#14532d', marginBottom: '0.5rem', fontWeight: '600' }}>Average Score</div>
                      <div style={{ fontSize: '2rem', fontWeight: '700', color: '#15803d' }}>{avgScore}%</div>
                    </div>
                    <div style={{ background: '#fef3c7', borderRadius: '12px', padding: '1.5rem', border: '1px solid #fde68a' }}>
                      <div style={{ fontSize: '0.875rem', color: '#78350f', marginBottom: '0.5rem', fontWeight: '600' }}>Highest Score</div>
                      <div style={{ fontSize: '2rem', fontWeight: '700', color: '#b45309' }}>{highestScore}%</div>
                    </div>
                    <div style={{ background: '#fee2e2', borderRadius: '12px', padding: '1.5rem', border: '1px solid #fecaca' }}>
                      <div style={{ fontSize: '0.875rem', color: '#7f1d1d', marginBottom: '0.5rem', fontWeight: '600' }}>Lowest Score</div>
                      <div style={{ fontSize: '2rem', fontWeight: '700', color: '#991b1b' }}>{lowestScore}%</div>
                    </div>
                  </div>
                </div>

                {/* Exam History Card */}
                <div style={{ background: 'white', borderRadius: '16px', padding: '2rem', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.07)' }}>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1f2937', marginBottom: '1.5rem' }}>Exam History</h2>

                  {Object.entries(student.quizScores || {}).length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
                      <svg style={{ width: '64px', height: '64px', fill: '#d1d5db', margin: '0 auto 1rem' }} viewBox="0 0 24 24">
                        <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
                      </svg>
                      <p style={{ fontSize: '1.125rem', fontWeight: '600', color: '#374151' }}>No exams completed yet</p>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gap: '1rem' }}>
                      {Object.entries(student.quizScores || {}).map(([quizId, score]) => {
                        const quiz = quizzes.find((q) => q.id == quizId)
                        if (!quiz) return null

                        let bgColor = '#fee2e2'
                        let borderColor = '#fecaca'
                        let textColor = '#991b1b'
                        let badgeBg = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'

                        if (score >= 90) {
                          bgColor = '#dcfce7'
                          borderColor = '#bbf7d0'
                          textColor = '#15803d'
                          badgeBg = 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
                        } else if (score >= 75) {
                          bgColor = '#fef3c7'
                          borderColor = '#fde68a'
                          textColor = '#b45309'
                          badgeBg = 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                        }

                        return (
                          <div
                            key={quizId}
                            style={{
                              background: bgColor,
                              border: `1px solid ${borderColor}`,
                              borderRadius: '12px',
                              padding: '1.5rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between'
                            }}
                          >
                            <div>
                              <h4 style={{ fontSize: '1.125rem', fontWeight: '600', color: textColor, margin: 0 }}>{quiz.title}</h4>
                              <div style={{ fontSize: '0.875rem', color: textColor, marginTop: '0.25rem', opacity: 0.8 }}>
                                Completed on {new Date(quiz.created).toLocaleDateString()}
                              </div>
                            </div>
                            <div style={{
                              background: badgeBg,
                              color: 'white',
                              padding: '0.75rem 1.5rem',
                              borderRadius: '999px',
                              fontSize: '1.5rem',
                              fontWeight: '700',
                              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                              minWidth: '100px',
                              textAlign: 'center'
                            }}>
                              {score}%
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div >
          )
        })()
      case 'profile':
        return (
          <UserProfile
            userRole={userRole || 'Teacher'}
            onBack={() => showSection('main')}
          />
        )
      default:
        return null
    }
  }, [
    currentSection,
    currentBankId,
    currentQuizId,
    quizzes,
    questionBanks,
    students,
    currentSubject,
    activeQuizSession,
    currentGrade,
    currentClass,
    selectedStudentId,
    resolvedCurrentQuiz,
    currentBankSnapshot,
    isSuperAdminView,
    selectedTeacherData,
    teacherName,
    bankForm,
    bankEditorQuestions,
    showFileUpload,
    quizForm,
    currentQuizQuestions,
    selectedBankQuestions,
    userRole,
    filters // REQUIRED for filtering to work!
  ])

  return (
    <ErrorBoundary>
      <div className="dashboard-container" style={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar
          isExamActive={activeQuizSession !== null}
          currentSection={currentSection}
          showSection={showSection}
          handleLogout={handleLogout}
          userRole={userRole || 'Teacher'}
        />
        <div className="main-content section-transition" style={{
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
              @keyframes cardEntrance {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
              }
            `}
          </style>
          {/* Welcome Card */}
          {currentSection !== 'profile' && (
            <div style={{ padding: '1.5rem 2rem 0' }}>
              <div style={{
                background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                padding: '1.5rem 2rem',
                borderRadius: '16px',
                color: 'white',
                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1rem'
              }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>Hello, {teacherName}!</h2>
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.9rem', color: 'rgba(255,255,255,0.9)' }}>
                    You are logged in as a <span style={{ color: '#ffffff', fontWeight: 700 }}>{userRole || 'Teacher'}</span>
                  </p>
                </div>
                <div style={{
                  background: 'rgba(255,255,255,0.1)',
                  padding: '0.75rem',
                  borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.2)',
                  textAlign: 'right'
                }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, opacity: 0.7 }}>{new Date().toLocaleDateString('en-US', { weekday: 'long' })}</div>
                  <div style={{ fontSize: '1rem', fontWeight: 700 }}>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                </div>
              </div>
            </div>
          )}
          {/* Debug Indicator - Hidden in production but helps us confirm routing */}
          <div style={{ display: 'none' }} data-section={currentSection}></div>
          {currentView}
        </div>

        {/* Modal */}
        <QuizModal
          title={modalTitle}
          message={modalMessage}
          onConfirm={handleModalConfirm}
          onCancel={handleModalCancel}
          isActive={isModalActive}
        />
      </div>
    </ErrorBoundary>
  )
}
