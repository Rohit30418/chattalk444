import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getAuth } from 'firebase/auth';
import { firebaseApp } from '../../services/firebase';
import { loginToggle } from '../../redux/action';
import { Link, NavLink } from 'react-router-dom'; // Added NavLink
import useGoogleLogin from "../../hooks/useGoogleLogin";
import Loading from '../common/Loading';
import Swal from "sweetalert2";
import SpinWheelModal from './SpinWheelModal';

const Header = () => {
  const [showDetails, setShowDetails] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showOffer, setShowOffer] = useState(false);
  const [showBanner, setShowBanner] = useState(true);
  const [timeLeft, setTimeLeft] = useState({ h: 2, m: 59, s: 28 });

  // Theme State
  const [theme, setTheme] = useState(
    localStorage.getItem("theme") ? localStorage.getItem("theme") : "light"
  );

  const dispatch = useDispatch();
  const userdata = useSelector((state) => state.userData);
  const loginStatus = useSelector((state) => state.loginStatus);
  const auth = getAuth(firebaseApp);
  const signInWithGoogle = useGoogleLogin();

  // --- 1. AUTO-SHOW SPINNER LOGIC (Every 2 Hours) ---
  useEffect(() => {
    const checkSpinnerTime = () => {
      const lastShown = localStorage.getItem('last_spin_time');
      const now = Date.now();
      const TWO_HOURS = 2 * 60 * 60 * 1000; 

      if (!lastShown || (now - parseInt(lastShown) > TWO_HOURS)) {
        const timer = setTimeout(() => {
          setShowOffer(true);
          localStorage.setItem('last_spin_time', now.toString());
        }, 2000);
        return () => clearTimeout(timer);
      }
    };

    checkSpinnerTime();
  }, []);

  // Scroll Detection
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Timer Logic for Banner
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        let { h, m, s } = prev;
        if (s > 0) s--;
        else {
          s = 59;
          if (m > 0) m--;
          else {
            if (h > 0) {
              h--;
              m = 59;
            } else {
              h = 2; m = 59; s = 59;
            }
          }
        }
        return { h, m, s };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Theme Handling
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

  const showModal = () => {
    Swal.fire({
      title: "Sign out?",
      text: "See you next time!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: 'var(--color-primary, #4f46e5)',
      cancelButtonColor: '#ef4444',
      confirmButtonText: "Yes, Sign Out",
      background: theme === 'dark' ? '#1e293b' : '#fff',
      color: theme === 'dark' ? '#fff' : '#000',
    }).then((result) => {
      if (result.isConfirmed) signOut();
    });
  };

  function signOut() {
    auth.signOut().then(() => {
      dispatch(loginToggle(false));
      setShowDetails(false);
    });
  }

  // Online Users Sim
  const [onlineUsers, setOnlineUsers] = useState(1243);
  useEffect(() => {
    const interval = setInterval(() => {
      setOnlineUsers(prev => prev + (Math.floor(Math.random() * 7) - 3));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Helper for Nav Links
  const navLinkClass = "text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition-colors";

  return (
    <>
      {/* --- UNIFIED FIXED WRAPPER --- */}
      <div className="fixed top-0 left-0 w-full z-50 flex flex-col transition-all duration-300">
        
        {/* Banner */}
        {showBanner && (
          <div className="relative z-[60] bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 text-white overflow-hidden shadow-md">
            <div className="max-w-[1440px] mx-auto px-4 py-2 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6 text-xs sm:text-sm font-bold">
              <div className="flex items-center gap-4 hidden md:flex">
                <div className="flex items-center gap-2">
                  <i className="fa-solid fa-mobile-screen"></i>
                  <span>Best deals on all plans</span>
                </div>
                <div className="h-4 w-px bg-white/30"></div>
                <div className="flex items-center gap-2">
                  <i className="fa-solid fa-tag"></i>
                  <span>90% OFF coupon</span>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-black/20 px-3 py-1 rounded-lg">
                <span className="whitespace-nowrap">Special ends in:</span>
                <div className="font-mono text-yellow-300 text-base">
                  {String(timeLeft.h).padStart(2, '0')}:{String(timeLeft.m).padStart(2, '0')}:{String(timeLeft.s).padStart(2, '0')}
                </div>
              </div>

              <button 
                onClick={() => setShowOffer(true)}
                className="bg-[#ccff00] text-black hover:bg-white hover:scale-105 transition-all px-4 py-1.5 rounded-full font-black uppercase tracking-wide shadow-lg shadow-black/20"
              >
                GRAB NOW
              </button>

              <button 
                onClick={() => setShowBanner(false)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
          </div>
        )}

        {/* Main Navbar */}
        <header
          className={`
            w-full transition-all duration-300 ease-in-out px-4 md:px-6
            ${scrolled 
              ? "bg-white/90 dark:bg-[#0B0C15]/90 backdrop-blur-xl border-b border-gray-200 dark:border-slate-800 py-3 shadow-md" 
              : "bg-transparent py-4 bg-gradient-to-b from-white/90 to-transparent dark:from-[#0B0C15]/90"
            }
          `}
        >
          <div className='max-w-[1440px] mx-auto flex justify-between items-center w-full'>
            
            {/* LOGO */}
            <Link to="/">
              <div className="flex items-center gap-2 group cursor-pointer">
                <div className="relative">
                  <i className="fa-solid fa-comments text-2xl text-primary drop-shadow-lg transition-transform group-hover:scale-110"></i>
                  <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
                  </span>
                </div>
                <h2 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">
                  Vaani
                </h2>
              </div>
            </Link>

            {/* REPLACEMENT: NAVIGATION & LIVE STATS */}
            <div className="hidden lg:flex items-center justify-center gap-8">
                {/* Nav Links */}
                <nav className="flex items-center gap-6 bg-gray-100 dark:bg-white/5 px-6 py-2 rounded-full border border-transparent dark:border-white/10">
                    <Link to="/" className={navLinkClass}>Home</Link>
                    <Link to="/rooms" className={navLinkClass}>Rooms</Link>
                    <Link to="/leaderboard" className={navLinkClass}>Community</Link>
                    <span className="w-px h-4 bg-gray-300 dark:bg-gray-700"></span>
                    <Link to="/premium" className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-pink-500 hover:opacity-80 transition-opacity">
                        <i className="fa-solid fa-crown mr-1"></i>Premium
                    </Link>
                </nav>

                {/* Live Count Pill */}
                <div className="flex items-center gap-2 bg-green-500/10 dark:bg-green-500/20 px-3 py-1.5 rounded-full border border-green-500/20">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    <span className="text-xs font-semibold text-green-700 dark:text-green-400 tabular-nums">
                        {onlineUsers.toLocaleString()} online
                    </span>
                </div>
            </div>

            {/* ACTIONS */}
            <div className='flex items-center gap-3 sm:gap-4'>
              
              {/* 777 Widget (Manual Trigger) */}
              <div onClick={() => setShowOffer(true)} className="hidden sm:flex cursor-pointer hover:scale-105 transition-transform bg-black/5 dark:bg-white/5 p-1.5 rounded-lg border border-black/5 dark:border-white/5">
                <span className="text-lg">🎰</span>
              </div>

              {/* Theme Toggle */}
              <button onClick={toggleTheme} className="w-9 h-9 rounded-full flex items-center justify-center bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-yellow-400 hover:bg-gray-200 dark:hover:bg-slate-700 transition-all">
                {theme === "dark" ? <i className="fa-solid fa-sun text-xs"></i> : <i className="fa-solid fa-moon text-xs"></i>}
              </button>

              {/* Auth Buttons */}
              {loginStatus ? (
                userdata ? (
                  <div className="relative z-50 pl-2" onMouseEnter={() => setShowDetails(true)} onMouseLeave={() => setShowDetails(false)}>
                    <img src={userdata.photoURL} className="w-9 h-9 rounded-full border-2 border-white dark:border-[#0B0C15] cursor-pointer" alt="Profile" referrerPolicy="no-referrer" />
                    <div 
                      className={`absolute right-0 pt-2 w-48 transform transition-all duration-200 origin-top-right ${showDetails ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 -translate-y-2 pointer-events-none"}`}
                    >
                      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-100 dark:border-slate-700 p-2">
                        <button className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-lg">Profile</button>
                        <button onClick={showModal} className="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg">Sign Out</button>
                      </div>
                    </div>
                  </div>
                ) : <Loading />
              ) : (
                <button onClick={signInWithGoogle} className="px-5 py-2 rounded-full bg-black dark:bg-white text-white dark:text-black font-bold text-sm hover:scale-105 transition-transform shadow-lg">
                  Log in
                </button>
              )}
            </div>
          </div>
        </header>

      </div> 

      {/* --- RENDER SPINNER MODAL --- */}
      {showOffer && <SpinWheelModal onClose={() => setShowOffer(false)} />}
    </>
  );
};

export default Header;