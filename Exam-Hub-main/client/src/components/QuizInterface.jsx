import React, { useState, useEffect, useRef } from 'react'

export default function QuizInterface({
  currentQuiz,
  isReviewMode,
  formatTimerDisplay,
  timeRemaining,
  submitQuiz,
  backToDashboard,
}) {
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)

  if (!currentQuiz) return null

  // Helper function to render rich text (markdown-like to HTML)
  const renderRichText = (text) => {
    if (!text) return { __html: '' }
    let html = text
    // Convert markdown-like formatting to HTML
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>')
    html = html.replace(/__(.*?)__/g, '<u>$1</u>')
    html = html.replace(/\^(.*?)\^/g, '<sup>$1</sup>')
    html = html.replace(/~(.*?)~/g, '<sub>$1</sub>')
    html = html.replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" style="max-width: 100%; height: auto; margin: 10px 0; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" />')
    return { __html: html }
  }

  // Helper function to create question HTML
  const createQuestionHTML = (question, index, reviewMode = false) => {
    const num = index + 1
    if (question.type === 'mcq') {
      return (
        <div className="mcq-options">
          {question.options.map((option, optionIndex) => {
            let optionClass = 'mcq-option'
            let indicator = null
            let style = {}

            if (reviewMode) {
              const isCorrect = optionIndex === question.correct
              const isUser = optionIndex === question.userAnswer

              if (isCorrect) {
                optionClass += ' correct'
                style = { backgroundColor: '#d1fae5', borderColor: '#10b981', borderWidth: '2px' }
                indicator = <span className="answer-indicator correct" style={{ color: '#10b981', fontWeight: 'bold' }}>✓ Correct Answer</span>
              }
              if (isUser && !isCorrect) {
                optionClass += ' incorrect'
                style = { backgroundColor: '#fee2e2', borderColor: '#ef4444', borderWidth: '2px' }
                indicator = <span className="answer-indicator incorrect" style={{ color: '#ef4444', fontWeight: 'bold' }}>✗ Your Answer (Incorrect)</span>
              }
              if (isUser && isCorrect) {
                style = { ...style, backgroundColor: '#d1fae5', borderColor: '#10b981', borderWidth: '2px' }
              }
            }

            return (
              <label key={optionIndex} className={optionClass} htmlFor={`q${num}_${optionIndex}`} style={style}>
                <input type="radio" id={`q${num}_${optionIndex}`} name={`question_${num}`} value={option} disabled={reviewMode} defaultChecked={reviewMode && optionIndex === question.userAnswer} />
                <span dangerouslySetInnerHTML={renderRichText(option)} />
                {indicator}
              </label>
            )
          })}
        </div>
      )
    }
    if (question.type === 'tf') {
      const trueCorrect = reviewMode && question.correct === true
      const trueUser = reviewMode && question.userAnswer === true
      const falseCorrect = reviewMode && question.correct === false
      const falseUser = reviewMode && question.userAnswer === false

      const trueStyle = trueCorrect ? { backgroundColor: '#d1fae5', borderColor: '#10b981', borderWidth: '2px' } :
        (trueUser && !trueCorrect) ? { backgroundColor: '#fee2e2', borderColor: '#ef4444', borderWidth: '2px' } : {}
      const falseStyle = falseCorrect ? { backgroundColor: '#d1fae5', borderColor: '#10b981', borderWidth: '2px' } :
        (falseUser && !falseCorrect) ? { backgroundColor: '#fee2e2', borderColor: '#ef4444', borderWidth: '2px' } : {}

      return (
        <div className="tf-options">
          <label className={trueCorrect ? 'tf-option correct' : (trueUser && !trueCorrect) ? 'tf-option incorrect' : 'tf-option'}
            htmlFor={`q${num}_true`} style={trueStyle}>
            <input type="radio" id={`q${num}_true`} name={`question_${num}`} value="true" disabled={reviewMode} defaultChecked={reviewMode && question.userAnswer === true} />
            <span>True</span>
            {trueCorrect && <span className="answer-indicator correct" style={{ color: '#10b981', fontWeight: 'bold' }}>✓ Correct Answer</span>}
            {trueUser && !trueCorrect && <span className="answer-indicator incorrect" style={{ color: '#ef4444', fontWeight: 'bold' }}>✗ Your Answer (Incorrect)</span>}
          </label>
          <label className={falseCorrect ? 'tf-option correct' : (falseUser && !falseCorrect) ? 'tf-option incorrect' : 'tf-option'}
            htmlFor={`q${num}_false`} style={falseStyle}>
            <input type="radio" id={`q${num}_false`} name={`question_${num}`} value="false" disabled={reviewMode} defaultChecked={reviewMode && question.userAnswer === false} />
            <span>False</span>
            {falseCorrect && <span className="answer-indicator correct" style={{ color: '#10b981', fontWeight: 'bold' }}>✓ Correct Answer</span>}
            {falseUser && !falseCorrect && <span className="answer-indicator incorrect" style={{ color: '#ef4444', fontWeight: 'bold' }}>✗ Your Answer (Incorrect)</span>}
          </label>
        </div>
      )
    }
    if (question.type === 'fill') {
      const isCorrect = reviewMode && question.userAnswer && question.userAnswer.toLowerCase().trim() === question.correct.toLowerCase().trim()
      const inputClass = reviewMode ? (isCorrect ? 'fill-input correct' : 'fill-input incorrect') : 'fill-input'
      const inputStyle = isCorrect ? { backgroundColor: '#d1fae5', borderColor: '#10b981', borderWidth: '2px' } :
        (reviewMode && !isCorrect) ? { backgroundColor: '#fee2e2', borderColor: '#ef4444', borderWidth: '2px' } : {}
      return (
        <div className="fill-gap">
          <input type="text" className={inputClass} name={`question_${num}`} placeholder="Enter your answer..." disabled={reviewMode} defaultValue={reviewMode ? (question.userAnswer || '') : ''} style={inputStyle} />
          {reviewMode ? (
            <div className={`fill-answer-display ${isCorrect ? 'correct' : 'incorrect'}`} style={isCorrect ? { color: '#10b981', fontWeight: 'bold' } : { color: '#ef4444', fontWeight: 'bold' }}>
              {isCorrect ? '✓ Correct!' : <span>✗ Your answer: "{question.userAnswer || 'No answer'}" | Correct answer: <span dangerouslySetInnerHTML={renderRichText(question.correct)} /></span>}
            </div>
          ) : null}
        </div>
      )
    }
    return null
  }

  useEffect(() => {
    if (currentQuiz && !isReviewMode && timeRemaining === 0) {
      setShowSuccessMessage(true)
      const timer = setTimeout(() => {
        setShowSuccessMessage(false)
      }, 2000)
      return () => clearTimeout(timer)
    } else {
      setShowSuccessMessage(false)
    }
  }, [currentQuiz, isReviewMode, timeRemaining])

  return (
    <div id="quiz-view" className={`quiz-interface ${currentQuiz ? 'active' : ''}`}>
      <div className={isReviewMode ? 'quiz-review-header' : 'quiz-header'} id="quiz-header">
        {isReviewMode && (
          <button
            className="quiz-close-btn"
            onClick={backToDashboard}
            aria-label="Close exam"
          >
            ×
          </button>
        )}
        <h1 className="quiz-title" id="current-quiz-title">
          {currentQuiz.name}{isReviewMode ? ' - Review' : ''}
        </h1>
        <div className={isReviewMode ? 'review-score' : 'quiz-timer-display'} id="quiz-timer-display">
          {isReviewMode ? `Score: ${currentQuiz.earnedMarks ?? 0}/${currentQuiz.totalMarks ?? currentQuiz.questions.reduce((t, q) => t + (q.marks || 1), 0)} Marks` : formatTimerDisplay(timeRemaining)}
        </div>
        <div className="quiz-info-bar">
          <span id="quiz-subject">{currentQuiz.subject}</span>
          <span id="quiz-questions-count">{currentQuiz.questions.length} Questions</span>
          {isReviewMode && currentQuiz.totalMarks && (
            <span id="quiz-total-marks">Total: {currentQuiz.totalMarks} Marks</span>
          )}
        </div>
      </div>
      <form
        className="quiz-form"
        id="quiz-form"
        onSubmit={(e) => { e.preventDefault(); if (!isReviewMode) submitQuiz(); }}
      >
        <div className={`success-message ${showSuccessMessage ? 'show' : ''}`} id="success-message">
          Exam submitted successfully! Moving to completed exams...
        </div>
        <div id="quiz-questions">
          {currentQuiz.questions.map((question, index) => (
            <div key={index} className="question">
              <span className="question-number">{index + 1}</span>
              <span className="question-text" dangerouslySetInnerHTML={renderRichText(question.question)} />
              <span className="question-type">{(question.type || '').toUpperCase()}</span>
              {question.marks && (
                <span className="question-marks">
                  {question.marks} Marks
                </span>
              )}
              {createQuestionHTML(question, index, isReviewMode)}
            </div>
          ))}
        </div>
        <div className="submit-section" id="submit-section">
          {!isReviewMode && (
            <button type="submit" className="submit-btn" id="submit-btn">
              Submit Quiz
            </button>
          )}
          {isReviewMode && (
            <button
              type="button"
              className="back-btn"
              onClick={backToDashboard}
              style={{ marginLeft: !isReviewMode ? '1rem' : 0 }}
            >
              ← Back to Dashboard
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
