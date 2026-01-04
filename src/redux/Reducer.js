
const initialState = {
    userData: "",
    loginStatus:false,
    toggleModal:false,
    toggleFriendSide:false,
    toggleChatSidebar:false,
    togglePopup:false,
    groupMsg:{},
    tooglePrescreenRoom:true,
  };
  
  export const Reducer = (state = initialState, action) => {
    switch (action.type) {
      case "userData":
        return { ...state, userData:action.payload };
        case "Loginstatus":
        return {...state,loginStatus:action.payload};
        
        case "toggleModal":
        return{...state,toggleModal:action.payload};

        case "toggleFriendSidebar":
        return{...state,toggleFriendSide:action.payload};

        case "toggleChatSidebar":
          return{...state,toggleChatSidebar:action.payload};

        case "togglePopup":
          return{...state,groupMsg:action.payload};

          case "groupMsg":
          return{...state,groupMsg:action.payload};

          case "tooglePrescreenRoom":
          return{ ...state,tooglePrescreenRoom:action.payload}

      default:
        return state; // Return the current state for unrecognized actions
    }
  };
  