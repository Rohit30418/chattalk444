// import React, { useState, useEffect } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import useGetCollectionData from '../../reducer/action';
// import useDeleteFriend from '../../hooks/useDeleteFriend';
// import onlineImg from '../../assets/online.png';
// import offlineImg from '../../assets/offline.png';
// import getUserDataFromFirestore from '../customHooks/getUserData';
// import { toggleFriendsSidebar } from '../../reducer/action';

// const FriendsSidebar = () => {
//   const dispatch = useDispatch();
//   const [allFriends, setAllFriends] = useState([]);
//   const uId = useSelector((state) => state.userData.uid);
//   const isFriendSidebarOpen = useSelector((state) => state.toggleFriendSide);

//   const closeSidebar = () => {
//     dispatch(toggleFriendsSidebar(false));
//   };

//   const deleteByID = useDeleteFriend();

//   const DeleteFriend = (id) => {
//     deleteByID(uId, id);
//   };

//   const { collectionData } = useGetCollectionData("friends", uId, "", "users") || {};

//   useEffect(() => {
//     if (collectionData) {
//       const fetchData = async () => {
//         const friends = await Promise.all(collectionData.map(async (user) => {
//           const userData = await getUserDataFromFirestore(user.id);
//           return userData;
//         }));
//         setAllFriends(friends);
//       };
//       fetchData();
//     }
//   }, [collectionData]);


//   return (
//     <div className={!isFriendSidebarOpen ? 'fixed transition-all duration-300 ease-in-out top-0 -right-full bottom-0 p-2 none w-56 shadow-md bg-slate-900' : 'fixed top-0 right-0 transition-all duration-300 ease-in-out bottom-0 p-2 none w-56 shadow-md bg-slate-900'}>
//       <span className='w-6 ml-auto text-center text-white h-6 flex items-center justify-center rounded-full cursor-pointer bg-red-600' onClick={closeSidebar}>x</span>

//       <input type="text" placeholder='Search Friends' className='w-100 bg-white p-2 my-3 w-full rounded-md' />

//       {allFriends.length !== 0 ? allFriends.map((item) => (
//         <div className='flex items-center justify-between mt-3' key={item.id}>
//           <div className='flex items-center gap-2'>
//             {/* {isOnline ? <img className='w-5' src={onlineImg} /> : <img className='w-5' src={offlineImg} />} */}
//             <img className='w-8 h-8 rounded-full' src={item?.photoURL} alt={item?.displayName} />
//             <p className='text-white'>{item?.displayName}</p>
//           </div>
//           <span className='text-red-600'>
//             <button onClick={() => DeleteFriend(item?.id)}><i className="fas fa-heart-broken"></i></button>
//           </span>
//         </div>
//       )) : <p className='text-white'>No <i className='fa fa-users'></i> friends available. Please follow others to add as friends.</p>}
//     </div>
//   );
// };

// export default FriendsSidebar;
