import { useState, useRef, useEffect } from 'react'
import api from '../api/axios'
import { storage } from '../utils/storage'

export default function FileUpload({ onQuestionsExtracted, onClose, bankKey }) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const fileInputRef = useRef(null)

  useEffect(() => {
    const onEsc = (e) => { if (e.key === 'Escape') onClose?.() }
    document.addEventListener('keydown', onEsc)
    return () => document.removeEventListener('keydown', onEsc)
  }, [onClose])

  const handleFileUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ]
    if (!validTypes.includes(file.type)) {
      setError('Please upload a valid Excel file (.xlsx)')
      return
    }

    setIsUploading(true)
    setError('')
    setSuccess('')
    setUploadProgress(10) // Start progress

    try {
      const formData = new FormData()
      formData.append('file', file)

      // Extract accountId
      let accountId = 0
      const token = storage.getItem('token')
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]))
          accountId = Number(payload.AccountId || payload.accountId || payload.sub) || 0
        } catch (e) {
          console.error('Error parsing token', e)
        }
      }
      formData.append('accountId', accountId)
      if (bankKey) {
        formData.append('bankKey', bankKey)
      }

      setUploadProgress(30)

      const response = await api.post('/questionbank/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          // Map upload progress to 30-80 range to leave room for processing
          setUploadProgress(30 + Math.round(percentCompleted * 0.5))
        }
      })

      setUploadProgress(90)

      const result = response.data

      if (result.addedQuestions && result.addedQuestions.length > 0) {
        // Map the questions to the format expected by the frontend editor
        const mappedQuestions = result.addedQuestions.map(q => {
          // Determine type based on options. 
          // Backend stores flat options.
          let type = 'mcq' // Default
          // Logic to infer type from fields if needed, or backend could send it.
          // Current backend DTO has standard fields. 
          // Frontend existing logic infers type from options presence.

          // Reuse frontend inference or rely on what we sent?
          // We sent standard QuestionBank entity.
          // Let's assume MCQ if options present, TF/FillBlank otherwise?
          // Wait, backend logic for upload set 'Overall' type? No, it used template logic.

          // Let's infer type like fetch logic in TeacherPage
          const hasCD = q.optionC || q.optionD;
          const typeDetected = q.optionC ? (q.optionD ? 'mcq' : (q.optionA && q.optionB ? 'true_false' : 'fill_blank')) : 'fill_blank';

          // If uploaded options were blank, this inference might fail.
          // But upload logic uses template. Assuming standard template.

          // More robust inference:
          // The backend upload logic tried to set UsedOptions=4.

          // Correct answer format in backend: "A", "True", "Paris".
          // Frontend expects:
          // MCQ: correct is INDEX (0-3).
          // TF: correct is BOOLEAN.
          // Fill: correct is STRING.

          let correctVal = q.correctAnswer;
          let options = [q.optionA, q.optionB, q.optionC, q.optionD].filter(x => x !== null && x !== undefined); // allow empty strings if they are placeholders? 
          // Actually frontend expects 4 options for MCQ padding.

          let finalType = 'mcq';
          let finalCorrect = 0;

          // Try to detect True/False
          if (options.length === 2 && options[0]?.toLowerCase() === 'true' && options[1]?.toLowerCase() === 'false') {
            finalType = 'true_false' // Wait, usually TF options are implicit in frontend or explicit?
            // In TeacherPage TF, it renders fixed buttons.
          }

          // Let's simpler approach: check CorrectAnswer string.
          if (q.correctAnswer?.toLowerCase() === 'true' || q.correctAnswer?.toLowerCase() === 'false') {
            finalType = 'true_false';
            finalCorrect = q.correctAnswer?.toLowerCase() === 'true';
          } else if (q.optionA && q.optionB && q.optionC && q.optionD) {
            finalType = 'mcq';
            // Map "Option A" or "A" or value to index.
            // Backend stores the value of the correct answer?
            // My upload logic stored `row.Cell(3)` as CorrectAnswer.
            // The template says "Correct Answer: 4" (for value) or "Option A" value?
            // Template Example: "Correct Answer: 4" implies the value "4".
            // Template Example #2: "Correct Answer: Cairo". optionA="Answer.."

            // So we need to find the index of CorrectAnswer in Options.
            const idx = options.findIndex(o => o?.trim() === q.correctAnswer?.trim());
            finalCorrect = idx >= 0 ? idx : 0;
          } else {
            finalType = 'fill_blank';
            finalCorrect = q.correctAnswer;
          }

          return {
            id: q.questionId,
            type: finalType,
            question: q.questionTitle,
            options: [q.optionA || '', q.optionB || '', q.optionC || '', q.optionD || ''],
            correct: finalCorrect,
            marks: q.mark
          }
        });

        setSuccess(`Successfully uploaded ${result.successCount} questions!`)
        if (onQuestionsExtracted) {
          onQuestionsExtracted(mappedQuestions)
        }
        setTimeout(() => { onClose?.() }, 1500)
      } else {
        if (result.errors && result.errors.length > 0) {
          setError(`Upload finished with errors: ${result.errors[0]} ...`)
        } else {
          setError('No questions were added.')
        }
      }
    } catch (error) {
      console.error(error)
      setError(error.response?.data?.message || 'Error processing the file')
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const handleDrop = (event) => {
    event.preventDefault()
    const files = event.dataTransfer.files
    if (files.length > 0) {
      const file = files[0]
      const dataTransfer = new DataTransfer()
      dataTransfer.items.add(file)
      fileInputRef.current.files = dataTransfer.files
      handleFileUpload({ target: { files: dataTransfer.files } })
    }
  }
  const handleDragOver = (event) => { event.preventDefault(); event.currentTarget.classList.add('dragover') }
  const handleDragLeave = (event) => { event.preventDefault(); event.currentTarget.classList.remove('dragover') }

  const downloadTemplate = async () => {
    try {
      const response = await api.get('/questionbank/template', {
        responseType: 'blob'
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'Questions_Template.xlsx')
      document.body.appendChild(link)
      link.click()
      link.parentNode.removeChild(link)
    } catch (error) {
      console.error('Error downloading template:', error)
      let msg = 'Failed to download template'
      if (error.response && error.response.data instanceof Blob) {
        try {
          const text = await error.response.data.text()
          const json = JSON.parse(text)
          if (json.message) msg = json.message
        } catch (e) {
          // ignore, not json
        }
      } else if (error.message) {
        msg = error.message
      }
      setError(msg)
    }
  }

  const overlayStyle = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }
  const modalStyle = { width: 'min(720px, 92vw)', maxHeight: '90vh', overflow: 'auto', background: '#fff', borderRadius: '16px', boxShadow: '0 20px 60px rgba(0,0,0,.3)', border: '1px solid #e5e7eb' }
  const headerStyle = { padding: '1.25rem 1.5rem', borderBottom: '1px solid #f3f4f6' }
  const bodyStyle = { padding: '1.25rem 1.5rem' }
  const footerStyle = { padding: '1rem 1.5rem', borderTop: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between' }
  const primaryBtn = { background: '#10b981', color: '#fff', border: 'none', padding: '.6rem 1rem', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }
  const secondaryBtn = { background: '#f3f4f6', color: '#111827', border: '1px solid #e5e7eb', padding: '.6rem 1rem', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }
  const closeXStyle = { position: 'absolute', right: '12px', top: '10px', background: 'transparent', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: '#6b7280' }

  return (
    <div style={overlayStyle} onClick={(e) => { if (e.target === e.currentTarget) onClose?.() }}>
      <div style={{ position: 'relative', ...modalStyle }}>
        <button type="button" aria-label="Close" onClick={onClose} style={closeXStyle}>×</button>
        <div style={headerStyle}>
          <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Upload Questions from File</h2>
          <p style={{ margin: '0.25rem 0 0', color: '#6b7280' }}>Upload an Excel (.xlsx) file to import questions.</p>
        </div>
        <div style={bodyStyle}>
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            style={{ border: '2px dashed #cbd5e1', borderRadius: '12px', padding: '1.25rem', textAlign: 'center', background: '#f8fafc' }}
          >
            <div style={{ marginBottom: '.5rem' }}>
              <svg viewBox="0 0 24 24" width="42" height="42" fill="#60a5fa"><path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z" /></svg>
            </div>
            <p style={{ margin: 0, color: '#334155' }}>
              Drag and drop your file here, or{' '}
              <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isUploading} style={{ background: 'transparent', border: 'none', color: '#2563eb', fontWeight: 700, cursor: 'pointer' }}>browse files</button>
            </p>
            <p style={{ margin: '0.25rem 0 0', color: '#64748b', fontSize: '.9rem' }}>Supports .xlsx files</p>
            <input ref={fileInputRef} type="file" accept=".xlsx" onChange={handleFileUpload} style={{ display: 'none' }} disabled={isUploading} />
          </div>

          {isUploading && (
            <div style={{ marginTop: '1rem' }}>
              <div style={{ height: '10px', background: '#f1f5f9', borderRadius: '999px' }}>
                <div style={{ width: `${uploadProgress}%`, height: '10px', background: '#10b981', borderRadius: '999px', transition: 'width .2s ease' }}></div>
              </div>
              <p style={{ marginTop: '.5rem', color: '#64748b' }}>Processing... {uploadProgress}%</p>
            </div>
          )}

          {error ? (<div style={{ marginTop: '1rem', background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca', padding: '.75rem 1rem', borderRadius: '8px' }}>{error}</div>) : null}
          {success ? (<div style={{ marginTop: '1rem', background: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0', padding: '.75rem 1rem', borderRadius: '8px' }}>{success}</div>) : null}
        </div>
        <div style={footerStyle}>
          <button type="button" style={secondaryBtn} onClick={downloadTemplate}>Download Template (Excel)</button>
          <div style={{ display: 'flex', gap: '.5rem' }}>
            <button type="button" style={secondaryBtn} onClick={onClose} disabled={isUploading}>Close</button>
            <button type="button" style={primaryBtn} onClick={() => fileInputRef.current?.click()} disabled={isUploading}>Choose File</button>
          </div>
        </div>
      </div>
    </div>
  )
}
