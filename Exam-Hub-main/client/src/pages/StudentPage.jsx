import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import QuizModal from '../components/QuizModal'
import Sidebar from '../components/Sidebar'
import DashboardView from '../components/DashboardView'
import ProfilePage from '../components/ProfilePage'
import UserProfile from '../components/UserProfile'
import QuizInterface from '../components/QuizInterface'
import ErrorBoundary from '../components/ErrorBoundary'
import UnifiedDashboard from '../components/UnifiedDashboard'
import api from '../api/axios'
import { storage } from '../utils/storage'

export default function StudentPage() {
  const navigate = useNavigate()

  // State management
  const [currentSection, setCurrentSection] = useState('dashboard')
  const [currentSubject, setCurrentSubject] = useState(null)
  const [currentQuiz, setCurrentQuiz] = useState(null)
  const [currentExam, setCurrentExam] = useState(null)
  const [isExamActive, setIsExamActive] = useState(false)
  const [isReviewMode, setIsReviewMode] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [studentName, setStudentName] = useState('Student')
  const [userRole, setUserRole] = useState(null)
  const [completedSearchTerm, setCompletedSearchTerm] = useState('')
  const quizTimerRef = useRef(null)

  // Real data from backend
  const [exams, setExams] = useState({ available: [], upcoming: [] })
  const [completedExams, setCompletedExams] = useState([])
  const [dbGrades, setDbGrades] = useState([])
  const [dbClasses, setDbClasses] = useState([])
  const [dbSubjects, setDbSubjects] = useState([])

  // Subject metadata (icons + descriptions) used by DashboardView rendering
  const subjectInfo = useMemo(() => ({
    History: {
      icon: '<path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/>',
      description: 'Learn about past events and civilizations',
    },
    Geography: {
      icon: '<path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>',
      description: 'Explore the world and its features',
    },
    Science: {
      icon: '<path d="M13 11.33L18 18H6l5-6.67V6h2v5.33M15.96 19H8.04c-.53 0-.96-.43-.96-.96 0-.23.08-.44.23-.59L12 13l4.73 4.45c.15.15.23.36.23.59 0 .53-.43.96-.96.96z"/>',
      description: 'Discover how the world works',
    },
    Mathematics: {
      icon: '<path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM8 8h8v2H8V8zm0 4h8v2H8v-2z"/>',
      description: 'Numbers, patterns, and problem solving',
    },
    Arabic: {
      icon: '<path d="M12 2L2 7l10 5 10-5-10-5zm0 7.09L4.26 7 12 3.91 19.74 7 12 9.09zM2 17l10 5 10-5"/>',
      description: 'Language, poetry, and grammar',
    },
    Literature: {
      icon: '<path d="M18 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12v-2H6V4h12v16h2V4a2 2 0 0 0-2-2z"/>',
      description: 'Books, authors, and stories',
    },
    Physics: {
      icon: '<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>',
      description: 'Physics and mechanics',
    },
    Chemistry: {
      icon: '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>',
      description: 'Chemistry and reactions',
    },
    Biology: {
      icon: '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>',
      description: 'Biology and life sciences',
    },
    English: {
      icon: '<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>',
      description: 'English language and literature',
    },
  }), [])

  // Modal state
  const [isModalActive, setIsModalActive] = useState(false)
  const [modalTitle, setModalTitle] = useState('')
  const [modalMessage, setModalMessage] = useState('')
  const modalResolveRef = useRef(null)

  // Prevent tab switching during exam
  useEffect(() => {
    if (isExamActive && !isReviewMode) {
      const handleBeforeUnload = (e) => {
        e.preventDefault()
        e.returnValue = 'You have an active exam. Are you sure you want to leave?'
        return e.returnValue
      }

      const handleVisibilityChange = () => {
        if (document.hidden && isExamActive && !isReviewMode) {
          showModal('Warning', 'Please stay on this page while taking the exam.')
        }
      }

      window.addEventListener('beforeunload', handleBeforeUnload)
      document.addEventListener('visibilitychange', handleVisibilityChange)

      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload)
        document.removeEventListener('visibilitychange', handleVisibilityChange)
      }
    }
  }, [isExamActive, isReviewMode])

  // Fetch real data from backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Get user ID from storage
        const token = storage.getItem('token')
        let userId = null
        if (token) {
          try {
            const payload = JSON.parse(atob(token.split('.')[1]))
            userId = payload.AccountId || payload.accountId || payload.sub || payload.id || payload.nameid || payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier']
          } catch (e) {
            console.error('Error parsing token:', e)
          }
        }

        const [examsRes, completedRes, lookupRes] = await Promise.all([
          api.get('/examdetail').catch(() => ({ data: [] })),
          userId ? api.get(`/studentexamanswer/student/${userId}/exams`).catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
          api.get('/dashboard/lookup-data').catch(() => ({ data: { grades: [], classes: [] } }))
        ])

        const examsData = examsRes.data || []
        const completedData = completedRes.data || []

        // Set grades, classes, and subjects for filters
        if (lookupRes.data) {
          setDbGrades(lookupRes.data.grades || [])
          setDbClasses(lookupRes.data.classes || [])
          setDbSubjects(lookupRes.data.subjects || [])
        }

        // Filter exams into categories
        const now = new Date()
        const completedExamIds = new Set(completedData.map(e => e.examId ?? e.ExamId).filter(Boolean))

        // Helper to check if date is valid
        const isValidDate = (d) => d instanceof Date && !isNaN(d) && d.getFullYear() > 1970

        const expiredExams = []
        const activeExams = []
        const upcomingList = []

        examsData.forEach(exam => {
          // Robust ID check
          const eId = exam.examId ?? exam.ExamId
          if (!eId || completedExamIds.has(eId)) return

          const startDateRaw = exam.startDate ?? exam.StartDate
          const endDateRaw = exam.endDate ?? exam.EndDate

          const startDate = startDateRaw ? new Date(startDateRaw) : null
          const endDate = endDateRaw ? new Date(endDateRaw) : null

          // treat null start date as "now" (started)
          const hasStarted = !startDate || !isValidDate(startDate) || startDate <= now
          // treat null end date as "never expires" (future)
          const hasExpired = endDate && isValidDate(endDate) && endDate <= now

          // Debugging log (only uncomment if timing issues persist)
          // console.log(`[Exam ${exam.examId}] EndDate: ${endDate?.toISOString()} | Now: ${now.toISOString()} | Expired: ${hasExpired}`);

          if (hasExpired) {
            expiredExams.push(exam)
          } else if (hasStarted) {
            activeExams.push(exam)
          } else {
            upcomingList.push(exam)
          }
        })

        // Map missed exams to look like completed entries but with 0 score
        const missedExams = expiredExams.map(exam => ({
          examId: exam.examId,
          title: exam.title,
          name: exam.title,
          subject: exam.subjectName || exam.SubjectName || exam.examSubject || exam.ExamSubject || 'General',
          examDescription: exam.examDescription,
          startDate: exam.startDate,
          endDate: exam.endDate,
          totalMarks: exam.questions?.reduce((sum, q) => sum + (q.mark || 0), 0) || 0,
          earnedMarks: 0,
          score: 0,
          isMissed: true, // Flag for UI
          questions: exam.questions || []
        }))

        setExams({ 
          available: activeExams.map(exam => ({
            ...exam,
            id: exam.examId,
            name: exam.title,
            title: exam.title,
            subject: exam.subjectName || exam.SubjectName || exam.examSubject || exam.ExamSubject || 'General',
            deadline: exam.endDate,
            startDate: exam.startDate,
            duration: 60
          })), 
          upcoming: upcomingList.map(exam => ({
            ...exam,
            id: exam.examId,
            name: exam.title,
            title: exam.title,
            subject: exam.subjectName || exam.SubjectName || exam.examSubject || exam.ExamSubject || 'General',
            deadline: exam.endDate,
            startDate: exam.startDate,
            duration: 60
          })) 
        })

        // Merge actual taken exams with missed exams
        const mappedCompleted = completedData.map(exam => ({
          ...exam,
          subject: exam.subjectName || exam.SubjectName || exam.examSubject || exam.ExamSubject || 'General'
        }))
        setCompletedExams([...mappedCompleted, ...missedExams])

      } catch (err) {
        console.error('Error fetching exams:', err)
        if (err.code === 'ERR_NETWORK' || err.message?.includes('Network Error') || !err.response) {
          setError('Failed to fetch (API error). Please check if the server is running.')
        } else {
          setError('Failed to load exams. Please try again.')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

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

  function handleLogout() {
    if (isExamActive) {
      showModal('Exam in Progress', 'Please complete your current exam before logging out.')
      return
    }
    showModal('Confirm Logout', 'Are you sure you want to logout?').then((confirmed) => {
      if (confirmed) {
        // Clear all session data
        storage.clear()
        // Reset state
        setCurrentExam(null)
        setIsExamActive(false)
        setTimeRemaining(0)
        // Show CAS login again but keep the shared SSO session for Capstone.
        const casUrl = 'http://localhost:5174'
        const callbackUrl = encodeURIComponent(`${window.location.origin}/sso-callback`)
        window.location.href = `${casUrl}/login?prompt=login&logout=true&redirect=${callbackUrl}&businessEntityId=9`
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
      try {
        const payload = JSON.parse(atob(token.split('.')[1] || ''))
        const userId = payload.sub || payload.id
        if (userId) {
          api.get(`/auth/profile/${userId}`).then(res => {
            if (res.data && (res.data.fullNameEn || res.data.fullNameAr)) {
              setStudentName(res.data.fullNameEn || res.data.fullNameAr)
            }
          }).catch(err => console.error("Failed to fetch profile", err))
        }
      } catch (e) {
        console.error('Error parsing token:', e)
      }
    }
  }, [navigate])

  // Timer logic
  useEffect(() => {
    let interval = null
    if (isExamActive && !isReviewMode && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(interval)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else if (timeRemaining === 0 && isExamActive && !isReviewMode) {
      // Auto-submit when time runs out
      submitExam(true)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isExamActive, isReviewMode, timeRemaining])

  function getTimeUntilDeadline(deadline) {
    const now = new Date()
    const deadlineDate = new Date(deadline)
    const diff = deadlineDate.getTime() - now.getTime()

    if (diff <= 0) return null // Expired

    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    if (days > 0) return `${days}d ${hours}h`
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  async function startExam(exam) {
    if (isExamActive) {
      showModal('Exam in Progress', 'Please complete your current exam before starting a new one.')
      return
    }

    const timeUntil = getTimeUntilDeadline(exam.deadline || exam.endDate)
    if (!timeUntil) {
      showModal('Exam Expired', 'This exam has expired and is no longer available.')
      return
    }

    try {
      setLoading(true)
      // Get user ID from token
      const token = storage.getItem('token')
      let userId = null
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]))
          userId = payload.sub || payload.id
        } catch (e) {
          console.error('Error parsing token:', e)
        }
      }

      if (!userId) {
        showModal('Error', 'Unable to identify user. Please log in again.')
        return
      }

      // Fetch detailed exam with questions
      const response = await api.get(`/studentexamanswer/student/${userId}/exam/${exam.examId || exam.id}`)
      const examData = response.data

      // Map raw questions to the structure QuizInterface expects
      const mappedQuestions = (examData.questions || []).map(q => {
        const options = [q.optionA, q.optionB, q.optionC, q.optionD].filter(Boolean)
        const type = options.length === 4 ? 'mcq' : options.length === 2 ? 'tf' : 'fill'

        let correct = q.correctAnswer

        if (type === 'mcq') {
          // Map letter answers (A, B, C, D) to indices for MCQs
          if (typeof q.correctAnswer === 'string' && q.correctAnswer.length === 1 && q.correctAnswer.match(/[A-D]/i)) {
            correct = q.correctAnswer.toUpperCase().charCodeAt(0) - 65 // A=0, B=1, etc.
          } else {
            const idx = options.findIndex(opt => opt === q.correctAnswer)
            if (idx >= 0) correct = idx
          }
        } else if (type === 'tf') {
          // Normalize to boolean
          correct = String(q.correctAnswer).toLowerCase().trim() === 'true'
        }

        return {
          id: q.questionId,
          question: q.questionTitle,
          type: type,
          options: options,
          correct: correct,
          marks: q.mark || 1
        }
      })

      // Shuffle questions for randomization
      const shuffleArray = (array) => {
        const shuffled = [...array]
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
        }
        return shuffled
      }

      const randomizedExam = {
        id: examData.examId,
        name: examData.title,
        subject: examData.examSubject,
        duration: examData.duration || 60,
        startDate: examData.startDate,
        endDate: examData.endDate,
        questions: shuffleArray(mappedQuestions)
      }

      setCurrentExam(randomizedExam)
      setIsExamActive(true)
      setCurrentSection('quiz')

      // Calculate time remaining
      const now = new Date()
      const endDate = new Date(examData.endDate)
      const timeRemainingMs = endDate.getTime() - now.getTime()
      setTimeRemaining(Math.max(0, Math.floor(timeRemainingMs / 1000)))

    } catch (err) {
      console.error('Error starting exam:', err)
      showModal('Error', 'Failed to load exam questions. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function autoSubmitExam() {
    submitExam(true)
  }

  const submitExam = useCallback(async (autoSubmit = false) => {
    if (!currentExam) return

    try {
      // Get user ID from token
      const token = storage.getItem('token')
      let userId = null
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]))
          userId = payload.sub || payload.id
        } catch (e) {
          console.error('Error parsing token:', e)
        }
      }

      if (!userId) {
        showModal('Error', 'Unable to identify user. Please log in again.')
        return
      }

      // Collect answers from the form
      const form = document.getElementById('quiz-form')
      // If auto-submitting and form is missing (e.g. tab closed), we might need a fallback
      // But usually the component is still mounted.

      let answers = []
      if (form) {
        const formData = new FormData(form)
        answers = currentExam.questions.map((question, index) => {
          const questionName = `question_${index + 1}`
          const answer = formData.get(questionName)
          const answerValue = answer ? String(answer).trim() : ''

          return {
            questionId: question.id,
            answer: answerValue
          }
        }).filter(a => a.questionId)
      } else {
        // Fallback if form is not found (should not happen in normal flow)
        console.warn("Exam form not found during submission")
      }

      // Prepare submission payload
      const submissionPayload = {
        examId: currentExam.id,
        accountId: Number(userId),
        answers: answers
      }

      console.log('Submitting exam:', {
        examId: currentExam.id,
        userId: userId,
        answersCount: answers.length,
        answers: answers
      })

      // Submit answers to backend
      const response = await api.post('/studentexamanswer/submit', submissionPayload)

      // Move exam from available to completed
      setExams(prev => ({
        ...prev,
        available: prev.available.filter(exam => exam.examId !== currentExam.id),
        upcoming: prev.upcoming.filter(exam => exam.examId !== currentExam.id)
      }))

      // Add to completed exams
      const completedExam = {
        examId: currentExam.id,
        title: currentExam.name,
        examSubject: currentExam.subject,
        examDescription: '',
        startDate: currentExam.startDate || new Date().toISOString(),
        endDate: currentExam.deadline || new Date().toISOString(),
        totalMarks: response.data.totalMarks || 0,
        earnedMarks: response.data.earnedMarks || 0,
        score: response.data.score || 0,
        questions: currentExam.questions
      }

      setCompletedExams(prev => [...prev, completedExam])

      const success = document.getElementById('success-message')
      if (success) success.style.display = 'block'

      if (!autoSubmit) {
        const scoreRounded = Math.round(response.data.score * 100) / 100
        const scoreDisplay = scoreRounded % 1 === 0 ? scoreRounded : scoreRounded.toFixed(2)
        showModal('Exam Completed!', `Great job! Your exam has been submitted successfully. Score: ${response.data.earnedMarks}/${response.data.totalMarks} (${scoreDisplay}%)`).then(() => {
          setIsExamActive(false)
          setCurrentSection('completed')
          setCurrentExam(null)
          setTimeRemaining(0)
        })
      } else {
        const scoreRounded = Math.round(response.data.score * 100) / 100
        const scoreDisplay = scoreRounded % 1 === 0 ? scoreRounded : scoreRounded.toFixed(2)
        showModal('Time Up!', `Your exam has been automatically submitted. Score: ${response.data.earnedMarks}/${response.data.totalMarks} (${scoreDisplay}%)`).then(() => {
          setIsExamActive(false)
          setCurrentSection('completed')
          setCurrentExam(null)
          setTimeRemaining(0)
        })
      }
    } catch (err) {
      console.error('Error submitting exam:', err)
      console.error('Error response:', err.response?.data)
      let errorMessage = 'Failed to submit exam. Please try again.'
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message
      } else if (err.response?.data?.errors) {
        const validationErrors = Object.values(err.response.data.errors).flat().join(', ')
        errorMessage = `Validation error: ${validationErrors}`
      } else if (err.code === 'ERR_NETWORK' || err.message?.includes('Network Error') || !err.response) {
        errorMessage = 'Failed to fetch (API error). Please check if the server is running.'
      } else if (err.response?.status === 400) {
        errorMessage = err.response.data?.message || 'Invalid request. Please check your answers and try again.'
      } else if (err.response?.status === 401) {
        errorMessage = 'Unauthorized. Please log in again.'
      } else if (err.response?.status >= 500) {
        errorMessage = 'Server error. Please try again later.'
      }
      showModal('Error', errorMessage)
    }
  }, [currentExam])

  function showSection(section) {
    setCurrentSection(section)
  }

  function showSubject(subject) {
    setCurrentSubject(subject)
    setCurrentSection('available')
  }

  function backToSubjects() {
    setCurrentSubject(null)
    setCurrentSection('available')
  }

  async function reviewExam(exam) {
    try {
      setLoading(true)
      // Fetch detailed exam with answers
      const token = storage.getItem('token')
      let userId = null
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]))
          userId = payload.sub || payload.id
        } catch (e) {
          console.error('Error parsing token:', e)
        }
      }

      if (!userId) {
        showModal('Error', 'Unable to identify user. Please log in again.')
        return
      }

      const response = await api.get(`/studentexamanswer/student/${userId}/exam/${exam.examId || exam.id}`)
      const examData = response.data

      const mappedQuestions = (examData.questions || []).map(q => {
        const options = [q.optionA, q.optionB, q.optionC, q.optionD].filter(Boolean)
        const type = options.length === 4 ? 'mcq' : options.length === 2 ? 'tf' : 'fill'

        let correct = q.correctAnswer
        let userAnswer = q.userAnswer

        if (type === 'mcq') {
          // Map letter answers (A, B, C, D) to indices
          if (typeof q.correctAnswer === 'string' && q.correctAnswer.length === 1 && q.correctAnswer.match(/[A-D]/i)) {
            correct = q.correctAnswer.toUpperCase().charCodeAt(0) - 65
          } else {
            const idx = options.findIndex(opt => opt === q.correctAnswer)
            if (idx >= 0) correct = idx
          }

          const uIdx = options.findIndex(opt => opt === q.userAnswer)
          if (uIdx >= 0) userAnswer = uIdx
        } else if (type === 'tf') {
          // Normalize to boolean
          correct = String(q.correctAnswer).toLowerCase().trim() === 'true'
          userAnswer = String(q.userAnswer).toLowerCase().trim() === 'true'
        }

        return {
          id: q.questionId,
          question: q.questionTitle,
          type: type,
          options: options,
          correct: correct,
          userAnswer: userAnswer,
          isCorrect: q.isCorrect,
          marks: q.mark || 1
        }
      }).sort((a, b) => b.id - a.id)

      const reviewExamData = {
        id: examData.examId,
        name: examData.title,
        subject: examData.examSubject,
        deadline: examData.endDate,
        score: examData.score || 0,
        totalMarks: examData.totalMarks || 0,
        earnedMarks: examData.earnedMarks || 0,
        questions: mappedQuestions
      }

      setCurrentExam(reviewExamData)
      setIsReviewMode(true)
      setCurrentSection('quiz')
    } catch (err) {
      console.error('Error fetching exam details:', err)
      showModal('Error', 'Failed to load exam details for review. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function backToCompleted() {
    setIsReviewMode(false)
    setCurrentExam(null)
    setCurrentSection('completed')
  }

  // Convert backend exam data to frontend format
  const examData = useMemo(() => {
    const processExamList = (list) => list.map(exam => {
      const questions = (exam.questions || []).map(q => {
        const options = [q.optionA, q.optionB, q.optionC, q.optionD].filter(Boolean)

        // Fix: Map letter answers (A, B, C, D) to indices
        let correctIndex = -1
        if (q.correctAnswer && q.correctAnswer.length === 1 && q.correctAnswer.match(/[A-D]/i)) {
          correctIndex = q.correctAnswer.toUpperCase().charCodeAt(0) - 65 // A=0, B=1, etc.
        } else {
          correctIndex = options.findIndex(opt => opt === q.correctAnswer)
        }

        return {
          id: q.questionId,
          question: q.questionTitle,
          type: options.length === 4 ? 'mcq' : options.length === 2 ? 'tf' : 'fill',
          options: options,
          correct: correctIndex >= 0 ? correctIndex : q.correctAnswer,
          marks: q.mark || 1
        }
      })

      return {
        id: exam.examId,
        name: exam.title,
        title: exam.title,
        subject: exam.subjectName || exam.examSubject || 'General',
        deadline: exam.endDate,
        startDate: exam.startDate,
        duration: 60, // Default duration, could be added to backend
        questions: questions
      }
    })

    const available = processExamList(exams.available).sort((a, b) => new Date(b.deadline || b.startDate) - new Date(a.deadline || a.startDate))
    const upcoming = processExamList(exams.upcoming).sort((a, b) => new Date(a.startDate) - new Date(b.startDate))

    const completed = completedExams.map(exam => {
      const questions = (exam.questions || []).map(q => {
        const options = [q.optionA, q.optionB, q.optionC, q.optionD].filter(Boolean)

        // Fix: Map letter answers (A, B, C, D) to indices
        let correctIndex = -1
        if (q.correctAnswer && q.correctAnswer.length === 1 && q.correctAnswer.match(/[A-D]/i)) {
          correctIndex = q.correctAnswer.toUpperCase().charCodeAt(0) - 65 // A=0, B=1, etc.
        } else {
          // Fallback for full text match
          correctIndex = options.findIndex(opt => opt === q.correctAnswer)
        }

        // Fix: Map user answer (which might be text) to index
        const userAnswerIndex = options.findIndex(opt => opt === q.userAnswer)

        return {
          id: q.questionId,
          question: q.questionTitle,
          type: options.length === 4 ? 'mcq' : options.length === 2 ? 'tf' : 'fill',
          options: options,
          correct: correctIndex >= 0 ? correctIndex : q.correctAnswer, // Keep original if not index
          userAnswer: userAnswerIndex >= 0 ? userAnswerIndex : q.userAnswer,
          isCorrect: q.isCorrect,
          marks: q.mark || 1
        }
      })

      return {
        ...exam,
        id: exam.examId,
        title: exam.title || exam.Title || 'Untitled Exam',
        subject: exam.subjectName || exam.examSubject || exam.subject || 'General',
        deadline: exam.endDate,
        questions: questions
      }
    })

    const filteredCompleted = completed.filter(exam =>
      exam.title.toLowerCase().includes(completedSearchTerm.toLowerCase()) ||
      (exam.examSubject || '').toLowerCase().includes(completedSearchTerm.toLowerCase())
    )

    return {
      available,
      upcoming,
      completed: filteredCompleted.sort((a, b) => {
        const dateA = new Date(a.deadline || 0);
        const dateB = new Date(b.deadline || 0);
        return dateB - dateA;
      })
    }
  }, [exams, completedExams, completedSearchTerm])

  return (
    <div className="dashboard-container" style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar
        isExamActive={isExamActive}
        currentSection={currentSection}
        showSection={showSection}
        handleLogout={handleLogout}
        userRole="Student"
        availableExamsCount={examData.available.length}
      />

      <div className="main-content section-transition" style={{
        flex: 1,
        overflowY: 'auto',
        background: currentSection === 'profile' ? 'yellow' : 'var(--bg-surface)'
      }}>
        {loading ? (
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ marginBottom: '2rem' }}>
              <div style={{
                height: '2rem',
                width: '200px',
                background: 'linear-gradient(90deg, var(--bg-surface-hover) 25%, var(--bg-surface) 50%, var(--bg-surface-hover) 75%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.5s infinite',
                borderRadius: 'var(--radius-md)',
                marginBottom: '0.5rem'
              }}></div>
              <div style={{
                height: '1rem',
                width: '300px',
                background: 'linear-gradient(90deg, var(--bg-surface-hover) 25%, var(--bg-surface) 50%, var(--bg-surface-hover) 75%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.5s infinite',
                borderRadius: 'var(--radius-md)'
              }}></div>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '1.5rem'
            }}>
              {[1, 2, 3].map(i => (
                <div key={i} style={{
                  background: 'var(--bg-main)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '1.5rem',
                  boxShadow: 'var(--shadow-sm)'
                }}>
                  <div style={{
                    height: '1.5rem',
                    width: '70%',
                    background: 'linear-gradient(90deg, var(--bg-surface-hover) 25%, var(--bg-surface) 50%, var(--bg-surface-hover) 75%)',
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 1.5s infinite',
                    borderRadius: 'var(--radius-sm)',
                    marginBottom: '0.5rem'
                  }}></div>
                  <div style={{
                    height: '1rem',
                    width: '40%',
                    background: 'linear-gradient(90deg, var(--bg-surface-hover) 25%, var(--bg-surface) 50%, var(--bg-surface-hover) 75%)',
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 1.5s infinite',
                    borderRadius: 'var(--radius-sm)',
                    marginBottom: '1rem'
                  }}></div>
                  <div style={{
                    height: '3rem',
                    width: '100%',
                    background: 'linear-gradient(90deg, var(--bg-surface-hover) 25%, var(--bg-surface) 50%, var(--bg-surface-hover) 75%)',
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 1.5s infinite',
                    borderRadius: 'var(--radius-sm)',
                    marginBottom: '1rem'
                  }}></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{
                      height: '1rem',
                      width: '30%',
                      background: 'linear-gradient(90deg, var(--bg-surface-hover) 25%, var(--bg-surface) 50%, var(--bg-surface-hover) 75%)',
                      backgroundSize: '200% 100%',
                      animation: 'shimmer 1.5s infinite',
                      borderRadius: 'var(--radius-sm)'
                    }}></div>
                    <div style={{
                      height: '2.5rem',
                      width: '80px',
                      background: 'linear-gradient(90deg, var(--bg-surface-hover) 25%, var(--bg-surface) 50%, var(--bg-surface-hover) 75%)',
                      backgroundSize: '200% 100%',
                      animation: 'shimmer 1.5s infinite',
                      borderRadius: 'var(--radius-md)'
                    }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : error ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '48px',
                height: '48px',
                fill: '#ef4444',
                margin: '0 auto 1rem'
              }}>
                <svg viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
              </div>
              <h3 style={{ color: '#ef4444', marginBottom: '0.5rem' }}>Error Loading Exams</h3>
              <p style={{ color: '#6b7280', marginBottom: '1rem' }}>{error}</p>
              <button
                onClick={() => window.location.reload()}
                style={{
                  padding: '0.5rem 1rem',
                  background: 'var(--accent-primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                Try Again
              </button>
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
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
                    <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>Hello, {studentName}! 👋</h2>
                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.9rem', color: 'rgba(255,255,255,0.9)' }}>
                      You are logged in as a <span style={{ color: '#ffffff', fontWeight: 700, textDecoration: 'underline', textUnderlineOffset: '4px', textDecorationColor: 'rgba(255,255,255,0.4)' }}>{userRole || 'Student'}</span>
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
            <>

              {/* Dashboard Section */}
              {currentSection === 'dashboard' && (
                <UnifiedDashboard
                  userRole="Student"
                  userId={(() => {
                    const token = storage.getItem('token')
                    if (token) {
                      try {
                        const payload = JSON.parse(atob(token.split('.')[1]))
                        return payload.AccountId || payload.accountId || payload.sub || payload.id || payload.nameid || payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier']
                      } catch (e) {
                        console.error('Error parsing token:', e)
                      }
                    }
                    return null
                  })()}
                  allExams={[...exams.available, ...exams.upcoming]}
                  grades={dbGrades}
                  classes={dbClasses}
                  subjects={dbSubjects}
                />
              )}

              {/* Profile Section */}
              {currentSection === 'profile' && (
                <UserProfile
                  userRole="Student"
                  onBack={() => showSection('available')}
                />
              )}

              {/* Dashboard View */}
              {currentSection === 'available' && (
                <div style={{ padding: '2rem', background: 'var(--bg-surface)', minHeight: '100vh' }}>
                  <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <div className="content-header" style={{ marginBottom: '2rem' }}>
                      <h1 style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <svg style={{ width: '32px', height: '32px', fill: 'var(--primary)' }} viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" /></svg>
                        Available Exams
                      </h1>
                      <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', margin: 0 }}>
                        Select an exam to start. Good luck!
                      </p>
                    </div>

                    {/* Available Exams */}
                    {exams.available.length === 0 && exams.upcoming.length === 0 ? (
                      <div style={{
                        background: 'var(--bg-main)',
                        borderRadius: '16px',
                        padding: '4rem 2rem',
                        textAlign: 'center',
                        boxShadow: 'var(--shadow-sm)'
                      }}>
                        <svg style={{ width: '80px', height: '80px', fill: 'var(--text-light)', margin: '0 auto 1.5rem' }} viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" /></svg>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                          No exams available
                        </h3>
                        <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', margin: 0 }}>
                          There are no exams available at the moment. Check back later!
                        </p>
                      </div>
                    ) : (
                      <>
                        {/* Available Section */}
                        {exams.available.length > 0 && (
                          <div style={{ marginBottom: '3rem' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)', display: 'inline-block' }}></span>
                              Active Now
                            </h2>
                            <div style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                              gap: '1.5rem'
                            }}>
                              {exams.available.map((exam) => {
                                const timeUntil = getTimeUntilDeadline(exam.deadline || exam.endDate)
                                return (
                                  <div
                                    key={exam.examId}
                                    className="exam-card"
                                    style={{
                                      background: 'var(--bg-main)',
                                      borderRadius: 'var(--radius-lg)',
                                      padding: '1.5rem',
                                      boxShadow: 'var(--shadow-md)',
                                      borderLeft: '4px solid var(--primary)',
                                      transition: 'all var(--transition-base)',
                                      cursor: 'pointer',
                                      position: 'relative',
                                      overflow: 'hidden'
                                    }}
                                    onClick={() => startExam(exam)}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.transform = 'translateY(-4px)'
                                      e.currentTarget.style.boxShadow = 'var(--shadow-xl)'
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.transform = 'translateY(0)'
                                      e.currentTarget.style.boxShadow = 'var(--shadow-md)'
                                    }}
                                  >
                                    {/* Random Questions Badge */}
                                    <div style={{
                                      position: 'absolute',
                                      top: '1rem',
                                      right: '1rem',
                                      background: 'linear-gradient(135deg, var(--accent), var(--primary))',
                                      color: 'white',
                                      padding: '0.25rem 0.75rem',
                                      borderRadius: 'var(--radius-full)',
                                      fontSize: '0.75rem',
                                      fontWeight: '700',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '0.25rem',
                                      boxShadow: 'var(--shadow-sm)'
                                    }}>
                                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
                                      </svg>
                                      Randomized
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', marginTop: '1.5rem', gap: '1rem' }}>
                                      <div style={{ flex: 1, minWidth: 0 }}>
                                        <h3 style={{ 
                                          fontSize: '1.25rem', 
                                          fontWeight: '700', 
                                          color: 'var(--text-primary)', 
                                          margin: '0 0 0.5rem 0',
                                          display: '-webkit-box',
                                          WebkitLineClamp: 2,
                                          WebkitBoxOrient: 'vertical',
                                          overflow: 'hidden',
                                          wordBreak: 'break-word'
                                        }}>
                                          {exam.title} <span style={{ fontSize: '0.8rem', opacity: 0.5, fontWeight: 'normal' }}>(#{exam.examId})</span>
                                        </h3>
                                      </div>
                                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                        {exam.isExpired && (
                                          <div style={{ background: '#fee2e2', color: '#ef4444', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: '700', border: '1px solid #f87171' }}>
                                            EXPIRED
                                          </div>
                                        )}
                                        <div style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: '700' }}>
                                          {exam.questions ? exam.questions.length : 0} Qs
                                        </div>
                                        <div style={{ background: '#fef3c7', color: '#92400e', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: '700' }}>
                                          {exam.subject}
                                        </div>
                                      </div>
                                    </div>

                                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                      {exam.examDescription}
                                    </p>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: exam.isExpired ? 'var(--text-light)' : 'var(--text-secondary)' }}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z" /><path d="M12.5 7H11v6l5.25 3.15.75-1.23-4.5-2.67z" /></svg>
                                        {exam.isExpired ? 'Expired' : (timeUntil ? `Ends in ${timeUntil}` : 'Ends soon')}
                                      </div>
                                      <button 
                                        onClick={() => !exam.isExpired && startExam(exam)}
                                        disabled={exam.isExpired}
                                        style={{
                                          background: exam.isExpired ? 'var(--bg-light)' : 'var(--primary)',
                                          color: exam.isExpired ? 'var(--text-light)' : 'white',
                                          border: 'none',
                                          padding: '0.5rem 1.25rem',
                                          borderRadius: '8px',
                                          fontWeight: '600',
                                          cursor: exam.isExpired ? 'not-allowed' : 'pointer',
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '0.5rem'
                                        }}
                                      >
                                        {exam.isExpired ? 'Time Over' : 'Start'} 
                                        {!exam.isExpired && <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>}
                                      </button>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}

                        {/* Upcoming Section */}
                        {exams.upcoming.length > 0 && (
                          <div>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="var(--warning)"><path d="M22 5.72l-4.6-3.86-1.29 1.53 4.6 3.86L22 5.72zM7.88 3.39L6.6 1.86 2 5.71l1.29 1.53 4.59-3.85zM12.5 8H11v6l4.75 2.85.75-1.23-4-2.37V8zM12 4c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9zm0 16c-3.86 0-7-3.14-7-7s3.14-7 7-7 7 3.14 7 7-3.14 7-7 7z" /></svg>
                              Upcoming
                            </h2>
                            <div style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                              gap: '1.5rem'
                            }}>
                              {exams.upcoming.map((exam) => (
                                <div
                                  key={exam.examId}
                                  className="exam-card"
                                  style={{
                                    background: 'var(--bg-main)',
                                    borderRadius: 'var(--radius-lg)',
                                    padding: '1.5rem',
                                    boxShadow: 'var(--shadow-sm)',
                                    borderLeft: '4px solid var(--warning)',
                                    opacity: 0.9
                                  }}
                                >
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem', gap: '1rem' }}>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <h3 style={{ 
                                        fontSize: '1.25rem', 
                                        fontWeight: '700', 
                                        color: 'var(--text-primary)', 
                                        margin: '0',
                                        display: '-webkit-box',
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: 'vertical',
                                        overflow: 'hidden',
                                        wordBreak: 'break-word'
                                      }}>
                                        {exam.title}
                                      </h3>
                                    </div>
                                    <div style={{ flexShrink: 0 }}>
                                      <div style={{ display: 'inline-block', background: '#fef3c7', color: '#92400e', padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.7rem', fontWeight: '700' }}>
                                        {exam.subject}
                                      </div>
                                    </div>
                                  </div>
                                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '1rem 0' }}>
                                    {exam.examDescription}
                                  </p>
                                  <div style={{
                                    padding: '0.75rem',
                                    background: 'var(--warning-bg)',
                                    color: 'var(--warning-dark)',
                                    borderRadius: '8px',
                                    fontSize: '0.875rem',
                                    fontWeight: '600',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                  }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z" /><path d="M12.5 7H11v6l5.25 3.15.75-1.23-4.5-2.67z" /></svg>
                                    Starts: {new Date(exam.startDate).toLocaleString()}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Completed Exams */}
              {currentSection === 'completed' && (
                <div style={{ padding: '2rem', background: 'var(--bg-surface)', minHeight: '100vh' }}>
                  <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <div className="content-header" style={{ marginBottom: '2rem' }}>
                      <h1 style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <svg style={{ width: '32px', height: '32px', fill: 'var(--success)' }} viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" /></svg>
                        Completed Exams
                      </h1>
                      <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', margin: 0 }}>
                        Review your past performance and scores.
                      </p>
                    </div>

                    {/* Search Bar */}
                    <div style={{ marginBottom: '2rem', position: 'relative' }}>
                      <input
                        type="text"
                        placeholder="Search completed exams by title or subject..."
                        value={completedSearchTerm}
                        onChange={(e) => setCompletedSearchTerm(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '1rem 1rem 1rem 3.5rem',
                          borderRadius: '12px',
                          border: '2px solid var(--border-color)',
                          background: 'var(--bg-main)',
                          color: 'var(--text-primary)',
                          fontSize: '1rem',
                          outline: 'none',
                          transition: 'all 0.2s ease',
                          boxShadow: 'var(--shadow-sm)'
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = 'var(--primary)'
                          e.target.style.boxShadow = 'var(--shadow-md)'
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = 'var(--border-color)'
                          e.target.style.boxShadow = 'var(--shadow-sm)'
                        }}
                      />
                      <svg
                        style={{
                          position: 'absolute',
                          left: '1.25rem',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          width: '24px',
                          height: '24px',
                          fill: 'var(--text-secondary)',
                          pointerEvents: 'none'
                        }}
                        viewBox="0 0 24 24"
                      >
                        <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
                      </svg>
                      {completedSearchTerm && (
                        <button
                          onClick={() => setCompletedSearchTerm('')}
                          style={{
                            position: 'absolute',
                            right: '1.25rem',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--text-secondary)',
                            hover: { color: 'var(--text-primary)' }
                          }}
                        >
                          <svg style={{ width: '20px', height: '20px', fill: 'currentColor' }} viewBox="0 0 24 24">
                            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                          </svg>
                        </button>
                      )}
                    </div>

                    {examData.completed.length === 0 ? (
                      <div style={{
                        background: 'var(--bg-main)',
                        borderRadius: '16px',
                        padding: '4rem 2rem',
                        textAlign: 'center',
                        boxShadow: 'var(--shadow-sm)'
                      }}>
                        <svg style={{ width: '80px', height: '80px', fill: 'var(--text-light)', margin: '0 auto 1.5rem' }} viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" /></svg>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                          No Completed Exams
                        </h3>
                        <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', margin: 0 }}>
                          You haven't completed any exams yet. Check the Available Exams section to get started!
                        </p>
                      </div>
                    ) : (
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                        gap: '1.5rem'
                      }}>
                        {examData.completed.map((exam) => (
                          <div
                            key={exam.examId}
                            className="exam-card"
                            style={{
                              background: 'var(--bg-main)',
                              borderRadius: '16px',
                              padding: '1.5rem',
                              boxShadow: 'var(--shadow-md)',
                              borderLeft: '4px solid var(--success)',
                              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                              cursor: 'pointer'
                            }}
                            onClick={() => reviewExam(exam)}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'translateY(-4px)'
                              e.currentTarget.style.boxShadow = 'var(--shadow-lg)'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'translateY(0)'
                              e.currentTarget.style.boxShadow = 'var(--shadow-md)'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', gap: '1rem' }}>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <h3 style={{ 
                                  fontSize: '1.25rem', 
                                  fontWeight: '700', 
                                  color: 'var(--text-primary)', 
                                  margin: '0 0 0.5rem 0',
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                  wordBreak: 'break-word'
                                }}>
                                  {exam.title} <span style={{ fontSize: '0.8rem', opacity: 0.5, fontWeight: 'normal' }}>(#{exam.examId})</span>
                                </h3>
                                <div style={{ display: 'inline-block', background: '#fef3c7', color: '#92400e', padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.7rem', fontWeight: '700' }}>
                                  {exam.subject}
                                </div>
                              </div>
                              <div style={{ 
                                background: exam.isMissed ? '#fee2e2' : 'var(--success-bg)', 
                                color: exam.isMissed ? '#ef4444' : 'var(--success)', 
                                padding: '0.25rem 0.75rem', 
                                borderRadius: '999px', 
                                fontSize: '0.75rem', 
                                fontWeight: '700' 
                              }}>
                                {exam.isMissed ? '0%' : (Math.round((exam.score || 0) * 100) / 100 + '%')}
                              </div>
                            </div>

                            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                              {exam.examDescription}
                            </p>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: exam.isMissed ? '#ef4444' : 'var(--text-secondary)' }}>
                                {exam.isMissed ? (
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" /></svg>
                                ) : (
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" /></svg>
                                )}
                                {exam.isMissed ? 'Missed' : 'Completed'}
                              </div>
                              <button style={{
                                background: 'var(--bg-surface)',
                                color: 'var(--text-primary)',
                                border: '1px solid var(--border-color)',
                                padding: '0.5rem 1.25rem',
                                borderRadius: '8px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                              }}>
                                Review <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" /></svg>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Quiz Interface */}
              {currentSection === 'quiz' && currentExam && (
                <QuizInterface
                  currentQuiz={currentExam}
                  isReviewMode={isReviewMode}
                  formatTimerDisplay={(seconds) => {
                    const hours = Math.floor(seconds / 3600)
                    const minutes = Math.floor((seconds % 3600) / 60)
                    const secs = seconds % 60
                    if (hours > 0) {
                      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
                    }
                    return `${minutes}:${secs.toString().padStart(2, '0')}`
                  }}
                  timeRemaining={timeRemaining}
                  submitQuiz={submitExam}
                  backToDashboard={isReviewMode ? backToCompleted : () => {
                    setIsExamActive(false)
                    setCurrentSection('available')
                    setCurrentExam(null)
                    setTimeRemaining(0)
                  }}
                />
              )}
            </>
          </div>
        )}
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
  )
}
