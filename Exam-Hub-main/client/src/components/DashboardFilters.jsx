import { useState, useEffect } from 'react'
import api from '../api/axios'
import ModernSelect from './ModernSelect'
import ModernDatePicker from './ModernDatePicker'

export default function DashboardFilters({ onFilterChange, userRole, grades = [], classes = [], subjects = [], allExams = [], recentExams = [], selectedExamId = null, onExamChange, currentFilters = null }) {
  const [selectedGrade, setSelectedGrade] = useState(currentFilters?.gradeId || '')
  const [selectedClass, setSelectedClass] = useState(currentFilters?.classId || '')
  const [selectedSubject, setSelectedSubject] = useState(currentFilters?.subjectId || '')
  const [selectedGroupBy, setSelectedGroupBy] = useState(currentFilters?.groupBy || 'Student')
  const [startDate, setStartDate] = useState(currentFilters?.startDate || '')
  const [endDate, setEndDate] = useState(currentFilters?.endDate || '')
  const [activeFilters, setActiveFilters] = useState([])

  // Update local state if currentFilters changes (e.g. from parent)
  useEffect(() => {
    if (currentFilters) {
      if (currentFilters.gradeId !== undefined) setSelectedGrade(currentFilters.gradeId || '')
      if (currentFilters.classId !== undefined) setSelectedClass(currentFilters.classId || '')
      if (currentFilters.subjectId !== undefined) setSelectedSubject(currentFilters.subjectId || '')
      if (currentFilters.groupBy !== undefined) setSelectedGroupBy(currentFilters.groupBy || 'Student')
      if (currentFilters.startDate !== undefined) setStartDate(currentFilters.startDate || '')
      if (currentFilters.endDate !== undefined) setEndDate(currentFilters.endDate || '')
    }
  }, [currentFilters])

  // Debounced Filter Application
  useEffect(() => {
    const handler = setTimeout(() => {
      const filters = {
        gradeId: selectedGrade ? parseInt(selectedGrade) : null,
        classId: selectedClass ? parseInt(selectedClass) : null,
        subjectId: selectedSubject ? parseInt(selectedSubject) : null,
        startDate: startDate || null,
        endDate: endDate || null,
        groupBy: selectedGroupBy
      }

      // Build active filters summary
      const active = []
      if (selectedGrade) {
        const grade = grades.find(g => g.id === parseInt(selectedGrade))
        if (grade) active.push(grade.gradeName || grade.name)
      }
      if (selectedSubject) {
        const subject = subjects.find(s => (s.id || s.Id) === parseInt(selectedSubject))
        if (subject) active.push(subject.statusName || subject.subjectName)
      }
      if (selectedGroupBy === 'Class') {
        active.push('Group by Class')
      }
      if (selectedClass) {
        const classItem = classes.find(c => c.id === parseInt(selectedClass))
        if (classItem) active.push(classItem.className || classItem.name)
      }
      if (startDate && endDate) {
        active.push(`${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`)
      } else if (startDate) {
        active.push(`From ${new Date(startDate).toLocaleDateString()}`)
      } else if (endDate) {
        active.push(`Until ${new Date(endDate).toLocaleDateString()}`)
      }

      setActiveFilters(active)
      onFilterChange(filters)
    }, 400) // 400ms debounce

    return () => clearTimeout(handler)
  }, [selectedGrade, selectedClass, selectedSubject, startDate, endDate, selectedGroupBy, grades, classes, subjects])

  const hasExamFilter = ((allExams && allExams.length > 0) || recentExams.length > 0)

  // Classes are filtered based on selected grade
  const filteredClasses = selectedGrade
    ? classes.filter(c => !c.gradeId || String(c.gradeId) === String(selectedGrade))
    : classes



  // Filter exams based on grade and class
  const filteredExams = (allExams && allExams.length > 0 ? allExams : recentExams)
    .filter(exam => {
      const examGradeId = exam.gradeId || exam.GradeId
      if (selectedGrade && String(examGradeId) !== String(selectedGrade)) return false
      
      if (selectedClass) {
        const examClassId = exam.classId || exam.ClassId
        const matchLegacy = String(examClassId) === String(selectedClass)
        
        const classIds = exam.classes || exam.Classes || exam.classIds || exam.ClassIds || []
        const matchArray = Array.isArray(classIds) && classIds.some(id => String(id) === String(selectedClass))
        
        if (!matchLegacy && !matchArray) return false
      }
      return true
    })

  const handleClearFilters = () => {
    setSelectedGrade('')
    setSelectedClass('')
    setSelectedSubject('')
    setSelectedGroupBy('Student')
    setStartDate('')
    setEndDate('')
    // useEffect will handle the rest
  }

  return (
    <div style={{
      background: 'var(--bg-main)',
      borderRadius: '16px',
      padding: '1.5rem',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
      marginBottom: '1.5rem',
      border: '1px solid #f1f3f5'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        marginBottom: '1.5rem'
      }}>
        <svg style={{ width: '24px', height: '24px', fill: 'var(--primary)' }} viewBox="0 0 24 24">
          <path d="M3 17v2h6v-2H3zM3 5v2h10V5H3zm10 16v-2h8v-2h-8v-2h-2v6h2zM7 9v2H3v2h4v2h2V9H7zm14 4v-2H11v2h10zm-6-4h2V7h4V5h-4V3h-2v6z" />
        </svg>
        <h3 style={{
          fontSize: '1.25rem',
          fontWeight: '600',
          color: 'var(--text-primary)',
          margin: 0
        }}>
          Filters
        </h3>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)', // Enforce a 3-column layout
        gap: '1rem',
        marginBottom: '1rem',
        alignItems: 'center' // Align items to the center of their grid area
      }}>
        {/* Grade Filter */}
        <div>
          <ModernSelect
            label="Grade"
            value={selectedGrade}
            placeholder="All Grades"
            searchable={true}
            required={false}
            options={[
              { value: '', label: 'All Grades' },
              ...grades.map(grade => ({ value: grade.id, label: grade.gradeName || grade.name }))
            ]}
            onChange={(e) => {
              setSelectedGrade(e.target.value)
              setSelectedClass('') // Reset class when grade changes
            }}
          />
        </div>

        {/* Class Filter */}
        <div>
          <ModernSelect
            label="Class"
            value={selectedClass}
            placeholder="All Classes"
            searchable={true}
            required={false}
            disabled={!selectedGrade && filteredClasses.length === 0}
            options={[
              { value: '', label: 'All Classes' },
              ...filteredClasses.map(classItem => ({ value: classItem.id, label: classItem.className || classItem.name }))
            ]}
            onChange={(e) => setSelectedClass(e.target.value)}
          />
        </div>

        {/* Subject Filter */}
        <div>
          <ModernSelect
            label="Subject"
            value={selectedSubject}
            placeholder="All Subjects"
            searchable={true}
            required={false}
            options={[
              { value: '', label: 'All Subjects' },
              ...subjects.map(s => ({ value: s.id || s.Id, label: s.statusName || s.subjectName }))
            ]}
            onChange={(e) => setSelectedSubject(e.target.value)}
          />
        </div>

        {/* Group By Filter */}
        <div>
          <ModernSelect
            label="Group By"
            value={selectedGroupBy}
            required={false}
            options={[
              { value: 'Student', label: 'Students' },
              { value: 'Class', label: 'Class' }
            ]}
            onChange={(e) => setSelectedGroupBy(e.target.value)}
          />
        </div>

        {/* Start Date Filter */}
        <div>
          <ModernDatePicker
            label="Start Date"
            value={startDate}
            onChange={(isoString) => setStartDate(isoString)}
            placeholder="Select Start Date"
            required={false}
          />
        </div>

        {/* End Date Filter */}
        <div>
          <ModernDatePicker
            label="End Date"
            value={endDate}
            onChange={(isoString) => setEndDate(isoString)}
            placeholder="Select End Date"
            required={false}
          />
        </div>

        {/* Exam Filter */}
        {hasExamFilter && (
          <div style={{ gridColumn: 'span 2' }}> {/* Make it span two columns */}
            <ModernSelect
              label="Selected Exam"
              value={selectedExamId || ''}
              placeholder="All Exams"
              searchable={true}
              required={false}
              options={[
                { value: '', label: 'All Exams' },
                ...filteredExams.map(exam => ({ value: exam.examId || exam.id, label: exam.title }))
              ]}
              onChange={(e) => {
                if (onExamChange) {
                  onExamChange(e)
                }
              }}
            />
          </div>
        )}

        {/* Clear Filters Button */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gridColumn: hasExamFilter ? 'span 1' : '1 / -1'
          }}
        >
          <button
            onClick={handleClearFilters}
            style={{
              padding: '0.625rem 1.5rem',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              background: 'transparent',
              color: 'var(--text-secondary)',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s',
              height: '48px' // Fixed height
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'var(--bg-surface-hover)'
              e.target.style.borderColor = 'var(--text-secondary)'
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'transparent'
              e.target.style.borderColor = 'var(--border-color)'
            }}
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Active Filters Summary */}
      {activeFilters.length > 0 && (
        <div style={{
          marginTop: '1rem',
          padding: '0.75rem 1rem',
          borderRadius: '8px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{
            fontSize: '0.75rem',
            fontWeight: '500',
            color: 'var(--text-secondary)',
            marginBottom: '0.25rem',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            Active Filters
          </div>
          <div style={{
            fontSize: '0.875rem',
            color: 'var(--text-primary)',
            fontWeight: '500'
          }}>
            {activeFilters.join(' • ')}
          </div>
        </div>
      )}
    </div>
  )
}
