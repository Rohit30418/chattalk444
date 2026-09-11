import { useEffect, useState, useCallback } from 'react';
import socket from '../services/socket';
import api from '../services/api';

const EMPTY_ROOM_TTL_MS = 2 * 60 * 1000;

const getDateValue = (room) => {
  const value = room?.lastActive || room?.createdAt || 0;
  const dateValue = new Date(value).getTime();
  return Number.isFinite(dateValue) ? dateValue : Number(value) || 0;
};

const getParticipantCount = (room) => {
  const value = Number(room?.participantsCount ?? room?.activeCount ?? room?.memberCount ?? 0);
  return Number.isFinite(value) ? Math.max(0, value) : 0;
};

export const isExpiredEmptyRoom = (room, now = Date.now()) => {
  if (!room) return true;
  if (getParticipantCount(room) > 0) return false;

  const lastActive = getDateValue(room);
  if (!lastActive) return false;

  return now - lastActive >= EMPTY_ROOM_TTL_MS;
};

const sortRooms = (roomList) => (
  Array.isArray(roomList)
    ? [...roomList]
        .filter((room) => !isExpiredEmptyRoom(room))
        .sort((a, b) => getDateValue(b) - getDateValue(a))
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

    const expiryTimer = window.setInterval(() => {
      setRooms((current) => sortRooms(current));
    }, 5000);

    socket.on('dashboard-update', handleDashboardUpdate);

    return () => {
      window.clearInterval(expiryTimer);
      socket.off('dashboard-update', handleDashboardUpdate);
      socket.emit('leave-dashboard');
    };
  }, [fetchRooms]);

  return { rooms, loading, error, refetch: fetchRooms };
};
