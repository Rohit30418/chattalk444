import React, { useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import RoomCard from '../rooms/RoomCard';
import AddRoomForm from '../AddRoomForm';
import { addRoomModalToggle, togglePopup } from '../../redux/action';
import { getRoomData } from '../../hooks/getRoom';
import { Popup } from '../common/Popup';
import AiCard from '../ai/AiCard';
import SkeletonLoader from './SkeletonLoader';
import FeaturedEvents from './FeaturedEvents';
import LiveActivityFeed from './LiveActivityFeed'; 
import AnniversaryCard from './AnniversaryCard';
import SpinWheelModal from './SpinWheelModal';

// --- DUMMY DATA ---
const FAKE_NAMES = ["Sarah", "Mike", "Priya", "Ali", "John", "Emma", "Ravi"];
const FAKE_ROOMS = ["English Club", "Gaming Lounge", "Chill Zone", "Tech Talk"];
const DUMMY_ROOMS = [
  { id: "room_001", joinedAt: 1766078139215, participantsCount: 5, MaximumPeople: "5", Level: "#intermediate", ownerName: "Fatima", ownerUid: "uid_001", Language: "Portuguese", flagCode: "PT", Title: "🦥 Procrastinators Assemble #6", bgColor: "#99BC85" },
  { id: "room_002", joinedAt: 1766078140000, participantsCount: 4, MaximumPeople: "4", Level: "#advanced", ownerName: "Ahmed", ownerUid: "uid_002", Language: "Urdu", flagCode: "PK", Title: "🫠 Socially Awkward Club #5", bgColor: "#FFD6BA" },
  { id: "room_003", joinedAt: 1766078200000, participantsCount: 2, MaximumPeople: "6", Level: "#beginner", ownerName: "Maria", ownerUid: "uid_003", Language: "Spanish", flagCode: "ES", Title: "🌮 Taco Tuesday Debate", bgColor: "#FEC8D8" },
  { id: "room_004", joinedAt: 1766078350000, participantsCount: 5, MaximumPeople: "8", Level: "#advanced", ownerName: "Kenji", ownerUid: "uid_004", Language: "Japanese", flagCode: "JP", Title: "⛩️ Anime Spoilers Only", bgColor: "#D4F1F4" },
  { id: "room_005", joinedAt: 1766078420000, participantsCount: 3, MaximumPeople: "4", Level: "#intermediate", ownerName: "Sophie", ownerUid: "uid_005", Language: "French", flagCode: "FR", Title: "🥐 Croissant Chronicles", bgColor: "#E0BBE4" },
  { id: "room_006", joinedAt: 1766078550000, participantsCount: 1, MaximumPeople: "3", Level: "#beginner", ownerName: "Hans", ownerUid: "uid_006", Language: "German", flagCode: "DE", Title: "🍺 Beer & Grammar", bgColor: "#FFDFD3" },
  { id: "room_007", joinedAt: 1766078600000, participantsCount: 6, MaximumPeople: "10", Level: "#intermediate", ownerName: "Min-ji", ownerUid: "uid_007", Language: "Korean", flagCode: "KR", Title: "🎵 K-Pop Stans Unite", bgColor: "#B5EAD7" },
  { id: "room_008", joinedAt: 1766078700000, participantsCount: 2, MaximumPeople: "5", Level: "#advanced", ownerName: "Sarah", ownerUid: "uid_008", Language: "English", flagCode: "US", Title: "💼 Business Talk (Boring)", bgColor: "#A0E7E5" }
];
const PAGE_SIZE = 16;

const HomeBody = () => {
  const dispatch = useDispatch();

  // Redux Selectors
  const modalToggle = useSelector((state) => state.toggleModal);
  const togglePopUp = useSelector((state) => state.togglePopup);
  const loginStatus = useSelector((state) => state.loginStatus);

  // Custom Hook
  const { rooms, loading, error } = getRoomData();

  // Local State
  const [searchText, setSearchText] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [page, setPage] = useState(1);
  const [showPrivacyNotice, setShowPrivacyNotice] = useState(false);
  const [showOffer, setShowOffer] = useState(false); // For Triggering Spinner from Card

  // --- PRIVACY NOTICE ---
  useEffect(() => {
    const isAccepted = localStorage.getItem('privacy_policy_accepted');
    if (!isAccepted) {
      const timer = setTimeout(() => setShowPrivacyNotice(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptPrivacy = () => {
    localStorage.setItem('privacy_policy_accepted', 'true');
    setShowPrivacyNotice(false);
  };

  // --- NOTIFICATION LOGIC ---
  useEffect(() => {
    const triggerNotification = () => {
      const randomName = FAKE_NAMES[Math.floor(Math.random() * FAKE_NAMES.length)];
      const randomRoom = FAKE_ROOMS[Math.floor(Math.random() * FAKE_ROOMS.length)];
      toast.info(`${randomName} just joined ${randomRoom} 🚀`, { position: "bottom-left", theme: "dark", autoClose: 3000 });
    };
    const interval = setInterval(() => { if (Math.random() > 0.7) triggerNotification(); }, 5000);
    return () => clearInterval(interval);
  }, []);

  // --- MEMOIZED DATA PROCESSING ---
  const allRooms = useMemo(() => {
    const realData = rooms || [];
    return [...realData, ...DUMMY_ROOMS];
  }, [rooms]);

  const languageList = useMemo(() => {
    if (!allRooms.length) return [];
    const count = {};
    allRooms.forEach((r) => {
      const lang = r?.Language || "Unknown";
      count[lang] = (count[lang] || 0) + 1;
    });
    return Object.entries(count).map(([item, count]) => ({ item, count }));
  }, [allRooms]);

  const filteredRooms = useMemo(() => {
    const text = searchText.trim().toUpperCase();
    if (!allRooms.length) return [];
    return allRooms.filter((room) => {
      const title = room?.Title?.toUpperCase() || "";
      const lang = room?.Language?.toUpperCase() || "";
      const matchTitle = title.includes(text);
      const matchLang = lang.includes(text);
      const matchSelect = selectedLanguage === '' || lang === selectedLanguage.toUpperCase();
      return (matchTitle || matchLang) && matchSelect;
    });
  }, [allRooms, searchText, selectedLanguage]);

  const paginatedRooms = useMemo(() => filteredRooms.slice(0, PAGE_SIZE * page), [filteredRooms, page]);

  // Auto-close Popup
  useEffect(() => {
    if (togglePopUp) {
      const timer = setTimeout(() => dispatch(togglePopup(false)), 1000);
      return () => clearTimeout(timer);
    }
  }, [togglePopUp, dispatch]);

  const handleAddRoomClick = () => {
    if (loginStatus) dispatch(addRoomModalToggle(true));
    else toast.error("Please sign in to create a room");
  };

  if (error) return <div className="text-red-500 text-center mt-32 font-bold text-xl">Unable to load rooms. Please refresh.</div>;

  return (
    // 🔥 FIXED: Responsive top padding (pt-36 mobile, pt-44 desktop) for Fixed Header
    <div className="pt-36 md:pt-44 pb-20 min-h-screen bg-gray-50 dark:bg-[#0B0C15] transition-colors duration-300 px-4 md:px-6 lg:px-8 font-sans selection:bg-primary/30 overflow-x-hidden">
      <div className='max-w-[1440px] mx-auto'>
        
        {/* --- HEADER TITLE & FILTERS --- */}
        <div className="flex flex-col xl:flex-row justify-between items-end gap-6 mb-8 md:mb-12">
          <div className="w-full xl:w-auto">
            <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2 text-gray-900 dark:text-white">
               Public Rooms <span className="text-primary">.</span>
            </h1>
            <p className="text-gray-500 dark:text-slate-400 font-medium text-sm md:text-base">Join 2,400+ people learning together</p>
          </div>

          <div className="flex flex-col sm:flex-row w-full xl:w-auto gap-3">
             {/* Filter Dropdown */}
             <div className="relative w-full sm:w-48 lg:w-64 group">
                 <select
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                    className="w-full appearance-none bg-white dark:bg-[#151725] border border-gray-200 dark:border-slate-800 text-gray-700 dark:text-gray-200 py-3 px-5 rounded-2xl shadow-sm focus:outline-none focus:border-primary transition-all font-medium cursor-pointer text-sm md:text-base"
                  >
                    <option value="">All Languages</option>
                    {languageList.map((lang) => (
                      <option key={lang.item} value={lang.item}>{lang.item} ({lang.count})</option>
                    ))}
                  </select>
                  <i className="fa-solid fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none"></i>
             </div>

             {/* Search Input */}
             <div className="relative w-full sm:w-64 lg:w-72 group">
                 <i className="fa-solid fa-search absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors"></i>
                 <input
                  type="text"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="Search topics..."
                  className="w-full bg-white dark:bg-[#151725] border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white pl-12 pr-4 py-3 rounded-2xl shadow-sm focus:outline-none focus:border-primary transition-all font-medium placeholder-gray-400 dark:placeholder-slate-600 text-sm md:text-base"
                />
             </div>
          </div>
        </div>

        {/* --- DISCOVERY RIBBON (Horizontal Scroll) --- */}
        <div className="mb-12">
           <div className="flex items-center gap-2 mb-5 ml-1 animate-fade-in-up">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <h2 className="text-xs font-bold text-gray-500 dark:text-slate-500 uppercase tracking-[0.2em]">Trending Now</h2>
           </div>
           {/* Horizontal Scroll Component */}
           <FeaturedEvents />
        </div>

        {/* --- MAIN GRID LAYOUT --- */}
        <div className="flex flex-col xl:flex-row gap-8 items-start relative">
            
            {/* LEFT: ROOMS (Grid: 1 col mobile, 2 col tablet, 3 col desktop) */}
            <div className="w-full xl:w-[73%]">
               <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 md:gap-6">
                  
                  {/* AI Card - Spans 2 cols on tablet+ */}
                  <div className="col-span-1 md:col-span-2">
                      <AiCard pageName="AI Voice Room" title="Luna — AI Friend" description="Chat with Luna 24/7." avatar="https://static.vecteezy.com/system/resources/previews/034/599/439/non_2x/ai-generated-3d-cute-cartoon-woman-character-in-blue-suit-on-transparent-background-png.png" />
                  </div>

                  {/* Room Cards */}
                  {loading && Array(6).fill(0).map((_, i) => (
                     <div key={i} className="w-full h-[260px]"><SkeletonLoader /></div>
                  ))}

                  {!loading && paginatedRooms.map((room) => (
                    <RoomCard key={room.id} roomdata={room} />
                  ))}
               </div>

               {/* Empty State */}
               {!loading && paginatedRooms.length === 0 && (
                  <div className="text-center py-20 opacity-60">
                     <i className="fa-solid fa-ghost text-4xl mb-4 text-gray-400 dark:text-slate-600"></i>
                     <p className="text-gray-500 dark:text-slate-500">No rooms found matching "{searchText}"</p>
                  </div>
               )}

               {/* Load More Button */}
               {!loading && filteredRooms.length > page * PAGE_SIZE && (
                  <div className="text-center mt-12 mb-8">
                    <button 
                      onClick={() => setPage((p) => p + 1)} 
                      className="group flex items-center gap-2 mx-auto px-8 py-3 bg-white dark:bg-[#151725] border border-gray-200 dark:border-slate-800 rounded-full text-gray-700 dark:text-slate-200 font-bold shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all"
                    >
                      Load More Rooms
                      <i className="fa-solid fa-arrow-down text-xs group-hover:animate-bounce"></i>
                    </button>
                  </div>
               )}
            </div>

            {/* RIGHT: SIDEBAR (Hidden on mobile/tablet unless xl) */}
            <div className="hidden xl:block w-[27%] space-y-6 sticky top-44">
               <LiveActivityFeed />
               
               {/* CTA Card */}
               <div className="group relative bg-gradient-to-br from-primary to-blue-600 rounded-[2.5rem] p-8 text-center shadow-xl overflow-hidden cursor-pointer hover:shadow-primary/30 transition-all duration-300 hover:-translate-y-1">
                  <div className="absolute top-0 left-0 w-full h-full opacity-10" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                  <div className="relative z-10">
                     <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-5 backdrop-blur-md border border-white/20 shadow-inner group-hover:rotate-12 transition-transform">
                        <i className="fa-solid fa-plus text-3xl text-white"></i>
                     </div>
                     <h3 className="text-xl font-black mb-2 text-white">Start Hosting</h3>
                     <p className="text-white/90 text-xs font-medium mb-6 leading-relaxed">Create a topic, invite friends, and lead.</p>
                     <button onClick={handleAddRoomClick} className="w-full bg-white text-primary font-bold py-3.5 rounded-xl hover:bg-gray-50 transition-colors shadow-lg flex items-center justify-center gap-2">
                        Create Room <i className="fa-solid fa-arrow-right text-xs"></i>
                     </button>
                  </div>
               </div>
            </div>
        </div>

        {/* --- FLOATING WIDGETS --- */}
        
        {/* 1. Mobile FAB (Create Room) - Visible only on Mobile/Tablet */}
        <div className="xl:hidden">
            <button 
                onClick={handleAddRoomClick} 
                className="fixed bottom-6 right-6 bg-primary text-white p-4 w-14 h-14 rounded-full shadow-lg shadow-primary/40 hover:scale-110 active:scale-90 transition-all z-50 flex items-center justify-center"
            >
                <i className="fa fa-plus text-xl"></i>
            </button>
        </div>

        {/* 2. Anniversary Sale Card (Bottom Left - Desktop Only) */}
        <AnniversaryCard onClick={() => setShowOffer(true)} />

        {/* --- MODALS --- */}
        <AddRoomForm data={rooms} /> 
        {modalToggle && <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[60]" />}
        {togglePopUp && <div className="fixed top-28 left-1/2 transform -translate-x-1/2 z-[70] animate-bounce"><Popup text="Room created successfully!" color="bg-emerald-600" /></div>}
        
        {/* Spinner Modal (Triggered by Anniversary Card) */}
        {showOffer && <SpinWheelModal onClose={() => setShowOffer(false)} />}

        {/* Privacy Modal */}
        {showPrivacyNotice && (
            <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm transition-all animate-fade-in">
              <div className="bg-white dark:bg-[#151725] w-full max-w-lg rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl p-8 border border-gray-100 dark:border-slate-800 transform transition-all animate-slide-up">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl">
                    <i className="fa-solid fa-shield-halved text-primary text-2xl"></i>
                  </div>
                  <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Community Guidelines</h2>
                </div>
                <div className="space-y-4 text-gray-600 dark:text-slate-400 mb-8 leading-relaxed text-sm">
                  <p>Welcome to Vaani! To ensure a safe learning environment:</p>
                  <ul className="space-y-3">
                    <li className="flex gap-3 items-start"><i className="fa-solid fa-check-circle text-primary mt-0.5"></i><span><strong>Respect:</strong> Zero tolerance for hate speech.</span></li>
                    <li className="flex gap-3 items-start"><i className="fa-solid fa-check-circle text-primary mt-0.5"></i><span><strong>Privacy:</strong> Be mindful of sharing info.</span></li>
                  </ul>
                  <p className="text-xs opacity-70 mt-4">By continuing, you agree to our Terms of Service.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button onClick={handleAcceptPrivacy} className="flex-1 bg-primary hover:opacity-90 text-white font-bold py-4 px-6 rounded-xl shadow-lg transition-all active:scale-95">I Agree</button>
                  <button onClick={() => setShowPrivacyNotice(false)} className="flex-1 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 font-bold py-4 px-6 rounded-xl hover:bg-gray-200 dark:hover:bg-slate-700 transition-all">Later</button>
                </div>
              </div>
            </div>
        )}

      </div>
    </div>
  );
};

export default HomeBody;