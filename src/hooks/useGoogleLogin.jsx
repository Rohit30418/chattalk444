import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  setPersistence,
  browserLocalPersistence
} from "firebase/auth";

import {
  getFirestore,
  doc,
  setDoc,
  serverTimestamp
} from "firebase/firestore";

import { firebaseApp } from "../services/firebase";
import { useDispatch } from "react-redux";
import { userInfo, loginToggle } from "../redux/action";

// Toast
import { toast } from "react-toastify";

const useGoogleLogin = () => {
  const auth = getAuth(firebaseApp);
  const db = getFirestore(firebaseApp); // Firestore
  const dispatch = useDispatch();

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();

    try {
      // Persist login across sessions
      await setPersistence(auth, browserLocalPersistence);

      // Sign in with Google
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Dispatch user info to Redux
      dispatch(userInfo(user));
      dispatch(loginToggle(true));

      // Save/update user info in Firestore
      const userRef = doc(db, "users", user.uid);
      await setDoc(
        userRef,
        {
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          userid: user.uid,
          onlineStatus: true,
          lastLogin: serverTimestamp() // Firestore timestamp
        },
        { merge: true } // merge:true updates existing fields instead of overwriting
      );

      toast.success("Logged in successfully!");
    } catch (err) {
      console.error("Login failed:", err);
      toast.error(`Login failed: ${err.code} - ${err.message}`);
    }
  };

  return loginWithGoogle;
};

export default useGoogleLogin;
