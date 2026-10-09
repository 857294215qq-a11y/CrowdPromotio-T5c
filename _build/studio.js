/* ================================================================== studio (business & organiser back office) */

let ledgerFilter = 'all';
let wizFilters = { hood: 'any', day: 'any' };
let venueDraft = null;
const HOODS = { Malasaña: [40.4262, -3.7038], Lavapiés: [40.4089, -3.7012], Chamberí: [40.4345, -3.7038], Chueca: [40.4229, -3.6973], 'La Latina': [40.4110, -3.7105], Tetuán: [40.4600, -3.6990], Arganzuela: [40.3990, -3.6990] };

const acct = () => accountInfo(state, state.session.account);
const isVenue = () => acct().type === 'venue';

function accounts(s) {
  return [
    ...Object.values(s.venues).map((v) => ({ key: `venue:${v.id}`, name: v.name, sub: tx(v.type), img: v.img || 'newVenue' })),
    ...promoters(s).map((p) => ({ key: `person:${p.id}`, name: p.name, sub: t('organiser'), person: p })),
  ];
}

function studioShell(active, body) {
  const s = state; const a = acct();
  const reqN = isVenue() ? Object.values(s.requests).filter((r) => r.venueId === a.id && (r.status === 'pending' || r.status === 'changes')).length : 0;
  const links = isVenue()
    ? [['', 'grid', t('overview')], ['activities', 'cal', t('activities')], ['requests', 'inbox', t('requests'), reqN], ['payouts', 'wallet', t('payouts')], ['venue', 'store', t('my_venue')]]
    : [['', 'grid', t('overview')], ['activities', 'cal', t('activities')], ['create', 'plus', t('create_activity')], ['payouts', 'wallet', t('payouts')], ['referrals', 'link', t('referrals')]];
  const accs = accounts(s);
  return `<div class="studio">
    <aside class="sbar glass">
      <div class="acct"><button class="acct-btn" data-act="acct-menu" aria-haspopup="true">${a.type === 'venue' ? photo(a.ref.img || 'newVenue', 'acct-ph') : avatar(a.ref, 'md')}<span><b>${esc(a.ref.name)}</b><small>${a.type === 'venue' ? t('business_ws') : t('organiser_ws')}</small></span><i class="chev"></i></button>
        <div class="acct-menu glass" id="acctMenu"><small>${t('venues')}</small>${accs.filter((x) => x.key.startsWith('venue')).map((x) => `<button data-act="acct" data-id="${x.key}" aria-pressed="${x.key === a.key}">${photo(x.img, 'acct-ph')}<span><b>${esc(x.name)}</b><small>${esc(x.sub)}</small></span></button>`).join('')}
          <small>${t('organisers')}</small>${accs.filter((x) => x.key.startsWith('person')).map((x) => `<button data-act="acct" data-id="${x.key}" aria-pressed="${x.key === a.key}">${avatar(x.person, 'md')}<span><b>${esc(x.name)}</b><small>${esc(x.sub)}</small></span></button>`).join('')}
          <a class="acct-new" href="#/studio/new-venue">${icon('plus')} ${t('list_venue')}</a></div></div>
      <nav class="snav">${links.map(([k, ic, l, badge]) => `<a href="#/studio${k ? `/${k}` : ''}" class="${active === k ? 'on' : ''}">${icon(ic)}<span>${l}</span>${badge ? `<em>${badge}</em>` : ''}</a>`).join('')}</nav>
      <a class="snav-out" href="#/">${icon('back')} ${t('back_to_site')}</a>
    </aside>
    <div class="smain">${body}</div></div>`;
}

const card = (title, body, extra = '', cls = '') => `<div class="scard rv ${cls}"><div class="scard-h"><h3>${title}</h3>${extra}</div>${body}</div>`;
const kpi = (label, value, note = '', cls = '') => `<div class="kpi2 rv ${cls}"><span>${label}</span><b>${value}</b>${note ? `<small>${note}</small>` : ''}</div>`;

/* ------------------------------------------------------------------ overview */
function studioOverview() {
  const s = state; const a = acct(); const key = a.key;
  const bal = balanceOf(s, key); const pr = profitOf(s, key); const series = weeklySeries(s, key);
  const rows = accountLedger(s, key);
  const ups = rows.filter((r) => r.kind === 'Expected').map((r) => r.ed).filter((e, i, arr) => arr.indexOf(e) === i).sort((x, y) => x.date.localeCompare(y.date));
  const head = `<div class="shead rv"><div><p class="kicker">${a.type === 'venue' ? t('business_ws') : t('organiser_ws')}</p><h1>${t('hello', { n: a.type === 'venue' ? a.ref.owner || a.ref.name : a.ref.name })}</h1><p class="muted">${t('ov_sub', { d: fmtDate(TODAY, { weekday: 'long', day: 'numeric', month: 'long' }) })}</p></div>
    ${a.type === 'venue' ? `<a class="btn" href="#/studio/requests">${icon('inbox')} ${t('requests')}</a>` : `<a class="btn btn-ink" href="#/studio/create">${icon('plus')} ${t('create_activity')}</a>`}</div>`;
  const kpis = `<div class="kpis2">
    ${kpi(t('available'), count(bal.available, 'money'), `<button class="linkbtn" data-act="go" data-href="#/studio/payouts">${t('withdraw')} →</button>`, 'dark')}
    ${kpi(t('transferred_all'), count(bal.transferred, 'money0'), kindTag('Transferred'))}
    ${kpi(t('expected_up'), count(bal.expected, 'money0'), kindTag('Expected'))}
    ${a.type === 'venue' ? kpi(t('contribution'), count(pr.profit, 'money0'), t('after_costs')) : kpi(t('net_per_hour'), count(pr.perHour, 'money'), t('hours_worked', { h: num(pr.hours || 0) }))}</div>`;
  const chart = card(t('weekly_earnings'), `<div class="chartbox">${barChart(series)}</div><div class="clegend"><span><i class="bt"></i>${t('transferred')}</span><span><i class="be"></i>${t('expected')}</span><span><i class="cw"></i>${t('this_week')}</span></div>`, '', 'span2');
  const profit = card(t('profit_h'), `<div id="profitbox">${profitBox(s, key)}</div>`, `<span class="hint">${t('profit_hint')}</span>`);
  const upc = card(t('next_up'), ups.length ? `<div class="ulist">${ups.slice(0, 5).map((e) => { const act = activityOf(s, e); return `<a class="urow" href="#/studio/edition/${e.id}">${ring(bookings(e) / act.capacity, `${bookings(e)}`, `/${act.capacity}`, bookings(e) >= act.minBookings ? '#1E9E61' : '#FF7A1A', 64)}<span><b>${esc(tx(act.title))}</b><small>${fmtDate(e.date)} · ${esc(act.time)}</small>${statusPill(s, e)}</span></a>`; }).join('')}</div>` : `<p class="empty">${t('nothing_here')}</p>`);
  let extra = '';
  if (a.type === 'venue') {
    const done = rows.filter((r) => r.kind === 'Transferred').map((r) => r.ed).sort((x, y) => x.date.localeCompare(y.date));
    let cum = 0; const vis = done.map((e) => (cum += bookings(e)));
    const slots = a.ref.slots.map((sl) => { const used = new Set(done.filter((e) => activityOf(s, e).day === sl.day && daysUntil(e.date) >= -56).map((e) => e.date)).size; return { sl, used }; });
    const hosts = [...new Set(rows.map((r) => r.act.promoterId))].map((pid) => ({ p: s.people[pid], c: sum(rows.filter((r) => r.act.promoterId === pid && r.kind === 'Transferred'), (r) => r.line.cents) }));
    extra = card(t('visitors_h'), `<div class="bignum">${count(cum, 'num')}<small>${t('visitors_sub', { n: num(Math.round(cum * 0.6)) })}</small></div>${areaChart(vis.length > 1 ? vis : [0, cum], '#1F5BFF')}`)
      + card(t('slots_h'), `<div class="rings">${slots.map(({ sl, used }) => `<div>${ring(used / 8, `${Math.round((used / 8) * 100)}%`, '', '#1F5BFF', 84)}<small>${dayName(sl.day)} ${sl.from}–${sl.to}</small></div>`).join('')}</div><p class="small muted">${t('slots_p')}</p>`)
      + card(t('hosted_h'), `<div class="ulist">${hosts.map((h) => `<div class="urow">${avatar(h.p, 'md')}<span><b>${esc(h.p.name)}</b><small>${t('transferred')}: ${money(h.c)}</small></span></div>`).join('')}</div>`);
  } else {
    const mix = {}; rows.forEach((r) => { const k = r.line.key === 'referral' ? 'referral' : r.line.key; mix[k] = (mix[k] || 0) + r.line.cents; });
    const sl = Object.entries(mix).map(([k, c]) => ({ label: t(`mix_${k}`), sub: '', cents: c, color: COLORS[k] }));
    const acts = Object.values(s.activities).filter((x) => x.promoterId === a.id && x.status === 'active');
    extra = card(t('mix_h'), `<div class="mix"><div class="dwrap sm">${donut(sl, money0(sum(sl, (x) => x.cents)), t('total'))}</div>${legend(sl)}</div>`)
      + card(t('perf_h'), acts.length ? `<div class="perf">${acts.map((x) => { const eds = editionsOf(s, x.id).filter((e) => e.status === 'completed'); const avg = eds.length ? sum(eds, bookings) / eds.length : 0; const earned = sum(rows.filter((r) => r.act.id === x.id && r.kind === 'Transferred'), (r) => r.line.cents); return `<div class="prow">${photo(s.templates[x.templateId].img, 'sm')}<span><b>${esc(tx(x.title))}</b><small>${t('n_editions', { n: eds.length })} · ${t('avg_att_n', { n: Math.round(avg) })}</small><div class="hbar"><b style="--w:${clamp((avg / x.capacity) * 100, 0, 100)}%"></b></div></span><b class="num">${money0(earned)}</b></div>`; }).join('')}</div>` : `<p class="empty">${t('nothing_here')}</p>`, '', 'span2');
  }
  return studioShell('', `${head}${kpis}<div class="sgrid">${chart}${profit}${upc}${extra}</div>`);
}

function profitBox(s, key) {
  const a = accountInfo(s, key); const c = costSettings(s, key); const pr = profitOf(s, key);
  const labels = [t('revenue'), t('costs'), a.type === 'venue' ? t('contribution') : t('profit')];
  const sliders = a.type === 'venue'
    ? `<div class="rng light"><label>${t('cost_per_att')} <b>${money(c.perAttendee)}</b></label><input type="range" min="0" max="1500" step="10" value="${c.perAttendee}" data-act="cost" name="perAttendee"></div>
       <div class="rng light"><label>${t('fixed_cost')} <b>${money(c.fixed)}</b></label><input type="range" min="0" max="10000" step="100" value="${c.fixed}" data-act="cost" name="fixed"></div>`
    : `<div class="rng light"><label>${t('own_costs')} <b>${money(c.perEdition)}</b></label><input type="range" min="0" max="3000" step="50" value="${c.perEdition}" data-act="cost" name="perEdition"></div>
       <div class="rng light"><label>${t('hours_per_ed')} <b>${c.hours ?? t('by_format')}</b></label><input type="range" min="1" max="8" step="0.5" value="${c.hours ?? 3}" data-act="cost" name="hours"></div>`;
  return `${waterfall(pr.revenue, pr.costs, labels)}${sliders}<p class="small muted">${a.type === 'venue' ? t('profit_note_v') : t('profit_note_p', { h: money(pr.perHour) })}</p>`;
}

/* ------------------------------------------------------------------ activities */
function myActs(s) {
  const a = acct();
  if (a.type === 'venue') return Object.values(s.activities).filter((x) => x.venueId === a.id && x.status !== 'declined');
  const co = new Set(Object.values(s.editions).filter((e) => e.coOrganiserId === a.id).map((e) => e.activityId));
  return Object.values(s.activities).filter((x) => (x.promoterId === a.id || co.has(x.id)) && x.status !== 'declined');
}
function studioActivities() {
  const s = state; const acts = myActs(s);
  const body = acts.length ? acts.map((x, i) => {
    const eds = editionsOf(s, x.id).filter((e) => e.status !== 'declined'); const v = s.venues[x.venueId]; const p = s.projects[x.projectId];
    const shown = [...eds.filter((e) => e.status !== 'completed' && e.status !== 'cancelled'), ...eds.filter((e) => e.status === 'completed' || e.status === 'cancelled').slice(-3).reverse()];
    return `<div class="actblock rv" style="--i:${i}"><div class="ab-head">${photo(s.templates[x.templateId].img, 'ab-ph')}<div><h3>${esc(tx(x.title))}</h3><p class="muted small">${esc(v.name)} · ${dayName(x.day)} ${esc(x.time)} · ${money(x.priceCents)} · ${t(`rec_${x.recurrence.replace(/\W/g, '')}`)}</p><span class="tagp" style="--c:${p.color}">${esc(p.name)}${p.status !== 'verified' ? ` · ${t('pending_review')}` : ''}</span>${x.promoterId !== acct().id && acct().type === 'person' ? ` <span class="pill p-ok">${t('coorg_on')}</span>` : ''}</div></div>
      <div class="timeline">${eds.map((e) => `<i class="tl-${edStatus(s, e).tone}" title="${fmtDate(e.date)} · ${t(`st_${edStatus(s, e).key}`)}"></i>`).join('')}</div>
      <div class="erows">${shown.map((e) => { const n = bookings(e); return `<a class="erow" href="#/studio/edition/${e.id}"><span class="ed-d"><b>${fmtDate(e.date, { day: 'numeric' })}</b>${fmtDate(e.date, { month: 'short' })}</span><span class="ed-m"><span class="row">${t('edition_n', { n: e.editionNo })} ${statusPill(s, e)}</span>${e.status === 'scheduled' ? progress(n, x.capacity, x.minBookings) : ''}<small>${t('booked_n', { n })}${e.status === 'completed' ? ` · ${t('checked_n', { n: e.checkins.length })}` : ` · ${t('min_n', { n: x.minBookings })}`}</small></span><b class="num">${money0(salesOf(s, e))}</b></a>`; }).join('')}</div></div>`;
  }).join('') : `<div class="scard"><p class="empty">${t('no_activities')}</p>${isVenue() ? '' : `<a class="btn btn-ink" href="#/studio/create">${t('create_activity')}</a>`}</div>`;
  return studioShell('activities', `<div class="shead rv"><div><h1>${t('activities')}</h1><p class="muted">${t('activities_sub')}</p></div></div>${body}`);
}

function studioEdition(id) {
  const s = state; const ed = s.editions[id];
  if (!ed) return studioShell('activities', `<p class="empty">${t('nothing_here')}</p>`);
  const act = activityOf(s, ed); const v = s.venues[act.venueId]; const split = editionSplit(s, ed); const kind = moneyKind(ed);
  const n = bookings(ed); const done = ed.status === 'completed'; const until = daysUntil(ed.date);
  const canEdit = ed.status === 'scheduled';
  const statusCard = ed.status === 'scheduled' ? card(t('safety_h'), `<div class="safety">${ring(n / act.capacity, `${n}`, `/${act.capacity}`, n >= act.minBookings ? '#1E9E61' : '#FF7A1A', 120)}<div><p>${n >= act.minBookings ? t('safety_ok') : t('safety_warn', { n: act.minBookings - n, d: Math.max(0, until - 2) })}</p>${progress(n, act.capacity, act.minBookings)}<small class="muted">${t('min_n', { n: act.minBookings })} · ${t('cap_n', { n: act.capacity })}</small></div></div>`) : '';
  const checkin = card(t('checkin_h'), `${canEdit && n ? `<div class="scanner"><div class="sc-frame">${qr(ed.id)}<span class="sc-line"></span></div><div><p class="small muted">${t('scan_p')}</p><button class="btn btn-ink" data-act="scan" data-id="${ed.id}">${icon('scan')} ${t('scan_next')}</button></div></div>` : ''}
    ${n ? `<div class="alist2">${ed.attendees.map((nm) => { const on = ed.checkins.includes(nm); return `<button class="att ${on ? 'on' : ''}" data-act="checkin" data-id="${ed.id}" data-name="${esc(nm)}" ${canEdit ? '' : 'disabled'}><span class="ck">${icon('check')}</span>${esc(nm)}</button>`; }).join('')}</div>` : `<p class="empty">${t('no_bookings')}</p>`}`, `<span class="hint num">${ed.checkins.length}/${n}</span>`);
  const msgs = card(t('message_h'), `<form class="msgf" data-form="message" data-id="${ed.id}"><input name="text" placeholder="${t('message_ph')}" ${canEdit ? '' : 'disabled'}><button class="btn btn-ink" ${canEdit ? '' : 'disabled'}>${icon('send')}</button></form>${ed.messages.map((m) => `<p class="msg">${esc(m.text)}<small>${t('sent_to', { n: m.to })}</small></p>`).join('')}<p class="small muted">${t('share_link')}: <code>crowdpromotion.app/e/${ed.id}</code> <button class="linkbtn" data-act="copy" data-v="crowdpromotion.app/e/${ed.id}">${t('copy')}</button></p>`);
  const settle = done
    ? card(t('settled_h', { d: fmtLong(ed.completedAt) }), `<p class="small muted">${t('settled_p', { n: ed.checkins.length })}</p>${splitTable(s, split, 'Transferred')}`, '', 'ok')
    : ed.status === 'cancelled' ? card(t('st_cancelled'), `<p>${t('refunded_p', { a: money(ed.refundedCents || 0) })}</p>`)
      : card(t('settle_preview'), `<p class="small muted">${t('settle_p', { n })}</p>${splitTable(s, split, kind)}${canEdit ? `<button class="btn btn-ink btn-block" data-act="complete" data-id="${ed.id}" ${ed.date > TODAY ? 'disabled' : ''}>${t('complete_settle')}</button>${ed.date > TODAY ? `<p class="fine center">${t('settle_after', { d: fmtDate(ed.date) })}</p>` : ''}` : ''}`);
  return studioShell('activities', `<a class="backbtn" href="#/studio/activities">${icon('back')} ${t('activities')}</a>
    <div class="ehero rv">${photo(s.templates[act.templateId].img, 'eh-ph')}<div class="eh-ov"><p class="lab">${fmtDate(ed.date, { weekday: 'long', day: 'numeric', month: 'long' })} · ${esc(act.time)} · ${esc(v.name)}</p><h1>${esc(tx(act.title))}</h1><div class="row">${statusPill(s, ed)} ${kindTag(kind)} <span class="muted small">${t('edition_n', { n: ed.editionNo })}</span></div></div></div>
    <div class="sgrid two"><div>${statusCard}${checkin}${msgs}</div><div>${settle}</div></div>`);
}

/* ------------------------------------------------------------------ payouts */
function studioPayouts() {
  const s = state; const key = s.session.account; const bal = balanceOf(s, key);
  const rows = accountLedger(s, key).filter((r) => ledgerFilter === 'all' || r.kind === ledgerFilter);
  const all = accountLedger(s, key).filter((r) => r.kind === 'Transferred').sort((x, y) => x.ed.date.localeCompare(y.ed.date));
  let c = 0; const cum = all.map((r) => (c += r.line.cents));
  const pos = s.payouts.filter((p) => p.account === key).sort((x, y) => y.date.localeCompare(x.date));
  return studioShell('payouts', `<div class="shead rv"><div><h1>${t('payouts')}</h1><p class="muted">${t('payouts_sub')}</p></div></div>
    <div class="sgrid">
      <div class="scard dark rv span2"><div class="balance"><div><span>${t('available')}</span><b>${count(bal.available, 'money')}</b><small>${t('bank_acc')} ES21 •••• 4821</small></div>
        <button class="btn btn-white" data-act="withdraw" ${bal.available > 0 ? '' : 'disabled'}>${icon('wallet')} ${t('withdraw')}</button></div>
        <div class="bal3"><div><small>${t('transferred_all')}</small><b>${count(bal.transferred, 'money0')}</b></div><div><small>${t('paid_out')}</small><b>${count(bal.paid, 'money0')}</b></div><div><small>${t('expected_up')}</small><b>${count(bal.expected, 'money0')}</b></div></div>
        ${areaChart(cum.length > 1 ? cum : [0, ...cum], '#8FD9B4', 110)}</div>
      ${card(t('payout_history'), pos.length ? `<div class="ulist">${pos.map((p) => `<div class="urow"><span class="pico ${p.status}">${icon(p.status === 'paid' ? 'check' : 'clock')}</span><span><b class="num">${money(p.cents)}</b><small>${fmtLong(p.date)} · ${t(`po_${p.status}`)}</small></span></div>`).join('')}</div>` : `<p class="empty">${t('no_payouts')}</p>`)}
      ${card(t('ledger_h'), `<div class="chips">${['all', 'Expected', 'Transferred'].map((k) => `<button class="chip" aria-pressed="${ledgerFilter === k}" data-act="lfilter" data-id="${k}">${k === 'all' ? t('all') : t(k.toLowerCase())}</button>`).join('')}</div>
        <div class="ltable">${rows.map((r) => `<div class="lrow"><span class="ed-d"><b>${fmtDate(r.ed.date, { day: 'numeric' })}</b>${fmtDate(r.ed.date, { month: 'short' })}</span><span><b>${esc(tx(r.act.title))}</b><small>${t(`line_${r.line.key}`, { n: r.line.level, p: s.people[r.act.promoterId].name })} · ${bookings(r.ed)} × ${money(r.act.priceCents)}</small></span><span class="num">${money(r.line.cents)}</span>${kindTag(r.kind)}</div>`).join('') || `<p class="empty">—</p>`}</div>`, '', 'span3')}
    </div>`);
}

/* ------------------------------------------------------------------ referrals */
function studioReferrals() {
  const s = state; const a = acct();
  if (a.type === 'venue') return studioShell('', `<p class="empty">${t('organiser_only')}</p>`);
  const rows = ledgerFor(s, 'person', a.id).filter((r) => r.line.key === 'referral');
  const tt = sumKinds(rows);
  const chain = uplineChain(a.id, s.people).map((id) => s.people[id]);
  const down = downline(s, a.id);
  const byLevel = [1, 2, 3, 4, 5].map((l) => sum(rows.filter((r) => r.line.level === l), (r) => r.line.cents));
  const maxL = Math.max(1, ...byLevel);
  const tree = (nodes, d = 0) => nodes.map((n, i) => `<div class="tnode rv" style="--i:${d * 2 + i};--d:${d}">${avatar(n.person, 'md')}<span><b>${esc(n.person.name)}</b><small>${t('level_n', { n: d + 1 })} · ${t('locked_on', { d: fmtDate(n.person.referralLockedAt) })}</small></span></div>${tree(n.children, d + 1)}`).join('');
  return studioShell('referrals', `<div class="shead rv"><div><h1>${t('referrals')}</h1><p class="muted">${t('ref_sub')}</p></div></div>
    <div class="kpis2">${kpi(t('ref_income'), count(tt.transferred, 'money'), kindTag('Transferred'))}${kpi(t('expected_up'), count(tt.expected, 'money'), kindTag('Expected'))}${kpi(t('organisers_brought'), count(down.length, 'num'))}${kpi(t('network_size'), count(JSON.stringify(down).split('"person"').length - 1, 'num'))}</div>
    <div class="sgrid">
      ${card(t('your_link'), `<div class="linkbox"><code>crowdpromotion.app/join/${a.id}</code><button class="btn btn-ink btn-s" data-act="copy" data-v="crowdpromotion.app/join/${a.id}">${t('copy')}</button></div><p class="small muted">${t('ref_rules')}</p>`, '', 'span2')}
      ${card(t('your_upline'), chain.length ? `<div class="ulist">${chain.map((u, i) => `<div class="urow">${avatar(u, 'md')}<span><b>${esc(u.name)}</b><small>${t('level_n', { n: i + 1 })} · ${[1, 0.8, 0.6, 0.4, 0.2][i]}% ${t('of_your_sales')}</small></span></div>`).join('')}</div>${a.ref.referralLockedAt ? `<p class="small muted">${t('locked_on', { d: fmtLong(a.ref.referralLockedAt) })}</p>` : ''}` : `<p class="small muted">${t('no_upline')}</p>`)}
      ${card(t('your_network'), down.length ? `<div class="tree">${tree(down)}</div>` : `<p class="empty">${t('nobody_yet')}</p>`, '', 'span2')}
      ${card(t('by_level'), `<div class="lvls">${byLevel.map((v, i) => `<div class="lvl" style="--i:${i}"><span>L${i + 1}</span><div class="hbar"><b style="--w:${(v / maxL) * 100}%"></b></div><b class="num">${money(v)}</b></div>`).join('')}</div>`)}
      ${card(t('ref_rows'), `<div class="ltable">${rows.map((r) => `<div class="lrow"><span class="ed-d"><b>${fmtDate(r.ed.date, { day: 'numeric' })}</b>${fmtDate(r.ed.date, { month: 'short' })}</span><span><b>${esc(tx(r.act.title))}</b><small>${esc(s.people[r.act.promoterId].name)} · L${r.line.level}</small></span><span class="num">${money(r.line.cents)}</span>${kindTag(r.kind)}</div>`).join('') || `<p class="empty">—</p>`}</div>`, '', 'span3')}
    </div>`);
}

/* ------------------------------------------------------------------ requests (venue) */
function studioRequests() {
  const s = state; const a = acct();
  if (a.type !== 'venue') return studioShell('', `<p class="empty">${t('venue_only')}</p>`);
  const reqs = Object.values(s.requests).filter((r) => r.venueId === a.id).sort((x, y) => (x.status === 'pending' ? -1 : 1));
  return studioShell('requests', `<div class="shead rv"><div><h1>${t('requests')}</h1><p class="muted">${t('requests_sub')}</p></div></div>
    ${reqs.map((r, i) => {
      const act = s.activities[r.activityId]; const ed = s.editions[r.editionId]; const prom = s.people[act.promoterId]; const p = s.projects[act.projectId];
      const open = r.status === 'pending' || r.status === 'changes';
      return `<div class="req rv" style="--i:${i}">${photo(s.templates[act.templateId].img, 'req-ph')}<div class="req-b">
        <div class="row-b"><div class="row">${avatar(prom, 'md')}<div><small class="muted">${t('wants_to_run', { n: prom.name })}</small><h3>${esc(tx(act.title))}</h3></div></div><span class="pill p-${{ pending: 'wait', accepted: 'ok', declined: 'bad', changes: 'open' }[r.status]}">${t(`rq_${r.status}`)}</span></div>
        <div class="kv kv4"><div><b>${fmtDate(ed.date)}</b><span>${esc(act.time)}</span></div><div><b>${money(act.priceCents)}</b><span>${t('ticket')}</span></div><div><b>${act.minBookings}–${act.capacity}</b><span>${t('min_max')}</span></div><div><b>${money(Math.round(act.priceCents * 0.7 * act.minBookings))}</b><span>${t('your_70_min')}</span></div></div>
        <p class="small"><span class="tagp" style="--c:${p.color}">${esc(p.name)}</span> ${r.note ? `“${esc(tx(r.note))}”` : ''}</p>${r.reply ? `<p class="msg">${esc(r.reply)}<small>${t('your_reply')}</small></p>` : ''}
        ${open ? `<div class="cta"><button class="btn btn-ink" data-act="req-accept" data-id="${r.id}">${t('accept')}</button><button class="btn" data-act="req-changes" data-id="${r.id}">${t('propose_changes')}</button><button class="btn btn-ghost" data-act="req-decline" data-id="${r.id}">${t('decline')}</button></div>` : ''}</div></div>`;
    }).join('') || `<div class="scard"><p class="empty">${t('no_requests')}</p></div>`}`);
}

/* ------------------------------------------------------------------ venue listing (edit + new) */
const SERVICES = ['One drink included', 'Projector', 'Wi-Fi', 'Long tables', 'Board game library', 'Sound system', 'Materials included', 'Kitchen access'];
function venueForm(isNew) {
  const s = state; const v = isNew ? null : s.venues[acct().id];
  venueDraft ??= v ? { name: v.name, type: tx(v.type), neighbourhood: v.neighbourhood, address: v.address || '', description: tx(v.description), capacity: v.capacity, minAttendance: v.minAttendance, slots: Object.fromEntries(v.slots.map((x) => [x.day, `${x.from}–${x.to}`])), services: v.services.map((x) => (typeof x === 'object' ? x.en : x)), ticketRequirement: tx(v.ticketRequirement), houseRules: tx(v.houseRules), img: v.img || 'newVenue' }
    : { name: '', type: 'Bar', neighbourhood: 'Lavapiés', address: '', description: '', capacity: 30, minAttendance: 10, slots: { Tue: '17:00–19:00' }, services: ['Wi-Fi'], ticketRequirement: '', houseRules: '', img: 'newVenue' };
  const d = venueDraft;
  return `<div class="shead rv"><div><h1>${isNew ? t('list_venue') : t('my_venue')}</h1><p class="muted">${t('venue_form_sub')}</p></div></div>
    <div class="sgrid two"><form class="scard form rv" data-form="${isNew ? 'venue-new' : 'venue-save'}" data-live="venue-draft">
      <label>${t('venue_name')}<input name="name" value="${esc(d.name)}" required></label>
      <div class="g2"><label>${t('type')}<select name="type">${['Café', 'Bar', 'Bookshop', 'Studio', 'Restaurant', 'Coworking'].map((x) => `<option ${x === d.type ? 'selected' : ''}>${x}</option>`).join('')}</select></label>
      <label>${t('neighbourhood')}<select name="neighbourhood">${Object.keys(HOODS).map((x) => `<option ${x === d.neighbourhood ? 'selected' : ''}>${x}</option>`).join('')}</select></label></div>
      <label>${t('address')}<input name="address" value="${esc(d.address)}"></label>
      <label>${t('description')}<textarea name="description" rows="2">${esc(d.description)}</textarea></label>
      <div class="g2"><label>${t('capacity')}<input type="number" name="capacity" min="4" max="300" value="${d.capacity}"></label><label>${t('min_attendance')}<input type="number" name="minAttendance" min="1" value="${d.minAttendance}"></label></div>
      <fieldset><legend>${t('weekly_slots')}</legend><div class="week">${['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => `<label class="day ${d.slots[day] ? 'on' : ''}"><input type="checkbox" name="slot-${day}" ${d.slots[day] ? 'checked' : ''}><span>${dayName(day)}</span><select name="time-${day}">${['10:00–13:00', '11:00–13:00', '16:00–18:00', '17:00–19:00', '18:00–20:00', '19:00–21:00'].map((x) => `<option ${d.slots[day] === x ? 'selected' : ''}>${x}</option>`).join('')}</select></label>`).join('')}</div></fieldset>
      <fieldset><legend>${t('services')}</legend><div class="checks">${SERVICES.map((x) => `<label class="check"><input type="checkbox" name="svc" value="${x}" ${d.services.includes(x) ? 'checked' : ''}> ${t(`svc_${x.replace(/\W/g, '')}`)}</label>`).join('')}</div></fieldset>
      <label>${t('ticket_req')}<input name="ticketRequirement" value="${esc(d.ticketRequirement)}"></label>
      <label>${t('house_rules')}<input name="houseRules" value="${esc(d.houseRules)}"></label>
      <p class="note">${t('venue_share_note')}</p>
      <button class="btn btn-ink btn-block btn-l">${isNew ? t('publish_venue') : t('save_changes')}</button></form>
      <div class="sticky"><div id="vprev">${venuePreview(d)}</div></div></div>`;
}
function venuePreview(d) {
  const slots = Object.entries(d.slots).map(([day, x]) => `${dayName(day)} ${x}`).join(' · ') || '—';
  return `<div class="vprev rv">${photo(d.img, 'vp-ph')}<div class="vp-b"><p class="lab">${t('preview_as')}</p><h3>${esc(d.name || t('venue_name'))}</h3><p class="muted small">${esc(d.type)} · ${esc(d.neighbourhood)} · ${t('cap_n', { n: d.capacity })}</p><p>${esc(d.description)}</p>
    <div class="kv"><div><b>${esc(slots)}</b><span>${t('available_slots')}</span></div><div><b>${t('min_n', { n: d.minAttendance })}</b><span>${esc(d.ticketRequirement || '—')}</span></div></div>
    <div class="svcs">${d.services.map((x) => `<span class="pill">${t(`svc_${x.replace(/\W/g, '')}`)}</span>`).join('')}</div><p class="small muted">${t('share_70')}</p></div></div>`;
}
function readVenueForm(form) {
  const f = new FormData(form); const slots = {};
  for (const day of ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']) if (f.get(`slot-${day}`)) slots[day] = f.get(`time-${day}`);
  return { ...venueDraft, name: f.get('name').trim(), type: f.get('type'), neighbourhood: f.get('neighbourhood'), address: f.get('address').trim(), description: f.get('description').trim(), capacity: Number(f.get('capacity')) || 0, minAttendance: Number(f.get('minAttendance')) || 0, slots, services: f.getAll('svc'), ticketRequirement: f.get('ticketRequirement').trim(), houseRules: f.get('houseRules').trim() };
}
function venueFromDraft(d, base = {}) {
  const [lat, lng] = HOODS[d.neighbourhood] || HOODS.Malasaña;
  const svcName = (x) => ({ en: I18N[`svc_${x.replace(/\W/g, '')}`].en, zh: I18N[`svc_${x.replace(/\W/g, '')}`].zh, es: I18N[`svc_${x.replace(/\W/g, '')}`].es });
  return { ...base, name: d.name, type: d.type, neighbourhood: d.neighbourhood, address: d.address, description: d.description, capacity: d.capacity, minAttendance: d.minAttendance,
    slots: Object.entries(d.slots).map(([day, x]) => { const [from, to] = x.split('–'); return { day, from, to }; }), services: d.services.map(svcName),
    ticketRequirement: d.ticketRequirement || t('none'), houseRules: d.houseRules, img: base.img || 'newVenue',
    lat: base.lat ?? lat + (Math.random() - 0.5) * 0.004, lng: base.lng ?? lng + (Math.random() - 0.5) * 0.004,
    costPerAttendeeCents: base.costPerAttendeeCents ?? 150, fixedCostCents: base.fixedCostCents ?? 2000 };
}
const studioVenue = () => studioShell('venue', isVenue() ? venueForm(false) : `<p class="empty">${t('venue_only')}</p>`);
const studioNewVenue = () => studioShell('', venueForm(true));

/* ------------------------------------------------------------------ create activity wizard */
const STEPS = ['step_format', 'step_venue', 'step_project', 'step_details', 'step_agreement'];
function startDraft(s, o = {}) { s.wizard = { step: 1, promoterId: s.session.account.split(':')[1], templateId: null, venueId: null, projectId: null, title: '', priceCents: 0, capacity: 0, minBookings: 0, date: null, recurrence: 'weekly', costsCents: 500, ...o }; }
function applyTemplate(d, tp, s) { d.templateId = tp.id; d.title ||= `${tx(tp.name)} · ${s.people[d.promoterId].name}`; d.priceCents ||= tp.defaultPriceCents; d.capacity ||= tp.defaultCapacity; d.minBookings ||= tp.defaultMin; }
const interest = (person, tags = []) => (person.interests || []).filter((i) => tags.includes(i)).length;

function studioCreate() {
  const s = state;
  if (isVenue()) return studioShell('create', `<div class="scard"><p>${t('switch_to_org')}</p><div class="cta">${promoters(s).map((p) => `<button class="btn" data-act="acct" data-id="person:${p.id}">${avatar(p, 'xs')} ${esc(p.name)}</button>`).join('')}</div></div>`);
  if (!s.wizard || s.wizard.promoterId !== acct().id) patch((st) => startDraft(st));
  const d = s.wizard;
  if (d.requestId) return studioShell('create', wizSent(s, d));
  const steps = `<ol class="stepper">${STEPS.map((k, i) => `<li class="${i + 1 === d.step ? 'on' : i + 1 < d.step ? 'done' : ''}"><button data-act="wiz-go" data-step="${i + 1}" ${i + 1 > d.step ? 'disabled' : ''}><span>${i + 1 < d.step ? icon('check') : i + 1}</span><em>${t(k)}</em></button></li>`).join('')}</ol>`;
  const body = [wizFormat, wizVenue, wizProject, wizDetails, wizAgreement][d.step - 1](s, d);
  const canNext = (d.step === 1 && d.templateId) || (d.step === 2 && d.venueId) || (d.step === 3 && d.projectId) || d.step === 4;
  return studioShell('create', `<div class="shead rv"><div><h1>${t('create_activity')}</h1><p class="muted">${d.fromActivityId ? t('prefilled_from', { a: tx(s.activities[d.fromActivityId].title) }) : t('create_sub')}</p></div><button class="btn btn-ghost btn-s" data-act="wiz-reset">${t('start_over')}</button></div>
    ${steps}<div class="wbody" key="${d.step}">${body}</div>
    <div class="wnav">${d.step > 1 ? `<button class="btn" data-act="wiz-go" data-step="${d.step - 1}">${icon('back')} ${t('back')}</button>` : '<span></span>'}${d.step < 5 ? `<button class="btn btn-ink" data-act="wiz-go" data-step="${d.step + 1}" ${canNext ? '' : 'disabled'}>${t('next')} ${icon('arrow')}</button>` : ''}</div>`);
}
function wizFormat(s, d) {
  const person = s.people[d.promoterId];
  return `<h2 class="h2s">${t('w_format_h')}</h2><p class="muted">${t('w_format_p')}</p><div class="pickgrid">${Object.values(s.templates).map((tp, i) => { const st = templateStats(s, tp.id); return `<button class="pick rv ${d.templateId === tp.id ? 'on' : ''}" style="--i:${i}" data-act="wiz-template" data-id="${tp.id}">${photo(tp.img, 'pk-ph')}<div class="pk-b"><div class="row-b"><b>${esc(tx(tp.name))}</b>${interest(person, tp.interests) ? `<span class="pill p-open">${t('matches_you')}</span>` : ''}</div><div class="fstats"><span><b>${st.avgAttendance}</b>${t('avg_att')}</span><span><b>${money0(st.avgPromoterCents)}</b>${t('avg_earn')}</span><span><b>${st.hours}h</b>${t('work')}</span><span><b>${money(st.perHourCents)}</b>${t('per_hour')}</span></div><small class="muted">${st.verified ? t('from_editions', { n: st.editions }) : t('estimate')}</small></div></button>`; }).join('')}</div>`;
}
function wizVenue(s, d) {
  const person = s.people[d.promoterId]; const tp = s.templates[d.templateId];
  const all = Object.values(s.venues); const hoods = [...new Set(all.map((v) => v.neighbourhood))];
  const list = all.filter((v) => (wizFilters.hood === 'any' || v.neighbourhood === wizFilters.hood) && (wizFilters.day === 'any' || v.slots.some((x) => x.day === wizFilters.day)))
    .map((v) => ({ v, score: (v.neighbourhood === person.neighbourhood ? 2 : 0) + (v.slots.some((x) => (person.availability || []).includes(x.day)) ? 1 : 0) + (v.capacity >= tp.defaultMin ? 1 : 0) })).sort((a, b) => b.score - a.score);
  return `<h2 class="h2s">${t('w_venue_h')}</h2><p class="muted">${t('w_venue_p', { n: person.neighbourhood })}</p>
    <form class="filters" data-live="wiz-filter"><label>${t('neighbourhood')}<select name="hood"><option value="any">${t('any')}</option>${hoods.map((h) => `<option ${wizFilters.hood === h ? 'selected' : ''}>${h}</option>`).join('')}</select></label><label>${t('day')}<select name="day"><option value="any">${t('any')}</option>${['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((x) => `<option value="${x}" ${wizFilters.day === x ? 'selected' : ''}>${dayName(x)}</option>`).join('')}</select></label></form>
    <div class="pickgrid">${list.map(({ v, score }, i) => `<button class="pick rv ${d.venueId === v.id ? 'on' : ''}" style="--i:${i}" data-act="wiz-venue" data-id="${v.id}">${photo(v.img || 'newVenue', 'pk-ph')}<div class="pk-b"><div class="row-b"><b>${esc(v.name)}</b>${i === 0 && score > 0 ? `<span class="pill p-open">${t('suggested')}</span>` : ''}</div><small class="muted">${esc(tx(v.type))} · ${esc(v.neighbourhood)} · ${t('cap_n', { n: v.capacity })}</small>
      <ul class="terms"><li>${v.slots.map((x) => `${dayName(x.day)} ${x.from}–${x.to}`).join(', ')}</li><li>${v.services.map(tx).join(' · ')}</li><li>${t('min_n', { n: v.minAttendance })} · ${esc(tx(v.ticketRequirement))}</li></ul></div></button>`).join('') || `<p class="empty">${t('nothing_here')}</p>`}</div>`;
}
function wizProject(s, d) {
  const person = s.people[d.promoterId];
  const list = Object.values(s.projects).filter((p) => p.status === 'verified' || p.proposedBy === d.promoterId);
  return `<h2 class="h2s">${t('w_project_h')}</h2><p class="muted">${t('w_project_p')}</p><div class="pickgrid">${list.map((p, i) => `<button class="pick rv ${d.projectId === p.id ? 'on' : ''}" style="--i:${i}" data-act="wiz-project" data-id="${p.id}">${photo(p.img || 'workshop', 'pk-ph')}<div class="pk-b"><div class="row-b"><b>${esc(p.name)}</b>${p.status === 'verified' ? `<span class="pill p-ok">${t('verified')}</span>` : `<span class="pill p-wait">${t('pending_review')}</span>`}</div><small class="muted">${esc(tx(p.cause))} · ${t('goal')} ${money0(p.goalCents)}</small>${interest(person, p.tags) ? `<span class="pill p-open">${t('matches_you')}</span>` : ''}</div></button>`).join('')}</div>
    <details class="scard"><summary>${t('propose_project')}</summary><form class="form" data-form="wiz-propose"><label>${t('project_name')}<input name="name" required></label><label>${t('cause')}<input name="cause" required></label><label>${t('goal')} (€)<input name="goal" type="number" min="100" value="2000"></label><p class="small muted">${t('propose_held')}</p><button class="btn">${t('submit_review')}</button></form></details>`;
}
function wizCalc(s, d) {
  const v = s.venues[d.venueId]; const tp = s.templates[d.templateId]; const st = templateStats(s, tp.id);
  const act = { priceCents: d.priceCents, promoterId: d.promoterId, venueId: d.venueId, projectId: d.projectId };
  const tick = ticketSplit(s, act); const slices = slicesOf(s, tick);
  const expected = Math.min(d.capacity, Math.max(d.minBookings, st.avgAttendance));
  const per = tick.lines.find((l) => l.key === 'promoter').cents;
  const earn = (n) => splitSales({ salesCents: n * d.priceCents, promoterId: d.promoterId, venueId: d.venueId, projectId: d.projectId }, s.people).lines.find((l) => l.key === 'promoter').cents;
  const be = per ? Math.ceil(d.costsCents / per) : 0;
  const warn = [];
  if (d.capacity > v.capacity) warn.push(t('w_cap', { v: v.name, n: v.capacity }));
  if (d.minBookings < v.minAttendance) warn.push(t('w_min', { v: v.name, n: v.minAttendance }));
  if (d.minBookings > d.capacity) warn.push(t('w_minmax'));
  if (be > d.minBookings) warn.push(t('w_be', { n: be, m: d.minBookings }));
  const sc = [['w_at_min', d.minBookings], ['w_expected', expected], ['w_full', d.capacity]];
  const maxE = Math.max(1, earn(d.capacity));
  return `<div class="wcalc"><div class="dwrap">${donut(slices, money(d.priceCents), t('per_ticket'))}</div>${legend(slices)}</div>
    <div class="scen">${sc.map(([k, n]) => `<div class="sc"><span>${t(k)} · ${n}</span><div class="hbar big"><b style="--w:${(earn(n) / maxE) * 100}%"></b></div><b class="num">${money(earn(n))}</b><small>${money(Math.round((earn(n) - d.costsCents) / tp.hours))}/h</small></div>`).join('')}</div>
    <p class="small muted">${t('w_calc_note', { h: tp.hours, be, c: money(d.costsCents) })}</p>${warn.map((w) => `<p class="warn">⚠ ${esc(w)}</p>`).join('')}`;
}
function wizDetails(s, d) {
  const v = s.venues[d.venueId];
  const dates = v.slots.flatMap((sl) => nextDates(WEEKDAYS.indexOf(sl.day), 3, 4).map((date) => ({ date, sl }))).sort((a, b) => a.date.localeCompare(b.date));
  if (!dates.some((x) => x.date === d.date)) patch(() => { d.date = dates[0].date; });
  return `<h2 class="h2s">${t('w_details_h')}</h2><p class="muted">${t('w_details_p')}</p>
    <div class="sgrid two"><form class="scard form" data-live="wiz-fields">
      <label>${t('title')}<input name="title" value="${esc(d.title)}"></label>
      <div class="g3"><label>${t('ticket_price')} (€)<input type="number" name="price" min="1" step="0.5" value="${d.priceCents / 100}"></label><label>${t('capacity')}<input type="number" name="capacity" min="2" value="${d.capacity}"></label><label>${t('min_bookings')}<input type="number" name="min" min="1" value="${d.minBookings}"></label></div>
      <div class="g3"><label>${t('first_date')}<select name="date">${dates.map(({ date, sl }) => `<option value="${date}" ${d.date === date ? 'selected' : ''}>${fmtDate(date)} · ${sl.from}</option>`).join('')}</select></label><label>${t('repeat')}<select name="recurrence">${['one-off', 'weekly', 'every 2 weeks', 'monthly'].map((r) => `<option value="${r}" ${d.recurrence === r ? 'selected' : ''}>${t(`rec_${r.replace(/\W/g, '')}`)}</option>`).join('')}</select></label><label>${t('own_costs')} (€)<input type="number" name="costs" min="0" value="${d.costsCents / 100}"></label></div>
      <p class="note">${t('venue_rule', { r: tx(v.ticketRequirement) })}</p></form>
      <div class="scard" id="wcalc">${wizCalc(s, d)}</div></div>`;
}
function wizAgreement(s, d) {
  const v = s.venues[d.venueId]; const p = s.projects[d.projectId]; const tp = s.templates[d.templateId]; const prom = s.people[d.promoterId];
  const ex = splitSales({ salesCents: d.minBookings * d.priceCents, promoterId: d.promoterId, venueId: d.venueId, projectId: d.projectId }, s.people);
  const slot = v.slots.find((x) => x.day === WEEKDAYS[dow(d.date)]) || v.slots[0];
  return `<h2 class="h2s">${t('w_agree_h')}</h2><div class="sgrid two"><div class="scard"><h3>${esc(d.title)}</h3>
    <div class="kv kv4"><div><b>${esc(tx(tp.name))}</b><span>${t('step_format')}</span></div><div><b>${esc(v.name)}</b><span>${t('step_venue')}</span></div><div><b>${fmtDate(d.date)} ${slot.from}</b><span>${t(`rec_${d.recurrence.replace(/\W/g, '')}`)}</span></div><div><b>${money(d.priceCents)}</b><span>${t('ticket')}</span></div><div><b>${d.minBookings}–${d.capacity}</b><span>${t('min_max')}</span></div><div><b>${esc(p.name)}</b><span>${t('step_project')}</span></div></div>
    <h5>${t('who_does')}</h5><ul class="duties"><li><b>${esc(v.name)}</b> — ${t('duty_venue', { s: v.services.map(tx).join(', ').toLowerCase() })}</li><li><b>${esc(prom.name)}</b> — ${t('duty_org')}</li><li><b>Crowdpromotion</b> — ${t('duty_platform')}</li><li><b>${esc(p.name)}</b> — ${t('duty_project')}</li></ul>
    <p class="note">${t('auto_cancel_rule')}</p></div>
    <div class="scard"><h3>${t('split_at_min', { n: d.minBookings, p: money(d.priceCents) })}</h3>${splitTable(s, ex, 'Expected')}<button class="btn btn-ink btn-block btn-l" data-act="wiz-send">${t('send_to', { v: v.name })}</button></div></div>`;
}
function wizSent(s, d) {
  const req = s.requests[d.requestId]; const act = s.activities[req.activityId]; const v = s.venues[act.venueId]; const ed = s.editions[req.editionId];
  if (req.status === 'accepted') return `<div class="scard center big-ok rv"><div class="okmark">${icon('check')}</div><h2>${t('published_h')}</h2><p>${t('published_p', { v: v.name, a: tx(act.title) })}</p><div class="linkbox"><code>crowdpromotion.app/e/${ed.id}</code><button class="btn btn-ink btn-s" data-act="copy" data-v="crowdpromotion.app/e/${ed.id}">${t('copy')}</button></div><div class="cta center"><a class="btn btn-ink" href="#/studio/edition/${ed.id}">${t('manage_edition')}</a><button class="btn" data-open="ed" data-id="${ed.id}">${t('see_public')}</button><button class="btn btn-ghost" data-act="wiz-reset">${t('create_another')}</button></div></div>`;
  return `<div class="scard center rv"><div class="sendanim">${icon('send')}</div><h2>${t('sent_h', { v: v.name })}</h2><p class="muted">${req.status === 'changes' ? t('rq_changes') : t('sent_p')}</p>${req.reply ? `<p class="msg">${esc(req.reply)}<small>${esc(v.name)}</small></p>` : ''}<div class="cta center"><button class="btn" data-act="acct" data-id="venue:${v.id}" data-then="#/studio/requests">${t('open_as', { v: v.name })}</button><a class="btn btn-ghost" href="#/studio/activities">${t('activities')}</a></div></div>`;
}
