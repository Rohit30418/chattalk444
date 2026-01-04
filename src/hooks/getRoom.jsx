import React, { useState, useEffect } from 'react';
import { collection, getDocs, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../services/firebase';


export const getRoomData = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const roomsRef = collection(db, 'rooms');
  
        // Initially fetch the data
        const orderedQuery = query(roomsRef, orderBy('timestampField', 'desc'));
        const initialSnapshot = await getDocs(orderedQuery);
        const initialData = initialSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setRooms(initialData);
        setLoading(false);
  
        // Subscribe to real-time updates
        const unsubscribe = onSnapshot(roomsRef, (snapshot) => {
          const updatedData = snapshot?.docs?.map(doc => ({ id: doc.id, ...doc.data() }));
          
          // Re-order the updated data
          const orderedData = updatedData?.sort((a, b) => b.timestampField.toMillis() - a.timestampField.toMillis());
          
          setRooms(orderedData);
        });
  
        // Return cleanup function to unsubscribe when component unmounts
        return () => unsubscribe();
      } catch (error) {
        setError(error);
        setLoading(false);
      }
    };
  
    fetchData();
  }, []);
  


  return { rooms, loading, error };
};
