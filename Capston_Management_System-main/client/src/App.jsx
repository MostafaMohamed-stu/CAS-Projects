import React, { useState, useEffect } from "react";
import Dashboard from "./Components/Dashboard/Dashboard";
import LoadingSpinner from "./Components/LoadingSpinner/LoadingSpinner";
import SecureErrorBoundary from "./Components/SecureErrorBoundary/SecureErrorBoundary";
import { authService } from "./utils/authService";
import { NotificationProvider } from "./contexts/NotificationContext";
import "./App.css";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if handling SSO callback
    if (window.location.pathname.includes('/sso-callback')) {
      const searchParams = new URLSearchParams(window.location.search);
      const token = searchParams.get('token');
      const role = searchParams.get('role');
      const name = searchParams.get('name');
      const email = searchParams.get('email');

      if (token) {
        localStorage.setItem('accessToken', token);
        localStorage.setItem('token', token);
        if (role) localStorage.setItem('userRole', role);
        if (name) localStorage.setItem('userName', name);
        if (email) localStorage.setItem('userEmail', email);

        authService.setAccessToken(token);
        const userObj = authService.getStoredUser();
        setUser(userObj);
        setIsAuthenticated(true);
        setIsLoading(false);
        window.history.replaceState({}, document.title, '/');
        return;
      }
    }

    const checkAuthStatus = async () => {
      try {
        if (authService.isAuthenticated()) {
          const storedUser = authService.getStoredUser();
          if (storedUser) {
            setUser(storedUser);
            setIsAuthenticated(true);
            setIsLoading(false);
            return;
          }
        }

        console.log("No valid access token found, checking session...");
        try {
          await authService.refreshToken();
          if (authService.isAuthenticated()) {
            const storedUser = authService.getStoredUser();
            if (storedUser) {
              setUser(storedUser);
              setIsAuthenticated(true);
            }
          }
        } catch (refreshError) {
          console.log("Token refresh not available");
        }
      } catch (error) {
        console.log("Authentication check failed:", error.message);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  // Redirect unauthenticated users automatically to CAS Login page
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const searchParams = new URLSearchParams(window.location.search);
      const promptParam = searchParams.get('prompt') ? '&prompt=' + searchParams.get('prompt') : '';
      const casUrl = 'http://localhost:5174';
      const callbackUrl = encodeURIComponent(`${window.location.origin}/sso-callback`);
      window.location.href = `${casUrl}/login?redirect=${callbackUrl}&businessEntityId=3${promptParam}`;
    }
  }, [isLoading, isAuthenticated]);

  const handleLogout = () => {
    setIsLoading(true);
    authService.logout();
  };

  if (isLoading || !isAuthenticated) {
    return (
      <NotificationProvider>
        <div className="App" style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: '#f8fafc',
          fontFamily: 'system-ui, sans-serif'
        }}>
          <LoadingSpinner />
          <p style={{ marginTop: '1rem', color: '#64748b', fontWeight: 500 }}>
            {isLoading ? 'Checking authentication...' : 'Redirecting to Central CAS Login...'}
          </p>
        </div>
      </NotificationProvider>
    );
  }

  return (
    <SecureErrorBoundary>
      <NotificationProvider>
        <div className="App">
          <Dashboard onLogout={handleLogout} user={user} />
        </div>
      </NotificationProvider>
    </SecureErrorBoundary>
  );
}

export default App;
