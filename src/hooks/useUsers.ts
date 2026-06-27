import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

export interface FolioUser {
  id: string;
  name: string | null;
  handle: string | null;
  bio: string | null;
  isFollowing: boolean;
}

export function useUserSearch() {
  const { user } = useAuthStore();
  const [results, setResults] = useState<FolioUser[]>([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async (query: string) => {
    if (!query.trim()) { setResults([]); return; }
    setLoading(true);
    try {
      const { data: users } = await supabase
        .from('users')
        .select('id, name, handle, bio')
        .or(`handle.ilike.%${query}%,name.ilike.%${query}%`)
        .neq('id', user?.id ?? '')
        .limit(20);

      const { data: follows } = user
        ? await supabase.from('follows').select('following_id').eq('follower_id', user.id)
        : { data: [] };

      const followingSet = new Set((follows ?? []).map((f: any) => f.following_id));

      setResults(
        (users ?? []).map((u: any) => ({
          ...u,
          isFollowing: followingSet.has(u.id),
        }))
      );
    } finally {
      setLoading(false);
    }
  }, [user]);

  const toggleFollow = async (targetId: string) => {
    if (!user) return;
    const isFollowing = results.find((r) => r.id === targetId)?.isFollowing;
    if (isFollowing) {
      await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', targetId);
    } else {
      await supabase.from('follows').insert({ follower_id: user.id, following_id: targetId });
    }
    setResults((prev) =>
      prev.map((r) => r.id === targetId ? { ...r, isFollowing: !r.isFollowing } : r)
    );
  };

  return { results, loading, search, toggleFollow };
}
