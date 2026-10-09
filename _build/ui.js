/* ================================================================== ui
   i18n helpers, formatting, shared components, charts, animations, sheet. */

const LOCALES = { en: 'en-GB', zh: 'zh-CN', es: 'es-ES' };
let lang = 'en';
function t(key, vars) {
  const e = I18N[key];
  let s = e ? (e[lang] ?? e.en) : key;
  if (vars) for (const k in vars) s = s.split(`{${k}}`).join(vars[k]);
  return s;
}
const tx = (o) => (o && typeof o === 'object' ? (o[lang] ?? o.en) : o ?? '');
const nf = (opts) => new Intl.NumberFormat(lang === 'en' ? 'en-IE' : LOCALES[lang], opts);
const money = (c) => nf({ style: 'currency', currency: 'EUR' }).format((c || 0) / 100);
const money0 = (c) => nf({ style: 'currency', currency: 'EUR', maximumFractionDigits: 0, minimumFractionDigits: 0 }).format(Math.round((c || 0) / 100));
const num = (n) => nf({ maximumFractionDigits: 0 }).format(n);
const fmtDate = (iso, o = { weekday: 'short', day: 'numeric', month: 'short' }) => new Date(`${iso}T12:00:00`).toLocaleDateString(LOCALES[lang], o);
const fmtLong = (iso) => fmtDate(iso, { day: 'numeric', month: 'long', year: 'numeric' });
const dayName = (d) => fmtDate(nextDay(WEEKDAYS.indexOf(d)), { weekday: 'short' });

const COLORS = { business: '#1F5BFF', promoter: '#FF7A1A', coorganiser: '#FFB27A', referral: '#7A5AF8', project: '#1E9E61', unallocated: '#8FD9B4', platform: '#A1A1A6' };

/* ------------------------------------------------------------------ components */
const photo = (key, cls = '', alt = '') => `<div class="ph ${cls}"><img src="${img(key, cls.includes('sm') ? 400 : 1000)}" alt="${esc(alt)}" loading="lazy" decoding="async" onerror="this.parentNode.classList.add('noimg')"></div>`;
const avatar = (p, size = 'md') => `<span class="av av-${size}" style="--c:${p?.color || '#999'}" aria-hidden="true">${esc((p?.name || '?')[0])}</span>`;
const kindTag = (kind) => `<span class="kind ${kind === 'Transferred' ? 'kt' : 'ke'}">${t(kind === 'Transferred' ? 'transferred' : 'expected')}</span>`;
const statusPill = (s, ed) => { const st = edStatus(s, ed); return `<span class="pill p-${st.tone}">${t(`st_${st.key}`)}</span>`; };
const icon = (name) => `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">${{
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>', back: '<path d="M19 12H5M11 18l-6-6 6-6"/>', close: '<path d="M6 6l12 12M18 6L6 18"/>',
  pin: '<path d="M12 21s-7-6.2-7-11a7 7 0 1 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>', clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.6 3.4-5.5 6.5-5.5s5.7 1.9 6.5 5.5"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.8c2 .7 3.2 2.4 3.5 5.2"/>',
  heart: '<path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.2a4.3 4.3 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20z"/>', check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  scan: '<path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M4 12h16"/>', plus: '<path d="M12 5v14M5 12h14"/>',
  grid: '<rect x="4" y="4" width="7" height="7" rx="2"/><rect x="13" y="4" width="7" height="7" rx="2"/><rect x="4" y="13" width="7" height="7" rx="2"/><rect x="13" y="13" width="7" height="7" rx="2"/>',
  cal: '<rect x="4" y="5" width="16" height="15" rx="3"/><path d="M4 10h16M9 3v4M15 3v4"/>', wallet: '<path d="M4 7a2 2 0 0 1 2-2h11v4"/><rect x="4" y="9" width="16" height="11" rx="2.5"/><circle cx="16" cy="14.5" r="1.3"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>', inbox: '<path d="M4 13l2.5-7h11L20 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path d="M4 13h5l1 2h4l1-2h5"/>',
  store: '<path d="M4 9l1.5-5h13L20 9"/><path d="M4 9h16v1.5a2.7 2.7 0 0 1-5.3 0 2.7 2.7 0 0 1-5.4 0A2.7 2.7 0 0 1 4 10.5z"/><path d="M5.5 13v7h13v-7"/>', ticket: '<path d="M4 8a2 2 0 0 0 2-2h12a2 2 0 0 0 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 0-2 2H6a2 2 0 0 0-2-2v-2a2 2 0 0 0 0-4z"/><path d="M14 6v12" stroke-dasharray="2 2"/>',
  spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M18 6l-2.5 2.5M8.5 15.5L6 18"/>', menu: '<path d="M4 7h16M4 12h16M4 17h16"/>', send: '<path d="M4 12l16-8-6 16-2.5-6.5z"/>',
}[name] || ''}</svg>`;

// Count-up number, animated when revealed. fmt: money | money0 | num | pct
const count = (value, fmt = 'money0', extra = '') => `<span class="num" data-count="${value}" data-fmt="${fmt}" ${extra}>${formatCount(value, fmt)}</span>`;
function formatCount(v, fmt) {
  if (fmt === 'money') return money(v);
  if (fmt === 'money0') return money0(v);
  if (fmt === 'pct') return `${Math.round(v)}%`;
  return num(v);
}

function progress(value, max, minMark = null) {
  const w = max ? clamp((value / max) * 100, 0, 100) : 0;
  const m = minMark != null && max ? `<i class="pmin" style="left:${(minMark / max) * 100}%"></i>` : '';
  return `<div class="prog" role="progressbar" aria-valuenow="${value}" aria-valuemax="${max}"><b style="--w:${w}%"></b>${m}</div>`;
}

// Animated ring gauge (0..1)
function ring(frac, label, sub = '', color = 'var(--ink)', size = 92) {
  const r = 38; const c = 2 * Math.PI * r; const f = clamp(frac, 0, 1);
  return `<div class="ring" style="--s:${size}px"><svg viewBox="0 0 96 96"><circle cx="48" cy="48" r="${r}" class="ring-bg"/><circle cx="48" cy="48" r="${r}" class="ring-fg" style="stroke:${color};--len:${(f * c).toFixed(1)};--c:${c.toFixed(1)}" transform="rotate(-90 48 48)"/></svg><div class="ring-t"><b>${label}</b>${sub ? `<small>${sub}</small>` : ''}</div></div>`;
}

function partyName(s, l) {
  if (l.partyType === 'venue') return s.venues[l.partyId]?.name;
  if (l.partyType === 'project') return s.projects[l.partyId]?.name;
  if (l.partyType === 'platform') return 'Crowdpromotion';
  return s.people[l.partyId]?.name;
}
function slicesOf(s, split) {
  const out = [];
  for (const l of split.lines) {
    if (l.key === 'project') {
      out.push({ label: partyName(s, l), sub: t('role_project'), cents: l.base, color: COLORS.project });
      if (l.fromReferral > 0) out.push({ label: partyName(s, l), sub: t('role_unallocated'), cents: l.fromReferral, color: COLORS.unallocated });
    } else out.push({ label: partyName(s, l), sub: t(`role_${l.key}`, { n: l.level }), cents: l.cents, color: COLORS[l.key] });
  }
  return out;
}

function donut(slices, top = '', bottom = '') {
  const total = sum(slices, (x) => x.cents) || 1; const r = 70; const c = 2 * Math.PI * r; let off = 0;
  const arcs = slices.map((x, i) => {
    const len = (x.cents / total) * c;
    const a = `<circle r="${r}" cx="90" cy="90" style="stroke:${x.color};--len:${Math.max(0, len - 1.5).toFixed(2)};--off:${(-off).toFixed(2)};--i:${i}"><title>${esc(x.label)} · ${money(x.cents)}</title></circle>`;
    off += len; return a;
  }).join('');
  return `<svg class="donut" viewBox="0 0 180 180" role="img" aria-label="${esc(top)}"><g transform="rotate(-90 90 90)">${arcs}</g><text x="90" y="88" class="d-top">${esc(top)}</text><text x="90" y="108" class="d-bot">${esc(bottom)}</text></svg>`;
}
const legend = (slices) => `<ul class="lg">${slices.map((x, i) => `<li style="--i:${i}"><i style="background:${x.color}"></i><span>${esc(x.label)}<small>${esc(x.sub || '')}</small></span><b class="num">${money(x.cents)}</b></li>`).join('')}</ul>`;

function splitTable(s, split, kind) {
  return `<div class="stable">${split.lines.map((l) => `<div class="srow"><i style="background:${COLORS[l.key]}"></i><span><b>${esc(partyName(s, l))}</b><small>${t(`role_${l.key}`, { n: l.level })}${l.key === 'project' && l.fromReferral > 0 ? ` · ${t('incl_unalloc', { a: money(l.fromReferral) })}` : ''}</small></span><b class="num">${money(l.cents)}</b></div>`).join('')}
    <div class="srow tot"><span>${t('net_sales')} ${kind ? kindTag(kind) : ''}</span><b class="num">${money(split.check)}</b></div></div>`;
}

// Weekly bar chart: transferred (solid) vs expected (hatched).
function barChart(series, h = 200) {
  const W = 640; const pad = 28; const bw = (W - pad) / series.length;
  const max = Math.max(1, ...series.map((d) => d.transferred + d.expected));
  const scale = (v) => (v / max) * (h - 34);
  const bars = series.map((d, i) => {
    const x = pad + i * bw + bw * 0.18; const w = bw * 0.64;
    const ht = scale(d.transferred); const he = scale(d.expected);
    return `<g style="--i:${i}">${d.current ? `<rect x="${x - bw * 0.12}" y="4" width="${w + bw * 0.24}" height="${h - 26}" rx="10" class="cur"/>` : ''}
      ${ht ? `<rect class="bar bt" x="${x}" y="${h - 22 - ht}" width="${w}" height="${ht}" rx="6"><title>${money(d.transferred)}</title></rect>` : ''}
      ${he ? `<rect class="bar be" x="${x}" y="${h - 22 - ht - he}" width="${w}" height="${he}" rx="6"><title>${money(d.expected)}</title></rect>` : ''}
      <text x="${x + w / 2}" y="${h - 6}" class="ax">${fmtDate(d.from, { day: 'numeric', month: 'numeric' })}</text></g>`;
  }).join('');
  const grid = [0.5, 1].map((f) => `<line x1="${pad}" x2="${W}" y1="${h - 22 - (h - 34) * f}" y2="${h - 22 - (h - 34) * f}" class="gl"/><text x="0" y="${h - 18 - (h - 34) * f}" class="ax ay">${money0(max * f)}</text>`).join('');
  return `<svg class="chart bars" viewBox="0 0 ${W} ${h}" role="img" aria-label="${t('weekly_earnings')}"><defs><pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="#FFE2CC"/><rect width="2.5" height="6" fill="#FFB27A"/></pattern></defs>${grid}${bars}</svg>`;
}

// Smooth area line for cumulative values.
function areaChart(values, color = '#1E9E61', h = 120) {
  const W = 400; const max = Math.max(1, ...values); const n = values.length;
  const pts = values.map((v, i) => [(i / Math.max(1, n - 1)) * W, h - 8 - (v / max) * (h - 20)]);
  const d = pts.map((p, i) => (i ? `L${p[0].toFixed(1)},${p[1].toFixed(1)}` : `M${p[0].toFixed(1)},${p[1].toFixed(1)}`)).join(' ');
  return `<svg class="chart area" viewBox="0 0 ${W} ${h}" preserveAspectRatio="none" aria-hidden="true"><path d="${d} L${W},${h} L0,${h} Z" class="fill" style="fill:${color}"/><path d="${d}" class="line" pathLength="1" style="stroke:${color}"/></svg>`;
}

// Revenue -> costs -> profit waterfall.
function waterfall(revenue, costs, labels) {
  const max = Math.max(1, revenue); const H = 180; const y = (v) => H - 26 - (v / max) * (H - 40);
  const profit = revenue - costs;
  const bars = [
    { x: 20, top: y(revenue), bot: y(0), c: 'var(--ink)', v: revenue, l: labels[0] },
    { x: 150, top: y(revenue), bot: y(Math.max(0, profit)), c: '#E3263A', v: -costs, l: labels[1] },
    { x: 280, top: y(Math.max(0, profit)), bot: y(0), c: '#1E9E61', v: profit, l: labels[2] },
  ];
  return `<svg class="chart wf" viewBox="0 0 400 ${H}" role="img" aria-label="${esc(labels.join(' / '))}">${bars.map((b, i) => `<g style="--i:${i}"><rect class="bar" x="${b.x}" y="${b.top}" width="100" height="${Math.max(2, b.bot - b.top)}" rx="10" fill="${b.c}"/><text x="${b.x + 50}" y="${b.top - 8}" class="wv">${money0(b.v)}</text><text x="${b.x + 50}" y="${H - 6}" class="ax">${esc(b.l)}</text></g>`).join('')}
    <line x1="120" x2="150" y1="${y(revenue)}" y2="${y(revenue)}" class="gl"/><line x1="250" x2="280" y1="${y(Math.max(0, profit))}" y2="${y(Math.max(0, profit))}" class="gl"/></svg>`;
}

// Deterministic QR-like code (visual ticket token).
function qr(seed) {
  const n = 21; let h = hashStr(seed);
  const F = [[0, 0], [n - 7, 0], [0, n - 7]];
  const inF = (x, y) => F.find(([a, b]) => x >= a && x < a + 7 && y >= b && y < b + 7);
  let rects = '';
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    h = (Math.imul(h, 1103515245) + 12345) >>> 0;
    const f = inF(x, y); let on;
    if (f) { const dx = x - f[0]; const dy = y - f[1]; on = dx === 0 || dy === 0 || dx === 6 || dy === 6 || (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4); } else on = (h >>> 16) % 2 === 0;
    if (on) rects += `<rect x="${x}" y="${y}" width="1.02" height="1.02"/>`;
  }
  return `<svg class="qr" viewBox="-1 -1 ${n + 2} ${n + 2}" role="img" aria-label="QR"><rect x="-1" y="-1" width="${n + 2}" height="${n + 2}" fill="#fff"/><g fill="#1D1D1F">${rects}</g></svg>`;
}

/* ------------------------------------------------------------------ reveal + count-up */
const io = 'IntersectionObserver' in window ? new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { reveal(e.target); io.unobserve(e.target); } }), { threshold: 0.12, rootMargin: '0px 0px -6% 0px' }) : null;
function reveal(el) {
  el.classList.add('in');
  const nums = el.matches('[data-count]') ? [el] : $$('[data-count]', el);
  nums.forEach(runCount);
}
function runCount(el) {
  if (el.dataset.done) return; el.dataset.done = '1';
  const to = Number(el.dataset.count); const fmt = el.dataset.fmt; const from = Number(el.dataset.from || 0);
  if (reduceMotion || !Number.isFinite(to)) { el.textContent = formatCount(to, fmt); return; }
  const t0 = performance.now(); const dur = Number(el.dataset.dur || 1300);
  const step = (now) => { const p = Math.min(1, (now - t0) / dur); const e = 1 - Math.pow(1 - p, 4); el.textContent = formatCount(from + (to - from) * e, fmt); if (p < 1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
}
// animate=false: show final state immediately (re-render of the same page).
function armReveals(root, animate = true) {
  $$('.rv', root).forEach((el) => { if (!animate || !io || reduceMotion) { el.classList.add('in'); $$('[data-count]', el).forEach((n) => { n.dataset.done = '1'; }); } else io.observe(el); });
  $$('[data-count]', root).forEach((el) => { if (el.closest('.rv')) return; if (!animate || !io) { el.dataset.done = '1'; } else io.observe(el); });
}

/* ------------------------------------------------------------------ sheet (morphs from the tapped card, like iOS) */
const EASE = 'cubic-bezier(.32,.72,0,1)';
let sheetOrigin = null; let sheetBusy = false; let sheetRender = null; let sheetLastFocus = null;
function morph(sheet, from, to, dur) {
  const f = sheet.getBoundingClientRect();
  const tf = (r) => `translate(${r.left - f.left}px, ${r.top - f.top}px) scale(${Math.max(0.02, r.width / f.width)}, ${Math.max(0.02, r.height / f.height)})`;
  const a = sheet.animate([{ transform: from ? tf(from) : 'none', opacity: from ? 0.4 : 1 }, { transform: to ? tf(to) : 'none', opacity: to ? 0 : 1 }], { duration: dur, easing: EASE, fill: 'forwards' });
  return Promise.race([a.finished, new Promise((r) => setTimeout(r, dur + 120))]);
}
async function openSheet(renderFn, origin) {
  if (sheetBusy) return;
  const sheet = $('#sheet'); sheetBusy = true; sheetRender = renderFn;
  sheetLastFocus = document.activeElement;
  sheetOrigin = origin && origin.nodeType ? origin : null;
  $('#sheetBody').innerHTML = renderFn(); $('#sheetBody').scrollTop = 0;
  armReveals($('#sheetBody'), true);
  sheet.getAnimations().forEach((a) => a.cancel());
  sheet.classList.add('on', 'morph'); $('#scrim').classList.add('on'); document.body.classList.add('locked');
  if (!reduceMotion && sheetOrigin) await morph(sheet, sheetOrigin.getBoundingClientRect(), null, 560);
  sheet.classList.remove('morph'); $('#sheetClose').focus({ preventScroll: true }); sheetBusy = false;
}
function refreshSheet() {
  if (!$('#sheet').classList.contains('on') || !sheetRender) return;
  $('#sheetBody').innerHTML = sheetRender(); armReveals($('#sheetBody'), false);
}
function swapSheet(renderFn) {
  sheetRender = renderFn; const body = $('#sheetBody');
  body.classList.add('swap');
  setTimeout(() => { body.innerHTML = renderFn(); body.scrollTop = 0; armReveals(body, true); body.classList.remove('swap'); }, 160);
}
async function closeSheet() {
  const sheet = $('#sheet');
  if (!sheet.classList.contains('on') || sheetBusy) return;
  sheetBusy = true; $('#scrim').classList.remove('on'); sheet.classList.add('morph');
  const back = sheetOrigin && document.contains(sheetOrigin) ? sheetOrigin.getBoundingClientRect() : null;
  if (!reduceMotion && back && back.width) await morph(sheet, null, back, 420);
  sheet.classList.remove('on', 'morph'); sheet.getAnimations().forEach((a) => a.cancel());
  document.body.classList.remove('locked'); sheetRender = null;
  if (sheetLastFocus) sheetLastFocus.focus?.({ preventScroll: true });
  sheetBusy = false;
}

function toast(msg, tone = '') {
  const el = document.createElement('div');
  el.className = `toast ${tone}`; el.setAttribute('role', 'status'); el.innerHTML = msg;
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add('on'));
  setTimeout(() => { el.classList.remove('on'); setTimeout(() => el.remove(), 400); }, 3000);
}

// Small celebratory burst from an element (settlement, booking).
function burst(el) {
  if (reduceMotion || !el) return;
  const r = el.getBoundingClientRect(); const cols = Object.values(COLORS);
  for (let i = 0; i < 26; i++) {
    const p = document.createElement('i'); p.className = 'confetti';
    p.style.cssText = `left:${r.left + r.width / 2}px;top:${r.top + r.height / 2}px;background:${cols[i % cols.length]}`;
    document.body.appendChild(p);
    const a = (Math.PI * 2 * i) / 26 + Math.random() * 0.4; const d = 80 + Math.random() * 120;
    p.animate([{ transform: 'translate(-50%,-50%) scale(1)', opacity: 1 }, { transform: `translate(${Math.cos(a) * d}px, ${Math.sin(a) * d + 60}px) rotate(${Math.random() * 540}deg) scale(.6)`, opacity: 0 }], { duration: 900 + Math.random() * 500, easing: 'cubic-bezier(.2,.7,.2,1)' }).onfinish = () => p.remove();
    setTimeout(() => p.remove(), 1800);
  }
}
