import { db } from '../../firebase';
import {doc, setDoc } from 'firebase/firestore';

const addUserToFirestore = async (uid, userData) => {
  try {
    const userDocRef = doc(db, 'users', uid); // Reference to the user document in Firestore
    await setDoc(userDocRef, userData); // Set the user data in the document
    console.log("User data added successfully");
  } catch (error) {
    console.error("Error adding user data to Firestore:", error);
  }
};

export default addUserToFirestore;
