import { getAuth } from 'firebase/auth';
import api from '../services/api';
import { firebaseApp } from '../services/firebase';

const getUserData = async (uid) => {
  if (!uid) return null;

  try {
    const auth = getAuth(firebaseApp);
    const currentUid = auth.currentUser?.uid || '';

    // Private full profile data is only available to the signed-in owner.
    if (currentUid && currentUid === uid) {
      const response = await api.get(`/api/users/${encodeURIComponent(uid)}`);
      return response.data;
    }

    // Other users must be loaded through the public social-profile endpoint.
    const response = await api.get(`/api/social/profile/${encodeURIComponent(uid)}`);
    return response.data?.user || null;
  } catch (error) {
    if (error.response?.status === 404) {
      return null;
    }

    throw error;
  }
};

export default getUserData;
