import React, { useState, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';

import CustomSelect from './common/CustomSelect'; 
import { addRoomModalToggle, togglePopup } from '../redux/action';
import useAddRoom from '../hooks/useAddRoom';
import openAIChat from '../hooks/openAIChat'; 
import { useAuth } from './auth/AppWrapper';

const getInputClass = (hasError) => `
  w-full bg-gray-50 dark:bg-slate-900 
  border ${hasError ? 'border-red-500' : 'border-gray-200 dark:border-slate-700'} 
  text-gray-900 dark:text-white 
  rounded-xl px-4 py-3 pl-10
  focus:outline-none focus:ring-2 ${hasError ? 'focus:ring-red-500/20' : 'focus:ring-indigo-500/20'} 
  focus:border-indigo-500 transition-all duration-200
  placeholder-gray-400 dark:placeholder-slate-500
`;

const MODERATION_PROMPT = (text) => `
  Task: Content Moderation. Analyze Title: "${text}"
  Rules:
  1. Check for hate speech, profanity, sexual content, violence.
  2. Check for GIBBERISH (e.g. "asdasd") or SPAM.
  3. OUTPUT: Reply exactly "SAFE" or "UNSAFE".
`;

const AddRoomForm = ({ data }) => {
  const dispatch = useDispatch();
  const addRoom = useAddRoom(); // This hits your MongoDB backend now
  
  const modalToggle = useSelector((state) => state.toggleModal);
  
  // Grab user from context
  const { user: userdata } = useAuth(); 
  
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState({});
  const [roomData, setRoomData] = useState({ Title: '', Language: '', Level: '', MaximumPeople: '' });

  const activeRoom = useMemo(() => {
    if (!Array.isArray(data) || !userdata?.uid) return null;
    return data.find((room) => room?.ownerUid === userdata.uid);
  }, [data, userdata?.uid]);

  const closeModal = useCallback(() => {
    dispatch(addRoomModalToggle(false));
    setError({});
  }, [dispatch]);

  const inputHandler = (e) => {
    const { name, value } = e.target;
    setRoomData((prev) => ({ ...prev, [name]: value }));
    if (error[name]) setError((prev) => ({ ...prev, [name]: null }));
  };

  const languageSelect = useCallback((language) => {
    setRoomData((prev) => ({ ...prev, Language: language }));
    setError((prev) => ({ ...prev, Language: null }));
  }, []);

  const handleValidation = () => {
    const newErrors = {};
    const titleTrimmed = roomData.Title.trim();

    if (!titleTrimmed) newErrors.Title = 'Title is required';
    else if (titleTrimmed.length < 3) newErrors.Title = 'Title is too short';
    else if (/(.)\1{4,}/.test(titleTrimmed)) newErrors.Title = 'Please enter a real topic';

    if (!roomData.Level) newErrors.Level = 'Please select a level';
    if (!roomData.Language) newErrors.Language = 'Please select a language';
    
    const maxPeople = Number(roomData.MaximumPeople);
    if (!roomData.MaximumPeople || isNaN(maxPeople) || maxPeople <= 0) {
      newErrors.MaximumPeople = 'Invalid number';
    } else if (maxPeople > 5) {
      newErrors.MaximumPeople = 'Max 5 people allowed';
    }

    setError(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 🔥 BULLETPROOF CREATE FUNCTION
  const createRoom = async (e) => {
    if (e) e.preventDefault(); 

    if (!userdata?.uid) return toast.error("Please sign in first");
    if (activeRoom) return toast.error('You already have an active room.');
    if (!handleValidation()) return;
    
    // 1. Turn ON spinner
    setIsValidating(true);
    
    try {
      // 2. Fast AI Check (skips if it takes > 3 seconds)
      const result = await openAIChat(roomData.Title, "", MODERATION_PROMPT(roomData.Title));
      const cleanResult = result ? result.trim().toUpperCase() : "SAFE";
      
      if (cleanResult.includes("UNSAFE")) {
        setError(prev => ({ ...prev, Title: "Topic rejected: Unsafe or meaningless." }));
        return; // Exits early without creating room
      }

      // 3. Format Payload for MongoDB
      const finalPayload = {
        ...roomData,
        ownerUid: userdata.uid,
        ownerName: userdata.displayName || "Anonymous",
        ownerPhoto: userdata.photoURL || "",
        createdAt: Date.now(), 
        roomImg: "", 
      };

      // 4. Save to Database
      await addRoom(finalPayload);
      
      toast.success('Room created successfully!');
      dispatch(togglePopup(true));
      dispatch(addRoomModalToggle(false));

      setRoomData({ Title: '', Language: '', Level: '', MaximumPeople: '' });

    } catch (err) {
      console.error("Backend Error:", err);
      toast.error("Failed to create room on server.");
    } finally {
      // 5. GUARANTEE SPINNER TURNS OFF
      setIsValidating(false);
    }
  };

  return (
    <div
      className={`fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-lg z-[100] transition-all duration-300 ease-out
        ${modalToggle ? 'opacity-100 visible scale-100' : 'opacity-0 invisible scale-95 pointer-events-none'}
      `}
    >
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-700 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="relative p-6 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800 rounded-t-3xl">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Create Room</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Host a discussion topic</p>
          </div>
          <button onClick={closeModal} className="text-gray-400 hover:text-red-500 transition-colors">
            <i className="fa-solid fa-xmark text-xl"></i>
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar">
          
          {/* BLOCKER UI */}
          {activeRoom ? (
             <div className="flex flex-col items-center justify-center text-center py-6 space-y-4">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-2">
                   <i className="fa-solid fa-ban text-3xl text-red-500"></i>
                </div>
                <div>
                   <h3 className="text-lg font-bold text-gray-900 dark:text-white">One Room Limit</h3>
                   <p className="text-gray-500 dark:text-gray-400 text-sm mt-2 max-w-xs mx-auto">
                      You are hosting: <span className="font-semibold text-gray-800 dark:text-gray-200">"{activeRoom.Title}"</span>
                   </p>
                </div>
                <button 
                  onClick={closeModal}
                  className="mt-4 w-full bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 font-bold py-3 rounded-xl hover:bg-gray-300 transition-colors"
                >
                  Okay, got it
                </button>
             </div>
          ) : (
            
            // --- FORM ---
            <form onSubmit={createRoom} className="space-y-5">
              
              {/* Title Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5 ml-1">Topic / Title</label>
                <div className="relative">
                  <span className="absolute left-3 top-3.5 text-gray-400"><i className="fa-solid fa-heading"></i></span>
                  <input
                    onChange={inputHandler}
                    type="text"
                    value={roomData.Title}
                    name="Title"
                    placeholder="e.g. English Practice"
                    className={getInputClass(error.Title)} 
                    disabled={isValidating}
                  />
                  {isValidating && (
                    <span className="absolute right-3 top-3.5 text-indigo-500 text-xs flex items-center gap-1 animate-pulse">
                        <i className="fas fa-circle-notch fa-spin"></i> Checking...
                    </span>
                  )}
                </div>
                {error.Title && <p className="text-red-500 text-xs mt-1 ml-1">{error.Title}</p>}
              </div>

              {/* Grid Inputs */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5 ml-1">Max People</label>
                  <div className="relative">
                    <span className="absolute left-3 top-3.5 text-gray-400"><i className="fa-solid fa-users"></i></span>
                    <input 
                        onChange={inputHandler} 
                        type="number" 
                        value={roomData.MaximumPeople} 
                        name="MaximumPeople" 
                        min={1} max={5} 
                        className={getInputClass(error.MaximumPeople)} 
                    />
                  </div>
                  {error.MaximumPeople && <p className="text-red-500 text-xs mt-1 ml-1">{error.MaximumPeople}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5 ml-1">Difficulty</label>
                  <div className="relative">
                    <span className="absolute left-3 top-3.5 text-gray-400 z-10"><i className="fa-solid fa-layer-group"></i></span>
                    <select onChange={inputHandler} value={roomData.Level} name="Level" className={`${getInputClass(error.Level)} appearance-none cursor-pointer`}>
                      <option value="">Select Level</option>
                      <option value="#beginner">Beginner</option>
                      <option value="#intermediate">Intermediate</option>
                      <option value="#advanced">Advanced</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500"><i className="fa-solid fa-chevron-down text-xs"></i></div>
                  </div>
                  {error.Level && <p className="text-red-500 text-xs mt-1 ml-1">{error.Level}</p>}
                </div>
              </div>

              {/* Language Select */}
              <div>
                <CustomSelect languageSelect={languageSelect} value={roomData.Language} error={error.Language} /> 
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isValidating}
                className={`
                  w-full mt-2 text-white font-bold py-3.5 rounded-xl shadow-lg transform transition-all duration-200 flex justify-center items-center gap-2
                  ${isValidating 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-gradient-to-r bg-primary hover:shadow-indigo-500/30 active:scale-95'
                  }
                `}
              >
                {isValidating ? (
                    <> <i className="fas fa-shield-alt animate-pulse"></i> Creating Room... </>
                ) : (
                    <> <i className="fa-solid fa-plus"></i> Create Room </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddRoomForm;