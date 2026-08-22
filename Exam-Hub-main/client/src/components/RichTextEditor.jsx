import React, { useState, useRef } from 'react'

const RichTextEditor = ({ value = '', onChange, placeholder = "Enter your question here...", autoFocus = false }) => {
  const [showMathSymbols, setShowMathSymbols] = useState(false)
  const [showFormatting, setShowFormatting] = useState(false)
  const fileInputRef = useRef(null)

  const mathSymbols = [
    { symbol: '±', name: 'Plus-minus' },
    { symbol: '×', name: 'Multiplication' },
    { symbol: '÷', name: 'Division' },
    { symbol: '√', name: 'Square root' },
    { symbol: '²', name: 'Squared' },
    { symbol: '³', name: 'Cubed' },
    { symbol: '∞', name: 'Infinity' },
    { symbol: '≤', name: 'Less than or equal' },
    { symbol: '≥', name: 'Greater than or equal' },
    { symbol: '≠', name: 'Not equal' },
    { symbol: '≈', name: 'Approximately' },
    { symbol: '∑', name: 'Summation' },
    { symbol: '∫', name: 'Integral' },
    { symbol: 'π', name: 'Pi' },
    { symbol: 'θ', name: 'Theta' },
    { symbol: 'α', name: 'Alpha' },
    { symbol: 'β', name: 'Beta' },
    { symbol: 'γ', name: 'Gamma' },
    { symbol: 'δ', name: 'Delta' },
    { symbol: 'ε', name: 'Epsilon' },
    { symbol: 'φ', name: 'Phi' },
    { symbol: 'λ', name: 'Lambda' },
    { symbol: 'μ', name: 'Mu' },
    { symbol: 'σ', name: 'Sigma' },
    { symbol: 'τ', name: 'Tau' },
    { symbol: 'ω', name: 'Omega' },
    { symbol: '→', name: 'Arrow right' },
    { symbol: '←', name: 'Arrow left' },
    { symbol: '↑', name: 'Arrow up' },
    { symbol: '↓', name: 'Arrow down' },
    { symbol: '↔', name: 'Arrow both ways' },
    { symbol: '∠', name: 'Angle' },
    { symbol: '⊥', name: 'Perpendicular' },
    { symbol: '∥', name: 'Parallel' },
    { symbol: '°', name: 'Degrees' },
    { symbol: '′', name: 'Prime' },
    { symbol: '″', name: 'Double prime' },
    { symbol: '‰', name: 'Per mille' },
    { symbol: '‱', name: 'Per ten thousand' },
    { symbol: '⅟', name: 'Fraction 1/n' },
    { symbol: '½', name: 'One half' },
    { symbol: '⅓', name: 'One third' },
    { symbol: '⅔', name: 'Two thirds' },
    { symbol: '¼', name: 'One quarter' },
    { symbol: '¾', name: 'Three quarters' },
    { symbol: '⅕', name: 'One fifth' },
    { symbol: '⅖', name: 'Two fifths' },
    { symbol: '⅗', name: 'Three fifths' },
    { symbol: '⅘', name: 'Four fifths' },
    { symbol: '⅙', name: 'One sixth' },
    { symbol: '⅚', name: 'Five sixths' },
    { symbol: '⅐', name: 'One seventh' },
    { symbol: '⅛', name: 'One eighth' },
    { symbol: '⅜', name: 'Three eighths' },
    { symbol: '⅝', name: 'Five eighths' },
    { symbol: '⅞', name: 'Seven eighths' },
    { symbol: '⅑', name: 'One ninth' },
    { symbol: '⅒', name: 'One tenth' }
  ]

  const insertMathSymbol = (symbol) => {
    const textarea = document.getElementById('rich-text-editor')
    if (textarea) {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const newValue = value.substring(0, start) + symbol + value.substring(end)
      if (onChange) onChange(newValue)

      // Set cursor position after the inserted symbol
      setTimeout(() => {
        textarea.focus()
        textarea.setSelectionRange(start + symbol.length, start + symbol.length)
      }, 0)
    }
  }

  const insertFormatting = (format) => {
    const textarea = document.getElementById('rich-text-editor')
    if (textarea) {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const selectedText = value.substring(start, end)

      let newValue
      switch (format) {
        case 'bold':
          newValue = value.substring(0, start) + `**${selectedText}**` + value.substring(end)
          break
        case 'italic':
          newValue = value.substring(0, start) + `*${selectedText}*` + value.substring(end)
          break
        case 'underline':
          newValue = value.substring(0, start) + `__${selectedText}__` + value.substring(end)
          break
        case 'superscript':
          newValue = value.substring(0, start) + `^${selectedText}^` + value.substring(end)
          break
        case 'subscript':
          newValue = value.substring(0, start) + `~${selectedText}~` + value.substring(end)
          break
        case 'fraction':
          newValue = value.substring(0, start) + `(${selectedText})` + value.substring(end)
          break
        default:
          return
      }

      onChange(newValue)

      // Set cursor position after the formatting
      setTimeout(() => {
        textarea.focus()
        if (format === 'fraction') {
          textarea.setSelectionRange(start + 1, start + 1)
        } else {
          textarea.setSelectionRange(start + 2, start + 2)
        }
      }, 0)
    }
  }

  const handleImageUpload = (event) => {
    const file = event.target.files[0]
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const imgTag = `![${file.name}](${e.target.result})`
        const textarea = document.getElementById('rich-text-editor')
        if (textarea) {
          const start = textarea.selectionStart
          const newValue = value.substring(0, start) + imgTag + value.substring(start)
          onChange(newValue)

          // Set cursor position after the image tag
          setTimeout(() => {
            textarea.focus()
            textarea.setSelectionRange(start + imgTag.length, start + imgTag.length)
          }, 0)
        }
      }
      reader.readAsDataURL(file)
    }

    // Reset file input
    event.target.value = ''
  }

  const renderPreview = () => {
    if (!value) return null

    let html = value

    // Convert markdown-like formatting to HTML
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>')
    html = html.replace(/__(.*?)__/g, '<u>$1</u>')
    html = html.replace(/\^(.*?)\^/g, '<sup>$1</sup>')
    html = html.replace(/~(.*?)~/g, '<sub>$1</sub>')
    html = html.replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" style="max-width: 100%; height: auto; margin: 10px 0; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" />')

    return (
      <div className="rich-text-preview">
        <h4>Preview:</h4>
        <div
          className="preview-content"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    )
  }

  return (
    <div className="rich-text-editor-container" style={{
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'stretch',
      background: '#ffffff',
      borderRadius: '16px',
      overflow: 'hidden',
      border: '2px solid #f1f5f9',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    }}>
      <div className="editor-toolbar" style={{
        display: 'flex',
        gap: '.5rem',
        padding: '1rem',
        background: '#f8fafc',
        borderBottom: '2px solid #f1f5f9',
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        <button
          type="button"
          onClick={() => setShowMathSymbols(!showMathSymbols)}
          title="Math Symbols"
          style={{
            padding: '.625rem 1rem',
            background: showMathSymbols ? '#dc2626' : 'white',
            color: showMathSymbols ? 'white' : '#475569',
            border: `1.5px solid ${showMathSymbols ? '#dc2626' : '#e2e8f0'}`,
            borderRadius: '10px',
            fontSize: '.85rem',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '.5rem',
            boxShadow: showMathSymbols ? '0 4px 12px rgba(220, 38, 38, 0.15)' : 'none'
          }}
        >
          <span style={{ fontSize: '1.1rem' }}>∑</span> Math
        </button>

        <button
          type="button"
          onClick={() => setShowFormatting(!showFormatting)}
          title="Text Formatting"
          style={{
            padding: '.625rem 1rem',
            background: showFormatting ? '#dc2626' : 'white',
            color: showFormatting ? 'white' : '#475569',
            border: `1.5px solid ${showFormatting ? '#dc2626' : '#e2e8f0'}`,
            borderRadius: '10px',
            fontSize: '.85rem',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '.5rem',
            boxShadow: showFormatting ? '0 4px 12px rgba(220, 38, 38, 0.15)' : 'none'
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" /></svg>
          Format
        </button>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          title="Insert Image"
          style={{
            padding: '.625rem 1rem',
            background: 'white',
            color: '#475569',
            border: '1.5px solid #e2e8f0',
            borderRadius: '10px',
            fontSize: '.85rem',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '.5rem'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#dc2626'; e.currentTarget.style.color = '#dc2626'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#475569'; }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
          Image
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          style={{ display: 'none' }}
        />

        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
          {['B', 'I', 'U'].map((label, idx) => (
            <button
              key={label}
              type="button"
              onClick={() => insertFormatting(label === 'B' ? 'bold' : label === 'I' ? 'italic' : 'underline')}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                border: '1.5px solid #e2e8f0',
                background: 'white',
                color: '#475569',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#dc2626'; e.currentTarget.style.color = '#dc2626'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#475569'; }}
            >
              {label === 'B' ? <strong>B</strong> : label === 'I' ? <em>I</em> : <u>U</u>}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '4px', background: 'white', position: 'relative' }}>
        {showMathSymbols && (
          <div className="math-symbols-panel" style={{
            position: 'absolute',
            top: '0',
            left: '12px',
            zIndex: 10,
            background: 'white',
            border: '1.5px solid #e2e8f0',
            borderRadius: '16px',
            padding: '1rem',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
            maxWidth: '400px',
            animation: 'fadeInUp 0.3s ease'
          }}>
            <div className="symbols-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '8px' }}>
              {mathSymbols.map((item, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => insertMathSymbol(item.symbol)}
                  title={item.name}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    border: '1.5px solid #f1f5f9',
                    background: '#f8fafc',
                    fontSize: '1rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#dc2626'; e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = '#dc2626'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#374151'; e.currentTarget.style.borderColor = '#f1f5f9'; }}
                >
                  {item.symbol}
                </button>
              ))}
            </div>
          </div>
        )}

        {showFormatting && (
          <div className="formatting-panel" style={{
            position: 'absolute',
            top: '0',
            left: '100px',
            zIndex: 10,
            background: 'white',
            border: '1.5px solid #e2e8f0',
            borderRadius: '16px',
            padding: '1rem',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
            display: 'flex',
            gap: '8px',
            animation: 'fadeInUp 0.3s ease'
          }}>
            <button type="button" onClick={() => insertFormatting('superscript')} style={{ padding: '8px 12px', borderRadius: '8px', border: '1.5px solid #f1f5f9', background: '#f8fafc', cursor: 'pointer' }}>X<sup>2</sup></button>
            <button type="button" onClick={() => insertFormatting('subscript')} style={{ padding: '8px 12px', borderRadius: '8px', border: '1.5px solid #f1f5f9', background: '#f8fafc', cursor: 'pointer' }}>X<sub>2</sub></button>
            <button type="button" onClick={() => insertFormatting('fraction')} style={{ padding: '8px 12px', borderRadius: '8px', border: '1.5px solid #f1f5f9', background: '#f8fafc', cursor: 'pointer' }}>a/b</button>
          </div>
        )}

        <textarea
          id="rich-text-editor"
          style={{
            width: '100%',
            minHeight: '220px',
            padding: '1.5rem',
            fontSize: '1.1rem',
            lineHeight: '1.6',
            color: '#1e293b',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            fontFamily: 'inherit',
            resize: 'vertical'
          }}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.ctrlKey || e.metaKey) {
              switch (e.key.toLowerCase()) {
                case 'b': e.preventDefault(); insertFormatting('bold'); break;
                case 'i': e.preventDefault(); insertFormatting('italic'); break;
                case 'u': e.preventDefault(); insertFormatting('underline'); break;
              }
            }
          }}
          rows={8}
          autoFocus={autoFocus}
        />
      </div>

      {value && (
        <div style={{ padding: '1.5rem', borderTop: '2px solid #f1f5f9', background: '#fcfdfe' }}>
          <div style={{ fontSize: '.8rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '8px', height: '8px', background: '#10b981', borderRadius: '50%' }}></div>
            Live Preview
          </div>
          <div
            style={{ fontSize: '1.1rem', color: '#334155', lineHeight: '1.6' }}
            dangerouslySetInnerHTML={{
              __html: value
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/__(.*?)__/g, '<u>$1</u>')
                .replace(/\^(.*?)\^/g, '<sup>$1</sup>')
                .replace(/~(.*?)~/g, '<sub>$1</sub>')
                .replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" style="max-width: 100%; height: auto; margin: 10px 0; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.08);" />')
            }}
          />
        </div>
      )}

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

export default RichTextEditor
