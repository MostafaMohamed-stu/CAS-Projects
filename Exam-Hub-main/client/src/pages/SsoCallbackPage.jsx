import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { storage } from '../utils/storage'
import api from '../api/axios'

export default function SsoCallbackPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    async function processSso() {
      try {
        const token = searchParams.get('token')
        const role = searchParams.get('role')
        const userName = searchParams.get('name') || searchParams.get('userName')
        const email = searchParams.get('email')
        const ssoToken = searchParams.get('ssoToken')

        if (token) {
          // Token provided directly from CAS
          const primaryRole = role || 'Student'
          storage.setItem('token', token)
          storage.setItem('userRole', primaryRole)
          if (userName) storage.setItem('userName', userName)
          if (email) storage.setItem('userEmail', email)

          navigate('/greeting', { replace: true })
          return
        }

        if (email || ssoToken) {
          // Exchange SSO Token / Email with Exams API for Exams JWT
          const response = await api.post('/auth/sso-token', {
            email: email || '',
            ssoToken: ssoToken || '',
            businessEntity: 'Exams'
          })

          const { token: apiToken, role: apiRole, fullNameEn, fullNameAr } = response.data

          storage.setItem('token', apiToken)
          storage.setItem('userRole', apiRole || 'Student')
          storage.setItem('userName', fullNameEn || fullNameAr || email || 'User')

          navigate('/greeting', { replace: true })
          return
        }

        const storedToken = storage.getItem('token')
        if (storedToken) {
          navigate('/greeting', { replace: true })
          return
        }

        navigate('/', { replace: true })
      } catch (err) {
        console.error('SSO Callback error:', err)
        navigate('/', { replace: true })
      }
    }

    processSso()
  }, [searchParams, navigate])

  return null
}
