// firebaseDummyData.js
import { collection, addDoc, setDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';

const randomId = () => crypto.randomUUID();

const randomRoomTitle = () => ['My Room', 'Chat Lounge', 'Study Group', 'Gaming Hub', 'Language Club', 'Fun Zone'][Math.floor(Math.random() * 6)];
const randomLanguage = () => ['English', 'Avestan', 'Spanish', 'Hindi', 'French'][Math.floor(Math.random() * 5)];
const randomLevel = () => ['#beginner', '#intermediate', '#advanced', '#upper-advanced'][Math.floor(Math.random() * 4)];
const randomName = (i = 0) => ['Antonio', 'Alice', 'Bob', 'Charlie', 'David', 'Eva'][Math.floor(Math.random() * 6)] + i;
const randomPhoto = (seed) => `https://api.dicebear.com/7.x/pixel-art/svg?seed=${seed}`;

export const createRoomsWithParticipants = async () => {
  try {
    for (let roomIndex = 1; roomIndex <= 34; roomIndex++) {
      const roomData = {
        Title: `${randomRoomTitle()} #${roomIndex}`,
        Language: randomLanguage(),
        Level: randomLevel(),
        MaximumPeople: (Math.floor(Math.random() * 10) + 1).toString(),
        ownerUid: randomId(),
        ownerName: randomName(),
        ownerPhoto: randomPhoto(`owner${roomIndex}`),
        roomImg: '',
        timestampField: Timestamp.now(),
      };

      const roomRef = await addDoc(collection(db, 'rooms'), roomData);
      const roomId = roomRef.id;
      console.log(`Created room ${roomIndex} with ID: ${roomId}`);

      const numParticipants = Math.floor(Math.random() * 10) + 1;

      for (let p = 1; p <= numParticipants; p++) {
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

      console.log(`Added ${numParticipants} participants to room ${roomIndex}`);
    }

    console.log('All 34 rooms with participants created!');
  } catch (error) {
    console.error('Error creating rooms and participants:', error);
  }
};
