import { db } from '../../firebase';
import {  doc, deleteDoc } from 'firebase/firestore';
import { useParams } from 'react-router';
import { useNavigate } from 'react-router';


const useDeleteCollection = () => {
  const { id } = useParams();
  const navigate= useNavigate();
  const deleteDocById = async (roomCollection, docId,isLogout) => {
    try {
      const roomRef = doc(db, 'rooms', id, roomCollection, docId);
      await deleteDoc(roomRef);
if (isLogout) {
  navigate("/");
}
   
    } catch (error) {
      
    }
  };

  return {deleteDocById};
};

export default useDeleteCollection;
