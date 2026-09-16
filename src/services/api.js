import axios from 'axios';
import { getAuth } from 'firebase/auth';
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

api.interceptors.request.use(
  async (config) => {
    const auth = getAuth(firebaseApp);
    const firebaseUser = auth.currentUser;

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
