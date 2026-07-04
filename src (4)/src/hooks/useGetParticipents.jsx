import { useEffect, useState } from 'react';
import { db } from '../services/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { useParams } from 'react-router-dom';

const useGetParticipants = () => {
  const { id } = useParams(); // Extract the room ID from the URL
  const [participants, setParticipants] = useState([]);

  useEffect(() => {
    if (!id) return; // Ensure the room ID is valid

    // Firestore collection reference
    const participantsCollection = collection(db, "rooms", id, "participants");

    // Listen for real-time updates
    const unsubscribe = onSnapshot(participantsCollection, (snapshot) => {
      const participantsList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setParticipants(participantsList); // Update the state
    });

    // Cleanup the subscription when the component unmounts
    return () => unsubscribe();
  }, [id]);

  return participants; // Return the list of participants
};

export default useGetParticipants;
