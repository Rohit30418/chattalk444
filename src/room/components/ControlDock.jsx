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
    <div
      className="pointer-events-auto flex max-w-[calc(100vw-1rem)] items-center gap-1.5 overflow-x-auto rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-2 sm:gap-2 sm:p-2.5"
      style={{ scrollbarWidth: 'none' }}
    >
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

      <div className="hidden sm:block">
        <ControlButton
          active={isScreenSharing}
          onClick={onToggleScreenShare}
          icon={isScreenSharing ? 'fa-stop' : 'fa-display'}
          label={isScreenSharing ? 'Stop' : 'Share'}
          accent="blue"
        />
      </div>

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
        className={`flex h-12 min-w-12 flex-col items-center justify-center rounded-xl border px-3 transition-colors duration-150 active:scale-95 sm:h-14 sm:min-w-14 sm:px-4 ${
          raisedHand
            ? 'border-amber-500 bg-amber-500 text-white'
            : 'border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-muted)] hover:bg-[var(--color-primary-soft)] hover:text-[var(--color-primary-700)]'
        }`}
      >
        <span className="text-lg sm:text-xl">✋</span>
        <span className="mt-1 hidden text-[10px] font-bold leading-none sm:block">
          {raisedHand ? 'Lower' : 'Raise'}
        </span>
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

      <div className="mx-1 h-9 w-px shrink-0 bg-[var(--color-border)]" />

      <button
        type="button"
        onClick={onLeave}
        className="flex h-12 min-w-[4.2rem] flex-col items-center justify-center rounded-xl bg-red-500 px-4 text-white transition-colors duration-150 hover:bg-red-600 active:scale-95 sm:h-14 sm:min-w-[5rem]"
        aria-label="Leave meeting"
      >
        <i className="fas fa-phone-slash text-base sm:text-lg" style={{ transform: 'rotate(135deg)' }} />
        <span className="mt-1 hidden text-[10px] font-black leading-none sm:block">Leave</span>
      </button>
    </div>
  </div>
));

export default ControlDock;
