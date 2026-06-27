/**
 * Ambient colour system.
 * In production: canvas-based extraction from cover URL.
 * For now: predefined map + a deterministic fallback from the title string.
 */

const AMBIENT_MAP: Record<string, [number, number, number]> = {
  'In the Mood for Love': [200, 60, 60],
  'Stalker': [40, 80, 120],
  'Mulholland Drive': [100, 40, 160],
  'The Sacrifice': [50, 110, 80],
  'Portrait of a Lady on Fire': [220, 80, 40],
  'Jeanne Dielman': [80, 110, 80],
  'Blue': [60, 100, 180],
  'Dummy': [110, 60, 150],
  'OK Computer': [50, 130, 100],
};

/** Simple hash → hue so every title gets a plausible colour */
function hashColour(title: string): [number, number, number] {
  let h = 0;
  for (let i = 0; i < title.length; i++) {
    h = (h * 31 + title.charCodeAt(i)) & 0xffffffff;
  }
  const hue = Math.abs(h) % 360;
  // Convert HSL(hue, 55%, 38%) to approximate RGB
  const s = 0.55, l = 0.38;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (hue < 60)      { r = c; g = x; }
  else if (hue < 120){ r = x; g = c; }
  else if (hue < 180){ g = c; b = x; }
  else if (hue < 240){ g = x; b = c; }
  else if (hue < 300){ r = x; b = c; }
  else               { r = c; b = x; }
  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255),
  ];
}

export function getAmbientColour(title: string): [number, number, number] {
  return AMBIENT_MAP[title] ?? hashColour(title);
}

export function ambientToRgb(colour: [number, number, number], alpha = 1): string {
  return `rgba(${colour[0]},${colour[1]},${colour[2]},${alpha})`;
}

export function ambientToHex(colour: [number, number, number]): string {
  return '#' + colour.map((c) => c.toString(16).padStart(2, '0')).join('');
}
