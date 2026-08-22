import React, { useState, useEffect } from 'react'
import api from '../api/axios'
import { storage } from '../utils/storage'

export default function UserProfile({ userRole, onBack }) {
  console.log('🚀 UserProfile component executing', { userRole, onBack });
  window.USER_PROFILE_LOADED = Date.now();

  const [userData, setUserData] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editForm, setEditForm] = useState({
    fullNameEn: '',
    fullNameAr: '',
    email: '',
    phone: ''
  })

  // Parse user data from JWT token
  const parseUserFromToken = () => {
    try {
      const token = storage.getItem('token')
      if (!token) {
        console.warn('No token found in storage')
        return null
      }

      const parts = token.split('.')
      if (parts.length < 2) {
        console.error('Invalid token format')
        return null
      }

      // Handle URL-safe base64 and potential padding issues
      let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
      while (base64.length % 4) {
        base64 += '='
      }

      const payload = JSON.parse(atob(base64))
      console.log('Decoded Token Payload:', payload)

      const userId = payload.AccountId || payload.accountId || payload.sub || payload.id || payload.nameid || payload.uid || storage.getItem('userId')

      return {
        id: userId,
        email: payload.Email || payload.email || payload.name || storage.getItem('userEmail'),
        roles: payload.Role ? [payload.Role] : (payload.roles || payload.role || (storage.getItem('userRole') ? [storage.getItem('userRole')] : []))
      }
    } catch (error) {
      console.error('Error parsing token:', error)
      // Final fallback from storage directly if token parsing fails
      const fallbackId = storage.getItem('userId') || storage.getItem('accountId')
      if (fallbackId) {
        return {
          id: fallbackId,
          email: storage.getItem('userEmail'),
          roles: storage.getItem('userRole') ? [storage.getItem('userRole')] : []
        }
      }
      return null
    }
  }

  // Fetch user profile data from backend
  const fetchUserProfile = async () => {
    try {
      setLoading(true)
      setError(null)
      const tokenData = parseUserFromToken()
      console.log('[UserProfile] Parsed token data:', tokenData)

      if (!tokenData || !tokenData.id) {
        const errorMsg = 'Unable to parse user information from token'
        console.error('[UserProfile]', errorMsg)
        setError(errorMsg)
        setLoading(false)
        return
      }

      console.log('[UserProfile] Fetching profile for user ID:', tokenData.id)
      const response = await api.get(`/auth/profile/${tokenData.id}`)
      console.log('[UserProfile] Profile response:', response.data)

      if (!response.data) {
        setError('No data received from server')
        setLoading(false)
        return
      }

      setUserData(response.data)
      setEditForm({
        fullNameEn: response.data.fullNameEn || '',
        fullNameAr: response.data.fullNameAr || '',
        email: response.data.email || '',
        phone: response.data.phone || ''
      })
    } catch (err) {
      console.error('[UserProfile] Error fetching profile:', err)
      const errorMessage = err.response?.data?.message || err.message || 'Failed to load profile data'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUserProfile()
  }, [])

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditForm({
      fullNameEn: userData?.fullNameEn || '',
      fullNameAr: userData?.fullNameAr || '',
      email: userData?.email || '',
      phone: userData?.phone || ''
    })
  }

  const handleSave = async () => {
    try {
      setLoading(true)
      const response = await api.put(`/auth/profile/${userData.id}`, editForm)
      setUserData(response.data)
      setIsEditing(false)
    } catch (err) {
      console.error('Error updating profile:', err)
      setError('Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const getInitials = (name) => {
    if (!name) return 'U'
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
  }

  const getRoleDisplayName = (role) => {
    switch (role?.toLowerCase()) {
      case 'admin': return 'Administrator'
      case 'teacher': return 'Teacher'
      case 'student': return 'Student'
      default: return 'User'
    }
  }

  const getRoleColor = (role) => {
    switch (role?.toLowerCase()) {
      case 'admin': return '#dc2626'
      case 'teacher': return '#dc2626'
      case 'student': return '#2563eb'
      default: return '#6b7280'
    }
  }

  if (loading) {
    return (
      <div className="profile-page" style={{ padding: '2rem', background: 'var(--bg-surface)', minHeight: '100vh' }}>
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
        <div className="loading-container" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <div className="loading-spinner" style={{
            width: '48px',
            height: '48px',
            border: '4px solid #e5e7eb',
            borderTop: '4px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }}></div>
          <p style={{ color: '#6b7280', fontSize: '1rem' }}>Loading profile...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="profile-page" style={{ padding: '2rem', background: 'var(--bg-surface)', minHeight: '100vh' }}>
        <div className="error-container" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <div className="error-icon" style={{
            width: '48px',
            height: '48px',
            fill: '#ef4444',
            margin: '0 auto 1rem'
          }}>
            <svg viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
            </svg>
          </div>
          <h3 style={{ color: '#ef4444', marginBottom: '0.5rem', fontSize: '1.25rem', fontWeight: '600' }}>Error Loading Profile</h3>
          <p style={{ color: '#6b7280', marginBottom: '1rem' }}>{error}</p>
          <button
            onClick={fetchUserProfile}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.875rem'
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (!userData) {
    return (
      <div className="profile-page" style={{ padding: '2rem', background: 'var(--bg-surface)', minHeight: '100vh' }}>
        <div className="error-container" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <h3 style={{ color: '#6b7280', marginBottom: '0.5rem', fontSize: '1.25rem', fontWeight: '600' }}>No Profile Data</h3>
          <p style={{ color: '#6b7280', marginBottom: '1rem' }}>Unable to load profile information.</p>
          <button
            onClick={fetchUserProfile}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.875rem'
            }}
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  console.log('[UserProfile] Rendering with state:', { loading, error, userData: !!userData, isEditing, userRole })

  // Always render something visible - even if there's an error
  return (
    <div
      className="profile-page"
      data-testid="user-profile-page"
      style={{
        padding: '2rem',
        background: '#f9fafb',
        minHeight: '100vh',
        width: '100%',
        display: 'block',
        position: 'relative',
        zIndex: 1,
        boxSizing: 'border-box'
      }}
    >
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* Always visible header to confirm component is rendering */}
      {/* Profile Header removed as per user request */}

      <div className="profile-container" style={{
        maxWidth: '800px',
        margin: '0 auto',
        background: 'white',
        borderRadius: '16px',
        boxShadow: '0 4px 18px rgba(0,0,0,.06)',
        overflow: 'visible',
        position: 'relative',
        zIndex: 2,
        minHeight: '400px'
      }}>
        {/* Header */}
        <div className="profile-header" style={{
          background: `linear-gradient(135deg, ${getRoleColor(userRole)} 0%, ${getRoleColor(userRole)}dd 100%)`,
          padding: '2rem',
          textAlign: 'center',
          color: 'white'
        }}>
          <div className="profile-avatar" style={{
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2.5rem',
            fontWeight: '700',
            margin: '0 auto 1rem',
            border: '4px solid rgba(255,255,255,0.3)'
          }}>
            {getInitials(userData?.fullNameEn || userData?.email)}
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: '700', margin: '0 0 0.5rem 0' }}>
            {userData?.fullNameEn || 'User'}
          </h1>
          <p style={{ fontSize: '1rem', opacity: '0.9', margin: '0 0 1rem 0' }}>
            {userData?.email || 'No email'}
          </p>
          <div className="role-badge" style={{
            display: 'inline-block',
            padding: '0.5rem 1rem',
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '999px',
            fontSize: '0.875rem',
            fontWeight: '600',
            border: '1px solid rgba(255,255,255,0.3)'
          }}>
            {getRoleDisplayName(userRole)}
          </div>
        </div>

        {/* Content */}
        <div className="profile-content" style={{ padding: '2rem' }}>
          {isEditing ? (
            <div className="edit-form">
              <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1.5rem', color: '#1f2937' }}>
                Edit Profile
              </h2>
              <div className="form-grid" style={{ display: 'grid', gap: '1rem', marginBottom: '2rem' }}>
                <div className="form-group">
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                    Full Name (English)
                  </label>
                  <input
                    type="text"
                    name="fullNameEn"
                    value={editForm.fullNameEn}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '1rem'
                    }}
                  />
                </div>
                <div className="form-group">
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                    Full Name (Arabic)
                  </label>
                  <input
                    type="text"
                    name="fullNameAr"
                    value={editForm.fullNameAr}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '1rem'
                    }}
                  />
                </div>
                <div className="form-group">
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={editForm.email}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '1rem'
                    }}
                  />
                </div>
                <div className="form-group">
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={editForm.phone}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '1rem'
                    }}
                  />
                </div>
              </div>
              <div className="form-actions" style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button
                  onClick={handleCancel}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: '#6b7280',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    opacity: loading ? 0.6 : 1
                  }}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          ) : (
            <div className="profile-info">
              <div className="profile-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '600', margin: 0, color: '#1f2937' }}>
                  Profile Information
                </h2>
                <button
                  onClick={handleEdit}
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '0.875rem'
                  }}
                >
                  Edit Profile
                </button>
              </div>

              <div className="info-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                <div className="info-card" style={{
                  padding: '1.5rem',
                  background: '#f9fafb',
                  borderRadius: '12px',
                  border: '1px solid #e5e7eb'
                }}>
                  <div className="info-label" style={{ fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', marginBottom: '0.5rem' }}>
                    Full Name (English)
                  </div>
                  <div className="info-value" style={{ fontSize: '1rem', fontWeight: '600', color: '#1f2937' }}>
                    {userData?.fullNameEn || 'Not provided'}
                  </div>
                </div>

                <div className="info-card" style={{
                  padding: '1.5rem',
                  background: '#f9fafb',
                  borderRadius: '12px',
                  border: '1px solid #e5e7eb'
                }}>
                  <div className="info-label" style={{ fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', marginBottom: '0.5rem' }}>
                    Full Name (Arabic)
                  </div>
                  <div className="info-value" style={{ fontSize: '1rem', fontWeight: '600', color: '#1f2937' }}>
                    {userData?.fullNameAr || 'Not provided'}
                  </div>
                </div>

                <div className="info-card" style={{
                  padding: '1.5rem',
                  background: '#f9fafb',
                  borderRadius: '12px',
                  border: '1px solid #e5e7eb'
                }}>
                  <div className="info-label" style={{ fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', marginBottom: '0.5rem' }}>
                    Email Address
                  </div>
                  <div className="info-value" style={{ fontSize: '1rem', fontWeight: '600', color: '#1f2937' }}>
                    {userData?.email || 'Not provided'}
                  </div>
                </div>

                <div className="info-card" style={{
                  padding: '1.5rem',
                  background: '#f9fafb',
                  borderRadius: '12px',
                  border: '1px solid #e5e7eb'
                }}>
                  <div className="info-label" style={{ fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', marginBottom: '0.5rem' }}>
                    Phone Number
                  </div>
                  <div className="info-value" style={{ fontSize: '1rem', fontWeight: '600', color: '#1f2937' }}>
                    {userData?.phone || 'Not provided'}
                  </div>
                </div>

                <div className="info-card" style={{
                  padding: '1.5rem',
                  background: '#f9fafb',
                  borderRadius: '12px',
                  border: '1px solid #e5e7eb'
                }}>
                  <div className="info-label" style={{ fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', marginBottom: '0.5rem' }}>
                    User ID
                  </div>
                  <div className="info-value" style={{ fontSize: '1rem', fontWeight: '600', color: '#1f2937' }}>
                    {userData?.id || 'Not available'}
                  </div>
                </div>

                <div className="info-card" style={{
                  padding: '1.5rem',
                  background: '#f9fafb',
                  borderRadius: '12px',
                  border: '1px solid #e5e7eb'
                }}>
                  <div className="info-label" style={{ fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', marginBottom: '0.5rem' }}>
                    Account Status
                  </div>
                  <div className="info-value" style={{ fontSize: '1rem', fontWeight: '600', color: userData?.isActive ? '#059669' : '#dc2626' }}>
                    {userData?.isActive ? 'Active' : 'Inactive'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="profile-footer" style={{
          padding: '1.5rem 2rem',
          background: '#f9fafb',
          borderTop: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div className="profile-meta" style={{ fontSize: '0.875rem', color: '#6b7280' }}>
            Last updated: {userData?.updatedAt ? new Date(userData.updatedAt).toLocaleDateString() : 'Unknown'}
          </div>
          <button
            onClick={onBack}
            style={{
              padding: '0.5rem 1rem',
              background: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.875rem'
            }}
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}
