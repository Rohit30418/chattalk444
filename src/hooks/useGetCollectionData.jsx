import { useState, useEffect } from "react";
import { collection, onSnapshot, query ,orderBy } from "firebase/firestore";
import { db } from "../services/firebase";

const useGetCollectionData = (subcollection, roomId, message, maincollection) => {
  const [collectionData, setCollectionData] = useState([]);
  const [loading,setLoading]=useState(true)

  useEffect(() => {
    let unsubscribe = () => {}; // Initialize unsubscribe function

    if (roomId && subcollection) {
      const subCollectionRef = collection(db, `${maincollection}/${roomId}`, subcollection);
      const orderedQuery = query(subCollectionRef, orderBy("timestampField", "asc"));
      // Subscribe to real-time updates
      unsubscribe = onSnapshot(orderedQuery, (querySnapshot) => {
        const subcollectionData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          data: doc.data(),
        }));
        setCollectionData(subcollectionData);
        setLoading(false)
      });
    }

    return () => {
      // Unsubscribe from real-time updates when component unmounts
      unsubscribe();
    };
  }, [subcollection, roomId]);

  return {collectionData,loading};
};

export default useGetCollectionData;
