import { motion, AnimatePresence } from 'framer-motion'

export default function SuccessOverlay({ show }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9000,
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          <motion.div
            initial={{
              width: '0px',
              height: '0px',
              borderRadius: '50%',
              background: '#C8102E',
              position: 'absolute',
              bottom: '15%',
              right: '15%',
              x: '50%',
              y: '50%',
            }}
            animate={{
              width: '350vmax',
              height: '350vmax',
            }}
            transition={{
              duration: 0.9,
              delay: 0.15,
              ease: [0.22, 1, 0.36, 1],
            }}
            style={{
              position: 'absolute',
              borderRadius: '50%',
              background: '#C8102E',
              bottom: '15%',
              right: '15%',
              transform: 'translate(50%, 50%)',
            }}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.3 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              duration: 0.55,
              delay: 0.85,
              ease: [0.34, 1.56, 0.64, 1],
            }}
            style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}
          >
            <div style={{ position: 'relative', width: '140px', height: '140px' }}>
              <motion.svg
                width="140"
                height="140"
                viewBox="0 0 140 140"
                style={{ position: 'absolute', inset: 0 }}
              >
                <motion.circle
                  cx="70"
                  cy="70"
                  r="62"
                  fill="none"
                  stroke="rgba(255,255,255,0.25)"
                  strokeWidth="3"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.6, delay: 1.1, ease: 'easeInOut' }}
                />
                <motion.circle
                  cx="70"
                  cy="70"
                  r="62"
                  fill="none"
                  stroke="white"
                  strokeWidth="3"
                  strokeLinecap="round"
                  initial={{ pathLength: 0, rotate: -90 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.6, delay: 1.1, ease: 'easeInOut' }}
                  style={{ transformOrigin: '70px 70px' }}
                />
              </motion.svg>

              <motion.svg
                width="140"
                height="140"
                viewBox="0 0 140 140"
                style={{ position: 'absolute', inset: 0 }}
              >
                <motion.path
                  d="M 42 70 L 62 90 L 98 50"
                  fill="none"
                  stroke="white"
                  strokeWidth="7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.45, delay: 1.55, ease: [0.4, 0, 0.2, 1] }}
                />
              </motion.svg>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 1.9 }}
              style={{ textAlign: 'center' }}
            >
              <p style={{ color: 'white', fontSize: '22px', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '6px' }}>
                Signed In Successfully
              </p>
              <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '14px', fontWeight: 500 }}>
                Redirecting to your dashboard…
              </p>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
