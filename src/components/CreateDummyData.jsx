import { collection, addDoc, setDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '../services/firebase';
const randomId = () => crypto.randomUUID();

const randomRoomTitle = () => {
  const titles = [
    '🎧 Late Night Overthinkers Club',
    '🎶 Singing Badly But Confidently',
    '🥲 Crying in Lo-Fi Beats',
    '🧠 Small Brain Big Opinions',
    '📞 Talking to Strangers Like It’s Therapy',
    '🎤 Mic Check for No Reason',
    '🛸 Alien Support Group',
    '📚 Studying... but just vibes',
    '🕵️ FBI Is Listening Room',
    '☕ Coffee Addicts Anonymous',
    '🌚 People Who Should Be Sleeping',
    '🫠 Socially Awkward Club',
    '💀 Failed a Job Interview, Let’s Talk',
    '🧘 Pretending to Be Calm',
    '😵 I Joined by Mistake',
    '📉 Life Falling Apart Gang',
    '🍕 Talking Until Food Arrives',
    '🎮 Gamers Who Rage Quit',
    '🚪 People Who Just Left Zoom Calls',
    '🦥 Procrastinators Assemble',
    '💬 I Don’t Know Why I’m Here',
    '🎵 Singing Like No One’s Judging (But They Are)',
    '🌧 Sad Songs & Happy People',
    '🗑️ Venting Corner (No Solutions, Just Chaos)',
    '👽 Introverts Uniting... Quietly',
    '🐸 Sipping Tea & Spilling It',
    '👻 Talking to Ghost Followers',
    '🎙️ Rant Room: Enter at Your Own Risk',
    '🔥 Hot Takes & Cold Pizza',
    '🎭 Overdramatic People Only',
    '🥱 Bored People Creating Drama',
    '💡 Shower Thoughts Exchange',
    '🚨 Red Flag Identification Center',
    '📉 Bad Decisions Support Group',
    '🎧 Midnight Podcast Addicts',
    '🎬 Movie Buffs & Popcorn Critics',
    '🎮 Late Night Co-op Screamers',
    '🎤 Open Mic - Zero Talent Allowed',
    '🧃 Juice Box Philosophers',
  ];
  return titles[Math.floor(Math.random() * titles.length)];
};

const randomLanguage = () =>
  [
    'English', 'Hindi', 'Spanish', 'French', 'Arabic', 'Japanese',
    'Russian', 'Portuguese', 'German', 'Mandarin', 'Swahili', 'Turkish',
    'Urdu', 'Korean', 'Avestan'
  ][Math.floor(Math.random() * 15)];

const randomLevel = () =>
  ['#beginner', '#elementary', '#intermediate', '#upper-intermediate', '#advanced', '#native']
    [Math.floor(Math.random() * 6)];

const randomName = (i = 0) =>
  [
    'Rohit', 'Neha', 'Aarav', 'Isha', 'Jake', 'Olivia', 'Camille', 'Louis',
    'Omar', 'Layla', 'Kwame', 'Zuri', 'Yuki', 'Hiro', 'Mateo', 'Valentina',
    'Chen', 'Fatima', 'Ahmed', 'Sofia', 'Jean', 'Raj', 'Sara', 'Ali'
  ][Math.floor(Math.random() * 24)] + i;

const avatarStyles = [
  'adventurer', 'avataaars', 'fun-emoji', 'bottts',
  'pixel-art', 'croodles', 'miniavs', 'open-peeps'
];

const randomPhoto = (seed) => {
  const style = avatarStyles[Math.floor(Math.random() * avatarStyles.length)];
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(seed)}`;
};

export const CreateDummyData = async () => {
  try {
    for (let roomIndex = 1; roomIndex <= 6; roomIndex++) {
      const maxPeople = Math.floor(Math.random() * 5) + 2;

      const roomData = {
        Title: `${randomRoomTitle()} #${roomIndex}`,
        Language: randomLanguage(),
        Level: randomLevel(),
        MaximumPeople: maxPeople.toString(),
        ownerUid: randomId(),
        ownerName: randomName(),
        ownerPhoto: randomPhoto(`owner${roomIndex}`),
        roomImg: '',
        timestampField: Timestamp.now(),
      };

      const roomRef = await addDoc(collection(db, 'rooms'), roomData);
      const roomId = roomRef.id;
      console.log(`Created room ${roomIndex} with ID: ${roomId}`);

      for (let p = 1; p <= maxPeople; p++) {
        const userName = randomName(p);
        const participantData = {
          uid: randomId(),
          name: userName,
          photo: randomPhoto(userName),
          peerId: randomId(),
          isAudioEnabled: Math.random() > 0.5,
          isVideoEnabled: Math.random() > 0.5,
          isChatWindowOpen: Math.random() > 0.5,
          timestampField: Date.now(),
        };

        await setDoc(doc(db, 'rooms', roomId, 'participants', participantData.uid), participantData);
      }

      console.log(`Added ${maxPeople} participants to room ${roomIndex}`);
    }

    console.log('✅ All 34 rooms with participants created!');
  } catch (error) {
    console.error('❌ Error creating rooms and participants:', error);
  }
};
