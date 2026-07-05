import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useContext,
} from 'react';
import axios from 'axios';
import { getAuth, onAuthStateChanged } from 'firebase/auth'; 
import { firebaseApp } from '../../services/firebase';
import socket from '../../services/socket';
import Loading from '../common/Loading';
import { backendUrl } from '../../services/api';

// 1. Create the Auth Context Channel
export const AuthContext = createContext();

// 2. Custom Hook for clean, simple context consumption across your app
export const useAuth = () => useContext(AuthContext);

// 3. Unified AuthProvider Logic
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔄 PERSISTENCE ENGINE: Handles BOTH Firebase (Google) and localStorage (JWT) on page refresh
  useEffect(() => {
    const auth = getAuth(firebaseApp);

    // Firebase listener automatically detects Google users on page load/refresh
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // 1. Recover Google User
        setUser({
          uid: firebaseUser.uid,
          displayName: firebaseUser.displayName,
          email: firebaseUser.email,
          photoURL: firebaseUser.photoURL,
        });
        
        // Ensure real-time socket layer is connected
        if (!socket.connected) socket.connect();
        
        setLoading(false);
      } else {
        // 2. No Google User? Check localStorage for Custom JWT Email/Password User
        try {
          const storedUser = localStorage.getItem('userInfo');
          if (storedUser) {
            setUser(JSON.parse(storedUser));
            if (!socket.connected) socket.connect();
          }
        } catch (error) {
          console.error('Failed to restore auth state from localStorage:', error);
          localStorage.removeItem('userInfo');
        } finally {
          setLoading(false);
        }
      }
    });

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, []);

  // 🔐 LOGIN ACTION (Sets local state, browser storage, and opens WebSocket)
  const login = useCallback(async (email, password) => {
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/auth/login`,
        { email, password }
      );

      setUser(data);
      localStorage.setItem('userInfo', JSON.stringify(data));

      if (!socket.connected) {
        socket.connect();
      }

      return true;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || 'Login failed'
      );
    }
  }, []);

  // 📝 REGISTER ACTION
  const register = useCallback(async (displayName, email, password) => {
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/auth/register`,
        { displayName, email, password }
      );

      setUser(data);
      localStorage.setItem('userInfo', JSON.stringify(data));

      if (!socket.connected) {
        socket.connect();
      }

      return true;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || 'Registration failed'
      );
    }
  }, []);

  // 🚪 LOGOUT ACTION (Clears Firebase, clears tokens, and cleanly severs socket)
  const logout = useCallback(() => {
    const auth = getAuth(firebaseApp);
    
    auth.signOut().then(() => {
      setUser(null);
      localStorage.removeItem('userInfo');

      if (socket.connected) {
        socket.disconnect();
      }
    });
  }, []);

  // 🚀 Performance Optimization: Memoize values to prevent downstream component re-renders
  const contextValue = useMemo(
    () => ({
      user,
      login,
      register,
      logout,
      loading,
    }),
    [user, login, register, logout, loading]
  );

  // 🛡️ GATEKEEPER BLOCKER: Prevents the App UI from loading until the persistence check is finished
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};