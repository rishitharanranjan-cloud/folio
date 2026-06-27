import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

// ── Event types ────────────────────────────────────────────────────────────

export interface FeedLog {
  type: 'log';
  id: string;
  user_id: string;
  user_name: string | null;
  user_handle: string | null;
  media_type: string;
  title: string;
  creator: string | null;
  year: number | null;
  status: string;
  rating: number | null;
  review: string | null;
  cover_url: string | null;
  dominant_colour: string | null;
  logged_at: string;
  isOwn: boolean;
  reactionCount: number;
  hasReacted: boolean;
  commentCount: number;
}

export interface FeedTrailComplete {
  type: 'trail_complete';
  id: string;             // user_trail id
  user_id: string;
  user_name: string | null;
  user_handle: string | null;
  trail_id: string;
  trail_title: string;
  completed_at: string;
  isOwn: boolean;
}

export type FeedEvent = FeedLog | FeedTrailComplete;

// Keep for backwards compatibility
export type FeedItem = FeedLog;

// ── Activity (reactions on own logs) ──────────────────────────────────────

export interface ActivityItem {
  id: string;
  log_id: string;
  log_title: string;
  reactor_name: string | null;
  reactor_handle: string | null;
  emoji: string;
  created_at: string;
}

// ── Hook ──────────────────────────────────────────────────────────────────

export function useFeed() {
  const { user } = useAuthStore();
  const [events, setEvents] = useState<FeedEvent[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasFollowing, setHasFollowing] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const fetch = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    try {
      // 1. Who does the user follow?
      const { data: follows } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id);

      const followingIds: string[] = (follows ?? []).map((f: any) => f.following_id);
      setHasFollowing(followingIds.length > 0);

      // Include own user so logs always appear
      const feedIds = [...new Set([user.id, ...followingIds])];

      // 2. Fetch logs
      const { data: logs } = await supabase
        .from('logs')
        .select(`id, user_id, media_type, title, creator, year,
                 status, rating, review, cover_url, dominant_colour, logged_at,
                 users!inner(name, handle)`)
        .in('user_id', feedIds)
        .order('logged_at', { ascending: false })
        .limit(80);

      // 3. Fetch reaction counts for those logs
      const logIds = (logs ?? []).map((l: any) => l.id);
      const [{ data: reactionCounts }, { data: myReactions }, { data: commentCounts }] = await Promise.all([
        logIds.length
          ? supabase.from('reactions').select('log_id').in('log_id', logIds)
          : Promise.resolve({ data: [] }),
        logIds.length
          ? supabase.from('reactions').select('log_id').in('log_id', logIds).eq('user_id', user.id)
          : Promise.resolve({ data: [] }),
        logIds.length
          ? supabase.from('comments').select('log_id').in('log_id', logIds)
          : Promise.resolve({ data: [] }),
      ]);

      const countMap = new Map<string, number>();
      (reactionCounts ?? []).forEach((r: any) => {
        countMap.set(r.log_id, (countMap.get(r.log_id) ?? 0) + 1);
      });
      const mySet = new Set((myReactions ?? []).map((r: any) => r.log_id));
      const commentMap = new Map<string, number>();
      (commentCounts ?? []).forEach((c: any) => {
        commentMap.set(c.log_id, (commentMap.get(c.log_id) ?? 0) + 1);
      });

      const logEvents: FeedLog[] = (logs ?? []).map((l: any) => ({
        type: 'log',
        ...l,
        user_name:      l.users?.name ?? null,
        user_handle:    l.users?.handle ?? null,
        isOwn:          l.user_id === user.id,
        reactionCount:  countMap.get(l.id) ?? 0,
        hasReacted:     mySet.has(l.id),
        commentCount:   commentMap.get(l.id) ?? 0,
      }));

      // 4. Fetch trail completions for feed users
      const { data: trailCompletions } = await supabase
        .from('user_trails')
        .select(`id, user_id, trail_id, completed_at,
                 users!inner(name, handle),
                 trails!inner(title)`)
        .in('user_id', feedIds)
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: false })
        .limit(20);

      const trailEvents: FeedTrailComplete[] = (trailCompletions ?? []).map((t: any) => ({
        type: 'trail_complete',
        id:           t.id,
        user_id:      t.user_id,
        user_name:    t.users?.name ?? null,
        user_handle:  t.users?.handle ?? null,
        trail_id:     t.trail_id,
        trail_title:  t.trails?.title ?? '',
        completed_at: t.completed_at,
        isOwn:        t.user_id === user.id,
      }));

      // 5. Merge and sort by timestamp
      const all: FeedEvent[] = [
        ...logEvents,
        ...trailEvents,
      ].sort((a, b) => {
        const tA = a.type === 'log' ? a.logged_at : a.completed_at;
        const tB = b.type === 'log' ? b.logged_at : b.completed_at;
        return new Date(tB).getTime() - new Date(tA).getTime();
      });

      setEvents(all);

      // 6. Activity — reactions received on own logs
      const { data: ownLogs } = await supabase
        .from('logs')
        .select('id, title')
        .eq('user_id', user.id);

      const ownLogIds = (ownLogs ?? []).map((l: any) => l.id);
      const ownLogMap = new Map((ownLogs ?? []).map((l: any) => [l.id, l.title]));

      if (ownLogIds.length) {
        const { data: activityData } = await supabase
          .from('reactions')
          .select(`id, log_id, emoji, created_at,
                   users!inner(name, handle)`)
          .in('log_id', ownLogIds)
          .neq('user_id', user.id)   // not self-reactions
          .order('created_at', { ascending: false })
          .limit(40);

        setActivity(
          (activityData ?? []).map((r: any) => ({
            id:              r.id,
            log_id:          r.log_id,
            log_title:       ownLogMap.get(r.log_id) ?? '',
            reactor_name:    r.users?.name ?? null,
            reactor_handle:  r.users?.handle ?? null,
            emoji:           r.emoji,
            created_at:      r.created_at,
          }))
        );
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Realtime: re-fetch when any log is inserted for followed users
  useEffect(() => {
    if (!user) return;
    channelRef.current = supabase
      .channel('feed-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'logs' }, () => {
        fetch();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reactions' }, () => {
        fetch();
      })
      .subscribe();

    return () => {
      channelRef.current?.unsubscribe();
    };
  }, [user, fetch]);

  useEffect(() => { fetch(); }, [fetch]);

  // Toggle reaction on a log
  const toggleReaction = useCallback(async (logId: string, currentlyReacted: boolean) => {
    if (!user) return;

    // Optimistic update
    setEvents((prev) =>
      prev.map((e) => {
        if (e.type !== 'log' || e.id !== logId) return e;
        return {
          ...e,
          hasReacted:    !currentlyReacted,
          reactionCount: e.reactionCount + (currentlyReacted ? -1 : 1),
        };
      })
    );

    if (currentlyReacted) {
      await supabase
        .from('reactions')
        .delete()
        .eq('user_id', user.id)
        .eq('log_id', logId);
    } else {
      await supabase
        .from('reactions')
        .insert({ user_id: user.id, log_id: logId, emoji: '❤' });
    }
  }, [user]);

  const updateCommentCount = useCallback((logId: string, count: number) => {
    setEvents((prev) =>
      prev.map((e) =>
        e.type === 'log' && e.id === logId ? { ...e, commentCount: count } : e
      )
    );
  }, []);

  return {
    events,
    items: events.filter((e): e is FeedLog => e.type === 'log'),
    activity,
    loading,
    hasFollowing,
    refetch: fetch,
    toggleReaction,
    updateCommentCount,
  };
}
