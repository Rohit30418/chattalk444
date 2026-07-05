import { useState, useEffect } from "react";
import { getFirestore, doc, getDocs, collection } from "firebase/firestore";

const db = getFirestore();

function useUserCollection(userId) {
  const [collectionsData, setCollectionsData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) return; // Avoid fetching if no userId

    const fetchUserCollections = async () => {
      setLoading(true);
      setError(null);

      try {
        // List of subcollections to fetch (you can change this dynamically)
        const subcollections = ["following", "followers", "friends"]; // Example subcollection names
        
        const fetchPromises = subcollections.map(async (colName) => {
          const subcollectionRef = collection(db, `users/${userId}/${colName}`);
          const querySnapshot = await getDocs(subcollectionRef);
          return { [colName]: querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) };
        });

        const results = await Promise.all(fetchPromises);
        const allData = Object.assign({}, ...results);

        setCollectionsData(allData);
      } catch (err) {
        console.error("Error fetching user collections:", err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserCollections();
  }, [userId]);

  return { collectionsData, loading, error };
}

export default useUserCollection;
