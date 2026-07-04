import api from '../services/api';
import { useAuth } from '../components/auth/AppWrapper';

const useAddMembers = () => {
  const { user: userInfo } = useAuth();

  const addMember = async (roomID) => {
    if (!roomID) {
      throw new Error('Room id is missing.');
    }

    if (!userInfo?.uid) {
      throw new Error('Please sign in before joining a room.');
    }

    const payload = {
      uid: userInfo.uid,
      name: userInfo.displayName || userInfo.email?.split('@')[0] || 'User',
      photo: userInfo.photoURL || '',
      isVideoEnabled: false,
      isAudioEnabled: false,
    };

    const { data } = await api.post(`/api/rooms/${roomID}/join`, payload);
    return data;
  };

  return addMember;
};

export default useAddMembers;
