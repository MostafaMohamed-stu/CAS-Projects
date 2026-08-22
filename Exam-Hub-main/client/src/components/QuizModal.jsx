import React, { useEffect, useState } from 'react'

export default function QuizModal({ title = '', message = '', onConfirm, onCancel, isActive }) {
  const [modalTitle, setModalTitle] = useState('')
  const [modalMessage, setModalMessage] = useState('')

  useEffect(() => {
    setModalTitle(title)
    setModalMessage(message.replace(/\n/g, '<br>'))
  }, [title, message])

  return (
    <div id="custom-modal" className={`modal-overlay ${isActive ? 'active' : ''}`}>
      <div className="modal-content">
        <h3 className="modal-title" id="modal-title">{modalTitle}</h3>
        <p className="modal-message" id="modal-message" dangerouslySetInnerHTML={{ __html: modalMessage }} />
        <div className="modal-actions">
          <button className="modal-btn modal-btn-confirm" id="modal-confirm" onClick={onConfirm}>Confirm</button>
          <button className="modal-btn modal-btn-cancel" id="modal-cancel" onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  )
}
