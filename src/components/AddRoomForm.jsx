import React, { useState, useEffect } from 'react';
import CustomSelect from './common/CustomSelect'; 
import { useDispatch, useSelector } from 'react-redux';
import { addRoomModalToggle, togglePopup } from '../redux/action';
import useAddRoom from '../hooks/useAddRoom';
import openAIChat from '../hooks/openAIChat'; 
import { Timestamp } from 'firebase/firestore';
import { toast } from 'react-toastify';

const AddRoomForm = ({ data }) => {
  const dispatch = useDispatch();
  const addRoom = useAddRoom();
  const modalToggle = useSelector((state) => state.toggleModal);
  const userdata = useSelector((state) => state.userData);
  
  // State
  const [isValidating, setIsValidating] = useState(false); // AI Loading State
  const [error, setError] = useState({});
  const [roomData, setRoomData] = useState({
    Title: '',
    Language: '',
    Level: '',
    roomImg: '',
    MaximumPeople: '',
    ownerUid: '',
    ownerName: '',
    ownerPhoto: '',
    timestampField: Timestamp.now(),
  });

  // Check if user already has a room (Strict Check)
  // We use this to block the UI entirely if true
  const activeRoom = Array.isArray(data) 
    ? data.find((room) => room?.ownerUid === userdata?.uid) 
    : null;

  useEffect(() => {
    if (userdata && userdata.uid) {
      setRoomData((prevData) => ({
        ...prevData,
        ownerUid: userdata.uid,
        ownerName: userdata.displayName,
        ownerPhoto: userdata.photoURL,
      }));
    }
  }, [userdata]);

  const closeModal = () => {
    dispatch(addRoomModalToggle(false));
    setError({});
  };

  const inputHandler = (e) => {
    const { name, value } = e.target;
    setRoomData((prevData) => ({ ...prevData, [name]: value }));
    if (error[name]) {
      setError((prev) => ({ ...prev, [name]: null }));
    }
  };

  const languageSelect = (language) => {
    setRoomData((prevData) => ({ ...prevData, Language: language }));
    if (error.Language) setError((prev) => ({ ...prev, Language: null }));
  };

  const handleValidation = () => {
    const newErrors = {};
    const titleTrimmed = roomData.Title.trim();

    if (titleTrimmed === '') newErrors.Title = 'Title is required';
    
    // Quick Pre-check: Reject if title is too short or repeating characters
    if (titleTrimmed.length > 0 && titleTrimmed.length < 3) newErrors.Title = 'Title is too short';
    if (/(.)\1{4,}/.test(titleTrimmed)) newErrors.Title = 'Please enter a real topic';

    if (!roomData.Level) newErrors.Level = 'Please select a level';
    if (!roomData.Language) newErrors.Language = 'Please select a language';
    if (!roomData.ownerUid) newErrors.owner = 'Please sign in first';
    
    if (!roomData.MaximumPeople || isNaN(roomData.MaximumPeople) || Number(roomData.MaximumPeople) <= 0) {
      newErrors.MaximumPeople = 'Invalid number';
    } else if (Number(roomData.MaximumPeople) > 5) {
      newErrors.MaximumPeople = 'Max 5 people allowed';
    }
    setError(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // --- AI SAFETY & QUALITY CHECKER ---
  const checkContentSafety = async (text) => {
    const moderationPrompt = `
      Task: Content Moderation & Quality Control.
      Analyze this Room Title: "${text}"
      
      Rules:
      1. **SAFETY:** Check for hate speech, severe profanity, sexual content, violence, or illegal topics.
      2. **QUALITY (STRICT):** Check for GIBBERISH or SPAM. 
         - Reject random keystrokes (e.g., "asdasd", "sdfsdf", "jkjkjk", "qweqwe").
         - Reject meaningless strings of letters.
         - Reject repetitive spam.
      3. **CONTEXT:** The title must be a coherent, meaningful topic for a conversation room.
      4. **OUTPUT:** Reply with exactly ONE word: "SAFE" or "UNSAFE".
    `;

    try {
      const result = await openAIChat("Check this title", moderationPrompt);
      const cleanResult = result ? result.trim().toUpperCase().replace(/[^A-Z]/g, '') : "SAFE";
      return cleanResult === 'SAFE';
    } catch (error) {
      console.error("AI Check Failed:", error);
      return true; // Default to allow if AI is down (or set to false to be strict)
    }
  };

  const createRoom = async () => {
    // 1. Double check existence (Security Fallback)
    if (activeRoom) {
      toast.error('You already have an active room.');
      return;
    }

    // 2. Basic Inputs Validation
    if (!handleValidation()) return;
    
    // 3. AI Safety Check
    setIsValidating(true);
    try {
      const isSafe = await checkContentSafety(roomData.Title);
      
      if (!isSafe) {
        setIsValidating(false);
        setError(prev => ({ ...prev, Title: "Topic rejected: Unsafe or meaningless gibberish." }));
        toast.error("Please enter a valid discussion topic.");
        return;
      }
    } catch (err) {
      console.error("Moderation check failed", err);
    }
    setIsValidating(false);

    // 4. Create Room
    const now = new Date();
    const updatedRoomData = {
      ...roomData,
      timestampField: Timestamp.fromDate(now),
    };

    toast.success('Room created successfully!');
    addRoom(updatedRoomData);
    dispatch(togglePopup(true));
    dispatch(addRoomModalToggle(false));

    // Reset
    setRoomData((prev) => ({
      Title: '',
      Language: '',
      Level: '',
      roomImg: '',
      MaximumPeople: '',
      ownerUid: prev.ownerUid,
      ownerName: prev.ownerName,
      ownerPhoto: prev.ownerPhoto,
      timestampField: Timestamp.now(),
    }));
  };

  const inputClass = (hasError) => `
    w-full bg-gray-50 dark:bg-slate-900 
    border ${hasError ? 'border-red-500' : 'border-gray-200 dark:border-slate-700'} 
    text-gray-900 dark:text-white 
    rounded-xl px-4 py-3 pl-10
    focus:outline-none focus:ring-2 ${hasError ? 'focus:ring-red-500/20' : 'focus:ring-indigo-500/20'} 
    focus:border-indigo-500 transition-all duration-200
    placeholder-gray-400 dark:placeholder-slate-500
  `;

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
          <button onClick={closeModal} className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20">
            <i className="fa-solid fa-xmark text-xl"></i>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto custom-scrollbar">
          
          {/* --- BLOCKER LOGIC --- */}
          {/* If user already has a room, show this Warning UI instead of the Form */}
          {activeRoom ? (
             <div className="flex flex-col items-center justify-center text-center py-6 space-y-4">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-2">
                   <i className="fa-solid fa-ban text-3xl text-red-500"></i>
                </div>
                <div>
                   <h3 className="text-lg font-bold text-gray-900 dark:text-white">One Room Limit</h3>
                   <p className="text-gray-500 dark:text-gray-400 text-sm mt-2 max-w-xs mx-auto">
                      You are already hosting a room: <br />
                      <span className="font-semibold text-gray-800 dark:text-gray-200">"{activeRoom.Title}"</span>
                   </p>
                </div>
                <div className="bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 px-4 py-3 rounded-xl text-xs flex items-start gap-3 text-left w-full mt-4">
                  <i className="fa-solid fa-info-circle mt-0.5"></i>
                  <span>Please delete your existing room before creating a new one. This helps keep the community organized.</span>
                </div>
                <button 
                  onClick={closeModal}
                  className="mt-4 w-full bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 font-bold py-3 rounded-xl hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors"
                >
                  Okay, got it
                </button>
             </div>
          ) : (
            
            // --- STANDARD FORM (Only shown if no active room) ---
            <div className="space-y-5">
              {/* Room Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5 ml-1">
                  Topic / Title
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3.5 text-gray-400">
                    <i className="fa-solid fa-heading"></i>
                  </span>
                  <input
                    onChange={inputHandler}
                    type="text"
                    value={roomData.Title}
                    name="Title"
                    placeholder="e.g. English Practice for Beginners"
                    className={inputClass(error.Title)}
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

              <div className="grid grid-cols-2 gap-4">
                {/* Max People */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5 ml-1">Max Participants</label>
                  <div className="relative">
                    <span className="absolute left-3 top-3.5 text-gray-400"><i className="fa-solid fa-users"></i></span>
                    <input onChange={inputHandler} type="number" value={roomData.MaximumPeople} name="MaximumPeople" min={1} max={5} placeholder="Max 5" className={inputClass(error.MaximumPeople)} />
                  </div>
                  {error.MaximumPeople && <p className="text-red-500 text-xs mt-1 ml-1">{error.MaximumPeople}</p>}
                </div>

                {/* Level Select */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5 ml-1">Difficulty Level</label>
                  <div className="relative">
                    <span className="absolute left-3 top-3.5 text-gray-400 z-10"><i className="fa-solid fa-layer-group"></i></span>
                    <select onChange={inputHandler} value={roomData.Level} name="Level" className={`${inputClass(error.Level)} appearance-none cursor-pointer`}>
                      <option value="">Select Level</option>
                      <option value="#beginner">Beginner</option>
                      <option value="#intermediate">Intermediate</option>
                      <option value="#advanced">Advanced</option>
                      <option value="#upper-advanced">Upper Advanced</option>
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
                onClick={createRoom}
                disabled={isValidating}
                className={`
                  w-full mt-2 text-white font-bold py-3.5 rounded-xl shadow-lg transform transition-all duration-200 
                  flex justify-center items-center gap-2
                  ${isValidating 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-gradient-to-r bg-primary hover:shadow-indigo-500/30 active:scale-95'
                  }
                `}
              >
                {isValidating ? (
                    <>
                    <i className="fas fa-shield-alt animate-pulse"></i> Verifying Topic...
                    </>
                ) : (
                    <>
                    <i className="fa-solid fa-plus"></i> Create Room
                    </>
                )}
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default AddRoomForm;