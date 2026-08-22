import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../Contexts/AuthContext';
import {
    IoCalendarOutline, IoLogOutOutline,
    IoCreateOutline, IoListOutline,
    IoPersonOutline, IoCloseOutline, IoNotificationsOutline
} from 'react-icons/io5';
import { useNotifications } from '../../Contexts/NotificationContext';

import logo from '../../assets/logos.png';

const TeacherSidebar = ({ user, isOpen, toggleSidebar }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { unreadCount } = useNotifications();

    const { logout } = useAuth();

    const handleLogout = async () => {
        await logout();
        // logout() redirects to CAS directly — no navigate needed
    };

    const handleNavigate = (path) => {
        navigate(path);
    };

    const navItems = [
        { path: '/dashboard', label: 'Dashboard', icon: <IoCalendarOutline className="nav-icon" /> },
        { path: '/absence-entry', label: 'Absence Entry', icon: <IoCreateOutline className="nav-icon" /> },
        { path: '/attendance-view', label: 'Absence View', icon: <IoListOutline className="nav-icon" /> },
        { path: '/notifications', label: 'Notifications', icon: <IoNotificationsOutline className="nav-icon" /> }
    ];

    const getFilteredNavItems = () => {
        const userRole = (user?.role || '').toLowerCase().replace(/\s+/g, '');

        if (userRole === 'teacher') {
            return navItems.filter(item => 
                item.path === '/absence-entry' || 
                item.path === '/dashboard' || 
                item.path === '/attendance-view'
            );
        }

        if (userRole === 'board' || userRole === 'student') {
            return navItems.filter(item => 
                item.path === '/dashboard' || 
                item.path === '/attendance-view'
            );
        }

        if (userRole === 'studentaffair') {
            return navItems.filter(item => 
                item.path === '/dashboard' || 
                item.path === '/absence-entry' ||
                item.path === '/attendance-view' ||
                item.path === '/notifications'
            );
        }

        return navItems;
    };

    return (
        <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
            <div className="logo-container">
                <img src={logo} alt="Logo" className="logo" />
                <div className="logo-text">
                    <div className="brand-name">ElSewedy</div>
                    <div className="company-name">Electrometer</div>
                </div>
                <div className="sidebar-close-btn" onClick={toggleSidebar}>
                    <IoCloseOutline />
                </div>
            </div>

            <div className="user-profile">
                <img 
                    src={user?.imageP || "https://ui-avatars.com/api/?name=" + (user?.name || "Ahmed")} 
                    alt="Profile" 
                    className="profile-pic-small" 
                />
                <div className="user-info">
                    <div className="user-name">{user?.name || "Ahmed Elroby"}</div>
                    <div className="user-role">{user?.role || "studentaffair"}</div>
                </div>
            </div>

            <nav className="nav-menu">
                <ul className="nav-submenu">
                    {getFilteredNavItems().map(item => (
                        <li
                            key={item.label}
                            onClick={() => handleNavigate(item.path)}
                            className={location.pathname === item.path ? 'active' : ''}
                        >
                            <div className="nav-item-content">
                                {item.icon} {item.label}
                            </div>
                            {item.path === '/notifications' && unreadCount > 0 && (
                                <span className="nav-unread-badge">{unreadCount}</span>
                            )}
                        </li>
                    ))}
                </ul>
            </nav>

            <button
                type="button"
                className="logout-btn"
                onClick={handleLogout}
                aria-label="Log out"
            >
                <IoLogOutOutline className="nav-icon" /> Logout
            </button>
        </aside>
    );
};

export default TeacherSidebar;
