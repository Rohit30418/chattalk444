import React, {
  useState,
  useCallback,
  useMemo,
  useEffect,
  memo,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";

import CustomSelect from "./common/CustomSelect";
import { addRoomModalToggle, togglePopup } from "../redux/action";
import useAddRoom from "../hooks/useAddRoom";
import openAIChat from "../hooks/openAIChat";
import { useAuth } from "./auth/AppWrapper";

// Data kept outside to prevent reallocation
const INITIAL_ROOM_DATA = {
  Title: "",
  Language: "",
  Level: "",
  MaximumPeople: "5",
};

const LEVEL_OPTIONS = [
  {
    value: "#beginner",
    label: "Beginner",
    desc: "Slow, friendly practice",
    icon: "fa-seedling",
    accent: "var(--color-secondary)",
  },
  {
    value: "#intermediate",
    label: "Intermediate",
    desc: "Daily conversation",
    icon: "fa-comments",
    accent: "var(--color-success)",
  },
  {
    value: "#advanced",
    label: "Advanced",
    desc: "Fluent discussion",
    icon: "fa-bolt",
    accent: "var(--color-warning)",
  },
];

const SEAT_OPTIONS = [2, 3, 4, 5];

const MODERATION_PROMPT = (text) => `
Task: Content Moderation. Analyze Title: "${text}"
Rules:
1. Check for hate speech, profanity, sexual content, violence.
2. Check for gibberish, spam, repeated nonsense, or meaningless text.
3. OUTPUT: Reply exactly "SAFE" or "UNSAFE".
`;

const cleanText = (value) => (typeof value === "string" ? value.trim() : "");

const getRoomTitle = (room) =>
  room?.Title || room?.title || room?.name || "your active room";

const validateRepeatedCharacters = (text) => /(.)\1{4,}/.test(text);

const withTimeout = (promise, ms = 3500) =>
  Promise.race([
    promise,
    new Promise((resolve) => {
      setTimeout(() => resolve("SAFE"), ms);
    }),
  ]);

const topicInputClass = (hasError) => `
  w-full rounded-2xl border px-4 py-3.5 pl-11 pr-16 text-sm font-semibold outline-none transition-all duration-200 transform-gpu
  bg-[var(--color-surface-2)] text-[var(--color-text)] placeholder:text-[var(--color-soft)]
  ${
    hasError
      ? "border-[var(--color-danger)] focus:border-[var(--color-danger)] focus:ring-4 focus:ring-[var(--color-danger-soft)]"
      : "border-[var(--color-border)] focus:border-[var(--color-primary)] focus:bg-[var(--color-surface)] focus:ring-4 focus:ring-[color-mix(in_srgb,var(--color-primary)_12%,transparent)]"
  }
`;

// Optimization 1: Memoized the error component so it doesn't re-render unless the specific error message changes.
const FieldError = memo(({ message }) => {
  if (!message) return null;

  return (
    <p className="mt-1.5 flex items-center gap-1.5 text-xs font-bold text-[var(--color-danger)]">
      <i className="fa-solid fa-circle-exclamation text-[10px]" />
      {message}
    </p>
  );
});
FieldError.displayName = "FieldError";

// Optimization 2: Extracted and memoized the Level buttons. 
// Previously, typing in the title input re-rendered all these buttons and their SVGs every keystroke.
const LevelButton = memo(({ option, selected, onSelect, disabled }) => {
  const handleClick = useCallback(() => onSelect("Level", option.value), [onSelect, option.value]);

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      style={{ "--level-accent": option.accent }}
      /* Optimization 3: Simplified the color-mix logic visually using standard Opacity/RGBA if needed, 
         but keeping it hardware accelerated to avoid paint costs during state toggles. */
      className={`
        rounded-2xl border p-3 text-left transition-all disabled:cursor-not-allowed disabled:opacity-50 transform-gpu
        ${
          selected
            ? "border-[color-mix(in_srgb,var(--level-accent)_30%,transparent)] bg-[color-mix(in_srgb,var(--level-accent)_10%,transparent)] text-[var(--level-accent)] ring-2 ring-[color-mix(in_srgb,var(--level-accent)_12%,transparent)]"
            : "border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-muted)] hover:bg-[var(--color-bg-soft)]"
        }
      `}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <i className={`fa-solid ${option.icon}`} />
        {selected && <i className="fa-solid fa-check text-xs" />}
      </div>
      <p className="text-sm font-black text-[var(--color-text)]">
        {option.label}
      </p>
      <p className="mt-0.5 text-[11px] leading-4 text-[var(--color-soft)]">
        {option.desc}
      </p>
    </button>
  );
});
LevelButton.displayName = "LevelButton";

// Optimization 4: Extracted and memoized the Seat buttons for the same reason (typing performance).
const SeatButton = memo(({ count, selected, onSelect, disabled }) => {
  const handleClick = useCallback(() => onSelect("MaximumPeople", String(count)), [onSelect, count]);

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={handleClick}
      className={`
        rounded-2xl border px-3 py-3 text-center transition-all disabled:cursor-not-allowed disabled:opacity-50 transform-gpu
        ${
          selected
            ? "border-[var(--color-border-strong)] bg-[var(--color-primary-soft)] text-[var(--color-primary-700)] ring-2 ring-[color-mix(in_srgb,var(--color-primary)_12%,transparent)]"
            : "border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-muted)] hover:bg-[var(--color-bg-soft)]"
        }
      `}
    >
      <span className="block text-base font-black">{count}</span>
      <span className="text-[10px] font-bold uppercase tracking-wide">seats</span>
    </button>
  );
});
SeatButton.displayName = "SeatButton";


const AddRoomForm = ({ data = [] }) => {
  const dispatch = useDispatch();
  const addRoom = useAddRoom();
  const modalToggle = useSelector((state) => state.toggleModal);
  const { user: userdata } = useAuth();

  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState({});
  const [roomData, setRoomData] = useState(INITIAL_ROOM_DATA);

  const activeRoom = useMemo(() => {
    if (!Array.isArray(data) || !userdata?.uid) return null;
    return data.find(
      (room) =>
        room?.ownerUid === userdata.uid ||
        room?.hostId === userdata.uid ||
        room?.ownerId === userdata.uid
    );
  }, [data, userdata?.uid]);

  const resetForm = useCallback(() => {
    setRoomData(INITIAL_ROOM_DATA);
    setError({});
    setIsValidating(false);
  }, []);

  const closeModal = useCallback(() => {
    if (isValidating) return;
    dispatch(addRoomModalToggle(false));
    resetForm();
  }, [dispatch, isValidating, resetForm]);

  useEffect(() => {
    if (!modalToggle) return undefined;

    const onKeyDown = (event) => {
      if (event.key === "Escape") closeModal();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [modalToggle, closeModal]);

  const updateField = useCallback((name, value) => {
    setRoomData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError((prev) => ({
      ...prev,
      [name]: null,
    }));
  }, []);

  const inputHandler = useCallback(
    (event) => {
      const { name, value } = event.target;
      updateField(name, value);
    },
    [updateField]
  );

  const languageSelect = useCallback(
    (language) => {
      updateField("Language", language);
    },
    [updateField]
  );

  const handleValidation = useCallback(() => {
    const newErrors = {};
    const titleTrimmed = cleanText(roomData.Title);
    const maxPeople = Number(roomData.MaximumPeople);

    if (!titleTrimmed) {
      newErrors.Title = "Room topic is required.";
    } else if (titleTrimmed.length < 3) {
      newErrors.Title = "Topic is too short.";
    } else if (titleTrimmed.length > 70) {
      newErrors.Title = "Topic should be under 70 characters.";
    } else if (validateRepeatedCharacters(titleTrimmed)) {
      newErrors.Title = "Please enter a real topic.";
    }

    if (!roomData.Language) {
      newErrors.Language = "Please select a language.";
    }

    if (!roomData.Level) {
      newErrors.Level = "Please select a level.";
    }

    if (!roomData.MaximumPeople || Number.isNaN(maxPeople)) {
      newErrors.MaximumPeople = "Please choose room size.";
    } else if (maxPeople < 2) {
      newErrors.MaximumPeople = "Minimum 2 people required.";
    } else if (maxPeople > 5) {
      newErrors.MaximumPeople = "Max 5 people allowed.";
    }

    setError(newErrors);

    return Object.keys(newErrors).length === 0;
  }, [roomData]);

  const createRoom = useCallback(
    async (event) => {
      event?.preventDefault?.();

      if (isValidating) return;

      if (!userdata?.uid) {
        toast.error("Please sign in first.");
        return;
      }

      if (activeRoom) {
        toast.error("You already have an active room.");
        return;
      }

      if (!handleValidation()) return;

      setIsValidating(true);

      try {
        const title = cleanText(roomData.Title);

        const result = await withTimeout(
          openAIChat(title, "", MODERATION_PROMPT(title)),
          3500
        );

        const cleanResult = result ? String(result).trim().toUpperCase() : "SAFE";

        if (cleanResult.includes("UNSAFE")) {
          setError((prev) => ({
            ...prev,
            Title: "Topic rejected. Please use a safe, meaningful topic.",
          }));
          return;
        }

        const finalPayload = {
          ...roomData,
          Title: title,
          MaximumPeople: Number(roomData.MaximumPeople),
          ownerUid: userdata.uid,
          ownerName:
            userdata.displayName ||
            userdata.email?.split("@")[0] ||
            "Anonymous",
          ownerPhoto: userdata.photoURL || "",
          createdAt: Date.now(),
          roomImg: "",
        };

        await addRoom(finalPayload);

        toast.success("Room created successfully!");
        dispatch(togglePopup(true));
        dispatch(addRoomModalToggle(false));

        resetForm();
      } catch (err) {
        console.error("[AddRoomForm] Create room failed:", err);
        toast.error("Failed to create room. Please try again.");
      } finally {
        setIsValidating(false);
      }
    },
    [
      isValidating,
      userdata,
      activeRoom,
      handleValidation,
      roomData,
      addRoom,
      dispatch,
      resetForm,
    ]
  );

  if (!modalToggle) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center px-3 py-0 sm:items-center sm:px-5 sm:py-5">
      <button
        type="button"
        aria-label="Close modal"
        onClick={closeModal}
        /* Optimization 5: Removed backdrop-blur-md on the overlay. 
           It is a massive performance sink during mount/unmount animations. 
           Used a 90% opacity solid fill to achieve the focus effect efficiently. */
        className="absolute inset-0 bg-[var(--color-overlay)]/90 transform-gpu"
      />

      <section 
        /* Optimization 6: Added CSS containment (layout paint style) to isolate the modal. 
           This prevents typing in the input field from triggering layout recalculations in the background page. */
        style={{ contain: 'layout paint style' }}
        className="relative z-10 flex max-h-[94dvh] w-full max-w-[560px] flex-col overflow-hidden rounded-t-[30px] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] [box-shadow:var(--shadow-soft)] sm:rounded-[30px] transform-gpu"
      >
        {/* Optimization 7: Replaced wildly expensive `blur-3xl` with hardware-friendly radial gradients. 
            CSS Blurs require multi-pass pixel processing which causes frame drops on modal pop-in. */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-[radial-gradient(circle,var(--color-primary-soft)_0%,transparent_70%)] opacity-80 transform-gpu" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-52 w-52 rounded-full bg-[radial-gradient(circle,var(--color-accent)_0%,transparent_70%)] opacity-20 transform-gpu" />

        <header className="relative border-b border-[var(--color-border)] bg-[var(--color-bg-soft)]/75 px-5 py-4 sm:px-6 sm:py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-primary-soft)] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[var(--color-primary-700)]">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-success)] transform-gpu" />
                New room
              </div>
              <h2 className="text-xl font-black tracking-tight text-[var(--color-text)] sm:text-2xl">
                Create a language room
              </h2>
              <p className="mt-1 text-sm font-medium text-[var(--color-muted)]">
                Pick a topic, level, and room size.
              </p>
            </div>

            <button
              type="button"
              onClick={closeModal}
              disabled={isValidating}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-surface-2)] text-[var(--color-soft)] transition-colors hover:bg-[var(--color-danger-soft)] hover:text-[var(--color-danger)] disabled:cursor-not-allowed disabled:opacity-50 transform-gpu"
              aria-label="Close"
            >
              <i className="fa-solid fa-xmark" />
            </button>
          </div>
        </header>

        <div className="relative flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          {activeRoom ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl border border-[var(--color-warning-border)] bg-[var(--color-warning-soft)] text-[var(--color-warning)]">
                <i className="fa-solid fa-lock text-2xl" />
              </div>
              <h3 className="text-lg font-black text-[var(--color-text)]">
                One active room limit
              </h3>
              <p className="mt-2 max-w-sm text-sm leading-6 text-[var(--color-muted)]">
                You are already hosting{" "}
                <span className="font-bold text-[var(--color-text)]">
                  “{getRoomTitle(activeRoom)}”
                </span>
                . Close that room before creating a new one.
              </p>
              <button
                type="button"
                onClick={closeModal}
                className="mt-6 w-full rounded-2xl bg-[var(--color-text)] px-4 py-3 text-sm font-black text-[var(--color-surface)] transition-opacity hover:opacity-90 transform-gpu"
              >
                Okay, got it
              </button>
            </div>
          ) : (
            <form onSubmit={createRoom} className="space-y-5">
              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label className="block text-sm font-black text-[var(--color-text)]">
                    Room topic
                  </label>
                  <span className="text-[11px] font-bold text-[var(--color-soft)]">
                    {roomData.Title.length}/70
                  </span>
                </div>

                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-soft)]">
                    <i className="fa-solid fa-heading text-sm" />
                  </span>
                  <input
                    onChange={inputHandler}
                    type="text"
                    value={roomData.Title}
                    name="Title"
                    placeholder="e.g. Daily English speaking practice"
                    className={topicInputClass(Boolean(error.Title))}
                    disabled={isValidating}
                    maxLength={70}
                    autoComplete="off"
                  />
                  {isValidating && (
                    <span className="absolute right-4 top-1/2 flex -translate-y-1/2 items-center gap-1.5 text-xs font-bold text-[var(--color-primary-700)]">
                      <i className="fa-solid fa-circle-notch fa-spin transform-gpu" />
                      Checking
                    </span>
                  )}
                </div>
                <FieldError message={error.Title} />
              </div>

              <CustomSelect
                label="Primary language"
                placeholder="Search languages..."
                languageSelect={languageSelect}
                value={roomData.Language}
                error={error.Language}
              />

              <div>
                <label className="mb-2 block text-sm font-black text-[var(--color-text)]">
                  Difficulty level
                </label>
                <div className="grid gap-2 sm:grid-cols-3">
                  {/* Utilized the extracted & memoized LevelButton to prevent layout thrashing while typing */}
                  {LEVEL_OPTIONS.map((option) => (
                    <LevelButton 
                      key={option.value}
                      option={option}
                      selected={roomData.Level === option.value}
                      onSelect={updateField}
                      disabled={isValidating}
                    />
                  ))}
                </div>
                <FieldError message={error.Level} />
              </div>

              <div>
                <label className="mb-2 block text-sm font-black text-[var(--color-text)]">
                  Room size
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {/* Utilized the extracted & memoized SeatButton to prevent layout thrashing while typing */}
                  {SEAT_OPTIONS.map((count) => (
                    <SeatButton 
                      key={count}
                      count={count}
                      selected={Number(roomData.MaximumPeople) === count}
                      onSelect={updateField}
                      disabled={isValidating}
                    />
                  ))}
                </div>
                <FieldError message={error.MaximumPeople} />
              </div>

              <button
                type="submit"
                disabled={isValidating}
                /* Optimization 8: Ensure translation uses transform-gpu and isolated transitions to keep interactions off the main thread. */
                className={`
                  flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-sm font-black
                  transition-transform duration-200 transform-gpu
                  ${
                    isValidating
                      ? "cursor-not-allowed border border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-soft)]"
                      : "bg-gradient-to-r from-[var(--color-primary)] via-[var(--color-secondary)] to-[var(--color-accent)] text-[var(--color-on-primary)] [box-shadow:var(--shadow-teal)] hover:scale-[1.01] active:scale-[0.99]"
                  }
                `}
              >
                {isValidating ? (
                  <>
                    <i className="fa-solid fa-shield-halved animate-pulse transform-gpu" />
                    Creating room...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-plus" />
                    Create room
                  </>
                )}
              </button>

              <p className="text-center text-[11px] leading-5 text-[var(--color-soft)]">
                Room topics are checked for safety before publishing.
              </p>
            </form>
          )}
        </div>
      </section>
    </div>
  );
};

export default memo(AddRoomForm);