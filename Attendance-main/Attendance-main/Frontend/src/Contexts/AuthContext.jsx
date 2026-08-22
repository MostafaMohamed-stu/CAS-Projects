import { createContext, useContext, useState, useEffect } from 'react';
import api, { casLogout } from '../Services/api';

const CAS_LOGIN_URL = import.meta.env.VITE_CAS_LOGIN_URL || 'http://localhost:5174';
const BUSINESS_ENTITY_ID = 2;

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = async () => {
    const token = localStorage.getItem('token');

    // 1. Revoke token server-side in CAS
    await casLogout(token);

    // 2. Remove push tokens from Attendance backend
    if (user?.id) {
      try {
        await api.post(`/api/Push/logout/${user.id}`);
      } catch (err) {
        console.error('[Auth] Failed to logout push tokens:', err);
      }
    }

    setUser(null);

    // 3. Wipe everything — Attendance + CAS keys
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('cas_sso_token');
    localStorage.removeItem('cas_jwt_token');
    localStorage.removeItem('cas_user_info');
    sessionStorage.removeItem('cas_redirect_url');
    sessionStorage.removeItem('cas_requested_entity');
    sessionStorage.removeItem('cas_business_entity_id');
    sessionStorage.removeItem('cas_is_prompt_login');

    // 4. Redirect directly to CAS with prompt=login — no flags, no intermediate page.
    //    This forces CAS to clear its own SSO tokens and show the login form.
    const callbackUrl = `${window.location.origin}/sso-callback`;
    const casUrl = new URL(CAS_LOGIN_URL);
    casUrl.searchParams.set('redirect', callbackUrl);
    casUrl.searchParams.set('businessEntity', 'Attendance');
    casUrl.searchParams.set('businessEntityId', String(BUSINESS_ENTITY_ID));
    casUrl.searchParams.set('prompt', 'login');

    window.location.href = casUrl.toString();
  };

  const value = { user, login, logout };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
