import { doc,deleteDoc } from "firebase/firestore"
import { db } from "../../firebase"
const useDeleteFriend=()=>{

const deleteById= async(userId,friendId)=>{

console.log(userId,friendId);

  try {
    const userRef = await doc(db, "users", userId, "friends", friendId);

    await deleteDoc(userRef)
    alert("friend has been removed")
  } catch (error) {
    alert(error)
  }
}

 return deleteById

}


export default useDeleteFriend;