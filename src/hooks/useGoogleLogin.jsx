import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  setPersistence,
  browserLocalPersistence,
} from 'firebase/auth';
import { firebaseApp } from '../services/firebase';
import { useDispatch } from 'react-redux';
import { userInfo, loginToggle } from '../redux/action';
import { toast } from 'react-toastify';

const useGoogleLogin = () => {
  const auth = getAuth(firebaseApp);
  const dispatch = useDispatch();

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();

    try {
      await setPersistence(auth, browserLocalPersistence);

      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      dispatch(userInfo(user));
      dispatch(loginToggle(true));

      toast.success('Logged in successfully!');
    } catch (err) {
      toast.error(`Login failed: ${err.message}`);
    }
  };

  return loginWithGoogle;
};

export default useGoogleLogin;
