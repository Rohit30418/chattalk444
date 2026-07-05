import { io } from 'socket.io-client';

const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

const socket = io(backendUrl, {
  autoConnect: false,
  transports: ["websocket", "polling"],
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 800,
  reconnectionDelayMax: 5000,
  timeout: 20000,
});

export default socket;