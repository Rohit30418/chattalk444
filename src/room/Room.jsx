import React, { useEffect } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import ScreenBeforeJoin from './ScreenBeforeJoin';
import RoomMain from './RoomMain';
import { resetRoomUiState } from '../redux/action';
import { useAuth } from '../components/auth/AppWrapper';
import Loading from '../components/common/Loading';

const Room = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const tooglePrescreenRoom = useSelector((state) => state.tooglePrescreenRoom);
  const { user, loading } = useAuth();

  useEffect(() => {
    dispatch(resetRoomUiState());

    return () => {
      dispatch(resetRoomUiState());
    };
  }, [dispatch, id]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)]">
        <Loading />
      </div>
    );
  }

  if (!user?.uid) {
    return <Navigate to="/rooms" replace state={{ authRequired: true, roomId: id }} />;
  }

  if (tooglePrescreenRoom) return <ScreenBeforeJoin />;

  return (
    <div className="vaani-room">
      <RoomMain uId={user.uid} user={user} />
    </div>
  );
};

export default Room;
