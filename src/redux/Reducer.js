const initialState = {
  userData: '',
  loginStatus: false,
  toggleModal: false,
  toggleFriendSide: false,
  toggleChatSidebar: false,
  togglePopup: false,
  groupMsg: {},
  // Kept spelling for backward compatibility with the existing codebase.
  tooglePrescreenRoom: true,
  mediaPrefs: {
    audio: false,
    video: false,
    audioDeviceId: null,
    videoDeviceId: null,
  },
};

const resetRoomUiState = (state) => ({
  ...state,
  toggleChatSidebar: false,
  togglePopup: false,
  groupMsg: {},
  tooglePrescreenRoom: true,
  mediaPrefs: {
    audio: false,
    video: false,
    audioDeviceId: null,
    videoDeviceId: null,
  },
});

export const Reducer = (state = initialState, action) => {
  switch (action.type) {
    case 'userData':
      return { ...state, userData: action.payload };

    case 'Loginstatus':
      return { ...state, loginStatus: action.payload };

    case 'toggleModal':
      return { ...state, toggleModal: action.payload };

    case 'toggleFriendSidebar':
      return { ...state, toggleFriendSide: action.payload };

    case 'toggleChatSidebar':
      return { ...state, toggleChatSidebar: action.payload };

    case 'togglePopup':
      return { ...state, togglePopup: action.payload };

    case 'groupMsg':
      return { ...state, groupMsg: action.payload };

    case 'tooglePrescreenRoom':
      return { ...state, tooglePrescreenRoom: action.payload };

    case 'setMediaPrefs':
      return { ...state, mediaPrefs: action.payload };

    case 'resetRoomUiState':
      return resetRoomUiState(state);

    default:
      return state;
  }
};
