import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AuthProvider } from './Contexts/AuthContext'
import { AbsenceProvider } from './Contexts/AbsenceContext'
import { NotificationProvider } from './Contexts/NotificationContext'
import './index.css'
import App from './App.jsx'

// Register Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('SW registered: ', registration);
      })
      .catch(registrationError => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <AbsenceProvider>
        <NotificationProvider>
          <App />
        </NotificationProvider>
      </AbsenceProvider>
    </AuthProvider>
  </StrictMode>,
)
