import { memo } from 'react';

const ParticipantsPanel = memo(({
  show,
  participants,
  currentUser,
  isHost,
  onClose,
  onForceMute,
  onKick,
  onEndRoom,
  onOpenProfile,
}) => {
  if (!show) return null;

  return (
    <>
      <button
        type="button"
        aria-label="Close participants"
        className="fixed inset-0 z-[55] bg-black/20"
        onClick={onClose}
      />

      <aside
        className="fixed bottom-0 right-0 top-auto z-[60] max-h-[78dvh] w-full overflow-hidden rounded-t-2xl border border-[var(--color-border)] bg-[var(--color-surface)] md:bottom-auto md:top-20 md:mr-4 md:max-h-[calc(100dvh-7rem)] md:w-80 md:rounded-2xl"
        style={{ animation: 'roomFadeInUp 0.2s ease-out' }}
      >
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-[var(--color-text)]">
                {isHost ? 'Host controls' : 'Participants'}
              </h3>
              {isHost && (
                <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.12em] text-amber-500">
                  Host
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-[var(--color-soft)]">{participants.length + 1} in this room</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-muted)] hover:bg-[var(--color-primary-soft)]"
            aria-label="Close participants panel"
          >
            <i className="fa-solid fa-times text-xs" />
          </button>
        </div>

        <div className="max-h-[calc(78dvh-5rem)] overflow-y-auto p-4 md:max-h-[calc(100dvh-12rem)]">
          {isHost && (
            <div className="mb-3 rounded-xl border border-amber-500/20 bg-amber-500/[0.08] px-3 py-2.5">
              <div className="flex items-start gap-2">
                <i className="fa-solid fa-shield-halved mt-0.5 text-xs text-amber-500" />
                <p className="text-[11px] font-semibold leading-5 text-[var(--color-muted)]">
                  You are the host. You can force mute, remove participants, or end the room for everyone.
                </p>
              </div>
            </div>
          )}

          <div className="mb-2 flex items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-3">
            <img
              src={currentUser?.photoURL || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'}
              alt="You"
              className="h-10 w-10 rounded-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-black text-[var(--color-text)]">You</p>
              <p className="text-xs text-[var(--color-soft)]">{isHost ? 'Host' : 'Participant'}</p>
            </div>
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          </div>

          {participants.map((participant) => (
            <div key={participant.uid} className="mb-2 flex items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-3">
              <button
                type="button"
                onClick={() => onOpenProfile?.(participant.uid)}
                className="flex min-w-0 flex-1 items-center gap-3 rounded-lg text-left outline-none transition hover:bg-[var(--color-primary-soft)] focus-visible:ring-2 focus-visible:ring-[var(--color-secondary)]"
                title={`View ${participant.name || 'participant'} profile`}
              >
                <img
                  src={participant.photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${participant.uid}`}
                  alt={participant.name || 'User'}
                  className="h-10 w-10 shrink-0 rounded-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-black text-[var(--color-text)]">{participant.name || 'User'}</p>
                    <i className="fa-solid fa-chevron-right text-[9px] text-[var(--color-soft)]" />
                  </div>
                  <p className="text-xs text-[var(--color-soft)]">
                    {participant.isAudioEnabled ? 'Mic on' : 'Muted'} · {participant.isVideoEnabled ? 'Camera on' : 'Camera off'}
                  </p>
                </div>
              </button>

              {isHost && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onForceMute?.(participant.uid)}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/15 text-amber-500 hover:bg-amber-500/25"
                    title={`Force mute ${participant.name || 'participant'}`}
                    aria-label={`Force mute ${participant.name || 'participant'}`}
                  >
                    <i className="fa-solid fa-microphone-slash text-[11px]" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onKick?.(participant.uid)}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/15 text-red-500 hover:bg-red-500/25"
                    title={`Remove ${participant.name || 'participant'}`}
                    aria-label={`Remove ${participant.name || 'participant'}`}
                  >
                    <i className="fa-solid fa-user-xmark text-[11px]" />
                  </button>
                </div>
              )}
            </div>
          ))}

          {isHost && (
            <div className="mt-4 border-t border-[var(--color-border)] pt-4">
              <button
                type="button"
                onClick={onEndRoom}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-xs font-black text-red-500 transition-colors hover:bg-red-500/15"
              >
                <i className="fa-solid fa-phone-slash text-[11px]" />
                End room for everyone
              </button>
              <p className="mt-2 text-center text-[10px] leading-4 text-[var(--color-soft)]">
                This closes the room immediately for every participant.
              </p>
            </div>
          )}
        </div>
      </aside>
    </>
  );
});

export default ParticipantsPanel;
