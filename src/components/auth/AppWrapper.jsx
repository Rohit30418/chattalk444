import React, { useEffect } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { firebaseApp } from "../../services/firebase";
import { useDispatch } from "react-redux";
import { userInfo, loginToggle } from "../../redux/action";


const auth = getAuth(firebaseApp);

const AppWrapper = ({ children }) => {
  const dispatch = useDispatch();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        dispatch(userInfo(user));
        dispatch(loginToggle(true));
      } else {
        dispatch(loginToggle(false));
      }
    });

    return () => unsubscribe();
  }, []);

  return children;
};

export default AppWrapper;
