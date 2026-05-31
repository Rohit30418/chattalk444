# RoomMain modular component version

Place this folder at:

```txt
src/components/room/
```

Recommended structure:

```txt
src/components/room/
  RoomMain.jsx
  constants.js
  components/
    ChatPanel.jsx
    ControlButton.jsx
    ControlDock.jsx
    DeviceSettingsModal.jsx
    LoadingScreen.jsx
    ParticipantsPanel.jsx
    ReactionPicker.jsx
    RoomErrorBoundary.jsx
    RoomStyles.jsx
    StatusBanner.jsx
    SubtitlesOverlay.jsx
    TopMeetingBar.jsx
    VideoStage.jsx
    VideoTile.jsx
  hooks/
    useMeetingTimer.js
    useRoomController.js
  utils/
    media.js
```

## Backend events required

The UI expects your Socket.IO backend to support:

```txt
join-room
leave-room
request-room-sync
room-participants
user-joined
user-left
update-media-state
request-screen-share
screen-share-approved
screen-share-denied
screen-share-started
screen-share-stopped
admin-force-mute
admin-kick-user
receive-message
you-are-kicked
you-are-force-muted
```

## Important note

This is still PeerJS mesh. The UI is premium and more modular, but true 20+ participant Zoom/Meet scaling still needs an SFU such as LiveKit or mediasoup.
