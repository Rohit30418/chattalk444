import { useState, useEffect } from 'react';
import socket from '../services/socket'; // Adjust path if your socket instance is somewhere else!

export const getRoomData = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // 1. Ensure the socket is awake and connected
    if (!socket.connected) {
      socket.connect();
    }

    // 2. Tell the Node.js server we are on the homepage
    socket.emit('join-dashboard');

    // 3. Listen for the initial load AND all real-time updates!
    const handleDashboardUpdate = (activeRoomsList) => {
      try {
        // Sort the rooms by newest first (highest timestamp to lowest)
        const sortedRooms = activeRoomsList.sort((a, b) => b.createdAt - a.createdAt);
        
        setRooms(sortedRooms);
        setLoading(false);
      } catch (err) {
        console.error("Failed to parse room data:", err);
        setError(err);
        setLoading(false);
      }
    };

    // Attach the listener
    socket.on('dashboard-update', handleDashboardUpdate);

    // 4. Cleanup function: Stop listening if the user navigates away from the homepage
    return () => {
      socket.off('dashboard-update', handleDashboardUpdate);
    };
  }, []);

  return { rooms, loading, error };
};