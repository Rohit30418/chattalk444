import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Swal from 'sweetalert2';

import { resetRoomUiState, toggleChatSidebar } from '../redux/action';
import getUserData from '../hooks/getUserData';
import { getRoomData } from '../hooks/getRoom';
import api from '../services/api';

import RoomErrorBoundary from './components/RoomErrorBoundary';
import LoadingScreen from './components/LoadingScreen';
import RoomStyles from './components/RoomStyles';
import TopMeetingBar from './components/TopMeetingBar';
import StatusBanner from './components/StatusBanner';
import VideoStage from './components/VideoStage';
import ControlDock from './components/ControlDock';
import ReactionPicker from './components/ReactionPicker';
import SubtitlesOverlay from './components/SubtitlesOverlay';
import ParticipantsPanel from './components/ParticipantsPanel';
import ChatPanel from './components/ChatPanel';
import DeviceSettingsModal from './components/DeviceSettingsModal';
import useMeetingTimer from './hooks/useMeetingTimer';
import useRoomController from './hooks/useRoomController';

const RoomMain = ({ uId, user }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const timer = useMeetingTimer();

  const mediaPrefs = useSelector((state) => state.mediaPrefs);
  const isChatOpen = useSelector((state) => state.toggleChatSidebar);

  const { rooms } = getRoomData() || {};

  const [currUserData, setCurrUserData] = useState(null);
  const [userLoading, setUserLoading] = useState(true);
  const [currentRoomData, setCurrentRoomData] = useState(null);
  const [roomLoading, setRoomLoading] = useState(true);
  const [roomError, setRoomError] = useState('');
  const [isHost, setIsHost] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (!uId) {
      setCurrUserData(null);
      setUserLoading(false);
      return () => {
        cancelled = true;
      };
    }

    getUserData(uId)
      .then((data) => {
        if (!cancelled) {
          setCurrUserData(data || {
            uid: uId,
            displayName: user?.displayName || user?.email?.split('@')[0] || 'User',
            email: user?.email || '',
            photoURL: user?.photoURL || '',
          });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCurrUserData({
            uid: uId,
            displayName: user?.displayName || user?.email?.split('@')[0] || 'User',
            email: user?.email || '',
            photoURL: user?.photoURL || '',
          });
        }
      })
      .finally(() => {
        if (!cancelled) setUserLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [uId, user]);

  useEffect(() => {
    let cancelled = false;

    const syncRoom = async () => {
      setRoomLoading(true);
      setRoomError('');

      const roomData = rooms?.find((entry) => entry.id === id || entry._id === id);

      if (roomData) {
        if (!cancelled) {
          setCurrentRoomData(roomData);
          setIsHost(Boolean(uId && (roomData.ownerUid === uId || roomData.hostId === uId)));
          setRoomLoading(false);
        }
        return;
      }

      try {
        const { data } = await api.get(`/api/rooms/${id}`);

        if (!cancelled) {
          setCurrentRoomData(data);
          setIsHost(Boolean(uId && (data.ownerUid === uId || data.hostId === uId)));
          setRoomLoading(false);
        }
      } catch (error) {
        if (!cancelled) {
          setCurrentRoomData(null);
          setIsHost(false);
          setRoomError(error.userMessage || 'Room not found or no longer active.');
          setRoomLoading(false);
        }
      }
    };

    if (id) syncRoom();

    return () => {
      cancelled = true;
    };
  }, [id, rooms, uId]);

  useEffect(() => () => {
    dispatch(resetRoomUiState());
  }, [dispatch]);

  const room = useRoomController({
    id,
    uId,
    currUserData,
    isHost,
    mediaPrefs,
    isChatOpen,
    navigate,
    dispatch,
    toggleChatSidebar,
  });

  useEffect(() => {
    const handler = () => {
      window.history.pushState(null, '', window.location.href);
      room.showLeaveModal();
    };

    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', handler);

    return () => {
      window.removeEventListener('popstate', handler);
    };
  }, [room.showLeaveModal]);

  const copyLink = () => {
    navigator.clipboard?.writeText(window.location.href);

    Swal.fire({
      toast: true,
      icon: 'success',
      title: 'Meeting link copied',
      position: 'top-end',
      timer: 1500,
      showConfirmButton: false,
      background: '#0f172a',
      color: '#fff',
    });
  };

  const commonTileProps = useMemo(() => ({
    isHost,
    menuOpenFor: room.isSettingOn,
    onToggleMenu: room.setIsSettingOn,
    onForceMute: room.forceMuteUser,
    onKick: room.kickUser,
    onOpenProfile: (uid) => {
      if (uid) {
        window.open(`/profile/${uid}`, '_blank', 'noopener,noreferrer');
      }
    },
    onFullscreen: room.setFullscreenId,
    onPin: (uid) => {
      room.setPinnedId((prev) => (prev === uid ? null : uid));
    },
  }), [
    isHost,
    room.isSettingOn,
    room.setIsSettingOn,
    room.forceMuteUser,
    room.kickUser,
    room.setFullscreenId,
    room.setPinnedId,
  ]);

  const isPageLoading = userLoading || roomLoading;

  if (isPageLoading) {
    return <LoadingScreen roomTitle={currentRoomData?.Title || 'Meeting Room'} />;
  }

  if (roomError || !currentRoomData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-5 text-white">
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-center shadow-2xl">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-300">
            <i className="fa-solid fa-triangle-exclamation text-2xl" />
          </div>
          <h1 className="text-2xl font-black">Room unavailable</h1>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            {roomError || 'This room could not be opened.'}
          </p>
          <button
            type="button"
            onClick={() => {
              dispatch(resetRoomUiState());
              navigate('/rooms', { replace: true });
            }}
            className="mt-5 rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950 transition hover:scale-[1.02] active:scale-[0.98]"
          >
            Back to rooms
          </button>
        </div>
      </div>
    );
  }

  return (
    <RoomErrorBoundary>
      <RoomStyles />

      <div className="relative flex h-[100dvh] w-screen overflow-hidden bg-[#050713] text-white">
        {/* Ambient background */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-40 -top-40 h-[30rem] w-[30rem] rounded-full bg-blue-600/15 blur-[140px]" />
          <div className="absolute -bottom-44 -right-44 h-[34rem] w-[34rem] rounded-full bg-violet-600/15 blur-[150px]" />
          <div className="absolute left-1/2 top-1/2 h-[22rem] w-[22rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400/8 blur-[120px]" />
        </div>

        <div className="relative z-10 flex h-full min-w-0 flex-1 flex-col">
          <TopMeetingBar
            title={currentRoomData?.Title || 'Meeting Room'}
            roomId={id}
            timer={timer}
            isHost={isHost}
            totalCount={room.totalCount}
            user={currUserData}
            raisedHand={room.raisedHand}
            connectionState={room.connectionState}
            onCopyLink={copyLink}
            onToggleParticipants={() => room.setShowParticipants((value) => !value)}
            onOpenDeviceSettings={() => room.setShowDeviceSettings(true)}
          />

          <StatusBanner
            isScreenSharing={room.isScreenSharing}
            mediaError={room.mediaError}
            onStopScreenShare={room.stopScreenShare}
            onRetryMedia={() => room.initLocalMedia()}
          />

          {/* 
            Layout fix:
            - main = video area
            - ChatPanel = separate side column
            - ControlDock is inside main, so it overlays only video, not chat.
          */}
          <div className="relative flex min-h-0 flex-1 overflow-hidden">
            <main
              className={`
                relative min-w-0 flex-1 overflow-hidden transition-all duration-300
                ${isChatOpen ? 'md:flex-none md:w-[calc(100%-min(380px,32vw))]' : ''}
              `}
            >
              <VideoStage
                localTile={room.localTile}
                participants={room.participantsArray}
                totalCount={room.totalCount}
                activeScreenShare={room.activeScreenShare}
                localScreenStream={room.localScreenStream}
                remoteScreenStreams={room.remoteScreenStreams}
                activeSpeakerUid={room.activeSpeakerUid}
                fullscreenId={room.fullscreenId}
                pinnedId={room.pinnedId}
                commonTileProps={commonTileProps}
                onExitFullscreen={() => room.setFullscreenId(null)}
              />

              <SubtitlesOverlay lines={room.activeSubtitleLines} />

              <ControlDock
                isAudioEnabled={room.isAudioEnabled}
                isVideoEnabled={room.isVideoEnabled}
                isScreenSharing={room.isScreenSharing}
                showReactionPicker={room.showReactionPicker}
                subtitlesEnabled={room.subtitlesEnabled}
                raisedHand={room.raisedHand}
                isChatOpen={isChatOpen}
                unreadCount={room.unreadCount}
                totalCount={room.totalCount}
                onToggleAudio={room.toggleAudio}
                onToggleVideo={room.toggleVideo}
                onToggleScreenShare={room.toggleScreenShare}
                onToggleReactions={() => room.setShowReactionPicker((value) => !value)}
                onToggleRaiseHand={room.toggleRaiseHand}
                onToggleSubtitles={room.toggleSubtitles}
                onToggleParticipants={() => room.setShowParticipants((value) => !value)}
                onToggleChat={room.handleToggleChat}
                onLeave={room.showLeaveModal}
              />

              <ReactionPicker
                show={room.showReactionPicker}
                onReact={room.sendReaction}
              />
            </main>

            <ChatPanel isOpen={isChatOpen} uId={uId} />
          </div>
        </div>

        <ParticipantsPanel
          show={room.showParticipants}
          participants={room.participantsArray}
          currentUser={currUserData}
          isHost={isHost}
          onClose={() => room.setShowParticipants(false)}
          onForceMute={room.forceMuteUser}
          onKick={room.kickUser}
        />

        <DeviceSettingsModal
          show={room.showDeviceSettings}
          devices={room.devices}
          selectedAudioDeviceId={room.selectedAudioDeviceId}
          selectedVideoDeviceId={room.selectedVideoDeviceId}
          onClose={() => room.setShowDeviceSettings(false)}
          onChangeAudioDevice={room.changeAudioDevice}
          onChangeVideoDevice={room.changeVideoDevice}
        />
      </div>
    </RoomErrorBoundary>
  );
};

export default RoomMain;