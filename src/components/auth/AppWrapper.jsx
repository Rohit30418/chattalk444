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
import api, { backendUrl } from '../../services/api';

export const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth(firebaseApp);

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const baseUser = {
          uid: firebaseUser.uid,
          displayName: firebaseUser.displayName,
          email: firebaseUser.email,
          photoURL: firebaseUser.photoURL,
        };

        try {
          const { data } = await api.post('/api/users', baseUser);
          const backendUser = data?.user || {};
          const syncedUser = {
            ...baseUser,
            ...backendUser,
            uid: firebaseUser.uid,
            isMember: backendUser?.isMember === true,
          };

          setUser(syncedUser);
          localStorage.setItem('userInfo', JSON.stringify(syncedUser));
        } catch (error) {
          console.error('Failed to sync user profile with backend:', error);
          const fallbackUser = {
            ...baseUser,
            isMember: false,
          };
          setUser(fallbackUser);
          localStorage.setItem('userInfo', JSON.stringify(fallbackUser));
        }

        if (!socket.connected) socket.connect();
        setLoading(false);
      } else {
        setUser(null);
        localStorage.removeItem('userInfo');

        if (socket.connected) {
          socket.disconnect();
        }

        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user?.uid) return undefined;

    const identify = () => {
      socket.emit('social-identify', { uid: user.uid });
    };

    if (!socket.connected) socket.connect();
    if (socket.connected) identify();
    socket.on('connect', identify);

    return () => {
      socket.off('connect', identify);
    };
  }, [user?.uid]);

  const login = useCallback(async (email, password) => {
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/auth/login`,
        { email, password }
      );

      const loggedInUser = {
        ...data,
        isMember: data?.isMember === true,
      };

      setUser(loggedInUser);
      localStorage.setItem('userInfo', JSON.stringify(loggedInUser));

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

      const registeredUser = {
        ...data,
        isMember: data?.isMember === true,
      };

      setUser(registeredUser);
      localStorage.setItem('userInfo', JSON.stringify(registeredUser));

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

  const refreshUser = useCallback(async () => {
    if (!user?.uid) return null;

    try {
      const { data } = await api.get(`/api/users/${encodeURIComponent(user.uid)}`);
      const refreshedUser = {
        ...user,
        ...data,
        uid: user.uid,
        isMember: data?.isMember === true,
      };

      setUser(refreshedUser);
      localStorage.setItem('userInfo', JSON.stringify(refreshedUser));
      return refreshedUser;
    } catch (error) {
      console.error('Failed to refresh user profile:', error);
      return null;
    }
  }, [user]);

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
      refreshUser,
      logout,
      loading,
    }),
    [user, login, register, refreshUser, logout, loading]
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
