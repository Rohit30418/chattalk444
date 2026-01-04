import React from "react";
import { db } from "../../firebase";
import { collection,getDocs } from "firebase/firestore";


const  RoomMembers= async ()=> {
const participants=collection(db,"rooms",roomid,"participants");
const snapshot= await getDocs(participants);
const usersList = snapshot.docs.map((doc) => ({
    id: doc.id,  // Capture the document ID
    ...doc.data() // Spread document data
  }));
  console.log(usersList);  // You can return this or use it in your component


    return(
<>

</>

    )
}

export default RoomMembers;