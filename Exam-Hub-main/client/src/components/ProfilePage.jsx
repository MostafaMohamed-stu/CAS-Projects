import React from 'react'

export default function ProfilePage({
  quizData,
  setCurrentSection
}) {
  return (
    <div className="profile-page active">
      <div className="profile-header">
        <div className="profile-avatar">BA</div>
        <h2 className="profile-name">Bassem Ahmed</h2>
        <p className="profile-email">bassem.ahmed@example.com</p>
      </div>
      <div className="profile-content">
        <div className="profile-info-grid">
          <div className="info-card">
            <div className="info-label">Student ID</div>
            <div className="info-value">
              <svg className="info-icon" viewBox="0 0 24 24" role="img" aria-label="Student ID Icon">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
              STU-2024-001
            </div>
          </div>
          <div className="info-card">
            <div className="info-label">Grade</div>
            <div className="info-value">
              <svg className="info-icon" viewBox="0 0 24 24" role="img" aria-label="Grade Icon">
                <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z" />
              </svg>
              Grade 10
            </div>
          </div>
          <div className="info-card">
            <div className="info-label">Class</div>
            <div className="info-value">
              <svg className="info-icon" viewBox="0 0 24 24" role="img" aria-label="Class Icon">
                <path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z" />
              </svg>
              Class A
            </div>
          </div>
          <div className="info-card">
            <div className="info-label">Total Quiz Score</div>
            <div className="info-value">
              <svg className="info-icon" viewBox="0 0 24 24" role="img" aria-label="Total Quiz Score Icon">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              {(quizData?.completed || []).reduce((total, quiz) => total + (quiz.earnedMarks || 0), 0)}/{(quizData?.completed || []).reduce((total, quiz) => total + (quiz.totalMarks || 0), 0)} Marks
            </div>
          </div>
          <div className="info-card">
            <div className="info-label">Completed Quizzes</div>
            <div className="info-value">
              <svg className="info-icon" viewBox="0 0 24 24" role="img" aria-label="Completed Quizzes Icon">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
              </svg>
              {(quizData?.completed || []).length} Quizzes
            </div>
          </div>
        </div>
        <button className="back-btn" onClick={() => setCurrentSection('upcoming')}>
          ← Back to Dashboard
        </button>
      </div>
    </div>
  )
}
