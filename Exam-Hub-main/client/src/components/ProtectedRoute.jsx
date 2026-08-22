import { Navigate } from 'react-router-dom'
import { storage } from '../utils/storage'

export default function ProtectedRoute({ children, allowedRoles }) {
    const token = storage.getItem('token')

    // If no token, redirect directly to CAS Single Sign-On
    if (!token) {
        const casUrl = 'http://localhost:5174'
        const callbackUrl = encodeURIComponent(`${window.location.origin}/sso-callback`)
        window.location.href = `${casUrl}/login?redirect=${callbackUrl}&businessEntityId=9`
        return null
    }

    // Parse user role from token
    try {
        const payload = JSON.parse(atob(token.split('.')[1]))

        // Try multiple ways to get roles
        let userRoles = []

        // Check for roles array
        if (Array.isArray(payload.roles)) {
            userRoles = payload.roles.map(r => String(r).toLowerCase())
        }
        // Check for single role
        else if (payload.role || payload.Role) {
            const r = payload.role || payload.Role
            userRoles = [String(r).toLowerCase()]
        }
        // Check for role in http schema format
        else if (payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']) {
            const role = payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']
            userRoles = Array.isArray(role) ? role.map(r => String(r).toLowerCase()) : [String(role).toLowerCase()]
        }
        // Fallback to storage utility
        else {
            const storedRole = storage.getItem('userRole')
            if (storedRole) {
                userRoles = [String(storedRole).toLowerCase()]
            }
        }

        // Check if user has any of the allowed roles
        const hasAccess = allowedRoles.some(role =>
            userRoles.includes(role.toLowerCase())
        )

        if (!hasAccess) {
            // Redirect to appropriate page based on user's actual role
            if (userRoles.includes('admin') || userRoles.includes('board') || userRoles.includes('superadmin')) {
                if (window.location.pathname !== '/superadmin') {
                    return <Navigate to="/superadmin" replace />
                }
            } else if (userRoles.includes('teacher')) {
                if (window.location.pathname !== '/teacher') {
                    return <Navigate to="/teacher" replace />
                }
            } else if (userRoles.includes('student')) {
                if (window.location.pathname !== '/student') {
                    return <Navigate to="/student" replace />
                }
            }
            // Fallback to login if role is unknown or already home but unauthorized
            if (window.location.pathname !== '/') {
                return <Navigate to="/" replace />
            }
            return null // Just stop rendering the children
        }

        // User has access, render the protected component
        return children
    } catch (error) {
        console.error('Error parsing token:', error)
        // Token not a valid JWT — fall back to stored role
        const storedRole = (storage.getItem('userRole') || '').toLowerCase()
        if (!storedRole) return <Navigate to="/" replace />

        const hasAccess = allowedRoles.some(role => role.toLowerCase() === storedRole)
        if (hasAccess) return children

        if (storedRole === 'admin' || storedRole === 'board' || storedRole === 'superadmin') return <Navigate to="/superadmin" replace />
        if (storedRole === 'teacher') return <Navigate to="/teacher" replace />
        if (storedRole === 'student') return <Navigate to="/student" replace />
        return <Navigate to="/" replace />
    }
}
