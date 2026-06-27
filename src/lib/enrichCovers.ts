/**
 * Post-import cover art enrichment.
 * Fetches cover_url for logs that have none, using TMDB (film/tv) and
 * Open Library (book). Albums, podcasts, and games are skipped — their
 * search APIs require more complex matching.
 */
import { supabase } from './supabase';

const TMDB_KEY = process.env.EXPO_PUBLIC_TMDB_KEY;
const TMDB_BASE = 'https://api.themoviedb.org/3';
const TMDB_IMG  = `https://image.tmdb.org/t/p/w342`;

function sleep(ms: number) { return new Promise<void>(r => setTimeout(r, ms)); }

async function filmCover(title: string, year: number | null): Promise<string | null> {
  if (!TMDB_KEY) return null;
  const params = new URLSearchParams({ api_key: TMDB_KEY, query: title });
  if (year) params.set('year', String(year));
  const res = await fetch(`${TMDB_BASE}/search/movie?${params}`);
  if (!res.ok) return null;
  const poster = (await res.json()).results?.[0]?.poster_path;
  return poster ? TMDB_IMG + poster : null;
}

async function tvCover(title: string, year: number | null): Promise<string | null> {
  if (!TMDB_KEY) return null;
  const params = new URLSearchParams({ api_key: TMDB_KEY, query: title });
  if (year) params.set('first_air_date_year', String(year));
  const res = await fetch(`${TMDB_BASE}/search/tv?${params}`);
  if (!res.ok) return null;
  const poster = (await res.json()).results?.[0]?.poster_path;
  return poster ? TMDB_IMG + poster : null;
}

async function bookCover(title: string): Promise<string | null> {
  const res = await fetch(
    `https://openlibrary.org/search.json?title=${encodeURIComponent(title)}&limit=3&fields=cover_i`
  );
  if (!res.ok) return null;
  const cover_i = (await res.json()).docs?.[0]?.cover_i;
  return cover_i ? `https://covers.openlibrary.org/b/id/${cover_i}-M.jpg` : null;
}

async function fetchCover(
  mediaType: string,
  title: string,
  year: number | null,
): Promise<string | null> {
  if (mediaType === 'film')  return filmCover(title, year);
  if (mediaType === 'tv')    return tvCover(title, year);
  if (mediaType === 'book')  return bookCover(title);
  return null;
}

export async function enrichCovers(
  userId: string,
  onProgress?: (done: number, total: number) => void,
): Promise<{ enriched: number }> {
  const { data: logs } = await supabase
    .from('logs')
    .select('id,media_type,title,year')
    .eq('user_id', userId)
    .is('cover_url', null)
    .in('media_type', ['film', 'tv', 'book']);

  if (!logs?.length) return { enriched: 0 };

  let enriched = 0;
  const BATCH = 5;

  for (let i = 0; i < logs.length; i += BATCH) {
    const batch = logs.slice(i, i + BATCH);
    await Promise.all(batch.map(async (log) => {
      try {
        const url = await fetchCover(log.media_type, log.title, log.year);
        if (url) {
          const { error } = await supabase.from('logs').update({ cover_url: url }).eq('id', log.id);
          if (!error) enriched++;
        }
      } catch (_) {}
    }));
    onProgress?.(Math.min(i + BATCH, logs.length), logs.length);
    if (i + BATCH < logs.length) await sleep(300);
  }

  return { enriched };
}
