/* ─────────────────────────────────────────────────────────────
 * OpenShelf — App controller
 * Wires the DOM, modals, the book form, settings and data tools.
 * ───────────────────────────────────────────────────────────── */
const App = {
  editingId: null,

  async start() {
    this.cacheDom();
    this.paintLoader();
    this.setLoaderProgress(6, 'loading.interface');
    this.buildStaticSelects();
    this.bindGlobal();
    this.bindToolbar();
    this.bindBookForm();
    this.bindQuoteCard();
    this.bindSettings();
    this.bindLanguageControl();
    this.bindDataTools();
    this.setLoaderProgress(24, 'loading.library');

    this.startClock();
    await UI.init();
    this.updateLanguageControl();
    this.setLoaderProgress(80, 'loading.finishing');
    this.bindShelf();

    if (window.lucide) lucide.createIcons();
    this.setLoaderProgress(100, 'loading.ready');
    this.dismissLoader();

    // React to OS theme changes when "auto" is selected.
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (UI.settings.theme === 'auto') UI.applySettings();
    });
  },

  cacheDom() {
    this.shelf = document.getElementById('shelf');
  },

  /* ── Startup ── */
  paintLoader() {
    const v = document.getElementById('startupVersion');
    if (v && window.Version) v.textContent = Version.label();
    this.setLoaderProgress(3);
  },

  setLoaderProgress(pct, key) {
    const bar = document.getElementById('startupBar');
    const pctEl = document.getElementById('startupPct');
    const taskEl = document.getElementById('startupTask');
    if (bar) bar.style.width = `${pct}%`;
    if (pctEl) pctEl.textContent = `${Math.round(pct)}%`;
    if (taskEl && key) taskEl.textContent = I18N.t(key);
  },

  dismissLoader() {
    const loader = document.getElementById('startupLoader');
    if (!loader) return;
    const hide = () => {
      loader.classList.add('done');
      document.body.classList.add('ready');
      setTimeout(() => loader.remove(), 800);
    };
    if (document.readyState === 'complete') setTimeout(hide, 550);
    else window.addEventListener('load', () => setTimeout(hide, 550), { once: true });
  },

  /* ── Clock ── */
  startClock() {
    const tick = () => {
      const now = new Date();
      const d = document.getElementById('clockDate');
      const t = document.getElementById('clockTime');
      if (d) d.textContent = I18N.formatDate(now);
      if (t) t.textContent = I18N.formatTime(now);
    };
    tick();
    setInterval(tick, 15000);
  },

  /* ── Selects built from config ── */
  buildStaticSelects() {
    const langSel = document.getElementById('language');
    if (langSel) {
      langSel.innerHTML = `<option value=""></option>` +
        OPEN_SHELF.literaryLanguages.map((l) => `<option value="${UI.esc(l)}">${UI.esc(l)}</option>`).join('');
    }
    const curOptions = Object.keys(OPEN_SHELF.currencies)
      .map((c) => `<option value="${c}">${c}</option>`).join('');
    ['priceCurrency', 'baseCurrencySelect'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = curOptions;
    });
    const priceFilter = document.getElementById('filterPrice');
    if (priceFilter) {
      priceFilter.innerHTML = `
        <option value="">${I18N.t('filters.allPrices')}</option>
        <option value="0-10">$0 – $10</option>
        <option value="10-25">$10 – $25</option>
        <option value="25-50">$25 – $50</option>
        <option value="50-100">$50 – $100</option>
        <option value="100-0">$100 +</option>`;
    }
  },

  /* ── Global bindings ── */
  bindGlobal() {
    document.querySelectorAll('[data-close]').forEach((btn) => {
      btn.addEventListener('click', () => this.closeModal(btn.closest('.modal')));
    });
    document.querySelectorAll('.modal').forEach((modal) => {
      modal.addEventListener('mousedown', (e) => { if (e.target === modal) this.closeModal(modal); });
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') document.querySelectorAll('.modal.open').forEach((m) => this.closeModal(m));
      if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
        e.preventDefault();
        document.getElementById('searchInput')?.focus();
      }
    });
  },

  /* ── Modals ── */
  openModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.add('open');
    if (window.lucide) lucide.createIcons();
  },
  closeModal(modal) {
    if (!modal) return;
    modal.classList.remove('open');
    if (modal.id === 'bookModal') this.editingId = null;
  },

  /* ── Toast ── */
  toast(message, type = 'success') {
    const host = document.getElementById('toastHost');
    if (!host) return;
    const icon = type === 'error' ? 'alert-triangle' : 'check-circle-2';
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.innerHTML = `<i data-lucide="${icon}"></i><span>${UI.esc(message)}</span>`;
    host.appendChild(el);
    if (window.lucide) lucide.createIcons();
    requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 300); }, 3200);
  },

  /* ── Confirm dialog ── */
  confirm(text, title) {
    return new Promise((resolve) => {
      const modal = document.getElementById('confirmModal');
      document.getElementById('confirmTitle').textContent = title || I18N.t('confirm.deleteTitle');
      document.getElementById('confirmText').textContent = text || '';
      const ok = document.getElementById('confirmOk');
      const cancel = document.getElementById('confirmCancel');
      const done = (val) => { this.closeModal(modal); ok.removeEventListener('click', onOk); cancel.removeEventListener('click', onCancel); resolve(val); };
      const onOk = () => done(true);
      const onCancel = () => done(false);
      document.getElementById('confirmOkLabel').textContent = I18N.t('action.confirm');
      document.getElementById('confirmCancelLabel').textContent = I18N.t('action.cancel');
      ok.addEventListener('click', onOk);
      cancel.addEventListener('click', onCancel);
      this.openModal('confirmModal');
    });
  },

  /* ── Info panel (driven entirely by version.js) ── */
  openInfo() {
    const m = OPEN_SHELF;
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    set('infoDeveloper', m.creator);
    set('infoVersion', m.version);
    set('infoCodename', m.codename);
    set('infoReleased', m.releaseDate);
    set('infoLicense', m.license);
    const link = document.getElementById('infoRepoLink');
    if (link) { link.href = m.repository; link.textContent = m.repositoryLabel; }
    const btn = document.getElementById('infoRepoBtn');
    if (btn) btn.href = m.repository;
    const cl = document.getElementById('infoChangelog');
    if (cl) {
      cl.innerHTML = (m.changelog || []).slice(0, 2).map((rel) => `
        <div class="changelog-entry">
          <div class="changelog-head">
            <strong>v${UI.esc(rel.version)}</strong>
            <span class="muted">${UI.esc(rel.codename || '')} · ${UI.esc(rel.date)}</span>
          </div>
          <ul>${(rel.changes || []).map((c) => `<li>${UI.esc(c)}</li>`).join('')}</ul>
        </div>`).join('');
    }
    this.openModal('infoModal');
  },

  /* ── Interface-language picker (with flags) ── */
  buildLanguageMenu() {
    const menu = document.getElementById('uiLangMenu');
    if (!menu) return;
    menu.innerHTML = OPEN_SHELF.uiLocales.map((l) => `
      <button type="button" class="lang-option${l.code === UI.settings.uiLang ? ' active' : ''}" role="option" data-code="${l.code}">
        <span class="lang-flag">${l.flag || ''}</span>
        <span class="lang-opt-native">${UI.esc(l.native)}</span>
        <span class="lang-opt-name">${UI.esc(l.name)}</span>
      </button>`).join('');
    menu.querySelectorAll('.lang-option').forEach((btn) => {
      btn.addEventListener('click', () => this.selectLanguage(btn.dataset.code));
    });
  },

  updateLanguageControl() {
    const meta = I18N.localeMeta();
    const flag = document.getElementById('uiLangFlag');
    const cur = document.getElementById('uiLangCurrent');
    const trigger = document.getElementById('uiLangTrigger');
    if (flag) flag.innerHTML = meta.flag || '';
    if (cur) cur.textContent = meta.native;
    if (trigger) trigger.setAttribute('aria-expanded', 'false');
    this.buildLanguageMenu();
  },

  bindLanguageControl() {
    const trigger = document.getElementById('uiLangTrigger');
    const control = document.getElementById('uiLanguageControl');
    if (!trigger || !control) return;
    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = control.classList.toggle('open');
      trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.addEventListener('click', (e) => {
      if (!control.contains(e.target)) {
        control.classList.remove('open');
        trigger.setAttribute('aria-expanded', 'false');
      }
    });
    this.updateLanguageControl();
  },

  async selectLanguage(code) {
    const control = document.getElementById('uiLanguageControl');
    if (control) control.classList.remove('open');
    UI.settings.uiLang = code;
    Store.saveSettings(UI.settings);
    await I18N.setLocale(code);
    this.buildStaticSelects();
    this.updateLanguageControl();
    UI.refresh();
    this.renderAccentSwatches();
  },

  /* ── Toolbar ── */
  bindToolbar() {
    document.getElementById('infoBtn').addEventListener('click', () => this.openInfo());
    document.getElementById('statsBtn').addEventListener('click', () => UI.showStats());
    document.getElementById('settingsBtn').addEventListener('click', () => this.openSettings());
    document.getElementById('addBookBtn').addEventListener('click', () => this.openBookModal());
    document.getElementById('emptyAddBtn').addEventListener('click', () => this.openBookModal());

    document.querySelectorAll('.view-btn').forEach((btn) => {
      btn.addEventListener('click', () => UI.setView(btn.dataset.view));
    });
    // restore the persisted view
    document.querySelectorAll('.view-btn').forEach((b) => b.classList.toggle('active', b.dataset.view === (UI.settings.view || 'grid')));

    const search = document.getElementById('searchInput');
    search.addEventListener('input', () => UI.onFiltersChanged());
    ['filterAuthor', 'filterLang', 'filterSeries', 'filterTag', 'filterRating', 'filterPrice', 'sortData'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('change', () => UI.onFiltersChanged());
    });
    document.getElementById('clearFiltersBtn')?.addEventListener('click', () => UI.clearFilters());
  },

  /* ── Shelf interaction ── */
  bindShelf() {
    this.shelf.addEventListener('click', async (e) => {
      const row = e.target.closest('[data-id]');
      if (!row) return;
      const id = row.dataset.id;
      if (e.target.closest('.delete-btn')) return this.deleteBook(id);
      if (e.target.closest('.quote-btn')) return this.openQuoteCard(id);
      if (e.target.closest('.edit-btn')) return this.openBookModal(id);
      const book = UI.books.find((b) => b.id === id);
      if (book) this.openBookModal(id); // spines/rows/series open editor on click
    });
    // stats modal recent items open the book too
    document.getElementById('statsContainer').addEventListener('click', (e) => {
      const item = e.target.closest('.recent-item');
      if (item) { this.closeModal(document.getElementById('statsModal')); this.openBookModal(item.dataset.id); }
    });
  },

  async deleteBook(id) {
    const ok = await this.confirm(I18N.t('confirm.deleteText'), I18N.t('confirm.deleteTitle'));
    if (!ok) return;
    UI.books = UI.books.filter((b) => b.id !== id);
    Store.saveBooks(UI.books);
    UI.populateFilters();
    UI.displayBooks();
    this.toast(I18N.t('toast.deleted'));
    await Store.DataFolder.save(UI.books, UI.settings).catch(() => {});
  },

  /* ── Book form ── */
  bindBookForm() {
    const form = document.getElementById('bookForm');
    document.getElementById('addTranslationBtn').addEventListener('click', () => this.addTranslationRow());
    document.getElementById('addQuoteBtn').addEventListener('click', () => this.addQuoteRow());
    document.getElementById('exportBookMdBtn').addEventListener('click', () => this.exportCurrentBookMd());

    // star rating
    const stars = document.getElementById('starRatingInput');
    stars.addEventListener('click', (e) => {
      const star = e.target.closest('[data-val]');
      if (star) this.setStars(parseInt(star.dataset.val));
    });
    stars.addEventListener('mousemove', (e) => {
      const star = e.target.closest('[data-val]');
      if (star) this.setStars(parseInt(star.dataset.val), true);
    });
    stars.addEventListener('mouseleave', () => this.setStars(parseInt(document.getElementById('rating').value) || 0, true));

    // image pickers
    this.bindImageField('front');
    this.bindImageField('spine');

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveBook();
    });
  },

  bindImageField(which) {
    const input = document.getElementById(which === 'front' ? 'photoFront' : 'photoSpine');
    const file = document.getElementById(which === 'front' ? 'photoFrontFile' : 'photoSpineFile');
    const pick = document.getElementById(which === 'front' ? 'photoFrontPick' : 'photoSpinePick');
    const clear = document.getElementById(which === 'front' ? 'photoFrontClear' : 'photoSpineClear');
    const preview = document.getElementById(which === 'front' ? 'photoFrontPreview' : 'photoSpinePreview');
    const sync = () => {
      const v = input.value.trim();
      if (v) { preview.src = v; preview.classList.remove('hidden'); } else preview.classList.add('hidden');
    };
    pick.addEventListener('click', () => file.click());
    file.addEventListener('change', () => {
      const f = file.files && file.files[0];
      if (!f) return;
      const reader = new FileReader();
      reader.onload = (ev) => { input.value = ev.target.result; sync(); };
      reader.readAsDataURL(f);
      file.value = '';
    });
    clear.addEventListener('click', () => { input.value = ''; sync(); });
    input.addEventListener('input', sync);
  },

  addTranslationRow(lang = '', text = '') {
    const container = document.getElementById('translationsContainer');
    const row = document.createElement('div');
    row.className = 'translation-row';
    row.innerHTML = `
      <div class="select-wrapper">
        <select class="trans-lang">${OPEN_SHELF.literaryLanguages
          .map((l) => `<option value="${UI.esc(l)}"${l === lang ? ' selected' : ''}>${UI.esc(l)}</option>`).join('')}</select>
        <i data-lucide="chevron-down"></i>
      </div>
      <input type="text" class="trans-val" value="${UI.esc(text)}" placeholder="${UI.esc(I18N.t('field.translationText'))}">
      <button type="button" class="icon-btn remove-trans" title="${UI.esc(I18N.t('action.remove'))}"><i data-lucide="x"></i></button>`;
    container.appendChild(row);
    if (window.lucide) lucide.createIcons();
    row.querySelector('.remove-trans').addEventListener('click', () => row.remove());
  },

  addQuoteRow(text = '') {
    const container = document.getElementById('quotesContainer');
    const row = document.createElement('div');
    row.className = 'quote-row';
    row.innerHTML = `
      <span class="quote-row-icon"><i data-lucide="quote"></i></span>
      <textarea class="quote-val" rows="2" placeholder="${UI.esc(I18N.t('field.quoteText'))}">${UI.esc(text)}</textarea>
      <button type="button" class="icon-btn remove-quote" title="${UI.esc(I18N.t('action.remove'))}"><i data-lucide="x"></i></button>`;
    container.appendChild(row);
    if (window.lucide) lucide.createIcons();
    row.querySelector('.remove-quote').addEventListener('click', () => row.remove());
  },

  setStars(val, preview = false) {
    if (!preview) document.getElementById('rating').value = val;
    document.querySelectorAll('#starRatingInput .star-icon').forEach((s) => {
      s.classList.toggle('on', parseInt(s.dataset.val) <= val);
    });
  },

  openBookModal(id = null) {
    const form = document.getElementById('bookForm');
    form.reset();
    document.getElementById('translationsContainer').innerHTML = '';
    document.getElementById('quotesContainer').innerHTML = '';
    document.getElementById('rating').value = '0';
    this.setStars(0, true);
    ['photoFrontPreview', 'photoSpinePreview'].forEach((p) => document.getElementById(p)?.classList.add('hidden'));
    this.editingId = id;
    document.getElementById('modalTitle').textContent = id ? I18N.t('action.editBook') : I18N.t('action.addBook');
    // series name suggestions
    const dl = document.getElementById('seriesList');
    if (dl) {
      const names = [...new Set(UI.books.filter((b) => b.hasSeries).map((b) => b.series.name))];
      dl.innerHTML = names.map((n) => `<option value="${UI.esc(n)}"></option>`).join('');
    }
    // only offer Markdown export for an existing (saved) book
    const mdBtn = document.getElementById('exportBookMdBtn');
    if (mdBtn) mdBtn.classList.toggle('hidden', !id);

    if (id) {
      const book = UI.books.find((b) => b.id === id);
      if (book) {
        document.getElementById('titleMain').value = book.title.main;
        Object.entries(book.title.translations).forEach(([l, t]) => this.addTranslationRow(l, t));
        document.getElementById('authorName').value = book.author.name;
        document.getElementById('authorBirthYear').value = book.author.birthYear;
        document.getElementById('authorDeathYear').value = book.author.deathYear;
        document.getElementById('authorEthnicity').value = book.author.ethnicity;
        document.getElementById('pageCount').value = book.pageCount || '';
        document.getElementById('language').value = book.language || '';
        document.getElementById('genre').value = book.genre || '';
        document.getElementById('seriesName').value = book.series.name || '';
        document.getElementById('seriesVolume').value = book.series.volume || '';
        document.getElementById('tags').value = book.tags.join(', ');
        book.quotes.forEach((q) => this.addQuoteRow(q));
        document.getElementById('priceAmount').value = book.price.amount || '';
        document.getElementById('priceCurrency').value = book.price.currency || 'USD';
        document.getElementById('notes').value = book.notes || '';
        document.getElementById('photoFront').value = book.photos.front || '';
        document.getElementById('photoSpine').value = book.photos.spine || '';
        this.setStars(book.rating, true);
        document.getElementById('rating').value = book.rating;
        ['front', 'spine'].forEach((w) => {
          const inp = document.getElementById(w === 'front' ? 'photoFront' : 'photoSpine');
          const prev = document.getElementById(w === 'front' ? 'photoFrontPreview' : 'photoSpinePreview');
          if (inp.value) { prev.src = inp.value; prev.classList.remove('hidden'); }
        });
      }
    }
    this.openModal('bookModal');
    setTimeout(() => document.getElementById('titleMain').focus(), 50);
  },

  saveBook() {
    const translations = {};
    document.querySelectorAll('.translation-row').forEach((row) => {
      const lang = row.querySelector('.trans-lang')?.value?.trim();
      const val = row.querySelector('.trans-val')?.value?.trim();
      if (lang && val) translations[lang] = val;
    });
    const quotes = [...document.querySelectorAll('.quote-val')]
      .map((t) => t.value.trim()).filter(Boolean);
    const data = {
      id: this.editingId || null,
      title: { main: document.getElementById('titleMain').value, translations },
      author: {
        name: document.getElementById('authorName').value,
        birthYear: document.getElementById('authorBirthYear').value,
        deathYear: document.getElementById('authorDeathYear').value,
        ethnicity: document.getElementById('authorEthnicity').value
      },
      pageCount: document.getElementById('pageCount').value,
      language: document.getElementById('language').value,
      genre: document.getElementById('genre').value,
      series: {
        name: document.getElementById('seriesName').value,
        volume: document.getElementById('seriesVolume').value
      },
      tags: document.getElementById('tags').value,
      quotes,
      price: { amount: document.getElementById('priceAmount').value, currency: document.getElementById('priceCurrency').value },
      rating: document.getElementById('rating').value,
      notes: document.getElementById('notes').value,
      photos: { front: document.getElementById('photoFront').value, spine: document.getElementById('photoSpine').value }
    };
    const book = new Book(data);
    if (this.editingId) {
      const prev = UI.books.find((b) => b.id === this.editingId);
      book.createdAt = prev ? prev.createdAt : Date.now();
      book.updatedAt = Date.now();
      UI.books = UI.books.map((b) => (b.id === this.editingId ? book : b));
    } else {
      UI.books.push(book);
    }
    Store.saveBooks(UI.books);
    UI.populateFilters();
    UI.displayBooks();
    this.closeModal(document.getElementById('bookModal'));
    this.toast(I18N.t('toast.saved'));
    Store.DataFolder.save(UI.books, UI.settings).catch(() => {});
  },

  /* ── Quote card ── */
  openQuoteCard(id) {
    const book = UI.books.find((b) => b.id === id);
    if (!book || !book.quotes.length) return this.toast(I18N.t('quote.noQuote'), 'error');
    this.quoteBook = book;
    this.quote = { ...Store.DEFAULT_SETTINGS.quote, ...(UI.settings.quote || {}) };

    const sel = document.getElementById('quoteSelect');
    sel.innerHTML = book.quotes.map((q, i) => {
      const label = q.length > 90 ? q.slice(0, 90) + '…' : q;
      return `<option value="${i}">${UI.esc(label)}</option>`;
    }).join('');
    sel.value = '0';

    this.syncQuoteControls();
    this.renderQuoteCard();
    this.openModal('quoteModal');
  },

  /* Reflect this.quote into every control in the modal. */
  syncQuoteControls() {
    const q = this.quote;
    document.querySelectorAll('.quote-swatch').forEach((b) => b.classList.toggle('active', b.dataset.style === q.style));
    document.querySelectorAll('#quoteFormatSeg [data-format]').forEach((b) => b.classList.toggle('active', b.dataset.format === q.format));
    document.querySelectorAll('#quoteFontSeg [data-font]').forEach((b) => b.classList.toggle('active', b.dataset.font === q.font));
    document.querySelectorAll('#quoteAlignSeg [data-align]').forEach((b) => b.classList.toggle('active', b.dataset.align === q.align));
    document.querySelectorAll('input[data-quote]').forEach((el) => {
      el.checked = q[`show${el.dataset.quote[0].toUpperCase()}${el.dataset.quote.slice(1)}`] !== false;
    });
    this.buildQuoteAccents();
  },

  buildQuoteAccents() {
    const host = document.getElementById('quoteAccents');
    if (!host) return;
    const current = this.quote.accent || '';
    host.innerHTML = `<button type="button" class="accent-dot auto${current === '' ? ' active' : ''}" data-accent="" title="${UI.esc(UI.settings.accent)}" style="--dot:${UI.settings.accent}"></button>` +
      OPEN_SHELF.quoteAccents.map((c) =>
        `<button type="button" class="accent-dot${current === c ? ' active' : ''}" data-accent="${c}" title="${c}" style="--dot:${c}"></button>`).join('');
    host.querySelectorAll('.accent-dot').forEach((b) => {
      b.addEventListener('click', () => this.setQuoteOption('accent', b.dataset.accent));
    });
  },

  setQuoteOption(key, value) {
    this.quote[key] = value;
    UI.settings.quote = this.quote;
    Store.saveSettings(UI.settings);
    this.syncQuoteControls();
    this.renderQuoteCard();
  },

  renderQuoteCard() {
    const book = this.quoteBook;
    if (!book || !this.quote) return;
    const idx = parseInt(document.getElementById('quoteSelect').value) || 0;
    const quote = book.quotes[idx] || '';
    const q = this.quote;
    const source = QuoteCard.render({
      quote,
      title: book.title.main,
      author: book.author.name,
      style: q.style,
      format: q.format,
      font: q.font,
      align: q.align,
      accent: q.accent || UI.settings.accent,
      showTitle: q.showTitle,
      showAuthor: q.showAuthor,
      showBranding: q.showBranding,
      showMarks: q.showMarks
    });
    const host = document.getElementById('quoteCanvas');
    host.width = source.width;
    host.height = source.height;
    host.getContext('2d').drawImage(source, 0, 0);
    this.quoteCanvas = source;
  },

  _quoteFilename() {
    const book = this.quoteBook;
    const slug = (book ? book.title.main : 'quote').toLowerCase()
      .replace(/[^a-z0-9\u00c0-\u024f]+/gi, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'quote';
    return `openshelf-${slug}.png`;
  },

  bindQuoteCard() {
    document.getElementById('quoteSelect').addEventListener('change', () => this.renderQuoteCard());

    document.querySelectorAll('.quote-swatch').forEach((btn) => {
      btn.addEventListener('click', () => this.setQuoteOption('style', btn.dataset.style));
    });
    document.querySelectorAll('#quoteFormatSeg [data-format]').forEach((btn) => {
      btn.addEventListener('click', () => this.setQuoteOption('format', btn.dataset.format));
    });
    document.querySelectorAll('#quoteFontSeg [data-font]').forEach((btn) => {
      btn.addEventListener('click', () => this.setQuoteOption('font', btn.dataset.font));
    });
    document.querySelectorAll('#quoteAlignSeg [data-align]').forEach((btn) => {
      btn.addEventListener('click', () => this.setQuoteOption('align', btn.dataset.align));
    });
    document.querySelectorAll('input[data-quote]').forEach((el) => {
      el.addEventListener('change', () => {
        const key = `show${el.dataset.quote[0].toUpperCase()}${el.dataset.quote.slice(1)}`;
        this.setQuoteOption(key, el.checked);
      });
    });

    document.getElementById('quoteDownloadBtn').addEventListener('click', async () => {
      if (this.quoteCanvas) await QuoteCard.download(this.quoteCanvas, this._quoteFilename());
    });
    document.getElementById('quoteCopyBtn').addEventListener('click', async () => {
      if (!this.quoteCanvas) return;
      const ok = await QuoteCard.copy(this.quoteCanvas);
      this.toast(ok ? I18N.t('quote.copied') : I18N.t('quote.copyFailed'), ok ? 'success' : 'error');
    });
    document.getElementById('quoteShareBtn').addEventListener('click', async () => {
      if (!this.quoteCanvas) return;
      const book = this.quoteBook;
      const text = book ? `${book.title.main} — ${book.author.name}` : 'OpenShelf';
      const result = await QuoteCard.share(this.quoteCanvas, this._quoteFilename(), text);
      if (result === 'shared') this.toast(I18N.t('quote.shared'));
      else if (result === 'downloaded') this.toast(I18N.t('quote.shareFallback'));
    });
  },

  /* ── Markdown export ── */
  exportLibraryMd() {
    const md = Markdown.library(UI.books, UI.settings);
    Markdown.download(`openshelf-library-${new Date().toISOString().slice(0, 10)}.md`, md);
    this.toast(I18N.t('toast.markdownExported'));
  },

  exportCurrentBookMd() {
    if (!this.editingId) return;
    const book = UI.books.find((b) => b.id === this.editingId);
    if (!book) return;
    const md = Markdown.book(book, UI.settings);
    const slug = book.title.main.toLowerCase().replace(/[^a-z0-9\u00c0-\u024f]+/gi, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'book';
    Markdown.download(`openshelf-${slug}.md`, md);
    this.toast(I18N.t('toast.markdownExported'));
  },

  /* ── Settings ── */
  openSettings() {
    const s = UI.settings;
    this.updateLanguageControl();
    document.getElementById('baseCurrencySelect').value = s.baseCurrency;
    document.getElementById('cardSizeSelect').value = s.cardSize;
    document.getElementById('densitySelect').value = s.density;
    document.getElementById('fontSelect').value = s.font;
    document.getElementById('animationsSelect').value = String(s.animations);
    document.getElementById('accentColorPicker').value = s.accent;
    document.querySelectorAll('input[name="theme"]').forEach((r) => { r.checked = r.value === s.theme; });
    document.querySelectorAll('#displayToggles input[data-display]').forEach((el) => {
      el.checked = s.display[el.dataset.display] !== false;
    });
    this.renderAccentSwatches();
    this.updateFolderStatus();
    this.openModal('settingsModal');
  },

  bindSettings() {
    const bind = (id, key, transform = (v) => v) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('change', () => {
        UI.settings[key] = transform(el.value);
        Store.saveSettings(UI.settings);
        UI.refresh();
      });
    };
    document.querySelectorAll('input[name="theme"]').forEach((radio) => {
      radio.addEventListener('change', () => {
        UI.settings.theme = radio.value;
        Store.saveSettings(UI.settings);
        UI.applySettings();
      });
    });
    document.getElementById('accentColorPicker').addEventListener('input', (e) => {
      UI.settings.accent = e.target.value;
      Store.saveSettings(UI.settings);
      UI.applySettings();
      this.renderAccentSwatches();
    });
    bind('cardSizeSelect', 'cardSize');
    bind('densitySelect', 'density');
    bind('fontSelect', 'font');
    bind('animationsSelect', 'animations', (v) => v === 'true');
    bind('baseCurrencySelect', 'baseCurrency', (v) => { UI.refresh(); return v; });
    // Shelf display toggles
    document.querySelectorAll('#displayToggles input[data-display]').forEach((el) => {
      el.addEventListener('change', () => {
        UI.settings.display[el.dataset.display] = el.checked;
        Store.saveSettings(UI.settings);
        UI.displayBooks();
      });
    });

    document.getElementById('saveSettingsBtn').addEventListener('click', () => {
      Store.saveSettings(UI.settings);
      UI.refresh();
      this.closeModal(document.getElementById('settingsModal'));
      this.toast(I18N.t('toast.settingsSaved'));
    });
    document.getElementById('resetSettingsBtn').addEventListener('click', async () => {
      const ok = await this.confirm(I18N.t('settings.resetSettings'), I18N.t('settings.title'));
      if (!ok) return;
      UI.settings = Store.resetSettings();
      await I18N.setLocale(UI.settings.uiLang);
      this.buildStaticSelects();
      this.updateLanguageControl();
      UI.refresh();
      this.openSettings();
      this.toast(I18N.t('toast.reset'));
    });
  },

  renderAccentSwatches() {
    const host = document.getElementById('accentSwatches');
    if (!host) return;
    host.innerHTML = OPEN_SHELF.accentPresets.map((c) =>
      `<button type="button" class="swatch${c === UI.settings.accent ? ' active' : ''}" style="--sw:${c}" data-color="${c}" title="${c}"></button>`
    ).join('');
    host.querySelectorAll('.swatch').forEach((sw) => {
      sw.addEventListener('click', () => {
        UI.settings.accent = sw.dataset.color;
        Store.saveSettings(UI.settings);
        document.getElementById('accentColorPicker').value = sw.dataset.color;
        UI.applySettings();
        this.renderAccentSwatches();
      });
    });
  },

  /* ── Data tools ── */
  bindDataTools() {
    document.getElementById('exportMarkdownBtn').addEventListener('click', () => this.exportLibraryMd());
    document.getElementById('exportDataBtn').addEventListener('click', () => {
      const blob = new Blob([Store.exportData()], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `openshelf-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      this.toast(I18N.t('toast.exported'));
    });

    const importInput = document.getElementById('importDataInput');
    document.getElementById('importDataBtn').addEventListener('click', () => importInput.click());
    importInput.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (ev) => {
        if (Store.importData(ev.target.result)) {
          UI.settings = Store.getSettings();
          await I18N.setLocale(UI.settings.uiLang);
          UI.books = Store.getBooks().map((b) => new Book(b));
          this.buildStaticSelects();
          UI.refresh();
          this.toast(I18N.t('toast.imported'));
        } else {
          this.toast(I18N.t('toast.importFailed'), 'error');
        }
      };
      reader.readAsText(file);
      importInput.value = '';
    });

    const folderBtn = document.getElementById('connectFolderBtn');
    const disconnectBtn = document.getElementById('disconnectFolderBtn');
    if (!Store.DataFolder.supported()) {
      if (folderBtn) { folderBtn.disabled = true; folderBtn.dataset.i18nTitle = 'settings.folderHint'; }
    }
    folderBtn?.addEventListener('click', async () => {
      try {
        const handle = await Store.DataFolder.pick();
        await Store.DataFolder.save(UI.books, UI.settings);
        this.toast(I18N.t('toast.folderConnected'));
        this.updateFolderStatus();
        void handle;
      } catch (err) {
        if (err && err.name === 'AbortError') return;
        this.toast(I18N.t('toast.folderError'), 'error');
      }
    });
    disconnectBtn?.addEventListener('click', async () => {
      await Store.DataFolder.clear();
      this.toast(I18N.t('toast.folderDisconnected'));
      this.updateFolderStatus();
    });
  },

  async updateFolderStatus() {
    const status = document.getElementById('folderStatus');
    const disconnectBtn = document.getElementById('disconnectFolderBtn');
    if (!status) return;
    try {
      const handle = await Store.DataFolder.getHandle();
      if (handle) {
        status.textContent = `${I18N.t('settings.folderConnected')}: ${handle.name}/${Store.DATA_DIR}`;
        status.classList.remove('muted');
        if (disconnectBtn) disconnectBtn.classList.remove('hidden');
      } else {
        status.textContent = I18N.t('settings.folderHint');
        status.classList.add('muted');
        if (disconnectBtn) disconnectBtn.classList.add('hidden');
      }
    } catch (e) { /* ignore */ }
  }
};

document.addEventListener('DOMContentLoaded', () => App.start());
