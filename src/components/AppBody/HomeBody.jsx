import React, { useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import RoomCard from '../rooms/RoomCard';
import AddRoomForm from '../AddRoomForm';
import { addRoomModalToggle, togglePopup } from '../../redux/action';
import { toast } from 'react-toastify';
import { getRoomData } from '../../hooks/getRoom';
import { Popup } from '../common/Popup';
import AiCard from '../ai/AiCard';
import SkeletonLoader from './SkeletonLoader';

const HomeBody = () => {
  const dispatch = useDispatch();

  const modalToggle = useSelector((state) => state.toggleModal);
  const togglePopUp = useSelector((state) => state.togglePopup);
  const loginStatus = useSelector((state) => state.loginStatus);

  // 1. Fetch Real Data
  const { rooms, loading, error } = getRoomData();

  const [searchtext, setSearchText] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [page, setPage] = useState(1);
  const [showPrivacyNotice, setShowPrivacyNotice] = useState(false); // State for Privacy Popup
  const PAGE_SIZE = 16;

  // --- PRIVACY NOTICE LOGIC ---
  useEffect(() => {
    // Check local storage on mount
    const isAccepted = localStorage.getItem('privacy_policy_accepted');
    if (!isAccepted) {
      // Delay slightly for smooth entrance
      setTimeout(() => setShowPrivacyNotice(true), 1500);
    }
  }, []);

  const handleAcceptPrivacy = () => {
    localStorage.setItem('privacy_policy_accepted', 'true');
    setShowPrivacyNotice(false);
  };

  // --- DUMMY DATA ---
  const avatarStyles = [
    'adventurer', 'avataaars', 'fun-emoji', 'bottts',
    'pixel-art', 'croodles', 'miniavs', 'open-peeps'
  ];

  const Dummyrooms = [
    {
      "id": "room_001",
      "joinedAt": 1766078139215,
      "expiresAt": { "seconds": 1766078750, "nanoseconds": 686000000 },
      "participantsCount": 5,
      "MaximumPeople": "5",
      "Level": "#intermediate",
      "ownerName": "Fatima",
      "timestampField": { "seconds": 1766078139, "nanoseconds": 212000000 },
      "ownerUid": "uid_001",
      "Language": "Portuguese",
      "flagCode": "PT",
      "Title": "🦥 Procrastinators Assemble #6",
      "roomImg": "",
      "bgColor": "#99BC85",
      "lastActive": 1766078139215
    },
    {
      "id": "room_002",
      "joinedAt": 1766078140000,
      "expiresAt": { "seconds": 1766078760, "nanoseconds": 100000000 },
      "participantsCount": 4,
      "MaximumPeople": "4",
      "Level": "#advanced",
      "ownerName": "Ahmed",
      "timestampField": { "seconds": 1766078140, "nanoseconds": 500000000 },
      "ownerUid": "uid_002",
      "Language": "Urdu",
      "flagCode": "PK",
      "Title": "🫠 Socially Awkward Club #5",
      "roomImg": "",
      "bgColor": "#FFD6BA",
      "lastActive": 1766078140000
    },
    // ... add more dummy data if needed
  ];

  const fakeNames = ["Sarah", "Mike", "Priya", "Ali", "John", "Emma", "Ravi"];
  const fakeRooms = ["English Club", "Gaming Lounge", "Chill Zone", "Tech Talk"];

  useEffect(() => {
    const triggerNotification = () => {
      const randomName = fakeNames[Math.floor(Math.random() * fakeNames.length)];
      const randomRoom = fakeRooms[Math.floor(Math.random() * fakeRooms.length)];
      const actions = [
        `${randomName} just joined ${randomRoom} 🚀`,
        `${randomName} started a new room 🎤`,
        `🔥 ${randomRoom} is trending right now!`,
        `👋 ${randomName} came online`
      ];
      
      const randomMsg = actions[Math.floor(Math.random() * actions.length)];
      
      toast.info(randomMsg, {
        position: "bottom-left",
        autoClose: 3000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "dark",
        icon: "🔔"
      });
    };

    const interval = setInterval(() => {
      if (Math.random() > 0.7) { 
        triggerNotification(); 
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const allRooms = useMemo(() => {
    const realData = rooms || [];
    return [...realData, ...Dummyrooms];
  }, [rooms]);

  const languageList = useMemo(() => {
    if (!allRooms.length) return [];
    const count = {};
    allRooms.forEach((r) => {
      const lang = r.Language || "Unknown";
      count[lang] = (count[lang] || 0) + 1;
    });
    return Object.entries(count).map(([item, count]) => ({ item, count }));
  }, [allRooms]);

  const filteredRooms = useMemo(() => {
    if (!allRooms.length) return [];
    const text = searchtext.trim().toUpperCase();

    return allRooms.filter((room) => {
      const title = room.Title || "";
      const lang = room.Language || "";
      const matchTitle = title.toUpperCase().includes(text);
      const matchLang = lang.toUpperCase().includes(text);
      const matchSelect = selectedLanguage === '' || lang.toUpperCase() === selectedLanguage.toUpperCase();
      return (matchTitle || matchLang) && matchSelect;
    });
  }, [allRooms, searchtext, selectedLanguage]);

  const paginatedRooms = useMemo(() => {
    return filteredRooms.slice(0, PAGE_SIZE * page);
  }, [filteredRooms, page]);

  useEffect(() => {
    if (togglePopUp) {
      const timer = setTimeout(() => {
        dispatch(togglePopup(false));
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [togglePopUp, dispatch]);

  const handleAddRoomClick = () => {
    if (loginStatus) {
      dispatch(addRoomModalToggle(true));
    } else {
      toast.error("Please sign in to create a room");
    }
  };

  if (error) return <div className="text-red-500 text-center mt-20">Error: {error.message}</div>;

  return (
    <div className="pt-36 pb-20  min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors duration-300 px-4 sm:px-6">
      <div className='max-w-7xl mx-auto'>

        {/* --- HEADER & FILTERS --- */}
        <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 mb-8">
          
          <div className="hidden md:block">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Explore Rooms</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Join a conversation or start your own.</p>
          </div>

          <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3">
            {/* Language Dropdown */}
            <div className="relative">
              <select
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="w-full sm:w-48 appearance-none bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-700 dark:text-gray-200 py-2.5 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-sm transition-all cursor-pointer"
              >
                <option value="">All Languages</option>
                {languageList.map((lang) => (
                  <option key={lang.item} value={lang.item}>
                    {lang.item} ({lang.count})
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 dark:text-gray-400">
                <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                value={searchtext}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Search topics..."
                className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-700 dark:text-gray-200 py-2.5 pl-10 pr-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-sm transition-all placeholder-gray-400 dark:placeholder-slate-600"
              />
              <svg className="absolute left-3 top-3 h-5 w-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </div>
          </div>
        </div>

        {/* --- ADD ROOM MODAL --- */}
        <AddRoomForm data={rooms} /> 

        {modalToggle && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity" />
        )}

        {togglePopUp && (
          <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 animate-bounce">
             <Popup text="Room created successfully!" color="bg-emerald-600" />
          </div>
        )}

        {/* --- PRIVACY & RULES NOTICE POPUP (New) --- */}
        {showPrivacyNotice && (
          <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 sm:p-0">
             {/* Backdrop */}
             <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" />

             {/* Modal Content */}
             <div className="relative bg-white dark:bg-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-gray-100 dark:border-slate-700 animate-fade-in-up">
                
                {/* Header Decoration */}
                <div className="h-2 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>

                <div className="p-8">
                   <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center mb-5 text-primary shadow-sm border border-indigo-100 dark:border-indigo-800">
                      <i className="fa-solid fa-handshake-simple text-3xl"></i>
                   </div>
                   
                   <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                      Safe Space & Privacy 🛡️
                   </h2>
                   
                   <div className="space-y-4 mb-8 text-gray-600 dark:text-gray-300 text-[15px] leading-relaxed">
                      <p>
                        <span className="font-semibold text-gray-900 dark:text-white">1. Your Privacy:</span> We do not sell your data. We only store basic login info to make the app work.
                      </p>
                      <p>
                        <span className="font-semibold text-gray-900 dark:text-white">2. No Trolling Policy:</span> This is a friendly learning community. 
                        <span className="text-red-500 dark:text-red-400 font-medium"> Any form of harassment, hate speech, or trolling will result in an immediate permanent ban.</span>
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                        By continuing, you agree to keep this community safe and respectful for everyone.
                      </p>
                   </div>

                   <button 
                     onClick={handleAcceptPrivacy}
                     className="w-full bg-gradient-to-r bg-primary hover:opacity-90 text-white font-bold py-3.5 rounded-xl transition-all active:scale-95 shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2"
                   >
                     <span>I Agree & Continue</span>
                     <i className="fa-solid fa-arrow-right"></i>
                   </button>
                </div>
             </div>
          </div>
        )}

        {/* --- FAB --- */}
        <button
          onClick={handleAddRoomClick}
          className="fixed bottom-8 hover:gap-2 right-6 group flex items-center  bg-gradient-to-r bg-primary  text-white p-4 rounded-full shadow-lg  transform hover:-translate-y-1 transition-all duration-300 z-40"
          title="Create New Room"
        >
          <i className="fa fa-plus text-xl"></i>
          <span className="max-w-0  overflow-hidden group-hover:max-w-xs transition-all duration-500 ease-in-out whitespace-nowrap">
            Create Room
          </span>
        </button>

        {/* --- ROOMS GRID --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">

          {/* SKELETON LOADER */}
          {loading &&
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="w-full h-[280px]">
                <SkeletonLoader />
              </div>
            ))}

          {/* ROOM CARDS */}
          {!loading && (
            <>
              <div className="col-span-1">
                 <AiCard
                  pageName="AI Voice Room"
                  title="Luna — AI Friend"
                  description="Chat with Luna 24/7."
                  avatar="/aichar.jpg"
                />
              </div>

              {paginatedRooms.map((room) => (
                <RoomCard key={room.id} roomdata={room} />
              ))}
            </>
          )}
        </div>

        {/* --- EMPTY STATE --- */}
        {!loading && paginatedRooms.length === 0 && (
           <div className="text-center py-20">
             <div className="text-6xl mb-4">🏜️</div>
             <h3 className="text-xl font-bold text-gray-600 dark:text-gray-300">No rooms found</h3>
             <p className="text-gray-500 dark:text-gray-500">Try changing your filters or create a new one!</p>
           </div>
        )}

        {/* --- LOAD MORE --- */}
        {!loading && filteredRooms.length > page * PAGE_SIZE && (
          <div className="text-center mt-12 mb-8">
            <button
              onClick={() => setPage((p) => p + 1)}
              className="px-6 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-white rounded-full font-medium shadow-sm hover:shadow-md hover:bg-gray-50 dark:hover:bg-slate-700 transition-all"
            >
              Load More Rooms
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default HomeBody;