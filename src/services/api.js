import axios from 'axios';

export const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: backendUrl,
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  try {
    const storedUser = JSON.parse(localStorage.getItem('userInfo') || 'null');

    if (storedUser?.token) {
      config.headers.Authorization = `Bearer ${storedUser.token}`;
    }

    if (storedUser?.uid) {
      config.headers['x-user-id'] = storedUser.uid;
    }
  } catch {
    // Invalid localStorage should never block API calls.
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.error
      || error.response?.data?.message
      || error.message
      || 'Request failed';

    return Promise.reject(Object.assign(error, { userMessage: message }));
  }
);

export default api;
