# Vaani

Vaani is a frontend application for real-time language exchange and video communication. It combines peer-to-peer WebRTC rooms, live collaboration features, Firebase-backed client services, Redux state management, and an interactive 3D AI experience.

> This repository contains the **frontend only**. The Node.js/Express/Socket.IO backend is maintained separately and is consumed through the `VITE_BACKEND_URL` environment variable.

## Live Demo

https://chattalk444.vercel.app

## Preview

> **Screenshot placeholder — Home / active rooms experience**

> **Screenshot placeholder — Pre-join green room**

> **Screenshot placeholder — Live video room**

> **Screenshot placeholder — 3D AI tutor**

## Product Overview

Vaani provides two core communication experiences:

### Real-Time Rooms
- Create and join language-exchange rooms
- Pre-join camera and microphone setup
- Peer-to-peer audio/video communication
- Screen sharing
- Live chat and emoji reactions
- Raise-hand interactions
- Participant presence and room controls
- Connection-quality feedback
- Speaking indicators
- Live subtitle support where browser speech recognition is available

### 3D AI Experience
- Interactive 3D avatar rendered with React Three Fiber and Three.js
- Character animation and audio-reactive/lip-sync behavior
- AI-assisted conversation experience

## Engineering Highlights

### WebRTC Mesh Communication

PeerJS is used as the WebRTC abstraction for peer-to-peer media connections. Room participants establish direct media connections in a mesh topology, while the application coordinates room state and peer metadata through the external backend/socket layer.

### Media Device Management

The room flow handles browser media APIs for:

- camera and microphone permissions
- audio/video device enumeration
- device switching
- track enable/disable state
- media cleanup on leave/unmount
- pre-join media preferences

### Screen Sharing

Screen capture streams are managed separately from the primary camera stream so participants can share their screen without losing their existing media state.

### Speaking Detection

The Web Audio API is used to analyze incoming audio streams and derive speaking-state indicators. Throttling and hold timings reduce excessive UI state updates.

### Connection Quality Monitoring

WebRTC `RTCPeerConnection.getStats()` data is sampled to estimate call quality using packet loss and jitter, allowing the UI to expose basic connection-quality feedback.

### Real-Time Interaction State

Peer data channels and the socket layer support room interactions such as reactions, raised hands, participant updates, subtitles, and other real-time events.

### State Management

Redux Toolkit is used for shared client-side application state, while media streams and mutable peer connection objects are intentionally stored in refs to avoid unnecessary React renders.

### Performance Considerations

- `useRef` for media streams, PeerJS instances, connections, timers, and mutable real-time objects
- `useCallback`/`useMemo` for expensive or frequently reused handlers and derived state
- throttled speaking-state updates
- explicit media/connection cleanup
- virtualized UI support through React Virtuoso
- Vite production bundling

## Tech Stack

| Area | Technology |
| --- | --- |
| Frontend | React 18 |
| Build Tool | Vite |
| Styling | Tailwind CSS |
| Routing | React Router |
| State Management | Redux Toolkit, React Redux |
| Real-Time Media | WebRTC, PeerJS |
| Real-Time Events | Socket.IO Client |
| 3D | React Three Fiber, Drei, Three.js |
| Backend Services Used by Frontend | Firebase Firestore, Firebase Storage |
| Motion / UI | Framer Motion, Lottie, Lucide React |
| Rich Content | React Markdown, remark-gfm, rehype-sanitize |
| Large Lists | React Virtuoso |

## Frontend Architecture

```text
src/
├── Home/                  # Landing page and room discovery
├── components/            # Shared and feature UI
├── features/              # Focused feature modules
├── hooks/                 # Shared React hooks
├── redux/                 # Redux store and slices
├── room/
│   ├── components/        # Room UI components
│   ├── hooks/             # Room/media controllers
│   ├── utils/             # Media and room utilities
│   ├── Room.jsx
│   ├── RoomMain.jsx
│   └── ScreenBeforeJoin.jsx
├── services/
│   ├── api.js             # REST client helpers
│   ├── firebase.js        # Firebase client initialization
│   └── socket.js          # Socket.IO client configuration
├── App.jsx
└── main.jsx
```

## Real-Time Room Flow

```text
User opens room
      ↓
Pre-join screen
      ↓
Camera / microphone permissions
      ↓
Join request to external backend
      ↓
Socket room coordination
      ↓
PeerJS peer discovery
      ↓
WebRTC media connections established
      ↓
Room UI manages media + participant interactions
```

## Backend Integration

The backend is intentionally not included in this repository.

The frontend communicates with the separate backend for room and real-time coordination through:

- REST APIs
- Socket.IO
- `VITE_BACKEND_URL`

PeerJS/WebRTC handles the actual peer-to-peer media transport between room participants.

## Environment Variables

Copy `.env.example` to `.env` in the project root and provide the required values.

```env
VITE_BACKEND_URL=http://localhost:5000
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_DATABASE_URL=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
VITE_AI_ACCESS_CODE=
```

Vite exposes client-side environment variables only when they use the `VITE_` prefix.

## Local Setup

```bash
git clone https://github.com/Rohit30418/chattalk444.git
cd chattalk444
npm install
cp .env.example .env
npm run dev
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

The external backend must also be running and reachable through `VITE_BACKEND_URL` for room/socket functionality.

## Available Scripts

```bash
npm run dev      # Start Vite development server
npm run build    # Create production build
npm run lint     # Run ESLint
npm run preview  # Preview production build
```

## Firebase Hosting

The repository also contains Firebase Hosting configuration using Vite's `dist` directory. The current public demo is configured through the repository homepage URL.

## Scalability Note

The current peer-to-peer mesh architecture is well suited to small real-time rooms. For significantly larger conferencing rooms, an SFU-based architecture such as LiveKit or mediasoup would reduce peer bandwidth requirements.

## Author

**Rohit Pant**  
Frontend Developer
