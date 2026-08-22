import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from "../Services/api";
import { useAuth } from "../Contexts/AuthContext";
import {
  FiEdit,
  FiLogOut,
  FiArrowLeft,
  FiPhone,
  FiAward,
  FiHash,
  FiCalendar,
  FiMapPin,
  FiGlobe,
  FiSave,
  FiTrash2,
  FiX,
  FiAlertTriangle
} from 'react-icons/fi';

import "./Styles/ProfilePage.css";

const EditModal = ({ user, onClose, onSaveSuccess, onDelete }) => {
  const [editableUser, setEditableUser] = useState(user);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    const processedValue = type === 'number' ? (value === '' ? '' : parseInt(value, 10)) : value;
    setEditableUser((prev) => ({ ...prev, [name]: processedValue }));
  };

  const handleSaveChanges = async () => {
    setIsLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const profileId = editableUser.profileId || editableUser.id;
      await api.put(`/api/StudentProfile/${profileId}`, editableUser, { headers });
      onSaveSuccess(user.id);
      onClose();
    } catch (err) {
      setError('Failed to update profile.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Edit Profile</h2>
          <button onClick={onClose} className="modal-close-btn"><FiX /></button>
        </div>
        {error && <p className="modal-error"><FiAlertTriangle /> {error}</p>}
        <div className="modal-body">
          <div className="modal-input-group full-width">
            <label>Full Name</label>
            <input type="text" name="name" value={editableUser.name || ''} onChange={handleInputChange} />
          </div>
          <div className="modal-input-group full-width">
            <label>Profile Image URL</label>
            <input type="text" name="imageP" value={editableUser.imageP || ''} onChange={handleInputChange} />
          </div>
        </div>
        <div className="modal-footer">
          <button onClick={() => onDelete(user.id)} className="modal-btn delete" disabled={isLoading}>
            <FiTrash2 /> Delete
          </button>
          <button onClick={handleSaveChanges} className="modal-btn save" disabled={isLoading}>
            {isLoading ? 'Saving...' : <><FiSave /> Save Changes</>}
          </button>
        </div>
      </div>
    </div>
  );
};

// Inline SVG avatar used as fallback when no profile image is set
const AVATAR_PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150' viewBox='0 0 150 150'%3E%3Crect width='150' height='150' fill='%23e2e8f0'/%3E%3Ccircle cx='75' cy='60' r='30' fill='%2394a3b8'/%3E%3Cellipse cx='75' cy='130' rx='45' ry='30' fill='%2394a3b8'/%3E%3C/svg%3E";

const ProfilePage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const fetchProfile = useCallback(async (userId) => {
    try {
      setLoading(true);
      const response = await api.get(`/api/StudentProfile/account/${userId}`);
      setProfile(response.data);
    } catch (err) {
      console.error('Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const u = JSON.parse(storedUser);
      setUser(u);
      fetchProfile(u.id);
    } else {
      navigate("/login");
    }
  }, [navigate, fetchProfile]);

  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    // logout() redirects to CAS directly — no navigate needed
  };

  if (loading) return <div className="loading-container">Loading...</div>;

  return (
    <div className="profile-page-container">
      <div className="profile-header-bg"></div>
      <div className="profile-wrapper">
        <div className="profile-card-modern">
          <div className="profile-sidebar-modern">
            <div className="avatar-container">
              <img src={profile?.imageP || AVATAR_PLACEHOLDER} alt="Profile" className="profile-avatar-modern" />
              <div className="online-badge"></div>
            </div>
            <h2 className="profile-name-modern">{profile?.name || user?.name}</h2>
            <p className="profile-role-badge">{user?.role || 'Staff'}</p>
            <p className="profile-email-modern">{user?.email}</p>
            
            <div className="profile-actions-modern">
              <button onClick={() => setIsEditModalOpen(true)} className="modern-action-btn primary">
                <FiEdit /> <span>Edit Profile</span>
              </button>
              <button onClick={handleLogout} className="modern-action-btn secondary">
                <FiLogOut /> <span>Log Out</span>
              </button>
            </div>
          </div>

          <div className="profile-content-modern">
            <div className="info-grid-modern">
              <div className="info-card-modern">
                <div className="info-card-header">
                  <div className="info-icon-wrapper">
                    <FiPhone />
                  </div>
                  <div className="info-label-modern">Phone Number</div>
                </div>
                <div className="info-value-modern">{profile?.phoneNumber || 'Not provided'}</div>
              </div>

              <div className="info-card-modern">
                <div className="info-card-header">
                  <div className="info-icon-wrapper location">
                    <FiMapPin />
                  </div>
                  <div className="info-label-modern">Location</div>
                </div>
                <div className="info-value-modern">{profile?.city || 'Not provided'}</div>
              </div>

              <div className="info-card-modern">
                <div className="info-card-header">
                  <div className="info-icon-wrapper calendar">
                    <FiCalendar />
                  </div>
                  <div className="info-label-modern">Joined Date</div>
                </div>
                <div className="info-value-modern">{profile?.joinDate ? new Date(profile.joinDate).toLocaleDateString() : 'N/A'}</div>
              </div>

              <div className="info-card-modern">
                <div className="info-card-header">
                  <div className="info-icon-wrapper id">
                    <FiHash />
                  </div>
                  <div className="info-label-modern">Staff ID</div>
                </div>
                <div className="info-value-modern">#{user?.id || '---'}</div>
              </div>
            </div>

            <div className="stats-preview-modern">
              <div className="stats-box">
                <div className="stats-num">---</div>
                <div className="stats-label">Classes</div>
              </div>
              <div className="stats-box">
                <div className="stats-num">---</div>
                <div className="stats-label">Performance</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {isEditModalOpen && (
        <EditModal 
          user={profile || {}} 
          onClose={() => setIsEditModalOpen(false)} 
          onSaveSuccess={() => fetchProfile(user.id)}
          onDelete={() => {}} 
        />
      )}
    </div>
  );
};

export default ProfilePage;
