import { LogIn } from 'lucide-react'

/**
 * This is deliberately a public route.  An Exam logout removes only Exam's
 * local JWT and profile data. CAS also clears its shared SSO session and only
 * Exam's scoped system JWT; other systems retain their own JWTs.
 */
export default function ExamSignedOutPage() {
  const signInToExam = () => {
    window.location.href = '/'
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '2rem',
      background: '#f8fafc', fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      <main style={{ maxWidth: '440px', width: '100%', background: '#fff', borderRadius: '20px', padding: '2.5rem', textAlign: 'center', boxShadow: '0 18px 45px rgba(15, 23, 42, .08)' }}>
        <h1 style={{ margin: '0 0 .75rem', color: '#111827' }}>Signed out of Exam Hub</h1>
        <p style={{ margin: '0 0 1.75rem', color: '#4b5563', lineHeight: 1.6 }}>
          Your Exam Hub session was removed. Your Central CAS and Capstone sessions are still active.
        </p>
        <button type="button" onClick={signInToExam} style={{ border: 0, borderRadius: '10px', padding: '.8rem 1.1rem', color: '#fff', background: '#dc2626', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '.5rem' }}>
          <LogIn size={18} /> Sign in to Exam Hub
        </button>
      </main>
    </div>
  )
}
