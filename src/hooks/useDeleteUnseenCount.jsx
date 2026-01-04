import { db } from '../services/firebase';
import { useParams } from 'react-router';
import { collection, getDocs, deleteDoc } from 'firebase/firestore';

const useDeleteUnseenCount = () => {
  const { id } = useParams();

  const deletemsg = async (uId) => {
    try {
      const roomRef = collection(db, "rooms", id, "participants", uId, "unseenmsg");
      const querySnapshot = await getDocs(roomRef);

      for (const docSnap of querySnapshot.docs) {
        await deleteDoc(docSnap.ref);
      }

    } catch (error) {
      console.error("Error deleting unseen messages:", error);
    }
  };

  return deletemsg;
};

export default useDeleteUnseenCount;
