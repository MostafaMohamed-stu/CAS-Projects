import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import './index.css'
import App from './App.jsx'

import LoginPage from './pages/LoginPage.jsx'
import StudentPage from './pages/StudentPage.jsx'
import TeacherPage from './pages/TeacherPage.jsx'
import SuperAdminPage from './pages/SuperAdminPage.jsx'
import StudentDetailsPage from './pages/StudentDetailsPage.jsx'
import GreetingPage from './pages/GreetingPage.jsx'
import SsoCallbackPage from './pages/SsoCallbackPage.jsx'
import ExamSignedOutPage from './pages/ExamSignedOutPage.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'

const router = createBrowserRouter([
  { path: '/', element: <LoginPage /> },
  { path: '/sso-callback', element: <SsoCallbackPage /> },
  { path: '/signed-out', element: <ExamSignedOutPage /> },
  { path: '/greeting', element: <GreetingPage /> },
  {
    path: '/student',
    element: (
      <ProtectedRoute allowedRoles={['student']}>
        <StudentPage />
      </ProtectedRoute>
    )
  },
  {
    path: '/teacher',
    element: (
      <ProtectedRoute allowedRoles={['teacher', 'admin']}>
        <TeacherPage />
      </ProtectedRoute>
    )
  },
  {
    path: '/superadmin',
    element: (
      <ProtectedRoute allowedRoles={['admin', 'superadmin', 'board']}>
        <SuperAdminPage />
      </ProtectedRoute>
    )
  },
  {
    path: '/student-details',
    element: (
      <ProtectedRoute allowedRoles={['admin', 'superadmin', 'board']}>
        <StudentDetailsPage />
      </ProtectedRoute>
    )
  },
  // Fallback: redirect any unknown route to login
  { path: '*', element: <Navigate to="/" replace /> },
])

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
