import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import socket from "../services/socket"

const useAddRoom = () => {
  const navigate = useNavigate();
  const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

  const addRoom = async (roomData) => {
    try {
      // 1. Send data to your Node.js/MongoDB backend
      const response = await axios.post(`${backendUrl}/api/rooms`, {
        ...roomData,
        participantsCount: 0,
        joinedAt: Date.now(),
        lastActive: Date.now(),
      });

      const newRoom = response.data; // The backend should return the saved room (with its new _id)
      console.log("Room added successfully to MongoDB with ID:", newRoom._id);

      // 2. Tell the WebSockets to update the dashboard for everyone else online
      if (socket.connected) {
        socket.emit('dashboard-update'); 
      }

      // 3. Navigate the host directly into their new room
      navigate(`/Room/${newRoom._id}`);
      
    } catch (error) {
      console.error("Failed to save room to MongoDB:", error.response?.data || error.message);
      throw error; // Let the form know if it failed
    }
  };

  return addRoom;
};

export default useAddRoom;