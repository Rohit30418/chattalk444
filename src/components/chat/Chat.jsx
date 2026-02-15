import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Timestamp, 
  collection, 
  doc, 
  updateDoc, 
  serverTimestamp 
} from 'firebase/firestore';

import useAddMessage from '../../hooks/useAddMessage';
import useChatPagination from '../../hooks/useChatPagination'; 
import getUserDataFromFirestore from '../../hooks/getUserData';
import useToggleSidebarFirebase from '../../hooks/useToggleSidebarFirebase';
import useMarkAsRead from '../../hooks/useDeleteUnseenCount'; 
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
  const [replyingTo, setReplyingTo] = useState(null);
  
  const { id } = useParams();
  const dispatch = useDispatch();
  const addMessage = useAddMessage();
  const markAsRead = useMarkAsRead(); 
  
  const { messages, loading, loadMore, hasMore } = useChatPagination(id);
  
  const chatBoxRef = useRef(null);
  const bottomRef = useRef(null); 
  const msgPop = new Audio(msgpop);

  // --- Auto-Mark Read ---
  useEffect(() => {
    if (messages.length > 0) {
        markAsRead(uId);
    }
  }, [messages, uId]); 

  // --- Scroll Logic ---
  const handleScroll = (e) => {
    if (e.target.scrollTop === 0 && hasMore && !loading) {
       const oldHeight = e.target.scrollHeight;
       loadMore().then(() => {
          requestAnimationFrame(() => {
             const newHeight = e.target.scrollHeight;
             e.target.scrollTop = newHeight - oldHeight;
          });
       });
    }
  };

// --- Auto-Scroll Logic (FIXED) ---
  useEffect(() => {
    if (!bottomRef.current) return;

    const timeoutId = setTimeout(() => {
      // Check if the scroll is "near" the bottom or if it's a forced scroll
      bottomRef.current.scrollIntoView({ 
        behavior: messages.length <= 20 ? "auto" : "smooth", // Instant on load, Smooth on chat
        block: "end",
      });
    }, 100); // <--- Wait 100ms for React to render the new bubble height

    return () => clearTimeout(timeoutId);
  }, [messages.length, loading]); // Added 'loading' to catch the initial load event
  useEffect(() => {
    getUserDataFromFirestore(uId).then(setCurrentUser).catch(console.error);
  }, [uId]);

  // --- Send Message Logic (Standard) ---
  const handleMessageSend = useCallback(async () => {
    if (!message.trim()) return;

    const txt = message.trim();
    const now = new Date();

    // 1. Safe Reply Data Construction
    const replyData = replyingTo ? {
        replyto: replyingTo.text,
        // Check if it's a bot, otherwise fallback to name or "User"
        replytoName: replyingTo.role === 'bot' ? "AI" : (replyingTo.displayName || replyingTo.senderName || "User"),
        replytophoto: replyingTo.photoURL || null // Fallback to null (Fixes crash)
    } : {};

    setMessage('');
    setReplyingTo(null); 
    msgPop.play().catch(e => console.log(e)); 

    await addMessage({
      text: txt, 
      role: "user", 
      timestampField: Timestamp.fromDate(now), 
      seenBy: {}, 
      ...(currentUser || {}),
      ...replyData
    });

    try {
      const roomRef = doc(db, 'rooms', id);
      await updateDoc(roomRef, {
        lastMessage: {
          text: txt,
          senderId: uId,
          senderName: currentUser?.displayName || "User",
          timestamp: serverTimestamp(),
        },
        lastActive: serverTimestamp()
      });
    } catch (err) { console.error(err); }
  }, [addMessage, currentUser, id, message, uId, msgPop, replyingTo]);

  // --- AI Bot Logic (Context Aware) ---
  const handleBotmsg = useCallback(async () => {
    if (!message.trim()) return;
    const userMsg = message.trim();
    
    // 1. Capture Reply Context BEFORE clearing state
    // If the user is replying to a specific message, we MUST tell the AI about it.
    const specificContext = replyingTo 
        ? `\n[SYSTEM: The user is explicitly replying to this message: "${replyingTo.text}"]` 
        : "";

    // 2. Prepare History
    let historyText = messages.slice(0, 6).reverse()
        .map(m => `${m.data.role === 'user' ? 'User' : 'AI'}: ${m.data.text}`)
        .join('\n');
    
    // Append the specific context to history so AI sees it last
    historyText += specificContext;

    // 3. Save User Message (With Reply Metadata)
    const replyData = replyingTo ? {
        replyto: replyingTo.text,
        replytoName: replyingTo.role === 'bot' ? "AI" : (replyingTo.displayName || replyingTo.senderName || "User"),
        replytophoto: replyingTo.photoURL || null
    } : {};

    setMessage('');
    setReplyingTo(null);
    msgPop.play().catch(e => console.log(e));
    
    await addMessage({ 
        text: userMsg, 
        role: "user", 
        timestampField: Timestamp.fromDate(new Date()), 
        seenBy: {}, 
        ...(currentUser || {}),
        ...replyData
    });

    // 4. Pass Context to AI
    const botReplyString = await openAIChat(userMsg, historyText);
    
    if (botReplyString) {
       await addMessage({ 
           text: botReplyString, 
           role: "bot", 
           timestampField: Timestamp.fromDate(new Date()), 
           replyto: userMsg, 
           replytoName: currentUser?.displayName 
       });

       try {
         const roomRef = doc(db, 'rooms', id);
         await updateDoc(roomRef, {
           lastMessage: {
             text: "🤖 " + botReplyString.substring(0, 30) + "...",
             senderId: "ai-bot",
             senderName: "AI Assistant",
             timestamp: serverTimestamp(),
           }
         });
       } catch (err) { console.error(err); }
    }
  }, [message, addMessage, currentUser, id, msgPop, messages, replyingTo]); // Added replyingTo


  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 font-sans transition-colors duration-300">
      
      {/* Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-slate-100 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur z-10 flex-none">
        <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-800 dark:text-gray-100">Group Chat</h2>
        </div>
        <button 
          onClick={async () => {
            dispatch(toggleChatSidebar(false));
            await useToggleSidebarFirebase(id, uId, false);
          }}
          className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-gray-800 flex items-center justify-center text-slate-500 dark:text-gray-400 hover:text-red-500 transition"
        >
          <i className="fas fa-times text-lg"></i>
        </button>
      </div>

      {/* Message List */}
      <div 
        ref={chatBoxRef} 
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3 bg-slate-50 dark:bg-gray-900"
      >
        {loading && hasMore && (
           <div className="w-full flex justify-center py-2">
              <i className="fas fa-spinner fa-spin text-gray-400"></i>
           </div>
        )}

        {/* Welcome Message */}
        {!hasMore && !loading && (
            <div className="flex flex-col items-center justify-center my-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl text-center animate-fade-in">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center mb-2">
                    <i className="fas fa-shield-halved text-blue-500 dark:text-blue-300 text-xl"></i>
                </div>
                <h3 className="font-bold text-slate-700 dark:text-gray-200">Welcome to the Room!</h3>
                <p className="text-xs text-slate-500 dark:text-gray-400 mt-1 max-w-[250px]">
                    Be respectful. No toxicity, trolling, or spam. Keep the vibes chill. ✌️
                </p>
            </div>
        )}

        {messages.map((msg) => (
           <MessageCard 
             key={msg.id} 
             uId={uId} 
             msgData={msg.data} 
             onReply={setReplyingTo} 
           />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 border-t border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex-none relative">
        
        {/* 🔥 Smart Reply UI */}
        {replyingTo && (
           <div className="flex items-center justify-between bg-slate-100 dark:bg-gray-800 p-2 rounded-t-lg border-l-4 border-indigo-500 mb-2">
              <div className="flex flex-col text-sm overflow-hidden">
                  <span className="text-indigo-500 font-bold text-xs">
                     {/* Check if it's a Bot Reply */}
                     Replying to {replyingTo.role === 'bot' ? "AI" : (replyingTo.displayName || replyingTo.senderName || "User")}
                  </span>
                  <span className="text-slate-500 dark:text-gray-400 truncate max-w-[200px] text-xs">
                     {replyingTo.text}
                  </span>
              </div>
              <button 
                onClick={() => setReplyingTo(null)} 
                className="text-slate-400 hover:text-red-500 p-1 transition-colors"
              >
                  <i className="fas fa-times"></i>
              </button>
           </div>
        )}

        {isOpenEmoji && (
           <div className="absolute bottom-20 left-4 z-50 shadow-xl border border-slate-100 dark:border-gray-700 rounded-xl">
             <EmojiPicker 
                theme="auto" 
                onEmojiClick={(e) => { setMessage(p => p + e.emoji); setIsOpenEmoji(false); }} 
                height={350}
             />
           </div>
        )}
        
        <div className="flex items-center bg-slate-100 dark:bg-gray-800 rounded-2xl px-2 py-2 border border-transparent focus-within:border-blue-400 dark:focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 dark:focus-within:ring-blue-900/30 transition-all">
           
           <button onClick={() => setIsOpenEmoji(!isOpenEmoji)} className="w-9 h-9 rounded-full text-slate-500 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700 hover:text-yellow-500 transition flex items-center justify-center">
             <i className="far fa-smile text-lg"/>
           </button>
           
           <input 
             type="text" value={message} onChange={(e) => setMessage(e.target.value)} 
             onKeyDown={(e) => e.key === 'Enter' && handleMessageSend()}
             placeholder="Message..." 
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