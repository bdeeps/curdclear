// Chapter 2: the bacteria at work. Lactic acid bacteria eat lactose and give out lactic acid.
// Scene: 1 unit ≈ 0.5 µm. Blue chains of cocci stand for Streptococcus thermophilus and Lactococcus,
// orange rods for Lactobacillus (about 0.5–0.8 µm wide and a few µm long). Yellow dots are lactose,
// red dots lactic acid (both drawn hundreds of times too large). The number of cells drawn follows
// the logarithm of the modelled count, so each new cell on screen stands for a fixed multiplication.
// Numbers come from runBatch() in curd.js at a steady temperature with 1% jaman: growth by the
// cardinal temperature model, acid by Luedeking–Piret, pH from a typical titration curve.
// Reaction (homofermentative): C12H22O11 + H2O → 4 C3H6O3, lactose 342 g + water 18 g → lactic acid 360 g.
import { THREE, M, swarm } from '../kit.js';
import { VIEW, REEL_VIEW, CHART, CHART_POS, COL, TEAMS, hex, board, panelBg, axes, title, line, dot, note, dots, tank, rng, fitNarrow, reelChart, clamp, lerp, runBatch, rowAt, doubling, growthRate, fmtN, fmtH, MILK, TA_MILK, LACTOSE_PER_ACID, N_MAX, TAU } from '../curd.js';

const HOURS = 12;
const run = (T) => runBatch({ T0: T, wrap: 'hold', inoc: 1, hours: HOURS });
const tName = (T) => (T < 12 ? 'fridge-cold' : T < 24 ? 'cool room' : T < 34 ? 'warm room' : T <= 45 ? 'cosy: their favourite' : T <= 52 ? 'too hot to grow well' : 'deadly hot');

export default {
  id: 'bacteria',
  short: 'The bacteria at work',
  title: 'A spoon of jaman is a spoon of bacteria',
  subtitle: 'Old curd carries millions of living lactic acid bacteria. In warm milk they eat lactose, multiply and give out lactic acid.',
  view: VIEW,
  learn: `<p>To set dahi you stir a spoon of old curd, the <b>jaman</b>, into warm milk. That spoon is alive. Every gram of good dahi holds something like a hundred million <b>lactic acid bacteria</b>.</p>
    <p>Indian dahi is a mixed team. Some are tiny balls in chains (<b>Lactococcus</b> and <b>Streptococcus thermophilus</b>), some are rods (<b>Lactobacillus</b>). They all make their living the same way: they take in <b>lactose</b>, milk sugar, and break it down for energy without using oxygen. This is <b>fermentation</b>. What they throw out is <b>lactic acid</b>.</p>
    <p>One lactose can become up to four lactic acids: C<sub>12</sub>H<sub>22</sub>O<sub>11</sub> + H<sub>2</sub>O → 4 C<sub>3</sub>H<sub>6</sub>O<sub>3</sub>. The acid is what makes curd sour, and, as the next chapter shows, what makes it set.</p>
    <p>Well fed and warm, a bacterium splits in two about every half hour. Ten doublings is a thousand times more bacteria, so a few hours is enough. But they are fussy about <b>temperature</b>. Cold milk makes them sluggish. Around 37–43 °C they race. Much above 50 °C they die.</p>
    <p>They never eat all the sugar. Their own acid slows them down, so set dahi still holds most of its lactose. Food-safety scientists in Europe (EFSA) have accepted one health claim here: the live cultures in yoghurt help people who digest lactose poorly to digest the lactose in that yoghurt.</p>
    <p class="tip"><b>Try it:</b> slide the hours forward and watch the cells multiply while yellow lactose turns into red lactic acid. Then set the temperature to 15 °C, 42 °C and 58 °C and compare.</p>`,
  terms: [
    { t: 'Jaman (starter)', d: 'A spoon of old curd stirred into fresh milk. It carries the live bacteria that make the next batch.' },
    { t: 'Lactic acid bacteria', d: 'Harmless bacteria that turn sugars into lactic acid. They make dahi, yoghurt, idli batter and pickles sour.' },
    { t: 'Fermentation', d: 'How microbes get energy from sugar without oxygen, leaving behind acid, alcohol or gas.' },
    { t: 'Lactic acid', d: 'The mild acid, C3H6O3, that gives curd its sour taste.' },
    { t: 'Doubling time', d: 'How long a population of bacteria takes to double. About 30 minutes for dahi bacteria at their best.' },
    { t: 'Mesophile and thermophile', d: 'Bacteria that grow best at middling temperatures (about 30 °C) and at warm ones (about 42 °C).' },
  ],
  defaults: { T: 42, hours: 0 },
  controls: [
    { key: 'hours', type: 'range', label: 'Hours since the jaman went in', min: 0, max: HOURS, step: 0.05, ends: ['0', HOURS + ' h'], fmt: (v) => fmtH(v) },
    { key: 'T', type: 'range', label: 'Milk kept at', min: 5, max: 62, step: 1, ends: ['5 °C', '62 °C'], fmt: (v) => `${v} °C · ${tName(v)}` },
  ],
  quiz: [
    { q: 'What do the bacteria in jaman eat, and what do they give out?', options: ['They eat fat and give out water', 'They eat lactose and give out lactic acid', 'They eat protein and give out sugar', 'They eat acid and give out lactose'], answer: 1, why: 'Lactic acid bacteria ferment lactose, the sugar in milk, into lactic acid. That acid sours and sets the milk.' },
    { q: 'Why does a single spoon of old curd set a whole pot?', options: ['The spoon is acidic enough on its own', 'The bacteria in it multiply, doubling again and again', 'Curd is contagious to milk proteins', 'It cools the milk'], answer: 1, why: 'At their best the bacteria double about every 30 minutes. Ten doublings make a thousand times more of them.' },
    { q: 'You stir jaman into milk straight off the boil. What happens?', options: ['It sets faster', 'The heat kills the bacteria, so it stays milk', 'It turns into cheese', 'It sets but tastes sweet'], answer: 1, why: 'Dahi bacteria die above about 50–55 °C. The milk must cool to lukewarm before the jaman goes in.' },
  ],
  reel: [
    { ms: 5800, caption: 'A spoon of old curd carries living bacteria. In warm milk they double about every half hour, eating milk sugar and making lactic acid.', set: { T: 42 }, anim: { hours: [0, 6] }, view: REEL_VIEW, spin: 0.2 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root);
    const rnd = rng(21), col = new THREE.Color();
    const BX = 5.4, BY0 = 0.4, BY1 = 5.4, BZ = 2.2;
    tank(root, BX, BY0, BY1, BZ);
    // organisms: even slots are chains of cocci, odd slots are rods
    const NORG = 54, COC = 4;
    const cocci = dots(NORG * COC, 0.21, hex(COL.bug), 10); root.add(cocci);
    const rods = swarm(NORG, new THREE.CapsuleGeometry(0.16, 0.9, 6, 12), new THREE.MeshStandardMaterial({ color: hex(COL.rod), roughness: 0.5 })); rods.frustumCulled = false; root.add(rods);
    const org = Array.from({ length: NORG }, (_, i) => ({ rod: i % 3 === 2, x: (rnd() - 0.5) * 2 * (BX - 1.1), y: BY0 + 0.6 + rnd() * (BY1 - BY0 - 1.2), z: (rnd() - 0.5) * 2 * (BZ - 0.6), a: rnd() * TAU, b: (rnd() - 0.5) * 1.2, ph: rnd() * TAU, k: 0, n: 2 + Math.floor(rnd() * 3) }));
    const NL = 170, lac = dots(NL, 0.09, hex(COL.lactose), 6); root.add(lac);
    const NA = 220, acid = dots(NA, 0.075, hex(COL.acid), 6); root.add(acid);
    const lp = Array.from({ length: NL }, () => ({ x: (rnd() - 0.5) * 2 * BX, y: BY0 + rnd() * (BY1 - BY0), z: (rnd() - 0.5) * 2 * BZ, a: rnd() * TAU, b: rnd() * TAU }));
    const ap = Array.from({ length: NA }, (_, i) => ({ o: i % NORG, r: 0.5 + rnd() * 2.6, th: Math.acos(2 * rnd() - 1), ph: rnd() * TAU, a: rnd() * TAU }));
    const lCoc = stage.label('chains of cocci: <b>Streptococcus, Lactococcus</b>', [-2.6, BY1 + 0.35, 0], root, 'hot'); lCoc.element.style.setProperty('--c', COL.bug);
    const lRod = stage.label('rods: <b>Lactobacillus</b>', [-3.6, BY0 - 0.35, BZ], root, 'hot'); lRod.element.style.setProperty('--c', COL.rod);
    const lDots = stage.label('<span style="color:#ffd166">●</span> lactose in → <span style="color:#ff7a8a">●</span> lactic acid out', [1.7, BY0 - 0.35, BZ], root);
    const bar = new THREE.Mesh(new THREE.BoxGeometry(2, 0.06, 0.06), M.glow(0xffffff)); bar.position.set(BX - 1.2, BY0 - 0.3, BZ); root.add(bar);
    const lBar = stage.label('1 µm', [BX - 1.2, BY0 - 0.65, BZ], root);

    let S = { T: 42, hours: 0 }, key = '';
    const chart = board(root, CHART.w, CHART.h, CHART.px, CHART.py, (g, w, h) => {
      panelBg(g, w, h);
      const rows = run(S.T);
      title(g, 'Bacteria and acid', '');
      const { X, Y, x0, x1 } = axes(g, w, h, { x0: 58, x1: w - 50, y1: 78, y0: h - 44, xMin: 0, xMax: HOURS, yMin: 5, yMax: 9.5, xTicks: [0, 3, 6, 9, 12], yTicks: [6, 7, 8, 9], xFmt: (v) => v + ' h', yFmt: (v) => '10' + '⁶⁷⁸⁹'[v - 6] });
      const A = (a) => Y(5 + (a / 1.6) * 4.5);
      line(g, rows.filter((_, i) => i % 4 === 0).map((r) => [r.t, Math.max(5, Math.log10(Math.max(1, r.N)))]), X, Y, COL.bug, 4);
      g.strokeStyle = COL.acid; g.lineWidth = 4; g.beginPath(); rows.forEach((r, i) => { if (i % 4) return; const y = A(r.ta - TA_MILK); i ? g.lineTo(X(r.t), y) : g.moveTo(X(r.t), y); }); g.stroke();
      [0.5, 1.0, 1.5].forEach((a) => note(g, a.toFixed(1) + '%', x1 + 6, A(a) + 6, COL.acid, 16));
      note(g, 'cells per mL', x0 + 6, 70, COL.bug, 17); note(g, 'lactic acid', x1 + 44, 70, COL.acid, 17, 'right');
      const r = rowAt(rows, S.hours);
      dot(g, X(r.t), Y(Math.max(5, Math.log10(Math.max(1, r.N)))), COL.bug, 8); dot(g, X(r.t), A(r.ta - TA_MILK), COL.acid, 8);
    }, CHART_POS);

    return {
      update(dt, s, time) {
        dt = Math.max(0, Math.min(dt, 0.05)); S = s;
        const narrow = fitNarrow(stage, [lBar, lDots]);
        chart.mesh.visible = !narrow && reelChart(stage, chart);
        const rows = run(s.T), r = rowAt(rows, s.hours), N0 = rows[0].N;
        const alive = clamp(Math.log(Math.max(r.N, 1) / N0) / Math.log(N_MAX / N0), -1, 1);
        const want = r.N < N0 * 0.5 ? 4 : Math.round(lerp(4, NORG, clamp(alive, 0, 1)));
        const dead = r.N < N0 * 0.5, speed = clamp(growthRate(s.T) / 1.4, 0, 1);
        cocci.material.color.set(dead ? 0x6a7080 : 0xffffff); rods.material.color.set(dead ? 0x6a7080 : hex(COL.rod));
        org.forEach((o, i) => {
          o.k += ((i < want ? 1 : 0) - o.k) * (1 - Math.exp(-dt * 5));
          const wob = dead ? 0 : 0.25 + 0.75 * speed;
          const x = o.x + 0.25 * wob * Math.sin(time * 0.9 + o.ph), y = o.y + 0.2 * wob * Math.sin(time * 0.7 + o.ph * 2), ang = o.a + 0.3 * wob * Math.sin(time * 0.5 + o.ph);
          if (o.rod) {
            rods.place(i, [x, y, o.z], [0, o.b, ang], Math.max(0.0001, o.k));
            for (let j = 0; j < COC; j++) cocci.hide(i * COC + j);
          } else {
            rods.place(i, [0, -99, 0], null, 0.0001);
            for (let j = 0; j < COC; j++) { if (j >= o.n) { cocci.hide(i * COC + j); continue; } const d = (j - (o.n - 1) / 2) * 0.41; cocci.place(i * COC + j, x + d * Math.cos(ang), y + d * Math.sin(ang), o.z + d * o.b * 0.4, Math.max(0.0001, o.k)); cocci.tint(i * COC + j, col.set(dead ? 0x6a7080 : COL.bug)); }
          }
        });
        cocci.done(); rods.done();
        const made = r.ta - TA_MILK, lactoseLeft = MILK.cow.lactose - made * LACTOSE_PER_ACID;
        const nl = Math.round(NL * clamp(lactoseLeft / MILK.cow.lactose, 0, 1)), na = Math.round(NA * clamp(made / 1.5, 0, 1));
        lp.forEach((q, i) => { if (i >= nl) { lac.hide(i); return; } lac.place(i, q.x + 0.4 * Math.sin(time * 1.3 + q.a), q.y + 0.4 * Math.sin(time * 1.1 + q.b), q.z + 0.3 * Math.cos(time + q.a)); });
        ap.forEach((q, i) => { if (i >= na) { acid.hide(i); return; } const o = org[q.o % Math.max(1, want)], rr = q.r + 0.3 * Math.sin(time * 1.2 + q.a);
          acid.place(i, clamp(o.x + rr * Math.sin(q.th) * Math.cos(q.ph), -BX, BX), clamp(o.y + rr * Math.cos(q.th), BY0, BY1), clamp(o.z + rr * Math.sin(q.th) * Math.sin(q.ph), -BZ, BZ)); });
        lac.done(); acid.done();
        const k = `${s.T}|${s.hours}`; if (k !== key) { key = k; chart.redraw(); }
      },
      readout: (s) => {
        const rows = run(s.T), r = rowAt(rows, s.hours), made = r.ta - TA_MILK, left = MILK.cow.lactose - made * LACTOSE_PER_ACID, d = doubling(s.T);
        const dead = r.N < rows[0].N * 0.5;
        return `<div class="big">${dead ? 'Too hot: the culture is dead' : d === Infinity ? 'Too cold to grow' : 'Doubling every ' + (d > 600 ? Math.round(d / 60) + ' hours' : Math.round(d) + ' min')}</div>
          <div class="row"><span>Live bacteria in each mL</span><b style="color:${COL.bug}">${fmtN(r.N)}</b></div>
          <div class="row"><span>Lactic acid made</span><b style="color:${COL.acid}">${made.toFixed(2)} g per 100 g</b></div>
          <div class="row"><span>Lactose left (started at ${MILK.cow.lactose})</span><b style="color:${COL.lactose}">${left.toFixed(1)} g · ${Math.round((left / MILK.cow.lactose) * 100)}%</b></div>
          <div class="row"><span>pH of the milk</span><b>${r.ph.toFixed(2)}</b></div>
          <small>A model with typical values: 1% jaman, steady ${s.T} °C.</small>`;
      },
    };
  },
};
