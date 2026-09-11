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
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const refresh = () => setReloadKey((value) => value + 1);
    window.addEventListener('vaani-social-refresh', refresh);
    return () => window.removeEventListener('vaani-social-refresh', refresh);
  }, []);

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
          // A social-service hiccup should not hide the whole profile page.
          setError(null);
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
  }, [userId, reloadKey]);

  return { collectionsData, loading, error };
}

export default useUserCollection;
