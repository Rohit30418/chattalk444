import { db } from '../services/firebase';
import { doc, getDoc } from 'firebase/firestore';

const getUserData = async (uid) => {
  try {
    const userDocRef = doc(db, 'users', uid); // Reference to the user document in Firestore
    const userDocSnapshot = await getDoc(userDocRef); // Get the user document snapshot
    if (userDocSnapshot.exists()) {
      // If the user document exists, return the user data
      return userDocSnapshot.data();
    } else {
      console.log('User document not found');
      return null; // Return null if user document doesn't exist
    }
  } catch (error) {
    console.error("Error fetching user data from Firestore:", error);
    return null; // Return null if an error occurs
  }
};

export default getUserData;
