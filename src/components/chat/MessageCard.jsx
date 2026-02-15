import LottieEmoji from "../AppBody/LottieEmoji"; 
import botimg from "../../assets/robot.png";
import { useState } from "react";

const MessageCard = ({ msgData, uId, onReply }) => {
  const [isReadMore, setIsReadMore] = useState(true);

  const isEmoji = () => {
    return (
      typeof msgData?.text === "string" &&
      /^\p{Emoji}+$/u.test(msgData.text.trim())
    );
  };

  const isEmojiMessage = isEmoji();

  const seconds = msgData?.timestampField?.seconds;
  const time = seconds
    ? new Date(seconds * 1000).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
    : "Invalid time";

  const isOwnMessage = uId === msgData.userid;

  const renderText = () => {
    if (msgData.text.length <= 100) return msgData.text;
    return (
      <>
        {isReadMore ? msgData.text.slice(0, 100) + "..." : msgData.text}
        <span
          className="text-blue-700 cursor-pointer ml-1"
          onClick={() => setIsReadMore(!isReadMore)}
        >
          {isReadMore ? "Read More" : "Show Less"}
        </span>
      </>
    );
  };

  return (
    <div className={`w-full flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-1 group`}>
      
      <div className={`flex items-center gap-2 max-w-[85%] ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
        
        {/* Avatar (Only for others) */}
        {!isOwnMessage && (
           <img
             referrerPolicy="no-referrer"
             src={msgData.role === "bot" ? botimg : msgData?.photoURL}
             className="w-10 h-10 rounded-full object-cover self-end mb-4"
             alt="User"
           />
        )}

        {/* Message Bubble */}
        <div
          className={`relative py-1 px-2 rounded-md shadow-sm mb-4 min-w-[90px] ${
            isEmojiMessage 
              ? "bg-transparent shadow-none" 
              : isOwnMessage 
                  ? "bg-gradient-to-r bg-primary/90 text-white" 
                  : "bg-white text-black"
          }`}
        >
          {/* Reply Content Preview */}
          {!isEmojiMessage && msgData?.replyto && (
             <div className={`text-xs border-l-2 mb-1 p-1 rounded bg-black/10 ${isOwnMessage ? "border-white/50" : "border-primary"}`}>
                <span className="font-bold block opacity-75">{msgData.replytoName}</span>
                <span className="block opacity-80 truncate max-w-[150px]">{msgData.replyto}</span>
             </div>
          )}

          {/* Content */}
          <div className="px-1 relative"> 
             {isEmojiMessage ? (
                // Animated Emoji
                <div className="hover:scale-110 transition-transform duration-200 origin-center">
                    <LottieEmoji
                      codepoint={msgData?.text}
                      width="70px"
                      height="70px"
                    />
                </div>
             ) : (
                <div className="pb-4 pt-1">
                   {msgData?.role === "bot" && <span className="font-bold opacity-75 text-xs block mb-0.5 text-primary/90">@AI</span>}
                   <span className="text-sm whitespace-pre-wrap">{renderText()}</span>
                </div>
             )}
             
             {/* 🔥 TIME STAMP FIX */}
             <span 
               className={`absolute bottom-[-6px] right-0 text-[10px] font-medium
               ${isEmojiMessage 
                  ? "text-gray-500 dark:text-gray-400" // Emoji = Always Dark Gray (Visible on white)
                  : isOwnMessage 
                      ? "text-slate-200" // Own Text = Light (Visible on Blue)
                      : "text-gray-400"  // Other Text = Gray (Visible on White)
               }`}
             >
               {time} {isOwnMessage && <i className="fa fa-check ml-0.5"></i>}
             </span>
          </div>
        </div>

        {/* Reply Action Button */}
        <button 
          onClick={() => onReply(msgData)}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-primary"
          title="Reply"
        >
          <i className="fas fa-reply"></i>
        </button>

      </div>
    </div>
  );
};

export default MessageCard;