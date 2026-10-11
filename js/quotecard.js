/* ─────────────────────────────────────────────────────────────
 * OpenShelf — Quote Card
 * Renders a book quote (or note) into a shareable image on a
 * <canvas>. Supports several styles, three formats (square,
 * portrait, story), two typefaces, alignment and optional
 * elements. Can be downloaded, copied or shared via Web Share.
 * ───────────────────────────────────────────────────────────── */
const QuoteCard = {
  FONT_SERIF: '"Fraunces", Georgia, "Times New Roman", serif',
  FONT_SANS: '"Inter", "Segoe UI", system-ui, sans-serif',

  FORMATS: {
    square: [1080, 1080],
    portrait: [1080, 1350],
    story: [1080, 1920]
  },

  _hexToRgb(hex) {
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || '');
    if (!m) return { r: 99, g: 102, b: 241 };
    return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) };
  },
  _rgba(c, a) { return `rgba(${c.r},${c.g},${c.b},${a})`; },
  _shade(c, f) { return { r: Math.round(c.r * f), g: Math.round(c.g * f), b: Math.round(c.b * f) }; },

  _wrap(ctx, text, maxWidth) {
    const words = String(text).split(/\s+/);
    const lines = [];
    let line = '';
    for (const word of words) {
      const test = line ? line + ' ' + word : word;
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
    return lines;
  },

  _drawMark(ctx, x, y, scale, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke(new Path2D('M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z'));
    ctx.stroke(new Path2D('M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z'));
    ctx.restore();
  },

  /** Paints the background and returns the palette for the style. */
  _paintBackground(ctx, W, H, style, accent) {
    const light = { text: '#2b2418', sub: '#7a6f5c', mark: this._rgba(accent, 0.32), divider: 'rgba(0,0,0,0.12)' };
    if (style === 'paper') {
      ctx.fillStyle = '#fbf6ec';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(0,0,0,0.028)';
      for (let i = 0; i < 48; i++) ctx.fillRect(0, i * (H / 48), W, 1);
      return light;
    }
    if (style === 'minimal') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, W, H);
      const d = this._shade(accent, 0.85);
      ctx.fillStyle = `rgb(${accent.r},${accent.g},${accent.b})`;
      ctx.fillRect(0, 0, W, 12);
      return { text: '#111827', sub: '#6b7280', mark: this._rgba(accent, 0.16), divider: 'rgba(0,0,0,0.1)' };
    }
    if (style === 'night') {
      const g = ctx.createLinearGradient(0, 0, W, H);
      g.addColorStop(0, '#0d1220');
      g.addColorStop(1, '#161d33');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      const glow = ctx.createRadialGradient(W * 0.82, H * 0.16, 0, W * 0.82, H * 0.16, W * 0.75);
      glow.addColorStop(0, this._rgba(accent, 0.4));
      glow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, W, H);
      return { text: '#f4f6ff', sub: '#aab3d0', mark: this._rgba(accent, 0.55), divider: 'rgba(255,255,255,0.18)' };
    }
    if (style === 'forest') {
      const g = ctx.createLinearGradient(0, 0, W, H);
      g.addColorStop(0, '#065f46');
      g.addColorStop(1, '#022c22');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      return { text: '#ecfdf5', sub: 'rgba(236,253,245,0.78)', mark: 'rgba(255,255,255,0.26)', divider: 'rgba(255,255,255,0.28)' };
    }
    if (style === 'sunset') {
      const g = ctx.createLinearGradient(0, 0, W, H);
      g.addColorStop(0, '#fb923c');
      g.addColorStop(0.55, '#f43f5e');
      g.addColorStop(1, '#be185d');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      const bloom = ctx.createRadialGradient(W * 0.25, H * 0.18, 0, W * 0.25, H * 0.18, W);
      bloom.addColorStop(0, 'rgba(255,255,255,0.22)');
      bloom.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = bloom;
      ctx.fillRect(0, 0, W, H);
      return { text: '#ffffff', sub: 'rgba(255,255,255,0.85)', mark: 'rgba(255,255,255,0.3)', divider: 'rgba(255,255,255,0.4)' };
    }
    // gradient (default)
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, `rgb(${accent.r},${accent.g},${accent.b})`);
    const d = this._shade(accent, 0.62);
    g.addColorStop(1, `rgb(${d.r},${d.g},${d.b})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    const bloom = ctx.createRadialGradient(W * 0.2, H * 0.15, 0, W * 0.2, H * 0.15, W);
    bloom.addColorStop(0, 'rgba(255,255,255,0.22)');
    bloom.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = bloom;
    ctx.fillRect(0, 0, W, H);
    return { text: '#ffffff', sub: 'rgba(255,255,255,0.78)', mark: 'rgba(255,255,255,0.28)', divider: 'rgba(255,255,255,0.35)' };
  },

  /** Renders the card and returns the canvas element. */
  render(opts = {}) {
    const style = opts.style || 'gradient';
    const format = opts.format || 'square';
    const font = opts.font === 'sans' ? this.FONT_SANS : this.FONT_SERIF;
    const align = opts.align === 'center' ? 'center' : 'left';
    const showTitle = opts.showTitle !== false;
    const showAuthor = opts.showAuthor !== false;
    const showBranding = opts.showBranding !== false;
    const showMarks = opts.showMarks !== false;
    const accent = this._hexToRgb(opts.accent || '#6366f1');

    const dims = this.FORMATS[format] || this.FORMATS.square;
    const W = dims[0], H = dims[1];

    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');

    const pal = this._paintBackground(ctx, W, H, style, accent);
    const pad = Math.round(W * 0.088);
    const contentW = W - pad * 2;
    const cx = W / 2;

    // Decorative opening quote
    if (showMarks) {
      ctx.save();
      ctx.fillStyle = pal.mark;
      ctx.font = `700 220px ${this.FONT_SERIF}`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText('\u201C', align === 'center' ? cx - 120 : pad - 8, H * 0.24);
      ctx.restore();
    }

    // Quote text — auto-fit within the region above the footer block.
    const textTop = showMarks ? H * 0.30 : H * 0.20;
    const dividerY = H - pad - 236;
    const maxTextH = dividerY - 40 - textTop;
    const quote = String(opts.quote || '').trim();
    let fontSize = format === 'story' ? 78 : 64;
    let lines = [];
    while (fontSize >= 30) {
      ctx.font = `500 ${fontSize}px ${font}`;
      lines = this._wrap(ctx, quote, contentW);
      if (lines.length * fontSize * 1.38 <= maxTextH) break;
      fontSize -= 2;
    }
    ctx.font = `500 ${fontSize}px ${font}`;
    ctx.fillStyle = pal.text;
    ctx.textAlign = align === 'center' ? 'center' : 'left';
    ctx.textBaseline = 'top';
    const lineH = fontSize * 1.38;
    const tx = align === 'center' ? cx : pad;
    let y = textTop;
    for (const line of lines) { ctx.fillText(line, tx, y); y += lineH; }

    // Divider
    ctx.fillStyle = pal.divider;
    const dw = 120;
    ctx.fillRect(align === 'center' ? cx - dw / 2 : pad, dividerY, dw, 3);

    // Footer block: title → author → branding
    let fy = dividerY + 52;
    if (showTitle) {
      ctx.fillStyle = pal.text;
      ctx.font = `600 48px ${font}`;
      ctx.textBaseline = 'top';
      const tl = this._wrap(ctx, String(opts.title || ''), contentW).slice(0, 2);
      for (const line of tl) { ctx.fillText(line, tx, fy); fy += 56; }
      fy += 4;
    }
    if (showAuthor) {
      ctx.fillStyle = pal.sub;
      ctx.font = `500 34px ${this.FONT_SANS}`;
      ctx.fillText(String(opts.author || ''), tx, fy);
      fy += 48;
    }
    if (showBranding) {
      const label = 'OpenShelf';
      ctx.font = `600 34px ${this.FONT_SANS}`;
      ctx.textBaseline = 'middle';
      const tw = ctx.measureText(label).width;
      const iconW = 44;
      const totalW = iconW + tw;
      const startX = align === 'center' ? cx - totalW / 2 : pad;
      const by = H - pad + 4;
      this._drawMark(ctx, startX, by - 20, 1.6, pal.sub);
      ctx.fillStyle = pal.sub;
      ctx.textAlign = 'left';
      ctx.fillText(label, startX + iconW + 16, by);
    }

    return canvas;
  },

  toBlob(canvas) {
    return new Promise((resolve) => {
      if (canvas.toBlob) canvas.toBlob((b) => resolve(b), 'image/png');
      else resolve(null);
    });
  },

  async download(canvas, filename) {
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  },

  async copy(canvas) {
    try {
      if (!navigator.clipboard || !window.ClipboardItem) return false;
      const blob = await this.toBlob(canvas);
      if (!blob) return false;
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      return true;
    } catch (e) {
      return false;
    }
  },

  /** @returns {Promise<'shared'|'downloaded'|'cancelled'>} */
  async share(canvas, filename, text) {
    try {
      const blob = await this.toBlob(canvas);
      const file = blob && new File([blob], filename, { type: 'image/png' });
      if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], text: text || 'OpenShelf' });
        return 'shared';
      }
    } catch (e) {
      if (e && e.name === 'AbortError') return 'cancelled';
    }
    await this.download(canvas, filename);
    return 'downloaded';
  }
};
window.QuoteCard = QuoteCard;
