import { Link } from 'react-router-dom';
import { useRoomData } from '../hooks/getRoom';
import { useAuth } from '../components/auth/AppWrapper';
import RoomCard from '../room/components/RoomCard';

export default function ActiveRoomsSection() {
  const { rooms, loading, error, refetch } = useRoomData();
  const { user } = useAuth();
  return (
    <section className="bg-[var(--color-bg-soft)] px-4 py-16 text-[var(--color-text)] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto mb-10 max-w-3xl text-center">
          <h2 className="text-3xl font-black sm:text-4xl">Active Voice Rooms</h2>
          <p className="mt-4 text-[var(--color-muted)]">Find a conversation and practice with other learners.</p>
        </div>
        {loading ? <p role="status" className="text-center">Loading rooms…</p> : error ? (
          <div role="alert" className="text-center"><p>Rooms are unavailable right now.</p><button type="button" onClick={refetch} className="mt-3 underline">Try again</button></div>
        ) : rooms.length === 0 ? (
          <p className="text-center text-[var(--color-muted)]">No active rooms yet. Create a room to start a conversation.</p>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {rooms.slice(0, 6).map((room) => <RoomCard key={room.id || room._id} room={room} loginStatus={Boolean(user?.uid)} />)}
          </div>
        )}
        <div className="mt-10 text-center"><Link to="/rooms" className="inline-flex rounded-2xl border border-[var(--color-border)] px-5 py-3 font-bold">Browse all rooms</Link></div>
      </div>
    </section>
  );
}
