/* ================================================================== core
   Utilities, dates, revenue split engine, seed data, store, selectors.
   All money is integer cents. */

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = (p) => `${p}-${Math.random().toString(36).slice(2, 8)}`;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const sum = (arr, f = (x) => x) => arr.reduce((n, x) => n + f(x), 0);
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ------------------------------------------------------------------ dates */
const pad = (n) => String(n).padStart(2, '0');
const isoOf = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const TODAY = isoOf(new Date());
const addDays = (iso, n) => { const d = new Date(`${iso}T12:00:00`); d.setDate(d.getDate() + n); return isoOf(d); };
const dow = (iso) => new Date(`${iso}T12:00:00`).getDay();
const daysUntil = (iso) => Math.round((new Date(`${iso}T12:00:00`) - new Date(`${TODAY}T12:00:00`)) / 864e5);
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
// k-th previous occurrence of a weekday, strictly before today (k = 0 is the most recent)
function prevDay(day, k = 0) { let iso = addDays(TODAY, -1); while (dow(iso) !== day) iso = addDays(iso, -1); return addDays(iso, -7 * k); }
// k-th next occurrence of a weekday at least `minAhead` days from today
function nextDay(day, k = 0, minAhead = 0) { let iso = addDays(TODAY, minAhead); while (dow(iso) !== day) iso = addDays(iso, 1); return addDays(iso, 7 * k); }
function nextDates(day, count, minAhead = 1) { return Array.from({ length: count }, (_, k) => nextDay(day, k, minAhead)); }
const weekStart = (iso) => addDays(iso, -((dow(iso) + 6) % 7)); // Monday

/* ------------------------------------------------------------------ revenue split */
const SPLIT_BP = { business: 7000, promoter: 1500, project: 800, referral: 300, platform: 400 };
const REFERRAL_BP = [100, 80, 60, 40, 20];
const part = (cents, bp) => Math.round((cents * bp) / 10000);

function uplineChain(personId, people, max = REFERRAL_BP.length) {
  const chain = []; const seen = new Set([personId]);
  let cur = people[personId];
  while (cur && cur.uplineId && chain.length < max && !seen.has(cur.uplineId)) {
    seen.add(cur.uplineId); chain.push(cur.uplineId); cur = people[cur.uplineId];
  }
  return chain;
}

// Lines always sum exactly to salesCents. Empty referral levels + rounding go to the project.
function splitSales({ salesCents, promoterId, coOrganiserId = null, venueId, projectId }, people) {
  const business = part(salesCents, SPLIT_BP.business);
  const promoter = part(salesCents, SPLIT_BP.promoter);
  const platform = part(salesCents, SPLIT_BP.platform);
  const projectBase = part(salesCents, SPLIT_BP.project);
  const referrals = uplineChain(promoterId, people).map((id, i) => ({ key: 'referral', partyType: 'person', partyId: id, level: i + 1, cents: part(salesCents, REFERRAL_BP[i]) }));
  const projectTotal = salesCents - business - promoter - platform - sum(referrals, (r) => r.cents);
  const promoterLines = coOrganiserId
    ? [{ key: 'promoter', partyType: 'person', partyId: promoterId, cents: promoter - Math.floor(promoter / 2), shared: true },
       { key: 'coorganiser', partyType: 'person', partyId: coOrganiserId, cents: Math.floor(promoter / 2), shared: true }]
    : [{ key: 'promoter', partyType: 'person', partyId: promoterId, cents: promoter }];
  const lines = [
    { key: 'business', partyType: 'venue', partyId: venueId, cents: business },
    ...promoterLines, ...referrals,
    { key: 'project', partyType: 'project', partyId: projectId, cents: projectTotal, base: projectBase, fromReferral: projectTotal - projectBase },
    { key: 'platform', partyType: 'platform', partyId: 'platform', cents: platform },
  ];
  return { salesCents, lines, check: sum(lines, (l) => l.cents) };
}

/* ------------------------------------------------------------------ images */
const IMG = {
  hero: 'photo-1543269865-cbf427effbad', heroCafe: 'photo-1554118811-1e0d58224f24', madrid: 'photo-1570698473651-b2de99bae12f',
  tertulia: 'photo-1511081692775-05d0f180a065', libros: 'photo-1607957333562-c760eee665ef', arcilla: 'photo-1676125105332-608345abe20e',
  newVenue: 'photo-1555396273-367ea4eb4db5', owner: 'photo-1753351052363-53ce102830eb', workshop: 'photo-1655337690778-694dda7f4454',
  language: 'photo-1590650046871-92c887180603', boardgames: 'photo-1676651471150-0e3a5f8de05e', quiz: 'photo-1558210598-89ba75b1724e',
  ceramics: 'photo-1609881583302-61548332039c', bookclub: 'photo-1763896081109-ed6bf56ae955',
  aulas: 'photo-1532789339108-2ebc484efbf1', patitas: 'photo-1553688738-a278b9f063e0', huertos: 'photo-1524247108137-732e0f642303',
};
const img = (key, w = 900) => `https://images.unsplash.com/${IMG[key] || key}?auto=format&fit=crop&w=${w}&q=72`;

/* ------------------------------------------------------------------ seed */
const SEED_VERSION = 8;
const ME = 'sofia';
const ME_NAME = 'Sofía';
const NAMES = ['Lucía', 'Mateo', 'Carmen', 'Diego', 'Paula', 'Hugo', 'Elena', 'Pablo', 'Irene', 'Álvaro', 'Nerea', 'Sergio', 'Clara', 'Raúl', 'Noa', 'Iván', 'Marina', 'Jorge', 'Alba', 'Tomás', 'Sara', 'Leo', 'Julia', 'Adrián', 'Inés', 'Bruno', 'Olivia', 'Gael'];

function hashStr(str) { let h = 2166136261; for (const ch of str) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0; }
function attendeeNames(id, n, withMe) {
  const pool = [...NAMES]; let h = hashStr(id);
  for (let i = pool.length - 1; i > 0; i--) { h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0; const j = h % (i + 1); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  const names = pool.slice(0, withMe ? n - 1 : n);
  return withMe ? [ME_NAME, ...names] : names;
}
function makeEdition(id, activityId, editionNo, date, n, status, withMe = false) {
  const attendees = attendeeNames(id, n, withMe);
  return { id, activityId, editionNo, date, status, attendees, checkins: status === 'completed' ? [...attendees] : [], coOrganiserId: null, messages: [], completedAt: status === 'completed' ? date : null };
}

function createSeed() {
  const L3 = (en, zh, es) => ({ en, zh, es });
  const people = {
    ana: { id: 'ana', name: 'Ana', neighbourhood: 'Malasaña', uplineId: null, isPromoter: true, stage: 'promoter', joined: addDays(TODAY, -220), referralLockedAt: null, color: '#FF7A1A', bio: L3('Teacher. Runs language exchanges every week.', '英语老师，每周组织语言交换。', 'Profesora. Organiza intercambios de idiomas cada semana.'), interests: ['languages', 'social'] },
    luis: { id: 'luis', name: 'Luis', neighbourhood: 'Lavapiés', uplineId: 'ana', isPromoter: true, stage: 'promoter', joined: addDays(TODAY, -81), referralLockedAt: addDays(TODAY, -81), color: '#1E9E61', bio: L3('Came to Ana’s exchange, now hosts board games.', '先参加了 Ana 的语言交换，现在组织桌游。', 'Vino al intercambio de Ana; ahora organiza juegos de mesa.'), interests: ['games'] },
    marta: { id: 'marta', name: 'Marta', neighbourhood: 'Chamberí', uplineId: 'luis', isPromoter: true, stage: 'promoter', joined: addDays(TODAY, -38), referralLockedAt: addDays(TODAY, -38), color: '#7A5AF8', bio: L3('Ceramicist. Joined through Luis.', '陶艺师，经 Luis 介绍加入。', 'Ceramista. Llegó a través de Luis.'), interests: ['crafts'] },
    javier: { id: 'javier', name: 'Javier', neighbourhood: 'Malasaña', uplineId: null, isPromoter: true, stage: 'promoter', joined: addDays(TODAY, -150), referralLockedAt: null, color: '#1F5BFF', bio: L3('Independent quiz master.', '独立组织者，知识竞赛主持人。', 'Presentador independiente de quizzes.'), interests: ['culture'] },
    sofia: { id: 'sofia', name: 'Sofía', neighbourhood: 'Lavapiés', uplineId: null, invitedBy: 'ana', isPromoter: false, stage: 'attendee', joined: addDays(TODAY, -12), referralLockedAt: null, color: '#E3263A', bio: L3('Loves languages and books.', '喜欢语言和读书。', 'Le encantan los idiomas y los libros.'), interests: ['languages', 'books', 'social'], availability: ['Wed', 'Sat'] },
  };

  const venues = {
    tertulia: { id: 'tertulia', name: 'Café La Tertulia', img: 'tertulia', type: L3('Café', '咖啡馆', 'Cafetería'), neighbourhood: 'Malasaña', address: 'Calle del Espíritu Santo 18', lat: 40.4255, lng: -3.7046, owner: 'Carmen', capacity: 25,
      slots: [{ day: 'Wed', from: '18:00', to: '20:00' }, { day: 'Thu', from: '17:00', to: '19:00' }],
      services: [L3('One drink included', '含一杯饮品', 'Una bebida incluida'), L3('Projector', '投影仪', 'Proyector'), 'Wi-Fi'], minAttendance: 12,
      ticketRequirement: L3('Ticket must include one drink', '门票须包含一杯饮品', 'La entrada debe incluir una bebida'),
      houseRules: L3('Music off after 20:00.', '20:00 后关闭音乐。', 'Música apagada después de las 20:00.'),
      description: L3('A cosy corner for 25 people at the back of the café, quiet on weekday afternoons.', '咖啡馆后方可容纳 25 人的安静角落，工作日下午人少。', 'Un rincón acogedor para 25 personas al fondo del café, tranquilo entre semana por la tarde.'),
      costPerAttendeeCents: 150, fixedCostCents: 2500 },
    libros: { id: 'libros', name: 'Libros del Sur', img: 'libros', type: L3('Bookshop', '书店', 'Librería'), neighbourhood: 'Lavapiés', address: 'Calle de Argumosa 9', lat: 40.4085, lng: -3.6985, owner: 'Rosa', capacity: 20,
      slots: [{ day: 'Sat', from: '11:00', to: '13:00' }], services: [L3('Long tables', '长桌', 'Mesas largas'), L3('Board game library', '桌游库', 'Ludoteca')], minAttendance: 8,
      ticketRequirement: L3('No extra requirement', '无额外要求', 'Sin requisitos adicionales'), houseRules: L3('No food near the shelves.', '书架附近请勿进食。', 'Sin comida cerca de las estanterías.'),
      description: L3('Back room of an independent bookshop with long tables and a shelf of board games.', '独立书店的后厅，有长桌和一整排桌游。', 'Trastienda de una librería independiente con mesas largas y estantería de juegos.'),
      costPerAttendeeCents: 0, fixedCostCents: 2000 },
    arcilla: { id: 'arcilla', name: 'Taller Arcilla', img: 'arcilla', type: L3('Ceramics studio', '陶艺工作室', 'Taller de cerámica'), neighbourhood: 'Chamberí', address: 'Calle de Fernández de los Ríos 40', lat: 40.4352, lng: -3.7105, owner: 'Pilar', capacity: 12,
      slots: [{ day: 'Sun', from: '10:00', to: '13:00' }], services: [L3('Clay and glazes', '陶土与釉料', 'Arcilla y esmaltes'), L3('Kiln firing', '窑烧', 'Cocción en horno'), L3('Aprons', '围裙', 'Delantales')], minAttendance: 6,
      ticketRequirement: L3('Ticket must cover materials', '门票须包含材料费', 'La entrada debe cubrir materiales'), houseRules: L3('Pieces are collected a week later.', '作品一周后领取。', 'Las piezas se recogen una semana después.'),
      description: L3('A bright studio with wheels and hand-building tables. Materials included.', '明亮的工作室，有拉坯机和手捏台，材料全包。', 'Un taller luminoso con tornos y mesas de modelado. Materiales incluidos.'),
      costPerAttendeeCents: 600, fixedCostCents: 3000 },
  };

  const projects = {
    aulas: { id: 'aulas', name: 'Aulas Abiertas', img: 'aulas', color: '#1E9E61', goalCents: 500000, status: 'verified', lat: 40.4598, lng: -3.6985, tags: ['education', 'languages', 'books'],
      cause: L3('Free tutoring for children', '为儿童提供免费课业辅导', 'Refuerzo escolar gratuito para niños'),
      description: L3('After-school maths and reading support for 40 children in Tetuán.', '为 Tetuán 区 40 名儿童提供课后数学与阅读辅导。', 'Apoyo de matemáticas y lectura para 40 niños de Tetuán.') },
    patitas: { id: 'patitas', name: 'Refugio Patitas', img: 'patitas', color: '#FF7A1A', goalCents: 300000, status: 'verified', lat: 40.3905, lng: -3.6600, tags: ['animals'],
      cause: L3('Animal shelter', '动物救助站', 'Refugio de animales'),
      description: L3('Food, vet care and adoption days for 60 rescued dogs and cats.', '为 60 只获救猫狗提供食物、医疗和领养日。', 'Comida, veterinario y jornadas de adopción para 60 perros y gatos.') },
    huertos: { id: 'huertos', name: 'Huertos Vivos', img: 'huertos', color: '#7A5AF8', goalCents: 400000, status: 'verified', lat: 40.3985, lng: -3.7080, tags: ['environment', 'social'],
      cause: L3('Urban community gardens', '城市社区菜园', 'Huertos urbanos comunitarios'),
      description: L3('Turning 3 empty plots in Arganzuela into community gardens with school workshops.', '把 Arganzuela 的 3 块空地变成社区菜园，并开设学校工作坊。', 'Convertir 3 solares de Arganzuela en huertos con talleres escolares.') },
  };

  const templates = {
    language: { id: 'language', img: 'language', hours: 3, defaultPriceCents: 1200, defaultCapacity: 25, defaultMin: 12, interests: ['languages', 'social'], name: L3('Language exchange', '语言交换', 'Intercambio de idiomas'),
      checklist: [L3('Pick two languages and a theme', '确定两种语言和主题', 'Elige dos idiomas y un tema'), L3('Prepare tables by level', '按水平准备桌牌', 'Prepara mesas por nivel'), L3('Share your link in 2 local groups', '在 2 个本地群分享链接', 'Comparte el enlace en 2 grupos locales'), L3('Rotate tables every 20 minutes', '每 20 分钟换桌', 'Rota las mesas cada 20 minutos'), L3('Scan every ticket at the door', '入场时扫码验票', 'Escanea cada entrada en la puerta')] },
    boardgames: { id: 'boardgames', img: 'boardgames', hours: 3.5, defaultPriceCents: 1000, defaultCapacity: 20, defaultMin: 8, interests: ['games', 'social'], name: L3('Board games', '桌游', 'Juegos de mesa'),
      checklist: [L3('Choose 4–5 games for mixed groups', '挑选 4–5 款适合新手的游戏', 'Elige 4–5 juegos para grupos mixtos'), L3('Learn the rules', '熟悉规则', 'Aprende las reglas'), L3('Share your link with game communities', '在桌游社群分享链接', 'Comparte el enlace con comunidades de juego'), L3('Explain rules at each table', '逐桌讲解规则', 'Explica las reglas en cada mesa'), L3('Scan every ticket at the door', '入场时扫码验票', 'Escanea cada entrada en la puerta')] },
    quiz: { id: 'quiz', img: 'quiz', hours: 4, defaultPriceCents: 800, defaultCapacity: 25, defaultMin: 12, interests: ['culture', 'social'], name: L3('Quiz night', '知识竞赛之夜', 'Noche de quiz'),
      checklist: [L3('Write 5 rounds of 8 questions', '准备 5 轮、每轮 8 题', 'Escribe 5 rondas de 8 preguntas'), L3('Prepare slides and answer sheets', '准备幻灯片和答题卡', 'Prepara diapositivas y hojas'), L3('Invite teams', '邀请队伍报名', 'Invita a equipos'), L3('Keep score live', '实时计分', 'Lleva el marcador en directo'), L3('Scan every ticket at the door', '入场时扫码验票', 'Escanea cada entrada en la puerta')] },
    workshop: { id: 'workshop', img: 'ceramics', hours: 5, defaultPriceCents: 3000, defaultCapacity: 12, defaultMin: 6, interests: ['crafts', 'art'], name: L3('Creative workshop', '创意手作工坊', 'Taller creativo'),
      checklist: [L3('Agree materials with the venue', '与场地确认材料', 'Acuerda los materiales con el espacio'), L3('Plan a simple first piece', '设计简单的入门作品', 'Planifica una primera pieza sencilla'), L3('Share your link with craft groups', '在手作社群分享链接', 'Comparte el enlace con grupos de manualidades'), L3('Demo, then help each person', '先示范，再逐个指导', 'Demuestra y ayuda a cada persona'), L3('Scan every ticket at the door', '入场时扫码验票', 'Escanea cada entrada en la puerta')] },
    bookclub: { id: 'bookclub', img: 'bookclub', hours: 2.5, defaultPriceCents: 800, defaultCapacity: 15, defaultMin: 8, interests: ['books', 'social'], fallback: { avgAttendance: 11 }, name: L3('Book club', '读书会', 'Club de lectura'),
      checklist: [L3('Choose a short book 4 weeks ahead', '提前 4 周选定一本短书', 'Elige un libro corto con 4 semanas'), L3('Prepare 6 questions', '准备 6 个讨论问题', 'Prepara 6 preguntas'), L3('Share your link with readers', '在读者群分享链接', 'Comparte el enlace con lectores'), L3('Moderate and vote the next book', '主持讨论并投票选下一本', 'Modera y vota el próximo libro'), L3('Scan every ticket at the door', '入场时扫码验票', 'Escanea cada entrada en la puerta')] },
  };

  const activities = {
    'act-ana': { id: 'act-ana', templateId: 'language', promoterId: 'ana', venueId: 'tertulia', projectId: 'aulas', priceCents: 1200, capacity: 25, minBookings: 12, recurrence: 'weekly', day: 'Wed', time: '18:00–20:00', status: 'active',
      title: L3('Spanish-English Language Exchange', '西英语言交换', 'Intercambio Español-Inglés'),
      description: L3('Practise English and Spanish at relaxed tables by level. One drink included.', '按水平分桌，轻松练习英语和西班牙语，含一杯饮品。', 'Practica inglés y español en mesas por nivel. Incluye una bebida.'),
      included: [L3('One drink', '一杯饮品', 'Una bebida'), L3('Tables by level', '按水平分桌', 'Mesas por nivel'), L3('Friendly host', '热情的主持人', 'Anfitriona cercana')] },
    'act-luis': { id: 'act-luis', templateId: 'boardgames', promoterId: 'luis', venueId: 'libros', projectId: 'patitas', priceCents: 1000, capacity: 20, minBookings: 8, recurrence: 'weekly', day: 'Sat', time: '11:00–13:00', status: 'active',
      title: L3('Board Game Saturday', '周六桌游会', 'Sábado de juegos de mesa'),
      description: L3('Modern board games for beginners and fans in a bookshop back room.', '在书店后厅玩现代桌游，新手老手都欢迎。', 'Juegos de mesa modernos para principiantes y fans en la trastienda de una librería.'),
      included: [L3('Games and explanations', '游戏与规则讲解', 'Juegos y explicaciones'), L3('Mixed tables for newcomers', '新手友好的混合桌', 'Mesas mixtas para recién llegados')] },
    'act-marta': { id: 'act-marta', templateId: 'workshop', promoterId: 'marta', venueId: 'arcilla', projectId: 'aulas', priceCents: 3000, capacity: 12, minBookings: 6, recurrence: 'every 2 weeks', day: 'Sun', time: '10:00–13:00', status: 'active',
      title: L3('Ceramics Workshop', '陶艺工作坊', 'Taller de cerámica'),
      description: L3('Make your first bowl by hand. All materials and firing included.', '亲手做出你的第一只碗，材料和烧制全包。', 'Haz tu primer cuenco a mano. Materiales y cocción incluidos.'),
      included: [L3('Clay and glazes', '陶土与釉料', 'Arcilla y esmaltes'), L3('Kiln firing', '窑烧', 'Cocción'), L3('Take your piece home', '作品带回家', 'Llévate tu pieza')] },
    'act-javier': { id: 'act-javier', templateId: 'quiz', promoterId: 'javier', venueId: 'tertulia', projectId: 'huertos', priceCents: 800, capacity: 25, minBookings: 12, recurrence: 'weekly', day: 'Thu', time: '17:00–19:00', status: 'active',
      title: L3('Cultural Quiz Night', '文化知识竞赛', 'Quiz cultural'),
      description: L3('Teams of up to 4. Five rounds on Madrid, music, film and history.', '最多 4 人一队，五轮题目：马德里、音乐、电影和历史。', 'Equipos de hasta 4. Cinco rondas sobre Madrid, música, cine e historia.'),
      included: [L3('One drink', '一杯饮品', 'Una bebida'), L3('5 rounds', '5 轮题目', '5 rondas'), L3('Prize for the winners', '冠军奖品', 'Premio para el equipo ganador')] },
    'act-marta-taster': { id: 'act-marta-taster', templateId: 'workshop', promoterId: 'marta', venueId: 'arcilla', projectId: 'aulas', priceCents: 2500, capacity: 12, minBookings: 6, recurrence: 'one-off', day: WEEKDAYS[dow(addDays(TODAY, -1))], time: '19:00–21:00', status: 'active',
      title: L3('Ceramics Taster Evening', '陶艺体验之夜', 'Tarde de iniciación a la cerámica'),
      description: L3('A short hand-building session for first-timers.', '为新手准备的短时手捏陶体验。', 'Una sesión corta de modelado para principiantes.'),
      included: [L3('Clay and tools', '陶土与工具', 'Arcilla y herramientas'), L3('Kiln firing', '窑烧', 'Cocción')] },
    'act-javier-sp': { id: 'act-javier-sp', templateId: 'quiz', promoterId: 'javier', venueId: 'tertulia', projectId: 'huertos', priceCents: 1000, capacity: 25, minBookings: 12, recurrence: 'one-off', day: 'Thu', time: '17:00–19:00', status: 'pending',
      title: L3('Quiz Night: Season Special', '知识竞赛：季度特别场', 'Quiz: especial de temporada'),
      description: L3('A themed edition with a costume prize.', '主题特别场，设有最佳装扮奖。', 'Edición temática con premio al mejor disfraz.'),
      included: [L3('One drink', '一杯饮品', 'Una bebida'), L3('Costume prize', '装扮奖', 'Premio al disfraz')] },
  };

  const W = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const past = (act, day, counts, mine = []) => counts.map((n, i) => {
    const k = counts.length - 1 - i;
    return makeEdition(`e-${act}-${i + 1}`, `act-${act}`, i + 1, prevDay(W[day], k * (act === 'marta' ? 2 : 1)), n, 'completed', mine.includes(i));
  });
  const list = [
    ...past('ana', 'Wed', [15, 17, 18, 19, 19, 20], [4, 5]), // last = Example A (€240)
    makeEdition('e-ana-7', 'act-ana', 7, nextDay(W.Wed, 0, 1), 14, 'scheduled', true),
    makeEdition('e-ana-8', 'act-ana', 8, nextDay(W.Wed, 1, 1), 6, 'scheduled'),
    ...past('luis', 'Sat', [16, 18, 20], [2]), // last = Example B (€200)
    makeEdition('e-luis-4', 'act-luis', 4, nextDay(W.Sat, 0, 1), 12, 'scheduled'),
    ...past('marta', 'Sun', [10]), // Example C (€300)
    makeEdition('e-marta-2', 'act-marta', 2, nextDay(W.Sun, 0, 5), 5, 'scheduled'),
    ...past('javier', 'Thu', [18, 20, 21, 22]), // last = Example D (€176)
    makeEdition('e-javier-5', 'act-javier', 5, nextDay(W.Thu, 0, 4), 10, 'scheduled'),
    makeEdition('e-marta-taster', 'act-marta-taster', 1, addDays(TODAY, -1), 8, 'scheduled'), // took place yesterday, awaiting check-in
    makeEdition('e-javier-sp', 'act-javier-sp', 1, nextDay(W.Thu, 2, 4), 0, 'pending'),
  ];
  const editions = Object.fromEntries(list.map((e) => [e.id, e]));

  const requests = {
    'req-1': { id: 'req-1', activityId: 'act-javier-sp', editionId: 'e-javier-sp', venueId: 'tertulia', status: 'pending', sent: addDays(TODAY, -2), note: L3('Same format as the weekly quiz, with a costume prize.', '和每周竞赛同样的形式，加一个装扮奖。', 'Mismo formato que el quiz semanal, con premio al disfraz.'), reply: '' },
  };

  const donations = [
    { id: 'd1', projectId: 'aulas', donor: 'Anonymous', cents: 15000, date: addDays(TODAY, -27) },
    { id: 'd2', projectId: 'patitas', donor: 'Rosa', cents: 4000, date: addDays(TODAY, -11) },
    { id: 'd3', projectId: 'huertos', donor: 'Anonymous', cents: 2500, date: addDays(TODAY, -7) },
  ];

  const state = {
    version: SEED_VERSION, people, venues, projects, templates, activities, editions, requests, donations,
    payouts: [], costs: {}, session: { account: 'person:ana', lang: null }, wizard: null,
  };
  // Earlier balances were already paid out on the last Monday-run payout.
  const cutoff = addDays(TODAY, -10);
  const paidOn = prevDay(1, 0);
  for (const key of ['person:ana', 'person:luis', 'person:javier', 'venue:tertulia', 'venue:libros']) {
    const [type, id] = key.split(':');
    const old = ledgerFor(state, type === 'person' ? 'person' : 'venue', id).filter((r) => r.kind === 'Transferred' && r.ed.date < cutoff);
    const cents = sum(old, (r) => r.line.cents);
    if (cents) state.payouts.push({ id: uid('po'), account: key, cents, date: paidOn, status: 'paid' });
  }
  return state;
}

/* ------------------------------------------------------------------ store */
const STORE_KEY = 'crowdpromo-v2';
let state;
const listeners = new Set();
function loadState() {
  try { const raw = localStorage.getItem(STORE_KEY); if (raw) { const s = JSON.parse(raw); if (s.version === SEED_VERSION) return s; } } catch (e) { /* private mode */ }
  return createSeed();
}
function saveState() { try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* ignore */ } }
function update(fn) { fn(state); maintain(state); saveState(); listeners.forEach((l) => l()); }
function patch(fn) { fn(state); saveState(); }
function resetState() { state = createSeed(); maintain(state); saveState(); listeners.forEach((l) => l()); }
const actions = {};

// Keeps the calendar alive: auto-cancels below-minimum editions 48h before and schedules the next recurring edition.
function maintain(s) {
  for (const ed of Object.values(s.editions)) {
    if (ed.status !== 'scheduled') continue;
    const act = s.activities[ed.activityId];
    if (ed.attendees.length < act.minBookings && daysUntil(ed.date) <= 2) { ed.status = 'cancelled'; ed.refundedCents = ed.attendees.length * act.priceCents; ed.cancelledAt = TODAY; }
  }
  const STEP = { weekly: 7, 'every 2 weeks': 14, monthly: 28 };
  for (const act of Object.values(s.activities)) {
    if (act.status !== 'active' || !STEP[act.recurrence]) continue;
    const eds = Object.values(s.editions).filter((e) => e.activityId === act.id).sort((a, b) => a.date.localeCompare(b.date));
    if (eds.some((e) => e.status === 'scheduled' && e.date >= TODAY)) continue;
    const last = eds[eds.length - 1];
    let date = last ? addDays(last.date, STEP[act.recurrence]) : nextDay(WEEKDAYS.indexOf(act.day), 0, 3);
    while (daysUntil(date) < 3) date = addDays(date, STEP[act.recurrence]);
    const id = `${act.id.replace('act-', 'e-')}-${(last?.editionNo || 0) + 1}`;
    s.editions[id] = { id, activityId: act.id, editionNo: (last?.editionNo || 0) + 1, date, status: 'scheduled', attendees: [], checkins: [], coOrganiserId: null, messages: [], completedAt: null };
  }
}

/* ------------------------------------------------------------------ selectors */
const activityOf = (s, ed) => s.activities[ed.activityId];
const bookings = (ed) => ed.attendees.length;
const salesOf = (s, ed) => bookings(ed) * activityOf(s, ed).priceCents;
const editionsOf = (s, actId) => Object.values(s.editions).filter((e) => e.activityId === actId).sort((a, b) => a.date.localeCompare(b.date));
const countsForLedger = (ed) => ed.status === 'scheduled' || ed.status === 'completed';
const moneyKind = (ed) => (ed.status === 'completed' ? 'Transferred' : 'Expected');

function editionSplit(s, ed) {
  const act = activityOf(s, ed);
  return splitSales({ salesCents: salesOf(s, ed), promoterId: act.promoterId, coOrganiserId: ed.coOrganiserId, venueId: act.venueId, projectId: act.projectId }, s.people);
}
function ticketSplit(s, act, coOrganiserId = null) {
  return splitSales({ salesCents: act.priceCents, promoterId: act.promoterId, coOrganiserId, venueId: act.venueId, projectId: act.projectId }, s.people);
}
function ledgerFor(s, partyType, partyId) {
  const rows = [];
  for (const ed of Object.values(s.editions)) {
    if (!countsForLedger(ed)) continue;
    for (const line of editionSplit(s, ed).lines) {
      if (line.partyType === partyType && line.partyId === partyId && line.cents > 0) rows.push({ ed, act: activityOf(s, ed), line, kind: moneyKind(ed) });
    }
  }
  return rows.sort((a, b) => b.ed.date.localeCompare(a.ed.date));
}
function sumKinds(rows) {
  return rows.reduce((t, r) => { t[r.kind === 'Transferred' ? 'transferred' : 'expected'] += r.line.cents; return t; }, { expected: 0, transferred: 0 });
}
function edStatus(s, ed) {
  const act = activityOf(s, ed);
  if (ed.status === 'completed') return { key: 'completed', tone: 'done' };
  if (ed.status === 'cancelled') return { key: 'cancelled', tone: 'bad' };
  if (ed.status === 'pending') return { key: 'pending', tone: 'wait' };
  if (ed.status === 'declined') return { key: 'declined', tone: 'bad' };
  if (ed.date < TODAY) return { key: 'awaiting', tone: 'wait' };
  return bookings(ed) >= act.minBookings ? { key: 'confirmed', tone: 'ok' } : { key: 'open', tone: 'open' };
}
function templateStats(s, templateId) {
  const t = s.templates[templateId];
  const done = Object.values(s.editions).filter((e) => e.status === 'completed' && s.activities[e.activityId].templateId === templateId);
  if (!done.length) {
    const avg = t.fallback?.avgAttendance ?? t.defaultMin;
    const prom = Math.round(avg * t.defaultPriceCents * 0.15);
    return { editions: 0, avgAttendance: avg, avgPromoterCents: prom, hours: t.hours, perHourCents: Math.round(prom / t.hours), verified: false };
  }
  const prom = sum(done, (e) => sum(editionSplit(s, e).lines.filter((l) => l.key === 'promoter' || l.key === 'coorganiser'), (l) => l.cents)) / done.length;
  return { editions: done.length, avgAttendance: Math.round(sum(done, bookings) / done.length), avgPromoterCents: Math.round(prom), hours: t.hours, perHourCents: Math.round(prom / t.hours), verified: true };
}
function projectStats(s, projectId) {
  const rows = ledgerFor(s, 'project', projectId);
  const totals = sumKinds(rows);
  const donations = sum(s.donations.filter((d) => d.projectId === projectId), (d) => d.cents);
  const byAct = {};
  for (const r of rows) {
    const c = (byAct[r.act.id] ??= { act: r.act, transferred: 0, expected: 0, editions: 0, fromReferral: 0 });
    c[r.kind === 'Transferred' ? 'transferred' : 'expected'] += r.line.cents;
    if (r.kind === 'Transferred') { c.editions += 1; c.fromReferral += r.line.fromReferral; }
  }
  return { ...totals, donations, contributors: Object.values(byAct) };
}
function recurrence(s) {
  let repeat = 0; let first = 0;
  for (const ed of Object.values(s.editions)) if (ed.status === 'completed') { if (ed.editionNo > 1) repeat += salesOf(s, ed); else first += salesOf(s, ed); }
  return { repeat, first, share: repeat + first ? repeat / (repeat + first) : 0 };
}
const promoters = (s) => Object.values(s.people).filter((p) => p.isPromoter);
const upcoming = (s) => Object.values(s.editions).filter((e) => e.status === 'scheduled' && e.date >= TODAY).sort((a, b) => a.date.localeCompare(b.date));
const myEditions = (s) => Object.values(s.editions).filter((e) => e.attendees.includes(ME_NAME)).sort((a, b) => b.date.localeCompare(a.date));
const downline = (s, id) => Object.values(s.people).filter((p) => p.uplineId === id).map((p) => ({ person: p, children: downline(s, p.id) }));

// Account = 'person:<id>' or 'venue:<id>'.
function accountInfo(s, key) {
  const [type, id] = key.split(':');
  const ref = type === 'venue' ? s.venues[id] : s.people[id];
  return { key, type, id, ref, partyType: type === 'venue' ? 'venue' : 'person' };
}
function accountLedger(s, key) { const a = accountInfo(s, key); return ledgerFor(s, a.partyType, a.id); }
function balanceOf(s, key) {
  const t = sumKinds(accountLedger(s, key));
  const paid = sum(s.payouts.filter((p) => p.account === key), (p) => p.cents);
  return { ...t, paid, available: t.transferred - paid };
}
// Weekly series: transferred (completed) and expected (scheduled) per week for an account.
function weeklySeries(s, key, weeksBack = 8, weeksAhead = 3) {
  const rows = accountLedger(s, key);
  const start = addDays(weekStart(TODAY), -7 * weeksBack);
  return Array.from({ length: weeksBack + weeksAhead + 1 }, (_, i) => {
    const from = addDays(start, 7 * i); const to = addDays(from, 7);
    const inWeek = rows.filter((r) => r.ed.date >= from && r.ed.date < to);
    return { from, transferred: sum(inWeek.filter((r) => r.kind === 'Transferred'), (r) => r.line.cents), expected: sum(inWeek.filter((r) => r.kind === 'Expected'), (r) => r.line.cents), current: from === weekStart(TODAY) };
  });
}
function costSettings(s, key) {
  const a = accountInfo(s, key);
  const saved = s.costs[key] || {};
  if (a.type === 'venue') return { perAttendee: saved.perAttendee ?? a.ref.costPerAttendeeCents, fixed: saved.fixed ?? a.ref.fixedCostCents };
  return { hours: saved.hours ?? null, perEdition: saved.perEdition ?? 500 };
}
// Profit for completed editions: revenue - estimated costs.
function profitOf(s, key) {
  const a = accountInfo(s, key); const c = costSettings(s, key);
  const rows = accountLedger(s, key).filter((r) => r.kind === 'Transferred');
  const revenue = sum(rows, (r) => r.line.cents);
  if (a.type === 'venue') {
    const eds = rows.map((r) => r.ed);
    const costs = sum(eds, (e) => c.fixed + bookings(e) * c.perAttendee);
    return { revenue, costs, profit: revenue - costs, hours: null };
  }
  const own = rows.filter((r) => r.line.key === 'promoter' || r.line.key === 'coorganiser');
  const costs = own.length * c.perEdition;
  const hours = sum(own, (r) => c.hours ?? s.templates[r.act.templateId].hours);
  return { revenue, costs, profit: revenue - costs, hours, perHour: hours ? Math.round((sum(own, (r) => r.line.cents) - costs) / hours) : 0 };
}
