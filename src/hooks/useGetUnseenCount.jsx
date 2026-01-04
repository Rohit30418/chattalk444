import { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { useParams } from 'react-router-dom'; // Changed to react-router-dom for web
import { collection, onSnapshot } from 'firebase/firestore';

const useGetUnseenCount = (uId) => {
    const { id } = useParams();
    const [unseenCount, setUnseenCount] = useState(0);

    useEffect(() => {
        if (!id || !uId) return;

        const roomRef = collection(db, "rooms", id, "participants", uId, "unseenmsg");

        // onSnapshot returns the unsubscribe function directly
        const unsubscribe = onSnapshot(roomRef, (querySnapshot) => {
            setUnseenCount(querySnapshot.size);
        });

        // Cleanup: Firebase triggers this when the component unmounts or id/uId changes
        return () => unsubscribe();
    }, [id, uId]);

    return unseenCount;
};

export default useGetUnseenCount;