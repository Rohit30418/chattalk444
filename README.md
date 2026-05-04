
# 🚀 Vanni

**Vanni** is a real-time, peer-to-peer language exchange and video conferencing platform built with a strong focus on low-latency WebRTC multiplayer rooms and an interactive 3D AI language tutor driven by real-time audio analysis.

It enables users to practice languages with real people or an autonomous AI, giving users powerful tools like a **3D Avatar with Lip-Sync**, **AI Content Moderation**, and **Mesh-Topology Video Rooms**.

---

## ✨ Key Features

### 🔹 Interactive 3D AI Avatar
* Chat with a responsive 3D AI companion (Vanni)
* Real-time lip-syncing driven by Web Audio API and React Three Fiber

### 🔹 Real-Time Video Rooms
* Mesh-topology peer-to-peer video conferencing
* Powered by PeerJS and WebRTC for low-latency communication

### 🔹 AI Content Moderation
* Automatic pre-screening of room titles using OpenAI
* Ensures a safe, spam-free community environment

### 🔹 Live Chat & Reactions
* Instant messaging synced across peers via Firebase
* Floating emoji reactions for interactive engagement

### 🔹 "Green Room" Pre-join
* Test microphone and camera settings before entering a live room
* Mimics enterprise video software UX for better hardware management

### 🔹 Optimized Performance
* Built with Vite and advanced React hooks (useMemo, useCallback, useRef)
* Manages heavy media streams without blocking the UI thread

---

## 🛠️ Tech Stack

| Category | Technology |
| -------- | ---------------------------- |
| Frontend | React + Vite |
| Styling | Tailwind CSS |
| Backend | Firebase (Auth + Firestore) |
| State | Redux Toolkit |
| Real-Time| PeerJS (WebRTC), Web Audio API|
| 3D & UI | React Three Fiber (R3F), Drei |
| AI / LLM | OpenAI API / Puter.js SDK |

## 📂 Project Structure

```
📦src
 ┣ 📂assets
 ┣ 📂components
 ┃ ┣ 📂ai
 ┃ ┣ 📂chat
 ┃ ┣ 📂common
 ┃ ┣ 📂rooms
 ┣ 📂hooks
 ┣ 📂redux
 ┣ 📂services
 ┣ 📜App.jsx
 ┣ 📜main.jsx
```

---

## 👤 Author

**Rohit Pant**