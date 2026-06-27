/**
 * CSV import parsers for Goodreads and Letterboxd.
 * Both export CSVs from their settings pages.
 */

export interface ImportedLog {
  title: string;
  creator: string;
  year: number | null;
  status: 'finished' | 'want' | 'current' | 'abandoned';
  rating: number | null;
  logged_at: string;
  media_type: 'book' | 'film';
  cover_url: null;
  dominant_colour: null;
  external_id: null;
}

/** Parse a simple CSV — handles quoted fields with commas inside */
function parseCSV(text: string): Record<string, string>[] {
  const lines = text.replace(/\r/g, '').split('\n').filter(Boolean);
  if (lines.length < 2) return [];

  const headers = parseLine(lines[0]);
  return lines.slice(1).map((line) => {
    const values = parseLine(line);
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => { obj[h.trim()] = (values[i] ?? '').trim(); });
    return obj;
  });
}

function parseLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current); current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

function parseRating(raw: string, maxStars = 5): number | null {
  if (!raw) return null;
  // Goodreads: 1–5, Letterboxd: 0.5–5 (half stars)
  const n = parseFloat(raw);
  if (isNaN(n) || n === 0) return null;
  return Math.min(5, Math.max(1, Math.round(n)));
}

function toISO(dateStr: string): string {
  if (!dateStr) return new Date().toISOString();
  // Goodreads: "2023/04/15", Letterboxd: "2023-04-15"
  const d = new Date(dateStr.replace(/\//g, '-'));
  return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

// ── Goodreads ──────────────────────────────────────────────────────────────
// Columns: Book Id, Title, Author, Author l-f, Additional Authors, ISBN, ISBN13,
//          My Rating, Average Rating, Publisher, Binding, Number of Pages,
//          Year Published, Original Publication Year, Date Read, Date Added,
//          Bookshelves, Bookshelves with positions, Exclusive Shelf, My Review,
//          Spoiler, Private Notes, Read Count, Owned Copies

export function parseGoodreads(csvText: string): ImportedLog[] {
  const rows = parseCSV(csvText);
  return rows.map((row) => {
    const shelf = (row['Exclusive Shelf'] ?? '').toLowerCase();
    let status: ImportedLog['status'] = 'want';
    if (shelf === 'read')         status = 'finished';
    else if (shelf === 'currently-reading') status = 'current';
    else if (shelf === 'to-read') status = 'want';

    return {
      title:           row['Title'] ?? '',
      creator:         row['Author'] ?? '',
      year:            parseInt(row['Original Publication Year'] || row['Year Published']) || null,
      status,
      rating:          parseRating(row['My Rating']),
      logged_at:       toISO(row['Date Read'] || row['Date Added']),
      media_type:      'book' as const,
      cover_url:       null,
      dominant_colour: null,
      external_id:     null,
    };
  }).filter((l) => l.title);
}

// ── Letterboxd ─────────────────────────────────────────────────────────────
// Columns (diary export): Date, Name, Year, Letterboxd URI, Rating, Rewatch, Tags, Watched Date
// Columns (watchlist): Date, Name, Year, Letterboxd URI

export function parseLetterboxd(csvText: string): ImportedLog[] {
  const rows = parseCSV(csvText);
  return rows.map((row) => {
    const isDiary = 'Watched Date' in row || 'Rating' in row;
    return {
      title:           row['Name'] ?? '',
      creator:         '',
      year:            parseInt(row['Year']) || null,
      status:          (isDiary ? 'finished' : 'want') as ImportedLog['status'],
      rating:          parseRating(row['Rating']),
      logged_at:       toISO(row['Watched Date'] || row['Date']),
      media_type:      'film' as const,
      cover_url:       null,
      dominant_colour: null,
      external_id:     null,
    };
  }).filter((l) => l.title);
}
