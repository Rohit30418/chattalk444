import { io } from 'socket.io-client';

const configuredBackendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
const socketUrl = import.meta.env.DEV ? undefined : configuredBackendUrl;

let firebaseUserForSocket = null;

const socket = io(socketUrl, {
  autoConnect: false,
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 800,
  reconnectionDelayMax: 5000,
  timeout: 20000,
  auth: (done) => {
    if (!firebaseUserForSocket) {
      done({ token: '' });
      return;
    }

    firebaseUserForSocket
      .getIdToken()
      .then((token) => done({ token }))
      .catch((error) => {
        console.error('Could not get Firebase token for socket:', error);
        done({ token: '' });
      });
  },
});

export const connectSocketForFirebaseUser = (firebaseUser) => {
  firebaseUserForSocket = firebaseUser || null;

  if (!firebaseUserForSocket) {
    if (socket.connected) socket.disconnect();
    return;
  }

  // Reconnect through a fresh authenticated handshake if the Firebase account
  // changes. Future Socket.IO reconnects reuse the auth callback above, which
  // asks Firebase for a current ID token each time.
  if (socket.connected) socket.disconnect();
  socket.connect();
};

export const disconnectSocket = () => {
  firebaseUserForSocket = null;
  if (socket.connected) socket.disconnect();
};

export default socket;
