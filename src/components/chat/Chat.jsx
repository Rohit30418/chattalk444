import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router';
import { useSelector, useDispatch } from 'react-redux';
import { Timestamp, collection, addDoc } from 'firebase/firestore';
import useAddMessage from '../../hooks/useAddMessage';
import useGetCollectionData from '../../hooks/useGetCollectionData';
import getUserDataFromFirestore from '../../hooks/getUserData';
import useGetParticipants from '../../hooks/useGetParticipents';
import useToggleSidebarFirebase from '../../hooks/useToggleSidebarFirebase';
import openAIChat from '../../hooks/openAIChat';
import MessageCard from '../../components/chat/MessageCard';
import { toggleChatSidebar } from '../../redux/action';
import { db } from '../../services/firebase';
import msgpop from '../../assets/happy-pop-3-185288.mp3';
import EmojiPicker from 'emoji-picker-react';

const Chat = ({ uId }) => {
  const [message, setMessage] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [isOpenEmoji, setIsOpenEmoji] = useState(false);

  const addMessage = useAddMessage();
  const { id } = useParams();
  const { collectionData } = useGetCollectionData("groupMessage", id, message, "rooms");
  const participent = useGetParticipants();
  const dispatch = useDispatch();
  const chatBoxRef = useRef(null);
  const msgPop = new Audio(msgpop);

  useEffect(() => {
    getUserDataFromFirestore(uId).then(setCurrentUser).catch(console.error);
  }, [uId]);

  const scrollToBottom = useCallback(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTo({ top: chatBoxRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [collectionData]);

  useEffect(() => { scrollToBottom(); }, [collectionData, scrollToBottom]);

  const handleMessageSend = useCallback(async () => {
    if (!message.trim()) return;
    const now = new Date();
    const txt = message.trim();
    setMessage('');
    msgPop.play();
    
    await addMessage({
      text: txt, role: "user", timestampField: Timestamp.fromDate(now), seenBy: {}, ...(currentUser || {}),
    });

    participent?.forEach(async (user) => {
      if (!user.isChatWindowOpen) {
         await addDoc(collection(db, 'rooms', id, 'participants', user?.id, 'unseenmsg'), { text: txt, timestamp: now });
      }
    });
  }, [addMessage, currentUser, id, message, participent]);

  const handleBotmsg = useCallback(async () => {
    if (!message.trim()) return;
    const userMsg = message.trim();
    setMessage('');
    msgPop.play();
    
    await addMessage({ text: userMsg, role: "user", timestampField: Timestamp.fromDate(new Date()), seenBy: {}, ...(currentUser || {}) });
    const botReply = await openAIChat(userMsg);
    if (botReply) {
       await addMessage({ text: botReply?.content, role: "bot", timestampField: Timestamp.fromDate(new Date()), replyto: userMsg, replytoName: currentUser?.displayName });
    }
  }, [message, addMessage, currentUser]);

  return (
    // Added dark:bg-gray-900 for main container
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 font-sans transition-colors duration-300">
      
      {/* Header */}
      {/* Added dark border, background, and text colors */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-slate-100 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur z-10 flex-none">
        
        {/* Updated Title and Green Dot */}
        <div className="flex items-center gap-2">
            <div className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-gray-100">Group Chat</h2>
        </div>

        <button 
          onClick={async () => {
            dispatch(toggleChatSidebar(false));
            await useToggleSidebarFirebase(id, uId, false);
          }}
          // Added dark hover and text colors
          className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-gray-800 flex items-center justify-center text-slate-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition"
        >
          <i className="fas fa-times text-lg"></i>
        </button>
      </div>

      {/* Message List */}
      {/* Added dark background for the list area */}
      <div ref={chatBoxRef} className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3 bg-slate-50 dark:bg-gray-900">
        {!collectionData ? (
           <div className="flex h-full items-center justify-center text-slate-400 dark:text-gray-500"><i className="fas fa-spinner fa-spin mr-2"/> Loading...</div>
        ) : collectionData.length === 0 ? (
           <div className="flex h-full flex-col items-center justify-center text-slate-400 dark:text-gray-500">
               {/* Empty State Icon Background */}
               <div className="w-16 h-16 bg-slate-200 dark:bg-gray-800 rounded-full flex items-center justify-center mb-2">
                 <i className="fas fa-comments text-2xl"/>
               </div>
               <p className="text-sm">No messages yet.</p>
           </div>
        ) : (
           collectionData.map((msg) => <MessageCard key={msg?.id} uId={uId} msgData={msg?.data} />)
        )}
      </div>

      {/* Input Area */}
      {/* Added dark background and border for input container */}
      <div className="p-3 border-t border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex-none relative">
        {isOpenEmoji && (
           <div className="absolute bottom-20 left-4 z-50 shadow-xl border border-slate-100 dark:border-gray-700 rounded-xl">
             <EmojiPicker 
                theme="auto" // Allows EmojiPicker to auto-detect system theme, or pass 'dark' if you manage theme via context
                onEmojiClick={(e) => { setMessage(p => p + e.emoji); setIsOpenEmoji(false); }} 
                height={350}
             />
           </div>
        )}
        
        {/* Input Wrapper - Dark background, blue focus ring adjustment */}
        <div className="flex items-center bg-slate-100 dark:bg-gray-800 rounded-2xl px-2 py-2 border border-transparent focus-within:border-blue-400 dark:focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 dark:focus-within:ring-blue-900/30 transition-all">
           
           <button onClick={() => setIsOpenEmoji(!isOpenEmoji)} className="w-9 h-9 rounded-full text-slate-500 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700 hover:text-yellow-500 transition flex items-center justify-center">
             <i className="far fa-smile text-lg"/>
           </button>
           
           <input 
             type="text" value={message} onChange={(e) => setMessage(e.target.value)} 
             onKeyDown={(e) => e.key === 'Enter' && handleMessageSend()}
             placeholder="Message..." 
             // Updated text and placeholder colors
             className="flex-1 bg-transparent border-none outline-none text-slate-700 dark:text-gray-200 placeholder-slate-400 dark:placeholder-gray-500 text-sm px-2"
           />
           
           <button onClick={handleBotmsg} className="w-9 h-9 rounded-full text-indigo-500 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition flex items-center justify-center mr-1 relative group">
              <i className="fas fa-robot"/><span className="absolute inset-0 bg-indigo-500/20 dark:bg-indigo-400/20 rounded-full animate-ping opacity-0 group-hover:opacity-100"/>
           </button>
           
           <button onClick={handleMessageSend} disabled={!message.trim()} className={`w-9 h-9 rounded-xl flex items-center justify-center text-white transition shadow-md ${message.trim() ? 'bg-secondary hover:bg-primary' : 'bg-slate-300 dark:bg-gray-600'}`}>
              <i className="fas fa-paper-plane text-xs"/>
           </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;