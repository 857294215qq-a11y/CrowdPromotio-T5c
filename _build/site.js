/* ================================================================== public site */

let exploreFilter = 'all';
let netFocus = null; let netStory = null;
const calc = { price: 1200, att: 20, levels: 0 };

function sh(kicker, title, text, extra = '') {
  return `<div class="sh rv"><div><p class="kicker">${kicker}</p><h2>${title}</h2></div><div><p>${text}</p>${extra}</div></div>`;
}

/* ------------------------------------------------------------------ cards */
function edCard(s, ed, i = 0) {
  const act = activityOf(s, ed); const v = s.venues[act.venueId]; const p = s.projects[act.projectId]; const prom = s.people[act.promoterId];
  const n = bookings(ed); const need = Math.max(0, act.minBookings - n);
  return `<button class="acard tap rv" style="--i:${i}" data-open="ed" data-id="${ed.id}">
    ${photo(s.templates[act.templateId].img, 'acard-ph', tx(act.title))}
    <span class="acard-date"><b>${fmtDate(ed.date, { day: 'numeric' })}</b>${fmtDate(ed.date, { month: 'short' })}</span>
    <span class="acard-price num">${money(act.priceCents)}</span>
    <div class="acard-body">
      <div class="acard-meta">${fmtDate(ed.date, { weekday: 'long' })} · ${esc(act.time)}</div>
      <h3>${esc(tx(act.title))}</h3>
      <div class="acard-where">${icon('pin')} ${esc(v.name)} · ${esc(v.neighbourhood)}</div>
      ${progress(n, act.capacity, act.minBookings)}
      <div class="acard-foot"><span>${avatar(prom, 'xs')} ${esc(prom.name)}</span><span class="tagp" style="--c:${p.color}">${esc(p.name)}</span></div>
      <div class="acard-left">${need ? t('need_more', { n: need }) : t('min_reached')} · ${t('spots_left', { n: act.capacity - n })}</div>
    </div></button>`;
}

/* ------------------------------------------------------------------ home */
function siteView() {
  const s = state;
  const done = Object.values(s.editions).filter((e) => e.status === 'completed');
  const sales = sum(done, (e) => salesOf(s, e));
  const toProjects = sum(done, (e) => editionSplit(s, e).lines.find((l) => l.key === 'project').cents) + sum(s.donations, (d) => d.cents);
  const verified = sum(done, (e) => e.checkins.length);
  const ups = upcoming(s);
  const filtered = ups.filter((e) => exploreFilter === 'all' || activityOf(s, e).templateId === exploreFilter || activityOf(s, e).projectId === exploreFilter);
  const usedTemplates = [...new Set(ups.map((e) => activityOf(s, e).templateId))];
  const marquee = ups.slice(0, 8).map((e) => { const a = activityOf(s, e); return `<button class="mq tap" data-open="ed" data-id="${e.id}">${photo(s.templates[a.templateId].img, 'sm')}<span><b>${esc(tx(a.title))}</b><small>${fmtDate(e.date)} · ${money(a.priceCents)}</small></span></button>`; }).join('');

  return `
  <header class="hero wrap" id="top">
    <div class="hero-grid">
      <div class="hero-copy">
        <div class="meta-line rv"><span>${t('hero_meta')}</span><span>Madrid</span><span>${fmtDate(TODAY, { month: 'long', year: 'numeric' })}</span></div>
        <h1 class="rv">${t('hero_h1')}</h1>
        <p class="lede rv">${t('hero_lede')}</p>
        <div class="cta rv"><a class="btn btn-ink" href="#explore" data-scroll>${t('cta_explore')} ${icon('arrow')}</a><a class="btn" href="#/studio">${t('cta_studio')}</a></div>
      </div>
      <div class="mosaic rv">
        ${photo('hero', 'm1', '')}${photo('ceramics', 'm2', '')}${photo('boardgames', 'm3', '')}
        <div class="float f1 glass"><small>${t('to_projects')}</small><b>${count(toProjects, 'money0')}</b></div>
        <div class="float f2 glass"><small>${t('verified_attendees')}</small><b>${count(verified, 'num')}</b></div>
      </div>
    </div>
    <div class="kstats rv">
      <div><b>${count(sales, 'money0')}</b><span>${t('k_sales')}</span></div>
      <div><b>${count(Object.keys(s.venues).length, 'num')}</b><span>${t('k_venues')}</span></div>
      <div><b>${count(promoters(s).length, 'num')}</b><span>${t('k_organisers')}</span></div>
      <div><b>${count(done.length, 'num')}</b><span>${t('k_editions')}</span></div>
    </div>
  </header>
  <div class="marquee" aria-label="${t('upcoming')}"><div class="mq-track">${marquee}${marquee}</div></div>

  <main>
  <section id="explore" class="wrap">
    ${sh(t('explore_kicker'), t('explore_h'), t('explore_p'))}
    <div class="chips rv"><button class="chip" aria-pressed="${exploreFilter === 'all'}" data-act="filter" data-id="all">${t('all')}</button>
      ${usedTemplates.map((id) => `<button class="chip" aria-pressed="${exploreFilter === id}" data-act="filter" data-id="${id}">${esc(tx(s.templates[id].name))}</button>`).join('')}
      <span class="chip-sep"></span>
      ${Object.values(s.projects).filter((p) => p.status === 'verified').map((p) => `<button class="chip" aria-pressed="${exploreFilter === p.id}" data-act="filter" data-id="${p.id}"><i class="dotc" style="--c:${p.color}"></i>${esc(p.name)}</button>`).join('')}</div>
    <div class="agrid">${filtered.map((e, i) => edCard(s, e, i)).join('') || `<p class="empty">${t('nothing_here')}</p>`}</div>
  </section>

  <section id="map">
    <div class="wrap">${sh(t('map_kicker'), t('map_h'), t('map_p'))}</div>
    <div class="mapstage rv"><div class="mapcard">
      <div id="leaflet" class="leaflet-host"><div class="map-fallback">${t('map_offline')}</div></div>
      <div class="mlegend glass">
        <h3>${t('map_legend_h')}</h3>
        <div class="mkeys"><span><i class="k-v"></i>${t('venues')}</span><span><i class="k-p"></i>${t('projects')}</span><span><i class="k-f"></i>${t('funding_flow')}</span></div>
        <div class="mlist">${Object.values(s.venues).map((v) => { const acts = Object.values(s.activities).filter((a) => a.venueId === v.id && a.status === 'active'); return `<button class="mrow" data-act="map-fly" data-type="v" data-id="${v.id}">${photo(v.img || 'newVenue', 'sm')}<span><b>${esc(v.name)}</b><small>${esc(v.neighbourhood)} · ${t('n_activities', { n: acts.length })}</small></span></button>`; }).join('')}
        ${Object.values(s.projects).filter((p) => p.lat).map((p) => `<button class="mrow" data-act="map-fly" data-type="p" data-id="${p.id}"><span class="mdot" style="--c:${p.color}"></span><span><b>${esc(p.name)}</b><small>${esc(tx(p.cause))}</small></span></button>`).join('')}</div>
      </div>
    </div></div>
  </section>

  <section id="money" class="wrap">
    ${sh(t('money_kicker'), t('money_h'), t('money_p'))}
    <div class="money rv">
      <div class="flowcard"><div id="flow">${flowSvg(s)}</div></div>
      <div class="calc">
        <h3>${t('calc_h')}</h3><p class="sub">${t('calc_sub')}</p>
        <div class="rng"><label>${t('ticket_price')} <b id="cv-price">${money(calc.price)}</b></label><input type="range" min="500" max="4000" step="50" value="${calc.price}" data-act="calc" name="price"></div>
        <div class="rng"><label>${t('attendees')} <b id="cv-att">${calc.att}</b></label><input type="range" min="4" max="40" step="1" value="${calc.att}" data-act="calc" name="att"></div>
        <div class="rng"><label>${t('upline_levels')} <b id="cv-lv">${calc.levels}</b></label><input type="range" min="0" max="5" step="1" value="${calc.levels}" data-act="calc" name="levels"></div>
        <div class="out" id="calc-out">${calcOut()}</div>
        <p class="fine">${t('calc_fine')}</p>
      </div>
    </div>
    <div class="chainstory rv">${chainStory(s)}</div>
  </section>

  <section id="network" class="wrap">
    ${sh(t('net_kicker'), t('net_h'), t('net_p'))}
    <div class="netwrap rv">
      <div class="netcard"><div class="chips"><button class="chip" aria-pressed="${netStory === 'venue'}" data-act="story" data-id="venue">${t('story_venue_btn')}</button><button class="chip" aria-pressed="${netStory === 'project'}" data-act="story" data-id="project">${t('story_project_btn')}</button></div>
        <div id="netsvg">${networkSvg(s)}</div>
        <div class="nkeys"><span><i class="k-v"></i>${t('venues')}</span><span><i class="k-o"></i>${t('organisers')}</span><span><i class="k-p"></i>${t('projects')}</span><span><i class="k-r"></i>${t('referral')}</span></div></div>
      <div class="netside" id="netside">${netSide(s)}</div>
    </div>
    ${recurrenceBlock(s)}
  </section>

  <section id="projects" class="wrap">
    ${sh(t('proj_kicker'), t('proj_h'), t('proj_p'), `<button class="more" data-act="propose">${t('propose_project')} ${icon('arrow')}</button>`)}
    <div class="pgrid">${Object.values(s.projects).filter((p) => p.status === 'verified').map((p, i) => projectCard(s, p, i)).join('')}</div>
  </section>

  <section id="organise" class="wrap">
    ${sh(t('org_kicker'), t('org_h'), t('org_p'))}
    <div class="ladder">${['attendee', 'coorganiser', 'promoter'].map((k, i) => `<div class="lstep rv" style="--i:${i}">${photo(['language', 'workshop', 'owner'][i], 'lph')}<div class="lbody"><span class="lix">0${i + 1}</span><h3>${t(`lad_${k}`)}</h3><p>${t(`lad_${k}_p`)}</p><small>${t(`lad_${k}_safe`)}</small></div></div>`).join('')}</div>
    <h3 class="subh rv">${t('formats_h')}</h3>
    <div class="fgrid">${Object.values(s.templates).map((tp, i) => { const st = templateStats(s, tp.id); return `<div class="fcard rv" style="--i:${i}">${photo(tp.img, 'fph')}<div class="fbody"><h4>${esc(tx(tp.name))}</h4><div class="fstats"><span><b>${st.avgAttendance}</b>${t('avg_att')}</span><span><b>${money0(st.avgPromoterCents)}</b>${t('avg_earn')}</span><span><b>${money(st.perHourCents)}</b>${t('per_hour')}</span></div><small>${st.verified ? t('from_editions', { n: st.editions }) : t('estimate')}</small></div></div>`; }).join('')}</div>
    <div class="ctaband rv"><div><h3>${t('cta_band_h')}</h3><p>${t('cta_band_p')}</p></div><div class="cta"><a class="btn btn-ink" href="#/studio/create">${t('start_activity')}</a><a class="btn" href="#/studio/new-venue">${t('list_venue')}</a></div></div>
  </section>
  </main>
  ${footer()}`;
}

function footer() {
  return `<footer class="wrap"><div class="fgrid2"><div><b>Crowdpromotion</b><p>${t('footer_p')}</p></div>
    <div><p>${t('rules_short')}</p><p class="small">${t('credits')}</p><button class="linkbtn" data-act="reset">${t('reset_data')}</button></div></div></footer>`;
}

/* ------------------------------------------------------------------ money flow */
function calcSplit() {
  const sales = calc.price * calc.att;
  // chain org -> u1 -> u2 ... with `levels` uplines
  const ppl = { org: { uplineId: calc.levels ? 'u1' : null } };
  for (let i = 1; i <= calc.levels; i++) ppl[`u${i}`] = { uplineId: i < calc.levels ? `u${i + 1}` : null };
  return splitSales({ salesCents: sales, promoterId: 'org', venueId: 'v', projectId: 'p' }, ppl);
}
function calcParts() {
  const sp = calcSplit(); const g = (k) => sum(sp.lines.filter((l) => l.key === k), (l) => l.cents);
  return [
    { k: 'business', label: t('venue'), cents: g('business'), color: COLORS.business },
    { k: 'promoter', label: t('organiser'), cents: g('promoter'), color: COLORS.promoter },
    { k: 'project', label: t('social_project'), cents: g('project'), color: COLORS.project },
    { k: 'referral', label: t('upline_organisers'), cents: g('referral'), color: COLORS.referral },
    { k: 'platform', label: t('platform'), cents: g('platform'), color: COLORS.platform },
  ];
}
function calcOut() {
  return calcParts().map((p) => `<div><b class="num" style="color:${p.k === 'business' ? '#8FB0FF' : p.color}">${money(p.cents)}</b><span>${p.label}</span></div>`).join('') +
    `<div class="wide"><b class="num">${money(calc.price * calc.att)}</b><span>${t('net_sales')} · ${calc.att} × ${money(calc.price)}</span></div>`;
}
function flowSvg() {
  const parts = calcParts(); const total = sum(parts, (p) => p.cents) || 1;
  const W = 600; const H = 330; const srcX = 92; const dstX = 400; const thick = 190;
  let acc = H / 2 - thick / 2;
  const ys = parts.map((_, i) => 40 + i * ((H - 80) / (parts.length - 1)));
  const paths = parts.map((p, i) => {
    const w = Math.max(2, (p.cents / total) * thick); const y0 = acc + w / 2; acc += w; const y1 = ys[i];
    const d = `M${srcX},${y0.toFixed(1)} C${(srcX + dstX) / 2},${y0.toFixed(1)} ${(srcX + dstX) / 2},${y1} ${dstX},${y1}`;
    return `<g style="--i:${i}"><path d="${d}" class="fl-base" style="stroke:${p.color};stroke-width:${w.toFixed(1)}"/><path d="${d}" class="fl-dash" style="stroke-width:${Math.max(1.5, w * 0.35).toFixed(1)}"/>
      <circle cx="${dstX + 10}" cy="${y1}" r="7" fill="${p.color}"/><text x="${dstX + 26}" y="${y1 - 3}" class="fl-l">${esc(p.label)}</text><text x="${dstX + 26}" y="${y1 + 16}" class="fl-v">${money(p.cents)} · ${((p.cents / total) * 100).toFixed(1)}%</text></g>`;
  }).join('');
  return `<svg class="flow" viewBox="0 0 ${W} ${H}" role="img" aria-label="${t('money_h')}">${paths}
    <g class="fl-src"><rect x="8" y="${H / 2 - 46}" width="${srcX - 8}" height="92" rx="22"/><text x="${(srcX + 8) / 2}" y="${H / 2 - 6}" class="fl-sv">${money0(calc.price * calc.att)}</text><text x="${(srcX + 8) / 2}" y="${H / 2 + 16}" class="fl-ss">${t('tickets_n', { n: calc.att })}</text></g></svg>`;
}
function chainStory(s) {
  const ed = s.editions['e-marta-1'] || Object.values(s.editions).find((e) => e.activityId === 'act-marta' && e.status === 'completed');
  if (!ed) return '';
  const sp = editionSplit(s, ed); const g = (k, id) => sum(sp.lines.filter((l) => l.key === k && (!id || l.partyId === id)), (l) => l.cents);
  const node = (p, amt, note) => `<div class="cnode">${avatar(p, 'lg')}<b>${esc(p.name)}</b><span class="num">${money(amt)}</span><small>${note}</small></div>`;
  return `<div class="cs-head"><h3>${t('chain_h')}</h3><p>${t('chain_p', { sales: money(sp.salesCents) })}</p></div>
    <div class="cflow">${node(s.people.ana, g('referral', 'ana'), t('lvl2'))}<span class="carrow"><i></i>${t('invited')}</span>${node(s.people.luis, g('referral', 'luis'), t('lvl1'))}<span class="carrow"><i></i>${t('invited')}</span>${node(s.people.marta, g('promoter'), t('organiser_15'))}
    <span class="carrow alt"><i></i>${t('rest_to')}</span><div class="cnode">${photo('aulas', 'cph')}<b>Aulas Abiertas</b><span class="num">${money(g('project'))}</span><small>${t('incl_unalloc', { a: money(sp.lines.find((l) => l.key === 'project').fromReferral) })}</small></div></div>
    <p class="fine">${t('chain_fine')}</p>`;
}

/* ------------------------------------------------------------------ network graph */
const STORIES = { venue: { focus: 'v:tertulia' }, project: { focus: 'j:aulas' } };
function graphData(s) {
  const acts = Object.values(s.activities).filter((a) => a.status === 'active');
  const salesOfAct = (a) => sum(Object.values(s.editions).filter((e) => e.activityId === a.id && e.status === 'completed'), (e) => salesOf(s, e));
  const venues = [...new Set(acts.map((a) => a.venueId))].map((id) => ({ id: `v:${id}`, kind: 'v', ref: s.venues[id] }));
  const proms = promoters(s).filter((p) => acts.some((a) => a.promoterId === p.id) || Object.values(s.editions).some((e) => e.coOrganiserId === p.id)).map((p) => ({ id: `p:${p.id}`, kind: 'p', ref: p }));
  const projs = [...new Set(acts.map((a) => a.projectId))].map((id) => ({ id: `j:${id}`, kind: 'j', ref: s.projects[id] }));
  const edges = [];
  for (const a of acts) { const v = salesOfAct(a); edges.push({ from: `v:${a.venueId}`, to: `p:${a.promoterId}`, act: a, sales: v, type: 'a' }, { from: `p:${a.promoterId}`, to: `j:${a.projectId}`, act: a, sales: v, type: 'a' }); }
  for (const p of proms) if (p.ref.uplineId && proms.some((x) => x.ref.id === p.ref.uplineId)) edges.push({ from: `p:${p.ref.uplineId}`, to: p.id, type: 'r' });
  for (const e of Object.values(s.editions)) if (e.coOrganiserId && e.status !== 'cancelled') edges.push({ from: `p:${activityOf(s, e).promoterId}`, to: `p:${e.coOrganiserId}`, type: 'c' });
  return { cols: [venues, proms, projs], edges };
}
function networkSvg(s) {
  const { cols, edges } = graphData(s);
  const W = 560; const H = Math.max(...cols.map((c) => c.length)) * 96 + 60; const xs = [86, 280, 474]; const pos = {};
  cols.forEach((col, ci) => col.forEach((n, i) => { pos[n.id] = { x: xs[ci], y: 30 + ((i + 1) * (H - 30)) / (col.length + 1), n }; }));
  const focus = netStory ? STORIES[netStory].focus : netFocus;
  const linked = new Set(focus ? [focus] : []);
  edges.forEach((e) => { if (e.from === focus || e.to === focus) { linked.add(e.from); linked.add(e.to); } });
  const max = Math.max(1, ...edges.filter((e) => e.sales).map((e) => e.sales));
  let k = 0;
  const paths = edges.map((e) => {
    const a = pos[e.from]; const b = pos[e.to]; if (!a || !b) return '';
    const lit = !focus || e.from === focus || e.to === focus;
    if (e.type === 'a') { const mx = (a.x + b.x) / 2; return `<path pathLength="1" d="M${a.x},${a.y} C${mx},${a.y} ${mx},${b.y} ${b.x},${b.y}" class="ne ${lit ? '' : 'dim'}" style="--i:${k++};stroke-width:${(2 + (e.sales / max) * 9).toFixed(1)}"><title>${esc(tx(e.act.title))} · ${money0(e.sales)}</title></path>`; }
    const bend = e.type === 'r' ? 58 : -58;
    return `<path d="M${a.x},${a.y} C${a.x + bend},${a.y} ${b.x + bend},${b.y} ${b.x},${b.y}" class="ne ne-${e.type} ${lit ? '' : 'dim'}"/>`;
  }).join('');
  const nodes = Object.values(pos).map(({ x, y, n }, i) => {
    const dim = focus && !linked.has(n.id);
    const shape = n.kind === 'p'
      ? `<circle r="25" fill="${n.ref.color}"/><text class="ni" dy="6">${esc(n.ref.name[0])}</text>`
      : `<clipPath id="cl-${n.id.replace(':', '-')}"><rect x="-25" y="-25" width="50" height="50" rx="${n.kind === 'v' ? 14 : 25}"/></clipPath><image href="${img(n.ref.img || 'newVenue', 120)}" x="-25" y="-25" width="50" height="50" preserveAspectRatio="xMidYMid slice" clip-path="url(#cl-${n.id.replace(':', '-')})"/><rect x="-25" y="-25" width="50" height="50" rx="${n.kind === 'v' ? 14 : 25}" class="nring nr-${n.kind}"/>`;
    return `<g class="nn ${dim ? 'dim' : ''} ${netFocus === n.id ? 'sel' : ''}" style="--i:${i}" transform="translate(${x},${y})" data-act="net" data-id="${n.id}" tabindex="0" role="button" aria-label="${esc(n.ref.name)}"><g class="nn-in">${shape}<text class="nl" y="44">${esc(n.ref.name)}</text></g></g>`;
  }).join('');
  return `<svg class="net ${netIntro ? 'intro' : ''}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${t('net_h')}"><text x="${xs[0]}" y="18" class="ct">${t('venues')}</text><text x="${xs[1]}" y="18" class="ct">${t('organisers')}</text><text x="${xs[2]}" y="18" class="ct">${t('projects')}</text>${paths}${nodes}</svg>`;
}
function netSide(s) {
  if (netStory) return `<div class="story"><h3>${t(`story_${netStory}_h`)}</h3><p>${t(`story_${netStory}_p`)}</p></div>`;
  if (!netFocus) return `<div class="story"><h3>${t('net_tap_h')}</h3><p>${t('net_tap_p')}</p></div>`;
  const [k, id] = netFocus.split(':');
  const type = { v: 'venue', p: 'person', j: 'project' }[k]; const ref = { v: s.venues, p: s.people, j: s.projects }[k][id];
  const tt = sumKinds(ledgerFor(s, type, id));
  const acts = Object.values(s.activities).filter((a) => a.status === 'active' && (a.venueId === id || a.promoterId === id || a.projectId === id));
  return `<div class="story"><h3>${esc(ref.name)}</h3><div class="kv"><div><b>${count(tt.transferred, 'money0')}</b><span>${t('transferred')}</span></div><div><b>${count(tt.expected, 'money0')}</b><span>${t('expected')}</span></div></div>
    <ul class="alist">${acts.map((a) => `<li><b>${esc(tx(a.title))}</b><small>${esc(s.people[a.promoterId].name)} · ${esc(s.venues[a.venueId].name)} → ${esc(s.projects[a.projectId].name)}</small></li>`).join('')}</ul></div>`;
}
function recurrenceBlock(s) {
  const r = recurrence(s);
  return `<div class="recur rv"><div><p class="kicker">${t('recur_kicker')}</p><div class="big">${count(r.share * 100, 'pct')}</div><p>${t('recur_p', { a: money0(r.repeat), b: money0(r.first) })}</p></div>
    <div class="recur-bar"><div class="ratio"><i style="--w:${(r.share * 100).toFixed(1)}%;background:var(--ink)"></i><i style="--w:${(100 - r.share * 100).toFixed(1)}%;background:#D2D2D7"></i></div><div class="ratiol"><span style="--c:var(--ink)">${t('repeated')}</span><span style="--c:#D2D2D7">${t('first_editions')}</span></div><p class="fine dark">${t('recur_fine')}</p></div></div>`;
}

/* ------------------------------------------------------------------ projects */
function projectCard(s, p, i) {
  const st = projectStats(s, p.id); const raised = st.transferred + st.donations;
  const w = clamp((raised / p.goalCents) * 100, 0, 100); const we = clamp((st.expected / p.goalCents) * 100, 0, 100 - w);
  const proms = [...new Set(st.contributors.map((c) => c.act.promoterId))].map((id) => s.people[id]);
  return `<div class="pcard rv" style="--i:${i}">${photo(p.img, 'pph', p.name)}
    <div class="pbody"><span class="tagp" style="--c:${p.color}">${esc(tx(p.cause))}</span><h3>${esc(p.name)}</h3><p>${esc(tx(p.description))}</p>
      <div class="praised"><b>${count(raised, 'money0')}</b><span>${t('of_goal', { g: money0(p.goalCents) })}</span></div>
      <div class="pbar"><b style="--w:${w}%;background:${p.color}"></b><b class="exp" style="--w:${we}%;left:${w}%"></b></div>
      <div class="pmeta"><span class="avs">${proms.map((x) => avatar(x, 'sm')).join('')}</span><span>${t('n_activities', { n: st.contributors.length })} · ${money0(st.expected)} ${t('expected').toLowerCase()}</span></div>
      <div class="pact"><button class="btn btn-ink btn-s" data-act="donate" data-id="${p.id}">${icon('heart')} ${t('donate')}</button><button class="btn btn-s" data-act="project-detail" data-id="${p.id}">${t('details')}</button></div>
    </div></div>`;
}
function sheetProject(id) {
  const s = state; const p = s.projects[id]; const st = projectStats(s, id);
  return `<div class="sh-hero">${photo(p.img, 'sh-ph', p.name)}<div class="sh-ov"><p class="lab">${esc(tx(p.cause))}</p><h2>${esc(p.name)}</h2></div></div>
  <div class="sh-pad"><p class="intro">${esc(tx(p.description))}</p>
    <div class="fact"><div><b>${count(st.transferred, 'money0')}</b><span>${t('from_activities')} ${kindTag('Transferred')}</span></div><div><b>${count(st.expected, 'money0')}</b><span>${t('from_bookings')} ${kindTag('Expected')}</span></div><div><b>${count(st.donations, 'money0')}</b><span>${t('direct_donations')}</span></div><div><b>${count(p.goalCents, 'money0')}</b><span>${t('goal')}</span></div></div>
    <h5>${t('contributing')}</h5>
    <div class="stable">${st.contributors.map((c) => `<div class="srow">${avatar(s.people[c.act.promoterId], 'sm')}<span><b>${esc(tx(c.act.title))}</b><small>${esc(s.people[c.act.promoterId].name)} · ${esc(s.venues[c.act.venueId].name)} · ${t('n_editions', { n: c.editions })}${c.fromReferral ? ` · ${t('incl_unalloc', { a: money(c.fromReferral) })}` : ''}</small></span><b class="num">${money(c.transferred)}</b></div>`).join('') || `<p class="empty">—</p>`}</div>
    <h5>${t('direct_donations')}</h5><p class="small muted">${t('donations_note')}</p>
    <div class="stable">${s.donations.filter((d) => d.projectId === id).map((d) => `<div class="srow"><span><b>${esc(d.donor === 'Anonymous' ? t('anonymous') : d.donor)}</b><small>${fmtLong(d.date)}</small></span><b class="num">${money(d.cents)}</b></div>`).join('')}</div>
    <button class="btn btn-ink btn-block" data-act="donate" data-id="${id}">${icon('heart')} ${t('donate')}</button></div>`;
}
let donateAmt = 2000;
function sheetDonate(id) {
  const p = state.projects[id];
  return `<div class="sh-pad"><p class="lab">${t('donate')}</p><h2>${esc(p.name)}</h2><p class="intro">${t('donate_p')}</p>
    <div class="amts">${[1000, 2000, 5000, 10000].map((a) => `<button class="amt" aria-pressed="${donateAmt === a}" data-act="amt" data-v="${a}">${money0(a)}</button>`).join('')}</div>
    ${payMethods()}<button class="btn btn-ink btn-block btn-l" data-act="do-donate" data-id="${id}">${t('give', { a: money0(donateAmt) })}</button></div>`;
}
function sheetPropose() {
  return `<div class="sh-pad"><p class="lab">${t('projects')}</p><h2>${t('propose_project')}</h2><p class="intro">${t('propose_p')}</p>
    <form class="form" data-form="propose"><label>${t('project_name')}<input name="name" required></label><label>${t('cause')}<input name="cause" required></label><label>${t('goal')} (€)<input name="goal" type="number" min="100" value="3000"></label><label>${t('organisation')}<input name="org" required></label>
    <button class="btn btn-ink btn-block">${t('submit_review')}</button></form></div>`;
}

/* ------------------------------------------------------------------ booking flow (sheet) */
let checkoutQty = 1; let payMethod = 'apple';
function sheetEdition(id) {
  const s = state; const ed = s.editions[id]; if (!ed) return '';
  const act = activityOf(s, ed); const v = s.venues[act.venueId]; const p = s.projects[act.projectId]; const prom = s.people[act.promoterId];
  const tick = ticketSplit(s, act, ed.coOrganiserId); const slices = slicesOf(s, tick);
  const promEds = Object.values(s.editions).filter((e) => e.status === 'completed' && activityOf(s, e).promoterId === prom.id);
  const n = bookings(ed); const mine = ed.attendees.filter((x) => x.startsWith(ME_NAME)).length;
  const open = ed.status === 'scheduled' && ed.date >= TODAY && n < act.capacity;
  const proj = tick.lines.find((l) => l.key === 'project');
  return `<div class="sh-hero">${photo(s.templates[act.templateId].img, 'sh-ph', tx(act.title))}<div class="sh-ov"><p class="lab">${fmtDate(ed.date, { weekday: 'long', day: 'numeric', month: 'long' })} · ${esc(act.time)}</p><h2>${esc(tx(act.title))}</h2>${statusPill(s, ed)}</div></div>
  <div class="sh-pad">
    <div class="sh-grid">
      <div>
        <p class="intro">${esc(tx(act.description))}</p>
        <h5>${t('included')}</h5><ul class="ticks">${act.included.map((x) => `<li>${icon('check')}${esc(tx(x))}</li>`).join('')}</ul>
        <h5>${t('bookings')}</h5>${progress(n, act.capacity, act.minBookings)}<p class="small muted">${t('booking_note', { n, cap: act.capacity, min: act.minBookings })}</p>
        <div class="who">${avatar(prom, 'lg')}<div><b>${esc(prom.name)}${ed.coOrganiserId ? ` & ${esc(s.people[ed.coOrganiserId].name)}` : ''}</b><small>${esc(tx(prom.bio))}</small></div></div>
        <div class="kv kv3"><div><b>${count(promEds.length, 'num')}</b><span>${t('completed_editions')}</span></div><div><b>${count(sum(promEds, (e) => e.checkins.length), 'num')}</b><span>${t('verified_attendees')}</span></div><div><b>${count(editionsOf(s, act.id).filter((e) => e.status === 'cancelled').length, 'num')}</b><span>${t('cancelled')}</span></div></div>
        <div class="venue-mini">${photo(v.img || 'newVenue', 'sm')}<div><b>${esc(v.name)}</b><small>${icon('pin')} ${esc(v.address || v.neighbourhood)}</small></div></div>
      </div>
      <div class="breakdown rv"><h5 class="mt0">${t('where_goes', { p: money(act.priceCents) })}</h5>
        <div class="dwrap">${donut(slices, money(act.priceCents), t('per_ticket'))}</div>${legend(slices)}
        ${proj.fromReferral > 0 ? `<p class="small muted">${t('unalloc_note', { a: money(proj.fromReferral), p: p.name })}</p>` : ''}
        <div class="pmini">${photo(p.img, 'sm')}<div><b>${esc(p.name)}</b><small>${esc(tx(p.cause))}</small></div></div>
      </div>
    </div>
    <div class="sh-cta">${mine ? `<button class="btn btn-block btn-l" data-act="show-ticket" data-id="${ed.id}">${icon('ticket')} ${t('youre_going', { n: mine })}</button>` : ''}
      ${open ? `<button class="btn btn-ink btn-block btn-l" data-act="checkout" data-id="${ed.id}">${t('book_for', { p: money(act.priceCents) })}</button>` : (mine ? '' : `<button class="btn btn-block btn-l" disabled>${t(`st_${edStatus(s, ed).key}`)}</button>`)}</div>
  </div>`;
}
function payMethods() {
  return `<div class="paym" role="radiogroup" aria-label="${t('payment')}">${[['apple', 'Apple Pay'], ['card', t('card')], ['bizum', 'Bizum']].map(([k, l]) => `<button class="pm" role="radio" aria-checked="${payMethod === k}" data-act="paym" data-v="${k}">${l}</button>`).join('')}</div>`;
}
function sheetCheckout(id) {
  const s = state; const ed = s.editions[id]; const act = activityOf(s, ed); const p = s.projects[act.projectId];
  const left = act.capacity - bookings(ed); checkoutQty = clamp(checkoutQty, 1, Math.min(4, left));
  const tick = ticketSplit(s, act, ed.coOrganiserId); const proj = tick.lines.find((l) => l.key === 'project').cents;
  return `<div class="sh-pad"><button class="backbtn" data-act="open-ed" data-id="${id}">${icon('back')} ${t('back')}</button>
    <p class="lab">${t('checkout')}</p><h2>${esc(tx(act.title))}</h2><p class="intro">${fmtDate(ed.date, { weekday: 'long', day: 'numeric', month: 'long' })} · ${esc(act.time)} · ${esc(s.venues[act.venueId].name)}</p>
    <div class="qty"><span>${t('tickets')}</span><div class="stp"><button data-act="qty" data-v="-1" aria-label="-">−</button><b class="num">${checkoutQty}</b><button data-act="qty" data-v="1" aria-label="+">+</button></div></div>
    <div class="stable">${slicesOf(s, tick).map((x) => `<div class="srow"><i style="background:${x.color}"></i><span><b>${esc(x.label)}</b><small>${esc(x.sub)}</small></span><b class="num">${money(x.cents * checkoutQty)}</b></div>`).join('')}
      <div class="srow tot"><span>${t('total')}</span><b class="num">${money(act.priceCents * checkoutQty)}</b></div></div>
    <p class="note">${t('checkout_note', { a: money(proj * checkoutQty), p: p.name })}</p>
    ${payMethods()}
    <button class="btn btn-ink btn-block btn-l" data-act="pay" data-id="${id}">${t('pay', { a: money(act.priceCents * checkoutQty) })}</button>
    <p class="fine center">${t('refund_note')}</p></div>`;
}
function sheetTicket(id, fresh = false) {
  const s = state; const ed = s.editions[id]; const act = activityOf(s, ed);
  const mine = ed.attendees.filter((x) => x.startsWith(ME_NAME)).length;
  return `<div class="sh-pad center">${fresh ? `<div class="okmark">${icon('check')}</div><h2>${t('booked_h')}</h2><p class="intro">${t('booked_p', { p: s.projects[act.projectId].name })}</p>` : `<p class="lab">${t('your_ticket')}</p><h2>${esc(tx(act.title))}</h2>`}
    <div class="ticket rv"><div class="tk-top">${photo(s.templates[act.templateId].img, 'sm')}<div><b>${esc(tx(act.title))}</b><small>${fmtDate(ed.date, { weekday: 'long', day: 'numeric', month: 'long' })} · ${esc(act.time)}</small><small>${esc(s.venues[act.venueId].name)} · ${esc(s.venues[act.venueId].address || '')}</small></div></div>
      <div class="tk-qr">${qr(`${ed.id}-${ME_NAME}`)}<span class="scanline"></span></div><div class="tk-foot"><span>${ME_NAME}${mine > 1 ? ` +${mine - 1}` : ''}</span><span class="mono">${ed.id.toUpperCase()}</span></div></div>
    <p class="fine">${t('ticket_note')}</p>
    <div class="cta center"><a class="btn" href="#/me" data-act="close">${t('my_tickets')}</a></div></div>`;
}

/* ------------------------------------------------------------------ me (attendee) */
function meView() {
  const s = state; const me = s.people[ME]; const eds = myEditions(s);
  const next = eds.filter((e) => e.status === 'scheduled'); const past = eds.filter((e) => e.status === 'completed');
  const impact = {};
  for (const e of eds) {
    if (e.status !== 'completed' && e.status !== 'scheduled') continue;
    const act = activityOf(s, e); const per = ticketSplit(s, act, e.coOrganiserId).lines.find((l) => l.key === 'project').cents;
    const q = e.attendees.filter((x) => x.startsWith(ME_NAME)).length;
    (impact[act.projectId] ??= { t: 0, e: 0 })[e.status === 'completed' ? 't' : 'e'] += per * q;
  }
  const inviter = s.people[me.uplineId || me.invitedBy];
  const byAct = [...new Map(past.map((e) => [e.activityId, e])).values()];
  const stages = ['attendee', 'coorganiser', 'promoter']; const si = stages.indexOf(me.stage);
  return `<header class="hero wrap slim"><div class="me-head rv">${avatar(me, 'xl')}<div><p class="kicker">${t(`lad_${me.stage}`)}</p><h1>${t('hi', { n: me.name })}</h1><p class="lede">${t('me_lede')}</p></div></div></header>
  <main class="wrap">
    <section class="first">
      <h2 class="h2s rv">${t('your_impact')}</h2>
      <div class="impact">${Object.entries(impact).map(([pid, v], i) => { const p = s.projects[pid]; return `<div class="imp rv" style="--i:${i}">${ring(Math.min(1, (v.t + v.e) / 1000), money(v.t + v.e), '', p.color, 110)}<b>${esc(p.name)}</b><small>${money(v.t)} ${t('transferred').toLowerCase()}${v.e ? ` · ${money(v.e)} ${t('expected').toLowerCase()}` : ''}</small></div>`; }).join('') || `<p class="empty">${t('nothing_here')}</p>`}</div>
    </section>
    <section class="first"><h2 class="h2s rv">${t('upcoming_tickets')}</h2>
      <div class="tlist">${next.map((e, i) => { const a = activityOf(s, e); return `<button class="trow tap rv" style="--i:${i}" data-act="show-ticket" data-id="${e.id}">${photo(s.templates[a.templateId].img, 'sm')}<span><b>${esc(tx(a.title))}</b><small>${fmtDate(e.date, { weekday: 'long', day: 'numeric', month: 'long' })} · ${esc(a.time)}</small></span>${statusPill(s, e)}</button>`; }).join('') || `<p class="empty">${t('no_tickets')}</p>`}</div>
      <a class="more" href="#explore" data-scroll-home>${t('cta_explore')} ${icon('arrow')}</a>
    </section>
    <section class="first"><h2 class="h2s rv">${t('organise_next')}</h2><p class="muted rv">${t('organise_next_p')}</p>
      <div class="steps3 rv">${stages.map((k, i) => `<div class="s3 ${i < si ? 'done' : i === si ? 'on' : ''}"><span>${i + 1}</span><b>${t(`lad_${k}`)}</b><small>${t(`lad_${k}_safe`)}</small></div>`).join('')}</div>
      <div class="olist">${byAct.map((e, i) => {
        const a = activityOf(s, e); const prom = s.people[a.promoterId];
        const nextEd = editionsOf(s, a.id).find((x) => x.status === 'scheduled' && x.date > TODAY);
        const coOn = nextEd?.coOrganiserId === ME; const st = templateStats(s, a.templateId);
        const projected = nextEd ? Math.max(bookings(nextEd), a.minBookings) : 0;
        const fee = nextEd ? splitSales({ salesCents: projected * a.priceCents, promoterId: a.promoterId, coOrganiserId: ME, venueId: a.venueId, projectId: a.projectId }, s.people).lines.find((l) => l.key === 'coorganiser').cents : 0;
        return `<div class="ocard rv" style="--i:${i}">${photo(s.templates[a.templateId].img, 'oph')}<div class="obody"><p class="lab">${t('you_attended', { d: fmtDate(e.date) })}</p><h3>${esc(tx(a.title))}</h3><p class="small muted">${esc(prom.name)} · ${esc(s.venues[a.venueId].name)}</p>
          <div class="ochoices"><div><b>${t('coorg_title')}</b><p>${nextEd ? t('coorg_p', { d: fmtDate(nextEd.date), n: prom.name, a: money(fee), x: projected }) : t('no_next')}</p>${nextEd ? (coOn ? `<span class="pill p-ok">${t('coorg_on')}</span>` : `<button class="btn btn-s" data-act="co-organise" data-id="${nextEd.id}">${t('coorg_btn', { n: prom.name })}</button>`) : ''}</div>
          <div><b>${t('own_title')}</b><p>${t('own_p', { f: tx(s.templates[a.templateId].name), n: st.avgAttendance, a: money0(st.avgPromoterCents), h: st.hours })}</p><button class="btn btn-ink btn-s" data-act="start-own" data-id="${a.id}">${t('own_btn')}</button></div></div></div></div>`;
      }).join('') || `<p class="empty">${t('attend_first')}</p>`}</div>
      <div class="lockcard rv">${icon('link')}<div><b>${t('ref_link')}</b><p>${me.referralLockedAt ? t('ref_locked', { n: inviter?.name || '—', d: fmtLong(me.referralLockedAt) }) : t('ref_unlocked', { n: inviter?.name || '—' })}</p></div></div>
    </section>
  </main>${footer()}`;
}

/* ------------------------------------------------------------------ map (Leaflet + Esri light-gray tiles) */
let map = null; let mapLayers = {};
function initMap() {
  const host = $('#leaflet');
  if (!host || !window.L) return;
  if (map && map.getContainer() === host) { map.invalidateSize(); return; }
  if (map) { map.remove(); map = null; }
  host.innerHTML = '';
  const s = state;
  map = L.map(host, { zoomControl: false, scrollWheelZoom: false, attributionControl: true, fadeAnimation: false }).setView([40.4215, -3.695], 13);
  L.control.zoom({ position: 'bottomright' }).addTo(map);
  const esri = 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_';
  L.tileLayer(`${esri}Base/MapServer/tile/{z}/{y}/{x}`, { maxZoom: 18, maxNativeZoom: 16, attribution: 'Tiles © Esri — Esri, HERE, Garmin, © OpenStreetMap contributors' }).addTo(map);
  L.tileLayer(`${esri}Reference/MapServer/tile/{z}/{y}/{x}`, { maxZoom: 18, maxNativeZoom: 16, pane: 'shadowPane', opacity: 0.85 }).addTo(map);
  mapLayers = {};
  const acts = Object.values(s.activities).filter((a) => a.status === 'active');
  // curved funding flows venue -> project
  acts.forEach((a, i) => {
    const v = s.venues[a.venueId]; const p = s.projects[a.projectId]; if (!v?.lat || !p?.lat) return;
    const pts = []; const mx = (v.lat + p.lat) / 2 + (p.lng - v.lng) * 0.25; const my = (v.lng + p.lng) / 2 - (p.lat - v.lat) * 0.25;
    for (let k = 0; k <= 24; k++) { const u = k / 24; pts.push([(1 - u) ** 2 * v.lat + 2 * (1 - u) * u * mx + u * u * p.lat, (1 - u) ** 2 * v.lng + 2 * (1 - u) * u * my + u * u * p.lng]); }
    L.polyline(pts, { color: p.color, weight: 3, opacity: 0.85, className: `flowline fl${i % 3}`, interactive: false }).addTo(map);
  });
  for (const v of Object.values(s.venues)) {
    if (!v.lat) continue;
    const acts2 = acts.filter((a) => a.venueId === v.id);
    const m = L.marker([v.lat, v.lng], { icon: L.divIcon({ className: '', html: `<div class="mk mk-v"><img src="${img(v.img || 'newVenue', 120)}" alt=""><span>${acts2.length}</span></div>`, iconSize: [52, 52], iconAnchor: [26, 26] }) }).addTo(map);
    m.bindPopup(`<div class="pop">${photo(v.img || 'newVenue', 'pop-ph')}<b>${esc(v.name)}</b><small>${esc(tx(v.type))} · ${esc(v.address || v.neighbourhood)}</small>${acts2.map((a) => { const ne = editionsOf(s, a.id).find((e) => e.status === 'scheduled' && e.date >= TODAY); return `<div class="pop-a"><span>${esc(tx(a.title))}<small>${esc(s.people[a.promoterId].name)}${ne ? ` · ${fmtDate(ne.date)}` : ''}</small></span>${ne ? `<button data-open="ed" data-id="${ne.id}">${money(a.priceCents)}</button>` : ''}</div>`; }).join('')}</div>`, { maxWidth: 280, closeButton: false });
    mapLayers[`v:${v.id}`] = m;
  }
  for (const p of Object.values(s.projects)) {
    if (!p.lat) continue;
    const st = projectStats(s, p.id);
    const m = L.marker([p.lat, p.lng], { icon: L.divIcon({ className: '', html: `<div class="mk mk-p" style="--c:${p.color}"><i></i><img src="${img(p.img, 120)}" alt=""></div>`, iconSize: [44, 44], iconAnchor: [22, 22] }) }).addTo(map);
    m.bindPopup(`<div class="pop">${photo(p.img, 'pop-ph')}<b>${esc(p.name)}</b><small>${esc(tx(p.cause))}</small><div class="pop-a"><span>${t('raised')}<small>${t('of_goal', { g: money0(p.goalCents) })}</small></span><strong>${money0(st.transferred + st.donations)}</strong></div></div>`, { maxWidth: 260, closeButton: false });
    mapLayers[`p:${p.id}`] = m;
  }
  const pts = [...Object.values(s.venues), ...Object.values(s.projects)].filter((x) => x.lat).map((x) => [x.lat, x.lng]);
  const fit = () => map && pts.length && map.fitBounds(pts, { paddingTopLeft: [innerWidth > 1000 ? 340 : 30, 40], paddingBottomRight: [30, 30], maxZoom: 15, animate: false }) && map.getZoom() < 13 && map.setZoom(13, { animate: false });
  fit(); setTimeout(() => { if (map) { map.invalidateSize(); fit(); } }, 250);
}
