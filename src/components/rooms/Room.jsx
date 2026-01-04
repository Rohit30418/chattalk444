import React from 'react'
import ScreenBeforeJoin from './ScreenBeforeJoin'
import RoomMain from './RoomMain'
import { useSelector } from 'react-redux'
const Room = () => {
    const tooglePrescreenRoom = useSelector((state) => state.tooglePrescreenRoom);
    const userData = useSelector((state) => state.userData);
  return (
    <div>
    {
    tooglePrescreenRoom? <ScreenBeforeJoin userData={userData}></ScreenBeforeJoin>:<RoomMain uId={userData.uid}></RoomMain>
    }
       
    </div>
  )
}

export default Room