import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { ThemeProvider } from './context/ThemeContext'
import IntroSequence from './components/IntroSequence'
import LoginPage from './components/LoginPage'

function App() {
  const hasSeenIntro = sessionStorage.getItem('cas_intro_seen') === 'true'
  const [showIntro, setShowIntro] = useState(!hasSeenIntro)

  const handleIntroComplete = () => {
    sessionStorage.setItem('cas_intro_seen', 'true')
    setShowIntro(false)
  }

  return (
    <ThemeProvider>
      <AnimatePresence mode="wait">
        {showIntro ? (
          <IntroSequence key="intro" onComplete={handleIntroComplete} duration={3000} />
        ) : (
          <LoginPage key="login" />
        )}
      </AnimatePresence>
    </ThemeProvider>
  )
}

export default App
