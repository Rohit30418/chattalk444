import {useEffect } from "react";
import { useSelector } from 'react-redux';
import { db } from '../../firebase';
import { doc, updateDoc } from 'firebase/firestore';

const useOnlineStatus = (status) => {

  const uid = useSelector((state) => state.userData.uid);
  useEffect(() => {
    const updateUserOnlineStatus = async () => {
      const userRef = doc(db, "users", uid);
      try {
        await updateDoc(userRef, {
          onlineStatus: status,
        });
        console.log('User online status updated successfully');
      } catch (error) {
        console.error('Error updating user online status:', error);
      }
    };

    updateUserOnlineStatus();
  }, [status]);

  
};

export default useOnlineStatus;
