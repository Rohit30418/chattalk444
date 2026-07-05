import React, { useEffect } from "react";
import { collection, query, getDocs, deleteDoc } from "firebase/firestore";
import { db } from "../services/firebase";

const DeleteRoom = () => {

  async function cleanStaleRooms() {
    const roomsRef = collection(db, "rooms");
    const snap = await getDocs(query(roomsRef));

    snap.forEach(async (docSnap) => {
      const data = docSnap.data();

      const participants = data.participants || {};

      // Safe handling for lastActive
      let lastActiveMs = 0;

      if (data.lastActive && typeof data.lastActive.toDate === "function") {
        lastActiveMs = data.lastActive.toDate().getTime();
      } else if (typeof data.lastActive === "number") {
        lastActiveMs = data.lastActive; // maybe user stored raw number
      } else {
        lastActiveMs = 0; // no lastActive → treat as stale
      }

      // Check stale & empty
      if (
        Object.keys(participants).length === 0 &&
        Date.now() - lastActiveMs > 5 * 60 * 1000 // 5 minutes
      ) {
        console.log("Deleting stale room:", docSnap.id);
        await deleteDoc(docSnap.ref);
      }
    });
  }

  useEffect(() => {
    cleanStaleRooms();
  }, []);

  return null;
};

export default DeleteRoom;
