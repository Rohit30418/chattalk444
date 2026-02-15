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
  
  // --- 🔥 1. REDUX STATE CONNECTION (Only change here) ---
  const mediaPrefs = useSelector((state) => state.mediaPrefs); 
  const isChatToggleOpen = useSelector((state) => state.toggleChatSidebar);
  
  // Initialize state based on Redux preferences (Fixes the bug)
  const [isAudioEnabled, setIsAudioEnabled] = useState(mediaPrefs?.audio || false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(mediaPrefs?.video || false);

  const [remoteStream, setRemoteStream] = useState([]);
  const localVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteVideosRef = useRef({});
  const videoContainerRef = useRef(null);
  const dataConnectionsRef = useRef({});
  const [reactions, setReactions] = useState({});

  const showModal = () => {
    Swal.fire({
      title: "Are you sure?",
      text: "Do you want to leave the meeting?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#334155",
      confirmButtonText: "Yes, Leave",
      background: "#1e293b",
      color: "#fff"
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

  useEffect(() => {
    if (uId && id) {
      deleteUnseenMessages(uId);
    }
  }, []); 
  
  // --- 🔥 2. LOGIC FIX: Apply Media Prefs on Load (Only change here) ---
  useEffect(() => {
    const initializeMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true, 
          audio: {
            noiseSuppression: true,
            echoCancellation: true,
            autoGainControl: true,
          }
        });

        const videoTrack = stream.getVideoTracks()[0];
        const audioTrack = stream.getAudioTracks()[0];

        if (videoTrack) videoTrack.enabled = mediaPrefs?.video || false;
        if (audioTrack) audioTrack.enabled = mediaPrefs?.audio || false;

        localStreamRef.current = stream;
        
        if (localVideoRef.current) {
              localVideoRef.current.srcObject = stream;
        }

        setIsAudioEnabled(mediaPrefs?.audio || false);
        setIsVideoEnabled(mediaPrefs?.video || false);

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
          conn.on("data", (data) => {
            if (data.type === "chat") {
            }
            else if (data.type === "reaction") {
              const { peerId, emoji } = data;
              const reactionId = Date.now();
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
      const conn = peer.connect(remotePeerId);
      conn.on("open", () => {
        chatConnectionsRef.current[remotePeerId] = conn;
        conn.on("data", (data) => {
          if (data.type === "chat") {
          } else if (data.type === "reaction") {
          }
        });
      });

      if (!call) {
        console.warn("PeerJS call failed", remotePeerId);
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
    if (!remotePeer || !remotePeer.uid || remotePeer.uid === uId) return;
    setRemoteStream((prevStreams) => {
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
  };

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
        console.error('Error updating isVideoEnabled:', err);
      }
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }
    }
  };

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
        console.error('Error updating isAudioEnabled:', err);
      }
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
      console.error('Error removing participant:', err);
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
    window.history.pushState(null, "", window.location.href);
    const handleBackButton = () => {
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
    }, 10000); 

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

  const isPageLoading = userLoading || !currentRoomData;

  if (isPageLoading) {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0f172a] text-white">
         <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-500"></div>
         <h2 className="mt-6 text-xl font-medium animate-pulse text-indigo-200">Entering Studio...</h2>
      </div>
    );
  }

  return (
    // MAIN WRAPPER: Deep Dark Blue/Slate Background
    <div className="room-container overflow-hidden bg-[#0f172a] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800 to-[#0f172a] h-screen w-screen relative transition-colors duration-300 text-white font-sans">

      {/* 1. Header Bar (Floating Glass) */}
      <nav className="absolute top-0 left-0 right-0 h-20 flex items-center justify-between px-6 z-50 pointer-events-none">
        
        {/* Left: Room Title */}
        <div className="pointer-events-auto flex items-center gap-4 bg-white/5 backdrop-blur-xl px-5 py-2.5 rounded-2xl border border-white/10 shadow-lg hover:bg-white/10 transition-all cursor-default">
          <div className="flex flex-col">
            <h1 className="text-sm font-bold text-gray-100 max-w-[200px] truncate leading-tight">
              {currentRoomData?.Title || "Meeting Room"}
            </h1>
            <span className="text-[10px] text-gray-400 font-medium tracking-wide uppercase">ID: {id?.substring(0,6)}...</span>
          </div>
          
          <div className="h-6 w-px bg-white/10 mx-1"></div>
          
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.6)]"></span>
            </span>
            <span className="text-xs font-bold text-red-400 uppercase tracking-widest">Live</span>
          </div>
        </div>

        {/* Right: Actions */}
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
                background: '#1e293b',
                color: '#fff'
              });
            }}
            className="hidden md:flex items-center justify-center w-11 h-11 bg-white/5 backdrop-blur-xl rounded-full border border-white/10 text-gray-300 hover:bg-white/10 hover:text-white hover:scale-105 transition-all shadow-lg"
            title="Copy Invite Link"
          >
            <i className="fa-solid fa-link text-sm"></i>
          </button>

          <div className="hidden md:flex items-center gap-3 bg-white/5 backdrop-blur-xl pl-1.5 pr-4 py-1.5 rounded-full border border-white/10 shadow-lg">
            <img
              src={currUserData?.photoURL || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
              alt="User"
              className="w-8 h-8 rounded-full object-cover border-2 border-indigo-500/50"
            />
            <span className="text-sm font-medium text-gray-200 truncate max-w-[100px]">
              {currUserData?.displayName || "You"}
            </span>
          </div>
        </div>
      </nav>

      {/* 2. Main Content Area */}
      <div className="w-full h-full pt-20 pb-24 px-4 md:px-6 flex justify-center">
        <div className="flex w-full h-full gap-4 max-w-[1920px]">
           
           {/* VIDEO GRID */}
           <div ref={videoContainerRef} 
                className={`
                  videoGrid w-full relative transition-all duration-500 ease-in-out
                  ${isChatToggleOpen ? "md:w-9/12" : "md:w-full"}
                  ${remotePeerIds.length === 0 ? "flex justify-center items-center" : "grid gap-4 auto-rows-fr"}
                  ${remotePeerIds.length === 1 ? "grid-cols-1 md:grid-cols-2" : ""}
                  ${remotePeerIds.length > 1 ? "grid-cols-2 lg:grid-cols-3" : ""}
                `}
            >
              
              {/* --- LOCAL USER CARD --- */}
              <div className={`
                 relative rounded-3xl overflow-hidden shadow-2xl bg-slate-800 ring-1 ring-white/10 group transition-all duration-300
                 ${remotePeerIds.length === 2 && !isChatToggleOpen ? "absolute top-4 left-4 w-48 h-32 md:w-64 md:h-40 z-30 shadow-[0_0_20px_rgba(0,0,0,0.5)] border border-white/20" : "w-full h-full min-h-[250px]"}
              `}>
                <video 
                  ref={localVideoRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  className={`w-full h-full object-cover transform scale-x-[-1] ${!isVideoEnabled ? 'opacity-0' : 'opacity-100'}`} 
                />
                
                {/* Local Camera Off State */}
                <div className={`absolute inset-0 bg-[#1e293b] flex flex-col items-center justify-center transition-all duration-300 ${isVideoEnabled ? "opacity-0 pointer-events-none" : "opacity-100"}`}>
                   <div className="relative">
                      <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full"></div>
                      <img 
                        src={currUserData?.photoURL || "https://th.bing.com/th?id=OIP.VWwq2xtthMXiOFa4IuqAwwHaHa&w=250&h=250&c=8&rs=1&qlt=90&o=6&dpr=1.3&pid=3.1&rm=2"} 
                        alt="" 
                        className="w-24 h-24 rounded-full border-4 border-[#334155] relative z-10 shadow-2xl" 
                      />
                   </div>
                   <p className="mt-4 text-slate-400 font-medium">Camera is off</p>
                </div>

                {/* Local Overlays (Name & Status) */}
                <div className="absolute bottom-4 left-4 flex items-center gap-2 z-20">
                   <div className="bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-2 border border-white/5">
                      <span className="text-white text-xs font-semibold tracking-wide">You</span>
                   </div>
                   <div className={`w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md border border-white/5 ${isAudioEnabled ? "bg-black/40 text-green-400" : "bg-red-500/90 text-white"}`}>
                      <i className={`fas ${isAudioEnabled ? "fa-microphone" : "fa-microphone-slash"} text-xs`}></i>
                   </div>
                </div>
              </div>


              {/* --- REMOTE USERS MAP --- */}
              {remoteStream?.filter(user => user.remotePeer?.uid !== uId).map((user) => {
                const { peerId, stream, remotePeer } = user || {};
                const photo = remotePeer?.photo || 'https://th.bing.com/th?id=OIP.VWwq2xtthMXiOFa4IuqAwwHaHa&w=250&h=250&c=8&rs=1&qlt=90&o=6&dpr=1.3&pid=3.1&rm=2';
                const isVideoEnabledRemote = remotePeer?.isVideoEnabled;
                const isAudioEnabledRemote = remotePeer?.isAudioEnabled;
                const isSpeaking = remotePeer?.isSpeaking;

                return (
                  <div
                    key={peerId}
                    className={`relative rounded-3xl overflow-hidden bg-slate-800 transition-all duration-300 group
                      ${isSpeaking 
                        ? "ring-2 ring-indigo-500 shadow-[0_0_30px_rgba(99,102,241,0.3)]" 
                        : "ring-1 ring-white/10 hover:ring-white/30"}
                    `}
                  >
                    {/* Reaction Overlay */}
                    <div className='absolute inset-0 z-40 flex items-center justify-center pointer-events-none'>
                      {reactions[peerId]?.map((r) => (
                        <div key={r.id} className="animate-bounce-in">
                           <LottieEmoji codepoint={r.emoji} width="120px" height="120px" />
                        </div>
                      ))}
                    </div>

                    {/* Remote Video */}
                    <video 
                      className={`w-full h-full object-cover transition-opacity duration-300 ${isVideoEnabledRemote ? "opacity-100" : "opacity-0"}`}
                      autoPlay
                      playsInline
                      ref={(video) => {
                        if (video && video.srcObject !== stream) video.srcObject = stream;
                      }}
                    ></video>

                    {/* Remote Camera Off Placeholder */}
                    <div className={`absolute inset-0 bg-[#1e293b] flex flex-col items-center justify-center transition-all duration-300 ${!isVideoEnabledRemote ? "opacity-100 z-10" : "opacity-0 -z-10"}`}>
                      <div className="relative flex justify-center items-center">
                        {/* Speaking Ripple Effect */}
                        {isSpeaking && (
                          <>
                            <span className="absolute inline-flex h-full w-full rounded-full bg-indigo-500 opacity-20 animate-[ping_2s_linear_infinite] scale-150"></span>
                            <span className="absolute inline-flex h-[80%] w-[80%] rounded-full bg-indigo-400 opacity-30 animate-[ping_1.5s_linear_infinite] scale-125"></span>
                          </>
                        )}
                        <img 
                           src={photo} 
                           alt={remotePeer?.name} 
                           className="w-24 h-24 object-cover rounded-full border-4 border-[#334155] relative z-20 shadow-2xl" 
                        />
                      </div>
                      <p className="mt-4 text-slate-400 font-medium text-sm animate-pulse">{isSpeaking ? "Speaking..." : ""}</p>
                    </div>

                    {/* Settings Dropdown (Hidden by default, simple toggle for now) */}
                    <div className="absolute top-4 right-4 z-30 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => setIsSettingOn(!isSettingOn)}
                          className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-black/60 flex items-center justify-center"
                        >
                          <i className="fa-solid fa-ellipsis-vertical text-xs"></i>
                        </button>
                         {/* Keeping logic simple as per request - dropdown existing logic */}
                        <div className={` ${isSettingOn ? "flex" : "hidden"} absolute right-0 top-10 flex-col bg-slate-800 border border-white/10 rounded-xl w-32 shadow-xl overflow-hidden py-1`}>
                          <Link to={`/MyProfile/${remotePeer?.uid}`} className="text-xs text-gray-300 hover:bg-white/10 px-3 py-2 block">View Profile</Link>
                          <button className="text-xs text-left text-gray-300 hover:bg-white/10 px-3 py-2 w-full">Mute User</button>
                        </div>
                    </div>

                    {/* Remote Info Overlays */}
                    <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between z-20">
                      <div className="bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-2 border border-white/5">
                        <span className="text-white text-xs font-semibold tracking-wide truncate max-w-[120px]">{remotePeer?.name || "User"}</span>
                      </div>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md border border-white/5 ${isAudioEnabledRemote ? "bg-black/40 text-white" : "bg-red-500/90 text-white"}`}>
                        <i className={`fas ${isAudioEnabledRemote ? "fa-microphone" : "fa-microphone-slash"} text-xs`}></i>
                      </div>
                    </div>

                  </div>
                );
              })}
           </div>

           {/* CHAT SIDEBAR (Sliding Drawer) */}
           <div className={`
              fixed inset-y-0 right-0 z-[60] w-full md:w-[380px] bg-[#0f172a] border-l border-white/10 shadow-2xl transform transition-transform duration-300 ease-in-out
              ${isChatToggleOpen ? 'translate-x-0' : 'translate-x-full'}
           `}>
             {isChatToggleOpen && <Chat uId={uId} />}
           </div>

        </div>

        {/* 3. Bottom Control Dock */}
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 px-6 py-3 bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl hover:scale-105 transition-transform duration-300">
           
           {/* Audio Toggle */}
           <button 
             onClick={toggleAudio}
             className={`w-12 h-12 rounded-full flex items-center justify-center text-lg transition-all shadow-lg
               ${isAudioEnabled 
                 ? "bg-slate-700 text-white hover:bg-slate-600 ring-1 ring-white/10" 
                 : "bg-red-500 text-white hover:bg-red-600 ring-4 ring-red-500/20"}
             `}
             title={isAudioEnabled ? "Mute" : "Unmute"}
           >
             <i className={`fas ${isAudioEnabled ? "fa-microphone" : "fa-microphone-slash"}`}></i>
           </button>

           {/* Video Toggle */}
           <button 
             onClick={toggleVideo}
             className={`w-12 h-12 rounded-full flex items-center justify-center text-lg transition-all shadow-lg
               ${isVideoEnabled 
                 ? "bg-slate-700 text-white hover:bg-slate-600 ring-1 ring-white/10" 
                 : "bg-red-500 text-white hover:bg-red-600 ring-4 ring-red-500/20"}
             `}
             title={isVideoEnabled ? "Turn Camera Off" : "Turn Camera On"}
           >
             <i className={`fas ${isVideoEnabled ? "fa-video" : "fa-video-slash"}`}></i>
           </button>

           {/* Chat Toggle */}
           <button 
             onClick={async () => {
              dispatch(toggleChatSidebar(true));
              await useToggleSidebarFirebase(id, uId, true);
              await deleteUnseenMessages(uId);
             }} 
             className="relative w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-500 transition-all shadow-lg ring-4 ring-indigo-500/20"
             title="Open Chat"
           >
             {msgcont > 0 && (
                <span className='absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-[10px] font-bold text-white rounded-full flex justify-center items-center shadow-sm border border-[#0f172a]'>
                  {msgcont}
                </span>
             )}
             <i className="fas fa-comment-dots"></i>
           </button>

           {/* Hangup Button */}
           <button 
             onClick={showModal} 
             className="w-14 h-12 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-all shadow-lg ring-4 ring-red-500/20 ml-2"
             title="Leave Call"
           >
             <i className="fas fa-phone-slash rotate-90"></i>
           </button>
        </div>

      </div>
    </div>
  );
};

export default RoomMain;