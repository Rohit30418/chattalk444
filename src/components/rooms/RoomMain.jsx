import React, { useState, useEffect, useRef } from 'react';
import Peer from 'peerjs';
import { collection, doc, onSnapshot, setDoc, deleteDoc, updateDoc, increment, Timestamp, deleteField, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Chat from '../chat/Chat';
import { useSelector, useDispatch } from 'react-redux';
import { toggleChatSidebar } from '../../redux/action';
import useGetUnseenCount from '../../hooks/useGetUnseenCount';
import joinRoom from "../../assets/notification-1-269296.mp3"
import getUserData from '../../hooks/getUserData';
import useDeleteUnseenCount from '../../hooks/useDeleteUnseenCount';
import { getRoomData } from '../../hooks/getRoom';
import useToggleSidebarFirebase from '../../hooks/useToggleSidebarFirebase';
import LottieEmoji from '../AppBody/LottieEmoji';
import Swal from "sweetalert2";

const RoomMain = ({ uId }) => {
  const [peerId, setPeerId] = useState('');
  const [isSettingOn, setIsSettingOn] = useState(false)
  const [currUserData, setCurrUserData] = useState("");
  const [userLoading, setUserLoading] = useState(true);
  const [currentRoomData, setCurrentRoomData] = useState("");
  const [remotePeerIds, setRemotePeerIds] = useState([]);
  const [peer, setPeer] = useState(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [remoteStream, setRemoteStream] = useState([]);
  const isChatToggleOpen = useSelector((state) => state.toggleChatSidebar);
  const localVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteVideosRef = useRef({});
  const videoContainerRef = useRef(null);
  const dataConnectionsRef = useRef({});
  const [reactions, setReactions] = useState({});

  const showModal = () => {
    Swal.fire({
      title: "Are you sure?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Exit",
    }).then((result) => {
      if (result.isConfirmed) {
        handleHangup();
      }
    });;
  };


  const { id } = useParams();
  const dispatch = useDispatch();
  const msgcont = useGetUnseenCount(uId);

  const deleteUnseenMessages = useDeleteUnseenCount();
  // Store chat/data connections
  const chatConnectionsRef = useRef({});
  const { rooms } = getRoomData() || [];
  const joinroom = new Audio(joinRoom);
  const navigate = useNavigate();

  // 1. Always initialize local audio+video stream on mount, but disable both by default
  useEffect(() => {
    const initializeMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: false, audio: {
            noiseSuppression: true,
            echoCancellation: true,
            autoGainControl: true,
          }
        });
        // Disable both by default
        stream.getVideoTracks().forEach(track => (track.enabled = false));
        stream.getAudioTracks().forEach(track => (track.enabled = false));
        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
        setIsAudioEnabled(false);
        setIsVideoEnabled(false);
      } catch (error) {
        console.error('Error accessing media devices:', error);
      }
    };
    initializeMedia();
    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    const currRoom = rooms?.find((room) => room.id == id);
    setCurrentRoomData(currRoom);
  }, [id, rooms]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const item = await getUserData(uId);
        setCurrUserData(item);
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };
    fetchUserData();
  }, [uId]);

  useEffect(() => {
    const initializePeer = () => {
      if (!id) return;
      const peerInstance = new Peer();
      peerInstance.on('open', async (currentPeerId) => {
        setPeerId(currentPeerId);
        const roomRef = collection(db, 'rooms', id, 'participants');
        try {
          await setDoc(doc(roomRef, uId), { peerId: currentPeerId }, { merge: true });
        } catch (err) {
          console.error('Error updating Peer ID in Firestore:', err);
        }
        const unsubscribe = onSnapshot(roomRef, (snapshot) => {
          const peerIds = snapshot.docs
            .map((doc) => doc.data())
            .filter((p) => p.peerId !== currentPeerId);
          setRemotePeerIds(peerIds);
        });
        return () => {
          unsubscribe();
          deleteDoc(doc(roomRef, uId)).catch((err) =>
            console.error('Error removing participant:', err)
          );
        };
      });

      peerInstance.on("connection", (conn) => {
        conn.on("open", () => {
          chatConnectionsRef.current[conn.peer] = conn;
          console.log("Chat connected with", conn.peer);

          // Listen for messages (chat or emoji)
          conn.on("data", (data) => {
            console.log("Incoming message:", data);

            if (data.type === "chat") {
              // 👉 update chat state here
            }

            else if (data.type === "reaction") {
              const { peerId, emoji } = data;
              const reactionId = Date.now(); // keep consistent id

              setReactions((prev) => ({
                ...prev,
                [peerId]: [
                  ...(prev[peerId] || []),
                  { id: reactionId, emoji },
                ],
              }));

              setTimeout(() => {
                setReactions((prev) => ({
                  ...prev,
                  [peerId]: prev[peerId]?.filter((r) => r.id !== reactionId) || [],
                }));
              }, 3000);
            }
          });
        });
      });


      peerInstance.on('call', (call) => handleIncomingCall(call));
      setPeer(peerInstance);
      return () => {
        peerInstance.destroy();
        Object.values(dataConnectionsRef.current).forEach((conn) => conn.close())
      };
    };
    initializePeer();
  }, [id, uId]);

  const handleIncomingCall = (call) => {
    call.answer(localStreamRef.current);
    call.on('stream', (remoteStream) => {
      addRemoteVideo(call.peer, remoteStream);
      detectSpeaking(call.peer, remoteStream);
    });
    dataConnectionsRef.current[call.peer] = call;
    call.on('close', () => {
      removeRemoteVideo(call.peer);
      removeSpeakingDetection(call.peer);
    });
  };

  const detectSpeaking = (peerId, stream) => {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const audioContext = new AudioCtx();
    const analyser = audioContext.createAnalyser();
    analyser.smoothingTimeConstant = 0.7;
    analyser.fftSize = 2048;
    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    const speakingThreshold = 20;
    let isSpeaking = false;
    let speakingTimeout = null;
    let animationFrameId;
    const updateSpeakingState = (newState) => {
      setRemoteStream((prevStreams) =>
        prevStreams.map((user) => {
          if (user.peerId === peerId) {
            return {
              ...user,
              remotePeer: {
                ...user.remotePeer,
                isSpeaking: newState,
              },
            };
          }
          return user;
        })
      );
    };
    const checkSpeaking = () => {
      analyser.getByteFrequencyData(dataArray);
      const averageAudioLevel = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
      if (averageAudioLevel > speakingThreshold) {
        if (!isSpeaking) {
          isSpeaking = true;
          updateSpeakingState(true);
        }
        if (speakingTimeout) {
          clearTimeout(speakingTimeout);
          speakingTimeout = null;
        }
      } else {
        if (isSpeaking && !speakingTimeout) {
          speakingTimeout = setTimeout(() => {
            isSpeaking = false;
            updateSpeakingState(false);
          }, 1000);
        }
      }
      animationFrameId = requestAnimationFrame(checkSpeaking);
    };
    checkSpeaking();
    return () => {
      if (speakingTimeout) clearTimeout(speakingTimeout);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      audioContext.close();
    };
  };

  useEffect(() => {
    if (peer && remotePeerIds.length > 0) {
      connectToPeers();
    }
  }, [peer, remotePeerIds]);

  const connectToPeers = () => {
    if (!peer || !localStreamRef.current) return;
    remotePeerIds.forEach((remotePeer) => {
      const remotePeerId = remotePeer.peerId;
      if (!remotePeerId) return;
      if (dataConnectionsRef.current[remotePeerId]) return;
      const call = peer.call(remotePeerId, localStreamRef.current);
      // Open a data connection for chat/reactions
      const conn = peer.connect(remotePeerId);
      conn.on("open", () => {
        chatConnectionsRef.current[remotePeerId] = conn;
        console.log("Chat connection established with", remotePeerId);

        conn.on("data", (data) => {
          console.log("Received:", data);
          if (data.type === "chat") {
            // 👉 update chat state
          } else if (data.type === "reaction") {
            // 👉 trigger emoji animation
          }
        });
      });

      if (!call) {
        console.warn("PeerJS call failed: remotePeerId or localStreamRef.current invalid", remotePeerId, localStreamRef.current);
        return;
      }
      call.on('stream', (remoteStream) => {
        addRemoteVideo(remotePeerId, remoteStream, remotePeer);
        joinroom.play();
        detectSpeaking(remotePeerId, remoteStream);
      });
      call.on('close', () => {
        removeRemoteVideo(remotePeerId);
        removeSpeakingDetection(remotePeerId);
      });
      dataConnectionsRef.current[remotePeerId] = call;
    });
  };
  const addRemoteVideo = (peerId, stream, remotePeer) => {
    // Only add if remotePeer exists and has a UID
    if (!remotePeer || !remotePeer.uid || remotePeer.uid === uId) return;

    setRemoteStream((prevStreams) => {
      // Remove any previous entry with the same UID
      const filtered = prevStreams.filter(video => video.remotePeer?.uid !== remotePeer.uid);
      return [
        ...filtered,
        { peerId, stream, remotePeer },
      ];
    });
    detectSpeaking(peerId, stream);
  };
  useEffect(() => {
    const roomRef = collection(db, 'rooms', id, 'participants');
    const unsubscribe = onSnapshot(roomRef, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        const peerId = change.doc.id;
        const data = change.doc.data();
        if (change.type === "modified") {
          setRemoteStream((prevStreams) => {
            return prevStreams.map((user) => {
              if (user.peerId === data.peerId) {
                return {
                  ...user,
                  remotePeer: {
                    ...user.remotePeer,
                    isAudioEnabled: data.isAudioEnabled,
                    isVideoEnabled: data.isVideoEnabled,
                  },
                };
              }
              return user;
            });
          });
        }
      });
    });
    return () => unsubscribe();
  }, [id]);

  const removeRemoteVideo = (peerId) => {
    setRemoteStream((prev) => prev.filter((user) => user.peerId !== peerId));
  };

  const removeSpeakingDetection = (peerId) => {
    // Optionally implement cleanup if you store speaking detection per peer
  };

  // Only enable/disable the video track, do not add new tracks after join
  const toggleVideo = async () => {
    if (!localStreamRef.current) return;
    const [videoTrack] = localStreamRef.current.getVideoTracks();
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setIsVideoEnabled(videoTrack.enabled);
      const roomRef = collection(db, 'rooms', id, 'participants');
      try {
        await setDoc(doc(roomRef, uId), { isVideoEnabled: videoTrack.enabled }, { merge: true });
      } catch (err) {
        console.error('Error updating isVideoEnabled in Firestore:', err);
      }
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }
    } else {
      console.warn("No video track found");
    }
  };

  // Only enable/disable the audio track, do not add new tracks after join
  const toggleAudio = async () => {
    if (!localStreamRef.current) return;
    const [audioTrack] = localStreamRef.current.getAudioTracks();
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsAudioEnabled(audioTrack.enabled);
      const roomRef = collection(db, 'rooms', id, 'participants');
      try {
        await setDoc(doc(roomRef, uId), { isAudioEnabled: audioTrack.enabled }, { merge: true });
      } catch (err) {
        console.error('Error updating isAudioEnabled in Firestore:', err);
      }
    } else {
      console.warn("No audio track found");
    }
  };

  const handleHangup = async () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    Object.values(dataConnectionsRef.current).forEach((conn) => conn.close());
    Object.keys(remoteVideosRef.current).forEach((peerId) => {
      const { videoElement, container } = remoteVideosRef.current[peerId];
      if (videoElement && videoElement.srcObject) {
        videoElement.srcObject.getTracks().forEach((track) => track.stop());
      }
      if (container) container.remove();
    });
    if (peer) {
      peer.destroy();
    }
    const roomRef = doc(db, 'rooms', id, 'participants', uId);
    try {
      await deleteDoc(roomRef);
    } catch (err) {
      console.error('Error removing participant from Firestore:', err);
    }
    setRemotePeerIds([]);
    setPeerId('');
    setPeer(null);
    remoteVideosRef.current = {};
    dataConnectionsRef.current = {};
    await updateDoc(doc(db, "rooms", id), {
      participantsCount: increment(-1),
      expiresAt: Timestamp.fromDate(new Date(Date.now() + 10 * 60 * 1000)),
    });
    window.location.href = '/Rooms';

  };

  useEffect(() => {
    // Push new history state
    window.history.pushState(null, "", window.location.href);

    const handleBackButton = () => {
      console.log("Back button pressed — blocked");
      // Re-push state to prevent navigation
      window.history.pushState(null, "", window.location.href);
      showModal();
    };

    window.addEventListener("popstate", handleBackButton);

    return () => {
      window.removeEventListener("popstate", handleBackButton);
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      updateDoc(doc(db, "rooms", id, "participants", uId), {
        lastActive: Date.now(),
      });
    }, 10000); // every 5 seconds

    return () => clearInterval(interval);
  }, [id, uId]);



  useEffect(() => {
    const handleUnload = async () => {
      try {
        await updateDoc(doc(db, "rooms", id), {
          [`participants.${uId}`]: deleteField(),
          lastActive: serverTimestamp(),
        });
      } catch (e) {
        console.log("Already removed OR room deleted");
      }
    };

    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, [id, uId]);



  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setUserLoading(true);
        const item = await getUserData(uId);
        setCurrUserData(item);
      } catch (error) {
        setCurrUserData(null);
        console.error("Error fetching user data:", error);
      } finally {
        setUserLoading(false);
      }
    };
    fetchUserData();
  }, [uId]);

  const sendMessageToAll = (msg) => {
    Object.values(chatConnectionsRef.current).forEach((conn) => {
      if (conn.open) {
        conn.send(msg);
      }
    });
  };

  // --- 🔥 LOADER LOGIC START 🔥 ---
  // We wait for User Data to finish loading AND for Room Data to be found
  const isPageLoading = userLoading || !currentRoomData;

  if (isPageLoading) {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 transition-colors">
         {/* Spinner Animation */}
         <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-500 dark:border-indigo-400"></div>
         {/* Loading Text */}
         <h2 className="mt-6 text-xl font-semibold text-gray-700 dark:text-gray-200 animate-pulse">
            Joining Room...
         </h2>
      </div>
    );
  }
  // --- 🔥 LOADER LOGIC END 🔥 ---


  return (
    // Added dark:bg-gray-900 for main background
    <div className="room-container overflow-y-hidden bg-gray-50 dark:bg-gray-900 transition-colors duration-300" >

      {/* 1. Header Bar */}
      <nav className="py-5 top-0 left-0 right-0 h-16 flex items-center justify-between px-6 z-50 pointer-events-none">
        {/* Left: Title */}
        {/* Added dark classes for background, text, and border */}
        <div className="pointer-events-auto flex items-center gap-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md px-4 py-2 rounded-full shadow-sm border border-slate-200 dark:border-gray-700">
          <h1 className="text-sm font-semibold text-slate-700 dark:text-gray-100 max-w-[150px] truncate">
            {currentRoomData?.Title || "Meeting Room"}
          </h1>
          <div className="h-4 w-px bg-slate-300 dark:bg-gray-600"></div>
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            <span className="text-xs font-bold text-slate-500 dark:text-gray-300 uppercase tracking-wide">Live</span>
          </div>
        </div>

        {/* Right: User Info & Share */}
        <div className="pointer-events-auto flex items-center gap-3">
          <button
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              Swal.fire({
                icon: 'success',
                title: 'Link Copied',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 1500,
                background: '#fff',
                color: '#333'
              });
            }}
            // Added dark hover and background classes
            className="hidden md:flex items-center justify-center w-10 h-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-full shadow-sm border border-slate-200 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-700 text-slate-600 dark:text-gray-300 transition-all"
            title="Copy Link"
          >
            <i className="fa-solid fa-link"></i>
          </button>

          {/* Added dark classes for user pill */}
          <div className="hidden md:flex items-center gap-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md pl-1 pr-3 py-1 rounded-full shadow-sm border border-slate-200 dark:border-gray-700">
            <img
              src={currUserData?.photoURL || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
              alt="User"
              className="w-8 h-8 rounded-full object-cover border border-white dark:border-gray-600 shadow-sm"
            />
            <span className="text-xs font-semibold text-slate-700 dark:text-gray-200 truncate max-w-[100px]">
              {currUserData?.displayName || "You"}
            </span>
          </div>
        </div>
      </nav>

      <div>
        <div className=" w-full">
          <div className='px-5  flex items-center justify-between'>
          </div>
          <div className='flex h-[calc(100dvh-140px)]'>
            <div ref={videoContainerRef} className={` ${remotePeerIds.length === 1 ? "oneGrid" : ""} w-full videoGrid px-3 overflow-hidden relative ${isChatToggleOpen ? "w-9/12" : "w-12/12"}`}>
              {/* Local User Video Container */}
              <div className='relative rounded-xl overflow-hidden shadow-lg border border-slate-200 dark:border-gray-700'>
                <video ref={localVideoRef} autoPlay playsInline muted className={`local-video  bg-black ${remotePeerIds.length === 2 ? "absolute top-2  bg-white dark:bg-gray-800 border w-full max-w-48 h-32 border-slate-200 dark:border-gray-600 shadow-xl rounded-lg left-2 z-20" : "  static w-full"}`} />
                {/* Local Video Placeholder (Camera Off) - Added dark background */}
                <div className={`userInfo absolute ${isVideoEnabled ? "hidden" : "flex"}   justify-between flex-col overflow-hidden items-center  h-full  top-0 left-0 p-3 right-0 bottom-0 bg-slate-100 dark:bg-gray-800 transition-colors duration-300`}>
                  <span></span>
                  <div className="relative flex justify-center items-center">
                    <img src={currUserData?.photoURL || "https://th.bing.com/th?id=OIP.VWwq2xtthMXiOFa4IuqAwwHaHa&w=250&h=250&c=8&rs=1&qlt=90&o=6&dpr=1.3&pid=3.1&rm=2"} alt="" className='w-20 rounded-full shadow-md z-10 relative' />
                  </div>
                  <div className='relative z-10  flex items-center justify-between w-full' style={{ "padding": "10px" }}>
                    <span className='bg-black/40 min-w-20 text-center text-white rounded-full  p-1 px-2 text-sm backdrop-blur-sm'>{currUserData?.displayName}</span>
                    <i className={`fas  bg-red-500 p-1 flex justify-center items-center rounded-full w-7 h-7 text-white   ${isAudioEnabled ? "fa-microphone" : "fa-microphone-slash"}`}></i>
                  </div>
                </div>
              </div>

              {/* Remote Users Map */}
              {remoteStream?.filter(user => user.remotePeer?.uid !== uId).map((user) => {
                const { peerId, stream, remotePeer } = user || {};
                const photo = remotePeer?.photo || 'https://th.bing.com/th?id=OIP.VWwq2xtthMXiOFa4IuqAwwHaHa&w=250&h=250&c=8&rs=1&qlt=90&o=6&dpr=1.3&pid=3.1&rm=2';
                const isVideoEnabled = remotePeer?.isVideoEnabled;
                const isAudioEnabled = remotePeer?.isAudioEnabled;
                const isSpeaking = remotePeer?.isSpeaking;

                return (
                  <div
                    key={peerId}
                    className={`relative rounded-xl overflow-hidden transition-all duration-300 ease-in-out ${isSpeaking
                        ? "ring-4 ring-emerald-500 shadow-[0_0_25px_rgba(16,185,129,0.5)] scale-[1.02] z-10 border-transparent"
                        : "border border-slate-200 dark:border-gray-700 hover:border-slate-300 dark:hover:border-gray-600 scale-100"
                      }`}
                  >
                    {/* Reaction Overlay */}
                    <div className='absolute bg-slate-100/40 dark:bg-gray-800/40 top-0 left-0 right-0 bottom-0  flex justify-center items-center pointer-events-none z-30'>
                      {reactions[peerId]?.map((r) => (
                        <LottieEmoji
                          key={r.id}
                          codepoint={r.emoji}
                          width="100px"
                          height="100px"
                        />
                      ))}
                    </div>

                    <video className={`${isVideoEnabled ? "h-full w-full object-cover" : "h-[0px]"}`}
                      autoPlay
                      playsInline
                      ref={(video) => {
                        if (video && video.srcObject !== stream) {
                          video.srcObject = stream;
                        }
                      }}
                    ></video>
                    {/* Remote Video Placeholder (Camera Off) */}
                    <div className={` ${!isVideoEnabled ? "flex" : "hidden"}   justify-between flex-col overflow-hidden items-center  h-full bg-slate-100 dark:bg-gray-800 transition-colors duration-300`}>
                      <span className='absolute bg-cover rounded-lg bg-blue-300 dark:bg-blue-900/50  bg-center bg-no-repeat top-0 bottom-0 left-0 right-0' ></span>
                      <div className='relative z-10 w-full text-end'>
                        <i className="fa-solid fa-cog cursor-pointer text-slate-700 dark:text-gray-200" onClick={() => {
                          setIsSettingOn(!isSettingOn)
                        }}></i>
                        <div className={` ${isSettingOn ? "flex" : "hidden"}  absolute right-1 top-5 flex-col bg-red-500 w-20`}>
                          <Link to={`/MyProfile/${remotePeer?.uid}`} className="text-white">Profile</Link>
                          <button className="text-white">Mute</button>
                          <button className="text-white">Kick</button>
                        </div>
                      </div>

                      {/* ----- UPDATED: Profile Picture with Wave Animation ----- */}
                      <div className='relative z-10 flex justify-center items-center'>
                        {/* Wave Animation Layers */}
                        {isSpeaking && (
                          <>
                            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-20 animate-[ping_2s_linear_infinite]"></span>
                            <span className="absolute inline-flex h-[80%] w-[80%] rounded-full bg-emerald-500 opacity-40 animate-[ping_1.5s_linear_infinite]"></span>
                          </>
                        )}
                        <img style={{ boxShadow: "rgba(0, 0, 0, 0.15) 0px 5px 15px 0px" }} src={photo} alt="" srcSet="" className='w-24 h-24 object-cover rounded-full border-2 border-white/20 relative z-20' />
                      </div>
                      {/* -------------------------------------------------------- */}

                      <div className='relative z-10 items-center flex justify-between w-full p-2'>
                        <span className='bg-black/60 text-white rounded-full  p-1 px-3 text-sm backdrop-blur-sm'>{remotePeer?.name || "User"}</span>
                        <i className={`fas  bg-red-500 p-1 flex justify-center items-center rounded-full w-7 h-7 text-white  ${isAudioEnabled ? "fa-microphone" : "fa-microphone-slash"}`}></i>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {/* RIGHT SIDE: CHAT */}
            <div className={`fixed inset-y-0 right-0 z-[60] w-full md:w-[360px] bg-white dark:bg-gray-900 dark:border-l dark:border-gray-800 shadow-2xl transform transition-transform duration-300 ease-in-out ${isChatToggleOpen ? 'translate-x-0' : 'translate-x-full'}`}>
              {isChatToggleOpen && <Chat uId={uId} />}
            </div>
          </div>
          <div className=" px-2 fixed left-1/2 -translate-x-1/2 w-fit z-[50] py-3  flex justify-center glass gap-3 ">
            <button className="bg-secondary text-white w-12 h-12 rounded-full hover:opacity-90 transition-opacity" onClick={toggleAudio}>
              {isAudioEnabled ? <i className="fas fa-microphone"></i> : <i className="fas fa-microphone-slash"></i>}
            </button>
            <button className="bg-secondary text-white w-12 h-12 rounded-full hover:opacity-90 transition-opacity" onClick={toggleVideo}>
              {isVideoEnabled ? <i className="fas fa-video"></i> : <i className="fas fa-video-slash"></i>}
            </button>
            <button onClick={showModal} className="bg-primary text-white w-12 h-12 rounded-full hover:opacity-90 transition-opacity">
              <i className="fas fa-phone-alt"></i>
            </button>
            <button onClick={async () => {
              dispatch(toggleChatSidebar(true));
              await useToggleSidebarFirebase(id, uId, true);
              await deleteUnseenMessages(uId);
            }} className="bg-gray-900 dark:bg-gray-700 text-white relative  w-12 h-12 rounded-full hover:opacity-90 transition-opacity">
              <span className='absolute -top-2 left-4 w-4 h-4 text-white bg-red-500 rounded-full flex justify-center items-center'>{msgcont}</span>
              <i className="fas fa-comment-dots"></i>
            </button>
            {/* <button onClick={() => {
              sendMessageToAll({ type: "reaction", emoji: "🎉", peerId: peer.id });

            }} className="bg-yellow-500 text-white w-12 h-12 rounded-full hover:opacity-90 transition-opacity">
              <i className="fas fa-smile"></i>
            </button> */}

          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomMain;