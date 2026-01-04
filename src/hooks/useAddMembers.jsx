import { doc, setDoc, collection, updateDoc, increment, Timestamp } from "firebase/firestore";
import { useSelector } from "react-redux";
import { db } from "../services/firebase";

const useAddMembers = () => {
  const userInfo = useSelector((state) => state.userData);

  const addMember = async (roomID) => {
    try {
      const time = Date.now();

      // 1) Add participant inside subcollection
      const roomRef = collection(db, "rooms", roomID, "participants");
      const userDocRef = doc(roomRef, userInfo.uid);

      await setDoc(userDocRef, {
        name: userInfo.displayName,
        photo: userInfo.photoURL,
        uid: userInfo.uid,
        isChatWindowOpen: false,
        timestampField: time,
        isVideoEnabled: false,
        isAudioEnabled: false,
      });

      // 2) Update room main fields
      const mainRoomRef = doc(db, "rooms", roomID);

      await updateDoc(mainRoomRef, {
        participantsCount: increment(1), // increase by 1
        expiresAt: Timestamp.fromDate(new Date(Date.now() + 10 * 60 * 1000)), // reset timer
      });

      console.log("User added + room updated");
    } catch (error) {
      console.error("Error adding member:", error);
    }
  };

  return addMember;
};

export default useAddMembers;
