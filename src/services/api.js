import axios from 'axios';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { firebaseApp } from './firebase';

const configuredBackendUrl =
  import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export const backendUrl = import.meta.env.DEV
  ? ''
  : configuredBackendUrl;

const api = axios.create({
  baseURL: backendUrl,
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json',
  },
});

let authReadyPromise = null;

const hasCachedSignedInUser = () => {
  if (typeof window === 'undefined') return false;

  try {
    const cached = JSON.parse(localStorage.getItem('userInfo') || 'null');
    return Boolean(cached?.uid);
  } catch {
    return false;
  }
};

const waitForFirebaseUser = async (auth) => {
  if (auth.currentUser) return auth.currentUser;
  if (!hasCachedSignedInUser()) return null;

  if (typeof auth.authStateReady === 'function') {
    try {
      await auth.authStateReady();
      return auth.currentUser;
    } catch {
      // Fall through to the observer-based fallback below.
    }
  }

  if (!authReadyPromise) {
    authReadyPromise = new Promise((resolve) => {
      let settled = false;
      let timer = 0;
      let unsubscribe = () => {};

      const finish = (user) => {
        if (settled) return;
        settled = true;
        if (timer) window.clearTimeout(timer);
        unsubscribe();
        resolve(user || null);
      };

      unsubscribe = onAuthStateChanged(
        auth,
        (user) => finish(user),
        () => finish(auth.currentUser)
      );

      timer = window.setTimeout(() => finish(auth.currentUser), 4000);
    }).finally(() => {
      authReadyPromise = null;
    });
  }

  return authReadyPromise;
};

api.interceptors.request.use(
  async (config) => {
    const auth = getAuth(firebaseApp);
    const firebaseUser = auth.currentUser || await waitForFirebaseUser(auth);

    if (firebaseUser) {
      const idToken = await firebaseUser.getIdToken();
      config.headers.Authorization = `Bearer ${idToken}`;
    }

    if (config.headers['x-user-id']) {
      delete config.headers['x-user-id'];
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      'Request failed';

    return Promise.reject(Object.assign(error, { userMessage: message }));
  }
);

export default api;
