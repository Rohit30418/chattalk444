import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import getUserData from "../../hooks/getUserData";
import useUserCollection from "../useUserCollection";
import { useAuth } from "../auth/AppWrapper";
import MemberAppearancePanel from "./MemberAppearancePanel";
import useMobilePwaMode from "../../hooks/useMobilePwaMode";
import "../../styles/memberEffects.css";

const statConfig = [
  { type: "followers", label: "Followers", icon: "fa-user-group" },
  { type: "following", label: "Following", icon: "fa-user-plus" },
  { type: "friends", label: "Friends", icon: "fa-handshake" },
];

const learningCards = [
  { key: "streak", label: "Streak", icon: "fa-fire", tone: "amber" },
  { key: "weeklyGoal", label: "Weekly goal", icon: "fa-bullseye", tone: "teal" },
  { key: "level", label: "Level", icon: "fa-signal", tone: "blue" },
  { key: "xp", label: "XP", icon: "fa-bolt", tone: "violet" },
];

const toneClasses = {
  amber: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-300",
  teal: "border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-400/20 dark:bg-teal-500/10 dark:text-teal-300",
  blue: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-400/20 dark:bg-sky-500/10 dark:text-sky-300",
  violet: "border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-400/20 dark:bg-cyan-500/10 dark:text-cyan-300",
};

const cleanText = (value, fallback = "") =>
  typeof value === "string" && value.trim() ? value.trim() : fallback;

const safeNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const toList = (value, fallback = []) => {
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === "string" ? item.trim() : item?.name || item?.label || ""))
      .filter(Boolean);
  }

  if (typeof value === "string" && value.trim()) {
    return value.split(",").map((item) => item.trim()).filter(Boolean);
  }

  return fallback;
};

const getInitials = (name = "Vaani User") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "VU";

const getUserId = (user) => user?.uid || user?.id || user?.userId || user?._id || "";

const normalizeProfileTheme = (value) => {
  const theme = cleanText(value, "aurora").toLowerCase();
  return ["aurora", "gold", "galaxy"].includes(theme) ? theme : "aurora";
};

const Avatar = ({ src, name, className = "h-12 w-12", ring = false }) => {
  const [failed, setFailed] = useState(false);

  if (src && !failed) {
    return (
      <img
        src={src}
        alt={name}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className={`${className} rounded-full object-cover ${
          ring
            ? "border-4 border-white shadow-xl dark:border-[#0b1220]"
            : "border border-slate-200 dark:border-white/10"
        }`}
      />
    );
  }

  return (
    <div
      aria-label={name}
      className={`${className} flex items-center justify-center rounded-full bg-teal-700 font-black tracking-tight text-white ${
        ring ? "border-4 border-white shadow-xl dark:border-[#0b1220]" : ""
      }`}
    >
      {getInitials(name)}
    </div>
  );
};

const SectionTitle = ({ icon, title, subtitle }) => (
  <div className="flex items-start gap-3">
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300">
      <i className={`fa-solid ${icon} text-sm`} aria-hidden="true" />
    </span>
    <div className="min-w-0">
      <h2 className="text-base font-black tracking-tight text-slate-950 dark:text-white">{title}</h2>
      {subtitle && (
        <p className="mt-0.5 text-xs font-medium text-slate-500 dark:text-slate-400">{subtitle}</p>
      )}
    </div>
  </div>
);

const MyProfile = ({ socialActions = null }) => {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const { userId } = useParams();
  const { collectionsData = {}, loading, error } = useUserCollection(userId);
  const isMobilePwa = useMobilePwaMode();

  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [popupType, setPopupType] = useState("");
  const [optionType, setOptionType] = useState([]);
  const [userInfo, setUserInfo] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [popupLoading, setPopupLoading] = useState(false);
  const [popupSearch, setPopupSearch] = useState("");
  const [showAppearance, setShowAppearance] = useState(false);

  const pageTopPadding = isMobilePwa ? "pt-4 sm:pt-6" : "pt-[86px] lg:pt-[104px]";

  useEffect(() => {
    let mounted = true;

    const fetchUser = async () => {
      try {
        setProfileLoading(true);
        const data = await getUserData(userId);
        if (mounted) setUserInfo(data || null);
      } catch (err) {
        console.error("[MyProfile] Failed to fetch user:", err);
        if (mounted) setUserInfo(null);
      } finally {
        if (mounted) setProfileLoading(false);
      }
    };

    if (userId) fetchUser();
    return () => {
      mounted = false;
    };
  }, [userId]);

  const handleBack = useCallback(() => {
    if (window.history.length > 1) navigate(-1);
    else navigate("/rooms");
  }, [navigate]);

  const openPopup = useCallback(async (type) => {
    setPopupType(type);
    setPopupSearch("");
    setIsPopupOpen(true);
    setPopupLoading(true);

    try {
      const users = collectionsData[type] || [];
      const resolved = await Promise.all(
        users.map(async (item) => {
          const id = getUserId(item);
          return id ? getUserData(id) : null;
        })
      );
      setOptionType(resolved.filter(Boolean));
    } catch (err) {
      console.error("[MyProfile] Failed to fetch list:", err);
      setOptionType([]);
    } finally {
      setPopupLoading(false);
    }
  }, [collectionsData]);

  const closePopup = useCallback(() => {
    setIsPopupOpen(false);
    setOptionType([]);
    setPopupType("");
    setPopupSearch("");
  }, []);

  useEffect(() => {
    if (!isPopupOpen && !showAppearance) return undefined;
    const onKeyDown = (event) => {
      if (event.key !== "Escape") return;
      closePopup();
      setShowAppearance(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isPopupOpen, showAppearance, closePopup]);

  const displayName = cleanText(userInfo?.displayName || userInfo?.name, "Vaani User");
  const photoURL = cleanText(userInfo?.photoURL || userInfo?.avatar || userInfo?.photo, "");
  const coverPhotoURL = cleanText(userInfo?.coverPhotoURL || userInfo?.coverPhoto, "");
 
  const bio = cleanText(
    userInfo?.bio || userInfo?.about || userInfo?.description,
    "Learning languages and building confidence through real conversations."
  );
  const isMember = userInfo?.isMember === true;
  const isOwnProfile = Boolean(authUser?.uid && authUser.uid === userId);
  const profileTheme = normalizeProfileTheme(userInfo?.profileAnimationId);
  const location = cleanText(userInfo?.location || userInfo?.country || userInfo?.city, "");
  const isOnline = Boolean(userInfo?.isOnline || userInfo?.online || userInfo?.onlineStatus === "online");

  const languages = useMemo(
    () => toList(userInfo?.languages || userInfo?.spokenLanguages || userInfo?.language, ["English"]),
    [userInfo]
  );

  const interests = useMemo(
    () => toList(userInfo?.interests, ["Conversation", "Culture", "Travel", "Music"]),
    [userInfo]
  );

  const learning = useMemo(() => {
    const stats = userInfo?.learningStats || userInfo?.stats || {};
    return {
      streak: `${safeNumber(userInfo?.streak ?? stats?.streak, 0)} Days`,
      weeklyGoal: cleanText(String(userInfo?.weeklyGoal ?? stats?.weeklyGoal ?? "0/7"), "0/7"),
      level: cleanText(userInfo?.level || stats?.level, "Beginner"),
      xp: safeNumber(userInfo?.xp ?? stats?.xp, 0).toLocaleString(),
    };
  }, [userInfo]);

  const languageProgress = useMemo(() => {
    const raw = userInfo?.languageProgress || userInfo?.progress;
    if (Array.isArray(raw)) {
      return raw
        .map((item) => ({
          name: cleanText(item?.name || item?.language, "Language"),
          value: Math.max(0, Math.min(100, safeNumber(item?.value ?? item?.progress, 0))),
        }))
        .filter((item) => item.name && item.value > 0);
    }

    if (raw && typeof raw === "object") {
      return Object.entries(raw)
        .map(([name, value]) => ({ name, value: Math.max(0, Math.min(100, safeNumber(value, 0))) }))
        .filter((item) => item.value > 0);
    }

    return [];
  }, [userInfo]);

  const achievements = useMemo(() => {
    if (!Array.isArray(userInfo?.achievements)) return [];
    return userInfo.achievements
      .map((item) => (
        typeof item === "string"
          ? { title: item, description: "Vaani achievement", icon: "fa-medal" }
          : {
              title: cleanText(item?.title || item?.name, "Achievement"),
              description: cleanText(item?.description || item?.text, "Vaani achievement"),
              icon: cleanText(item?.icon, "fa-medal"),
            }
      ))
      .slice(0, 6);
  }, [userInfo]);

  const recentActivity = useMemo(() => {
    const activity = userInfo?.recentActivity || userInfo?.activity;
    if (!Array.isArray(activity)) return [];
    return activity.slice(0, 5).map((item) => (
      typeof item === "string"
        ? { title: item, time: "Recently", icon: "fa-circle" }
        : {
            title: cleanText(item?.title || item?.text, "Activity"),
            time: cleanText(item?.time || item?.createdAtLabel, "Recently"),
            icon: cleanText(item?.icon, "fa-circle"),
          }
    ));
  }, [userInfo]);

  const filteredOptions = useMemo(() => {
    const query = popupSearch.trim().toLowerCase();
    if (!query) return optionType;
    return optionType.filter((item) => cleanText(item?.displayName || item?.name, "").toLowerCase().includes(query));
  }, [optionType, popupSearch]);

  if (profileLoading || loading) {
    return (
      <main className="min-h-screen bg-slate-50 dark:bg-[#050713]">
        <div className={`mx-auto max-w-7xl px-4 pb-6 sm:px-6 ${pageTopPadding}`}>
          <div className="h-64 animate-pulse rounded-[2rem] bg-slate-200 dark:bg-white/[0.05]" />
          <div className="mx-6 -mt-12 h-24 w-24 animate-pulse rounded-full border-4 border-white bg-slate-300 dark:border-[#050713] dark:bg-white/10" />
        </div>
      </main>
    );
  }

  if (error || !userInfo) {
    return (
      <main className={`flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-[#050713] ${pageTopPadding}`}>
        <div className="w-full max-w-md rounded-[1.75rem] border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-white/10 dark:bg-[#101626]">
          <i className="fa-solid fa-triangle-exclamation text-2xl text-red-500" aria-hidden="true" />
          <h2 className="mt-4 text-xl font-black text-slate-950 dark:text-white">Profile not found</h2>
          <p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400">We could not load this profile right now.</p>
          <button type="button" onClick={handleBack} className="mt-6 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-black text-white">
            Go back
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 pb-10 text-slate-950 dark:bg-[#050713] dark:text-white">
      <div className={`mx-auto w-full max-w-7xl px-3 sm:px-6 ${pageTopPadding}`}>
        <section className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#0b1220] sm:rounded-[2rem]">
          <div className="relative h-48 overflow-hidden bg-[#082f36] sm:h-64 lg:h-72">
            {coverPhotoURL ? (
              <img src={coverPhotoURL} alt="Profile cover" className="h-full w-full object-cover" />
            ) : (
              <div className="absolute inset-0 bg-[linear-gradient(120deg,#062e33_0%,#0f766e_55%,#0284c7_100%)]" />
            )}
            <div className="absolute inset-0 bg-slate-950/20" />
            {isOnline && (
              <span className="absolute right-4 top-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/30 px-3 py-1.5 text-[10px] font-black text-white backdrop-blur-md">
                <span className="h-2 w-2 rounded-full bg-emerald-400" /> Online
              </span>
            )}
          </div>

          <div className="px-5 pb-6 sm:px-7 sm:pb-7">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex min-w-0 flex-col sm:flex-row sm:items-end sm:gap-5">
                <div className="relative -mt-14 shrink-0 sm:-mt-16">
                  {isMember ? (
                    <span className={`vaani-profile-frame vaani-profile-theme-${profileTheme}`}>
                      <Avatar src={photoURL} name={displayName} ring className="h-28 w-28 text-2xl sm:h-32 sm:w-32 sm:text-3xl" />
                    </span>
                  ) : (
                    <Avatar src={photoURL} name={displayName} ring className="h-28 w-28 text-2xl sm:h-32 sm:w-32 sm:text-3xl" />
                  )}
                  {isOnline && <span className="absolute bottom-2 right-2 h-5 w-5 rounded-full border-[3px] border-white bg-emerald-500 dark:border-[#0b1220]" />}
                </div>

                <div className="mt-4 min-w-0 pb-1 sm:mt-0">
                  <h1 className="truncate text-3xl font-black tracking-tight text-slate-950 dark:text-white sm:text-4xl">{displayName}</h1>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {location && (
                      <span className="inline-flex items-center gap-1.5">
                        <i className="fa-solid fa-location-dot" aria-hidden="true" /> {location}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1.5 text-teal-700 dark:text-teal-300">
                      <i className="fa-solid fa-language" aria-hidden="true" /> Language learner
                    </span>
                  </div>
                </div>
              </div>

              <div className="w-full my-4 lg:w-[360px]">
                {socialActions}
                <div className={`${socialActions ? "mt-2" : ""} grid gap-2 ${isOwnProfile && isMember ? "grid-cols-2" : "grid-cols-1"}`}>
                  {isOwnProfile && isMember && (
                    <button
                      type="button"
                      onClick={() => setShowAppearance(true)}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm font-black text-teal-700 transition-colors hover:bg-teal-100 dark:border-teal-400/20 dark:bg-teal-500/10 dark:text-teal-300"
                    >
                      <i className="fa-solid fa-wand-magic-sparkles text-xs" aria-hidden="true" />
                      Customize
                    </button>
                  )}
                  {/* <Link to="/rooms" className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 py-3 text-sm font-black text-white transition-colors hover:bg-teal-800">
                    <i className="fa-solid fa-microphone-lines text-xs" aria-hidden="true" />
                    Find a room
                  </Link> */}
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-3 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/[0.03]">
              {statConfig.map((item, index) => (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => openPopup(item.type)}
                  className={`flex items-center justify-center gap-2 px-2 py-4 transition-colors hover:bg-white dark:hover:bg-white/[0.05] ${index ? "border-l border-slate-200 dark:border-white/10" : ""}`}
                >
                  <i className={`fa-solid ${item.icon} hidden text-xs text-teal-700 dark:text-teal-300 sm:block`} aria-hidden="true" />
                  <span>
                    <span className="block text-xl font-black leading-none text-slate-950 dark:text-white">{collectionsData[item.type]?.length || 0}</span>
                    <span className="mt-1 block text-[9px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 sm:text-[10px]">{item.label}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>

        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(320px,.75fr)]">
          <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#101626] sm:p-6">
            <SectionTitle icon="fa-user" title="About" subtitle="Profile and conversation interests" />
            <p className="mt-5 text-sm font-medium leading-7 text-slate-600 dark:text-slate-300">{bio}</p>

            <div className="mt-6 border-t border-slate-100 pt-5 dark:border-white/[0.07]">
              <p className="mb-3 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Languages</p>
              <div className="flex flex-wrap gap-2">
                {languages.map((language) => (
                  <span key={language} className="inline-flex items-center gap-2 rounded-xl border border-teal-200 bg-teal-50 px-3 py-2 text-xs font-black text-teal-800 dark:border-teal-400/20 dark:bg-teal-500/10 dark:text-teal-200">
                    <i className="fa-solid fa-comment-dots text-[9px]" aria-hidden="true" /> {language}
                  </span>
                ))}
              </div>
            </div>

            {interests.length > 0 && (
              <div className="mt-5 border-t border-slate-100 pt-5 dark:border-white/[0.07]">
                <p className="mb-3 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Interests</p>
                <div className="flex flex-wrap gap-2">
                  {interests.map((interest) => (
                    <span key={interest} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300">{interest}</span>
                  ))}
                </div>
              </div>
            )}
          </section>

          <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#101626] sm:p-6">
            <SectionTitle icon="fa-chart-simple" title="Learning snapshot" subtitle="A quick view of progress" />
            <div className="mt-5 grid grid-cols-2 gap-3">
              {learningCards.map((card) => (
                <div key={card.key} className={`rounded-2xl border p-4 ${toneClasses[card.tone]}`}>
                  <i className={`fa-solid ${card.icon} text-sm`} aria-hidden="true" />
                  <div className="mt-3 truncate text-xl font-black text-slate-950 dark:text-white">{learning[card.key]}</div>
                  <div className="mt-1 text-[9px] font-black uppercase tracking-wider opacity-80">{card.label}</div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {languageProgress.length > 0 && (
          <section className="mt-5 rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#101626] sm:p-6">
            <SectionTitle icon="fa-bars-progress" title="Language progress" subtitle="Current learning progress" />
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              {languageProgress.map((item) => (
                <div key={item.name}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-black text-slate-800 dark:text-slate-200">{item.name}</span>
                    <span className="text-xs font-black text-slate-500">{item.value}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/[0.06]">
                    <div className="h-full rounded-full bg-teal-600 dark:bg-teal-400" style={{ width: `${item.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {(achievements.length > 0 || recentActivity.length > 0) && (
          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            {achievements.length > 0 && (
              <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#101626] sm:p-6">
                <SectionTitle icon="fa-award" title="Achievements" subtitle="Milestones earned on Vaani" />
                <div className="mt-5 grid gap-3">
                  {achievements.map((item, index) => (
                    <div key={`${item.title}-${index}`} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4 dark:bg-white/[0.03]">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300">
                        <i className={`fa-solid ${item.icon}`} aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-slate-900 dark:text-white">{item.title}</p>
                        <p className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {recentActivity.length > 0 && (
              <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#101626] sm:p-6">
                <SectionTitle icon="fa-clock-rotate-left" title="Recent activity" subtitle="Latest moments on Vaani" />
                <div className="mt-5 grid gap-3">
                  {recentActivity.map((item, index) => (
                    <div key={`${item.title}-${index}`} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4 dark:bg-white/[0.03]">
                      <i className={`fa-solid ${item.icon} text-xs text-teal-700 dark:text-teal-300`} aria-hidden="true" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-black text-slate-900 dark:text-white">{item.title}</p>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{item.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>

      {showAppearance && isOwnProfile && isMember && (
        <div className="fixed inset-0 z-[320] flex items-end justify-center bg-slate-950/70 p-0 sm:items-center sm:p-5" onMouseDown={(event) => {
          if (event.currentTarget === event.target) setShowAppearance(false);
        }}>
          <div className="flex max-h-[94dvh] w-full max-w-5xl flex-col overflow-hidden rounded-t-[1.75rem] border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#0b1220] sm:rounded-[1.75rem]">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-white/10">
              <div>
                <p className="text-sm font-black text-slate-950 dark:text-white">Customize your profile</p>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Decorations, banners and member effects</p>
              </div>
              <button type="button" onClick={() => setShowAppearance(false)} className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500 dark:bg-white/[0.06] dark:text-slate-300" aria-label="Close customization">
                <i className="fa-solid fa-xmark" aria-hidden="true" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
              <MemberAppearancePanel
                userInfo={userInfo}
                authUser={authUser}
                onUpdated={(updatedUser) => {
                  setUserInfo((current) => ({ ...(current || {}), ...updatedUser }));
                  setShowAppearance(false);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {isPopupOpen && (
        <div className="fixed inset-0 z-[300] flex items-end justify-center bg-slate-950/60 p-3 sm:items-center sm:p-6" onMouseDown={(event) => {
          if (event.currentTarget === event.target) closePopup();
        }}>
          <div className="flex max-h-[82vh] w-full max-w-lg flex-col overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-xl dark:border-white/10 dark:bg-[#101626]">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-white/[0.07]">
              <div>
                <h3 className="text-lg font-black capitalize text-slate-950 dark:text-white">{popupType}</h3>
                <p className="mt-0.5 text-xs font-semibold text-slate-500 dark:text-slate-400">{optionType.length} connection{optionType.length === 1 ? "" : "s"}</p>
              </div>
              <button type="button" onClick={closePopup} className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 dark:border-white/10 dark:text-slate-300" aria-label="Close connections">
                <i className="fa-solid fa-xmark" aria-hidden="true" />
              </button>
            </div>

            <div className="border-b border-slate-100 bg-slate-50 px-5 py-3 dark:border-white/[0.07] dark:bg-white/[0.02]">
              <div className="relative">
                <i className="fa-solid fa-search pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400" aria-hidden="true" />
                <input type="search" value={popupSearch} onChange={(event) => setPopupSearch(event.target.value)} placeholder="Search by name..." autoFocus className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 text-sm font-semibold text-slate-900 outline-none focus:border-teal-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-white" />
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4">
              {popupLoading ? (
                <div className="p-6 text-center text-sm font-bold text-slate-500">Loading...</div>
              ) : filteredOptions.length ? (
                <ul className="space-y-1">
                  {filteredOptions.map((item, index) => {
                    const id = getUserId(item);
                    const name = cleanText(item?.displayName || item?.name, "Vaani User");
                    const avatar = cleanText(item?.photoURL || item?.avatar || item?.photo, "");
                    return (
                      <li key={id || index}>
                        <Link to={id ? `/profile/${id}` : "#"} onClick={id ? closePopup : undefined} className="group flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.04]">
                          <Avatar src={avatar} name={name} className="h-11 w-11 text-xs" />
                          <p className="min-w-0 flex-1 truncate text-sm font-black text-slate-900 group-hover:text-teal-700 dark:text-white dark:group-hover:text-teal-300">{name}</p>
                          <i className="fa-solid fa-arrow-right text-[9px] text-slate-400" aria-hidden="true" />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="p-8 text-center text-sm font-semibold text-slate-500">No {popupType} to show.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default MyProfile;
