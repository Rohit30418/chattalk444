import { useState, useEffect, useRef } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  onSnapshot, 
  startAfter, 
  getDocs 
} from 'firebase/firestore';
import { db } from '../services/firebase';

const PAGE_SIZE = 20;

const useChatPagination = (roomId) => {
  const [messages, setMessages] = useState([]);
  const [lastVisible, setLastVisible] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  
  const unsubscribeRef = useRef(null);

  useEffect(() => {
    if (!roomId) return;
    
    setLoading(true);

    // 👇 FIXED: Changed 'messages' to 'groupMessage' to match your writer hook
    const q = query(
      collection(db, 'rooms', roomId, 'groupMessage'),
      orderBy('timestampField', 'desc'),
      limit(PAGE_SIZE)
    );

    unsubscribeRef.current = onSnapshot(q, { includeMetadataChanges: true }, (snapshot) => {
      const newMsgs = snapshot.docs.map(doc => {
        const data = doc.data();
        // Fallback for local pending writes (latency compensation)
        if (!data.timestampField && snapshot.metadata.hasPendingWrites) {
            data.timestampField = { seconds: Date.now() / 1000 };
        }
        return {
            id: doc.id,
            data: data
        };
      });

      if (snapshot.docs.length > 0) {
        setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
      }

      setMessages(newMsgs.reverse());
      setLoading(false);
    });

    return () => {
      if (unsubscribeRef.current) unsubscribeRef.current();
    };
  }, [roomId]);

  const loadMore = async () => {
    if (!lastVisible || !hasMore || loading) return;

    setLoading(true);
    
    // 👇 FIXED: Changed 'messages' to 'groupMessage' here too
    const q = query(
      collection(db, 'rooms', roomId, 'groupMessage'),
      orderBy('timestampField', 'desc'),
      startAfter(lastVisible),
      limit(PAGE_SIZE)
    );

    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const olderMsgs = snapshot.docs.map(doc => ({
        id: doc.id,
        data: doc.data()
      }));

      setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
      setMessages(prev => [...olderMsgs.reverse(), ...prev]);
    } else {
      setHasMore(false);
    }
    
    setLoading(false);
  };

  return { messages, loading, loadMore, hasMore };
};

export default useChatPagination;