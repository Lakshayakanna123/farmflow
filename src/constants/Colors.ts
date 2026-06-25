/**
 * COLOR PSYCHOLOGY — FARMFLOW
 *
 * 🟢 Forest Green   → Trust, nature, growth, "go" — primary actions & completed states
 * 🟡 Warm Gold      → Energy, optimism, warmth — progress highlights & accents
 * 🔴 Deep Crimson   → Danger, urgency, stop — ONLY for destructive/critical items
 * 🔵 Slate Blue     → Calm, professionalism, information — info states & secondary
 * 🟤 Warm Ivory     → Stability, earthiness, clarity — backgrounds & surfaces
 * ⚫ Rich Charcoal  → Authority, readability, premium — primary text
 */

// ─── LIGHT MODE ──────────────────────────────────────────────────────────────
export const Colors = {
  // Brand Identity — Forest Green (Trust, Nature, Growth)
  primary:         '#2D5A27',   // Deep forest green — authority, confidence
  primaryMid:      '#3E7B35',   // Mid green — hover & active
  primaryLight:    '#6AAF5E',   // Soft green — borders, icons
  primaryGlow:     '#EAF4E8',   // Pale green — tinted backgrounds, success badges
  secondary:       '#1A4A7A',   // Deep navy — secondary brand color

  // Warm Gold (Energy, Warmth, Harvest)
  accent:          '#C8860A',   // Warm gold — highlights, progress rings, stars
  accentLight:     '#FFF6E0',   // Pale amber — warning backgrounds

  // Surfaces — Warm Ivory (Clarity, Earthy)
  background:      '#F9F7F3',   // Warm ivory — main background
  backgroundAlt:   '#F1EDE4',   // Slightly deeper — section separators
  card:            '#FFFFFF',   // Pure white cards — cleanliness
  cardBorder:      'rgba(45,90,39,0.08)',

  // Text — Rich Charcoal (Premium Readability)
  text:            '#1A1F1A',   // Near black with green undertone
  textSecondary:   '#5C6B5C',   // Muted forest gray-green
  textMuted:       '#9AAD98',   // Very muted — timestamps, labels

  // Semantic States
  success:         '#2D5A27',   // Same as primary — farm identity
  successLight:    '#EAF4E8',

  warning:         '#C8860A',   // Warm gold-amber — caution (not alarm)
  warningLight:    '#FFF6E0',

  danger:          '#9B1C1C',   // Deep crimson — destructive actions ONLY
  dangerMid:       '#C62828',   // Mid red for icons
  dangerLight:     '#FEECEC',

  info:            '#1A4A7A',   // Deep navy — informational, calm
  infoLight:       '#E8F0FC',

  // Special UI
  overlay:         'rgba(26,31,26,0.55)',
  tabBar:          '#FFFFFF',
  tabBorder:       'rgba(45,90,39,0.06)',
  inputBg:         '#F4F1EB',
  divider:         'rgba(45,90,39,0.07)',
};

// ─── DARK MODE ────────────────────────────────────────────────────────────────
export const DarkColors = {
  // Brand — vibrant on dark for accessibility
  primary:         '#5DB85D',   // Bright sage green — readable on dark
  primaryMid:      '#4CA14C',
  primaryLight:    '#2D5A27',
  primaryGlow:     'rgba(93,184,93,0.12)',
  secondary:       '#5DB8D8',   // Bright cyan — secondary on dark

  // Gold — warm and punchy on dark
  accent:          '#F0A830',
  accentLight:     'rgba(240,168,48,0.12)',

  // Surfaces — Deep forest dark
  background:      '#0F1A0F',   // Very deep forest — grounding, premium
  backgroundAlt:   '#162016',
  card:            '#1A2B1A',   // Dark forest card
  cardBorder:      'rgba(93,184,93,0.10)',

  // Text — Pale warm white
  text:            '#ECF5EC',   // Pale green-white — high contrast
  textSecondary:   '#7CB87C',   // Soft sage — secondary info
  textMuted:       '#4A7A4A',   // Deep muted green

  // Semantic
  success:         '#5DB85D',
  successLight:    'rgba(93,184,93,0.12)',

  warning:         '#F0A830',
  warningLight:    'rgba(240,168,48,0.12)',

  danger:          '#EF5350',
  dangerMid:       '#EF5350',
  dangerLight:     'rgba(239,83,80,0.12)',

  info:            '#64B5F6',
  infoLight:       'rgba(100,181,246,0.12)',

  overlay:         'rgba(0,0,0,0.70)',
  tabBar:          '#1A2B1A',
  tabBorder:       'rgba(93,184,93,0.08)',
  inputBg:         '#162016',
  divider:         'rgba(93,184,93,0.08)',
};

export type ThemeColors = typeof Colors;
