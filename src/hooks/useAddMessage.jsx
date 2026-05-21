import socket from '../services/socket';
import { useParams } from 'react-router-dom';

const useAddMessage = () => {
    const { id: roomId } = useParams();

    const addMessage = async (messageData) => {
        try {
            // 1. Give it a temporary ID so React can render it instantly
            const tempId = Date.now().toString();
            
            // 2. Format it safely for the MongoDB/Node.js backend
            const payload = { 
                ...messageData, 
                id: tempId, 
                roomId,
                // Format the timestamp so your Chat UI doesn't break!
                timestampField: { seconds: Math.floor(Date.now() / 1000) }
            };

            // 3. ⚡ INSTANT BROADCAST (0 Read/Write operations on frontend!)
            socket.emit('send-message', payload);

            return payload;
            
        } catch (error) {
            console.error("Error sending message via Socket:", error.message);
            return null;
        }
    };

    return addMessage;
};

export default useAddMessage;