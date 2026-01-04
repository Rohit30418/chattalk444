
import { db } from '../../firebase'
import { doc } from 'firebase/firestore'
import { useParams } from 'react-router'

const AddUnseenMsg = (uId) => {  
        const { id } = useParams();
        // const {uId}=useParams();
        function unSeenmsgCount() {

            try {

        const roomRef = collection(db, "rooms", id, "participents",uId,"unseenmsg");
        const userDocRef = doc(roomRef); 
        updateDoc(userDocRef, message)
      
            } catch (error) {
                
            }
            
        }


       return unSeenmsgCount;
        
   
}

export default AddUnseenMsg