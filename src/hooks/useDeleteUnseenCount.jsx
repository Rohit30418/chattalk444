import { db } from '../services/firebase';
import { useParams } from 'react-router-dom';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

const useMarkAsRead = () => {
  const { id } = useParams();

  const markAsRead = async (uId) => {
    if (!id || !uId) return;

    try {
      // Reference to the USER inside the ROOM
      const participantRef = doc(db, 'rooms', id, 'participants', uId);

      // We just update the timestamp. 
      // Any message AFTER this time is considered "Unread".
      await updateDoc(participantRef, {
        lastReadTimestamp: serverTimestamp()
      });

    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  };

  return markAsRead;
};

export default useMarkAsRead;