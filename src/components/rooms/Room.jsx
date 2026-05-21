import React from 'react';
import ScreenBeforeJoin from './ScreenBeforeJoin';
import RoomMain from './RoomMain';
import { useSelector } from 'react-redux';
import { useAuth } from '../auth/AppWrapper';

const Room = () => {
  // 1. Keep Redux for the UI toggle state
  const tooglePrescreenRoom = useSelector((state) => state.tooglePrescreenRoom);
  
  // 2. Use your custom Context for the User data (MERN Upgrade!)
  const { user } = useAuth();

  return (
    <div>
      {tooglePrescreenRoom ? (
        /* We removed the userData prop because ScreenBeforeJoin grabs it internally now! */
        <ScreenBeforeJoin />
      ) : (
        /* Pass the safe MongoDB user ID down to the main WebRTC room */
        <RoomMain uId={user?.uid} />
      )}
    </div>
  );
};

export default Room;