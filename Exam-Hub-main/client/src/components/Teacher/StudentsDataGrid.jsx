import { useState, useMemo, useEffect, memo, useRef, useCallback } from 'react'
import MultiSelectDropdown from '../MultiSelectDropdown'
import ModernSelect from '../ModernSelect'
import * as XLSX from 'xlsx'

const StudentRow = memo(({ student, selectedExamIds, allExams, onStudentClick }) => {
    const getExamScore = (s, eId) => {
        if (!s.quizScores || !eId) return null
        const score = s.quizScores[String(eId)]
        return score !== undefined ? score : null
    }

    const getAverageScore = (s, selectedIds) => {
        let scores;
        if (selectedIds && selectedIds.length > 0) {
            // Only average scores for the selected exams
            scores = selectedIds
                .map(id => s.quizScores ? s.quizScores[String(id)] : null)
                .filter(score => score !== null && score !== undefined);
        } else {
            // Average all scores if no filter is applied
            scores = Object.values(s.quizScores || {});
        }
        
        if (scores.length === 0) return 0;
        return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    }

    const avgScore = getAverageScore(student, selectedExamIds)

    const examsTakenCount = useMemo(() => {
        if (selectedExamIds && selectedExamIds.length > 0) {
            // Count how many of the selected exams the student actually took
            return selectedExamIds.filter(id => student.quizScores && student.quizScores[String(id)] !== undefined).length;
        }
        // Total exams taken if no filter
        return Object.keys(student.quizScores || {}).length;
    }, [student.quizScores, selectedExamIds]);

    // Performance status colors
    const getStatusColor = (score) => {
        if (score >= 80) return '#10b981' // Green
        if (score >= 50) return '#f59e0b' // Yellow
        return '#ef4444' // Red
    }

    const statusColor = getStatusColor(avgScore)

    return (
        <tr
            style={{ borderBottom: '1px solid #f3f4f6', transition: 'background 0.1s', background: 'white' }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
        >
            <td style={{
                padding: '1rem 1.5rem',
                position: 'sticky',
                left: 0,
                background: 'white',
                zIndex: 40,
                borderRight: '2px solid #f3f4f6',
                minWidth: '250px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ position: 'relative' }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: 700,
                            fontSize: '0.9rem',
                            flexShrink: 0
                        }}>
                            {student.initials}
                        </div>
                        {/* Status Marker */}
                        <div style={{
                            position: 'absolute',
                            bottom: '-2px',
                            right: '-2px',
                            width: '14px',
                            height: '14px',
                            borderRadius: '50%',
                            background: statusColor,
                            border: '2px solid white',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }} title={`Performance: ${avgScore}%`} />
                    </div>
                    <div>
                        <div style={{ fontWeight: 600, color: '#111827', whiteSpace: 'nowrap' }}>{student.name}</div>
                        <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>ID: {student.id}</div>
                    </div>
                </div>
            </td>
            <td style={{ padding: '1rem 1.5rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column', alignItems: 'flex-start' }}>
                    <span style={{
                        padding: '0.2rem 0.6rem',
                        borderRadius: '99px',
                        background: '#eff6ff',
                        color: '#1d4ed8',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        border: '1px solid #dbeafe'
                    }}>
                        {student.grade}
                    </span>
                    <span style={{
                        padding: '0.2rem 0.6rem',
                        borderRadius: '99px',
                        background: '#f3f4f6',
                        color: '#374151',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        border: '1px solid #e5e7eb'
                    }}>
                        Class {student.class}
                    </span>
                </div>
            </td>
            <td style={{ padding: '1rem 1.5rem' }}>
                <div style={{ display: 'flex', gap: '1.5rem' }}>
                    <div>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', fontWeight: 600 }}>Avg Score</div>
                        <div style={{ 
                             fontSize: '1.1rem', 
                             fontWeight: 700, 
                             color: statusColor,
                             display: 'flex',
                             alignItems: 'center',
                             gap: '0.4rem'
                         }}>
                             {avgScore}%
                         </div>
                    </div>
                    <div>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', fontWeight: 600 }}>Exams</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#374151' }}>{examsTakenCount}</div>
                    </div>
                </div>
            </td>
            {selectedExamIds.map(examId => {
                const score = getExamScore(student, examId)
                return (
                    <td key={examId} style={{ padding: '1rem 1.5rem', textAlign: 'center', background: '#fffafa', borderLeft: '1px solid #f3f4f6' }}>
                        {score !== null ? (
                            <div style={{
                                display: 'inline-block',
                                padding: '0.4rem 1rem',
                                borderRadius: '8px',
                                background: score >= 50 ? '#dcfce7' : '#fee2e2',
                                color: score >= 50 ? '#16a34a' : '#991b1b',
                                fontWeight: 700,
                                fontSize: '1rem',
                                border: `1px solid ${score >= 50 ? '#86efac' : '#fecaca'}`
                            }}>
                                {score}%
                            </div>
                        ) : (
                            <span style={{ fontSize: '0.9rem', color: '#9ca3af', fontStyle: 'italic' }}>N/A</span>
                        )}
                    </td>
                )
            })}
            <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                <button
                    onClick={() => onStudentClick(student.id)}
                    style={{
                        padding: '0.5rem 1rem',
                        background: 'white',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        color: '#374151',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.borderColor = '#9ca3af'; e.currentTarget.style.background = '#f9fafb' }}
                    onMouseOut={(e) => { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.background = 'white' }}
                >
                    View Profile
                </button>
            </td>
        </tr>
    )
})

export default function StudentsDataGrid({ students, allExams, initialExamId, initialGrade, onStudentClick }) {
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedGrade, setSelectedGrade] = useState(initialGrade || '')
    const [selectedClass, setSelectedClass] = useState('')
    const [selectedExamIds, setSelectedExamIds] = useState(initialExamId ? [String(initialExamId)] : [])
    const [minScore, setMinScore] = useState(0)
    const [maxScore, setMaxScore] = useState(100)
    // Scroll to Top State
    const [showScrollTop, setShowScrollTop] = useState(false)

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 300) {
                setShowScrollTop(true)
            } else {
                setShowScrollTop(false)
            }
        }

        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        })
    }

    // Helper to get score
    const getExamScore = (student, examId) => {
        if (!student.quizScores || !examId) return null;
        // quizScores is keyed by string examId
        const score = student.quizScores[String(examId)];
        return score !== undefined ? score : null;
    }

    // Helper to get average
    const getAverageScore = useCallback((student, selectedIds) => {
        let scores;
        if (selectedIds && selectedIds.length > 0) {
            scores = selectedIds
                .map(id => student.quizScores ? student.quizScores[String(id)] : null)
                .filter(score => score !== null && score !== undefined);
        } else {
            scores = Object.values(student.quizScores || {});
        }
        
        if (scores.length === 0) return 0;
        return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    }, []);

    const [sortConfig, setSortConfig] = useState({ key: 'performance', direction: 'desc' })

    // Draggable Scroll State
    const scrollContainerRef = useRef(null)
    const [isDragging, setIsDragging] = useState(false)
    const [startX, setStartX] = useState(0)
    const [scrollLeft, setScrollLeft] = useState(0)
    const [showLeftArrow, setShowLeftArrow] = useState(false)
    const [showRightArrow, setShowRightArrow] = useState(false)

    // Check for overflow to show arrows
    const checkOverflow = useCallback(() => {
        const el = scrollContainerRef.current
        if (el) {
            setShowLeftArrow(el.scrollLeft > 0)
            setShowRightArrow(el.scrollLeft < el.scrollWidth - el.clientWidth - 1)
        }
    }, [])

    const handleMouseDown = (e) => {
        if (e.target.tagName === 'BUTTON' || e.target.tagName === 'A' || e.target.closest('button')) return
        setIsDragging(true)
        setStartX(e.pageX - scrollContainerRef.current.offsetLeft)
        setScrollLeft(scrollContainerRef.current.scrollLeft)
    }

    const handleMouseLeave = () => setIsDragging(false)
    const handleMouseUp = () => setIsDragging(false)

    const handleMouseMove = (e) => {
        if (!isDragging) return
        e.preventDefault()
        const x = e.pageX - scrollContainerRef.current.offsetLeft
        const walk = (x - startX) * 2
        scrollContainerRef.current.scrollLeft = scrollLeft - walk
        checkOverflow()
    }

    const scrollBy = (amount) => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollBy({ left: amount, behavior: 'smooth' })
            setTimeout(checkOverflow, 500)
        }
    }

    // Sync state with prop if it changes
    useEffect(() => {
        if (initialExamId !== undefined) {
            setSelectedExamIds(initialExamId ? [String(initialExamId)] : [])
        }
        if (initialGrade !== undefined) {
            setSelectedGrade(initialGrade)
        }
    }, [initialExamId, initialGrade])

    // Get unique Grades and Classes for filters
    const grades = useMemo(() => {
        const uniqueGrades = [...new Set(students.map(s => s.grade).filter(g => g && g !== 'N/A'))];
        const order = ['Junior', 'wheeler', 'Senior'];
        
        return uniqueGrades.sort((a, b) => {
            const indexA = order.indexOf(a);
            const indexB = order.indexOf(b);
            
            // If both are in the predefined order, sort by order
            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
            // If only A is in order, it comes first
            if (indexA !== -1) return -1;
            // If only B is in order, it comes first
            if (indexB !== -1) return 1;
            // Otherwise alphabetical
            return a.localeCompare(b);
        });
    }, [students]);

    const classes = useMemo(() => {
        let filtered = students
        if (selectedGrade) {
            filtered = filtered.filter(s => s.grade === selectedGrade)
        }
        return [...new Set(filtered.map(s => s.class).filter(c => c && c !== 'N/A'))].sort()
    }, [students, selectedGrade])

    // Filter Logic
    const filteredStudents = useMemo(() => {
        let result = students.filter(student => {
            const searchLower = searchQuery.toLowerCase()
            const matchSearch = student.name.toLowerCase().includes(searchLower) || (student.email && student.email.toLowerCase().includes(searchLower))
            if (!matchSearch) return false
            if (selectedGrade && student.grade !== selectedGrade) return false
            if (selectedClass && student.class !== selectedClass) return false

            const avg = getAverageScore(student, selectedExamIds)
            if (avg < minScore || avg > maxScore) return false

            return true
        })

        if (sortConfig.key) {
            result.sort((a, b) => {
                let aValue, bValue
                if (sortConfig.key === 'performance') {
                    const getAvg = (s) => getAverageScore(s, selectedExamIds)
                    aValue = getAvg(a); bValue = getAvg(b)
                } else {
                    aValue = a[sortConfig.key] || ''; bValue = b[sortConfig.key] || ''
                }
                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
                return 0
            })
        }
        return result
    }, [students, searchQuery, selectedGrade, selectedClass, sortConfig, getAverageScore, getExamScore, minScore, maxScore, selectedExamIds])

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1)
    }, [searchQuery, selectedGrade, selectedClass, minScore, maxScore, selectedExamIds])

    // Pagination Logic
    const paginatedStudents = useMemo(() => {
        const startIndex = (currentPage - 1) * pageSize
        return filteredStudents.slice(startIndex, startIndex + pageSize)
    }, [filteredStudents, currentPage, pageSize])

    const totalPages = Math.ceil(filteredStudents.length / pageSize)

    useEffect(() => {
        checkOverflow()
        window.addEventListener('resize', checkOverflow)
        return () => window.removeEventListener('resize', checkOverflow)
    }, [checkOverflow, paginatedStudents, selectedExamIds])

    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }))
    }

    const selectedExams = useMemo(() => {
        return allExams.filter(e => selectedExamIds.includes(String(e.id || e.examId)))
    }, [selectedExamIds, allExams])

    const dropDownOptions = useMemo(() => {
        return allExams.map(e => ({
            id: String(e.id || e.examId),
            label: e.title
        }))
    }, [allExams])

    const handleExport = () => {
        if (!filteredStudents || filteredStudents.length === 0) {
            alert("No students to export based on current filters.");
            return;
        }

        const exportData = filteredStudents.map(student => {
            const row = {
                "Student Name": student.name,
                "ID": student.id,
                "Grade": student.grade,
                "Class": student.class,
                "Average Score": getAverageScore(student, selectedExamIds) + '%',
                "Exams Taken": (selectedExamIds && selectedExamIds.length > 0) 
                    ? selectedExamIds.filter(id => student.quizScores && student.quizScores[String(id)] !== undefined).length
                    : Object.keys(student.quizScores || {}).length
            };

            // Add columns for selected exams if any, otherwise all exams or just basics?
            // Requirement: "Column order and names must match the DataGrid columns."
            // The DataGrid shows selected exams.

            selectedExams.forEach(exam => {
                const score = getExamScore(student, exam.id || exam.examId);
                row[exam.title] = score !== null ? score + '%' : 'N/A';
            });

            return row;
        });

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Students");

        // Generate filename
        let filename = "students_export";
        if (selectedClass) {
            filename += `_class-${selectedClass}`;
        }
        if (selectedExams.length === 1) {
            filename += `_exam-${selectedExams[0].title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}`;
        }

        const date = new Date().toISOString().split('T')[0];
        filename += `_${date}.xlsx`;

        XLSX.writeFile(workbook, filename);
    };

    return (
        <div style={{
            padding: '2rem',
            background: '#f9fafb',
            minHeight: '100vh',
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
            <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h1 style={{ fontSize: '2rem', fontWeight: '700', color: '#1f2937', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <svg style={{ width: '32px', height: '32px', fill: '#dc2626' }} viewBox="0 0 24 24">
                                <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
                            </svg>
                            Students Directory
                        </h1>
                        <p style={{ fontSize: '1rem', color: '#6b7280', margin: 0 }}>Manage and view student performance across all exams</p>
                    </div>

                    <button
                        onClick={handleExport}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.75rem 1.25rem',
                            background: '#10b981', // Emerald 500
                            color: 'white',
                            border: 'none',
                            borderRadius: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)',
                            transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
                        onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                        <svg style={{ width: '20px', height: '20px', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }} viewBox="0 0 24 24">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        Export to Excel
                    </button>
                </div>

                {/* Filters Bar */}
                <div style={{
                    background: '#ffffff', // Use solid white to avoid backdrop-filter issues
                    borderRadius: '20px',
                    padding: '1.5rem',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
                    marginBottom: '2rem',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '1.25rem',
                    alignItems: 'flex-end',
                    border: '1px solid #e5e7eb',
                    position: 'relative',
                    zIndex: 9000 // Very high to beat table
                }}>
                    {/* Search */}
                    <div style={{ flex: '1 1 300px', position: 'relative' }}>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#4b5563', marginBottom: '0.5rem' }}>Search Students</label>
                        <div style={{ position: 'relative' }}>
                            <svg style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '20px', height: '20px', fill: '#9ca3af' }} viewBox="0 0 24 24">
                                <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Search by name or email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '12px',
                                    fontSize: '0.95rem',
                                    background: 'white',
                                    transition: 'all 0.2s',
                                }}
                            />
                        </div>
                    </div>

                    {/* Grade Filter */}
                    <div style={{ width: '200px' }}>
                        <ModernSelect
                            label="Grade"
                            value={selectedGrade}
                            placeholder="All Grades"
                            options={[
                                { value: '', label: 'All Grades' },
                                ...grades.map(g => ({ value: g, label: g }))
                            ]}
                            onChange={(e) => { setSelectedGrade(e.target.value); setSelectedClass(''); }}
                        />
                    </div>

                    {/* Class Filter */}
                    <div style={{ width: '200px' }}>
                        <ModernSelect
                            label="Class"
                            value={selectedClass}
                            placeholder="All Classes"
                            disabled={!selectedGrade && classes.length === 0}
                            options={[
                                { value: '', label: 'All Classes' },
                                ...classes.map(c => ({ value: c, label: c }))
                            ]}
                            onChange={(e) => setSelectedClass(e.target.value)}
                        />
                    </div>

                    {/* Multi Exam Filter */}
                    <div style={{ flex: '1 1 300px' }}>
                        <MultiSelectDropdown
                            options={dropDownOptions}
                            selectedIds={selectedExamIds}
                            onChange={setSelectedExamIds}
                            label="Filter by Exams"
                            placeholder="Select exams..."
                        />
                    </div>

                    {/* Score Range */}
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
                        <div style={{ width: '90px' }}>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#4b5563', marginBottom: '0.5rem' }}>Min %</label>
                            <input
                                type="number"
                                min="0"
                                max="100"
                                value={minScore}
                                onChange={(e) => setMinScore(Number(e.target.value))}
                                style={{ width: '100%', padding: '0.75rem', border: '1px solid #e5e7eb', borderRadius: '12px', fontSize: '0.95rem' }}
                            />
                        </div>
                        <div style={{ width: '90px' }}>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#4b5563', marginBottom: '0.5rem' }}>Max %</label>
                            <input
                                type="number"
                                min="0"
                                max="100"
                                value={maxScore}
                                onChange={(e) => setMaxScore(Number(e.target.value))}
                                style={{ width: '100%', padding: '0.75rem', border: '1px solid #e5e7eb', borderRadius: '12px', fontSize: '0.95rem' }}
                            />
                        </div>
                    </div>
                </div>

                {/* Content Area with Draggable Table */}
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <style>
                        {`
                            .table-container::-webkit-scrollbar {
                                height: 8px;
                            }
                            .table-container::-webkit-scrollbar-track {
                                background: #f1f1f1;
                                border-radius: 10px;
                            }
                            .table-container::-webkit-scrollbar-thumb {
                                background: #d1d5db;
                                border-radius: 10px;
                            }
                            .table-container::-webkit-scrollbar-thumb:hover {
                                background: #9ca3af;
                            }
                            .scroll-arrow {
                                position: absolute;
                                top: 50%;
                                transform: translateY(-50%);
                                width: 50px;
                                height: 50px;
                                border-radius: 50%;
                                background: white;
                                border: none;
                                display: flex;
                                alignItems: center;
                                justifyContent: center;
                                cursor: pointer;
                                box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                                z-index: 100;
                                color: #dc2626;
                                transition: all 0.3s ease;
                                opacity: 0;
                                visibility: hidden;
                            }
                            .scroll-arrow.visible {
                                opacity: 1;
                                visibility: visible;
                            }
                            .scroll-arrow:hover {
                                transform: translateY(-50%) scale(1.1);
                                background: #dc2626;
                                color: white;
                            }
                            .scroll-left { left: 10px; }
                            .scroll-right { right: 10px; }
                        `}
                    </style>

                    {/* Floating Navigation Arrows */}
                    <button
                        className={`scroll-arrow scroll-left ${showLeftArrow ? 'visible' : ''}`}
                        onClick={() => scrollBy(-300)}
                        title="Scroll Left"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
                    </button>
                    <button
                        className={`scroll-arrow scroll-right ${showRightArrow ? 'visible' : ''}`}
                        onClick={() => scrollBy(300)}
                        title="Scroll Right"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
                    </button>

                    <div
                        className="table-container"
                        ref={scrollContainerRef}
                        onMouseDown={handleMouseDown}
                        onMouseLeave={handleMouseLeave}
                        onMouseUp={handleMouseUp}
                        onMouseMove={handleMouseMove}
                        onScroll={checkOverflow}
                        style={{
                            background: 'white',
                            borderRadius: '20px 20px 0 0',
                            boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
                            overflowX: 'auto',
                            overflowY: 'auto',
                            maxHeight: 'calc(100vh - 320px)',
                            minHeight: '650px',
                            border: '1px solid #e5e7eb',
                            borderBottom: 'none',
                            cursor: isDragging ? 'grabbing' : 'grab',
                            userSelect: isDragging ? 'none' : 'auto',
                            position: 'relative'
                        }}
                    >
                        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, minWidth: '900px' }}>
                            <thead>
                                <tr style={{ background: '#f9fafb', position: 'sticky', top: 0, zIndex: 100 }}>
                                    <th style={{
                                        textAlign: 'left',
                                        padding: '1rem 1.5rem',
                                        fontSize: '0.85rem',
                                        color: '#6b7280',
                                        fontWeight: '700',
                                        textTransform: 'uppercase',
                                        position: 'sticky',
                                        left: 0,
                                        top: 0,
                                        background: '#f9fafb',
                                        zIndex: 110,
                                        borderRight: '2px solid #e5e7eb',
                                        borderBottom: '2px solid #e5e7eb',
                                        minWidth: '250px'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }} onClick={() => handleSort('name')}>
                                            Student
                                            {sortConfig.key === 'name' && (
                                                <span style={{ fontSize: '0.8rem' }}>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                                            )}
                                        </div>
                                    </th>
                                    <th style={{ textAlign: 'left', padding: '1rem 1.5rem', fontSize: '0.85rem', color: '#6b7280', fontWeight: '700', textTransform: 'uppercase', minWidth: '150px', borderBottom: '2px solid #e5e7eb', background: '#f9fafb' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }} onClick={() => handleSort('grade')}>
                                            Grade & Class
                                            {sortConfig.key === 'grade' && (
                                                <span style={{ fontSize: '0.8rem' }}>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                                            )}
                                        </div>
                                    </th>
                                    <th style={{ textAlign: 'left', padding: '1rem 1.5rem', fontSize: '0.85rem', color: '#6b7280', fontWeight: '700', textTransform: 'uppercase', minWidth: '160px', borderBottom: '2px solid #e5e7eb', background: '#f9fafb' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }} onClick={() => handleSort('performance')}>
                                            Performance
                                            {sortConfig.key === 'performance' && (
                                                <span style={{ fontSize: '0.8rem' }}>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                                            )}
                                        </div>
                                    </th>
                                    {selectedExamIds.map(examId => {
                                        const exam = allExams.find(e => String(e.id || e.examId) === String(examId))
                                        return (
                                            <th key={examId} style={{ textAlign: 'center', padding: '1rem 1.5rem', fontSize: '0.85rem', color: '#dc2626', fontWeight: '700', textTransform: 'uppercase', background: '#fef2f2', minWidth: '150px', borderLeft: '1px solid #fecaca', borderBottom: '2px solid #e5e7eb' }}>
                                                {exam?.title || 'Exam'}
                                            </th>
                                        )
                                    })}
                                    <th style={{ textAlign: 'right', padding: '1rem 1.5rem', fontSize: '0.85rem', color: '#6b7280', fontWeight: '700', textTransform: 'uppercase', borderBottom: '2px solid #e5e7eb', background: '#f9fafb' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedStudents.length === 0 ? (
                                    <tr>
                                        <td colSpan={3 + selectedExamIds.length + 1} style={{ padding: '4rem', textAlign: 'center', color: '#6b7280' }}>
                                            <div style={{ marginBottom: '1rem' }}>
                                                <svg style={{ width: '48px', height: '48px', fill: '#d1d5db' }} viewBox="0 0 24 24">
                                                    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
                                                </svg>
                                            </div>
                                            <div style={{ fontSize: '1.1rem', fontWeight: 500, color: '#374151' }}>No students found</div>
                                            <p style={{ margin: 0 }}>Try adjusting your search or filters</p>
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedStudents.map(student => (
                                        <StudentRow
                                            key={student.id}
                                            student={student}
                                            selectedExamIds={selectedExamIds}
                                            allExams={allExams}
                                            onStudentClick={onStudentClick}
                                        />
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    {/* Footer / Pagination */}
                    <div style={{
                        padding: '1rem 1.5rem',
                        border: '1px solid #e5e7eb',
                        borderRadius: '0 0 20px 20px',
                        background: '#f9fafb',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '1rem',
                        position: 'sticky',
                        bottom: 0,
                        zIndex: 100
                    }}>
                        <div style={{ color: '#6b7280', fontSize: '0.9rem' }}>
                            Showing <span style={{ fontWeight: 600, color: '#374151' }}>{(currentPage - 1) * pageSize + 1}</span> to <span style={{ fontWeight: 600, color: '#374151' }}>{Math.min(currentPage * pageSize, filteredStudents.length)}</span> of <span style={{ fontWeight: 600, color: '#374151' }}>{filteredStudents.length}</span> students
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                            {/* Page Size Selector */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <span style={{ fontSize: '0.85rem', color: '#6b7280', fontWeight: 500 }}>Rows per page:</span>
                                <select
                                    value={pageSize}
                                    onChange={(e) => {
                                        setPageSize(Number(e.target.value))
                                        setCurrentPage(1)
                                    }}
                                    style={{
                                        padding: '0.4rem 0.6rem',
                                        borderRadius: '8px',
                                        border: '1px solid #d1d5db',
                                        background: 'white',
                                        fontSize: '0.85rem',
                                        color: '#374151',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        outline: 'none'
                                    }}
                                >
                                    {[10, 50, 70, 100].map(size => (
                                        <option key={size} value={size}>{size}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Pagination Buttons */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    style={{
                                        padding: '0.5rem',
                                        borderRadius: '8px',
                                        border: '1px solid #d1d5db',
                                        background: 'white',
                                        cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                                        opacity: currentPage === 1 ? 0.5 : 1,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                                </button>

                                <div style={{ display: 'flex', gap: '0.25rem' }}>
                                    {[...Array(totalPages)].map((_, i) => {
                                        const pageNum = i + 1
                                        // Show first, last, and pages around current
                                        if (
                                            pageNum === 1 ||
                                            pageNum === totalPages ||
                                            (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                                        ) {
                                            return (
                                                <button
                                                    key={pageNum}
                                                    onClick={() => setCurrentPage(pageNum)}
                                                    style={{
                                                        minWidth: '32px',
                                                        height: '32px',
                                                        borderRadius: '8px',
                                                        border: '1px solid',
                                                        borderColor: currentPage === pageNum ? '#dc2626' : '#d1d5db',
                                                        background: currentPage === pageNum ? '#dc2626' : 'white',
                                                        color: currentPage === pageNum ? 'white' : '#374151',
                                                        fontWeight: 700,
                                                        fontSize: '0.85rem',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s'
                                                    }}
                                                >
                                                    {pageNum}
                                                </button>
                                            )
                                        } else if (
                                            pageNum === currentPage - 2 ||
                                            pageNum === currentPage + 2
                                        ) {
                                            return <span key={pageNum} style={{ color: '#9ca3af', alignSelf: 'center' }}>...</span>
                                        }
                                        return null
                                    })}
                                </div>

                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    style={{
                                        padding: '0.5rem',
                                        borderRadius: '8px',
                                        border: '1px solid #d1d5db',
                                        background: 'white',
                                        cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                                        opacity: currentPage === totalPages ? 0.5 : 1,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Floating Scroll to Top Request */}
                <button
                    onClick={scrollToTop}
                    style={{
                        position: 'fixed',
                        bottom: '2rem',
                        right: '2rem',
                        width: '56px',
                        height: '56px',
                        borderRadius: '50%',
                        background: '#dc2626',
                        color: 'white',
                        border: 'none',
                        boxShadow: '0 8px 24px rgba(220, 38, 38, 0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        zIndex: 9999,
                        opacity: showScrollTop ? 1 : 0,
                        visibility: showScrollTop ? 'visible' : 'hidden',
                        transform: showScrollTop ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.8)',
                        transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                        pointerEvents: showScrollTop ? 'auto' : 'none'
                    }}
                    title="Scroll to Top"
                >
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 19V5M5 12l7-7 7 7" />
                    </svg>
                </button>
            </div>
        </div>
    )
}
