import { doc, setDoc, getDoc, deleteDoc, collection } from 'firebase/firestore';
import { db } from '../../firebase';
import { useParams } from 'react-router';
import { useCallback } from 'react';

const useCreateFriends = () => {
  const { uId } = useParams();

  const addFriend = useCallback(async (friendId) => {

console.log(friendId);


    if (!uId || !friendId) {
      console.error('User ID and Friend ID must be provided');
      return;
    }

    try {
      // Get references to the current user's following and target user's followers
      const currentUserFollowingRef = doc(db, 'users', uId, 'following', friendId);
      const targetUserFollowersRef = doc(db, 'users', friendId, 'followers', uId);

      // Fetch data to check if the target user is following the current user
      const targetUserFollowersDoc = await getDoc(targetUserFollowersRef);
      const isCurrentFollowingTarget = targetUserFollowersDoc.exists();

      if (isCurrentFollowingTarget) {
        // If the current user is already followed by the target user, make them friends
        const currentUserFriendsRef = collection(db, 'users', uId, 'friends');
        const targetUserFriendsRef = collection(db, 'users', friendId, 'friends');

        await Promise.all([
          setDoc(doc(currentUserFriendsRef, friendId), { userId: friendId,
            timestampField:Date.now()
           }),
          setDoc(doc(targetUserFriendsRef, uId), { userId: uId ,
            timestampField:Date.now()
          }),
          deleteDoc(currentUserFollowingRef),
          deleteDoc(targetUserFollowersRef),
        ]);

        console.log("Both users are now friends");

      } else {
        // Otherwise, add the follow relationship
        await setDoc(currentUserFollowingRef, { userId: friendId });
        await setDoc(targetUserFollowersRef, { userId: uId });

        // Check if the target user is now following the current user after the follow is added
        const currentUserFollowingDoc = await getDoc(doc(db, 'users', friendId, 'following', uId));
        const isTargetFollowingCurrent = currentUserFollowingDoc.exists();

        if (isTargetFollowingCurrent) {
          // If the target user is now following the current user, make them friends
          const currentUserFriendsRef = collection(db, 'users', uId, 'friends');
          const targetUserFriendsRef = collection(db, 'users', friendId, 'friends');

          await Promise.all([
            setDoc(doc(currentUserFriendsRef, friendId), { userId: friendId,
              timestampField:Date.now()
             }),
            setDoc(doc(targetUserFriendsRef, uId), { userId: uId ,
              timestampField:Date.now()
            }),
            deleteDoc(currentUserFollowingRef),
            deleteDoc(targetUserFollowersRef),
            deleteDoc(doc(db, 'users', friendId, 'followers', uId)),
          ]);

          console.log("Both users are now friends");
        }
      }
    } catch (error) {
      console.error('Error adding friend:', error);
    }
  }, [uId]);

  return addFriend;
};

export default useCreateFriends;
