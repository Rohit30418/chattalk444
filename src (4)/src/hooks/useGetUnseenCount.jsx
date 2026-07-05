import { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { useParams } from 'react-router-dom';
import { 
    collection, 
    query, 
    where, 
    orderBy, 
    onSnapshot, 
    doc,
    limit 
} from 'firebase/firestore';

const useGetUnseenCount = (uId) => {
    const { id } = useParams();
    const [unseenCount, setUnseenCount] = useState(0);
    const [lastRead, setLastRead] = useState(null);

    // 1. Listen to MY last read time
    useEffect(() => {
        if (!id || !uId) return;

        const participantRef = doc(db, "rooms", id, "participants", uId);
        
        const unsub = onSnapshot(participantRef, (doc) => {
            const data = doc.data();
            if (data?.lastReadTimestamp) {
                setLastRead(data.lastReadTimestamp);
            }
        });

        return () => unsub();
    }, [id, uId]);

    // 2. Count messages newer than that time
    useEffect(() => {
        if (!id || !lastRead) return;

        const q = query(
            collection(db, "rooms", id, "groupMessage"),
            where("timestampField", ">", lastRead),
            orderBy("timestampField", "asc"),
            limit(20) // Fetch a few more to allow for filtering
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            // 🔥 FIX: Filter out messages sent by ME
            // We only want to count messages from OTHERS
            const othersMessages = snapshot.docs.filter(
                doc => doc.data().userid !== uId
            );

            // If we hit the limit, show 9+, otherwise show exact count
            const count = othersMessages.length;
            setUnseenCount(count);
        });

        return () => unsubscribe();
    }, [id, lastRead, uId]); // Added uId dependency

    return unseenCount >= 10 ? "9+" : unseenCount;
};

export default useGetUnseenCount;