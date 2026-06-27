// ── Nordic Frost — cool, precise, exploratory (like a map) ───────────────────
export const dark = {
  // Surfaces
  bg:       '#040c18',   // Midnight Fjord — deepest background
  bg2:      '#0a1a2e',   // Slate Ice — surface / cards
  bg3:      '#122440',   // Deep Glacier — raised surface
  bg4:      '#1a2e50',   // Frost Paper — elevated (modals, sheets)
  // Borders
  border:   '#1a2e50',   // Mist Grey — hairline separator
  border2:  '#243e64',   // Arctic Blue — visible separator
  // Text
  ink:      '#d8eaf8',   // Ice line — primary text (near-white, blue cast)
  ink2:     '#88aacc',   // Fjord mist — secondary text
  ink3:     '#486888',   // Deep fjord — tertiary / labels
  // Accents
  accent:   '#4a90d4',   // Arctic Blue — primary interactive
  accentd:  '#2e70b4',   // accent pressed
  accentg:  'rgba(74,144,212,0.10)',
  accentt:  '#020810',   // text on accent
  editorial:'#c8a050',   // Pale Gold — editorial warmth
  terra:    '#c0502a',   // danger / destructive
  streak:   '#58a87a',   // Lichen Sage — streak / success
} as const;

// ── Vintage Archive — warm, tactile, timeless (like an archive) ──────────────
export const light = {
  // Surfaces
  bg:       '#f0e6d2',   // Archive Paper — warmest background
  bg2:      '#e6d4b4',   // Warm Page — surface / cards
  bg3:      '#d8be96',   // Dust Linen — raised surface
  bg4:      '#c8a878',   // worn card — elevated (modals, sheets)
  // Borders
  border:   '#bca070',   // Faded Umber — hairline separator
  border2:  '#906040',   // rich brown — visible separator
  // Text
  ink:      '#180e08',   // Ink Brown — primary text
  ink2:     '#402818',   // Faded Umber — secondary text
  ink3:     '#6a4828',   // warm tertiary / labels
  // Accents
  accent:   '#8a2818',   // Tamarind Maroon — primary interactive
  accentd:  '#6a1008',   // accent pressed
  accentg:  'rgba(138,40,24,0.12)',
  accentt:  '#f0e6d2',   // text on accent
  editorial:'#a87018',   // Saffron Gold — editorial warmth
  terra:    '#c06030',   // Burnt Orange — danger / destructive
  streak:   '#3a8a58',   // muted sage — streak / success
} as const;

export type Theme = { [K in keyof typeof dark]: string };
export type ThemeMode = 'dark' | 'light';

// Theme display names
export const THEME_NAMES: Record<ThemeMode, string> = {
  dark:  'Nordic Frost',
  light: 'Vintage Archive',
};

// ── Type roles ────────────────────────────────────────────────────────────────
//
//  display   — Bebas Neue         Screen titles, large stats, section headers,
//                                  milestone numbers, trail names at hero size.
//                                  Never below 18px. Never for body copy.
//
//  body      — Fraunces Italic    Pull quotes, review excerpts, bio text,
//                                  empty-state descriptions, onboarding narrative.
//                                  NOT for inputs, buttons, or dense lists.
//
//  bodyRoman — Fraunces Roman     Body copy in reviews (>2 lines), long
//                                  descriptions, trail context paragraphs.
//
//  mono      — Space Mono         Metadata labels, timestamps, handles, chip
//                                  labels, nav labels, rating text, counts.
//                                  Always uppercase, always letterSpacing ≥ 1.5.
//                                  Never for text longer than one line.
//
//  ui        — Inter Regular      Form inputs, search bar, button labels,
//                                  settings rows, all interactive controls.
//                                  Invisible by design — neutral container.
//
//  uiMedium  — Inter Medium       Emphasized UI text: active button labels,
//                                  tab labels, primary CTA copy.

export const fonts = {
  display:   'BebasNeue_400Regular',
  body:      'Fraunces_400Regular_Italic',
  bodyRoman: 'Fraunces_400Regular',
  mono:      'SpaceMono_400Regular',
  ui:        'Inter_400Regular',
  uiMedium:  'Inter_500Medium',
} as const;
