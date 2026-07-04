/**
 * hooks/useAddMessage.js — VC Room Optimized (Fire & Forget)
 */
import socket from '../services/socket';
import { useParams } from 'react-router-dom';

const useAddMessage = () => {
    const { id: routeRoomId } = useParams();

    const addMessage = async (messageData) => {
        try {
            // 1. Fail-fast Network Check
            if (!socket.connected) {
                console.warn("[Chat] Socket disconnected. Message may not send.");
            }

            // 2. Preserve original ID for perfect deduplication on the frontend
            const uniqueId = messageData.id || messageData._id || (typeof crypto !== 'undefined' ? crypto.randomUUID() : Date.now().toString());
            
            // 3. Format payload
            const payload = { 
                ...messageData, 
                id: uniqueId, 
                _id: uniqueId,
                roomId: messageData.roomId || routeRoomId,
                timestampField: messageData.timestampField || { seconds: Math.floor(Date.now() / 1000) }
            };

            // 4. Instant Broadcast (No ACKs, No Timeouts, Protects WebRTC bandwidth)
            socket.emit('send-message', payload);

            return payload;
            
        } catch (error) {
            console.error("Error dispatching message:", error.message);
            return null;
        }
    };

    return addMessage;
};

export default useAddMessage;