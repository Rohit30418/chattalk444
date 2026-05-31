import React, {
  useState,
  useCallback,
  useMemo,
  useEffect,
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';

import CustomSelect from './common/CustomSelect';
import { addRoomModalToggle, togglePopup } from '../redux/action';
import useAddRoom from '../hooks/useAddRoom';
import openAIChat from '../hooks/openAIChat';
import { useAuth } from './auth/AppWrapper';

const INITIAL_ROOM_DATA = {
  Title: '',
  Language: '',
  Level: '',
  MaximumPeople: '5',
};

const LEVEL_OPTIONS = [
  {
    value: '#beginner',
    label: 'Beginner',
    desc: 'Slow, friendly practice',
    icon: 'fa-seedling',
    light: 'border-blue-200 bg-blue-50 text-blue-700',
    dark: 'dark:border-blue-500/25 dark:bg-blue-500/10 dark:text-blue-300',
  },
  {
    value: '#intermediate',
    label: 'Intermediate',
    desc: 'Daily conversation',
    icon: 'fa-comments',
    light: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    dark: 'dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300',
  },
  {
    value: '#advanced',
    label: 'Advanced',
    desc: 'Fluent discussion',
    icon: 'fa-bolt',
    light: 'border-amber-200 bg-amber-50 text-amber-700',
    dark: 'dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-300',
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

const cleanText = (value) => (typeof value === 'string' ? value.trim() : '');

const getRoomTitle = (room) => (
  room?.Title
  || room?.title
  || room?.name
  || 'your active room'
);

const validateRepeatedCharacters = (text) => /(.)\1{4,}/.test(text);

const withTimeout = (promise, ms = 3500) => (
  Promise.race([
    promise,
    new Promise((resolve) => {
      setTimeout(() => resolve('SAFE'), ms);
    }),
  ])
);

const topicInputClass = (hasError) => `
  w-full rounded-2xl border px-4 py-3.5 pl-11 pr-16 text-sm font-semibold outline-none transition-all duration-200
  bg-white text-slate-900 placeholder:text-slate-400
  dark:bg-slate-950/55 dark:text-white dark:placeholder:text-slate-600
  ${hasError
    ? 'border-red-400/70 focus:border-red-500 focus:ring-4 focus:ring-red-500/10'
    : 'border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-white/10 dark:focus:border-indigo-400/70'}
`;

const FieldError = ({ message }) => {
  if (!message) return null;

  return (
    <p className="mt-1.5 flex items-center gap-1.5 text-xs font-bold text-red-500 dark:text-red-300">
      <i className="fa-solid fa-circle-exclamation text-[10px]" />
      {message}
    </p>
  );
};

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

    return data.find((room) => (
      room?.ownerUid === userdata.uid
      || room?.hostId === userdata.uid
      || room?.ownerId === userdata.uid
    ));
  }, [data, userdata?.uid]);

  const resetForm = useCallback(() => {
    setRoomData(INITIAL_ROOM_DATA);
    setError({});
    setIsValidating(false);
  }, []);

  const closeModal = useCallback(() => {
    if (isValidating) return;

    dispatch(addRoomModalToggle(false));
    setError({});
  }, [dispatch, isValidating]);

  useEffect(() => {
    if (!modalToggle) return undefined;

    const onKeyDown = (event) => {
      if (event.key === 'Escape') closeModal();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
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

  const inputHandler = useCallback((event) => {
    const { name, value } = event.target;
    updateField(name, value);
  }, [updateField]);

  const languageSelect = useCallback((language) => {
    updateField('Language', language);
  }, [updateField]);

  const handleValidation = useCallback(() => {
    const newErrors = {};
    const titleTrimmed = cleanText(roomData.Title);
    const maxPeople = Number(roomData.MaximumPeople);

    if (!titleTrimmed) {
      newErrors.Title = 'Room topic is required.';
    } else if (titleTrimmed.length < 3) {
      newErrors.Title = 'Topic is too short.';
    } else if (titleTrimmed.length > 70) {
      newErrors.Title = 'Topic should be under 70 characters.';
    } else if (validateRepeatedCharacters(titleTrimmed)) {
      newErrors.Title = 'Please enter a real topic.';
    }

    if (!roomData.Language) {
      newErrors.Language = 'Please select a language.';
    }

    if (!roomData.Level) {
      newErrors.Level = 'Please select a level.';
    }

    if (!roomData.MaximumPeople || Number.isNaN(maxPeople)) {
      newErrors.MaximumPeople = 'Please choose room size.';
    } else if (maxPeople < 2) {
      newErrors.MaximumPeople = 'Minimum 2 people required.';
    } else if (maxPeople > 5) {
      newErrors.MaximumPeople = 'Max 5 people allowed.';
    }

    setError(newErrors);

    return Object.keys(newErrors).length === 0;
  }, [roomData]);

  const createRoom = useCallback(async (event) => {
    event?.preventDefault?.();

    if (isValidating) return;

    if (!userdata?.uid) {
      toast.error('Please sign in first.');
      return;
    }

    if (activeRoom) {
      toast.error('You already have an active room.');
      return;
    }

    if (!handleValidation()) return;

    setIsValidating(true);

    try {
      const title = cleanText(roomData.Title);

      const result = await withTimeout(
        openAIChat(title, '', MODERATION_PROMPT(title)),
        3500
      );

      const cleanResult = result ? String(result).trim().toUpperCase() : 'SAFE';

      if (cleanResult.includes('UNSAFE')) {
        setError((prev) => ({
          ...prev,
          Title: 'Topic rejected. Please use a safe, meaningful topic.',
        }));
        return;
      }

      const finalPayload = {
        ...roomData,
        Title: title,
        MaximumPeople: Number(roomData.MaximumPeople),
        ownerUid: userdata.uid,
        ownerName: userdata.displayName || userdata.email?.split('@')[0] || 'Anonymous',
        ownerPhoto: userdata.photoURL || '',
        createdAt: Date.now(),
        roomImg: '',
      };

      await addRoom(finalPayload);

      toast.success('Room created successfully!');
      dispatch(togglePopup(true));
      dispatch(addRoomModalToggle(false));

      resetForm();
    } catch (err) {
      console.error('[AddRoomForm] Create room failed:', err);
      toast.error('Failed to create room. Please try again.');
    } finally {
      setIsValidating(false);
    }
  }, [
    isValidating,
    userdata,
    activeRoom,
    handleValidation,
    roomData,
    addRoom,
    dispatch,
    resetForm,
  ]);

  if (!modalToggle) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center px-3 py-0 sm:items-center sm:px-5 sm:py-5">
      <button
        type="button"
        aria-label="Close modal"
        onClick={closeModal}
        className="absolute inset-0 bg-slate-950/55 backdrop-blur-md dark:bg-black/70"
      />

      <section className="relative z-10 flex max-h-[94dvh] w-full max-w-[560px] flex-col overflow-hidden rounded-t-[30px] border border-slate-200 bg-white text-slate-950 shadow-2xl dark:border-white/10 dark:bg-[#0b1120] dark:text-white sm:rounded-[30px]">
        <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-indigo-500/10 blur-3xl dark:bg-indigo-500/20" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-52 w-52 rounded-full bg-blue-500/10 blur-3xl dark:bg-blue-500/15" />

        <header className="relative border-b border-slate-200 bg-slate-50/70 px-5 py-4 dark:border-white/10 dark:bg-white/[0.035] sm:px-6 sm:py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-indigo-700 dark:border-indigo-400/20 dark:bg-indigo-500/10 dark:text-indigo-300">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 dark:bg-indigo-300" />
                New room
              </div>

              <h2 className="text-xl font-black tracking-tight text-slate-950 dark:text-white sm:text-2xl">
                Create a language room
              </h2>

              <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
                Pick a topic, level, and room size.
              </p>
            </div>

            <button
              type="button"
              onClick={closeModal}
              disabled={isValidating}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 transition hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white/5 dark:text-slate-400 dark:hover:bg-red-500/10 dark:hover:text-red-300"
              aria-label="Close"
            >
              <i className="fa-solid fa-xmark" />
            </button>
          </div>
        </header>

        <div className="relative flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          {activeRoom ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl border border-amber-200 bg-amber-50 text-amber-600 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-300">
                <i className="fa-solid fa-lock text-2xl" />
              </div>

              <h3 className="text-lg font-black text-slate-950 dark:text-white">
                One active room limit
              </h3>

              <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500 dark:text-slate-400">
                You are already hosting{' '}
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  “{getRoomTitle(activeRoom)}”
                </span>
                . Close that room before creating a new one.
              </p>

              <button
                type="button"
                onClick={closeModal}
                className="mt-6 w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-indigo-50"
              >
                Okay, got it
              </button>
            </div>
          ) : (
            <form onSubmit={createRoom} className="space-y-5">
              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label className="block text-sm font-black text-slate-800 dark:text-slate-200">
                    Room topic
                  </label>

                  <span className="text-[11px] font-bold text-slate-400 dark:text-slate-600">
                    {roomData.Title.length}/70
                  </span>
                </div>

                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
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
                    <span className="absolute right-4 top-1/2 flex -translate-y-1/2 items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-300">
                      <i className="fas fa-circle-notch fa-spin" />
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
                <label className="mb-2 block text-sm font-black text-slate-800 dark:text-slate-200">
                  Difficulty level
                </label>

                <div className="grid gap-2 sm:grid-cols-3">
                  {LEVEL_OPTIONS.map((option) => {
                    const selected = roomData.Level === option.value;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => updateField('Level', option.value)}
                        disabled={isValidating}
                        className={`
                          rounded-2xl border p-3 text-left transition-all
                          ${selected
                            ? `${option.light} ${option.dark} ring-2 ring-indigo-500/10 dark:ring-white/10`
                            : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100 dark:border-white/10 dark:bg-white/[0.035] dark:text-slate-400 dark:hover:bg-white/[0.06]'}
                          disabled:cursor-not-allowed disabled:opacity-50
                        `}
                      >
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <i className={`fa-solid ${option.icon}`} />
                          {selected && <i className="fa-solid fa-check text-xs" />}
                        </div>

                        <p className="text-sm font-black text-slate-950 dark:text-white">
                          {option.label}
                        </p>

                        <p className="mt-0.5 text-[11px] leading-4 text-slate-500 dark:text-slate-500">
                          {option.desc}
                        </p>
                      </button>
                    );
                  })}
                </div>

                <FieldError message={error.Level} />
              </div>

              <div>
                <label className="mb-2 block text-sm font-black text-slate-800 dark:text-slate-200">
                  Room size
                </label>

                <div className="grid grid-cols-4 gap-2">
                  {SEAT_OPTIONS.map((count) => {
                    const selected = Number(roomData.MaximumPeople) === count;

                    return (
                      <button
                        key={count}
                        type="button"
                        disabled={isValidating}
                        onClick={() => updateField('MaximumPeople', String(count))}
                        className={`
                          rounded-2xl border px-3 py-3 text-center transition-all
                          ${selected
                            ? 'border-indigo-300 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-500/10 dark:border-indigo-400/40 dark:bg-indigo-500/15 dark:text-indigo-200'
                            : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100 dark:border-white/10 dark:bg-white/[0.035] dark:text-slate-400 dark:hover:bg-white/[0.06]'}
                          disabled:cursor-not-allowed disabled:opacity-50
                        `}
                      >
                        <span className="block text-base font-black">{count}</span>
                        <span className="text-[10px] font-bold uppercase tracking-wide">
                          seats
                        </span>
                      </button>
                    );
                  })}
                </div>

                <FieldError message={error.MaximumPeople} />
              </div>

              <button
                type="submit"
                disabled={isValidating}
                className={`
                  flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-sm font-black text-white
                  shadow-xl transition-all duration-200
                  ${isValidating
                    ? 'cursor-not-allowed bg-slate-300 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                    : 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:-translate-y-0.5 hover:shadow-indigo-500/25 active:translate-y-0'}
                `}
              >
                {isValidating ? (
                  <>
                    <i className="fas fa-shield-alt animate-pulse" />
                    Creating room...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-plus" />
                    Create room
                  </>
                )}
              </button>

              <p className="text-center text-[11px] leading-5 text-slate-500 dark:text-slate-600">
                Room topics are checked for safety before publishing.
              </p>
            </form>
          )}
        </div>
      </section>
    </div>
  );
};

export default AddRoomForm;