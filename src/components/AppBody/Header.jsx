import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getAuth } from 'firebase/auth';
import { firebaseApp } from '../../services/firebase';
import { loginToggle } from '../../redux/action';
import { Link } from 'react-router-dom';
import useGoogleLogin from "../../hooks/useGoogleLogin";
import Loading from '../common/Loading';
import Swal from "sweetalert2";

const Header = () => {
  const [showDetails, setShowDetails] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  
  // Theme State
  const [theme, setTheme] = useState(
    localStorage.getItem("theme") ? localStorage.getItem("theme") : "light"
  );

  const dispatch = useDispatch();
  const userdata = useSelector((state) => state.userData);
  const loginStatus = useSelector((state) => state.loginStatus);
  const auth = getAuth(firebaseApp);
  const signInWithGoogle = useGoogleLogin();

  // 1. Handle Scroll Detection
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // 2. Handle Theme Toggle & Persistence
  useEffect(() => {
    const htmlElement = document.documentElement;
    if (theme === "dark") {
      htmlElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      htmlElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  // 3. Handle Sign Out
  const showModal = () => {
    Swal.fire({
      title: "Are you sure?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes",
      customClass: {
        popup: 'dark:bg-gray-800 dark:text-white' // SweetAlert Dark Mode support
      }
    }).then((result) => {
      if (result.isConfirmed) {
        signOut();
      }
    });
  };

  function signOut() {
    auth.signOut().then(() => {
      dispatch(loginToggle(false));
    }).catch((error) => {
      console.error('Error signing out:', error);
    });
  }

  // 4. Online Users Simulation
  const [onlineUsers, setOnlineUsers] = useState(1243);
  useEffect(() => {
    const interval = setInterval(() => {
      const change = Math.floor(Math.random() * 7) - 3;
      setOnlineUsers(prev => prev + change);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header
      className={`
        fixed top-0 border-b-2 border-slate-200 dark:border-slate-700 left-0 w-full z-50 transition-all duration-300 px-4
        ${scrolled 
          ? "bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-lg border-b border-gray-200 dark:border-gray-800 py-3" 
          : "bg-transparent py-5"
        }
      `}
    >
      <div className='max-w-7xl  mx-auto flex justify-between items-center w-full'>
        
        {/* Logo */}
        <Link to="/">
          <h2 className="text-gray-900 dark:text-white text-3xl font-extrabold tracking-tight flex items-center gap-2 transition-colors">
            Vaani
            <i className="fa fa-comments text-primary animate-pulse"></i>
          </h2>
        </Link>

        {/* Right Section */}
        <div className='flex items-center gap-4'>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-yellow-300 hover:bg-gray-200 dark:hover:bg-slate-700 transition-all shadow-sm"
            aria-label="Toggle Dark Mode"
          >
            {theme === "dark" ? (
              // Sun Icon
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
              </svg>
            ) : (
              // Moon Icon
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-600">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
              </svg>
            )}
          </button>

          {/* Online Users Badge */}
          <div className="hidden md:flex items-center gap-2 text-green-700 dark:text-green-400 font-bold bg-white dark:bg-slate-800 px-3 py-1 rounded-full shadow-sm text-sm border border-gray-100 dark:border-slate-700 transition-colors">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            {onlineUsers.toLocaleString()} <span className="hidden lg:inline">online</span>
          </div>

          {/* Auth Logic */}
          {loginStatus ? (
            userdata ? (
              <div className="flex items-center gap-4">
                <div
                  className="relative z-50"
                  onMouseEnter={() => setShowDetails(true)}
                  onMouseLeave={() => setShowDetails(false)}
                >
                  {/* <Link to={`/MyProfile/${userdata.uid}`} className='relative block'> */}
                    <div className='relative block'>
                    <img
                      src={userdata.photoURL}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-full ring-2 ring-purple-500 cursor-pointer shadow-md transition-transform hover:scale-105 object-cover"
                      alt="Profile"
                    />
                    <span className='bg-green-500 w-3 h-3 rounded-full absolute top-0 right-0 border-2 border-white dark:border-slate-900'></span>
                  </div>

                  {/* Dropdown Menu */}
                  {showDetails && (
                    <div className="
                      absolute right-0 top-full mt-2 w-64
                      bg-white dark:bg-slate-800 
                      border border-gray-100 dark:border-slate-700
                      rounded-xl shadow-2xl p-4
                      animate-fade-in-up
                    ">
                      <div className="flex items-center gap-3 mb-3 pb-3 border-b border-gray-100 dark:border-slate-700">
                         <img src={userdata.photoURL} className="w-10 h-10 rounded-full" alt="" />
                         <div className="overflow-hidden">
                           <p className="font-semibold text-gray-800 dark:text-white truncate">
                             {userdata.displayName}
                           </p>
                           <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                             {userdata.email}
                           </p>
                         </div>
                      </div>

                      <button
                        onClick={showModal}
                        className="w-full flex items-center justify-center gap-2 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 font-medium py-2 rounded-lg transition-colors"
                      >
                        <i className="fa fa-sign-out"></i> Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <Loading />
            )
          ) : (
            <button
              onClick={signInWithGoogle}
              className="bg-primary hover:bg-primary/90 text-white font-medium py-2 px-6 rounded-lg shadow-md transition-all hover:-translate-y-0.5"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;