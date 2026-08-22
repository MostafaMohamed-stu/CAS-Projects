import { motion } from 'framer-motion'
import { useTheme } from '../context/ThemeContext'
import LoginForm from './LoginForm'
import BrandPanel from './BrandPanel'
import ThemeToggle from './ThemeToggle'

const pageVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.45, ease: [0.4, 0, 0.2, 1] },
  },
}

export default function LoginPage() {
  const { isDark } = useTheme()

  return (
    <motion.div
      key="login-page"
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      style={{
        minHeight: '100vh',
        display: 'flex',
        background: 'var(--bg-base)',
        transition: 'background 0.3s ease',
      }}
    >
      <ThemeToggle />
      <BrandPanel />
      <div
        style={{
          flex: '1 1 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'clamp(24px, 5vw, 64px) clamp(20px, 4vw, 56px)',
          minHeight: '100vh',
          background: 'var(--bg-surface)',
          position: 'relative',
          transition: 'background 0.3s ease',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '-80px',
            right: '-80px',
            width: '320px',
            height: '320px',
            borderRadius: '50%',
            background: isDark
              ? 'radial-gradient(circle, rgba(200,16,46,0.08) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(200,16,46,0.06) 0%, transparent 70%)',
            pointerEvents: 'none',
            transition: 'background 0.3s ease',
          }}
        />
        <LoginForm />
      </div>
    </motion.div>
  )
}
