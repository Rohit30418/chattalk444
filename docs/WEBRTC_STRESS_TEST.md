# Vaani WebRTC Reliability Stress Test

Run these checks on the deployed Vercel frontend with the Render backend.

## 1. Network drop and recovery

1. Join the same room from two different accounts/devices.
2. Start audio/video on both.
3. Disable Wi-Fi/mobile data on one device for 10-15 seconds.
4. Re-enable the network without leaving the room.

Pass criteria:
- The disconnected client shows an offline/reconnecting state.
- Socket.IO reconnects automatically.
- PeerJS reconnects automatically.
- Remote media resumes without manually leaving/rejoining.
- No duplicate participant tile appears.

## 2. Tab sleep / background recovery

1. Join from desktop + phone, or two browser profiles.
2. Keep audio/video active.
3. Background the phone app/browser or switch the desktop tab away for 30-60 seconds.
4. Return to the room.

Pass criteria:
- Existing healthy calls remain intact where possible.
- Failed/stale PeerJS calls are rebuilt after returning.
- Participant count remains correct.
- No duplicate audio/video stream is created.

## 3. Camera permission denial

1. Block camera permission for the Vaani site.
2. Enter a room or retry camera access.

Pass criteria:
- The room stays usable instead of crashing.
- A clear camera/microphone permission message appears.
- Chat and other room controls remain usable.
- After permission is restored, Retry can reacquire media.

## 4. Camera or microphone unplug

1. Join a room using a USB webcam, USB headset, or external microphone.
2. Unplug the active device during the call.

Pass criteria:
- `devicechange` is detected.
- Device options refresh.
- Vaani attempts to fall back to another available input.
- PeerJS media connections are rebuilt when a fresh stream is acquired.
- Remote users receive the replacement stream.

## 5. Manual device switch

1. Open Device Settings during a call.
2. Switch microphone.
3. Switch camera.

Pass criteria:
- The local preview changes to the new device.
- Remote participants receive the new audio/video.
- The participant is not duplicated.
- No page reload is required.

## 6. Media track unexpectedly ends

Use an external device or browser/device controls that can terminate an active media track.

Pass criteria:
- Vaani detects an ended local audio/video track.
- It attempts to reacquire the local media stream.
- Existing PeerJS calls are refreshed after successful recovery.

## 7. Two-device reconnect race

1. Join from two accounts/devices.
2. Disconnect both networks within a few seconds of each other.
3. Reconnect both.

Pass criteria:
- Both users return to the same room.
- Only one participant entry exists per Firebase UID.
- Audio/video reconnect without duplicate calls.
- Room participant count is correct.

## 8. Screen share during network interruption

1. Start screen sharing.
2. Briefly interrupt the presenter's network.
3. Restore the network.

Pass criteria:
- The room itself recovers.
- A stale screen-share connection does not permanently block future sharing.
- If screen sharing stops, another share can be started normally.

## Current limitation

Vaani currently uses direct WebRTC/STUN only. Managed TURN is intentionally deferred to keep the project card/payment-free. Direct peer-to-peer connections can still fail on restrictive NAT, corporate, college, VPN, or mobile networks where a TURN relay would be required.
