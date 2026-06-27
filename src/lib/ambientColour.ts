/**
 * Ambient colour system.
 * In production: canvas-based extraction from cover URL.
 * For now: predefined map + a deterministic fallback from the title string.
 *
 * CLAMPING RULE: raw ambient colours are used as-is only for physical shelf
 * objects (book spines, DVD cases, etc.) where they represent the actual cover.
 * All UI chrome usage (backgrounds, glows, accents) must go through clampAmbient()
 * to keep saturation ≤ 45% and lightness in a legible range.
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
  const s = 0.55, l = 0.38;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (hue < 60)       { r = c; g = x; }
  else if (hue < 120) { r = x; g = c; }
  else if (hue < 180) { g = c; b = x; }
  else if (hue < 240) { g = x; b = c; }
  else if (hue < 300) { r = x; b = c; }
  else                { r = c; b = x; }
  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255),
  ];
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === rn)      h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
  else if (max === gn) h = ((bn - rn) / d + 2) / 6;
  else                 h = ((rn - gn) / d + 4) / 6;
  return [h * 360, s, l];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };
  if (s === 0) {
    const v = Math.round(l * 255);
    return [v, v, v];
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hn = h / 360;
  return [
    Math.round(hue2rgb(p, q, hn + 1/3) * 255),
    Math.round(hue2rgb(p, q, hn)       * 255),
    Math.round(hue2rgb(p, q, hn - 1/3) * 255),
  ];
}

export function hexToRgb(hex: string): [number, number, number] | null {
  const m = hex.replace('#', '').match(/.{2}/g);
  if (!m || m.length < 3) return null;
  return [parseInt(m[0], 16), parseInt(m[1], 16), parseInt(m[2], 16)];
}

/**
 * Clamp an RGB triple so it works as subtle UI chrome.
 * - Saturation capped at 40% (muted, not screaming)
 * - Dark mode: lightness 18–30% (deep glow, won't wash out text)
 * - Light mode: lightness 48–62% (visible but soft on warm paper)
 */
export function clampAmbient(
  rgb: [number, number, number],
  isDark = true,
): [number, number, number] {
  const [h, s, l] = rgbToHsl(rgb[0], rgb[1], rgb[2]);
  const cs = Math.min(s, 0.40);
  const cl = isDark
    ? Math.max(0.18, Math.min(l, 0.30))
    : Math.max(0.48, Math.min(l, 0.62));
  return hslToRgb(h, cs, cl);
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
