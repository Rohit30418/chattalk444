import { io } from 'socket.io-client';

// Grab your dynamic backend URL from your .env.local file
const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

// Create the single global socket instance
const socket = io(backendUrl, {
  // We keep this false so it doesn't randomly connect before the user logs in.
  // We manually trigger socket.connect() inside your AuthWrapper.
  autoConnect: false, 
});

export default socket;