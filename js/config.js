/* ─────────────────────────────────────────────────────────────
 * OpenShelf — Global configuration
 * Single source of truth for languages, currencies, themes, etc.
 * ───────────────────────────────────────────────────────────── */
const OPEN_SHELF = {
  name: 'OpenShelf',
  version: '2.0.0',
  repository: 'https://github.com/maliktr02/OpenShelf',
  license: 'MIT',
  creator: 'maliktr02',

  /* Interface (UI) languages. Each code maps to locales/<code>.js */
  uiLocales: [
    { code: 'en', name: 'English',        native: 'English' },
    { code: 'tr', name: 'Turkish',        native: 'Türkçe' },
    { code: 'de', name: 'German',         native: 'Deutsch' },
    { code: 'fr', name: 'French',         native: 'Français' },
    { code: 'es', name: 'Spanish',        native: 'Español' },
    { code: 'it', name: 'Italian',        native: 'Italiano' },
    { code: 'pt', name: 'Portuguese',     native: 'Português' },
    { code: 'ru', name: 'Russian',        native: 'Русский' },
    { code: 'ar', name: 'Arabic',         native: 'العربية', rtl: true },
    { code: 'fa', name: 'Persian',        native: 'فارسی',  rtl: true },
    { code: 'hi', name: 'Hindi',          native: 'हिन्दी' },
    { code: 'zh', name: 'Chinese',        native: '中文' },
    { code: 'ja', name: 'Japanese',       native: '日本語' },
    { code: 'ko', name: 'Korean',         native: '한국어' },
    { code: 'nl', name: 'Dutch',          native: 'Nederlands' },
    { code: 'pl', name: 'Polish',         native: 'Polski' },
    { code: 'uk', name: 'Ukrainian',      native: 'Українська' },
    { code: 'id', name: 'Indonesian',     native: 'Bahasa Indonesia' },
    { code: 'el', name: 'Greek',          native: 'Ελληνικά' },
    { code: 'sv', name: 'Swedish',        native: 'Svenska' }
  ],

  /* Literary / book languages (value stored on a book) */
  literaryLanguages: [
    'English', 'Turkish', 'German', 'French', 'Spanish', 'Italian',
    'Portuguese', 'Russian', 'Ukrainian', 'Arabic', 'Persian', 'Hebrew',
    'Hindi', 'Urdu', 'Bengali', 'Chinese', 'Japanese', 'Korean', 'Dutch',
    'Polish', 'Swedish', 'Norwegian', 'Danish', 'Finnish', 'Greek', 'Czech',
    'Romanian', 'Hungarian', 'Indonesian', 'Vietnamese', 'Thai', 'Latin',
    'Sanskrit', 'Ottoman Turkish', 'Azerbaijani', 'Kurdish', 'Armenian',
    'Georgian', 'Bulgarian', 'Serbian', 'Croatian'
  ],

  /* Currencies with symbol + fallback exchange rate relative to 1 USD.
   * Live rates replace these when the rate provider is reachable. */
  currencies: {
    USD: { symbol: '$',   rate: 1 },
    EUR: { symbol: '€',   rate: 0.92 },
    GBP: { symbol: '£',   rate: 0.79 },
    TRY: { symbol: '₺',   rate: 34.20 },
    JPY: { symbol: '¥',   rate: 151.0 },
    CNY: { symbol: '¥',   rate: 7.24 },
    RUB: { symbol: '₽',   rate: 92.50 },
    KRW: { symbol: '₩',   rate: 1345.0 },
    BRL: { symbol: 'R$',  rate: 5.05 },
    INR: { symbol: '₹',   rate: 83.30 },
    SEK: { symbol: 'kr',  rate: 10.45 },
    CHF: { symbol: 'Fr',  rate: 0.90 },
    CAD: { symbol: 'C$',  rate: 1.36 },
    AUD: { symbol: 'A$',  rate: 1.52 },
    PLN: { symbol: 'zł',  rate: 3.98 },
    MXN: { symbol: 'MX$', rate: 16.75 },
    ZAR: { symbol: 'R',   rate: 18.80 },
    AED: { symbol: 'د.إ', rate: 3.67 },
    SAR: { symbol: '﷼',   rate: 3.75 },
    NOK: { symbol: 'kr',  rate: 10.75 },
    DKK: { symbol: 'kr',  rate: 6.87 }
  },

  /* Accent presets shown in Settings */
  accentPresets: [
    '#6366f1', // indigo
    '#8b5cf6', // violet
    '#a855f7', // purple
    '#ec4899', // pink
    '#ef4444', // red
    '#f59e0b', // amber
    '#10b981', // emerald
    '#06b6d4', // cyan
    '#0ea5e9', // sky
    '#14b8a6'  // teal
  ],

  themes: ['light', 'dark', 'sepia', 'auto'],
  cardSizes: ['compact', 'normal', 'large'],
  densities: ['comfortable', 'compact'],
  fonts: ['sans', 'serif'],

  storageKeys: {
    books: 'openshelf.books',
    settings: 'openshelf.settings',
    handle: 'openshelf.dirHandle'
  }
};
window.OPEN_SHELF = OPEN_SHELF;
