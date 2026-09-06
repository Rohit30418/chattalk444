import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import getUserData from "../../hooks/getUserData";
import useUserCollection from "../useUserCollection";

const statConfig = [
  { type: "followers", label: "Followers", icon: "fa-user-group" },
  { type: "following", label: "Following", icon: "fa-user-plus" },
  { type: "friends", label: "Friends", icon: "fa-handshake" },
];

const learningCards = [
  { key: "streak", label: "Current streak", icon: "fa-fire", tone: "amber" },
  { key: "weeklyGoal", label: "Weekly goal", icon: "fa-bullseye", tone: "teal" },
  { key: "level", label: "Speaking level", icon: "fa-signal", tone: "blue" },
  { key: "xp", label: "Total XP", icon: "fa-bolt", tone: "violet" },
];

const toneClasses = {
  amber: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-300",
  teal: "border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-400/20 dark:bg-teal-500/10 dark:text-teal-300",
  blue: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-400/20 dark:bg-blue-500/10 dark:text-blue-300",
  violet: "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-400/20 dark:bg-violet-500/10 dark:text-violet-300",
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
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
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
            ? "border-4 border-white shadow-sm dark:border-[#101626]"
            : "border border-slate-200 dark:border-white/10"
        }`}
      />
    );
  }

  return (
    <div
      aria-label={name}
      className={`${className} flex items-center justify-center rounded-full bg-teal-700 font-black tracking-tight text-white ${
        ring ? "border-4 border-white shadow-sm dark:border-[#101626]" : ""
      }`}
    >
      {getInitials(name)}
    </div>
  );
};

const SectionHeader = ({ icon, title, subtitle }) => (
  <div className="mb-5 flex items-start gap-3">
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300">
      <i className={`fa-solid ${icon} text-sm`} aria-hidden="true" />
    </div>
    <div>
      <h2 className="text-base font-black tracking-tight text-slate-950 dark:text-white">{title}</h2>
      {subtitle && (
        <p className="mt-0.5 text-xs font-medium text-slate-500 dark:text-slate-400">{subtitle}</p>
      )}
    </div>
  </div>
);

const EmptyState = ({ icon, title, text }) => (
  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center dark:border-white/10 dark:bg-white/[0.03]">
    <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-white text-slate-400 shadow-sm dark:bg-white/[0.05] dark:text-slate-500">
      <i className={`fa-solid ${icon}`} aria-hidden="true" />
    </div>
    <h3 className="mt-3 text-sm font-black text-slate-900 dark:text-white">{title}</h3>
    <p className="mx-auto mt-1 max-w-xs text-xs font-medium leading-5 text-slate-500 dark:text-slate-400">{text}</p>
  </div>
);

const MyProfile = () => {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [popupType, setPopupType] = useState("");
  const [optionType, setOptionType] = useState([]);
  const [userInfo, setUserInfo] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [popupLoading, setPopupLoading] = useState(false);
  const [popupSearch, setPopupSearch] = useState("");

  const { userId } = useParams();
  const { collectionsData = {}, loading, error } = useUserCollection(userId);

  useEffect(() => {
    let isMounted = true;

    const fetchUserData = async () => {
      try {
        setProfileLoading(true);
        const userData = await getUserData(userId);
        if (isMounted) setUserInfo(userData || null);
      } catch (err) {
        console.error("[MyProfile] Failed to fetch user:", err);
        if (isMounted) setUserInfo(null);
      } finally {
        if (isMounted) setProfileLoading(false);
      }
    };

    if (userId) fetchUserData();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  const openPopup = useCallback(
    async (type) => {
      setPopupType(type);
      setPopupSearch("");
      setIsPopupOpen(true);
      setPopupLoading(true);

      try {
        const usersList = collectionsData[type] || [];
        const resolvedUsers = await Promise.all(
          usersList.map(async (user) => {
            const id = getUserId(user);
            if (!id) return null;
            return getUserData(id);
          })
        );
        setOptionType(resolvedUsers.filter(Boolean));
      } catch (err) {
        console.error("[MyProfile] Failed to fetch list:", err);
        setOptionType([]);
      } finally {
        setPopupLoading(false);
      }
    },
    [collectionsData]
  );

  const closePopup = useCallback(() => {
    setIsPopupOpen(false);
    setOptionType([]);
    setPopupType("");
    setPopupSearch("");
  }, []);

  useEffect(() => {
    if (!isPopupOpen) return undefined;

    const onKeyDown = (event) => {
      if (event.key === "Escape") closePopup();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isPopupOpen, closePopup]);

  const displayName = cleanText(userInfo?.displayName || userInfo?.name, "Vaani User");
  const email = cleanText(userInfo?.email, "Vaani learner");
  const photoURL = cleanText(userInfo?.photoURL || userInfo?.avatar || userInfo?.photo, "");
  const coverPhotoURL = cleanText(userInfo?.coverPhotoURL || userInfo?.coverPhoto, "");
  const bio = cleanText(
    userInfo?.bio || userInfo?.about || userInfo?.description,
    "Learning languages, meeting new people, and building confidence through real conversations."
  );

  const languages = useMemo(
    () =>
      toList(
        userInfo?.languages || userInfo?.spokenLanguages || userInfo?.language,
        ["English"]
      ),
    [userInfo]
  );

  const interests = useMemo(
    () => toList(userInfo?.interests, ["Conversation", "Culture", "Travel", "Music"]),
    [userInfo]
  );

  const isOnline = Boolean(userInfo?.isOnline || userInfo?.online || userInfo?.onlineStatus === "online");
  const location = cleanText(userInfo?.location || userInfo?.country || userInfo?.city, "");
  const joinedLabel = cleanText(userInfo?.joinedLabel || userInfo?.memberSince, "Vaani member");

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

    if (Array.isArray(raw) && raw.length) {
      return raw
        .map((item) => ({
          name: cleanText(item?.name || item?.language, "Language"),
          value: Math.max(0, Math.min(100, safeNumber(item?.value ?? item?.progress, 0))),
        }))
        .filter((item) => item.name);
    }

    if (raw && typeof raw === "object") {
      const entries = Object.entries(raw).map(([name, value]) => ({
        name,
        value: Math.max(0, Math.min(100, safeNumber(value, 0))),
      }));
      if (entries.length) return entries;
    }

    return languages.slice(0, 3).map((name) => ({ name, value: 0 }));
  }, [userInfo, languages]);

  const achievements = useMemo(
    () =>
      Array.isArray(userInfo?.achievements)
        ? userInfo.achievements
            .map((item) =>
              typeof item === "string"
                ? { title: item, description: "Vaani achievement", icon: "fa-medal" }
                : {
                    title: cleanText(item?.title || item?.name, "Achievement"),
                    description: cleanText(item?.description || item?.text, "Vaani achievement"),
                    icon: cleanText(item?.icon, "fa-medal"),
                  }
            )
            .slice(0, 6)
        : [],
    [userInfo]
  );

  const recentActivity = useMemo(() => {
    const activity = userInfo?.recentActivity || userInfo?.activity;
    if (!Array.isArray(activity)) return [];

    return activity.slice(0, 5).map((item) =>
      typeof item === "string"
        ? { title: item, time: "Recently", icon: "fa-circle" }
        : {
            title: cleanText(item?.title || item?.text, "Activity"),
            time: cleanText(item?.time || item?.createdAtLabel, "Recently"),
            icon: cleanText(item?.icon, "fa-circle"),
          }
    );
  }, [userInfo]);

  const filteredOptions = useMemo(() => {
    const query = popupSearch.trim().toLowerCase();
    if (!query) return optionType;

    return optionType.filter((user) => {
      const name = cleanText(user?.displayName || user?.name, "").toLowerCase();
      const userEmail = cleanText(user?.email, "").toLowerCase();
      return name.includes(query) || userEmail.includes(query);
    });
  }, [optionType, popupSearch]);

  if (profileLoading || loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 pb-14 pt-24 dark:bg-[#050713] sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#101626]">
            <div className="h-52 bg-slate-200 dark:bg-white/[0.05] sm:h-64" />
            <div className="px-5 pb-8 sm:px-8">
              <div className="-mt-14 h-28 w-28 rounded-full border-4 border-white bg-slate-200 dark:border-[#101626] dark:bg-slate-800 sm:-mt-16 sm:h-32 sm:w-32" />
              <div className="mt-5 h-7 w-48 rounded-lg bg-slate-200 dark:bg-white/[0.06]" />
              <div className="mt-3 h-4 w-64 max-w-full rounded-lg bg-slate-100 dark:bg-white/[0.04]" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error || !userInfo) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-[#050713]">
        <div className="w-full max-w-md rounded-[1.75rem] border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-white/10 dark:bg-[#101626]">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500 dark:bg-red-500/10">
            <i className="fa-solid fa-triangle-exclamation text-xl" aria-hidden="true" />
          </div>
          <h2 className="mt-5 text-xl font-black text-slate-950 dark:text-white">Profile not found</h2>
          <p className="mt-2 text-sm font-medium leading-6 text-slate-500 dark:text-slate-400">
            We could not load this profile right now. Please try again later.
          </p>
          <Link
            to="/rooms"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-black text-white transition-colors hover:bg-teal-800"
          >
            <i className="fa-solid fa-arrow-left text-xs" aria-hidden="true" />
            Back to rooms
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 pb-16 pt-20 text-slate-950 dark:bg-[#050713] dark:text-white sm:pt-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-5 flex items-center justify-between gap-4">
          <Link
            to="/rooms"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-black text-slate-700 shadow-sm transition-colors hover:bg-slate-50 dark:border-white/10 dark:bg-[#101626] dark:text-slate-200 dark:hover:bg-white/[0.06]"
          >
            <i className="fa-solid fa-arrow-left text-[10px]" aria-hidden="true" />
            Rooms
          </Link>

          <div className="hidden items-center gap-2 text-xs font-bold text-slate-400 sm:flex">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-700 text-white">
              <i className="fa-solid fa-comments text-[10px]" aria-hidden="true" />
            </span>
            Vaani profile
          </div>
        </div>

        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#101626]">
          <div className="relative h-48 overflow-hidden bg-[#082f36] sm:h-64 lg:h-72">
            {coverPhotoURL ? (
              <img
                src={coverPhotoURL}
                alt="Profile cover"
                decoding="async"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-[linear-gradient(120deg,#062e33_0%,#0f766e_55%,#0d9488_100%)]" />
            )}

            <div className="absolute inset-0 bg-slate-950/25" />
            <div className="absolute left-5 top-5 flex items-center gap-2 sm:left-7 sm:top-7">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-slate-950/35 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-white">
                <i className="fa-solid fa-language text-teal-200" aria-hidden="true" />
                Language learner
              </span>
              {isOnline && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/20 bg-emerald-500/20 px-2.5 py-1.5 text-[10px] font-black text-emerald-100">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                  Online
                </span>
              )}
            </div>
          </div>

          <div className="px-5 pb-7 sm:px-8 sm:pb-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex min-w-0 flex-col sm:flex-row sm:items-end sm:gap-5">
                <div className="relative -mt-14 shrink-0 sm:-mt-16">
                  <Avatar
                    src={photoURL}
                    name={displayName}
                    ring
                    className="h-28 w-28 text-2xl sm:h-32 sm:w-32 sm:text-3xl"
                  />
                  {isOnline && (
                    <span
                      className="absolute bottom-2 right-2 h-5 w-5 rounded-full border-[3px] border-white bg-emerald-500 dark:border-[#101626]"
                      title="Online"
                    />
                  )}
                </div>

                <div className="mt-4 min-w-0 pb-1 sm:mt-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="truncate text-2xl font-black tracking-tight text-slate-950 dark:text-white sm:text-3xl">
                      {displayName}
                    </h1>
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300" title="Vaani learner">
                      <i className="fa-solid fa-check text-[9px]" aria-hidden="true" />
                    </span>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                    <span className="inline-flex items-center gap-2">
                      <i className="fa-regular fa-envelope text-slate-400" aria-hidden="true" />
                      {email}
                    </span>
                    {location && (
                      <span className="inline-flex items-center gap-2">
                        <i className="fa-solid fa-location-dot text-slate-400" aria-hidden="true" />
                        {location}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-2">
                      <i className="fa-regular fa-circle-check text-slate-400" aria-hidden="true" />
                      {joinedLabel}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 gap-2">
                <Link
                  to="/rooms"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-black text-white transition-colors hover:bg-teal-800"
                >
                  <i className="fa-solid fa-microphone-lines text-xs" aria-hidden="true" />
                  Find a room
                </Link>
              </div>
            </div>

            <div className="mt-7 grid grid-cols-3 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/[0.03]">
              {statConfig.map((item, index) => (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => openPopup(item.type)}
                  className={`group flex items-center justify-center gap-3 px-3 py-4 text-left transition-colors hover:bg-white dark:hover:bg-white/[0.05] sm:px-5 ${
                    index > 0 ? "border-l border-slate-200 dark:border-white/10" : ""
                  }`}
                >
                  <span className="hidden h-9 w-9 items-center justify-center rounded-xl bg-white text-slate-400 shadow-sm group-hover:text-teal-700 dark:bg-white/[0.05] dark:group-hover:text-teal-300 sm:flex">
                    <i className={`fa-solid ${item.icon} text-xs`} aria-hidden="true" />
                  </span>
                  <span>
                    <span className="block text-lg font-black leading-none text-slate-950 dark:text-white sm:text-xl">
                      {collectionsData[item.type]?.length || 0}
                    </span>
                    <span className="mt-1 block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      {item.label}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
          <aside className="space-y-6">
            <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#101626]">
              <SectionHeader icon="fa-user" title="About" subtitle="A little about this learner" />
              <p className="text-sm font-medium leading-7 text-slate-600 dark:text-slate-300">{bio}</p>
            </section>

            <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#101626]">
              <SectionHeader icon="fa-language" title="Languages" subtitle="Languages they are practicing" />
              <div className="flex flex-wrap gap-2">
                {languages.map((language, index) => (
                  <span
                    key={`${language}-${index}`}
                    className="inline-flex items-center gap-2 rounded-xl border border-teal-200 bg-teal-50 px-3 py-2 text-xs font-black text-teal-800 dark:border-teal-400/20 dark:bg-teal-500/10 dark:text-teal-200"
                  >
                    <i className="fa-solid fa-comment-dots text-[9px]" aria-hidden="true" />
                    {language}
                  </span>
                ))}
              </div>
            </section>

            <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#101626]">
              <SectionHeader icon="fa-heart" title="Interests" subtitle="Good conversation starters" />
              <div className="flex flex-wrap gap-2">
                {interests.map((interest, index) => (
                  <span
                    key={`${interest}-${index}`}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </section>
          </aside>

          <div className="min-w-0 space-y-6">
            <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#101626] sm:p-7">
              <SectionHeader icon="fa-chart-simple" title="Learning snapshot" subtitle="A quick view of speaking progress" />

              <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                {learningCards.map((card) => (
                  <div
                    key={card.key}
                    className={`rounded-2xl border p-4 ${toneClasses[card.tone]}`}
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/70 dark:bg-white/[0.06]">
                      <i className={`fa-solid ${card.icon} text-sm`} aria-hidden="true" />
                    </div>
                    <div className="mt-4 truncate text-xl font-black tracking-tight text-slate-950 dark:text-white">
                      {learning[card.key]}
                    </div>
                    <div className="mt-1 text-[10px] font-black uppercase tracking-wider opacity-80">
                      {card.label}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#101626] sm:p-7">
              <SectionHeader icon="fa-bars-progress" title="Language progress" subtitle="Current learning progress by language" />

              <div className="space-y-5">
                {languageProgress.map((item) => (
                  <div key={item.name}>
                    <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                      <span className="font-black text-slate-800 dark:text-slate-200">{item.name}</span>
                      <span className="text-xs font-black text-slate-500 dark:text-slate-400">{item.value}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/[0.06]">
                      <div
                        className="h-full rounded-full bg-teal-600 dark:bg-teal-400"
                        style={{ width: `${item.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#101626] sm:p-7">
              <SectionHeader icon="fa-award" title="Achievements" subtitle="Milestones earned on Vaani" />

              {achievements.length ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {achievements.map((achievement, index) => (
                    <div
                      key={`${achievement.title}-${index}`}
                      className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.03]"
                    >
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300">
                        <i className={`fa-solid ${achievement.icon}`} aria-hidden="true" />
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-black text-slate-900 dark:text-white">{achievement.title}</div>
                        <div className="mt-1 line-clamp-2 text-xs font-medium leading-5 text-slate-500 dark:text-slate-400">
                          {achievement.description}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon="fa-medal"
                  title="Achievements are waiting"
                  text="Complete speaking sessions and community milestones to unlock achievements here."
                />
              )}
            </section>

            <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#101626] sm:p-7">
              <SectionHeader icon="fa-clock-rotate-left" title="Recent activity" subtitle="Latest learning and community moments" />

              {recentActivity.length ? (
                <div className="divide-y divide-slate-100 dark:divide-white/[0.06]">
                  {recentActivity.map((activity, index) => (
                    <div key={`${activity.title}-${index}`} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 dark:bg-white/[0.05] dark:text-slate-300">
                        <i className={`fa-solid ${activity.icon} text-xs`} aria-hidden="true" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-black text-slate-900 dark:text-white">{activity.title}</div>
                        <div className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">{activity.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon="fa-clock"
                  title="No recent activity yet"
                  text="Speaking sessions, connections, and learning milestones will appear here."
                />
              )}
            </section>
          </div>
        </div>
      </div>

      {isPopupOpen && (
        <div
          className="fixed inset-0 z-[200] flex items-end justify-center bg-slate-950/60 p-3 sm:items-center sm:p-6"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) closePopup();
          }}
        >
          <div className="flex max-h-[82vh] w-full max-w-lg flex-col overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-xl dark:border-white/10 dark:bg-[#101626]">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-white/[0.07] sm:px-6">
              <div>
                <h3 className="text-lg font-black capitalize text-slate-950 dark:text-white">{popupType}</h3>
                <p className="mt-0.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {optionType.length} connection{optionType.length === 1 ? "" : "s"}
                </p>
              </div>
              <button
                type="button"
                onClick={closePopup}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/[0.05]"
                aria-label="Close connections"
              >
                <i className="fa-solid fa-xmark" aria-hidden="true" />
              </button>
            </div>

            <div className="border-b border-slate-100 bg-slate-50 px-5 py-3 dark:border-white/[0.07] dark:bg-white/[0.02] sm:px-6">
              <div className="relative">
                <i className="fa-solid fa-search pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400" aria-hidden="true" />
                <input
                  type="search"
                  value={popupSearch}
                  onChange={(event) => setPopupSearch(event.target.value)}
                  placeholder="Search connections..."
                  autoFocus
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 text-sm font-semibold text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-teal-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
                />
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4">
              {popupLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }, (_, index) => (
                    <div key={index} className="flex items-center gap-3 rounded-xl p-3">
                      <div className="h-11 w-11 rounded-full bg-slate-100 dark:bg-white/[0.05]" />
                      <div className="flex-1">
                        <div className="h-3.5 w-28 rounded-full bg-slate-100 dark:bg-white/[0.05]" />
                        <div className="mt-2 h-2.5 w-36 rounded-full bg-slate-100 dark:bg-white/[0.04]" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredOptions.length ? (
                <ul className="space-y-1">
                  {filteredOptions.map((user, index) => {
                    const id = getUserId(user);
                    const name = cleanText(user?.displayName || user?.name, "Vaani User");
                    const avatar = cleanText(user?.photoURL || user?.avatar || user?.photo, "");

                    return (
                      <li key={id || index}>
                        <Link
                          to={id ? `/profile/${id}` : "#"}
                          onClick={id ? closePopup : undefined}
                          className="group flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.04]"
                        >
                          <Avatar src={avatar} name={name} className="h-11 w-11 text-xs" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-black text-slate-900 group-hover:text-teal-700 dark:text-white dark:group-hover:text-teal-300">
                              {name}
                            </p>
                            <p className="mt-0.5 truncate text-xs font-medium text-slate-500 dark:text-slate-400">
                              {cleanText(user?.email, "Vaani learner")}
                            </p>
                          </div>
                          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-400 dark:border-white/10 dark:text-slate-500">
                            <i className="fa-solid fa-arrow-right text-[9px]" aria-hidden="true" />
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <EmptyState
                  icon="fa-user-group"
                  title={popupSearch ? "No matching connections" : `No ${popupType} yet`}
                  text={popupSearch ? "Try a different name or email." : "Connections will appear here as this profile grows."}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default MyProfile;
