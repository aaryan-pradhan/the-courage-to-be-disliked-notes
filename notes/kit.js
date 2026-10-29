// Picture kit + page renderer. Pages call page({...}) with data; pictures come from G / V / plot / tb.
// Box kinds share one color meaning across the whole book:
//   past = objective fact / past event (gray)   goal = goal (amber)   me = your meaning / choice (blue)
//   act = behavior / result (green)              bad = false / refuted (red)   x = neutral   lbl = bare text
const K = {past:['#262b35','#8b95a7'], goal:['#3a2e10','#f2b84b'], me:['#10304d','#5aa9ff'],
  act:['#123a26','#4cc38a'], bad:['#3d1a1c','#ff6b6b'], x:['#22252b','#6b7280']};
const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;');
const lines = s => String(s).split('\n');

function txt(x, y, s, a = '') {
  const L = lines(s);
  return `<text x="${x}" y="${y - (L.length - 1) * 9}" ${a}>` +
    L.map((l, i) => `<tspan x="${x}" dy="${i ? 18 : 0}">${esc(l)}</tspan>`).join('') + '</text>';
}
const svg = (x, y, w, h, body) =>
  `<svg viewBox="${x} ${y} ${w} ${h}" style="max-width:${w}px" role="img">
  <defs>${['#9aa4b2', '#ff6b6b'].map((c, i) => `<marker id="m${i}" viewBox="0 0 10 10" refX="9" refY="5"
  markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="${c}"/></marker>`).join('')}</defs>${body}</svg>`;

// Box graph. n = {id:[col,row,'label','kind',width?]}, e = [[from,to,'label','style']]
// style: '-' dashed, 'x' false/crossed (red), 'n' no arrowhead. Rows/cols may be fractional.
function G(n, e = []) {
  const X = 230, Y = 100, P = {};
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9, out = '';
  for (const k in n) {
    const [c, r, t, kind = 'x', w = 150] = n[k], h = Math.max(48, lines(t).length * 18 + 18);
    P[k] = {cx: c * X, cy: r * Y, w, h, kind, t};
    x0 = Math.min(x0, c * X - w / 2); x1 = Math.max(x1, c * X + w / 2);
    y0 = Math.min(y0, r * Y - h / 2); y1 = Math.max(y1, r * Y + h / 2);
  }
  const clip = (p, dx, dy, pad) => {
    const t = Math.min((p.w / 2 + pad) / Math.abs(dx || 1e-9), (p.h / 2 + pad) / Math.abs(dy || 1e-9));
    return [p.cx + dx * t, p.cy + dy * t];
  };
  for (const [f, t, l = '', st = ''] of e) {
    const A = P[f], B = P[t], dx = B.cx - A.cx, dy = B.cy - A.cy;
    const [ax, ay] = clip(A, dx, dy, 3), [bx, by] = clip(B, -dx, -dy, 5);
    const red = st.includes('x'), col = red ? '#ff6b6b' : '#9aa4b2', mx = (ax + bx) / 2, my = (ay + by) / 2;
    out += `<line x1="${ax}" y1="${ay}" x2="${bx}" y2="${by}" stroke="${col}" stroke-width="2"
      ${st.includes('-') ? 'stroke-dasharray="6 5"' : ''} ${st.includes('n') ? '' : `marker-end="url(#m${red ? 1 : 0})"`}/>`;
    if (red) out += `<circle cx="${mx}" cy="${my}" r="11" fill="#0f1115" stroke="#ff6b6b"/>` +
      txt(mx, my + 1, '✗', 'class="xm"');
    if (l) {
      const flat = Math.abs(dx) >= Math.abs(dy);
      out += txt(flat ? mx : mx + 16, flat ? my - (red ? 22 : 13) - (lines(l).length - 1) * 9 : my, l,
        `class="el" text-anchor="${flat ? 'middle' : 'start'}"`);
    }
  }
  for (const k in n) {
    const p = P[k];
    if (p.kind === 'lbl') { out += txt(p.cx, p.cy, p.t, 'class="lb"'); continue; }
    const [fill, stroke] = K[p.kind];
    out += `<rect x="${p.cx - p.w / 2}" y="${p.cy - p.h / 2}" width="${p.w}" height="${p.h}" rx="9"
      fill="${fill}" stroke="${stroke}" stroke-width="1.6"/>` + txt(p.cx, p.cy, p.t);
  }
  return svg(x0 - 16, y0 - 34, x1 - x0 + 32, y1 - y0 + 50, out);
}

// Two-set picture. mode 'overlap' or 'subset' (a inside b). pts = [['label','a'|'ab'|'b'|'out']]
function V({a, b, ka = 'past', kb = 'act', mode = 'overlap', pts = [], cap = ''}) {
  const [fa, sa] = K[ka], [fb, sb] = K[kb];
  let out, at;
  if (mode === 'subset') {
    out = `<circle cx="220" cy="120" r="105" fill="${fb}" stroke="${sb}" stroke-width="2" fill-opacity=".6"/>
      <circle cx="195" cy="135" r="52" fill="${fa}" stroke="${sa}" stroke-width="2"/>` +
      txt(220, 30, b, 'class="lb"') + txt(195, 135, a);
    at = {a: [195, 160], b: [285, 95], ab: [195, 160], out: [380, 40]};
  } else {
    out = `<circle cx="165" cy="125" r="92" fill="${fa}" stroke="${sa}" stroke-width="2" fill-opacity=".75"/>
      <circle cx="275" cy="125" r="92" fill="${fb}" stroke="${sb}" stroke-width="2" fill-opacity=".55"/>` +
      txt(130, 22, a, 'class="lb"') + txt(310, 22, b, 'class="lb"');
    at = {a: [120, 125], ab: [220, 125], b: [320, 125], out: [410, 40]};
  }
  for (const [l, r] of pts) {
    const [x, y] = at[r];
    out += `<circle cx="${x}" cy="${y}" r="7" fill="#f2b84b"/>` + txt(x, y + 22, l, 'class="el"');
  }
  if (cap) out += txt(220, 250, cap, 'class="cap"');
  return svg(40, 0, 380, cap ? 265 : 235, out);
}

// Step chart: pts = [['label', 0..1], ...]
function plot({pts, y = '', hi = '#ff6b6b'}) {
  const W = 120, H = 120, n = pts.length;
  let d = '', out = '';
  pts.forEach(([l, v], i) => {
    const x = 60 + i * W, yy = 30 + (1 - v) * H;
    d += `${i ? 'L' : 'M'}${x} ${yy} L${x + W} ${yy} `;
    out += txt(x + W / 2, 30 + H + 26, l, 'class="el"');
  });
  out += `<line x1="60" y1="${30 + H}" x2="${60 + n * W}" y2="${30 + H}" stroke="#3a4050"/>` +
    `<path d="${d}" fill="none" stroke="${hi}" stroke-width="3"/>` +
    txt(48, 30 + H / 2, y, 'class="el" text-anchor="end"');
  return svg(-30, 0, 90 + n * W + 20, H + 80, out);
}

// Plain table (no grid lines). head = ['a','b'], rows = [['x','y'],...]; cells may hold ✓ ✗.
const tb = (head, rows) => `<table class="t"><tr>${head.map(h => `<th>${h}</th>`).join('')}</tr>` +
  rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('') + '</table>';

// ---------- page renderer ----------
const file = s => `${s.id.split('.')[0]}-${s.id.split('.')[1].padStart(2, '0')}-` +
  s.t.toLowerCase().replace(/[’'“”]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '.html';
const kindOf = id => ({D: 'me', A: 'goal', T: 'act', F: 'past'})[id[0]];
const pops = new Set();

function chip(id) {
  if (!REG[id]) return id;
  pops.add(id);
  return `<button class="chip k-${/^[DATF]\d/.test(id) ? id[0] : 'R'}" popovertarget="p-${id}">${id}</button>`;
}
const link = s => String(s ?? '').replace(/\b([DATF]\d{1,3}|UI|MP|MT|HS|AND|SUB|NC|CE|RAA|CP|CASES)\b/g, (_, id) => chip(id));

function idBox(id) {
  const [nm, st, , hid] = REG[id];
  return `<div class="ib k-${kindOf(id)} ${hid ? 'hid' : ''}"><div class="ih">${chip(id)} ${esc(nm)}
    ${hid ? `<span class="tag">${id[0] === 'D' ? 'added: not defined in book' : 'hidden in book'}</span>` : ''}</div><div>${link(st)}</div></div>`;
}

// Proof = column of boxes, colored by what justifies each step.
function proofPic(steps) {
  return '<div class="pf">' + steps.map(([s, why], i) => {
    const k = /^A\d/.test(why) ? 'goal' : /^D\d/.test(why) ? 'me' : /^T\d/.test(why) ? 'act'
      : /^(obs|F\d)/.test(why) ? 'past' : i === steps.length - 1 ? 'act' : 'x';
    return (i ? '<div class="dn">↓</div>' : '') +
      `<div class="ib k-${k} ${i === steps.length - 1 ? 'end' : ''}"><span class="n">${i + 1}</span>
       <span class="s">${link(s)}</span><span class="why">${link(why)}</span></div>`;
  }).join('') + '</div>';
}

// Iterates the live Set so chips created inside popovers also get popovers.
function popHTML() {
  let h = '';
  for (const id of pops) {
    const s = SECTIONS.find(s => s.id === REG[id][2]);
    h += `<div popover id="p-${id}"><b>${id} · ${esc(REG[id][0])}</b><p>${link(REG[id][1])}</p>
      ${s ? `<small>introduced in <a href="${file(s)}">§${s.id} ${esc(s.t)}</a></small>` : ''}</div>`;
  }
  return h;
}

const WHO = {Y: 'Youth', P: 'Philosopher', N: ''};

function page(o) {
  const i = SECTIONS.findIndex(s => s.id === o.id), S = SECTIONS[i];
  const built = SECTIONS.filter(s => s.ok), bi = built.indexOf(S);
  const night = +S.id.split('.')[0];
  document.title = `§${S.id} ${S.t}`;

  const cards = o.moves.map((m, k) => `<section class="card who-${m.who}">
    <div class="hd"><span class="n">${k + 1}</span><span class="who">${WHO[m.who]}</span>
    ${m.tag ? `<span class="tag">${m.tag}</span>` : ''}</div>
    ${m.pic ? `<div class="pic">${m.pic}</div>` : ''}
    <p class="say">${link(m.say)}</p>
    ${m.f ? `<p class="f">${link(m.f)}</p>` : ''}
    ${m.chk ? `<p class="chk">⚠ Logic check: ${link(m.chk)}</p>` : ''}</section>`);

  // The whole argument of the section as one chain: [who, text], who = Y (objection) | P (reply) | T (conclusion).
  if (o.essence) cards.push(`<section class="card"><h2>The whole argument</h2><div class="pf">` +
    o.essence.map(([w, t], i) => (i ? '<div class="dn">↓</div>' : '') +
      `<div class="ib k-${w}${w === 'T' ? ' end' : ''}"><span class="n">${{Y: 'Y', P: 'P', T: '∴'}[w]}</span>
       <span class="s">${link(t)}</span><span></span></div>`).join('') + '</div></section>');

  const fresh = (o.new || []).filter(id => id[0] !== 'T');
  if (fresh.length) cards.push(`<section class="card"><h2>New on this page</h2>
    <div class="ibs">${fresh.map(idBox).join('')}</div></section>`);

  for (const [id, steps] of Object.entries(o.proofs || {})) cards.push(`<section class="card">
    <h2>${chip(id)} ${esc(REG[id][0])}</h2><p class="stmt">${link(REG[id][1])}</p>
    ${proofPic(steps)}${o.notes?.[id] ? `<p class="chk">${link(o.notes[id])}</p>` : ''}</section>`);

  const earlier = built.slice(0, bi).filter(s => s.q);
  const rev = earlier[Math.floor(Math.random() * earlier.length)];
  cards.push(`<section class="card take"><div class="big">${link(o.take)}</div></section>`);
  cards.push(`<section class="card"><h2>Recall — answer before you open</h2>
    <p>${link(S.q)}</p><details><summary>Show answer</summary><p>${link(S.a)}</p></details>
    ${rev ? `<h2 class="rv">Review from §${rev.id}</h2><p>${link(rev.q)}</p>
    <details><summary>Show answer</summary><p>${link(rev.a)}</p></details>` : ''}</section>`);

  const prev = built[bi - 1], next = built[bi + 1];
  document.body.innerHTML = `<header>
    <div class="top"><a href="index.html">☰ All sections</a><span>${night ? `Night ${night} · ` : ''}${esc(NIGHTS[night])}</span></div>
    <h1><span class="sec">§${S.id}</span> ${esc(S.t)}</h1>
    ${o.uses?.length ? `<p class="uses">Builds on: ${o.uses.map(chip).join(' ')}</p>` : ''}
    </header><main>${cards.join('')}</main>
    <nav class="ctl"><button class="b" id="bk">◀ Back</button><span id="ct"></span>
    <button class="b" id="nx">Next ▶</button><button class="b" id="all">Show all</button></nav>
    <footer>${prev ? `<a href="${file(prev)}">← §${prev.id} ${esc(prev.t)}</a>` : '<span></span>'}
    ${next ? `<a href="${file(next)}">§${next.id} ${esc(next.t)} →</a>` : ''}</footer>
    <div class="legend">${Object.entries({past: 'fact / past', goal: 'goal / axiom', me: 'meaning · choice · definition',
      act: 'behavior · result · theorem', bad: 'false'}).map(([k, l]) => `<span class="k-${k}">■ ${l}</span>`).join('')}</div>` +
    popHTML();

  stepper();
}

// Next/Back stepping over the cards; #n in the URL = current card.
function stepper() {
  const C = [...document.querySelectorAll('main .card')];
  let cur = Math.min(+location.hash.slice(1) || 0, C.length - 1);
  const show = (scroll = true) => {
    C.forEach((c, k) => { c.hidden = k > cur; c.classList.toggle('old', k < cur); c.classList.toggle('cur', k === cur); });
    document.getElementById('ct').textContent = `${cur + 1} / ${C.length}`;
    history.replaceState(null, '', '#' + cur);
    if (scroll) C[cur].scrollIntoView({behavior: 'smooth', block: 'center'});
  };
  const go = d => { cur = Math.max(0, Math.min(C.length - 1, cur + d)); show(); };
  document.getElementById('nx').onclick = () => go(1);
  document.getElementById('bk').onclick = () => go(-1);
  document.getElementById('all').onclick = () => { cur = C.length - 1; show(false); C.forEach(c => c.classList.remove('old')); };
  addEventListener('keydown', e => { if (e.key === 'ArrowRight') go(1); if (e.key === 'ArrowLeft') go(-1); });
  show(false);
}


// Whole-book revision in Euclid's order (data in revision.js): definitions → axioms → facts → rules → propositions → proofs.
// Premises of a proof = the D/A/F/T items its lines cite, in order of first use.
const cites = t => [...new Set(PF[t].pf.map(l => l[1]).filter(w => /^[DAFT]\d+$/.test(w)))];

function revision() {
  document.title = 'Revision · whole book';
  const night = id => +REG[id][2].split('.')[0], ids = k => Object.keys(REG).filter(i => new RegExp(`^${k}\\d`).test(i));
  const card = (h, body) => `<section class="card"><h2>${h}</h2>${body}</section>`;
  const part = n => n ? `Night ${n} · ${esc(NIGHTS[n])}` : 'Introduction';
  const boxes = l => `<div class="ibs">${l.map(idBox).join('')}</div>`;
  const D = ids('D'), A = ids('A'), F = ids('F'), T = ids('T');
  const C = [card('How to read this', `<p>A proposition is <b>proved</b> when every line of its proof is one of:</p>
    ${tb(['', 'Line type', 'Shown as'], [['1', 'a definition', 'D'], ['2', 'an axiom (assumed, not proved)', 'A'],
      ['3', 'a fact (an observation from the book)', 'F'], ['4', 'an earlier proposition', 'T'],
      ['5', 'an assumption, inside a contradiction or conditional proof', 'Assume'], ['6', 'a rule of inference applied to earlier lines', 'MP 1, 2 …']])}
    <p>Nothing else counts — no “obviously”. Where the book skips a step, the missing premise is written out and drawn
    <b>dashed</b>. So: <b>if you accept the definitions, axioms and facts, every proposition follows.</b></p>
    <p>Night by Night, each in Euclid’s order: Ⅰ Definitions → Ⅱ Axioms → Ⅲ Facts → Ⅳ each proposition, stated and proved at once. An item appears in the first Night that uses it. The whole book in one picture:</p>
    <div class="pic">${MAP}</div>`)];
  C.push(card('Rules of inference (used in every Night)', tb(['Code', 'Rule', 'Form'], RULES.map(r => [chip(r), REG[r][0], REG[r][1]])) +
    tb(['Proof technique', 'How it works'], [['Direct', 'chain premises forward to the conclusion'],
      ['Conditional', 'assume P, derive Q, conclude P ⇒ Q (CP)'], ['Contradiction', 'assume P, derive a clash, conclude not-P (RAA)'],
      ['Counterexample', 'one case that breaks “every X is Y” (CE)'], ['Cases', 'every possible case leads to R (CASES)']])));
  // An item is listed in the first Night that uses it, so nothing is used before it is stated.
  const first = {};
  for (const t of T) for (const i of cites(t)) first[i] = Math.min(first[i] ?? 9, night(t));
  const at = i => Math.min(night(i), first[i] ?? 9);
  NIGHTS.forEach((_, n) => {
    const h = x => `${part(n)} · ${x}`, here = l => l.filter(i => at(i) === n), L = T.filter(t => night(t) === n);
    for (const [x, l] of [['Ⅰ Definitions', here(D)], ['Ⅱ Axioms (dashed = hidden in the book)', here(A)], ['Ⅲ Facts', here(F)]])
      if (l.length) C.push(card(h(x), boxes(l)));
    for (const t of L) {
      const s = SECTIONS.find(s => s.id === REG[t][2]), p = PF[t];
      C.push(`<section class="card"><div class="hd"><span class="tag">${h('Ⅳ Proposition and proof')}</span><span class="tag">${p.how}</span>
        ${p.st ? '<span class="tag">stated more precisely than the book</span>' : ''}</div>
        <h2>${chip(t)} ${esc(REG[t][0])} <small>· <a href="${file(s)}">§${s.id}</a></small></h2>
        <p class="stmt">${link(REG[t][1])}</p><h2>Premises</h2>${boxes(cites(t))}
        <h2>Proof</h2>${proofPic(p.pf)}${p.note ? `<p class="chk">${link(p.note)}</p>` : ''}</section>`);
    }
  });
  C.push('<section class="card take"><div class="big">The world is simple, and life is too: meaning is given now, ' +
    'tasks are separated, comrades are horizontal, happiness is contribution, and life is lived here and now.</div></section>');
  document.body.innerHTML = `<header><div class="top"><a href="index.html">☰ All sections</a><span>Revision</span></div>
    <h1>Whole-book revision</h1><p class="uses">${D.length} definitions · ${A.length} axioms · ${F.length} facts · ${RULES.length} rules →
    ${T.length} propositions, every one proved.</p></header><main>${C.join('')}</main>
    <nav class="ctl"><button class="b" id="bk">◀ Back</button><span id="ct"></span>
    <button class="b" id="nx">Next ▶</button><button class="b" id="all">Show all</button></nav>` + popHTML();
  stepper();
}

// The whole book in one picture (also on §5.14).
const MAP = G({a:[0,0,'Your world is\nyour meaning','me'], b:[1,0,'Behavior\nserves goals','goal'], c:[2,0,'Past doesn’t\ndecide','act'],
  d:[2,1,'All problems:\nrelationships','x'], e:[1,1,'Separate\ntasks','me'], f:[0,1,'Horizontal,\ncomrades','act'],
  g:[0,2,'Accept · trust ·\ncontribute','me'], h:[1,2,'Happiness =\ncontribution','act'], i:[2,2,'Dance here\nand now','goal']},
  [['a','b'],['b','c'],['c','d'],['d','e'],['e','f'],['f','g'],['g','h'],['h','i']]);

function index() {
  let h = '<header><h1>The Courage to Be Disliked</h1><p class="uses">One page per section. Pictures first; every claim numbered; every proof valid.</p>' +
    '<p><a class="b" href="revision.html">Whole-book revision (every proof)</a> <button class="b" id="rq">Random recall question</button></p><div id="rqa"></div></header><main>';
  NIGHTS.forEach((nm, n) => {
    h += `<h2>${n ? `Night ${n}: ` : ''}${esc(nm)}</h2><ol class="toc">` + SECTIONS.filter(s => +s.id.split('.')[0] === n)
      .map(s => `<li>${s.ok ? `<a href="${file(s)}">§${s.id} ${esc(s.t)}</a>` : `<span class="soon">§${s.id} ${esc(s.t)}</span>`}</li>`).join('') + '</ol>';
  });
  h += '<h2>Every definition, axiom and theorem</h2><div class="ibs">' + Object.keys(REG).map(idBox).join('') + '</div></main>';
  document.body.innerHTML = h + popHTML();
  const qs = SECTIONS.filter(s => s.q);
  document.getElementById('rq').onclick = () => {
    const s = qs[Math.floor(Math.random() * qs.length)];
    document.getElementById('rqa').innerHTML = `<section class="card"><h2>§${s.id} ${esc(s.t)}</h2><p>${esc(s.q)}</p>
      <details><summary>Show answer</summary><p>${esc(s.a)}</p></details></section>`;
  };
}
