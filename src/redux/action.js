 export const userInfo=(value)=>({type:"userData",payload:value});
 export const loginToggle=(value)=>({type:"Loginstatus",payload:value});
 export const addRoomModalToggle=(value)=>({type:"toggleModal",payload:value});
 export const toggleFriendsSidebar=(value)=>({type:"toggleFriendSidebar",payload:value});
 export const toggleChatSidebar=(value)=>({type:"toggleChatSidebar",payload:value});
 export const togglePopup=(value)=>({
    type:"togglePopup",
    payload:value,
 })

 export const groupMsg=(value)=>({
   type:"groupMsg",
   payload:value,
 })

 export const tooglePrescreenRoom=(value)=>({
  type:"tooglePrescreenRoom",
  payload:value
 })