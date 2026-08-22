import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import loginGif from '../assets/login_GIF.gif'
import logoImg from '../assets/elsewedy-logo.png'

export default function IntroSequence({ onComplete, duration = 5000 }) {
  const timerRef = useRef(null)

  useEffect(() => {
    timerRef.current = setTimeout(onComplete, duration)
    return () => clearTimeout(timerRef.current)
  }, [onComplete, duration])

  const skip = () => {
    clearTimeout(timerRef.current)
    onComplete()
  }

  return (
    <motion.div
      key="intro"
      initial={{ opacity: 1 }}
      exit={{
        opacity: 0,
        transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] },
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: '#080809',
        overflow: 'hidden',
        cursor: 'pointer',
      }}
      onClick={skip}
      aria-label="Intro — click to skip"
    >
      <img
        src={loginGif}
        alt="Elsewedy Electrometer intro"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0) 40%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.4) 100%)',
          pointerEvents: 'none',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        style={{
          position: 'absolute',
          top: '28px',
          left: '28px',
        }}
      >
        <img
          src={logoImg}
          alt="Elsewedy Electrometer"
          style={{
            height: '60px',
            width: 'auto',
            display: 'block',
            filter: 'brightness(1.5) drop-shadow(0 2px 8px rgba(0,0,0,0.5))',
          }}
        />
      </motion.div>

      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: duration / 1000, ease: 'linear' }}
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: '#C8102E',
          transformOrigin: 'left',
        }}
      />

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.4 }}
        onClick={(e) => { e.stopPropagation(); skip() }}
        style={{
          position: 'absolute',
          bottom: '28px',
          right: '28px',
          background: 'rgba(0,0,0,0.45)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.18)',
          borderRadius: '50px',
          color: 'rgba(255,255,255,0.85)',
          fontSize: '12px',
          fontFamily: 'inherit',
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          cursor: 'pointer',
          padding: '9px 18px',
          transition: 'background 0.2s, color 0.2s',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = 'rgba(200,16,46,0.75)'
          e.currentTarget.style.borderColor = 'rgba(200,16,46,0.5)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'rgba(0,0,0,0.45)'
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'
        }}
      >
        Skip →
      </motion.button>
    </motion.div>
  )
}

export function LogoPlaceholder({ animated = false }) {
  return (
    <motion.div
      animate={animated ? { scale: [1, 1.05, 1] } : {}}
      transition={animated ? { duration: 2, repeat: Infinity, ease: 'easeInOut' } : {}}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, padding: '16px' }}
    >
      <img
        src={logoImg}
        alt="Elsewedy Electrometer"
        style={{
          height: '110px',
          width: 'auto',
          maxWidth: '100%',
          display: 'block',
          objectFit: 'contain',
          filter: 'brightness(1.6) contrast(1.1)',
        }}
      />
    </motion.div>
  )
}
