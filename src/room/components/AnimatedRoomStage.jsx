import { memo, useMemo } from 'react';
import MemberAvatar from '../../components/common/MemberAvatar';
import VideoTile from './VideoTile';

const SLOT_POSITIONS = [
  'left-[6%] top-[14%]',
  'left-1/2 top-[8%] -translate-x-1/2',
  'right-[6%] top-[14%]',
  'left-[4%] top-[48%]',
  'right-[4%] top-[48%]',
  'left-[13%] bottom-[10%]',
  'left-1/2 bottom-[5%] -translate-x-1/2',
  'right-[13%] bottom-[10%]',
];

const Firefly = ({ className = '', delay = '0s' }) => (
  <span
    aria-hidden="true"
    className={`pointer-events-none absolute h-1.5 w-1.5 rounded-full bg-amber-200 shadow-[0_0_14px_rgba(253,224,71,.95)] ${className}`}
    style={{ animation: `vaaniFirefly 4.8s ease-in-out ${delay} infinite alternate` }}
  />
);

const Campfire = () => (
  <div className="pointer-events-none absolute left-1/2 top-[58%] z-[2] -translate-x-1/2 -translate-y-1/2 text-center">
    <div className="absolute left-1/2 top-1/2 h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-500/10 blur-3xl" />
    <div className="relative mx-auto flex h-24 w-24 items-end justify-center">
      <span className="absolute bottom-2 h-16 w-12 rounded-[55%_45%_55%_45%] bg-orange-500 blur-[1px]" style={{ animation: 'vaaniFlame 1.15s ease-in-out infinite alternate' }} />
      <span className="absolute bottom-3 h-12 w-8 rounded-[55%_45%_55%_45%] bg-amber-300" style={{ animation: 'vaaniFlame .9s ease-in-out .15s infinite alternate' }} />
      <span className="absolute bottom-3 h-7 w-4 rounded-full bg-yellow-100" />
      <span className="absolute bottom-0 left-4 h-3 w-16 rotate-12 rounded-full bg-amber-950" />
      <span className="absolute bottom-0 right-4 h-3 w-16 -rotate-12 rounded-full bg-amber-950" />
    </div>
    <div className="mt-2 rounded-full border border-amber-300/10 bg-black/25 px-4 py-1.5 backdrop-blur-md">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-100/80">Speak freely</p>
    </div>
  </div>
);

const AudioSeat = memo(({ person, isHost }) => {
  const isLocal = Boolean(person.isLocal);
  const avatarUser = {
    uid: isLocal ? undefined : person.uid,
    displayName: person.displayName || person.name || 'Participant',
    photoURL: person.photoURL || person.photo || '',
    ...(person.memberProfile || {}),
  };

  const name = isLocal ? 'You' : (person.displayName || person.name || 'Participant');

  return (
    <div className="group relative flex flex-col items-center text-center">
      <div className={`relative rounded-full p-1.5 transition-transform duration-300 group-hover:-translate-y-1 ${person.isSpeaking ? 'bg-emerald-400/25 shadow-[0_0_30px_rgba(52,211,153,.35)]' : 'bg-white/[0.05]'}`}>
        {person.isSpeaking && (
          <>
            <span className="absolute inset-0 animate-ping rounded-full border border-emerald-300/35" />
            <span className="absolute -inset-2 rounded-full border border-emerald-300/15" />
          </>
        )}
        <MemberAvatar
          user={avatarUser}
          src={avatarUser.photoURL}
          name={name}
          className="relative z-10 h-16 w-16 sm:h-20 sm:w-20 lg:h-24 lg:w-24"
          avatarClassName="border-[3px] border-white/15 bg-slate-900 shadow-xl"
          roundedClass="rounded-full"
          loading="eager"
        />
        <span className={`absolute -bottom-1 -right-1 z-20 flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#07111f] text-[10px] ${person.isAudioOn ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
          <i className={`fa-solid ${person.isAudioOn ? 'fa-microphone' : 'fa-microphone-slash'}`} />
        </span>
      </div>

      <div className="mt-2 max-w-[120px] rounded-xl border border-white/[0.06] bg-black/30 px-3 py-1.5 backdrop-blur-md">
        <div className="flex items-center justify-center gap-1.5">
          <p className="truncate text-xs font-black text-white">{name}</p>
          {isLocal && isHost && <span className="text-[10px] text-amber-300">♛</span>}
        </div>
        <p className={`mt-0.5 text-[9px] font-bold uppercase tracking-[0.12em] ${person.isSpeaking ? 'text-emerald-300' : 'text-slate-400'}`}>
          {person.isSpeaking ? 'Speaking' : person.raisedHand ? 'Hand raised' : 'Listening'}
        </p>
      </div>

      {person.raisedHand && (
        <span className="absolute -right-1 top-0 z-30 rounded-full bg-amber-400 px-2 py-1 text-xs shadow-lg">✋</span>
      )}
    </div>
  );
});

const CameraSeat = memo(({ person, commonTileProps }) => (
  <div className="h-28 w-44 sm:h-32 sm:w-52 lg:h-36 lg:w-56">
    <VideoTile
      videoRef={person.videoRef}
      stream={person.stream}
      isVideoOn={person.isVideoOn}
      isAudioOn={person.isAudioOn}
      isSpeaking={person.isSpeaking}
      isScreenSharing={person.isScreenSharing}
      displayName={person.displayName || person.name}
      photoURL={person.photoURL || person.photo}
      isLocal={person.isLocal}
      uid={person.isLocal ? undefined : person.uid}
      peerId={person.peerId}
      reactions={person.reactions}
      raisedHand={person.raisedHand}
      quality={person.quality}
      {...commonTileProps}
    />
  </div>
));

const AnimatedRoomStage = memo(({
  localTile,
  participants = [],
  totalCount,
  commonTileProps,
}) => {
  const people = useMemo(() => ([
    {
      ...localTile,
      id: 'local',
      isLocal: true,
      displayName: localTile?.displayName || 'You',
    },
    ...participants.map((participant) => ({
      ...participant,
      id: participant.uid,
      isLocal: false,
      displayName: participant.name || participant.displayName || 'Participant',
      photoURL: participant.photo || participant.photoURL || '',
      isVideoOn: participant.isVideoEnabled,
      isAudioOn: participant.isAudioEnabled,
    })),
  ]), [localTile, participants]);

  const visiblePeople = people.slice(0, SLOT_POSITIONS.length);
  const overflowCount = Math.max(0, people.length - visiblePeople.length);

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#06111b]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_10%,rgba(14,116,144,.22),transparent_30%),radial-gradient(circle_at_20%_70%,rgba(16,185,129,.10),transparent_26%),radial-gradient(circle_at_80%_65%,rgba(124,58,237,.13),transparent_30%),linear-gradient(180deg,#07111f_0%,#08131d_48%,#051019_100%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[42%] bg-[radial-gradient(ellipse_at_center,rgba(120,53,15,.20),transparent_52%)]" />

      <div className="pointer-events-none absolute left-[10%] top-[10%] h-28 w-20 rounded-full bg-amber-300/5 blur-2xl" />
      <div className="pointer-events-none absolute right-[12%] top-[12%] h-32 w-24 rounded-full bg-amber-300/5 blur-2xl" />
      <div className="pointer-events-none absolute left-8 top-6 text-5xl opacity-[0.06]">✦</div>
      <div className="pointer-events-none absolute right-12 top-10 text-4xl opacity-[0.07]">✦</div>

      <Firefly className="left-[18%] top-[39%]" />
      <Firefly className="left-[34%] top-[30%]" delay=".8s" />
      <Firefly className="right-[32%] top-[34%]" delay="1.5s" />
      <Firefly className="right-[16%] top-[43%]" delay="2.2s" />
      <Firefly className="left-[26%] bottom-[24%]" delay=".4s" />
      <Firefly className="right-[25%] bottom-[20%]" delay="1.9s" />

      <div className="pointer-events-none absolute left-5 top-5 z-[3] hidden rounded-2xl border border-white/10 bg-black/25 px-4 py-3 backdrop-blur-md sm:block">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-300">Conversation lounge</p>
        <p className="mt-1 text-xs font-semibold text-slate-300">Audio-first room · cameras appear naturally</p>
      </div>

      <Campfire />

      <div className="absolute inset-0 z-10 hidden sm:block">
        {visiblePeople.map((person, index) => {
          const cameraOn = Boolean(person.isVideoOn && person.stream);
          return (
            <div key={person.id || index} className={`absolute ${SLOT_POSITIONS[index] || SLOT_POSITIONS[0]}`}>
              {cameraOn
                ? <CameraSeat person={person} commonTileProps={commonTileProps} />
                : <AudioSeat person={person} isHost={commonTileProps?.isHost} />}
            </div>
          );
        })}
      </div>

      <div className="relative z-10 grid h-full grid-cols-2 content-start gap-x-3 gap-y-5 overflow-y-auto px-4 pb-32 pt-16 sm:hidden">
        {visiblePeople.map((person, index) => {
          const cameraOn = Boolean(person.isVideoOn && person.stream);
          return (
            <div key={person.id || index} className="flex min-w-0 justify-center">
              {cameraOn
                ? <CameraSeat person={person} commonTileProps={commonTileProps} />
                : <AudioSeat person={person} isHost={commonTileProps?.isHost} />}
            </div>
          );
        })}
      </div>

      {overflowCount > 0 && (
        <div className="absolute right-5 top-5 z-30 rounded-full border border-white/10 bg-black/40 px-3 py-1.5 text-[10px] font-black text-slate-200 backdrop-blur-md">
          +{overflowCount} more
        </div>
      )}

      <div className="pointer-events-none absolute bottom-20 left-1/2 z-[3] -translate-x-1/2 rounded-full border border-white/[0.06] bg-black/25 px-4 py-2 text-center backdrop-blur-md">
        <p className="whitespace-nowrap text-[10px] font-bold text-slate-300">
          {totalCount || people.length} {Number(totalCount || people.length) === 1 ? 'learner' : 'learners'} in the room
        </p>
      </div>
    </div>
  );
});

export default AnimatedRoomStage;
