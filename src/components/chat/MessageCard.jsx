import LottieEmoji from "../AppBody/LottieEmoji";
import botimg from "../../assets/robot.png";
import { useState } from "react";

const MessageCard = ({ msgData, uId }) => {
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
    <>
      {isOwnMessage ? (
        <div className="flex items-center">
          <div
            className={`bg-gradient-to-r mb-4 min-w-[90px] max-w-fit ml-auto ${
              isEmojiMessage ? "" : "bg-primary/90 text-white"
            } text-black py-1 px-2 rounded-md`}
          >
            <p className="px-2 flex items-center relative">
              {isEmojiMessage ? (
                <LottieEmoji
                  codepoint={msgData?.text}
                  width="70px"
                  height="70px"
                />
              ) : (
                <span className="pb-3">
                  {msgData?.role === "bot" && (
                    <span className="text-primary/90">@AI </span>
                  )}
                  {msgData?.text}
                </span>
              )}
              <small
                className={`block absolute ${
                  isEmojiMessage ? "bottom-[-15px]" : "bottom-[-4px]"
                } right-0 text-right text-slate-200`}
              >
                {time} <i className="fa fa-check"></i>
              </small>
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 max-w-fit mr-auto">
          <img
            referrerPolicy="no-referrer"
            src={msgData.role === "bot" ? botimg : msgData?.photoURL}
            className="w-10 h-10 rounded-full"
            alt="User"
          />
          <div
            className={`bg-gradient-to-r mb-4 min-w-[90px] ${
              isEmojiMessage ? "" : "bg-white"
            } text-black py-1 px-2 rounded-md shadow-sm`}
          >
            <p className="relative">
              {isEmojiMessage ? (
                <LottieEmoji
                  codepoint={msgData?.text}
                  width="60px"
                  height="60px"
                />
              ) : (
                <div>
                  {/* 🔁 Reply-to preview (if it's a reply message) */}
                  {msgData?.replyto && (
                    <div className="bg-primary/10 border-l-2 border-primary p-2 rounded-sm mb-2">
                      <div className="flex gap-1 items-center text-sm font-semibold text-gray-700">
                        <img
                          src={msgData?.replytophoto || botimg}
                          alt={msgData?.replytoName || "user"}
                          className="w-5 h-5 rounded-full"
                        />
                        <p>{msgData?.replytoName || "User"}</p>
                      </div>
                      <p className="text-sm text-gray-600 whitespace-nowrap overflow-hidden text-ellipsis">
                        {msgData.replyto}
                      </p>
                    </div>
                  )}

                  <span className="pb-3 block">{renderText()}</span>
                </div>
              )}
              <small
                className={`block absolute ${
                  isEmojiMessage ? "bottom-[-15px]" : "bottom-[-4px]"
                } right-0 text-right text-gray-400`}
              >
                {time}
              </small>
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default MessageCard;
