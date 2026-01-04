import { collection, addDoc } from "firebase/firestore";
import { db } from "../services/firebase";
import { Timestamp } from "firebase/firestore";

const useAddRoom = () => {
  const addRoom = async (roomData) => {
    try {
      const roomsRef = collection(db, "rooms");

      const docRef = await addDoc(roomsRef, {...roomData,
      participantsCount: 0,
      expiresAt: Timestamp.fromDate(new Date(Date.now() + 10 * 60 * 1000)),
      joinedAt: Date.now(),
       lastActive: Date.now(),

      });
      console.log("Room added successfully with ID:", docRef.id);
    } catch (error) {
      console.error(error);
    }
  };

  return addRoom;
};

export default useAddRoom;
