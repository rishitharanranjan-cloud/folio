import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

export interface TrailStop {
  id: string;
  position: number;
  media_type: string;
  title: string;
  creator: string | null;
  cover_colour: string | null;
  external_id: string | null;
}

export interface Trail {
  id: string;
  title: string;
  description: string | null;
  tag: string | null;
  stop_count: number;
  follower_count: number;
  stops?: TrailStop[];
  // User progress
  joined: boolean;
  completed_at: string | null;
  stopsLogged: number;
}

export function useTrails() {
  const { user } = useAuthStore();
  const [trails, setTrails] = useState<Trail[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const [{ data: trailData }, { data: userTrailData }, { data: userLogs }] = await Promise.all([
        supabase.from('trails').select('*').order('follower_count', { ascending: false }),
        user
          ? supabase.from('user_trails').select('trail_id, completed_at').eq('user_id', user.id)
          : Promise.resolve({ data: [] }),
        user
          ? supabase.from('logs').select('title').eq('user_id', user.id)
          : Promise.resolve({ data: [] }),
      ]);

      const userMap = new Map(
        (userTrailData ?? []).map((ut: any) => [ut.trail_id, ut.completed_at])
      );
      const loggedTitles = new Set((userLogs ?? []).map((l: any) => l.title.toLowerCase()));

      // For joined trails, fetch stop titles to compute progress
      const joinedTrailIds = [...userMap.keys()];
      let stopMap = new Map<string, string[]>(); // trail_id → stop titles[]
      if (joinedTrailIds.length > 0) {
        const { data: stopData } = await supabase
          .from('trail_stops')
          .select('trail_id, title')
          .in('trail_id', joinedTrailIds);
        for (const s of (stopData ?? [])) {
          const arr = stopMap.get(s.trail_id) ?? [];
          arr.push(s.title.toLowerCase());
          stopMap.set(s.trail_id, arr);
        }
      }

      setTrails(
        (trailData ?? []).map((t: any) => {
          const stops = stopMap.get(t.id) ?? [];
          const stopsLogged = stops.filter((title) => loggedTitles.has(title)).length;
          return {
            ...t,
            joined: userMap.has(t.id),
            completed_at: userMap.get(t.id) ?? null,
            stopsLogged,
          };
        })
      );
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetch(); }, [fetch]);
  return { trails, loading, refetch: fetch };
}

export function useTrailDetail(trailId: string) {
  const { user } = useAuthStore();
  const [trail, setTrail] = useState<Trail | null>(null);
  const [stops, setStops] = useState<TrailStop[]>([]);
  const [loggedTitles, setLoggedTitles] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const go = async () => {
      const [{ data: trailData }, { data: stopData }, { data: userLogs }] = await Promise.all([
        supabase.from('trails').select('*').eq('id', trailId).maybeSingle(),
        supabase.from('trail_stops').select('*').eq('trail_id', trailId).order('position'),
        user
          ? supabase.from('logs').select('title').eq('user_id', user.id)
          : Promise.resolve({ data: [] }),
      ]);

      const logged = new Set((userLogs ?? []).map((l: any) => l.title.toLowerCase()));

      if (trailData) {
        const { data: ut } = await supabase
          .from('user_trails')
          .select('completed_at')
          .eq('trail_id', trailId)
          .eq('user_id', user?.id ?? '')
          .maybeSingle();

        setTrail({
          ...trailData,
          joined: !!ut,
          completed_at: ut?.completed_at ?? null,
          stopsLogged: (stopData ?? []).filter((s: any) => logged.has(s.title.toLowerCase())).length,
        });
      }
      setStops(stopData ?? []);
      setLoggedTitles(logged);
      setLoading(false);
    };
    go();
  }, [trailId, user]);

  const joinTrail = async () => {
    if (!user || !trail) return;
    await supabase.from('user_trails').upsert({ user_id: user.id, trail_id: trailId });
    await supabase.from('trails').update({ follower_count: (trail.follower_count ?? 0) + 1 }).eq('id', trailId);
    setTrail((t) => t ? { ...t, joined: true } : t);
  };

  return { trail, stops, loggedTitles, loading, joinTrail };
}
