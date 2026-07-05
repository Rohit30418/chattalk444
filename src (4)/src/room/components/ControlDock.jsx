import { memo } from 'react';
import ControlButton from './ControlButton';

const ControlDock = memo(({
  isAudioEnabled,
  isVideoEnabled,
  isScreenSharing,
  showReactionPicker,
  subtitlesEnabled,
  raisedHand,
  isChatOpen,
  unreadCount,
  totalCount,
  onToggleAudio,
  onToggleVideo,
  onToggleScreenShare,
  onToggleReactions,
  onToggleRaiseHand,
  onToggleSubtitles,
  onToggleParticipants,
  onToggleChat,
  onLeave,
}) => (
  <div className="pointer-events-none absolute inset-x-0 bottom-0 z-50 flex justify-center px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
    <div className="pointer-events-auto flex max-w-[calc(100vw-1rem)] items-center gap-1.5 overflow-x-auto rounded-[1.6rem] border border-white/10 bg-[#050713]/80 p-2 shadow-2xl shadow-black/40 backdrop-blur-2xl sm:gap-2 sm:p-2.5" style={{ scrollbarWidth: 'none' }}>
      <ControlButton
        active={isAudioEnabled}
        onClick={onToggleAudio}
        icon={isAudioEnabled ? 'fa-microphone' : 'fa-microphone-slash'}
        label={isAudioEnabled ? 'Mute' : 'Unmute'}
        danger={!isAudioEnabled}
      />

      <ControlButton
        active={isVideoEnabled}
        onClick={onToggleVideo}
        icon={isVideoEnabled ? 'fa-video' : 'fa-video-slash'}
        label={isVideoEnabled ? 'Cam Off' : 'Cam On'}
        danger={!isVideoEnabled}
        disabled={isScreenSharing}
      />

      <ControlButton
        active={isScreenSharing}
        onClick={onToggleScreenShare}
        icon={isScreenSharing ? 'fa-stop' : 'fa-display'}
        label={isScreenSharing ? 'Stop' : 'Share'}
        accent="blue"
      />

      <ControlButton
        active={showReactionPicker}
        onClick={onToggleReactions}
        icon="fa-face-smile"
        label="React"
        accent="yellow"
      />

      <button
        type="button"
        onClick={onToggleRaiseHand}
        aria-label={raisedHand ? 'Lower hand' : 'Raise hand'}
        aria-pressed={raisedHand}
        className={`flex h-12 min-w-12 flex-col items-center justify-center rounded-2xl px-3 transition-all duration-200 active:scale-95 sm:h-14 sm:min-w-14 sm:px-4 ${
          raisedHand
            ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/25'
            : 'bg-white/8 text-slate-200 ring-1 ring-white/10 hover:bg-white/12'
        }`}
      >
        <span className="text-lg sm:text-xl">✋</span>
        <span className="mt-1 hidden text-[10px] font-bold leading-none sm:block">{raisedHand ? 'Lower' : 'Raise'}</span>
      </button>

      <ControlButton
        active={subtitlesEnabled}
        onClick={onToggleSubtitles}
        icon="fa-closed-captioning"
        label="CC"
        accent="indigo"
      />

      <ControlButton
        active={false}
        onClick={onToggleParticipants}
        icon="fa-users"
        label={`${totalCount}`}
        compact
      />

      <ControlButton
        active={isChatOpen}
        onClick={onToggleChat}
        icon="fa-comment-dots"
        label="Chat"
        accent="indigo"
        badge={unreadCount}
      />

      <div className="mx-1 h-9 w-px shrink-0 bg-white/10" />

      <button
        type="button"
        onClick={onLeave}
        className="flex h-12 min-w-[4.2rem] flex-col items-center justify-center rounded-2xl bg-red-500 px-4 text-white shadow-lg shadow-red-500/30 transition-all duration-200 hover:bg-red-600 active:scale-95 sm:h-14 sm:min-w-[5rem]"
        aria-label="Leave meeting"
      >
        <i className="fas fa-phone-slash text-base sm:text-lg" style={{ transform: 'rotate(135deg)' }} />
        <span className="mt-1 hidden text-[10px] font-black leading-none sm:block">Leave</span>
      </button>
    </div>
  </div>
));

export default ControlDock;
