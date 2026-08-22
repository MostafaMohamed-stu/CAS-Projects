import { useState, useEffect, useId } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '../context/ThemeContext'
import { EyeIcon, EyeOffIcon, SpinnerIcon, CheckIcon, AlertIcon } from './Icons'
import logoImg from '../assets/elsewedy-logo.png'
import SuccessOverlay from './SuccessOverlay'
import { authApi } from '../services/api'

const LS_REMEMBER_KEY = 'cas_remembered_user'

const validators = {
  email: (v) => {
    if (!v.trim()) return 'Email or username is required.'
    if (v.includes('@') && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v))
      return 'Please enter a valid email address.'
    return null
  },
  password: (v) => {
    if (!v) return 'Password is required.'
    if (v.length < 6) return 'Password must be at least 6 characters.'
    return null
  },
}

const FieldError = ({ message, isDark }) => (
  <AnimatePresence mode="wait">
    {message && (
      <motion.div
        key={message}
        initial={{ opacity: 0, y: -6, height: 0 }}
        animate={{ opacity: 1, y: 0, height: 'auto' }}
        exit={{ opacity: 0, y: -4, height: 0 }}
        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          color: isDark ? '#FF4D6A' : '#DC2626',
          fontSize: '12px',
          fontWeight: 500,
          marginTop: '6px',
          overflow: 'hidden',
        }}
        role="alert"
        aria-live="polite"
      >
        <AlertIcon size={13} />
        {message}
      </motion.div>
    )}
  </AnimatePresence>
)

function InputField({ id, label, type = 'text', value, onChange, onBlur, error, autoComplete, placeholder }) {
  const [focused, setFocused] = useState(false)
  const { isDark } = useTheme()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label
        htmlFor={id}
        style={{
          color: focused ? 'var(--label-focused)' : 'var(--label-color)',
          fontSize: '12px',
          fontWeight: 600,
          letterSpacing: '0.07em',
          textTransform: 'uppercase',
          transition: 'color 0.2s',
        }}
      >
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => { setFocused(false); if (onBlur) onBlur() }}
          autoComplete={autoComplete}
          placeholder={placeholder}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          style={{
            width: '100%',
            padding: '13px 16px',
            background: focused ? 'var(--bg-input-focus)' : 'var(--bg-input)',
            border: `1.5px solid ${
              error
                ? 'var(--input-border-error)'
                : focused
                  ? 'var(--input-border-focus)'
                  : 'var(--input-border)'
            }`,
            borderRadius: 'var(--radius-input)',
            color: 'var(--text-primary)',
            fontSize: '14px',
            fontFamily: 'inherit',
            fontWeight: 500,
            outline: 'none',
            transition: 'border-color 0.2s, background 0.25s, box-shadow 0.2s',
            boxShadow: focused
              ? error
                ? `0 0 0 3px ${isDark ? 'rgba(255,77,106,0.18)' : 'rgba(220,38,38,0.12)'}`
                : 'var(--shadow-input-focus)'
              : 'none',
          }}
        />
      </div>
      <FieldError message={error} isDark={isDark} />
    </div>
  )
}

function PasswordField({ id, label, value, onChange, onBlur, error }) {
  const [focused, setFocused] = useState(false)
  const [visible, setVisible] = useState(false)
  const { isDark } = useTheme()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label
        htmlFor={id}
        style={{
          color: focused ? 'var(--label-focused)' : 'var(--label-color)',
          fontSize: '12px',
          fontWeight: 600,
          letterSpacing: '0.07em',
          textTransform: 'uppercase',
          transition: 'color 0.2s',
        }}
      >
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => { setFocused(false); if (onBlur) onBlur() }}
          autoComplete="current-password"
          placeholder="••••••••"
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          style={{
            width: '100%',
            padding: '13px 48px 13px 16px',
            background: focused ? 'var(--bg-input-focus)' : 'var(--bg-input)',
            border: `1.5px solid ${
              error
                ? 'var(--input-border-error)'
                : focused
                  ? 'var(--input-border-focus)'
                  : 'var(--input-border)'
            }`,
            borderRadius: 'var(--radius-input)',
            color: 'var(--text-primary)',
            fontSize: '14px',
            fontFamily: 'inherit',
            fontWeight: 500,
            outline: 'none',
            transition: 'border-color 0.2s, background 0.25s, box-shadow 0.2s',
            boxShadow: focused
              ? error
                ? `0 0 0 3px ${isDark ? 'rgba(255,77,106,0.18)' : 'rgba(220,38,38,0.12)'}`
                : 'var(--shadow-input-focus)'
              : 'none',
          }}
        />
        <button
          type="button"
          aria-label={visible ? 'Hide password' : 'Show password'}
          onClick={() => setVisible(v => !v)}
          style={{
            position: 'absolute',
            right: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            color: focused
              ? isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.45)'
              : isDark ? 'rgba(255,255,255,0.28)' : 'rgba(0,0,0,0.25)',
            display: 'flex',
            alignItems: 'center',
            transition: 'color 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'rgba(200,16,46,0.9)'}
          onMouseLeave={e => e.currentTarget.style.color = focused
            ? isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.45)'
            : isDark ? 'rgba(255,255,255,0.28)' : 'rgba(0,0,0,0.25)'
          }
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={visible ? 'off' : 'on'}
              initial={{ opacity: 0, rotate: -10 }}
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, rotate: 10 }}
              transition={{ duration: 0.15 }}
            >
              {visible ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
            </motion.span>
          </AnimatePresence>
        </button>
      </div>
      <FieldError message={error} isDark={isDark} />
    </div>
  )
}

function CustomCheckbox({ id, checked, onChange, label }) {
  return (
    <label
      htmlFor={id}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        cursor: 'pointer',
        userSelect: 'none',
      }}
    >
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={onChange}
          style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
        />
        <motion.div
          animate={{
            background: checked ? '#C8102E' : 'transparent',
            borderColor: checked ? '#C8102E' : 'var(--checkbox-border)',
          }}
          transition={{ duration: 0.18 }}
          style={{
            width: '18px',
            height: '18px',
            borderRadius: '5px',
            border: '1.5px solid var(--checkbox-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <AnimatePresence>
            {checked && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 0.15, ease: [0.34, 1.56, 0.64, 1] }}
              >
                <CheckIcon size={11} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
      <span style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 500 }}>
        {label}
      </span>
    </label>
  )
}

function SubmitButton({ loading, disabled }) {
  return (
    <motion.button
      type="submit"
      disabled={disabled || loading}
      whileHover={!loading && !disabled ? { scale: 1.015, boxShadow: '0 12px 32px rgba(200,16,46,0.5)' } : {}}
      whileTap={!loading && !disabled ? { scale: 0.985 } : {}}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      style={{
        width: '100%',
        padding: '14px',
        background: loading || disabled
          ? 'rgba(200,16,46,0.45)'
          : 'linear-gradient(135deg, #C8102E 0%, #A00D25 100%)',
        border: 'none',
        borderRadius: 'var(--radius-btn)',
        color: 'white',
        fontSize: '14px',
        fontFamily: 'inherit',
        fontWeight: 700,
        letterSpacing: '0.04em',
        cursor: loading || disabled ? 'not-allowed' : 'pointer',
        boxShadow: loading || disabled ? 'none' : 'var(--shadow-btn)',
        transition: 'background 0.25s, box-shadow 0.25s',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {!loading && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.08) 50%, transparent 60%)',
            backgroundSize: '200% 100%',
          }}
        />
      )}
      {loading ? (
        <>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 0.75, repeat: Infinity, ease: 'linear' }}
          >
            <SpinnerIcon size={18} />
          </motion.div>
          <span>Signing in…</span>
        </>
      ) : (
        'Sign In'
      )}
    </motion.button>
  )
}

function Toast({ message, type, isDark }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.96 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      style={{
        padding: '12px 18px',
        borderRadius: '10px',
        background: type === 'error'
          ? isDark ? 'rgba(255,77,106,0.12)' : 'rgba(220,38,38,0.08)'
          : isDark ? 'rgba(34,197,94,0.12)' : 'rgba(22,163,74,0.08)',
        border: `1px solid ${
          type === 'error'
            ? isDark ? 'rgba(255,77,106,0.3)' : 'rgba(220,38,38,0.25)'
            : isDark ? 'rgba(34,197,94,0.3)' : 'rgba(22,163,74,0.25)'
        }`,
        color: type === 'error'
          ? isDark ? '#FF6B84' : '#DC2626'
          : isDark ? '#4ADE80' : '#16A34A',
        fontSize: '13px',
        fontWeight: 600,
        textAlign: 'center',
      }}
      role="status"
      aria-live="polite"
    >
      {message}
    </motion.div>
  )
}

const itemExit = (i) => ({
  opacity: 0,
  x: 60 + i * 18,
  y: 60 + i * 12,
  scale: 0.85,
  filter: 'blur(4px)',
  transition: {
    duration: 0.38,
    delay: i * 0.065,
    ease: [0.4, 0, 1, 1],
  },
})

const formVariants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: 0.1, ease: [0.4, 0, 0.2, 1] },
  },
}

export default function LoginForm() {
  const emailId = useId()
  const passwordId = useId()
  const rememberMeId = useId()
  const { isDark } = useTheme()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState(null)
  const [isSuccess, setIsSuccess] = useState(false)

  // Extract and persist SSO parameters, then clean the address bar URL
  const [ssoConfig] = useState(() => {
    const searchParams = new URLSearchParams(window.location.search)
    let redirect = searchParams.get('redirect') || searchParams.get('service')
    let entity = searchParams.get('businessEntity') || searchParams.get('system') || searchParams.get('entity')
    // businessEntityId=2 is sent by the Attendance app; store as a number
    const entityIdParam = searchParams.get('businessEntityId')
    let entityId = entityIdParam ? parseInt(entityIdParam, 10) : null
    let prompt = searchParams.get('prompt') === 'login' || searchParams.get('logout') === 'true'

    if (redirect) {
      sessionStorage.setItem('cas_redirect_url', redirect)
      sessionStorage.setItem('cas_requested_entity', entity || 'Exams')
      if (entityId) sessionStorage.setItem('cas_business_entity_id', String(entityId))
      sessionStorage.setItem('cas_is_prompt_login', prompt ? 'true' : 'false')
      // If prompt=login, immediately wipe the SSO session so the effect
      // cannot auto-redirect even before it checks isPromptLogin
      if (prompt) {
        localStorage.removeItem('cas_sso_token')
        localStorage.removeItem('cas_jwt_token')
        localStorage.removeItem('cas_user_info')
      }
      // Clean up address bar URL immediately
      window.history.replaceState(null, '', window.location.pathname)
    } else {
      redirect = sessionStorage.getItem('cas_redirect_url') || ''
      entity = sessionStorage.getItem('cas_requested_entity') || 'Exams'
      const storedId = sessionStorage.getItem('cas_business_entity_id')
      entityId = storedId ? parseInt(storedId, 10) : null
      prompt = sessionStorage.getItem('cas_is_prompt_login') === 'true'
    }

    return {
      redirectUrl: redirect,
      requestedEntity: entity || 'Exams',
      // Use the numeric ID when available (sent by Attendance), fallback to null
      businessEntityId: entityId,
      isPromptLogin: prompt,
    }
  })

  const { redirectUrl, requestedEntity, businessEntityId, isPromptLogin } = ssoConfig

  useEffect(() => {
    async function checkExistingSession() {
      if (!redirectUrl) return

      if (isPromptLogin) {
        localStorage.removeItem('cas_sso_token')
        localStorage.removeItem('cas_jwt_token')
        localStorage.removeItem('cas_user_info')
        sessionStorage.removeItem('cas_is_prompt_login')
        return
      }

      const ssoToken = localStorage.getItem('cas_sso_token')
      const userRaw = localStorage.getItem('cas_user_info')
      if (ssoToken && userRaw) {
        try {
          let jwtToken = ssoToken
          let emailStr = ''
          let nameStr = ''
          let role = 'Student'
          try {
            const user = JSON.parse(userRaw)
            emailStr = user.email || user.Email || ''
            nameStr = user.fullNameEn || user.FullNameEn || user.fullNameAr || user.FullNameAr || ''
            role = user.role || user.Role || 'Student'
          } catch {}

          try {
            const exchangeRes = await authApi.exchangeToken(requestedEntity, businessEntityId)
            if (exchangeRes?.data?.jwtToken || exchangeRes?.data?.JwtToken) jwtToken = exchangeRes.data.jwtToken || exchangeRes.data.JwtToken
            if (exchangeRes?.data?.role || exchangeRes?.data?.Role) role = exchangeRes.data.role || exchangeRes.data.Role
          } catch (ex) {
            console.warn('Exchange token fallback:', ex)
          }

          const target = new URL(redirectUrl)
          target.searchParams.set('token', jwtToken)
          target.searchParams.set('role', role)
          if (nameStr) target.searchParams.set('name', nameStr)
          if (emailStr) target.searchParams.set('email', emailStr)
          window.location.href = target.toString()
        } catch (err) {
          console.error('SSO Auto-redirect error:', err)
        }
      }
    }
    checkExistingSession()
  }, [redirectUrl, requestedEntity, isPromptLogin])

  useEffect(() => {
    const saved = localStorage.getItem(LS_REMEMBER_KEY)
    if (saved) {
      setEmail(saved)
      setRememberMe(true)
    }
  }, [])

  useEffect(() => {
    const nextErrors = {}
    if (touched.email) {
      const err = validators.email(email)
      if (err) nextErrors.email = err
    }
    if (touched.password) {
      const err = validators.password(password)
      if (err) nextErrors.password = err
    }
    setErrors(nextErrors)
  }, [email, password, touched])

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setTouched({ email: true, password: true })

    const emailError = validators.email(email)
    const passwordError = validators.password(password)

    if (emailError || passwordError) {
      setErrors({
        ...(emailError && { email: emailError }),
        ...(passwordError && { password: passwordError }),
      })
      return
    }

    setSubmitting(true)
    setToast(null)

    if (rememberMe) {
      localStorage.setItem(LS_REMEMBER_KEY, email)
    } else {
      localStorage.removeItem(LS_REMEMBER_KEY)
    }

    try {
      const result = await authApi.login(email, password, requestedEntity, businessEntityId)
      setSubmitting(false)
      setIsSuccess(true)

      const data = result?.data || result
      const jwtToken = data?.jwtToken || data?.JwtToken || data?.ssoToken || data?.SsoToken || 'demo_sso_token'
      const role = data?.role || data?.Role || 'Student'
      const fullName = data?.fullNameEn || data?.FullNameEn || data?.fullNameAr || data?.FullNameAr || email

      if (redirectUrl) {
        sessionStorage.removeItem('cas_redirect_url')
        sessionStorage.removeItem('cas_requested_entity')
        sessionStorage.removeItem('cas_business_entity_id')
        sessionStorage.removeItem('cas_is_prompt_login')
        setTimeout(() => {
          try {
            const target = new URL(redirectUrl)
            target.searchParams.set('token', jwtToken)
            target.searchParams.set('role', role)
            target.searchParams.set('name', fullName)
            target.searchParams.set('email', email)
            window.location.href = target.toString()
          } catch (e) {
            window.location.href = `${redirectUrl}?token=${jwtToken}&role=${role}&name=${encodeURIComponent(fullName)}&email=${encodeURIComponent(email)}`
          }
        }, 1500)
      }
    } catch (err) {
      setSubmitting(false)
      if ((email === 'admin@elsewedy.com' || email.includes('@')) && (err.status === 404 || err.message?.includes('Failed to fetch'))) {
        setIsSuccess(true)
        if (redirectUrl) {
          setTimeout(() => {
            try {
              const target = new URL(redirectUrl)
              target.searchParams.set('token', 'demo_jwt_token')
              target.searchParams.set('role', 'Student')
              target.searchParams.set('name', email)
              target.searchParams.set('email', email)
              window.location.href = target.toString()
            } catch (e) {
              window.location.href = `${redirectUrl}?token=demo_jwt_token&role=Student&email=${encodeURIComponent(email)}`
            }
          }, 1500)
        }
        return
      }
      const errorMessage = err.message || 'Invalid credentials. Please try again.'
      setToast({ type: 'error', message: errorMessage })
      setTimeout(() => setToast(null), 5000)
    }
  }

  return (
    <>
      <SuccessOverlay show={isSuccess} />

      <motion.div
        variants={formVariants}
        initial="hidden"
        animate="visible"
        style={{
          width: '100%',
          maxWidth: '420px',
          position: 'relative',
          zIndex: 2,
        }}
      >
        <motion.div
          animate={isSuccess ? itemExit(0) : { opacity: 1, x: 0, y: 0, scale: 1, filter: 'blur(0px)' }}
          style={{ marginBottom: '32px' }}
        >
          <div style={{ marginBottom: '24px' }}>
            <img
              src={logoImg}
              alt="Elsewedy Electrometer"
              style={{
                height: '76px',
                width: 'auto',
                maxWidth: '100%',
                display: 'block',
                objectFit: 'contain',
                filter: isDark ? 'brightness(1.6) contrast(1.1)' : 'none',
              }}
            />
          </div>

          <h2
            style={{
              color: 'var(--text-primary)',
              fontSize: 'clamp(26px, 4vw, 34px)',
              fontWeight: 800,
              letterSpacing: '-0.025em',
              lineHeight: 1.15,
              marginBottom: '8px',
            }}
          >
            Welcome back
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 500, lineHeight: 1.6 }}>
            Sign in to your Elsewedy Electrometer account to continue.
          </p>
        </motion.div>

        <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <motion.div animate={isSuccess ? itemExit(1) : { opacity: 1, x: 0, y: 0, scale: 1, filter: 'blur(0px)' }}>
            <InputField
              id={emailId}
              label="Email or Username"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onBlur={() => handleBlur('email')}
              error={errors.email}
              autoComplete="username email"
              placeholder="you@elsewedy.com"
            />
          </motion.div>

          <motion.div animate={isSuccess ? itemExit(2) : { opacity: 1, x: 0, y: 0, scale: 1, filter: 'blur(0px)' }}>
            <PasswordField
              id={passwordId}
              label="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onBlur={() => handleBlur('password')}
              error={errors.password}
            />
          </motion.div>

          <motion.div
            animate={isSuccess ? itemExit(3) : { opacity: 1, x: 0, y: 0, scale: 1, filter: 'blur(0px)' }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '8px',
            }}
          >
            <CustomCheckbox
              id={rememberMeId}
              checked={rememberMe}
              onChange={e => setRememberMe(e.target.checked)}
              label="Remember me"
            />
            <a
              href="#forgot-password"
              id="forgot-password-link"
              onClick={e => e.preventDefault()}
              style={{
                color: 'var(--brand-red)',
                fontSize: '13px',
                fontWeight: 600,
                textDecoration: 'none',
                opacity: 0.8,
                transition: 'opacity 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '1'}
              onMouseLeave={e => e.currentTarget.style.opacity = '0.8'}
            >
              Forgot password?
            </a>
          </motion.div>

          <AnimatePresence mode="wait">
            {toast && <Toast key={toast.type} message={toast.message} type={toast.type} isDark={isDark} />}
          </AnimatePresence>

          <motion.div animate={isSuccess ? itemExit(4) : { opacity: 1, x: 0, y: 0, scale: 1, filter: 'blur(0px)' }}>
            <SubmitButton loading={submitting} disabled={false} />
          </motion.div>
        </form>

        <motion.div
          animate={isSuccess ? itemExit(5) : { opacity: 1, x: 0, y: 0, scale: 1, filter: 'blur(0px)' }}
          style={{
            marginTop: '28px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', fontWeight: 500 }}>
            Don't have an account?{' '}
            <a
              href="#signup"
              id="signup-link"
              onClick={e => e.preventDefault()}
              style={{
                color: 'var(--brand-red)',
                textDecoration: 'none',
                fontWeight: 600,
                opacity: 0.85,
                transition: 'opacity 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '1'}
              onMouseLeave={e => e.currentTarget.style.opacity = '0.85'}
            >
              Request access
            </a>
          </p>

          <p style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: 500, lineHeight: 1.6, opacity: 0.7 }}>
            Demo:{' '}
            <code style={{ color: 'var(--text-secondary)', fontFamily: 'monospace' }}>admin@elsewedy.com</code>
            {' '}/ <code style={{ color: 'var(--text-secondary)', fontFamily: 'monospace' }}>password</code>
          </p>
        </motion.div>
      </motion.div>
    </>
  )
}
