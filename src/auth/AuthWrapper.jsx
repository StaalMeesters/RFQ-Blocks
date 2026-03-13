import { createContext, useContext, useState, useEffect } from 'react';
import {
  PublicClientApplication,
  EventType,
} from '@azure/msal-browser';
import { MsalProvider, useMsal, useIsAuthenticated } from '@azure/msal-react';
import { msalConfig, loginRequest } from './msalConfig';

const msalInstance = new PublicClientApplication(msalConfig);

msalInstance.initialize().then(() => {
  msalInstance.handleRedirectPromise().then((response) => {
    if (response) {
      msalInstance.setActiveAccount(response.account);
    } else {
      const accounts = msalInstance.getAllAccounts();
      if (accounts.length > 0) {
        msalInstance.setActiveAccount(accounts[0]);
      }
    }
  });
});

const UserContext = createContext(null);

export function useUser() {
  return useContext(UserContext);
}

function LoginScreen({ onLogin }) {
  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#F6F7F9',
      fontFamily: "'Segoe UI', system-ui, sans-serif",
    }}>
      <div style={{
        textAlign: 'center',
        background: '#fff',
        padding: '48px 56px',
        borderRadius: 12,
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        maxWidth: 420,
      }}>
        <div style={{ marginBottom: 24 }}>
          <span style={{ color: '#F94816', fontWeight: 700, fontSize: 28 }}>
            STM
          </span>
          <span style={{ color: '#22293B', fontWeight: 300, fontSize: 18, marginLeft: 4 }}>
            GROUP
          </span>
        </div>
        <h2 style={{
          margin: '0 0 8px',
          fontSize: 18,
          fontWeight: 600,
          color: '#22293B',
        }}>
          RFQ Tekstblok Editor
        </h2>
        <p style={{
          margin: '0 0 32px',
          fontSize: 13,
          color: '#888',
        }}>
          Meld u aan met uw STM-account om door te gaan
        </p>
        <button
          onClick={onLogin}
          style={{
            padding: '12px 32px',
            background: '#22293B',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <svg width="20" height="20" viewBox="0 0 21 21" fill="none">
            <rect x="1" y="1" width="9" height="9" fill="#F25022"/>
            <rect x="11" y="1" width="9" height="9" fill="#7FBA00"/>
            <rect x="1" y="11" width="9" height="9" fill="#00A4EF"/>
            <rect x="11" y="11" width="9" height="9" fill="#FFB900"/>
          </svg>
          Aanmelden met Microsoft
        </button>
      </div>
    </div>
  );
}

function AuthGate({ children }) {
  const { instance, accounts } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (isAuthenticated && accounts.length > 0) {
      const account = accounts[0];
      setUser({
        name: account.name || account.username,
        email: account.username,
        id: account.localAccountId,
      });
    } else {
      setUser(null);
    }
  }, [isAuthenticated, accounts]);

  const handleLogin = async () => {
    try {
      await instance.loginRedirect(loginRequest);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await instance.logoutRedirect();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (!isAuthenticated) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <UserContext.Provider value={{ user, logout: handleLogout }}>
      {children}
    </UserContext.Provider>
  );
}

export default function AuthWrapper({ children }) {
  return (
    <MsalProvider instance={msalInstance}>
      <AuthGate>{children}</AuthGate>
    </MsalProvider>
  );
}
