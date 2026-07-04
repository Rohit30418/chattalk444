import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Peer from 'peerjs';
import Swal from 'sweetalert2';

import socket from '../../services/socket';
import { getVideoSenders, safelyPlayVideo, stopStreamTracks, buildMediaConstraints } from '../utils/media';
import {
  CONNECTION_QUALITY,
  SPEAKING_HOLD_MS,
  SPEAKING_THRESHOLD,
  SPEAKING_THROTTLE_MS,
} from '../constants';

import joinRoomSrc from '../../assets/notification-1-269296.mp3';

const joinRoomAudio = new Audio(joinRoomSrc);
joinRoomAudio.preload = 'auto';

const useRoomController = ({
  id,
  uId,
  currUserData,
  isHost,
  mediaPrefs,
  isChatOpen,
  navigate,
  dispatch,
  toggleChatSidebar,
}) => {
  const [peerId, setPeerId] = useState('');
  const [participants, setParticipants] = useState(new Map());
  const [isAudioEnabled, setIsAudioEnabled] = useState(Boolean(mediaPrefs?.audio));
  const [isVideoEnabled, setIsVideoEnabled] = useState(Boolean(mediaPrefs?.video));
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [activeScreenShare, setActiveScreenShare] = useState(null);
  const [raisedHand, setRaisedHand] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showDeviceSettings, setShowDeviceSettings] = useState(false);
  const [isSettingOn, setIsSettingOn] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [subtitlesEnabled, setSubtitlesEnabled] = useState(false);
  const [localSubtitle, setLocalSubtitle] = useState('');
  const [subtitles, setSubtitles] = useState({});
  const [localReactions, setLocalReactions] = useState([]);
  const [connectionState, setConnectionState] = useState(socket.connected ? 'connected' : 'offline');
  const [fullscreenId, setFullscreenId] = useState(null);
  const [pinnedId, setPinnedId] = useState(null);
  const [mediaError, setMediaError] = useState('');
  const [devices, setDevices] = useState({ audio: [], video: [] });
  const [selectedAudioDeviceId, setSelectedAudioDeviceId] = useState(mediaPrefs?.audioDeviceId || '');
  const [selectedVideoDeviceId, setSelectedVideoDeviceId] = useState(mediaPrefs?.videoDeviceId || '');

  const [localStreamVersion, setLocalStreamVersion] = useState(0);
  const [, setLocalScreenVersion] = useState(0);
  const [remoteScreenStreams, setRemoteScreenStreams] = useState(new Map());

  const localVideoRef = useRef(null);
  const screenVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const peerRef = useRef(null);
  const dataConnectionsRef = useRef({});
  const chatConnectionsRef = useRef({});
  const peerMetadataRef = useRef(new Map());
  const isMounted = useRef(true);
  const isHangingUp = useRef(false);
  const isScreenSharingRef = useRef(false);
  const camStateBeforeShare = useRef(false);
  const recognitionRef = useRef(null);
  const recognitionActive = useRef(false);
  const subtitleTimers = useRef({});
  const speakingThrottle = useRef({});
  const speakingState = useRef({});
  const speakingCleanups = useRef({});
  const qualityCleanups = useRef({});
  const isChatOpenRef = useRef(isChatOpen);
  const screenConnectionsRef = useRef({});
  const activeScreenShareRef = useRef(activeScreenShare);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    isChatOpenRef.current = isChatOpen;
  }, [isChatOpen]);

  useEffect(() => {
    activeScreenShareRef.current = activeScreenShare;
  }, [activeScreenShare]);

  const enumerateDevices = useCallback(async () => {
    try {
      const all = await navigator.mediaDevices?.enumerateDevices?.();
      if (!all || !isMounted.current) return;

      setDevices({
        audio: all.filter((device) => device.kind === 'audioinput'),
        video: all.filter((device) => device.kind === 'videoinput'),
      });
    } catch (error) {
      console.warn('[Devices] enumerate failed:', error?.message || error);
    }
  }, []);

  const initLocalMedia = useCallback(async ({
    audioDeviceId = selectedAudioDeviceId,
    videoDeviceId = selectedVideoDeviceId,
    preserveAudio = isAudioEnabled,
    preserveVideo = isVideoEnabled,
  } = {}) => {
    try {
      setMediaError('');

      const stream = await navigator.mediaDevices.getUserMedia(
        buildMediaConstraints({ audioDeviceId, videoDeviceId })
      );

      if (!isMounted.current) {
        stopStreamTracks(stream);
        return null;
      }

      stopStreamTracks(localStreamRef.current);
      localStreamRef.current = stream;
      setLocalStreamVersion((value) => value + 1);

      const [audioTrack] = stream.getAudioTracks();
      const [videoTrack] = stream.getVideoTracks();

      if (audioTrack) audioTrack.enabled = Boolean(preserveAudio);
      if (videoTrack) videoTrack.enabled = Boolean(preserveVideo);

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        safelyPlayVideo(localVideoRef.current);
      }

      setIsAudioEnabled(Boolean(audioTrack) && Boolean(preserveAudio));
      setIsVideoEnabled(Boolean(videoTrack) && Boolean(preserveVideo));

      await enumerateDevices();

      return stream;
    } catch (error) {
      console.error('[Room media]', error);

      if (isMounted.current) {
        setMediaError(
          error?.name === 'NotAllowedError'
            ? 'Camera/microphone permission denied. Please allow access in browser settings.'
            : error?.message || 'Could not access camera or microphone.'
        );
      }

      return null;
    }
  }, [
    selectedAudioDeviceId,
    selectedVideoDeviceId,
    isAudioEnabled,
    isVideoEnabled,
    enumerateDevices,
  ]);

  useEffect(() => {
    initLocalMedia({
      preserveAudio: Boolean(mediaPrefs?.audio),
      preserveVideo: Boolean(mediaPrefs?.video),
    });

    return () => {
      stopStreamTracks(localStreamRef.current);
      stopStreamTracks(screenStreamRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sendDataToAll = useCallback((message) => {
    Object.values(chatConnectionsRef.current).forEach((connection) => {
      try {
        if (connection.open) connection.send(message);
      } catch (error) {
        console.warn('[Peer data] send failed:', error?.message || error);
      }
    });
  }, []);

  const updateParticipant = useCallback((uid, updater) => {
    setParticipants((prev) => {
      const next = new Map(prev);
      const entry = next.get(uid);
      if (!entry) return prev;

      next.set(uid, typeof updater === 'function' ? updater(entry) : { ...entry, ...updater });
      return next;
    });
  }, []);

  const addParticipant = useCallback((remotePeerId, stream, metaOverride = {}) => {
    const meta = peerMetadataRef.current.get(remotePeerId) || {};
    const uid = metaOverride.uid || metaOverride.userId || meta.uid || meta.userId || remotePeerId;

    if (!uid || uid === uId) return;

    setParticipants((prev) => {
      const next = new Map(prev);
      const existing = next.get(uid) || {};

      next.set(uid, {
        uid,
        userId: uid,
        peerId: remotePeerId,
        stream,
        name: metaOverride.name || meta.name || existing.name || 'User',
        photo: metaOverride.photo || meta.photo || existing.photo || '',
        isAudioEnabled: metaOverride.isAudioEnabled ?? meta.isAudioEnabled ?? existing.isAudioEnabled ?? true,
        isVideoEnabled: metaOverride.isVideoEnabled ?? meta.isVideoEnabled ?? existing.isVideoEnabled ?? true,
        isScreenSharing: metaOverride.isScreenSharing ?? meta.isScreenSharing ?? existing.isScreenSharing ?? false,
        isSpeaking: existing.isSpeaking || false,
        reactions: existing.reactions || [],
        raisedHand: existing.raisedHand || false,
        quality: existing.quality || CONNECTION_QUALITY.GOOD,
      });

      return next;
    });
  }, [uId]);

  const removeRemoteScreenStream = useCallback((uidOrPeerId) => {
    let removedUid = null;

    setRemoteScreenStreams((prev) => {
      const next = new Map(prev);

      for (const [uid, entry] of next) {
        if (uid === uidOrPeerId || entry.peerId === uidOrPeerId) {
          removedUid = uid;
          next.delete(uid);
        }
      }

      return next;
    });

    if (removedUid) {
      setActiveScreenShare((active) => (active?.uid === removedUid ? null : active));
    }
  }, []);

  const removeParticipant = useCallback((remotePeerIdOrUid) => {
    setParticipants((prev) => {
      const next = new Map(prev);

      for (const [uid, entry] of next) {
        if (entry.peerId === remotePeerIdOrUid || uid === remotePeerIdOrUid) {
          speakingCleanups.current[uid]?.();
          qualityCleanups.current[uid]?.();

          delete speakingCleanups.current[uid];
          delete qualityCleanups.current[uid];

          next.delete(uid);
          removeRemoteScreenStream(uid);
          setActiveScreenShare((active) => (active?.uid === uid ? null : active));
          break;
        }
      }

      return next;
    });

    try {
      screenConnectionsRef.current[remotePeerIdOrUid]?.close?.();
    } catch {}

    delete dataConnectionsRef.current[remotePeerIdOrUid];
    delete screenConnectionsRef.current[remotePeerIdOrUid];
    delete chatConnectionsRef.current[remotePeerIdOrUid];

    removeRemoteScreenStream(remotePeerIdOrUid);
  }, [removeRemoteScreenStream]);

  const detectSpeaking = useCallback((targetUid, stream) => {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx || !stream?.getAudioTracks?.().length) return () => {};

    const audioCtx = new AudioCtx();
    const analyser = audioCtx.createAnalyser();

    analyser.smoothingTimeConstant = 0.72;
    analyser.fftSize = 1024;

    try {
      audioCtx.createMediaStreamSource(stream).connect(analyser);
    } catch {
      audioCtx.close().catch(() => {});
      return () => {};
    }

    const data = new Uint8Array(analyser.frequencyBinCount);
    let holdTimeout = null;
    let frame = null;

    const updateSpeaking = (value) => {
      const now = Date.now();
      const last = speakingThrottle.current[targetUid] || 0;

      if (speakingState.current[targetUid] === value || now - last < SPEAKING_THROTTLE_MS) return;

      speakingThrottle.current[targetUid] = now;
      speakingState.current[targetUid] = value;

      updateParticipant(targetUid, { isSpeaking: value });
    };

    const check = () => {
      analyser.getByteFrequencyData(data);

      let sum = 0;
      for (let i = 0; i < data.length; i += 4) sum += data[i];

      const avg = sum / (data.length / 4);

      if (avg > SPEAKING_THRESHOLD) {
        updateSpeaking(true);
        if (holdTimeout) {
          clearTimeout(holdTimeout);
          holdTimeout = null;
        }
      } else if (speakingState.current[targetUid] && !holdTimeout) {
        holdTimeout = setTimeout(() => {
          updateSpeaking(false);
          holdTimeout = null;
        }, SPEAKING_HOLD_MS);
      }

      frame = requestAnimationFrame(check);
    };

    check();

    return () => {
      if (holdTimeout) clearTimeout(holdTimeout);
      if (frame) cancelAnimationFrame(frame);
      audioCtx.close().catch(() => {});
      delete speakingState.current[targetUid];
      delete speakingThrottle.current[targetUid];
    };
  }, [updateParticipant]);

  const watchConnectionQuality = useCallback((targetUid, call) => {
    const pc = call?.peerConnection;
    if (!pc?.getStats) return () => {};

    const interval = setInterval(async () => {
      try {
        const stats = await pc.getStats();
        let packetsLost = 0;
        let packetsReceived = 0;
        let jitter = 0;

        stats.forEach((report) => {
          if (report.type === 'inbound-rtp' && (report.kind === 'video' || report.mediaType === 'video')) {
            packetsLost += report.packetsLost || 0;
            packetsReceived += report.packetsReceived || 0;
            jitter += report.jitter || 0;
          }
        });

        const lossRate = packetsReceived > 0 ? packetsLost / packetsReceived : 0;
        let quality = CONNECTION_QUALITY.GOOD;

        if (lossRate > 0.08 || jitter > 0.08) quality = CONNECTION_QUALITY.POOR;
        else if (lossRate > 0.03 || jitter > 0.04) quality = CONNECTION_QUALITY.FAIR;

        updateParticipant(targetUid, { quality });
      } catch {}
    }, 5000);

    return () => clearInterval(interval);
  }, [updateParticipant]);

  const processIncomingData = useCallback((data) => {
    if (!isMounted.current || !data?.type) return;

    if (data.type === 'reaction') {
      const rid = `${Date.now()}_${Math.random().toString(36).slice(2)}`;

      updateParticipant(data.uid, (entry) => ({
        ...entry,
        reactions: [...(entry.reactions || []), { id: rid, emoji: data.emoji }],
      }));

      setTimeout(() => {
        if (!isMounted.current) return;

        updateParticipant(data.uid, (entry) => ({
          ...entry,
          reactions: (entry.reactions || []).filter((reaction) => reaction.id !== rid),
        }));
      }, 3200);
    }

    if (data.type === 'raise_hand') {
      updateParticipant(data.uid, { raisedHand: Boolean(data.raised) });
    }

    if (data.type === 'subtitle') {
      setSubtitles((prev) => ({
        ...prev,
        [data.uid]: { text: data.text, name: data.name || 'User' },
      }));

      clearTimeout(subtitleTimers.current[data.uid]);

      subtitleTimers.current[data.uid] = setTimeout(() => {
        if (!isMounted.current) return;

        setSubtitles((prev) => {
          const next = { ...prev };
          delete next[data.uid];
          return next;
        });
      }, 3000);
    }
  }, [updateParticipant]);

  const attachCallHandlers = useCallback((call, remoteMeta = {}) => {
    if (!call) return;

    dataConnectionsRef.current[call.peer] = call;

    call.on('stream', (stream) => {
      const meta = remoteMeta.uid || remoteMeta.userId ? remoteMeta : peerMetadataRef.current.get(call.peer) || {};
      const uid = meta.uid || meta.userId || call.peer;

      addParticipant(call.peer, stream, meta);
      joinRoomAudio.play().catch(() => {});

      speakingCleanups.current[uid]?.();
      speakingCleanups.current[uid] = detectSpeaking(uid, stream);

      qualityCleanups.current[uid]?.();
      qualityCleanups.current[uid] = watchConnectionQuality(uid, call);
    });

    call.on('close', () => removeParticipant(call.peer));
    call.on('error', () => removeParticipant(call.peer));
  }, [addParticipant, detectSpeaking, removeParticipant, watchConnectionQuality]);

  const attachScreenCallHandlers = useCallback((call, remoteMeta = {}) => {
    if (!call) return;

    screenConnectionsRef.current[call.peer] = call;

    call.on('stream', (stream) => {
      const meta = remoteMeta.uid || remoteMeta.userId ? remoteMeta : call.metadata || peerMetadataRef.current.get(call.peer) || {};
      const uid = meta.uid || meta.userId || call.peer;
      const name = meta.name || peerMetadataRef.current.get(call.peer)?.name || 'User';

      if (uid === uId) return;

      setRemoteScreenStreams((prev) => {
        const next = new Map(prev);
        next.set(uid, { uid, peerId: call.peer, name, stream });
        return next;
      });

      setActiveScreenShare((active) => active || {
        uid,
        userId: uid,
        peerId: call.peer,
        name,
        isLocal: false,
      });
    });

    call.on('close', () => removeRemoteScreenStream(call.peer));
    call.on('error', () => removeRemoteScreenStream(call.peer));
  }, [removeRemoteScreenStream, uId]);

  const connectDataChannel = useCallback((peer, remotePeerId) => {
    if (!peer || !remotePeerId || chatConnectionsRef.current[remotePeerId]) return;

    const connection = peer.connect(remotePeerId);

    connection.on('open', () => {
      chatConnectionsRef.current[remotePeerId] = connection;
      connection.on('data', processIncomingData);
      connection.on('close', () => {
        delete chatConnectionsRef.current[remotePeerId];
      });
    });

    connection.on('error', () => {
      delete chatConnectionsRef.current[remotePeerId];
    });
  }, [processIncomingData]);

  const callPeerWithScreen = useCallback((remotePeer) => {
    const remotePeerId = remotePeer?.peerId;
    if (!peerRef.current || !remotePeerId || screenConnectionsRef.current[remotePeerId]) return;
    if (!screenStreamRef.current) return;

    const call = peerRef.current.call(remotePeerId, screenStreamRef.current, {
      metadata: {
        type: 'screen',
        uid: uId,
        userId: uId,
        name: currUserData?.displayName || 'User',
        peerId,
      },
    });

    screenConnectionsRef.current[remotePeerId] = call;

    call?.on?.('close', () => {
      delete screenConnectionsRef.current[remotePeerId];
    });

    call?.on?.('error', () => {
      delete screenConnectionsRef.current[remotePeerId];
    });
  }, [uId, currUserData, peerId]);

  const joinRoom = useCallback(() => {
    if (!peerId || !currUserData || !id || !uId || !socket.connected) return;

    socket.emit('join-room', {
      roomId: id,
      userId: uId,
      peerId,
      name: currUserData.displayName || 'User',
      photo: currUserData.photoURL || '',
      isAudioEnabled,
      isVideoEnabled,
    });
  }, [peerId, currUserData, id, uId, isAudioEnabled, isVideoEnabled]);

  useEffect(() => {
    if (!id || !uId) return;

    const peer = new Peer();
    peerRef.current = peer;

    peer.on('open', (pid) => {
      if (isMounted.current) setPeerId(pid);
    });

    peer.on('disconnected', () => {
      try {
        peer.reconnect();
      } catch (error) {
        console.warn('[Peer data] send failed:', error?.message || error);
      }
    });

    peer.on('connection', (connection) => {
      connection.on('open', () => {
        chatConnectionsRef.current[connection.peer] = connection;
        connection.on('data', processIncomingData);
        connection.on('close', () => {
          delete chatConnectionsRef.current[connection.peer];
        });
      });
    });

    peer.on('call', (call) => {
      const callType = call.metadata?.type || 'camera';

      if (callType === 'screen') {
        try {
          call.answer(new MediaStream());
        } catch {
          call.answer(localStreamRef.current);
        }

        attachScreenCallHandlers(call, call.metadata || {});
        return;
      }

      call.answer(localStreamRef.current);
      attachCallHandlers(call, call.metadata || {});
    });

    peer.on('error', (error) => {
      console.warn('[Peer error]', error);
    });

    return () => {
      peer.destroy();
    };
  }, [id, uId, attachCallHandlers, attachScreenCallHandlers, processIncomingData]);

  useEffect(() => {
    if (!peerId || !currUserData) return;
    joinRoom();
  }, [peerId, currUserData, joinRoom]);

  useEffect(() => {
    const handleSocketConnect = () => {
      setConnectionState('connected');
      joinRoom();
      socket.emit('request-room-sync', { roomId: id, userId: uId });
    };

    const handleSocketDisconnect = () => {
      setConnectionState('offline');
    };

    socket.on('connect', handleSocketConnect);
    socket.on('disconnect', handleSocketDisconnect);
    socket.io?.on?.('reconnect', handleSocketConnect);

    return () => {
      socket.off('connect', handleSocketConnect);
      socket.off('disconnect', handleSocketDisconnect);
      socket.io?.off?.('reconnect', handleSocketConnect);
    };
  }, [id, uId, joinRoom]);

  useEffect(() => {
    const handleRoomParticipants = (roomParticipants = []) => {
      if (!isMounted.current || !peerRef.current) return;

      roomParticipants.forEach((participant) => {
        if (!participant?.peerId || participant.uid === uId || participant.userId === uId) return;
        peerMetadataRef.current.set(participant.peerId, participant);
      });

      const remotePeers = roomParticipants.filter((participant) => (
        participant?.peerId
        && participant.uid !== uId
        && participant.userId !== uId
      ));

      remotePeers.forEach((remotePeer) => {
        const remotePeerId = remotePeer.peerId;

        if (!remotePeerId || dataConnectionsRef.current[remotePeerId]) return;
        if (!localStreamRef.current) return;

        const call = peerRef.current.call(remotePeerId, localStreamRef.current);
        attachCallHandlers(call, remotePeer);
        connectDataChannel(peerRef.current, remotePeerId);

        if (isScreenSharingRef.current && screenStreamRef.current) {
          callPeerWithScreen(remotePeer);
        }
      });

      setParticipants((prev) => {
        const next = new Map(prev);
        const validUids = new Set(remotePeers.map((peer) => peer.uid || peer.userId));

        for (const [uid, entry] of next) {
          if (!validUids.has(uid)) {
            next.delete(uid);
          } else {
            const metadata = remotePeers.find((peer) => (peer.uid || peer.userId) === uid);
            if (metadata) {
              next.set(uid, {
                ...entry,
                name: metadata.name || entry.name,
                photo: metadata.photo || entry.photo,
                isAudioEnabled: metadata.isAudioEnabled ?? entry.isAudioEnabled,
                isVideoEnabled: metadata.isVideoEnabled ?? entry.isVideoEnabled,
                isScreenSharing: metadata.isScreenSharing ?? entry.isScreenSharing,
              });
            }
          }
        }

        return next;
      });
    };

    const handleUserJoined = (participant) => {
      if (!participant || participant.uid === uId || participant.userId === uId) return;
      if (participant.peerId) peerMetadataRef.current.set(participant.peerId, participant);
    };

    const handleMediaStateUpdated = ({ userId, uid, isAudioEnabled: audio, isVideoEnabled: video }) => {
      updateParticipant(uid || userId, {
        isAudioEnabled: Boolean(audio),
        isVideoEnabled: Boolean(video),
      });
    };

    const handleUserLeft = ({ peerId: leavingPeerId, uid, userId }) => {
      removeParticipant(uid || userId || leavingPeerId);
    };

    const handleKick = () => {
      Swal.fire({
        toast: true,
        icon: 'warning',
        title: 'You were removed by the host',
        position: 'top-end',
        timer: 2500,
        showConfirmButton: false,
        background: '#0f172a',
        color: '#fff',
      }).then(() => handleHangup(true));
    };

    const handleRoomClosed = () => {
      Swal.fire({
        toast: true,
        icon: 'info',
        title: 'This room was closed by the host',
        position: 'top-end',
        timer: 2500,
        showConfirmButton: false,
        background: '#0f172a',
        color: '#fff',
      }).then(() => handleHangup(true));
    };

    const handleRoomError = ({ message } = {}) => {
      Swal.fire({
        toast: true,
        icon: 'error',
        title: message || 'Room connection problem',
        position: 'top-end',
        timer: 2500,
        showConfirmButton: false,
        background: '#0f172a',
        color: '#fff',
      });
    };

    const handleAdminDenied = ({ message } = {}) => {
      Swal.fire({
        toast: true,
        icon: 'warning',
        title: message || 'Action not allowed',
        position: 'top-end',
        timer: 2200,
        showConfirmButton: false,
        background: '#0f172a',
        color: '#fff',
      });
    };

    const handleForceMute = () => {
      const [audioTrack] = localStreamRef.current?.getAudioTracks?.() || [];

      if (audioTrack) {
        audioTrack.enabled = false;
        setIsAudioEnabled(false);
        socket.emit('update-media-state', {
          roomId: id,
          userId: uId,
          isAudioEnabled: false,
          isVideoEnabled,
        });
      }

      Swal.fire({
        toast: true,
        icon: 'info',
        title: 'Muted by host',
        position: 'top-end',
        timer: 2200,
        showConfirmButton: false,
        background: '#0f172a',
        color: '#fff',
      });
    };

    const handleMessage = () => {
      if (!isChatOpenRef.current && isMounted.current) {
        setUnreadCount((count) => count + 1);
      }
    };

    const handleScreenApproved = async () => {
      await startScreenShare();
    };

    const handleScreenDenied = ({ reason, active } = {}) => {
      if (isScreenSharingRef.current) {
        stopScreenShare(false);
      }

      Swal.fire({
        icon: 'info',
        title: 'Screen share unavailable',
        text: reason || `${active?.name || 'Someone'} is already presenting. Once they stop, you can share.`,
        background: '#0f172a',
        color: '#fff',
        confirmButtonColor: '#6366f1',
      });
    };

    const handleScreenStarted = ({ uid, userId, peerId: sharerPeerId, name }) => {
      const sharerId = uid || userId;
      if (!sharerId) return;

      setActiveScreenShare({
        uid: sharerId,
        userId: sharerId,
        peerId: sharerPeerId,
        name: sharerId === uId ? (currUserData?.displayName || 'You') : (name || 'User'),
        isLocal: sharerId === uId,
      });

      updateParticipant(sharerId, { isScreenSharing: true });
    };

    const handleScreenStopped = ({ uid, userId }) => {
      const sharerId = uid || userId;

      setActiveScreenShare((prev) => (prev?.uid === sharerId ? null : prev));
      updateParticipant(sharerId, { isScreenSharing: false });
      removeRemoteScreenStream(sharerId);
    };

    socket.on('room-participants', handleRoomParticipants);
    socket.on('user-joined', handleUserJoined);
    socket.on('media-state-updated', handleMediaStateUpdated);
    socket.on('user-left', handleUserLeft);
    socket.on('you-are-kicked', handleKick);
    socket.on('you-are-force-muted', handleForceMute);
    socket.on('room-closed', handleRoomClosed);
    socket.on('room-error', handleRoomError);
    socket.on('admin-action-denied', handleAdminDenied);
    socket.on('receive-message', handleMessage);
    socket.on('screen-share-approved', handleScreenApproved);
    socket.on('screen-share-denied', handleScreenDenied);
    socket.on('screen-share-started', handleScreenStarted);
    socket.on('screen-share-stopped', handleScreenStopped);

    return () => {
      socket.off('room-participants', handleRoomParticipants);
      socket.off('user-joined', handleUserJoined);
      socket.off('media-state-updated', handleMediaStateUpdated);
      socket.off('user-left', handleUserLeft);
      socket.off('you-are-kicked', handleKick);
      socket.off('you-are-force-muted', handleForceMute);
      socket.off('room-closed', handleRoomClosed);
      socket.off('room-error', handleRoomError);
      socket.off('admin-action-denied', handleAdminDenied);
      socket.off('receive-message', handleMessage);
      socket.off('screen-share-approved', handleScreenApproved);
      socket.off('screen-share-denied', handleScreenDenied);
      socket.off('screen-share-started', handleScreenStarted);
      socket.off('screen-share-stopped', handleScreenStopped);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    id,
    uId,
    isVideoEnabled,
    updateParticipant,
    removeParticipant,
    attachCallHandlers,
    connectDataChannel,
  ]);

  const replaceVideoTrackForAllPeers = useCallback((track) => {
    Object.values(dataConnectionsRef.current).forEach((call) => {
      const pc = call?.peerConnection;
      if (!pc) return;

      getVideoSenders(pc).forEach((sender) => {
        sender.replaceTrack(track || null).catch((error) => {
          console.warn('[replaceCameraTrack]', error);
        });
      });
    });
  }, []);

  const stopScreenShare = useCallback((notifyServer = true) => {
    stopStreamTracks(screenStreamRef.current);
    screenStreamRef.current = null;
    setLocalScreenVersion((value) => value + 1);

    Object.values(screenConnectionsRef.current).forEach((call) => {
      try {
        call.close?.();
      } catch (error) {
        console.warn('[Peer data] send failed:', error?.message || error);
      }
    });

    screenConnectionsRef.current = {};

    setIsScreenSharing(false);
    isScreenSharingRef.current = false;
    setActiveScreenShare((active) => (active?.uid === uId ? null : active));

    if (notifyServer) {
      socket.emit('stop-screen-share', { roomId: id, userId: uId });
    }
  }, [id, uId]);

  const startScreenShare = useCallback(async () => {
    if (isScreenSharingRef.current) return;

    if (!navigator.mediaDevices?.getDisplayMedia) {
      Swal.fire({
        icon: 'info',
        title: 'Screen sharing is not supported here',
        text: 'Please use a desktop browser such as Chrome or Edge over HTTPS to share your screen.',
        background: '#0f172a',
        color: '#fff',
        confirmButtonColor: '#6366f1',
      });
      return;
    }

    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: 'always', displaySurface: 'monitor' },
        audio: false,
      });

      screenStreamRef.current = screenStream;
      setLocalScreenVersion((value) => value + 1);

      const [screenTrack] = screenStream.getVideoTracks();
      if (!screenTrack) {
        stopStreamTracks(screenStream);
        screenStreamRef.current = null;
        setLocalScreenVersion((value) => value + 1);
        Swal.fire({
          icon: 'info',
          title: 'Screen share not started',
          text: 'No screen video track was selected.',
          background: '#0f172a',
          color: '#fff',
          confirmButtonColor: '#6366f1',
        });
        return;
      }

      setIsScreenSharing(true);
      isScreenSharingRef.current = true;

      setActiveScreenShare({
        uid: uId,
        userId: uId,
        peerId,
        name: currUserData?.displayName || 'You',
        isLocal: true,
      });

      socket.emit('screen-share-started', {
        roomId: id,
        uid: uId,
        userId: uId,
        peerId,
        name: currUserData?.displayName || 'User',
      });

      Array.from(participants.values()).forEach((participant) => callPeerWithScreen(participant));

      screenTrack.addEventListener('ended', () => {
        if (!isScreenSharingRef.current) return;
        stopScreenShare(true);
      }, { once: true });
    } catch (error) {
      socket.emit('stop-screen-share', { roomId: id, userId: uId });
      if (error?.name !== 'NotAllowedError') {
        console.error('[startScreenShare]', error);
        Swal.fire({
          icon: 'error',
          title: 'Screen share failed',
          text: error?.message || 'Could not start screen sharing.',
          background: '#0f172a',
          color: '#fff',
          confirmButtonColor: '#6366f1',
        });
      }
    }
  }, [id, uId, peerId, currUserData, participants, callPeerWithScreen, stopScreenShare]);

  const toggleScreenShare = useCallback(() => {
    if (isScreenSharingRef.current) {
      stopScreenShare(true);
      return;
    }

    const active = activeScreenShareRef.current;
    if (active && active.uid !== uId) {
      Swal.fire({
        icon: 'info',
        title: 'Someone is already presenting',
        text: `${active.name || 'Someone'} is already presenting. Once they stop, you can share.`,
        background: '#0f172a',
        color: '#fff',
        confirmButtonColor: '#6366f1',
      });
      return;
    }

    // Do not wait forever for backend approval. Start capture from the click gesture
    // so the browser allows getDisplayMedia, and still notify the socket backend.
    startScreenShare();

    socket.emit('request-screen-share', {
      roomId: id,
      userId: uId,
      name: currUserData?.displayName || 'User',
      peerId,
    });
  }, [id, uId, currUserData, peerId, startScreenShare, stopScreenShare]);

  const toggleAudio = useCallback(() => {
    const [audioTrack] = localStreamRef.current?.getAudioTracks?.() || [];
    if (!audioTrack) return;

    const next = !audioTrack.enabled;
    audioTrack.enabled = next;
    setIsAudioEnabled(next);

    socket.emit('update-media-state', {
      roomId: id,
      userId: uId,
      isAudioEnabled: next,
      isVideoEnabled,
    });
  }, [id, uId, isVideoEnabled]);

  const toggleVideo = useCallback(() => {
    if (isScreenSharing) return;

    const [videoTrack] = localStreamRef.current?.getVideoTracks?.() || [];
    if (!videoTrack) return;

    const next = !videoTrack.enabled;
    videoTrack.enabled = next;
    setIsVideoEnabled(next);

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
      safelyPlayVideo(localVideoRef.current);
    }

    socket.emit('update-media-state', {
      roomId: id,
      userId: uId,
      isAudioEnabled,
      isVideoEnabled: next,
    });
  }, [id, uId, isAudioEnabled, isScreenSharing]);

  const sendReaction = useCallback((emoji) => {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2)}`;

    setLocalReactions((prev) => [...prev, { id, emoji }]);
    sendDataToAll({ type: 'reaction', uid: uId, emoji });
    setShowReactionPicker(false);

    setTimeout(() => {
      if (!isMounted.current) return;
      setLocalReactions((prev) => prev.filter((reaction) => reaction.id !== id));
    }, 3200);
  }, [uId, sendDataToAll]);

  const removeLocalReaction = useCallback((reactionId) => {
    setLocalReactions((prev) => prev.filter((reaction) => reaction.id !== reactionId));
  }, []);

  const toggleRaiseHand = useCallback(() => {
    setRaisedHand((prev) => {
      const next = !prev;
      sendDataToAll({ type: 'raise_hand', uid: uId, raised: next });
      return next;
    });
  }, [uId, sendDataToAll]);

  const startSubtitles = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition || recognitionRef.current) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let text = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        text += event.results[i][0].transcript;
      }

      setLocalSubtitle(text);

      sendDataToAll({
        type: 'subtitle',
        uid: uId,
        name: currUserData?.displayName || 'You',
        text,
      });

      clearTimeout(subtitleTimers.current.local);
      subtitleTimers.current.local = setTimeout(() => {
        if (isMounted.current) setLocalSubtitle('');
      }, 3000);
    };

    recognition.onerror = (event) => {
      if (event.error !== 'no-speech') {
        console.warn('[SpeechRecognition]', event.error);
      }
    };

    recognition.onend = () => {
      if (recognitionActive.current && recognitionRef.current) {
        try {
          recognition.start();
        } catch {}
      }
    };

    recognitionActive.current = true;
    recognitionRef.current = recognition;
    recognition.start();
  }, [uId, currUserData, sendDataToAll]);

  const stopSubtitles = useCallback(() => {
    recognitionActive.current = false;
    recognitionRef.current?.stop?.();
    recognitionRef.current = null;
    setLocalSubtitle('');
    Object.values(subtitleTimers.current).forEach(clearTimeout);
    subtitleTimers.current = {};
  }, []);

  const toggleSubtitles = useCallback(() => {
    if (subtitlesEnabled) {
      stopSubtitles();
      setSubtitlesEnabled(false);
    } else {
      startSubtitles();
      setSubtitlesEnabled(true);
    }
  }, [subtitlesEnabled, startSubtitles, stopSubtitles]);

  const forceMuteUser = useCallback((targetUid) => {
    socket.emit('admin-force-mute', { roomId: id, targetUid });
  }, [id]);

  const kickUser = useCallback(async (targetUid) => {
    const result = await Swal.fire({
      title: 'Remove this user?',
      text: 'They will be removed from the meeting.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#334155',
      confirmButtonText: 'Remove',
      background: '#0f172a',
      color: '#fff',
    });

    if (result.isConfirmed) {
      socket.emit('admin-kick-user', { roomId: id, targetUid });
    }
  }, [id]);

  const handleHangup = useCallback((silent = false) => {
    if (isHangingUp.current) return;
    isHangingUp.current = true;

    stopSubtitles();
    stopScreenShare(true);
    stopStreamTracks(localStreamRef.current);

    Object.values(speakingCleanups.current).forEach((cleanup) => cleanup?.());
    Object.values(qualityCleanups.current).forEach((cleanup) => cleanup?.());
    Object.values(dataConnectionsRef.current).forEach((connection) => {
      try {
        connection.close();
      } catch (error) {
        console.warn('[Peer data] send failed:', error?.message || error);
      }
    });
    Object.values(screenConnectionsRef.current).forEach((connection) => {
      try {
        connection.close();
      } catch (error) {
        console.warn('[Peer data] send failed:', error?.message || error);
      }
    });
    Object.values(chatConnectionsRef.current).forEach((connection) => {
      try {
        connection.close();
      } catch (error) {
        console.warn('[Peer data] send failed:', error?.message || error);
      }
    });

    peerRef.current?.destroy?.();

    socket.emit('leave-room', { roomId: id, userId: uId });
    dispatch({ type: 'resetRoomUiState' });

    navigate('/rooms', { replace: Boolean(silent) });
  }, [id, uId, navigate, dispatch, stopSubtitles, stopScreenShare]);

  const showLeaveModal = useCallback(() => {
    Swal.fire({
      title: 'Leave the meeting?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#334155',
      confirmButtonText: 'Leave',
      background: '#0f172a',
      color: '#fff',
    }).then((result) => {
      if (result.isConfirmed) handleHangup();
    });
  }, [handleHangup]);

  const handleToggleChat = useCallback(() => {
    if (!isChatOpen) setUnreadCount(0);
    dispatch(toggleChatSidebar(!isChatOpen));
  }, [dispatch, isChatOpen, toggleChatSidebar]);

  const changeAudioDevice = useCallback(async (deviceId) => {
    setSelectedAudioDeviceId(deviceId);
    await initLocalMedia({
      audioDeviceId: deviceId,
      videoDeviceId: selectedVideoDeviceId,
      preserveAudio: isAudioEnabled,
      preserveVideo: isVideoEnabled,
    });
  }, [initLocalMedia, selectedVideoDeviceId, isAudioEnabled, isVideoEnabled]);

  const changeVideoDevice = useCallback(async (deviceId) => {
    setSelectedVideoDeviceId(deviceId);

    const stream = await initLocalMedia({
      audioDeviceId: selectedAudioDeviceId,
      videoDeviceId: deviceId,
      preserveAudio: isAudioEnabled,
      preserveVideo: isVideoEnabled,
    });

    const [videoTrack] = stream?.getVideoTracks?.() || [];
    if (videoTrack && !isScreenSharing) {
      replaceVideoTrackForAllPeers(videoTrack);
    }
  }, [
    initLocalMedia,
    selectedAudioDeviceId,
    isAudioEnabled,
    isVideoEnabled,
    isScreenSharing,
    replaceVideoTrackForAllPeers,
  ]);

  const participantsArray = useMemo(() => Array.from(participants.values()), [participants]);

  const activeSpeakerUid = useMemo(() => {
    const speaking = participantsArray.find((participant) => participant.isSpeaking);
    return speaking?.uid || null;
  }, [participantsArray]);

  const activeSubtitleLines = useMemo(() => [
    ...(localSubtitle ? [{ key: 'local', name: 'You', text: localSubtitle }] : []),
    ...Object.entries(subtitles).map(([key, value]) => ({
      key,
      name: value.name,
      text: value.text,
    })),
  ], [localSubtitle, subtitles]);

  const localTile = useMemo(() => ({
    videoRef: localVideoRef,
    stream: localStreamRef.current,
    isVideoOn: isVideoEnabled,
    isAudioOn: isAudioEnabled,
    isScreenSharing: false,
    displayName: currUserData?.displayName || 'You',
    photoURL: currUserData?.photoURL,
    isLocal: true,
    uid: uId,
    reactions: localReactions,
    raisedHand,
    onRemoveReaction: removeLocalReaction,
  }), [
    isVideoEnabled,
    localStreamVersion,
    isAudioEnabled,
    currUserData,
    uId,
    localReactions,
    raisedHand,
    removeLocalReaction,
  ]);

  return {
    peerId,
    participantsArray,
    totalCount: participantsArray.length + 1,
    localTile,
    localVideoRef,
    localScreenStream: screenStreamRef.current,
    remoteScreenStreams,
    isAudioEnabled,
    isVideoEnabled,
    isScreenSharing,
    activeScreenShare,
    activeSpeakerUid,
    raisedHand,
    showReactionPicker,
    setShowReactionPicker,
    showParticipants,
    setShowParticipants,
    showDeviceSettings,
    setShowDeviceSettings,
    isSettingOn,
    setIsSettingOn,
    unreadCount,
    subtitlesEnabled,
    activeSubtitleLines,
    localReactions,
    fullscreenId,
    setFullscreenId,
    pinnedId,
    setPinnedId,
    connectionState,
    mediaError,
    devices,
    selectedAudioDeviceId,
    selectedVideoDeviceId,
    enumerateDevices,
    initLocalMedia,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
    stopScreenShare,
    sendReaction,
    toggleRaiseHand,
    toggleSubtitles,
    forceMuteUser,
    kickUser,
    showLeaveModal,
    handleToggleChat,
    changeAudioDevice,
    changeVideoDevice,
  };
};

export default useRoomController;

