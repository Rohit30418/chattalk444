import axios from 'axios';
import { useAuth } from '../components/auth/AppWrapper';

const useAddMembers = () => {
  const { user: userInfo } = useAuth();

  const addMember = async (roomID) => {
    if (!userInfo?.uid) {
      console.warn("Cannot join room: No authenticated user found.");
      return;
    }

    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

      // Hit the Express backend to update the MongoDB document
      await axios.post(`${backendUrl}/api/rooms/${roomID}/join`, {
        uid: userInfo.uid,
        name: userInfo.displayName,
        photo: userInfo.photoURL,
        isVideoEnabled: false,
        isAudioEnabled: false,
      });

      console.log("✅ User joined MongoDB room successfully!");
    } catch (error) {
      console.error("❌ Error adding member to MongoDB:", error.response?.data || error.message);
    }
  };

  return addMember;
};

export default useAddMembers;