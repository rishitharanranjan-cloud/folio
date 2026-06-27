/**
 * Constellation engine — derives star positions from logs + taste_seeds.
 * Never stored; computed client-side at render time.
 *
 * Layout rules:
 *  - Canvas is 1×1 (normalised). Caller scales to actual dimensions.
 *  - Media type regions (soft — stars cluster but can drift):
 *      books    → top-left     (0.05–0.45, 0.05–0.45)
 *      films    → top-right    (0.55–0.95, 0.05–0.45)
 *      albums   → bottom-left  (0.05–0.45, 0.55–0.95)
 *      tv       → bottom-right (0.55–0.95, 0.55–0.95)
 *      taste    → centre band  (0.25–0.75, 0.25–0.75)
 *  - Star radius: 1.5 (unrated) → 4 (5 stars)
 *  - Connecting lines between logs sharing the same creator
 */

import type { LogEntry } from '../hooks/useLogs';

export interface Star {
  id: string;
  x: number;           // 0–1
  y: number;           // 0–1
  r: number;           // radius in normalised units (multiply by width)
  colour: string;
  label: string;
  mediaType: string;
  creator: string | null;
  rating: number | null;
  date: string;
}

export interface ConstellationLine {
  x1: number; y1: number;
  x2: number; y2: number;
  colour: string;
}

export interface ConstellationData {
  stars: Star[];
  lines: ConstellationLine[];
}

type Region = [number, number, number, number]; // minX, maxX, minY, maxY

const REGIONS: Record<string, Region> = {
  book:    [0.04, 0.44, 0.04, 0.44],
  film:    [0.56, 0.96, 0.04, 0.44],
  album:   [0.04, 0.44, 0.56, 0.96],
  tv:      [0.56, 0.96, 0.56, 0.96],
  podcast: [0.20, 0.50, 0.20, 0.50],
  game:    [0.50, 0.80, 0.50, 0.80],
  taste:   [0.25, 0.75, 0.25, 0.75],
};

/** Deterministic hash → float in [0, 1] */
function hash(str: string, seed = 0): number {
  let h = seed;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 0x9e3779b9);
    h ^= h >>> 16;
  }
  return (Math.abs(h) % 10000) / 10000;
}

function placeInRegion(id: string, region: Region): { x: number; y: number } {
  const [minX, maxX, minY, maxY] = region;
  return {
    x: minX + hash(id, 1) * (maxX - minX),
    y: minY + hash(id, 2) * (maxY - minY),
  };
}

function starRadius(rating: number | null): number {
  if (!rating) return 1.8;
  return 1.8 + (rating - 1) * 0.7; // 1.8 → 4.6
}

export function buildConstellation(
  logs: LogEntry[],
  tasteSeeds: { id: string; name: string; type: string }[],
  lineColour: string,
  dimColour: string,
): ConstellationData {
  const stars: Star[] = [];
  const lines: ConstellationLine[] = [];

  // Place log stars
  for (const log of logs) {
    const region = REGIONS[log.media_type] ?? REGIONS.taste;
    const { x, y } = placeInRegion(log.id, region);
    stars.push({
      id: log.id,
      x, y,
      r: starRadius(log.rating),
      colour: log.dominant_colour ?? lineColour,
      label: log.title,
      mediaType: log.media_type,
      creator: log.creator,
      rating: log.rating,
      date: log.logged_at,
    });
  }

  // Place taste seed stars (smaller, dimmer — they anchor the map)
  for (const seed of tasteSeeds) {
    const region = REGIONS.taste;
    const { x, y } = placeInRegion(seed.id, region);
    stars.push({
      id: `seed-${seed.id}`,
      x, y,
      r: 1.2,
      colour: dimColour,
      label: seed.name,
      mediaType: 'taste',
      creator: null,
      rating: null,
      date: '',
    });
  }

  // Draw lines connecting stars with the same creator (among logs only)
  const byCreator = new Map<string, Star[]>();
  for (const star of stars) {
    if (!star.creator || star.mediaType === 'taste') continue;
    const key = star.creator.toLowerCase().trim();
    const existing = byCreator.get(key) ?? [];
    existing.push(star);
    byCreator.set(key, existing);
  }

  for (const [, group] of byCreator) {
    if (group.length < 2) continue;
    for (let i = 0; i < group.length - 1; i++) {
      lines.push({
        x1: group[i].x, y1: group[i].y,
        x2: group[i + 1].x, y2: group[i + 1].y,
        colour: lineColour,
      });
    }
  }

  return { stars, lines };
}

/** Build creator connection groups for the Links view */
export function buildConnectionGroups(
  stars: Star[],
): Map<string, Star[]> {
  const byCreator = new Map<string, Star[]>();
  for (const star of stars) {
    if (!star.creator || star.mediaType === 'taste') continue;
    const key = star.creator.toLowerCase().trim();
    const existing = byCreator.get(key) ?? [];
    existing.push(star);
    byCreator.set(key, existing);
  }
  // Keep only groups with ≥2 entries
  for (const [k, v] of byCreator) {
    if (v.length < 2) byCreator.delete(k);
  }
  return byCreator;
}
