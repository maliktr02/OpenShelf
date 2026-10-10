/* ─────────────────────────────────────────────────────────────
 * OpenShelf — I18N engine
 * Locales live in locales/<code>.js and self-register via
 * I18N.register(). English is embedded as the ultimate fallback
 * so the interface is never empty, even on a cold start or file://.
 * ───────────────────────────────────────────────────────────── */
class I18N {
  static currentLocale = 'en';
  static loaded = { en: true };
  static cache = {};

  /* Embedded English — the fallback dictionary. Must stay complete. */
  static en = {
    'app.tagline': 'Your local-first digital bookshelf',
    'nav.info': 'Info',
    'nav.stats': 'Statistics',
    'nav.settings': 'Settings',
    'search.placeholder': 'Search title, author, notes…',
    'filters.allAuthors': 'All authors',
    'filters.allLanguages': 'All languages',
    'filters.allRatings': 'All ratings',
    'filters.allPrices': 'Any price',
    'rating.5': '5 stars',
    'rating.4': '4+ stars',
    'rating.3': '3+ stars',
    'sort.newest': 'Newest first',
    'sort.oldest': 'Oldest first',
    'sort.titleAZ': 'Title A → Z',
    'sort.titleZA': 'Title Z → A',
    'sort.rating': 'Highest rated',
    'sort.pages': 'Most pages',
    'sort.price': 'Highest price',
    'view.grid': 'Cover grid',
    'view.shelf': 'Bookshelf',
    'view.list': 'List',
    'action.addBook': 'Add book',
    'action.editBook': 'Edit book',
    'action.delete': 'Delete',
    'action.close': 'Close',
    'action.cancel': 'Cancel',
    'action.save': 'Save',
    'action.saveBook': 'Save book',
    'action.addTranslation': 'Add translation',
    'action.remove': 'Remove',
    'action.uploadImage': 'Upload image',
    'action.clear': 'Clear',
    'action.export': 'Export',
    'action.import': 'Import',
    'action.connectFolder': 'Connect data folder',
    'action.disconnect': 'Disconnect',
    'action.reset': 'Reset defaults',
    'action.confirm': 'Confirm',
    'section.title': 'Title',
    'section.author': 'Author',
    'section.details': 'Book details',
    'section.additional': 'Additional information',
    'field.mainTitle': 'Main title',
    'field.translationLanguage': 'Language',
    'field.translationText': 'Translated title',
    'field.authorName': 'Author name',
    'field.birthYear': 'Birth year',
    'field.deathYear': 'Death year',
    'field.ethnicity': 'Ethnicity / nationality',
    'field.pageCount': 'Page count',
    'field.language': 'Literary language',
    'field.price': 'Price',
    'field.rating': 'Rating',
    'field.notes': 'Notes',
    'field.frontCover': 'Front cover',
    'field.spineCover': 'Spine / side view',
    'field.currency': 'Currency',
    'field.coverUrl': 'Image URL',
    'field.genre': 'Genre',
    'hint.optional': 'optional',
    'hint.required': 'required',
    'settings.title': 'Settings',
    'settings.appearance': 'Appearance',
    'settings.theme': 'Theme',
    'settings.themeLight': 'Light',
    'settings.themeDark': 'Dark',
    'settings.themeSepia': 'Sepia',
    'settings.themeAuto': 'Auto (system)',
    'settings.accent': 'Accent color',
    'settings.uiLanguage': 'Interface language',
    'settings.baseCurrency': 'Base currency',
    'settings.cardSize': 'Card size',
    'settings.sizeCompact': 'Compact',
    'settings.sizeNormal': 'Normal',
    'settings.sizeLarge': 'Large',
    'settings.density': 'Layout density',
    'settings.densityComfortable': 'Comfortable',
    'settings.densityCompact': 'Compact',
    'settings.animations': 'Animations',
    'settings.animationsOn': 'Enabled',
    'settings.animationsOff': 'Disabled',
    'settings.font': 'Typeface',
    'settings.fontSans': 'Modern sans',
    'settings.fontSerif': 'Classic serif',
    'settings.localization': 'Language & region',
    'settings.data': 'Data management',
    'settings.dataDescription': 'Your data never leaves this device. Back it up or move it freely.',
    'settings.exportData': 'Export backup',
    'settings.importData': 'Import backup',
    'settings.folder': 'Data folder',
    'settings.folderHint': 'Optionally sync books.json & settings.json to a folder on your disk (Chromium-based browsers).',
    'settings.folderConnected': 'Folder connected',
    'settings.disconnect': 'Disconnect',
    'settings.resetSettings': 'Reset all settings',
    'stats.title': 'Statistics',
    'stats.totalBooks': 'Books',
    'stats.totalPages': 'Pages',
    'stats.avgRating': 'Average rating',
    'stats.totalValue': 'Shelf value',
    'stats.topAuthor': 'Most collected author',
    'stats.topLanguage': 'Most common language',
    'stats.rated': 'Rated books',
    'stats.ratingDistribution': 'Rating distribution',
    'stats.languageDistribution': 'Language distribution',
    'stats.recent': 'Recently added',
    'stats.noData': 'No data yet',
    'info.about': 'About OpenShelf',
    'info.description': 'A local-first digital bookshelf application for cataloguing your personal library.',
    'info.developer': 'Developer',
    'info.version': 'Version',
    'info.license': 'License',
    'info.repository': 'Repository',
    'info.viewOnGitHub': 'View on GitHub',
    'info.privacy': 'Privacy',
    'info.privacyText': 'OpenShelf runs entirely in your browser. No account, no tracking, no server. Your library is stored locally on this device.',
    'info.tech': 'Built with vanilla HTML, CSS and JavaScript.',
    'empty.title': 'Your shelf is empty',
    'empty.subtitle': 'Add your first book to begin building your personal library.',
    'empty.cta': 'Add your first book',
    'toast.saved': 'Book saved',
    'toast.deleted': 'Book deleted',
    'toast.imported': 'Backup imported successfully',
    'toast.importFailed': 'Import failed — invalid backup file',
    'toast.exported': 'Backup exported',
    'toast.folderConnected': 'Data folder connected',
    'toast.folderDisconnected': 'Data folder disconnected',
    'toast.folderError': 'Could not access the folder',
    'toast.settingsSaved': 'Settings saved',
    'toast.reset': 'Settings reset to defaults',
    'confirm.deleteTitle': 'Delete book',
    'confirm.deleteText': 'This book will be permanently removed from your shelf.',
    'unit.pages': 'pages',
    'unit.results': 'results',
    'unit.noRating': 'Not rated',
    'book.by': 'by',
    'book.titles': 'Titles'
  };

  static register(code, dict) {
    this.cache[code] = { ...(this.cache[code] || {}), ...dict };
    this.loaded[code] = true;
  }

  /* Dynamically load locales/<code>.js via a <script> tag.
   * Script tags work over file:// where fetch() would be blocked. */
  static loadLocale(code) {
    return new Promise((resolve) => {
      if (this.loaded[code]) return resolve(true);
      const script = document.createElement('script');
      script.src = `locales/${code}.js`;
      script.onload = () => {
        this.loaded[code] = true;
        resolve(true);
      };
      script.onerror = () => {
        console.warn(`OpenShelf: locale "${code}" could not be loaded, falling back to English.`);
        resolve(false);
      };
      document.head.appendChild(script);
    });
  }

  static async setLocale(code) {
    const supported = OPEN_SHELF.uiLocales.some((l) => l.code === code);
    if (!supported) code = 'en';
    await this.loadLocale(code);
    this.currentLocale = code;
    this.apply();
  }

  static t(key) {
    const dict = this.cache[this.currentLocale];
    if (dict && dict[key] !== undefined) return dict[key];
    if (this.en[key] !== undefined) return this.en[key];
    return key;
  }

  static localeMeta(code = this.currentLocale) {
    return OPEN_SHELF.uiLocales.find((l) => l.code === code) || { code, native: code, rtl: false };
  }

  static formatDate(date) {
    try {
      return new Intl.DateTimeFormat(this.currentLocale, {
        weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
      }).format(date);
    } catch (e) { return date.toLocaleDateString(); }
  }

  static formatTime(date) {
    try {
      return new Intl.DateTimeFormat(this.currentLocale, { hour: '2-digit', minute: '2-digit' }).format(date);
    } catch (e) { return date.toLocaleTimeString(); }
  }

  static formatNumber(n, opts) {
    try { return new Intl.NumberFormat(this.currentLocale, opts).format(n); }
    catch (e) { return String(n); }
  }

  static apply(root = document) {
    root.querySelectorAll('[data-i18n]').forEach((el) => {
      el.textContent = this.t(el.getAttribute('data-i18n'));
    });
    root.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
      el.placeholder = this.t(el.getAttribute('data-i18n-placeholder'));
    });
    root.querySelectorAll('[data-i18n-title]').forEach((el) => {
      el.title = this.t(el.getAttribute('data-i18n-title'));
    });
    root.querySelectorAll('[data-i18n-aria]').forEach((el) => {
      el.setAttribute('aria-label', this.t(el.getAttribute('data-i18n-aria')));
    });
    const meta = this.localeMeta();
    document.documentElement.setAttribute('lang', meta.code);
    document.documentElement.setAttribute('dir', meta.rtl ? 'rtl' : 'ltr');
  }
}
window.I18N = I18N;

/* English is embedded above as the fallback; register it so every
 * locale (including 'en') resolves through the same dictionary path. */
I18N.register('en', I18N.en);
