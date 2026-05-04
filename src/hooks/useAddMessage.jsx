import { collection, addDoc } from "firebase/firestore";
import { db } from '../services/firebase';
import { useParams } from 'react-router';

const useAddMessage = () => {
    const { id } = useParams();

    const addMessage = async (messageData) => {
        try {
            const groupMessageRef = collection(db, `rooms`, id, 'groupMessage');
            
            // 1 Write Operation
            const docRef = await addDoc(groupMessageRef, messageData);
            
            // Return the original data + the new document ID (0 Read Operations!)
            return {
                id: docRef.id,
                ...messageData
            };
            
        } catch (error) {
            console.error("Error adding message:", error.message);
            return null;
        }
    };

    return addMessage;
};

export default useAddMessage;