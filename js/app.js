/* ─────────────────────────────────────────────────────────────
 * OpenShelf — App controller
 * Wires the DOM, modals, the book form, settings and data tools.
 * ───────────────────────────────────────────────────────────── */
const App = {
  editingId: null,

  async start() {
    this.cacheDom();
    this.buildStaticSelects();
    this.bindGlobal();
    this.bindToolbar();
    this.bindBookForm();
    this.bindSettings();
    this.bindDataTools();

    this.startClock();
    await UI.init();
    this.bindShelf();

    if (window.lucide) lucide.createIcons();
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
  dismissLoader() {
    const loader = document.getElementById('startupLoader');
    if (!loader) return;
    const hide = () => {
      loader.classList.add('done');
      document.body.classList.add('ready');
      setTimeout(() => loader.remove(), 700);
    };
    if (document.readyState === 'complete') setTimeout(hide, 650);
    else window.addEventListener('load', () => setTimeout(hide, 650), { once: true });
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
    const uiSel = document.getElementById('uiLanguageSelect');
    if (uiSel) {
      uiSel.innerHTML = OPEN_SHELF.uiLocales
        .map((l) => `<option value="${l.code}">${UI.esc(l.native)} — ${UI.esc(l.name)}</option>`).join('');
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

  /* ── Toolbar ── */
  bindToolbar() {
    document.getElementById('infoBtn').addEventListener('click', () => this.openModal('infoModal'));
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
    ['filterAuthor', 'filterLang', 'filterRating', 'filterPrice', 'sortData'].forEach((id) => {
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
      if (e.target.closest('.edit-btn')) return this.openBookModal(id);
      const book = UI.books.find((b) => b.id === id);
      if (book) this.openBookModal(id); // spines/rows open editor on click
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
    document.getElementById('rating').value = '0';
    this.setStars(0, true);
    ['photoFrontPreview', 'photoSpinePreview'].forEach((p) => document.getElementById(p)?.classList.add('hidden'));
    this.editingId = id;
    document.getElementById('modalTitle').textContent = id ? I18N.t('action.editBook') : I18N.t('action.addBook');

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

  /* ── Settings ── */
  openSettings() {
    const s = UI.settings;
    document.getElementById('uiLanguageSelect').value = s.uiLang;
    document.getElementById('baseCurrencySelect').value = s.baseCurrency;
    document.getElementById('cardSizeSelect').value = s.cardSize;
    document.getElementById('densitySelect').value = s.density;
    document.getElementById('fontSelect').value = s.font;
    document.getElementById('animationsSelect').value = String(s.animations);
    document.getElementById('accentColorPicker').value = s.accent;
    document.querySelectorAll('input[name="theme"]').forEach((r) => { r.checked = r.value === s.theme; });
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
    // UI language needs an async reload
    document.getElementById('uiLanguageSelect').addEventListener('change', async (e) => {
      UI.settings.uiLang = e.target.value;
      Store.saveSettings(UI.settings);
      await I18N.setLocale(UI.settings.uiLang);
      this.buildStaticSelects();
      UI.refresh();
      this.renderAccentSwatches();
      this.openSettings();
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
        status.textContent = `${I18N.t('settings.folderConnected')}: ${handle.name}`;
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
