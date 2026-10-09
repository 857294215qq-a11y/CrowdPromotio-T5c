/* ================================================================== router, nav, actions, boot */

const ROUTES = [
  [/^#\/?$/, 'site', () => siteView()],
  [/^#\/e\/([\w-]+)$/, 'site', () => siteView()],
  [/^#\/me$/, 'me', () => meView()],
  [/^#\/studio\/?$/, 'studio', () => studioOverview()],
  [/^#\/studio\/activities$/, 'studio', () => studioActivities()],
  [/^#\/studio\/edition\/([\w-]+)$/, 'studio', (m) => studioEdition(m[1])],
  [/^#\/studio\/create$/, 'studio', () => studioCreate()],
  [/^#\/studio\/payouts$/, 'studio', () => studioPayouts()],
  [/^#\/studio\/referrals$/, 'studio', () => studioReferrals()],
  [/^#\/studio\/requests$/, 'studio', () => studioRequests()],
  [/^#\/studio\/venue$/, 'studio', () => studioVenue()],
  [/^#\/studio\/new-venue$/, 'studio', () => studioNewVenue()],
];
const SECTIONS = ['explore', 'map', 'money', 'network', 'projects', 'organise'];
let lastHash = null; let forceAnimate = false; let pendingSection = null; let netIntro = true; let dropMap = false;

function render() {
  const hash = location.hash || '#/';
  const route = ROUTES.find(([re]) => re.test(hash)) || ROUTES[0];
  const [re, name, view] = route;
  const same = hash === lastHash; const animate = !same || forceAnimate;
  lastHash = hash; forceAnimate = false;
  if (name === 'site') netIntro = !same;
  const app = $('#app');
  // keep the live map element across re-renders of the same page
  let keepMap = null;
  if (same && !dropMap && name === 'site' && map) { keepMap = $('#leaflet'); keepMap?.remove(); }
  if (dropMap && map) { map.remove(); map = null; }
  dropMap = false;
  const active = document.activeElement; const host = active?.name ? active.closest('[data-live]') : null;
  const focusSel = host ? `[data-live="${host.dataset.live}"] [name="${active.name}"]` : null;
  try { app.innerHTML = view(hash.match(re)); } catch (err) { console.error(err); app.innerHTML = `<div class="wrap hero"><h2>${t('error')}</h2><pre class="small">${esc(err.message)}</pre><button class="btn" data-act="reset">${t('reset_data')}</button></div>`; }
  if (keepMap) $('#leaflet')?.replaceWith(keepMap);
  if (focusSel) app.querySelector(focusSel)?.focus();
  document.body.dataset.view = name;
  armReveals(app, animate);
  updateNav(name);
  if (name === 'site') { if (keepMap) map.invalidateSize(); else initMap(); observeSections(); }
  if (!same) {
    if (pendingSection) { const id = pendingSection; pendingSection = null; requestAnimationFrame(() => $(`#${id}`)?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' })); } else window.scrollTo(0, 0);
    const m = hash.match(/^#\/e\/([\w-]+)$/); if (m && state.editions[m[1]]) setTimeout(() => openSheet(() => sheetEdition(m[1])), 300);
  }
}

function updateNav(name) {
  $('#navLinks').innerHTML = name === 'site'
    ? SECTIONS.map((id) => `<a href="#/" data-sec="${id}">${t(`nav_${id}`)}</a>`).join('')
    : `<a href="#/">${t('nav_home')}</a>${name === 'studio' ? `<a class="on" href="#/studio">Studio</a>` : `<a class="on" href="#/me">${t('my_tickets')}</a>`}`;
  $('#fabMenu').innerHTML = `${SECTIONS.map((id) => `<a href="#/" data-sec="${id}">${t(`nav_${id}`)}</a>`).join('')}<a href="#/me">${t('my_tickets')}</a><a href="#/studio">Studio</a>`;
  $('#navStudio').classList.toggle('on', name === 'studio');
  $('#navMe').classList.toggle('on', name === 'me');
  $('#navStudio span').textContent = 'Studio';
  $('#navMe').setAttribute('aria-label', t('my_tickets'));
}

let secIO = null;
function observeSections() {
  secIO?.disconnect();
  secIO = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) $$('#navLinks a, #fabMenu a').forEach((a) => a.classList.toggle('on', a.dataset.sec === e.target.id)); }), { rootMargin: '-45% 0px -50% 0px' });
  SECTIONS.forEach((id) => { const el = $(`#${id}`); if (el) secIO.observe(el); });
}

/* ------------------------------------------------------------------ language */
function setLang(l) {
  lang = ['en', 'zh', 'es'].includes(l) ? l : 'en';
  document.documentElement.lang = { en: 'en', zh: 'zh-CN', es: 'es' }[lang];
  document.documentElement.dataset.lang = lang;
  $$('.seg button').forEach((b) => b.setAttribute('aria-pressed', b.dataset.lang === lang));
  try { localStorage.setItem('crowdpromo-lang', lang); } catch (e) { /* ignore */ }
  document.title = t('doc_title');
  moveThumb();
}
function moveThumb() {
  const on = $('.seg button[aria-pressed="true"]'); const th = $('.seg .thumb');
  if (on && th) { th.style.left = `${on.offsetLeft}px`; th.style.width = `${on.offsetWidth}px`; }
}

/* ------------------------------------------------------------------ actions */
const goto = (h) => { if (location.hash === h) render(); else location.hash = h; };
const refresh = () => update(() => {});
function lockReferral(s) { const me = s.people[ME]; if (!me.referralLockedAt) { me.uplineId = me.invitedBy; me.referralLockedAt = TODAY; } }

Object.assign(actions, {
  // public site
  filter: (el) => { exploreFilter = el.dataset.id; refresh(); },
  'map-fly': (el) => {
    const m = mapLayers[`${el.dataset.type}:${el.dataset.id}`]; if (!m || !map) return;
    if (innerWidth < 1001) $('#leaflet').scrollIntoView({ behavior: 'smooth', block: 'center' });
    map.flyTo(m.getLatLng(), 15, { duration: 1.1 }); setTimeout(() => m.openPopup(), 1150);
  },
  story: (el) => { netFocus = null; netStory = netStory === el.dataset.id ? null : el.dataset.id; netIntro = false; redrawNet(); $$('[data-act="story"]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.id === netStory)); },
  net: (el) => { netStory = null; netFocus = netFocus === el.dataset.id ? null : el.dataset.id; netIntro = false; redrawNet(); $$('[data-act="story"]').forEach((b) => b.setAttribute('aria-pressed', 'false')); },
  donate: (el) => { const id = el.dataset.id; if ($('#sheet').classList.contains('on')) swapSheet(() => sheetDonate(id)); else openSheet(() => sheetDonate(id), el); },
  amt: (el) => { donateAmt = Number(el.dataset.v); refreshSheet(); },
  paym: (el) => { payMethod = el.dataset.v; refreshSheet(); },
  'do-donate': (el) => {
    const id = el.dataset.id; el.classList.add('loading'); el.disabled = true;
    setTimeout(() => {
      update((s) => s.donations.push({ id: uid('d'), projectId: id, donor: ME_NAME, cents: donateAmt, date: TODAY }));
      swapSheet(() => `<div class="sh-pad center"><div class="okmark">${icon('check')}</div><h2>${t('thanks_h')}</h2><p class="intro">${t('thanks_p', { a: money0(donateAmt), p: state.projects[id].name })}</p></div>`);
      setTimeout(() => burst($('#sheet .okmark')), 260);
    }, 800);
  },
  'project-detail': (el) => openSheet(() => sheetProject(el.dataset.id), el),
  propose: (el) => openSheet(sheetPropose, el),
  'open-ed': (el) => swapSheet(() => sheetEdition(el.dataset.id)),
  checkout: (el) => { checkoutQty = 1; swapSheet(() => sheetCheckout(el.dataset.id)); },
  qty: (el) => { checkoutQty += Number(el.dataset.v); refreshSheet(); },
  pay: (el) => {
    const id = el.dataset.id; el.classList.add('loading'); el.disabled = true;
    setTimeout(() => {
      const ed = state.editions[id]; const act = activityOf(state, ed);
      if (ed.status !== 'scheduled' || bookings(ed) + checkoutQty > act.capacity) { toast(t('sold_out'), 'bad'); swapSheet(() => sheetEdition(id)); return; }
      update((s) => { const e = s.editions[id]; const m = e.attendees.filter((x) => x.startsWith(ME_NAME)).length; for (let j = 0; j < checkoutQty; j++) e.attendees.push(m + j === 0 ? ME_NAME : `${ME_NAME} +${m + j}`); });
      swapSheet(() => sheetTicket(id, true));
      setTimeout(() => burst($('#sheet .okmark')), 260);
    }, 900);
  },
  'show-ticket': (el) => { const id = el.dataset.id; if ($('#sheet').classList.contains('on')) swapSheet(() => sheetTicket(id)); else openSheet(() => sheetTicket(id), el); },
  close: (el) => { closeSheet(); const h = el.getAttribute('href'); if (h) setTimeout(() => goto(h), 300); },
  'co-organise': (el) => {
    update((s) => { s.editions[el.dataset.id].coOrganiserId = ME; lockReferral(s); const me = s.people[ME]; if (me.stage === 'attendee') me.stage = 'coorganiser'; me.isPromoter = true; });
    toast(t('coorg_toast'), 'ok'); burst(el);
  },
  'start-own': (el) => {
    update((s) => {
      const from = s.activities[el.dataset.id]; const tp = s.templates[from.templateId];
      lockReferral(s); const me = s.people[ME]; me.stage = 'promoter'; me.isPromoter = true;
      s.session.account = `person:${ME}`;
      startDraft(s, { promoterId: ME, fromActivityId: from.id, templateId: tp.id, step: 2, title: `${tx(tp.name)} · ${me.name}`, priceCents: from.priceCents, capacity: tp.defaultCapacity, minBookings: tp.defaultMin, projectId: from.projectId, recurrence: from.recurrence });
    });
    goto('#/studio/create');
  },
  reset: () => { if (window.confirm(t('reset_confirm'))) { closeSheet(); dropMap = true; resetState(); toast(t('reset_done')); } },

  // studio
  'acct-menu': (el) => el.closest('.acct').classList.toggle('open'),
  acct: (el) => {
    venueDraft = null; ledgerFilter = 'all';
    update((s) => { s.session.account = el.dataset.id; });
    if (el.dataset.then) goto(el.dataset.then);
    else if (/edition|requests|venue$/.test(location.hash)) goto('#/studio');
  },
  go: (el) => goto(el.dataset.href),
  scan: (el) => {
    const ed = state.editions[el.dataset.id]; const next = ed.attendees.find((n) => !ed.checkins.includes(n));
    if (!next) { toast(t('all_checked')); return; }
    update((s) => s.editions[ed.id].checkins.push(next));
    $('.scanner')?.classList.add('hit'); toast(`${icon('check')} ${esc(next)}`, 'ok');
  },
  checkin: (el) => update((s) => { const ed = s.editions[el.dataset.id]; const n = el.dataset.name; ed.checkins = ed.checkins.includes(n) ? ed.checkins.filter((x) => x !== n) : [...ed.checkins, n]; }),
  complete: (el) => {
    const ed = state.editions[el.dataset.id];
    if (!ed.checkins.length) { toast(t('verify_first'), 'bad'); return; }
    const total = editionSplit(state, ed).check; burst(el); forceAnimate = true;
    update((s) => { const e = s.editions[ed.id]; e.status = 'completed'; e.completedAt = TODAY; });
    toast(t('settled_toast', { a: money(total) }), 'ok');
  },
  withdraw: (el) => {
    const key = state.session.account; const bal = balanceOf(state, key); if (bal.available <= 0) return;
    const id = uid('po'); burst(el); forceAnimate = true;
    update((s) => s.payouts.push({ id, account: key, cents: bal.available, date: TODAY, status: 'processing' }));
    toast(t('withdraw_toast', { a: money(bal.available) }), 'ok');
    setTimeout(() => update((s) => { const p = s.payouts.find((x) => x.id === id); if (p) p.status = 'paid'; }), 2200);
  },
  lfilter: (el) => { ledgerFilter = el.dataset.id; refresh(); },
  copy: (el) => { navigator.clipboard?.writeText(el.dataset.v).catch(() => {}); toast(t('copied'), 'ok'); },
  'req-accept': (el) => {
    update((s) => {
      const r = s.requests[el.dataset.id]; const act = s.activities[r.activityId]; const ed = s.editions[r.editionId];
      r.status = 'accepted'; act.status = 'active'; ed.status = 'scheduled';
    });
    burst(el); toast(t('accepted_toast'), 'ok');
  },
  'req-decline': (el) => { update((s) => { const r = s.requests[el.dataset.id]; r.status = 'declined'; s.activities[r.activityId].status = 'declined'; s.editions[r.editionId].status = 'declined'; }); toast(t('declined_toast')); },
  'req-changes': (el) => openSheet(() => `<div class="sh-pad"><p class="lab">${t('requests')}</p><h2>${t('propose_changes')}</h2><form class="form" data-form="req-reply" data-id="${el.dataset.id}"><label>${t('message_h')}<textarea name="text" rows="3" required>${t('changes_default')}</textarea></label><button class="btn btn-ink btn-block">${t('send')}</button></form></div>`, el),
  'wiz-go': (el) => update((s) => { s.wizard.step = Number(el.dataset.step); }),
  'wiz-reset': () => update((s) => startDraft(s)),
  'wiz-template': (el) => update((s) => { const d = s.wizard; const tp = s.templates[el.dataset.id]; if (d.templateId !== tp.id) Object.assign(d, { title: '', priceCents: 0, capacity: 0, minBookings: 0 }); applyTemplate(d, tp, s); d.step = 2; }),
  'wiz-venue': (el) => update((s) => { const d = s.wizard; const v = s.venues[el.dataset.id]; d.venueId = v.id; d.capacity = Math.min(d.capacity, v.capacity); d.minBookings = Math.max(d.minBookings, v.minAttendance); d.date = null; d.step = 3; }),
  'wiz-project': (el) => update((s) => { s.wizard.projectId = el.dataset.id; s.wizard.step = 4; }),
  'wiz-send': (el) => {
    const s = state; const d = s.wizard; const v = s.venues[d.venueId];
    if (!d.title || d.priceCents <= 0 || d.minBookings > d.capacity || d.capacity > v.capacity) { toast(t('check_fields'), 'bad'); return; }
    const actId = uid('act'); const edId = uid('e'); const reqId = uid('req'); const day = WEEKDAYS[dow(d.date)];
    const slot = v.slots.find((x) => x.day === day) || v.slots[0];
    update((st) => {
      const tp = st.templates[d.templateId];
      st.activities[actId] = { id: actId, title: d.title, templateId: d.templateId, promoterId: d.promoterId, venueId: d.venueId, projectId: d.projectId, priceCents: d.priceCents, capacity: d.capacity, minBookings: d.minBookings, recurrence: d.recurrence, day, time: `${slot.from}–${slot.to}`, status: 'pending', included: v.services.slice(0, 2), description: { en: `${tx(tp.name)} at ${v.name}.`, zh: `在 ${v.name} 举办的${tp.name.zh}。`, es: `${tp.name.es} en ${v.name}.` } };
      st.editions[edId] = { id: edId, activityId: actId, editionNo: 1, date: d.date, status: 'pending', attendees: [], checkins: [], coOrganiserId: null, messages: [], completedAt: null };
      st.requests[reqId] = { id: reqId, activityId: actId, editionId: edId, venueId: d.venueId, status: 'pending', sent: TODAY, note: '', reply: '' };
      st.wizard.requestId = reqId;
    });
    toast(t('request_sent', { v: v.name }), 'ok');
  },
});

// <form data-form> submissions
const forms = {
  propose: (f) => {
    const d = new FormData(f); const id = uid('proj');
    update((s) => { s.projects[id] = { id, name: d.get('name').trim(), cause: d.get('cause').trim(), goalCents: Math.round(Number(d.get('goal')) * 100), status: 'pending', color: '#86868B', img: 'workshop', tags: [], org: d.get('org').trim(), description: d.get('cause').trim() }; });
    closeSheet(); toast(t('submitted_review'), 'ok');
  },
  message: (f) => { const text = new FormData(f).get('text').trim(); if (!text) return; update((s) => { const ed = s.editions[f.dataset.id]; ed.messages.push({ text, to: ed.attendees.length }); }); toast(t('message_sent'), 'ok'); },
  'wiz-propose': (f) => { const d = new FormData(f); const id = uid('proj'); update((s) => { s.projects[id] = { id, name: d.get('name').trim(), cause: d.get('cause').trim(), goalCents: Math.round(Number(d.get('goal')) * 100), status: 'pending', color: '#86868B', img: 'workshop', tags: [], description: d.get('cause').trim(), proposedBy: s.wizard.promoterId }; s.wizard.projectId = id; }); toast(t('submitted_review'), 'ok'); },
  'venue-new': (f) => {
    const d = readVenueForm(f);
    if (!d.name || !Object.keys(d.slots).length) { toast(t('venue_need'), 'bad'); return; }
    if (d.minAttendance > d.capacity) { toast(t('w_minmax'), 'bad'); return; }
    const id = uid('venue');
    update((s) => { s.venues[id] = { id, owner: d.name, ...venueFromDraft(d) }; s.session.account = `venue:${id}`; });
    venueDraft = null; toast(t('venue_live', { v: d.name }), 'ok'); goto('#/studio');
  },
  'venue-save': (f) => {
    const d = readVenueForm(f); const id = acct().id;
    if (!d.name || !Object.keys(d.slots).length) { toast(t('venue_need'), 'bad'); return; }
    update((s) => { s.venues[id] = { ...s.venues[id], ...venueFromDraft(d, s.venues[id]) }; });
    venueDraft = null; toast(t('saved'), 'ok');
  },
  'req-reply': (f) => { const text = new FormData(f).get('text').trim(); update((s) => { const r = s.requests[f.dataset.id]; r.status = 'changes'; r.reply = text; }); closeSheet(); toast(t('changes_sent'), 'ok'); },
};

// live inputs (no full re-render, keeps focus and slider drag)
const live = {
  'venue-draft': (f) => { venueDraft = readVenueForm(f); $$('.day', f).forEach((l) => l.classList.toggle('on', l.querySelector('input').checked)); $('#vprev').innerHTML = venuePreview(venueDraft); $$('#vprev .rv').forEach((x) => x.classList.add('in')); },
  'wiz-filter': (f) => { const d = new FormData(f); wizFilters = { hood: d.get('hood'), day: d.get('day') }; refresh(); },
  'wiz-fields': (f) => {
    const d = new FormData(f);
    patch((s) => { const w = s.wizard; w.title = d.get('title'); w.priceCents = Math.round(Number(d.get('price')) * 100) || 0; w.capacity = Number(d.get('capacity')) || 0; w.minBookings = Number(d.get('min')) || 0; w.date = d.get('date'); w.recurrence = d.get('recurrence'); w.costsCents = Math.round(Number(d.get('costs')) * 100) || 0; });
    $('#wcalc').innerHTML = wizCalc(state, state.wizard); $('#wcalc').classList.add('in');
  },
};
const ranges = {
  calc: (el) => {
    calc[el.name] = Number(el.value);
    $('#cv-price').textContent = money(calc.price); $('#cv-att').textContent = calc.att; $('#cv-lv').textContent = calc.levels;
    $('#flow').innerHTML = flowSvg(); $('#calc-out').innerHTML = calcOut();
  },
  cost: (el) => {
    const key = state.session.account; const a = accountInfo(state, key);
    patch((s) => { s.costs[key] = { ...(s.costs[key] || {}), [el.name]: Number(el.value) }; });
    const box = $('#profitbox'); const pr = profitOf(state, key); const c = costSettings(state, key);
    $('.chart.wf', box).outerHTML = waterfall(pr.revenue, pr.costs, [t('revenue'), t('costs'), a.type === 'venue' ? t('contribution') : t('profit')]);
    el.previousElementSibling.querySelector('b').textContent = el.name === 'hours' ? c.hours : money(Number(el.value));
    $('p.small', box).textContent = a.type === 'venue' ? t('profit_note_v') : t('profit_note_p', { h: money(pr.perHour) });
  },
};
function redrawNet() { $('#netsvg').innerHTML = networkSvg(state); $('#netside').innerHTML = netSide(state); armReveals($('#netside'), true); }

/* ------------------------------------------------------------------ events */
document.addEventListener('click', (e) => {
  if (!e.target.closest('.acct')) $$('.acct.open').forEach((a) => a.classList.remove('open'));
  if (!e.target.closest('#fab, #fabMenu')) $('#fabNav').classList.remove('open');
  const langBtn = e.target.closest('.seg button'); if (langBtn) { setLang(langBtn.dataset.lang); dropMap = true; render(); refreshSheet(); return; }
  const sec = e.target.closest('[data-sec]');
  if (sec) { e.preventDefault(); $('#fabNav').classList.remove('open'); const id = sec.dataset.sec; if (document.body.dataset.view === 'site') $(`#${id}`)?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' }); else { pendingSection = id; goto('#/'); } return; }
  const sc = e.target.closest('[data-scroll], [data-scroll-home]');
  if (sc) { e.preventDefault(); const id = sc.getAttribute('href').slice(1); if (document.body.dataset.view === 'site') $(`#${id}`)?.scrollIntoView({ behavior: 'smooth' }); else { pendingSection = id; goto('#/'); } return; }
  const op = e.target.closest('[data-open]');
  if (op) { e.preventDefault(); map?.closePopup(); const id = op.dataset.id; if ($('#sheet').classList.contains('on')) swapSheet(() => sheetEdition(id)); else openSheet(() => sheetEdition(id), op.closest('.leaflet-popup') ? null : op); return; }
  const el = e.target.closest('[data-act]');
  if (!el || el.tagName === 'INPUT' || el.disabled) return;
  const fn = actions[el.dataset.act];
  if (fn) { e.preventDefault(); fn(el, e); }
});
document.addEventListener('submit', (e) => { const f = e.target.closest('[data-form]'); if (!f) return; e.preventDefault(); forms[f.dataset.form]?.(f, e); });
document.addEventListener('input', (e) => {
  if (e.target.matches('input[type=range][data-act]')) { ranges[e.target.dataset.act]?.(e.target); return; }
  const f = e.target.closest('[data-live]'); if (f) live[f.dataset.live]?.(f, e);
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { closeSheet(); $$('.acct.open').forEach((a) => a.classList.remove('open')); }
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('g[data-act]')) { e.preventDefault(); actions[e.target.dataset.act]?.(e.target, e); }
});
$('#scrim').addEventListener('click', closeSheet);
$('#sheetClose').addEventListener('click', closeSheet);
$('#fab').addEventListener('click', () => $('#fabNav').classList.toggle('open'));
addEventListener('hashchange', () => { closeSheet(); render(); });
addEventListener('resize', moveThumb);
const navEl = $('.nav');
addEventListener('scroll', () => navEl.classList.toggle('scrolled', scrollY > 24), { passive: true });

/* ------------------------------------------------------------------ boot */
state = loadState(); maintain(state); saveState();
listeners.add(() => render());
let savedLang = null; try { savedLang = localStorage.getItem('crowdpromo-lang'); } catch (e) { /* ignore */ }
const nl = (navigator.language || 'en').slice(0, 2);
setLang(savedLang || (nl === 'zh' ? 'zh' : nl === 'es' ? 'es' : 'en'));
render();
document.fonts?.ready.then(moveThumb);
if (!window.L) { const lj = $('#leafletjs'); lj?.addEventListener('load', () => document.body.dataset.view === 'site' && initMap()); }
// keep the calendar current if the page stays open past midnight
setInterval(() => { if (isoOf(new Date()) !== TODAY) location.reload(); }, 60000);
