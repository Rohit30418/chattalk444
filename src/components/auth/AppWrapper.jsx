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

export const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth(firebaseApp);

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          displayName: firebaseUser.displayName,
          email: firebaseUser.email,
          photoURL: firebaseUser.photoURL,
        });

        if (!socket.connected) socket.connect();
        setLoading(false);
      } else {
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

    return () => unsubscribe();
  }, []);

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

  const logout = useCallback(async () => {
    const auth = getAuth(firebaseApp);

    try {
      await auth.signOut();
    } catch (error) {
      console.error('Firebase sign out failed:', error);
    } finally {
      setUser(null);
      localStorage.removeItem('userInfo');

      if (socket.connected) {
        socket.disconnect();
      }
    }

    return true;
  }, []);

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