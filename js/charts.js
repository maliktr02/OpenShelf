/* ─────────────────────────────────────────────────────────────
 * OpenShelf — Charts
 * Tiny dependency-free SVG chart helpers used by the statistics
 * panel (donut, vertical bars, area/line). Colours read from the
 * live CSS custom properties so charts follow the active accent.
 * ───────────────────────────────────────────────────────────── */
const Charts = {
  palette: [
    'var(--accent)', '#10b981', '#f59e0b', '#ef4444',
    '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6', '#6366f1'
  ],

  _esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  },

  /**
   * Ring/donut chart.
   * @param {Array<{label:string,value:number}>} entries
   */
  donut(entries, size = 172, thickness = 22) {
    const data = (entries || []).filter((e) => e.value > 0);
    const total = data.reduce((s, e) => s + e.value, 0);
    const r = (size - thickness) / 2;
    const c = 2 * Math.PI * r;
    const cx = size / 2;
    if (!total) return '';

    let offset = 0;
    const arcs = data.map((e, i) => {
      const frac = e.value / total;
      const len = frac * c;
      const color = this.palette[i % this.palette.length];
      const seg = `
        <circle cx="${cx}" cy="${cx}" r="${r}" fill="none"
          stroke="${color}" stroke-width="${thickness}"
          stroke-dasharray="${len.toFixed(2)} ${(c - len).toFixed(2)}"
          stroke-dashoffset="${(-offset).toFixed(2)}"
          transform="rotate(-90 ${cx} ${cx})">
          <title>${this._esc(e.label)}: ${e.value} (${Math.round(frac * 100)}%)</title>
        </circle>`;
      offset += len;
      return seg;
    }).join('');

    const center = `
      <text x="${cx}" y="${cx - 2}" text-anchor="middle" class="donut-total">${total}</text>
      <text x="${cx}" y="${cx + 16}" text-anchor="middle" class="donut-caption">${this._esc(I18N.t('stats.totalBooks'))}</text>`;

    const legend = data.map((e, i) => `
      <li><span class="chart-dot" style="background:${this.palette[i % this.palette.length]}"></span>
        <span class="chart-legend-label">${this._esc(e.label)}</span>
        <span class="chart-legend-value">${e.value}</span></li>`).join('');

    return `
      <div class="chart-donut-wrap">
        <svg viewBox="0 0 ${size} ${size}" class="chart-donut" role="img">${arcs}${center}</svg>
        <ul class="chart-legend">${legend}</ul>
      </div>`;
  },

  /**
   * Vertical bar chart.
   * @param {Array<{label:string,value:number}>} entries
   */
  bars(entries, height = 168) {
    const data = entries || [];
    if (!data.length) return '';
    const max = Math.max(1, ...data.map((e) => e.value));
    const w = 40;
    const gap = 14;
    const padB = 30;
    const padT = 22;
    const width = data.length * (w + gap) + gap;
    const plotH = height - padB - padT;

    const bars = data.map((e, i) => {
      const bh = (e.value / max) * plotH;
      const x = gap + i * (w + gap);
      const y = padT + (plotH - bh);
      return `
        <g class="chart-bar-group">
          <rect x="${x}" y="${y}" width="${w}" height="${Math.max(0, bh)}" rx="6"
            fill="var(--accent)" opacity="${e.value ? 0.85 : 0.15}">
            <title>${this._esc(e.label)}: ${e.value}</title>
          </rect>
          ${e.value ? `<text x="${x + w / 2}" y="${y - 6}" text-anchor="middle" class="chart-bar-value">${e.value}</text>` : ''}
          <text x="${x + w / 2}" y="${height - 10}" text-anchor="middle" class="chart-axis">${this._esc(e.label)}</text>
        </g>`;
    }).join('');

    return `<svg viewBox="0 0 ${width} ${height}" class="chart-bars" role="img" preserveAspectRatio="xMidYMid meet">${bars}</svg>`;
  },

  /**
   * Area/line chart for a time series.
   * @param {Array<{label:string,value:number}>} points
   */
  area(points, height = 168) {
    const data = points || [];
    if (!data.length) return '';
    const w = 44;
    const padL = 10;
    const padR = 10;
    const padT = 18;
    const padB = 28;
    const width = Math.max(320, data.length * w) + padL + padR;
    const plotH = height - padT - padB;
    const plotW = width - padL - padR;
    const max = Math.max(1, ...data.map((p) => p.value));

    const xAt = (i) => padL + (data.length === 1 ? plotW / 2 : (i / (data.length - 1)) * plotW);
    const yAt = (v) => padT + (plotH - (v / max) * plotH);

    const line = data.map((p, i) => `${i === 0 ? 'M' : 'L'}${xAt(i).toFixed(1)},${yAt(p.value).toFixed(1)}`).join(' ');
    const areaPath = `${line} L${xAt(data.length - 1).toFixed(1)},${(padT + plotH).toFixed(1)} L${xAt(0).toFixed(1)},${(padT + plotH).toFixed(1)} Z`;

    const dots = data.map((p, i) => `
      <circle cx="${xAt(i).toFixed(1)}" cy="${yAt(p.value).toFixed(1)}" r="3.2" fill="var(--accent)">
        <title>${this._esc(p.label)}: ${p.value}</title></circle>`).join('');

    const labels = data.map((p, i) => {
      if (data.length > 8 && i % 2 !== 0) return '';
      return `<text x="${xAt(i).toFixed(1)}" y="${height - 9}" text-anchor="middle" class="chart-axis">${this._esc(p.label)}</text>`;
    }).join('');

    return `
      <svg viewBox="0 0 ${width} ${height}" class="chart-area" role="img" preserveAspectRatio="none">
        <defs>
          <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="var(--accent)" stop-opacity="0.35"/>
            <stop offset="100%" stop-color="var(--accent)" stop-opacity="0"/>
          </linearGradient>
        </defs>
        <path d="${areaPath}" fill="url(#areaFill)"/>
        <path d="${line}" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
        ${dots}
        ${labels}
      </svg>`;
  }
};
window.Charts = Charts;
