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
import socket, {
  connectSocketForFirebaseUser,
  disconnectSocket,
} from '../../services/socket';
import Loading from '../common/Loading';
import api, { backendUrl } from '../../services/api';

export const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

const readCachedUser = () => {
  if (typeof window === 'undefined') return null;

  try {
    const cached = JSON.parse(localStorage.getItem('userInfo') || 'null');
    return cached?.uid ? cached : null;
  } catch {
    return null;
  }
};

const persistUser = (value) => {
  if (typeof window === 'undefined') return;

  if (value?.uid) {
    localStorage.setItem('userInfo', JSON.stringify(value));
  } else {
    localStorage.removeItem('userInfo');
  }
};

export const AuthProvider = ({ children }) => {
  // Hydrate the last synced profile immediately. Firebase/backend validation
  // still runs below, but returning users no longer stare at a full-screen
  // loader while their avatar/member decorations are fetched again.
  const [user, setUser] = useState(readCachedUser);
  const [loading, setLoading] = useState(() => !readCachedUser());

  useEffect(() => {
    const auth = getAuth(firebaseApp);

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const cached = readCachedUser();
        const cachedForUser = cached?.uid === firebaseUser.uid ? cached : null;
        const baseUser = {
          uid: firebaseUser.uid,
          displayName: firebaseUser.displayName || cachedForUser?.displayName || '',
          email: firebaseUser.email || cachedForUser?.email || '',
          photoURL: firebaseUser.photoURL || cachedForUser?.photoURL || '',
        };
        const immediateUser = {
          ...(cachedForUser || {}),
          ...baseUser,
          uid: firebaseUser.uid,
          isMember: cachedForUser?.isMember === true,
        };

        // Render from the local snapshot first; refresh it from the API in the
        // background. This also prevents the first paint from falling back to
        // the default member decoration.
        setUser(immediateUser);
        persistUser(immediateUser);
        setLoading(false);
        connectSocketForFirebaseUser(firebaseUser);

        try {
          const { data } = await api.post('/api/users', baseUser);
          const backendUser = data?.user || {};
          const syncedUser = {
            ...immediateUser,
            ...backendUser,
            uid: firebaseUser.uid,
            displayName: backendUser?.displayName || baseUser.displayName,
            email: backendUser?.email || baseUser.email,
            photoURL: backendUser?.photoURL || baseUser.photoURL,
            isMember: backendUser?.isMember === true,
          };

          setUser(syncedUser);
          persistUser(syncedUser);
        } catch (error) {
          // Keep the cached profile on temporary backend/cold-start failures.
          // Firebase still owns authentication, so protected requests remain
          // server-verified even while this visual snapshot is displayed.
          console.error('Failed to sync user profile with backend:', error);
        }
      } else {
        setUser(null);
        persistUser(null);
        disconnectSocket();
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

    if (socket.connected) identify();
    socket.on('connect', identify);

    return () => {
      socket.off('connect', identify);
    };
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid) return undefined;

    const mergeAppearance = (updatedUser = {}) => {
      if (updatedUser?.uid && updatedUser.uid !== user.uid) return;

      setUser((current) => {
        if (!current?.uid || current.uid !== user.uid) return current;

        const merged = {
          ...current,
          ...updatedUser,
          uid: current.uid,
          isMember:
            updatedUser?.isMember === undefined
              ? current.isMember === true
              : updatedUser.isMember === true,
        };

        persistUser(merged);
        return merged;
      });
    };

    const onLocalStyleUpdated = (event) => {
      mergeAppearance(event?.detail?.user || {});
    };

    socket.on('social-member-appearance', mergeAppearance);
    window.addEventListener('vaani-member-style-updated', onLocalStyleUpdated);

    return () => {
      socket.off('social-member-appearance', mergeAppearance);
      window.removeEventListener('vaani-member-style-updated', onLocalStyleUpdated);
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
      persistUser(loggedInUser);

      const firebaseUser = getAuth(firebaseApp).currentUser;
      if (firebaseUser) connectSocketForFirebaseUser(firebaseUser);

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
      persistUser(registeredUser);

      const firebaseUser = getAuth(firebaseApp).currentUser;
      if (firebaseUser) connectSocketForFirebaseUser(firebaseUser);

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
      persistUser(refreshedUser);
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
      persistUser(null);
      disconnectSocket();
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
