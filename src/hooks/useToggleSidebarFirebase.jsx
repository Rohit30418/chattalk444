// utils/updateSidebarFirebase.js
import { doc, updateDoc } from "firebase/firestore";
import { db } from '../services/firebase';

const updateSidebarFirebase = async (roomId, userId, value) => {
  if (!roomId || !userId) return;

  const participantRef = doc(db, "rooms", roomId, "participants", userId);
  try {
    await updateDoc(participantRef, {
      isChatWindowOpen: value,
    });
  } catch (error) {
    console.error("Failed to update isChatWindowOpen:", error);
  }
};

export default updateSidebarFirebase;
