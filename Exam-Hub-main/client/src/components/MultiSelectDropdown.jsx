import { useState, useEffect, useRef } from 'react'
import { ChevronDown, Check, X, Layers } from 'lucide-react'

export default function MultiSelectDropdown({
  options = [],
  selectedIds = [],
  onChange,
  label = 'Select Options',
  placeholder = 'Select options',
  disabled = false,
  id
}) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  // App Theme Colors (Red)
  const colors = {
    primary: '#dc2626', // Red-600
    primaryLight: 'rgba(220, 38, 38, 0.1)',
    primaryHover: '#b91c1c', // Red-700
    accent: '#ef4444', // Red-500
    text: '#1f2937',
    textMuted: '#6b7280',
    border: '#d1d5db',
    bg: '#ffffff'
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleToggle = (e) => {
    if (disabled) return
    e.preventDefault()
    setIsOpen(!isOpen)
  }

  const handleSelectAll = (checked) => {
    if (checked) {
      const allIds = options.map(opt => opt.value || opt.id)
      onChange(allIds)
    } else {
      onChange([])
    }
  }

  const handleSelectOne = (optionId, checked) => {
    let newSelected = [...selectedIds]
    if (checked) {
      if (!newSelected.includes(optionId)) {
        newSelected.push(optionId)
      }
    } else {
      newSelected = newSelected.filter(id => id !== optionId)
    }
    onChange(newSelected)
  }

  // Derived state
  const isAllSelected = options.length > 0 && selectedIds.length === options.length

  // Format display text
  const getDisplayText = () => {
    if (disabled) return 'Disabled'
    if (selectedIds.length === 0) return placeholder

    const selectedOptions = options.filter(opt => selectedIds.includes(opt.value || opt.id))

    if (selectedOptions.length === 0) return placeholder
    if (selectedOptions.length <= 2) {
      return selectedOptions.map(o => o.label || o.name).join(', ')
    }
    return `${selectedOptions.length} labels selected`
  }

  return (
    <div className="multi-select-dropdown" ref={dropdownRef} style={{ position: 'relative', width: '100%' }}>
      {label && (
        <label
          className="form-label"
          htmlFor={id}
          style={{ display: 'block', fontSize: '.875rem', fontWeight: 600, color: colors.text, marginBottom: '.5rem' }}
        >
          {label} {disabled ? '' : <span className="required" style={{ color: colors.primary }}>*</span>}
        </label>
      )}

      <button
        type="button"
        id={id}
        onClick={handleToggle}
        disabled={disabled}
        style={{
          width: '100%',
          padding: '.75rem 1rem',
          border: `2px solid ${isOpen ? colors.primary : colors.border}`,
          borderRadius: '12px',
          fontSize: '1rem',
          background: disabled ? '#f3f4f6' : 'white',
          outline: 'none',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1,
          color: disabled ? colors.textMuted : colors.text,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '.75rem',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: isOpen ? `0 0 0 4px ${colors.primaryLight}` : 'none',
          textAlign: 'left',
          fontWeight: 500
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, overflow: 'hidden' }}>
          <div style={{ padding: '4px', background: colors.primaryLight, borderRadius: '6px', color: colors.primary, display: 'flex' }}>
            <Layers size={16} />
          </div>
          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {getDisplayText()}
          </span>
        </div>
        <ChevronDown
          size={18}
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.3s ease',
            color: isOpen ? colors.primary : colors.textMuted,
            opacity: 0.7
          }}
        />
      </button>

      {isOpen && !disabled && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0,
            right: 0,
            padding: '.5rem',
            border: '1px solid #f3f4f6',
            borderRadius: '16px',
            background: 'white',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04), 0 0 0 1px rgba(0, 0, 0, 0.05)',
            zIndex: 100000,
            maxHeight: '350px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
            animation: 'dropdownFade 0.2s ease-out'
          }}
        >
          <style>{`
            @keyframes dropdownFade {
              from { opacity: 0; transform: translateY(-10px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `}</style>
          {options.length === 0 ? (
            <div style={{ padding: '1.5rem', textAlign: 'center', color: colors.textMuted }}>
              <p style={{ margin: 0, fontSize: '0.875rem' }}>No options found</p>
            </div>
          ) : (
            <>
              <div
                onClick={() => handleSelectAll(!isAllSelected)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '.75rem',
                  padding: '0.75rem 1rem',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  userSelect: 'none',
                  transition: 'background 0.15s',
                  background: isAllSelected ? colors.primaryLight : 'transparent',
                }}
                onMouseEnter={(e) => { if (!isAllSelected) e.currentTarget.style.background = '#f9fafb' }}
                onMouseLeave={(e) => { if (!isAllSelected) e.currentTarget.style.background = 'transparent' }}
              >
                <div style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '4px',
                  border: `2px solid ${isAllSelected ? colors.primary : colors.border}`,
                  background: isAllSelected ? colors.primary : 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s'
                }}>
                  {isAllSelected && <Check size={12} color="white" strokeWidth={4} />}
                </div>
                <span style={{ fontSize: '.9375rem', fontWeight: 600, color: isAllSelected ? colors.primary : colors.text }}>Select All</span>
              </div>

              <div style={{ height: '1px', background: '#f3f4f6', margin: '.25rem 0.5rem' }} />

              {options.map((option) => {
                const optId = option.value || option.id
                const isSelected = selectedIds.includes(optId)
                return (
                  <div
                    key={optId}
                    onClick={() => handleSelectOne(optId, !isSelected)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '.75rem',
                      padding: '0.75rem 1rem',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      userSelect: 'none',
                      transition: 'all 0.2s',
                      background: isSelected ? colors.primaryLight : 'transparent',
                    }}
                    onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = '#f9fafb' }}
                    onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}
                  >
                    <div style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '4px',
                      border: `2px solid ${isSelected ? colors.primary : colors.border}`,
                      background: isSelected ? colors.primary : 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s'
                    }}>
                      {isSelected && <Check size={12} color="white" strokeWidth={4} />}
                    </div>
                    <span style={{
                      fontSize: '.9375rem',
                      color: isSelected ? colors.primary : colors.text,
                      fontWeight: isSelected ? 500 : 400
                    }}>
                      {option.label || option.name}
                    </span>
                  </div>
                )
              })}
            </>
          )}
        </div>
      )}
    </div>
  )
}
