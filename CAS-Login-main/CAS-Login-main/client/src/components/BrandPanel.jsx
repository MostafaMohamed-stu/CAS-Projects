import { motion } from 'framer-motion'
import logoImg from '../assets/elsewedy-logo.png'

const panelVariants = {
  hidden: { x: -40, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] },
  },
}

const GridDots = () => (
  <svg
    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.12 }}
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
        <circle cx="1" cy="1" r="1" fill="white" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#grid)" />
  </svg>
)

const AccentLines = () => (
  <svg
    style={{ position: 'absolute', bottom: '10%', right: '-1px', width: '160px', height: '300px', opacity: 0.7 }}
    viewBox="0 0 160 300"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {[0, 18, 36, 54, 72].map((offset, i) => (
      <motion.line
        key={i}
        x1={offset}
        y1="0"
        x2={offset + 80}
        y2="300"
        stroke="#C8102E"
        strokeWidth="1.5"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: [0, 0.8, 0.4] }}
        transition={{ duration: 1.2, delay: 0.3 + i * 0.12, ease: [0.4, 0, 0.2, 1] }}
      />
    ))}
  </svg>
)

const RedRing = ({ size, style }) => (
  <motion.div
    initial={{ scale: 0.6, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
    style={{
      width: size,
      height: size,
      borderRadius: '50%',
      border: '2px solid rgba(200,16,46,0.4)',
      position: 'absolute',
      ...style,
    }}
  />
)

const StatBadge = ({ label, value, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay, ease: [0.4, 0, 0.2, 1] }}
    style={{
      background: 'rgba(255,255,255,0.05)',
      border: '1px solid rgba(255,255,255,0.09)',
      borderRadius: '12px',
      padding: '14px 18px',
      textAlign: 'center',
    }}
  >
    <div style={{ color: '#E8192F', fontSize: '24px', fontWeight: 800, lineHeight: 1 }}>{value}</div>
    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', marginTop: '4px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</div>
  </motion.div>
)

export default function BrandPanel() {
  return (
    <motion.aside
      variants={panelVariants}
      initial="hidden"
      animate="visible"
      style={{
        width: 'clamp(300px, 42%, 560px)',
        flexShrink: 0,
        background: 'linear-gradient(160deg, #0D0D11 0%, #080809 60%, #0E0810 100%)',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 'clamp(32px, 5vw, 56px)',
      }}
      className="brand-panel"
    >
      <GridDots />
      <AccentLines />
      <RedRing size={240} style={{ top: '-60px', right: '-60px', opacity: 0.4 }} />
      <RedRing size={120} style={{ top: '20px', right: '20px', opacity: 0.25 }} />

      <div style={{ position: 'relative', zIndex: 2 }}>
        <img
          src={logoImg}
          alt="Elsewedy Electrometer"
          style={{
            height: '80px',
            width: 'auto',
            maxWidth: '100%',
            display: 'block',
            objectFit: 'contain',
            filter: 'brightness(1.6) contrast(1.1)',
          }}
        />
      </div>

      <div style={{ position: 'relative', zIndex: 2 }}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25, ease: [0.4, 0, 0.2, 1] }}
        >
          <p
            style={{
              color: '#C8102E',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              marginBottom: '16px',
            }}
          >
            Centralized Access System
          </p>
          <h1
            style={{
              color: 'white',
              fontSize: 'clamp(28px, 3.5vw, 44px)',
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: '-0.025em',
              marginBottom: '20px',
            }}
          >
            Power Your
            <br />
            <span style={{ color: '#C8102E' }}>Operations</span>
            <br />
            Intelligently.
          </h1>
          <p
            style={{
              color: 'rgba(255,255,255,0.4)',
              fontSize: '14px',
              lineHeight: 1.7,
              maxWidth: '320px',
              fontWeight: 500,
            }}
          >
            Access real-time metering data, analytics, and
            fleet management tools in one secure platform.
          </p>
        </motion.div>

        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.5, delay: 0.5, ease: [0.4, 0, 0.2, 1] }}
          style={{
            height: '1px',
            background: 'linear-gradient(90deg, rgba(200,16,46,0.5) 0%, rgba(255,255,255,0.05) 100%)',
            margin: '28px 0',
            transformOrigin: 'left',
          }}
        />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
          <StatBadge label="Systems" value="10+" delay={0.55} />
          <StatBadge label="Uptime" value="99.9%" delay={0.65} />
        </div>
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.85 }}
        style={{
          position: 'relative',
          zIndex: 2,
          color: 'rgba(255,255,255,0.2)',
          fontSize: '11px',
          fontWeight: 500,
        }}
      >
        © {new Date().getFullYear()} Elsewedy Electrometer. All rights reserved.
      </motion.p>

      <style>{`
        @media (max-width: 768px) {
          .brand-panel {
            width: 100% !important;
            min-height: auto !important;
            flex-shrink: 0;
            padding: 24px 20px !important;
            flex-direction: row;
            align-items: center;
            justify-content: flex-start;
          }
        }
      `}</style>
    </motion.aside>
  )
}
