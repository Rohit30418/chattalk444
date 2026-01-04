import React from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

const AiCard = ({ pageName, title, description, avatar }) => {
  const navigate = useNavigate();

  const handleTalkNow = async () => {
    const { value: password } = await Swal.fire({
      title: "Authentication Required",
      text: "Enter access code to chat with AI",
      input: "password",
      inputPlaceholder: "Enter PIN (1178)",
      showCancelButton: true,
      confirmButtonText: "Unlock",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#4f46e5", // Indigo-600
      cancelButtonColor: "#ef4444",
      background: "#fff", // Will be overridden by customClass in CSS if global styles exist, but we use classes below
      customClass: {
        popup: 'dark:bg-slate-800  rounded-2xl',
        input: 'dark:bg-slate-900  dark:border-slate-700',
        confirmButton: 'rounded-xl px-6',
        cancelButton: 'rounded-xl px-6'
      },
      inputAttributes: {
        autocapitalize: "off",
        autocorrect: "off",
      },
    });

    if (password === "1178") {
      Swal.fire({
        icon: "success",
        title: "Access Granted",
        showConfirmButton: false,
        timer: 1000,
        customClass: {
          popup: 'dark:bg-slate-800 dark:text-white rounded-2xl'
        }
      });
      navigate("/aiBot");
    } else if (password) {
      Swal.fire({
        icon: "error",
        title: "Access Denied",
        text: "Incorrect password entered.",
        customClass: {
           popup: 'dark:bg-slate-800 dark:text-white rounded-2xl'
        }
      });
    }
  };

  return (
    <div className="h-full">
      <div
        className="relative group h-[300px] flex flex-col items-center justify-between bg-white dark:bg-slate-900 rounded-3xl border border-indigo-100 dark:border-indigo-900/50 p-6 shadow-xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-500/10"
      >
        {/* Decorative Background Gradients */}
        {/* <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div> */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-all duration-500"></div>
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all duration-500"></div>

        {/* Top Section: Badge */}
        <div className="w-full flex justify-between items-start z-10">
          <span
            className="inline-flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 
            px-3 py-1 rounded-lg text-xs font-bold border border-indigo-100 dark:border-indigo-800 tracking-wide uppercase"
          >
            <i className="fa-solid fa-robot text-sm"></i> {pageName}
          </span>
          {/* Lock Icon */}
          <span className="text-gray-300 dark:text-gray-600 group-hover:text-indigo-400 transition-colors">
            <i className="fa-solid fa-lock"></i>
          </span>
        </div>

        {/* Middle Section: Avatar & Info */}
        <div className="flex flex-col items-center z-10 w-full">
          {/* Avatar with Glow */}
          <div className="relative mb-4">
            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-2xl blur opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
            <img
              src={avatar || "https://api.dicebear.com/7.x/bottts/svg?seed=Luna"}
              alt="AI Character"
              className="relative w-24 h-24 rounded-2xl object-cover border-4 border-white dark:border-slate-800 shadow-md transform group-hover:rotate-3 transition-transform duration-300 bg-indigo-50"
            />
          </div>

          {/* Text */}
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
            {title}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center line-clamp-2 px-2">
            {description}
          </p>
        </div>

        {/* Bottom Section: Button */}
        <div className="w-full mt-2 z-10">
          <button
            onClick={handleTalkNow}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 transform transition-all duration-200 active:scale-95 flex items-center justify-center gap-2"
          >
            <span>Talk Now</span>
            <i className="fa-solid fa-microphone-lines animate-pulse"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AiCard;