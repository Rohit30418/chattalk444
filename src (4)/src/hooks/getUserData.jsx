import api from '../services/api';

const getUserData = async (uid) => {
  if (!uid) return null;

  try {
    const response = await api.get(`/api/users/${uid}`);
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      return null;
    }

    throw error;
  }
};

export default getUserData;
