import { useEffect, useState, useCallback } from 'react';
import socket from '../services/socket';
import api from '../services/api';

const EMPTY_ROOM_TTL_MS = 2 * 60 * 1000;
const ROOM_FETCH_RETRY_DELAYS = [0, 900, 2200];

const wait = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));

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
    let lastError = null;

    setLoading(true);

    for (let attempt = 0; attempt < ROOM_FETCH_RETRY_DELAYS.length; attempt += 1) {
      const delay = ROOM_FETCH_RETRY_DELAYS[attempt];
      if (delay) await wait(delay);

      try {
        const { data } = await api.get('/api/rooms');
        setRooms(sortRooms(data));
        setError(null);
        setLoading(false);
        return data;
      } catch (err) {
        lastError = err;
      }
    }

    // A short backend restart should not replace the entire rooms page with an
    // error screen. Keep the current list and wait for socket/online recovery.
    setError((currentError) => currentError || lastError);
    setLoading(false);
    return null;
  }, []);

  useEffect(() => {
    let disposed = false;

    const safeFetchRooms = () => {
      if (!disposed) fetchRooms();
    };

    safeFetchRooms();

    if (!socket.connected) {
      socket.connect();
    }

    socket.emit('join-dashboard');
    socket.emit('request-dashboard-sync');

    const handleDashboardUpdate = (activeRoomsList) => {
      if (disposed) return;
      setRooms(sortRooms(activeRoomsList));
      setLoading(false);
      setError(null);
    };

    const handleSocketConnect = () => {
      if (disposed) return;
      socket.emit('join-dashboard');
      socket.emit('request-dashboard-sync');
      safeFetchRooms();
    };

    const handleOnline = () => {
      safeFetchRooms();
    };

    const expiryTimer = window.setInterval(() => {
      setRooms((current) => sortRooms(current));
    }, 5000);

    socket.on('dashboard-update', handleDashboardUpdate);
    socket.on('connect', handleSocketConnect);
    window.addEventListener('online', handleOnline);

    return () => {
      disposed = true;
      window.clearInterval(expiryTimer);
      window.removeEventListener('online', handleOnline);
      socket.off('dashboard-update', handleDashboardUpdate);
      socket.off('connect', handleSocketConnect);
      socket.emit('leave-dashboard');
    };
  }, [fetchRooms]);

  // Only surface an error if we have never received any usable room data.
  // Existing rooms stay visible through short backend/network interruptions.
  const visibleError = rooms.length === 0 ? error : null;

  return { rooms, loading, error: visibleError, refetch: fetchRooms };
};
