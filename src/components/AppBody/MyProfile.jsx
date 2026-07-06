import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router";
import getUserData from "../../hooks/getUserData";
import useUserCollection from "../useUserCollection";

const DEFAULT_COVER =
  "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&auto=format&fit=crop&q=80";

const getAvatarFallback = (name = "User") =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(
    name
  )}&background=0F766E&color=ffffff&bold=true`;

const statConfig = [
  {
    type: "followers",
    label: "Followers",
    icon: "fa-user-group",
    hint: "People following you",
  },
  {
    type: "following",
    label: "Following",
    icon: "fa-user-plus",
    hint: "People you follow",
  },
  {
    type: "friends",
    label: "Friends",
    icon: "fa-handshake",
    hint: "Mutual connections",
  },
];

const MyProfile = () => {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [popupType, setPopupType] = useState("");
  const [optionType, setOptionType] = useState([]);
  const [userInfo, setUserInfo] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [popupLoading, setPopupLoading] = useState(false);

  const { userId } = useParams();
  const { collectionsData = {}, loading, error } = useUserCollection(userId);

  useEffect(() => {
    let isMounted = true;

    const fetchUserData = async () => {
      try {
        setProfileLoading(true);
        const userData = await getUserData(userId);

        if (isMounted) {
          setUserInfo(userData || null);
        }
      } catch (err) {
        console.error("[MyProfile] Failed to fetch user:", err);
      } finally {
        if (isMounted) {
          setProfileLoading(false);
        }
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
      setIsPopupOpen(true);
      setPopupLoading(true);

      try {
        const usersList = collectionsData[type] || [];

        const newType = await Promise.all(
          usersList.map(async (user) => {
            const userData = await getUserData(user.id);
            return userData;
          })
        );

        setOptionType(newType.filter(Boolean));
      } catch (err) {
        console.error("[MyProfile] Failed to fetch list:", err);
        setOptionType([]);
      } finally {
        setPopupLoading(false);
      }
    },
    [collectionsData]
  );

  const closePopup = () => {
    setIsPopupOpen(false);
    setOptionType([]);
    setPopupType("");
  };

  const displayName = userInfo?.displayName || "Vaani User";
  const email = userInfo?.email || "No email available";
  const photoURL = userInfo?.photoURL || getAvatarFallback(displayName);
  const coverPhotoURL = userInfo?.coverPhotoURL || DEFAULT_COVER;

  if (profileLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="h-48 sm:h-64 bg-gray-200 animate-pulse" />
            <div className="px-6 sm:px-8 pb-8 pt-4">
              <div className="w-32 h-32 rounded-full border-4 border-white bg-gray-300 animate-pulse -mt-16 mb-4" />
              <div className="h-8 w-48 bg-gray-200 animate-pulse rounded-md mb-3" />
              <div className="h-4 w-32 bg-gray-200 animate-pulse rounded-md" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !userInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
          <div className="w-16 h-16 mx-auto bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
            <i className="fa-solid fa-triangle-exclamation text-2xl" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Profile not found</h2>
          <p className="text-sm text-gray-500">
            We could not load this profile right now. Please try again later.
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 pt-24 pb-12 px-4 sm:px-6 lg:px-8 font-sans text-gray-900">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* 1. Cover Image & Identity */}
        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="h-48 sm:h-64 w-full relative">
            <img
              src={coverPhotoURL}
              alt="Cover"
              className="w-full h-full object-cover"
            />
          </div>
          
          <div className="px-6 sm:px-8 pb-8 relative">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between">
              <div className="relative -mt-16 sm:-mt-20 mb-4 sm:mb-0 inline-block">
                <img
                  src={photoURL}
                  alt={displayName}
                  className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-white object-cover bg-white shadow-sm"
                />
                <span
                  className="absolute bottom-3 right-3 w-5 h-5 bg-green-500 border-2 border-white rounded-full"
                  title="Online"
                />
              </div>
              <div className="sm:mb-4 flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-semibold border border-blue-100">
                  <i className="fa-solid fa-language" /> Language Learner
                </span>
              </div>
            </div>

            <div className="mt-4 sm:mt-2">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
                {displayName}
              </h1>
              <p className="text-gray-500 mt-1 flex items-center gap-2 text-sm">
                <i className="fa-solid fa-envelope" /> {email}
              </p>
            </div>

            {/* 2. Quick Statistics */}
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-gray-100 pt-8">
              {statConfig.map((item) => (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => openPopup(item.type)}
                  className="flex flex-col p-4 rounded-xl border border-gray-100 bg-gray-50 hover:bg-white hover:border-gray-200 hover:shadow-sm transition-all text-left group"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-white border border-gray-100 flex items-center justify-center text-gray-400 group-hover:text-blue-600 group-hover:border-blue-100 group-hover:bg-blue-50 transition-colors">
                      <i className={`fa-solid ${item.icon} text-lg`} />
                    </div>
                    <span className="text-2xl font-bold text-gray-900">
                      {collectionsData[item.type]?.length || 0}
                    </span>
                  </div>
                  <div className="font-semibold text-sm text-gray-900">
                    {item.label}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {item.hint}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Sidebar */}
          <aside className="space-y-6">
            {/* 5. About */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">
                About
              </h2>
              <p className="text-gray-600 text-sm leading-relaxed">
                Passionate language learner exploring new cultures and connecting with people around the world. Currently focusing on conversational fluency and exchanging cultural stories. Let's practice together!
              </p>
            </div>

            {/* 6. Languages */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">
                Languages
              </h2>
              <div className="flex flex-wrap gap-2">
                {["English", "Spanish", "French", "Japanese"].map((lang) => (
                  <span
                    key={lang}
                    className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs rounded-lg font-semibold"
                  >
                    {lang}
                  </span>
                ))}
              </div>
            </div>

            {/* 8. Interests */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">
                Interests
              </h2>
              <div className="flex flex-wrap gap-2">
                {["Travel", "Technology", "Music", "Movies", "Books", "Photography", "Fitness", "Culture"].map((interest) => (
                  <span
                    key={interest}
                    className="px-3 py-1.5 bg-white border border-gray-200 text-gray-600 text-xs rounded-lg font-medium hover:bg-gray-50 transition-colors cursor-default"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          </aside>

          {/* Right Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* 3. Learning Dashboard */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">
                Learning Dashboard
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
                  <div className="text-orange-500 mb-2">
                    <i className="fa-solid fa-fire text-xl" />
                  </div>
                  <div className="text-xl font-bold text-gray-900">14 Days</div>
                  <div className="text-xs font-semibold text-orange-700 mt-1">Current Streak</div>
                </div>
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <div className="text-blue-500 mb-2">
                    <i className="fa-solid fa-bullseye text-xl" />
                  </div>
                  <div className="text-xl font-bold text-gray-900">4/7</div>
                  <div className="text-xs font-semibold text-blue-700 mt-1">Weekly Goal</div>
                </div>
                <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
                  <div className="text-purple-500 mb-2">
                    <i className="fa-solid fa-star text-xl" />
                  </div>
                  <div className="text-lg font-bold text-gray-900 truncate">Intermediate</div>
                  <div className="text-xs font-semibold text-purple-700 mt-1">Level</div>
                </div>
                <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                  <div className="text-green-500 mb-2">
                    <i className="fa-solid fa-trophy text-xl" />
                  </div>
                  <div className="text-xl font-bold text-gray-900">2,450</div>
                  <div className="text-xs font-semibold text-green-700 mt-1">Total XP</div>
                </div>
              </div>
            </div>

            {/* 7. Learning Progress */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">
                Learning Progress
              </h2>
              <div className="space-y-5">
                <div>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-semibold text-gray-700">English</span>
                    <span className="font-medium text-gray-500">85%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full w-[85%]" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-semibold text-gray-700">Spanish</span>
                    <span className="font-medium text-gray-500">40%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full w-[40%]" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-semibold text-gray-700">French</span>
                    <span className="font-medium text-gray-500">20%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className="bg-purple-500 h-2 rounded-full w-[20%]" />
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Achievements */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">
                Achievements
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-4 p-4 border border-gray-100 rounded-xl bg-gray-50 hover:bg-white hover:border-gray-200 transition-colors">
                  <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-yellow-100 text-yellow-600">
                    <i className="fa-solid fa-medal text-lg" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-gray-900">First Conversation</div>
                    <div className="text-xs font-medium text-gray-500 mt-0.5">Completed first voice chat</div>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 border border-gray-100 rounded-xl bg-gray-50 hover:bg-white hover:border-gray-200 transition-colors">
                  <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-orange-100 text-orange-600">
                    <i className="fa-solid fa-fire text-lg" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-gray-900">7 Day Streak</div>
                    <div className="text-xs font-medium text-gray-500 mt-0.5">Learned for 7 days straight</div>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 border border-gray-100 rounded-xl bg-gray-50 hover:bg-white hover:border-gray-200 transition-colors">
                  <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                    <i className="fa-solid fa-earth-americas text-lg" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-gray-900">Global Learner</div>
                    <div className="text-xs font-medium text-gray-500 mt-0.5">Connected with 5 countries</div>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 border border-gray-100 rounded-xl bg-gray-50 hover:bg-white hover:border-gray-200 transition-colors">
                  <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-pink-100 text-pink-600">
                    <i className="fa-solid fa-handshake text-lg" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-gray-900">Community Helper</div>
                    <div className="text-xs font-medium text-gray-500 mt-0.5">Helped 10 other learners</div>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 border border-gray-100 rounded-xl bg-gray-50 hover:bg-white hover:border-gray-200 transition-colors sm:col-span-2">
                  <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-purple-100 text-purple-600">
                    <i className="fa-solid fa-microphone text-lg" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-gray-900">Conversation Master</div>
                    <div className="text-xs font-medium text-gray-500 mt-0.5">Spoke for 10+ hours</div>
                  </div>
                </div>
              </div>
            </div>

            {/* 9. Recent Activity */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-6">
                Recent Activity
              </h2>
              <div className="relative border-l-2 border-gray-100 ml-3 space-y-6 pb-2">
                <div className="relative pl-6">
                  <span className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-white border-4 border-blue-500" />
                  <div className="text-sm font-semibold text-gray-900">Joined a new conversation room</div>
                  <div className="text-xs font-medium text-gray-500 mt-1">2 hours ago</div>
                </div>
                <div className="relative pl-6">
                  <span className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-white border-4 border-green-500" />
                  <div className="text-sm font-semibold text-gray-900">Made a new friend</div>
                  <div className="text-xs font-medium text-gray-500 mt-1">Yesterday</div>
                </div>
                <div className="relative pl-6">
                  <span className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-white border-4 border-purple-500" />
                  <div className="text-sm font-semibold text-gray-900">Completed speaking challenge</div>
                  <div className="text-xs font-medium text-gray-500 mt-1">2 days ago</div>
                </div>
                <div className="relative pl-6">
                  <span className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-white border-4 border-orange-500" />
                  <div className="text-sm font-semibold text-gray-900">Earned streak badge</div>
                  <div className="text-xs font-medium text-gray-500 mt-1">3 days ago</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 10. Popup */}
      {isPopupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4 sm:p-0">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
            
            {/* Popup Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {popupType.charAt(0).toUpperCase() + popupType.slice(1)}
                </h3>
                <p className="text-sm text-gray-500 font-medium">
                  {optionType.length} connection{optionType.length === 1 ? "" : "s"}
                </p>
              </div>
              <button
                type="button"
                onClick={closePopup}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-900 transition-colors"
                aria-label="Close popup"
              >
                <i className="fa-solid fa-xmark text-lg" />
              </button>
            </div>

            {/* Popup Search (UI Only) */}
            <div className="px-6 py-3 border-b border-gray-100 bg-gray-50/50">
              <div className="relative">
                <i className="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                <input
                  type="text"
                  placeholder="Search users..."
                  className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-gray-400"
                />
              </div>
            </div>

            {/* Popup Content */}
            <div className="overflow-y-auto p-4 flex-1">
              {popupLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 rounded-xl border border-transparent"
                    >
                      <div className="h-10 w-10 animate-pulse rounded-full bg-gray-200" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3.5 w-24 animate-pulse rounded-full bg-gray-200" />
                        <div className="h-2.5 w-32 animate-pulse rounded-full bg-gray-200" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : optionType.length > 0 ? (
                <ul className="space-y-1">
                  {optionType.map((user, index) => {
                    const name = user?.displayName || "Unknown User";
                    const avatar = user?.photoURL || getAvatarFallback(name);

                    return (
                      <li
                        key={user?.uid || user?.id || index}
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer group"
                      >
                        <img
                          className="h-10 w-10 rounded-full object-cover border border-gray-100"
                          src={avatar}
                          alt={name}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                            {name}
                          </p>
                          <p className="truncate text-xs font-medium text-gray-500">
                            {user?.email || "Vaani learner"}
                          </p>
                        </div>
                        <button className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition-colors">
                          View
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="py-12 px-6 text-center">
                  <div className="w-16 h-16 mx-auto bg-gray-50 rounded-full flex items-center justify-center text-gray-400 mb-4 border border-gray-100">
                    <i className="fa-solid fa-user-group text-2xl" />
                  </div>
                  <h4 className="text-base font-semibold text-gray-900 mb-1">
                    No users found
                  </h4>
                  <p className="text-sm text-gray-500">
                    You don't have any {popupType} yet.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default MyProfile;