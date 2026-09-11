import { useEffect, useState } from 'react';
import api from '../services/api';

function useUserCollection(userId) {
  const [collectionsData, setCollectionsData] = useState({
    following: [],
    followers: [],
    friends: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) {
      setCollectionsData({ following: [], followers: [], friends: [] });
      setLoading(false);
      return undefined;
    }

    let cancelled = false;

    const fetchUserCollections = async () => {
      setLoading(true);
      setError(null);

      try {
        const types = ['following', 'followers', 'friends'];
        const results = await Promise.all(
          types.map(async (type) => {
            const { data } = await api.get(
              `/api/social/collections/${encodeURIComponent(userId)}/${type}`
            );
            const users = Array.isArray(data?.users) ? data.users : [];
            return [
              type,
              users.map((user) => ({
                ...user,
                id: user.uid || user.id,
              })),
            ];
          })
        );

        if (!cancelled) {
          setCollectionsData(Object.fromEntries(results));
        }
      } catch (err) {
        console.error('Error fetching user social collections:', err);
        if (!cancelled) {
          setError(err);
          setCollectionsData({ following: [], followers: [], friends: [] });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchUserCollections();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  return { collectionsData, loading, error };
}

export default useUserCollection;
