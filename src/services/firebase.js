import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';


// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCouMqbYG4VLwFEj6sFfxIlbE8GXQz1EUM",
  authDomain: "bro-talk-ac21b.firebaseapp.com",
  databaseURL: "https://bro-talk-ac21b-default-rtdb.firebaseio.com",
  projectId: "bro-talk-ac21b",
  storageBucket: "bro-talk-ac21b.appspot.com",
  messagingSenderId: "347740247465",
  appId: "1:347740247465:web:fd008e04a3b5791a37e0b8",
  measurementId: "G-XBHRRQJ9GR"
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);
const storage = getStorage(firebaseApp);

export { firebaseApp, db, storage };
