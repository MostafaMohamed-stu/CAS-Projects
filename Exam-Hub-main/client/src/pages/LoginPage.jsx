import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { storage } from '../utils/storage'

export default function LoginPage() {
  const navigate = useNavigate()

  useEffect(() => {
    // If already authenticated, redirect to main application
    if (storage.getItem('token')) {
      navigate('/greeting')
      return
    }

    // Automatically redirect to CAS Single Sign-On page
    const searchParams = new URLSearchParams(window.location.search)
    const promptParam = searchParams.get('prompt') ? '&prompt=' + searchParams.get('prompt') : ''
    const casUrl = 'http://localhost:5174'
    const callbackUrl = encodeURIComponent(`${window.location.origin}/sso-callback`)
    window.location.href = `${casUrl}/login?redirect=${callbackUrl}&businessEntityId=9${promptParam}`
  }, [navigate])

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      fontFamily: 'Inter, system-ui, sans-serif',
      backgroundColor: '#f9fafb',
      padding: '2rem'
    }}>
      <div style={{
        background: 'white',
        padding: '3rem 2.5rem',
        borderRadius: '24px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.06)',
        textAlign: 'center',
        maxWidth: '420px',
        width: '100%'
      }}>
        <div style={{
          width: '64px',
          height: '64px',
          background: '#fef2f2',
          borderRadius: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.5rem',
          border: '1px solid #fee2e2'
        }}>
          <img src="/logo.png" style={{ width: '44px', height: '44px', objectFit: 'contain' }} alt="Exams Hub" />
        </div>
        <h2 style={{ fontSize: '1.4rem', color: '#111827', marginBottom: '0.5rem', fontWeight: 800 }}>Exams Hub</h2>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem', color: '#ef4444' }}>
          <Loader2 style={{ animation: 'spin 1s linear infinite' }} size={24} />
          <span style={{ color: '#4b5563', fontSize: '0.95rem', fontWeight: 500 }}>Redirecting to Central CAS Login...</span>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
