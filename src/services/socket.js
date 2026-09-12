import { io } from 'socket.io-client';

const configuredBackendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
const socketUrl = import.meta.env.DEV ? undefined : configuredBackendUrl;

const socket = io(socketUrl, {
  autoConnect: false,
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 800,
  reconnectionDelayMax: 5000,
  timeout: 20000,
});

export default socket;
