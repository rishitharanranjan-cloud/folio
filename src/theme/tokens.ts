// ─────────────────────────────────────────────────────────────────────────────
// Nordic Frost — cool, dark, precise, exploratory (the map)
// ─────────────────────────────────────────────────────────────────────────────
export const dark = {
  // Surfaces — each level is lighter than the one below
  bg:       '#0D1418',   // Midnight Fjord   — deepest app background
  bg2:      '#152027',   // Slate Ice         — cards, panels
  bg3:      '#1C2A32',   // Deep Glacier      — raised surfaces (filters, headers)
  bg4:      '#243440',   // Elevated          — modals, sheets, tooltips

  // Borders
  border:   '#2B3A42',   // Ice Line          — hairline separators
  border2:  '#3A4E58',   // Visible separator — explicit dividers, chip outlines

  // Text
  ink:      '#EAF0F2',   // Frost Paper       — primary text
  ink2:     '#9AA8AE',   // Mist Grey         — secondary text, metadata
  ink3:     '#607880',   // Deep Fjord        — tertiary, labels, placeholders

  // Accents
  accent:   '#6FAFC3',   // Arctic Blue       — active states, progress, route lines
  accentd:  '#3F7288',   // Fjord Blue        — primary buttons, strong selected states
  accentg:  'rgba(111,175,195,0.10)',          // Arctic Blue glass (tinted fills)
  accentt:  '#0D1418',   // text on accent backgrounds
  accent2:  '#8CA59B',   // Lichen Sage       — calm secondary accent

  // Semantic
  editorial:'#C8A86A',   // Pale Gold         — rare highlights, badges, streaks
  terra:    '#C05030',   // danger / destructive
  streak:   '#8CA59B',   // Lichen Sage       — success, streaks, completion
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Vintage Archive — warm, light, tactile, timeless (the archive)
// ─────────────────────────────────────────────────────────────────────────────
export const light = {
  // Surfaces — cards LIGHTER than background (catalogue cards on archive paper)
  bg:       '#F3EADB',   // Archive Paper     — main app background (slightly worn)
  bg2:      '#FBF6EC',   // Warm Page         — cards, panels (fresh page, lighter)
  bg3:      '#E7D9C7',   // Dust Linen        — secondary panels, raised surfaces
  bg4:      '#D6C5B1',   // Paper Edge        — elevated modals, sheets

  // Borders
  border:   '#D6C5B1',   // Paper Edge        — hairline separators
  border2:  '#C0A888',   // Visible separator — chip outlines, explicit dividers

  // Text
  ink:      '#2B211C',   // Ink Brown         — primary text
  ink2:     '#6E5A4C',   // Faded Umber       — secondary text, metadata
  ink3:     '#8A7060',   // Warm tertiary     — labels, placeholders

  // Accents
  accent:   '#B5602D',   // Burnt Orange      — CTAs, active states, action accents
  accentd:  '#6B1F28',   // Tamarind Maroon   — pressed states, archive identity
  accentg:  'rgba(181,96,45,0.12)',            // Burnt Orange glass
  accentt:  '#FBF6EC',   // text on accent backgrounds (Warm Page)
  accent2:  '#A06C63',   // Dried Rose        — secondary warm accent

  // Semantic
  editorial:'#C89135',   // Saffron Gold      — rare highlights, badges
  terra:    '#8A3018',   // Deep Burnt        — danger / destructive
  streak:   '#4A7A58',   // Muted Sage        — success, streaks, completion
} as const;

export type Theme = { [K in keyof typeof dark]: string };
export type ThemeMode = 'dark' | 'light';

// Theme display names
export const THEME_NAMES: Record<ThemeMode, string> = {
  dark:  'Nordic Frost',
  light: 'Vintage Archive',
};

export const THEME_DESCRIPTIONS: Record<ThemeMode, string> = {
  dark:  'Map mode. Cool and precise.',
  light: 'Archive mode. Warm and timeless.',
};

// ─────────────────────────────────────────────────────────────────────────────
// Folio Code Mark — multi-colour token sets per theme
// Used by FolioCodeMark component; also handy for one-off usage.
// ─────────────────────────────────────────────────────────────────────────────
export const FOLIO_CODE_COLOURS: Record<ThemeMode, {
  blocks: string;
  bar: string;
  dot: string;
}> = {
  dark: {
    blocks: '#EAF0F2',   // Frost Paper
    bar:    '#6FAFC3',   // Arctic Blue
    dot:    '#C8A86A',   // Pale Gold
  },
  light: {
    blocks: '#E7D9C7',   // Dust Linen
    bar:    '#6B1F28',   // Tamarind Maroon
    dot:    '#B5602D',   // Burnt Orange
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Typography
// ─────────────────────────────────────────────────────────────────────────────
//
//  display   — Bebas Neue        Nordic Frost screen titles, large stats, section
//                                headers, shelf labels. Never below 18px. Never
//                                for body copy. Bebas suits NF's cold precision.
//
//  brand     — Fraunces Roman    The `folio.` wordmark, Vintage Archive display
//                                headings, emotional/quote/share-card moments.
//                                Use instead of `display` when mode === 'light'
//                                for large headings, or in any brand moment.
//
//  body      — Fraunces Italic   Pull quotes, review excerpts, onboarding narrative,
//                                empty-state descriptions. NOT for inputs/buttons.
//
//  bodyRoman — Fraunces Roman    Long body copy in reviews (>2 lines), trail
//                                descriptions, item synopses.
//
//  mono      — Space Mono        Metadata labels, timestamps, handles, chip labels,
//                                nav labels, rating text, counts. Always uppercase,
//                                always letterSpacing ≥ 1.5. Never multi-line.
//
//  ui        — Inter Regular     Form inputs, search bar, settings rows, all
//                                interactive controls. Invisible by design.
//
//  uiMedium  — Inter Medium      Emphasized UI: active tab labels, primary CTA copy.
//
// Split display convention:
//   const headingFont = mode === 'dark' ? fonts.display : fonts.brand;
// Use this pattern in screens where the big heading should be Bebas (NF) or
// Fraunces (VA). Don't apply the split everywhere — only for top-level hero
// headings and the folio. wordmark.

export const fonts = {
  display:   'BebasNeue_400Regular',
  brand:     'Fraunces_400Regular',      // wordmark + VA display + emotional moments
  body:      'Fraunces_400Regular_Italic',
  bodyRoman: 'Fraunces_400Regular',
  mono:      'SpaceMono_400Regular',
  ui:        'Inter_400Regular',
  uiMedium:  'Inter_500Medium',
} as const;
