import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  setPersistence,
  browserLocalPersistence
} from "firebase/auth";
import { firebaseApp } from "../services/firebase";
import { useDispatch } from "react-redux";
import { userInfo, loginToggle } from "../redux/action";
import { toast } from "react-toastify";

const useGoogleLogin = () => {
  const auth = getAuth(firebaseApp);
  const dispatch = useDispatch();
  const backendUrl = import.meta.env?.VITE_BACKEND_URL || "http://localhost:5000";

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();

    try {
      // Persist login across sessions
      await setPersistence(auth, browserLocalPersistence);

      // Sign in with Google Popup
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Dispatch user info to Redux instantly for snappy UI
      dispatch(userInfo(user));
      dispatch(loginToggle(true));


      const response = await fetch(`${backendUrl}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: user.uid,
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
        }),
      });

      if (!response.ok) throw new Error("Failed to sync with MongoDB");

      toast.success("Logged in successfully!");
    } catch (err) {
      toast.error(`Login failed: ${err.message}`);
    }
  };

  return loginWithGoogle;
};

export default useGoogleLogin;