import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import socket from '../services/socket';
import api from '../services/api';

const getRoomId = (room) => (
  room?._id
  || room?.id
  || room?.roomId
  || room?.data?._id
  || room?.data?.id
  || room?.room?._id
  || room?.room?.id
);

const normalizeCreatedRoom = (responseData) => (
  responseData?.room
  || responseData?.data
  || responseData
);

const useAddRoom = () => {
  const navigate = useNavigate();

  const addRoom = useCallback(async (roomData, options = {}) => {
    const { navigateToRoom = true } = options;

    if (!roomData || typeof roomData !== 'object') {
      throw new Error('Room data is required.');
    }

    const payload = {
      ...roomData,
      Title: roomData.Title || roomData.title || '',
      Language: roomData.Language || roomData.language || '',
      Level: roomData.Level || roomData.level || '',
      MaximumPeople: Number(
        roomData.MaximumPeople
        ?? roomData.maximumPeople
        ?? roomData.maxPeople
        ?? roomData.capacity
        ?? 5
      ),
      createdAt: roomData.createdAt || Date.now(),
    };

    const response = await api.post('/api/rooms', payload);

    const createdRoom = normalizeCreatedRoom(response?.data);
    const roomId = getRoomId(createdRoom);

    socket.emit('request-dashboard-sync');

    if (createdRoom) {
      socket.emit('room-created', createdRoom);
    }

    if (navigateToRoom && roomId) {
      navigate(`/room/${roomId}`);
    }

    return createdRoom;
  }, [navigate]);

  return addRoom;
};

export default useAddRoom;