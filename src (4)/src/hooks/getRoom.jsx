import { useEffect, useState, useCallback } from 'react';
import socket from '../services/socket';
import api from '../services/api';

const getDateValue = (room) => {
  const value = room?.lastActive || room?.createdAt || 0;
  const dateValue = new Date(value).getTime();
  return Number.isFinite(dateValue) ? dateValue : Number(value) || 0;
};

const sortRooms = (roomList) => (
  Array.isArray(roomList)
    ? [...roomList].sort((a, b) => getDateValue(b) - getDateValue(a))
    : []
);

export const getRoomData = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRooms = useCallback(async () => {
    try {
      const { data } = await api.get('/api/rooms');
      setRooms(sortRooms(data));
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRooms();

    if (!socket.connected) {
      socket.connect();
    }

    socket.emit('join-dashboard');
    socket.emit('request-dashboard-sync');

    const handleDashboardUpdate = (activeRoomsList) => {
      setRooms(sortRooms(activeRoomsList));
      setLoading(false);
      setError(null);
    };

    socket.on('dashboard-update', handleDashboardUpdate);

    return () => {
      socket.off('dashboard-update', handleDashboardUpdate);
      socket.emit('leave-dashboard');
    };
  }, [fetchRooms]);

  return { rooms, loading, error, refetch: fetchRooms };
};
