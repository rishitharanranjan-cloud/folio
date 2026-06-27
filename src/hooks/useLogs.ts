import { useState, useEffect, useCallback, useRef } from 'react';
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

const PAGE_SIZE = 50;

const SORT_COL: Record<string, { col: string; asc: boolean }> = {
  date:   { col: 'logged_at', asc: false },
  rating: { col: 'rating',    asc: false },
  title:  { col: 'title',     asc: true  },
  year:   { col: 'year',      asc: false },
};

export function useLogs(mediaType?: string, sortKey = 'date', statusFilter = 'all', noPaginate = false) {
  const { user } = useAuthStore();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const offsetRef = useRef(0);

  const fetchPage = useCallback(async (pageOffset: number, append: boolean) => {
    if (!user) { setLoading(false); return; }
    if (pageOffset === 0) setLoading(true); else setLoadingMore(true);
    setError(null);
    try {
      const { col, asc } = SORT_COL[sortKey] ?? SORT_COL.date;
      let query = supabase
        .from('logs')
        .select('id,media_type,title,creator,year,status,rating,review,cover_url,dominant_colour,logged_at,external_id')
        .eq('user_id', user.id)
        .order(col, { ascending: asc, nullsFirst: false });

      if (!noPaginate) query = (query as any).range(pageOffset, pageOffset + PAGE_SIZE - 1);

      if (mediaType) query = query.eq('media_type', mediaType);
      if (statusFilter !== 'all') query = query.eq('status', statusFilter);

      const { data, error: err } = await query;
      if (err) throw err;
      const rows = data ?? [];
      setLogs(prev => append ? [...prev, ...rows] : rows);
      setHasMore(rows.length === PAGE_SIZE);
      offsetRef.current = pageOffset + rows.length;
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [user, mediaType, sortKey, statusFilter, noPaginate]);

  const refetch = useCallback(() => {
    offsetRef.current = 0;
    fetchPage(0, false);
  }, [fetchPage]);

  const loadMore = useCallback(() => {
    if (!loadingMore && !loading && hasMore) fetchPage(offsetRef.current, true);
  }, [fetchPage, loadingMore, loading, hasMore]);

  useEffect(() => { refetch(); }, [refetch]);

  return { logs, loading, loadingMore, hasMore, error, refetch, loadMore };
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
