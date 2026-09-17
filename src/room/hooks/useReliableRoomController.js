import { useCallback, useEffect, useRef } from 'react';

import socket from '../../services/socket';
import useRoomController from './useRoomController';

const MEDIA_REFRESH_EVENT = 'vaani-media-refresh';
const DEVICE_CHANGE_DEBOUNCE_MS = 650;

const inputDeviceIds = (devices = []) => new Set(
  devices
    .filter((device) => device.kind === 'audioinput' || device.kind === 'videoinput')
    .map((device) => device.deviceId)
    .filter(Boolean)
);

const useReliableRoomController = (options) => {
  const room = useRoomController(options);
  const recoveryInFlightRef = useRef(false);
  const deviceTimerRef = useRef(null);
  const knownDeviceIdsRef = useRef(new Set());

  const refreshPeerConnections = useCallback((reason) => {
    if (typeof window === 'undefined') return;

    window.dispatchEvent(new CustomEvent(MEDIA_REFRESH_EVENT, {
      detail: { reason },
    }));
  }, []);

  const recoverLocalMedia = useCallback(async ({ reason = 'device-change', devices } = {}) => {
    if (recoveryInFlightRef.current || !navigator.mediaDevices?.enumerateDevices) return;

    recoveryInFlightRef.current = true;

    try {
      const availableDevices = devices || await navigator.mediaDevices.enumerateDevices();
      const audioDevices = availableDevices.filter((device) => device.kind === 'audioinput');
      const videoDevices = availableDevices.filter((device) => device.kind === 'videoinput');

      const audioSelectionStillExists = !room.selectedAudioDeviceId
        || audioDevices.some((device) => device.deviceId === room.selectedAudioDeviceId);
      const videoSelectionStillExists = !room.selectedVideoDeviceId
        || videoDevices.some((device) => device.deviceId === room.selectedVideoDeviceId);

      const audioDeviceId = audioSelectionStillExists ? room.selectedAudioDeviceId : '';
      const videoDeviceId = videoSelectionStillExists ? room.selectedVideoDeviceId : '';

      // The existing room controller acquires audio + video together. If a
      // machine genuinely has no input of one kind, keep the surviving track
      // alive and surface the normal media error instead of tearing it down.
      if (!audioDevices.length || !videoDevices.length) {
        await room.enumerateDevices();
        return;
      }

      const stream = await room.initLocalMedia({
        audioDeviceId,
        videoDeviceId,
        preserveAudio: room.isAudioEnabled,
        preserveVideo: room.isVideoEnabled,
      });

      await room.enumerateDevices();

      if (!stream) return;

      const [audioTrack] = stream.getAudioTracks();
      const [videoTrack] = stream.getVideoTracks();

      socket.emit('update-media-state', {
        roomId: options.id,
        userId: options.uId,
        isAudioEnabled: Boolean(audioTrack?.enabled),
        isVideoEnabled: Boolean(videoTrack?.enabled),
      });

      // initLocalMedia replaces the local stream. Rebuild existing PeerJS
      // media/data connections so remote participants receive the fresh tracks
      // instead of remaining attached to stopped camera/microphone tracks.
      refreshPeerConnections(reason);
    } catch (error) {
      console.warn('[Media recovery] Could not recover input devices:', error?.message || error);
    } finally {
      recoveryInFlightRef.current = false;
    }
  }, [
    options.id,
    options.uId,
    room.enumerateDevices,
    room.initLocalMedia,
    room.isAudioEnabled,
    room.isVideoEnabled,
    room.selectedAudioDeviceId,
    room.selectedVideoDeviceId,
    refreshPeerConnections,
  ]);

  useEffect(() => {
    const mediaDevices = navigator.mediaDevices;
    if (!mediaDevices?.enumerateDevices) return undefined;

    let cancelled = false;

    mediaDevices.enumerateDevices()
      .then((devices) => {
        if (!cancelled) knownDeviceIdsRef.current = inputDeviceIds(devices);
      })
      .catch(() => {});

    if (!mediaDevices.addEventListener) {
      return () => {
        cancelled = true;
      };
    }

    const handleDeviceChange = () => {
      if (deviceTimerRef.current) window.clearTimeout(deviceTimerRef.current);

      deviceTimerRef.current = window.setTimeout(async () => {
        try {
          const devices = await mediaDevices.enumerateDevices();
          if (cancelled) return;

          const nextIds = inputDeviceIds(devices);
          const removedDevice = Array.from(knownDeviceIdsRef.current)
            .some((deviceId) => !nextIds.has(deviceId));

          const selectedAudioMissing = Boolean(room.selectedAudioDeviceId)
            && !devices.some((device) => (
              device.kind === 'audioinput'
              && device.deviceId === room.selectedAudioDeviceId
            ));

          const selectedVideoMissing = Boolean(room.selectedVideoDeviceId)
            && !devices.some((device) => (
              device.kind === 'videoinput'
              && device.deviceId === room.selectedVideoDeviceId
            ));

          knownDeviceIdsRef.current = nextIds;
          await room.enumerateDevices();

          // Plugging in an extra device does not interrupt an active call.
          // Recover only when an existing input disappeared or the selected
          // camera/microphone is no longer available.
          if (removedDevice || selectedAudioMissing || selectedVideoMissing) {
            await recoverLocalMedia({ reason: 'device-removed', devices });
          }
        } catch (error) {
          console.warn('[Media recovery] devicechange check failed:', error?.message || error);
        }
      }, DEVICE_CHANGE_DEBOUNCE_MS);
    };

    mediaDevices.addEventListener('devicechange', handleDeviceChange);

    return () => {
      cancelled = true;
      if (deviceTimerRef.current) window.clearTimeout(deviceTimerRef.current);
      mediaDevices.removeEventListener('devicechange', handleDeviceChange);
    };
  }, [
    recoverLocalMedia,
    room.enumerateDevices,
    room.selectedAudioDeviceId,
    room.selectedVideoDeviceId,
  ]);

  const changeAudioDevice = useCallback(async (deviceId) => {
    await room.changeAudioDevice(deviceId);
    refreshPeerConnections('audio-device-switch');
  }, [room.changeAudioDevice, refreshPeerConnections]);

  const changeVideoDevice = useCallback(async (deviceId) => {
    await room.changeVideoDevice(deviceId);
    refreshPeerConnections('video-device-switch');
  }, [room.changeVideoDevice, refreshPeerConnections]);

  return {
    ...room,
    changeAudioDevice,
    changeVideoDevice,
  };
};

export default useReliableRoomController;
