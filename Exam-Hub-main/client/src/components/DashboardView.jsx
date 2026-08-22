import React from 'react'

export default function DashboardView({
  quizData,
  subjectInfo,
  currentSubject,
  onStartQuiz,
  onShowSubject,
  onBackToSubjects,
  getTimeUntilDeadline,
}) {
  function renderAllQuizzes() {
    const quizzes = quizData?.available || []
    if (!quizzes || quizzes.length === 0) {
      return (
        <div className="empty-state">
          <svg className="empty-icon" viewBox="0 0 24 24">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
          </svg>
          <h3 className="empty-title">No quizzes found</h3>
          <p className="empty-description">No quizzes available at the moment.</p>
        </div>
      )
    }

    return (
      <div className="quizzes-container" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: '1.5rem',
        justifyContent: 'center',
        width: '100%'
      }}>
        {quizzes.map((quiz) => {
          const now = new Date()
          const deadlineDate = new Date(quiz.deadline)
          const startDate = quiz.startDate ? new Date(quiz.startDate) : null
          const diff = deadlineDate.getTime() - now.getTime()
          const isExpired = diff <= 0
          const hasStarted = !startDate || startDate <= now

          if (isExpired) {
            return (
              <div
                key={quiz.id}
                className="quiz-card"
                style={{
                  background: 'white',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  boxShadow: '0 4px 18px rgba(0,0,0,.06)',
                  border: '2px solid #e5e7eb',
                  opacity: 0.5,
                  cursor: 'not-allowed'
                }}
              >
                <div className="quiz-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div className="quiz-info" style={{ flex: 1 }}>
                    <h4 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1f2937', margin: '0 0 0.5rem 0' }}>{quiz.name}</h4>
                    <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0 0 0.5rem 0' }}>{quiz.subject}</p>
                    <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>{(quiz.questions || []).length} Questions • {quiz.duration || 60} minutes</p>
                  </div>
                  <div className="quiz-timer" style={{ textAlign: 'right' }}>
                    <div className="timer-display danger" style={{ fontSize: '1rem', fontWeight: '700', color: '#ef4444' }}>EXPIRED</div>
                    <div className="timer-label" style={{ fontSize: '0.75rem', color: '#6b7280' }}>Quiz Expired</div>
                  </div>
                </div>
              </div>
            )
          }

          const days = Math.floor(diff / (1000 * 60 * 60 * 24))
          const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

          let timerClass = ''
          let displayText = ''
          let timerColor = '#10b981'
          let statusLabel = 'Time Left'
          let isClickable = hasStarted

          if (!hasStarted && startDate) {
            const startDiff = startDate.getTime() - now.getTime()
            const startDays = Math.floor(startDiff / (1000 * 60 * 60 * 24))
            const startHours = Math.floor((startDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
            const startMinutes = Math.floor((startDiff % (1000 * 60 * 60)) / (1000 * 60))

            if (startDays > 0) {
              displayText = `Starts in ${startDays}d ${startHours}h`
            } else if (startHours > 0) {
              displayText = `Starts in ${startHours}h ${startMinutes}m`
            } else {
              displayText = `Starts in ${startMinutes}m`
            }
            timerColor = '#6b7280'
            statusLabel = 'Starts Soon'
            isClickable = false
          } else if (days > 0) {
            displayText = `${days}d ${hours}h`
          } else if (hours > 0) {
            displayText = `${hours}h ${minutes}m`
            if (hours < 2) {
              timerClass = 'warning'
              timerColor = '#f59e0b'
            }
          } else {
            displayText = `${minutes}m`
            timerClass = minutes < 30 ? 'danger' : 'warning'
            timerColor = minutes < 30 ? '#ef4444' : '#f59e0b'
          }

          return (
            <div
              key={quiz.id}
              className="quiz-card"
              onClick={() => {
                if (isClickable) {
                  onStartQuiz(quiz)
                }
              }}
              style={{
                background: 'white',
                borderRadius: '16px',
                padding: '1.5rem',
                boxShadow: '0 4px 18px rgba(0,0,0,.06)',
                border: '2px solid #e5e7eb',
                cursor: isClickable ? 'pointer' : 'default',
                transition: 'all 0.3s ease',
                opacity: isClickable ? 1 : 0.8
              }}
              onMouseEnter={(e) => {
                if (isClickable) {
                  e.currentTarget.style.transform = 'translateY(-4px)'
                  e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,.12)'
                  e.currentTarget.style.borderColor = '#3b82f6'
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 4px 18px rgba(0,0,0,.06)'
                e.currentTarget.style.borderColor = '#e5e7eb'
              }}
            >
              <div className="quiz-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div className="quiz-info" style={{ flex: 1 }}>
                  <h4 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1f2937', margin: '0 0 0.5rem 0' }}>{quiz.name}</h4>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0 0 0.5rem 0' }}>{quiz.subject}</p>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>{quiz.questions.length} Questions • {quiz.duration || 60} minutes</p>
                </div>
                <div className="quiz-timer" style={{ textAlign: 'right' }}>
                  <div className={`timer-display ${timerClass}`} style={{ fontSize: '1rem', fontWeight: '700', color: timerColor }}>{displayText}</div>
                  <div className="timer-label" style={{ fontSize: '0.75rem', color: '#6b7280' }}>{statusLabel}</div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    )
  }


  return (
    <div id="dashboard-view" style={{ width: '100%' }}>
      <div className="content-header" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 className="content-title" id="section-title" style={{ fontSize: '2rem', fontWeight: '700', color: '#1f2937', marginBottom: '0.5rem' }}>
            <svg className="title-icon" viewBox="0 0 24 24" role="img" aria-label="Section Icon" style={{ width: '28px', height: '28px', marginRight: '0.75rem', verticalAlign: 'middle' }}>
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
            </svg>
            Available Quizzes
          </h1>
          <p className="content-subtitle" id="section-subtitle" style={{ fontSize: '1rem', color: '#6b7280', margin: 0 }}>
            {quizData?.available?.length || 0} {quizData?.available?.length === 1 ? 'quiz' : 'quizzes'} available. Click on a quiz to start.
          </p>
        </div>
      </div>
      <div id="content-container" style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
        <div style={{ width: '100%', maxWidth: '1400px' }}>
          {renderAllQuizzes()}
        </div>
      </div>
    </div>
  )
}
