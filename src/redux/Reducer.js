const initialState = {
    userData: "",
    loginStatus: false,
    toggleModal: false,
    toggleFriendSide: false,
    toggleChatSidebar: false,
    togglePopup: false,
    groupMsg: {},
    tooglePrescreenRoom: true,
    mediaPrefs: { 
        audio: false, 
        video: false 
    }
};
  
export const Reducer = (state = initialState, action) => {
    switch (action.type) {
        case "userData":
            return { ...state, userData: action.payload };

        case "Loginstatus":
            return { ...state, loginStatus: action.payload };
        
        case "toggleModal":
            return { ...state, toggleModal: action.payload };

        case "toggleFriendSidebar":
            return { ...state, toggleFriendSide: action.payload };

        case "toggleChatSidebar":
            return { ...state, toggleChatSidebar: action.payload };

        case "togglePopup":
            return { ...state, groupMsg: action.payload }; // (Note: keeping your original logic here)

        case "groupMsg":
            return { ...state, groupMsg: action.payload };

        case "tooglePrescreenRoom":
            return { ...state, tooglePrescreenRoom: action.payload };

        // 🔥 NEW: Handle the action
        case "setMediaPrefs":
            return { ...state, mediaPrefs: action.payload };

        default:
            return state;
    }
};