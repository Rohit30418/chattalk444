import React, { useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import ScreenBeforeJoin from './ScreenBeforeJoin';
import RoomMain from './RoomMain';
import { resetRoomUiState } from '../redux/action';
import { useAuth } from '../components/auth/AppWrapper';
import Loading from '../components/common/Loading';
import { configurePeerIceServers } from '../services/webrtcIce';

const Room = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const tooglePrescreenRoom = useSelector((state) => state.tooglePrescreenRoom);
  const { user, loading } = useAuth();
  const [iceReady, setIceReady] = useState(false);

  useEffect(() => {
    dispatch(resetRoomUiState());

    return () => {
      dispatch(resetRoomUiState());
    };
  }, [dispatch, id]);

  useEffect(() => {
    let cancelled = false;

    if (!user?.uid || tooglePrescreenRoom) {
      setIceReady(false);
      return () => {
        cancelled = true;
      };
    }

    setIceReady(false);

    configurePeerIceServers()
      .catch(() => null)
      .finally(() => {
        if (!cancelled) setIceReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, [user?.uid, tooglePrescreenRoom]);

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

  // PeerJS reads its default ICE configuration at construction time. Wait for
  // the authenticated TURN/STUN configuration before RoomMain creates a Peer.
  if (!iceReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)]">
        <Loading />
      </div>
    );
  }

  return (
    <div className="vaani-room">
      <RoomMain uId={user.uid} user={user} />
    </div>
  );
};

export default Room;
