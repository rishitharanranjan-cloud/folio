/**
 * Media search adapters.
 * Films/TV  → TMDB
 * Books     → Open Library  (English editions, sorted by popularity)
 * Albums    → MusicBrainz + Cover Art Archive
 * Podcasts  → iTunes Search API  (free, no key)
 * Games     → Steam Store search (free, no key)
 */

export type MediaType = 'book' | 'film' | 'tv' | 'album' | 'podcast' | 'game';

export interface SearchResult {
  id: string;
  title: string;
  creator: string;
  year: number | null;
  coverUrl: string | null;
  /** Higher-res version for confirmation / share card screens */
  coverUrlHD: string | null;
  mediaType: MediaType;
  externalId: string;
}

// ─── TMDB ──────────────────────────────────────────────────────────────────

const TMDB_KEY  = process.env.EXPO_PUBLIC_TMDB_KEY ?? '';
const TMDB_BASE = 'https://api.themoviedb.org/3';
const TMDB_IMG  = (size: string) => `https://image.tmdb.org/t/p/${size}`;

async function searchTMDB(query: string, type: 'film' | 'tv'): Promise<SearchResult[]> {
  const endpoint = type === 'film' ? 'movie' : 'tv';
  const url = `${TMDB_BASE}/search/${endpoint}?query=${encodeURIComponent(query)}&api_key=${TMDB_KEY}&page=1`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  return (data.results ?? []).slice(0, 8).map((item: any) => {
    const poster = item.poster_path ?? null;
    return {
      id:           String(item.id),
      title:        item.title ?? item.name ?? '',
      creator:      '',
      year:         item.release_date
        ? parseInt(item.release_date.slice(0, 4))
        : item.first_air_date
        ? parseInt(item.first_air_date.slice(0, 4))
        : null,
      coverUrl:     poster ? TMDB_IMG('w342') + poster : null,
      coverUrlHD:   poster ? TMDB_IMG('w780') + poster : null,
      mediaType:    type,
      externalId:   String(item.id),
    };
  });
}

// ─── Open Library ──────────────────────────────────────────────────────────

async function searchBooks(query: string): Promise<SearchResult[]> {
  const url = `https://openlibrary.org/search.json?title=${encodeURIComponent(query)}&language=eng&limit=20&fields=key,title,author_name,first_publish_year,cover_i,edition_count&sort=editions`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();

  const results = (data.docs ?? []).map((item: any) => ({
    id:          item.key,
    title:       item.title ?? '',
    creator:     (item.author_name ?? []).slice(0, 2).join(', '),
    year:        item.first_publish_year ?? null,
    coverUrl:    item.cover_i ? `https://covers.openlibrary.org/b/id/${item.cover_i}-M.jpg` : null,
    coverUrlHD:  item.cover_i ? `https://covers.openlibrary.org/b/id/${item.cover_i}-L.jpg` : null,
    mediaType:   'book' as MediaType,
    externalId:  item.key,
  }));

  // Prefer results whose title contains the query words (English editions first)
  const q = query.toLowerCase();
  return results.sort((a: any, b: any) => {
    const aMatch = a.title.toLowerCase().includes(q) ? 0 : 1;
    const bMatch = b.title.toLowerCase().includes(q) ? 0 : 1;
    return aMatch - bMatch;
  }).slice(0, 8);
}

// ─── MusicBrainz ───────────────────────────────────────────────────────────

async function searchAlbums(query: string): Promise<SearchResult[]> {
  const url = `https://musicbrainz.org/ws/2/release-group?query=${encodeURIComponent(query)}&type=album&limit=8&fmt=json`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Folio/1.0 (folio-app)' },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return (data['release-groups'] ?? []).map((item: any) => {
    const coverBase = `https://coverartarchive.org/release-group/${item.id}/front`;
    return {
      id:          item.id,
      title:       item.title ?? '',
      creator:     (item['artist-credit'] ?? []).map((a: any) => a.artist?.name ?? '').join(', '),
      year:        item['first-release-date']
        ? parseInt(item['first-release-date'].slice(0, 4))
        : null,
      coverUrl:    `${coverBase}-250`,
      coverUrlHD:  `${coverBase}-500`,
      mediaType:   'album' as MediaType,
      externalId:  item.id,
    };
  });
}

// ─── iTunes (Podcasts) ─────────────────────────────────────────────────────

async function searchPodcasts(query: string): Promise<SearchResult[]> {
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=podcast&limit=10&media=podcast`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  return (data.results ?? []).slice(0, 8).map((item: any) => ({
    id:          String(item.collectionId ?? item.trackId ?? Math.random()),
    title:       item.collectionName ?? item.trackName ?? '',
    creator:     item.artistName ?? '',
    year:        item.releaseDate ? parseInt(item.releaseDate.slice(0, 4)) : null,
    coverUrl:    item.artworkUrl100 ?? null,
    coverUrlHD:  (item.artworkUrl100 ?? '').replace('100x100', '600x600') || null,
    mediaType:   'podcast' as MediaType,
    externalId:  String(item.collectionId ?? item.trackId ?? ''),
  }));
}

// ─── Steam Store (Games) ───────────────────────────────────────────────────

async function searchGames(query: string): Promise<SearchResult[]> {
  // Steam's store search — public endpoint, no API key needed
  const url = `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(query)}&l=english&cc=us`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  return (data.items ?? []).slice(0, 8).map((item: any) => {
    const appId = item.id;
    return {
      id:          String(appId),
      title:       item.name ?? '',
      creator:     '',
      year:        null,
      // Steam header images are high quality
      coverUrl:    `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/header.jpg`,
      coverUrlHD:  `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/library_600x900.jpg`,
      mediaType:   'game' as MediaType,
      externalId:  String(appId),
    };
  });
}

// ─── Unified search ────────────────────────────────────────────────────────

export async function searchMedia(query: string, type: MediaType): Promise<SearchResult[]> {
  if (!query.trim()) return [];
  try {
    switch (type) {
      case 'film':    return searchTMDB(query, 'film');
      case 'tv':      return searchTMDB(query, 'tv');
      case 'book':    return searchBooks(query);
      case 'album':   return searchAlbums(query);
      case 'podcast': return searchPodcasts(query);
      case 'game':    return searchGames(query);
    }
  } catch {
    return [];
  }
}

/** Build a manual/freehand entry when APIs return nothing */
export function buildManualEntry(
  title: string,
  creator: string,
  year: string,
  type: MediaType,
): SearchResult {
  const ts = Date.now();
  return {
    id:          `manual-${ts}`,
    title:       title.trim(),
    creator:     creator.trim(),
    year:        parseInt(year) || null,
    coverUrl:    null,
    coverUrlHD:  null,
    mediaType:   type,
    externalId:  `manual-${ts}`,
  };
}
