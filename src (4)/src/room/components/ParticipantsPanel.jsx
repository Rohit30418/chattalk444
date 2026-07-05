import { memo } from 'react';

const ParticipantsPanel = memo(({
  show,
  participants,
  currentUser,
  isHost,
  onClose,
  onForceMute,
  onKick,
}) => {
  if (!show) return null;

  return (
    <>
      <button
        type="button"
        aria-label="Close participants"
        className="fixed inset-0 z-[55] bg-black/20 backdrop-blur-[1px]"
        onClick={onClose}
      />

      <aside
        className="fixed bottom-0 right-0 top-auto z-[60] max-h-[78dvh] w-full overflow-hidden rounded-t-[2rem] border border-white/10 bg-[#080d1c]/95 shadow-2xl backdrop-blur-2xl md:bottom-auto md:top-20 md:mr-4 md:max-h-[calc(100dvh-7rem)] md:w-80 md:rounded-[2rem]"
        style={{ animation: 'roomFadeInUp 0.2s ease-out' }}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <h3 className="text-sm font-black text-white">Participants</h3>
            <p className="mt-0.5 text-xs text-slate-500">{participants.length + 1} in this room</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/8 text-slate-300 hover:bg-white/12"
            aria-label="Close participants panel"
          >
            <i className="fa-solid fa-times text-xs" />
          </button>
        </div>

        <div className="max-h-[calc(78dvh-5rem)] overflow-y-auto p-4 md:max-h-[calc(100dvh-12rem)]">
          <div className="mb-2 flex items-center gap-3 rounded-2xl bg-white/6 p-3 ring-1 ring-white/8">
            <img
              src={currentUser?.photoURL || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'}
              alt="You"
              className="h-10 w-10 rounded-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-black text-white">You</p>
              <p className="text-xs text-slate-500">{isHost ? 'Host' : 'Participant'}</p>
            </div>
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          </div>

          {participants.map((participant) => (
            <div key={participant.uid} className="mb-2 flex items-center gap-3 rounded-2xl bg-white/6 p-3 ring-1 ring-white/8">
              <img
                src={participant.photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${participant.uid}`}
                alt={participant.name || 'User'}
                className="h-10 w-10 rounded-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-black text-white">{participant.name || 'User'}</p>
                <p className="text-xs text-slate-500">
                  {participant.isAudioEnabled ? 'Mic on' : 'Muted'} · {participant.isVideoEnabled ? 'Camera on' : 'Camera off'}
                </p>
              </div>

              {isHost && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onForceMute?.(participant.uid)}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/15 text-amber-300 hover:bg-amber-500/25"
                    title="Force mute"
                  >
                    <i className="fa-solid fa-microphone-slash text-[11px]" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onKick?.(participant.uid)}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/15 text-red-300 hover:bg-red-500/25"
                    title="Kick user"
                  >
                    <i className="fa-solid fa-user-xmark text-[11px]" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </aside>
    </>
  );
});

export default ParticipantsPanel;
