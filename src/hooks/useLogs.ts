import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

export interface LogEntry {
  id: string;
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
  external_id: string | null;
}

export function useLogs(mediaType?: string) {
  const { user } = useAuthStore();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('logs')
        .select('*')
        .eq('user_id', user.id)
        .order('logged_at', { ascending: false });

      if (mediaType) query = query.eq('media_type', mediaType);

      const { data, error: err } = await query;
      if (err) throw err;
      setLogs(data ?? []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user, mediaType]);

  useEffect(() => { fetch(); }, [fetch]);

  return { logs, loading, error, refetch: fetch };
}

export interface LogUpdate {
  rating?: number | null;
  review?: string | null;
  status?: string;
}

export async function updateLog(id: string, changes: LogUpdate): Promise<void> {
  const { error } = await supabase.from('logs').update(changes).eq('id', id);
  if (error) throw new Error(error.message);
}
