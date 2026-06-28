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
      <div className="min-h-screen bg-[var(--color-bg)] px-4 py-28 text-[var(--color-text)] sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="overflow-hidden rounded-[2.25rem] border border-[var(--color-border)] bg-[var(--color-surface)] [box-shadow:var(--shadow-soft)]">
            <div className="h-56 animate-pulse bg-[var(--color-surface-2)]" />
            <div className="p-6">
              <div className="mx-auto -mt-20 h-32 w-32 animate-pulse rounded-[2rem] bg-[var(--color-surface-2)]" />
              <div className="mx-auto mt-6 h-7 w-56 animate-pulse rounded-full bg-[var(--color-surface-2)]" />
              <div className="mx-auto mt-3 h-4 w-72 animate-pulse rounded-full bg-[var(--color-surface-2)]" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !userInfo) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] px-4 py-28 text-center">
        <div className="max-w-md rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 [box-shadow:var(--shadow-soft)]">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-[var(--color-danger-soft)] text-[var(--color-danger)]">
            <i className="fa-solid fa-triangle-exclamation text-2xl" />
          </div>

          <h2 className="text-xl font-black text-[var(--color-text)]">
            Profile not found
          </h2>

          <p className="mt-2 text-sm font-semibold leading-6 text-[var(--color-muted)]">
            We could not load this profile right now. Please try again later.
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[var(--color-bg)] px-4 py-28 text-[var(--color-text)] sm:px-6 lg:px-8">
      <style>{`
        .profile-card {
          background:
            linear-gradient(
              180deg,
              color-mix(in srgb, var(--color-surface) 98%, transparent),
              color-mix(in srgb, var(--color-bg-lift, var(--color-bg-soft)) 45%, var(--color-surface))
            );
        }

        .profile-avatar-ring {
          box-shadow:
            0 0 0 8px var(--color-surface),
            0 0 0 11px color-mix(in srgb, var(--color-primary) 16%, transparent),
            var(--shadow-soft);
        }

        .profile-stat-card:hover {
          border-color: var(--color-border-strong);
          box-shadow: var(--shadow-soft);
          transform: translateY(-4px);
        }
      `}</style>

      <div className="mx-auto max-w-5xl">
        {/* Profile Card */}
        <section className="profile-card relative overflow-hidden rounded-[2.25rem] border border-[var(--color-border)] [box-shadow:var(--shadow-soft)]">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[var(--color-primary-soft)] blur-3xl" />
          <div className="pointer-events-none absolute -bottom-28 -left-28 h-80 w-80 rounded-full bg-[color-mix(in_srgb,var(--color-accent)_18%,transparent)] blur-3xl" />

          {/* Cover */}
          <div className="relative h-56 overflow-hidden sm:h-64">
            <img
              src={coverPhotoURL}
              className="h-full w-full object-cover"
              alt="Cover"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-[color-mix(in_srgb,var(--color-text)_62%,transparent)] via-transparent to-transparent" />

            <div className="absolute left-5 top-5 inline-flex items-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--color-on-primary)_24%,transparent)] bg-[color-mix(in_srgb,var(--color-text)_24%,transparent)] px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-[var(--color-on-primary)] backdrop-blur-xl">
              <span className="h-2 w-2 rounded-full bg-[var(--color-success)]" />
              Vaani Profile
            </div>
          </div>

          {/* Profile Info */}
          <div className="relative px-5 pb-8 sm:px-8">
            <div className="-mt-16 flex flex-col items-center text-center">
              <img
                src={photoURL}
                className="profile-avatar-ring h-32 w-32 rounded-[2rem] object-cover"
                alt={displayName}
              />

              <h1 className="mt-6 text-3xl font-black tracking-[-0.04em] text-[var(--color-text)] sm:text-4xl">
                {displayName}
              </h1>

              <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-[var(--color-muted)]">
                <i className="fa-solid fa-envelope text-[var(--color-primary-700)]" />
                {email}
              </p>

              <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-primary-soft)] px-4 py-2 text-xs font-black text-[var(--color-primary-700)]">
                <i className="fa-solid fa-language" />
                Language learner
              </div>
            </div>

            {/* Stats */}
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {statConfig.map((item) => (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => openPopup(item.type)}
                  className="profile-stat-card rounded-[1.5rem] border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-surface)_86%,transparent)] p-5 text-left [box-shadow:var(--shadow-card)] backdrop-blur-xl transition-all duration-300"
                >
                  <div className="mb-4 flex items-center justify-between gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--color-primary)] via-[var(--color-secondary)] to-[var(--color-accent)] text-[var(--color-on-primary)] [box-shadow:var(--shadow-teal)]">
                      <i className={`fa-solid ${item.icon}`} />
                    </div>

                    <span className="text-3xl font-black tracking-[-0.05em] text-[var(--color-text)]">
                      {collectionsData[item.type]?.length || 0}
                    </span>
                  </div>

                  <h3 className="text-sm font-black text-[var(--color-text)]">
                    {item.label}
                  </h3>

                  <p className="mt-1 text-xs font-semibold leading-5 text-[var(--color-muted)]">
                    {item.hint}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* Popup */}
      {isPopupOpen && (
        <div className="fixed inset-0 z-[200] flex items-end justify-center bg-[var(--color-overlay)] p-4 backdrop-blur-sm sm:items-center">
          <div className="w-full max-w-md overflow-hidden rounded-t-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] [box-shadow:var(--shadow-soft)] sm:rounded-[2rem]">
            <div className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-bg-soft)] px-5 py-4">
              <div>
                <h3 className="text-xl font-black tracking-[-0.03em] text-[var(--color-text)]">
                  {popupType.charAt(0).toUpperCase() + popupType.slice(1)}
                </h3>

                <p className="text-sm font-semibold text-[var(--color-muted)]">
                  {optionType.length} connection
                  {optionType.length === 1 ? "" : "s"}
                </p>
              </div>

              <button
                type="button"
                onClick={closePopup}
                className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--color-surface-2)] text-[var(--color-soft)] transition hover:bg-[var(--color-danger-soft)] hover:text-[var(--color-danger)]"
                aria-label="Close popup"
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </div>

            <div className="max-h-[420px] overflow-y-auto p-4">
              {popupLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-3"
                    >
                      <div className="h-12 w-12 animate-pulse rounded-2xl bg-[var(--color-border)]" />
                      <div className="flex-1">
                        <div className="h-4 w-32 animate-pulse rounded-full bg-[var(--color-border)]" />
                        <div className="mt-2 h-3 w-44 animate-pulse rounded-full bg-[var(--color-border)]" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : optionType.length > 0 ? (
                <ul className="space-y-3">
                  {optionType.map((user, index) => {
                    const name = user?.displayName || "Unknown User";
                    const avatar = user?.photoURL || getAvatarFallback(name);

                    return (
                      <li
                        key={user?.uid || user?.id || index}
                        className="flex items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-surface)_88%,transparent)] p-3 transition hover:border-[var(--color-border-strong)] hover:bg-[var(--color-bg-soft)]"
                      >
                        <img
                          className="h-12 w-12 rounded-2xl object-cover"
                          src={avatar}
                          alt={name}
                        />

                        <div className="min-w-0">
                          <p className="truncate text-sm font-black text-[var(--color-text)]">
                            {name}
                          </p>

                          <p className="truncate text-xs font-semibold text-[var(--color-muted)]">
                            {user?.email || "Vaani learner"}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="py-10 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-[var(--color-surface-2)] text-[var(--color-soft)]">
                    <i className="fa-solid fa-user-slash text-2xl" />
                  </div>

                  <h4 className="text-base font-black text-[var(--color-text)]">
                    No users found
                  </h4>

                  <p className="mt-1 text-sm font-semibold text-[var(--color-muted)]">
                    This list is empty right now.
                  </p>
                </div>
              )}
            </div>

            <div className="border-t border-[var(--color-border)] p-4">
              <button
                type="button"
                onClick={closePopup}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[var(--color-primary)] via-[var(--color-secondary)] to-[var(--color-accent)] px-5 py-3 text-sm font-black text-[var(--color-on-primary)] [box-shadow:var(--shadow-teal)] transition hover:-translate-y-0.5"
              >
                Close
                <i className="fa-solid fa-arrow-right text-xs" />
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default MyProfile;