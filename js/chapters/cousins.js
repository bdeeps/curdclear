// Chapter 6: curd's cousins. Four ways to make casein micelles let go of each other, shown on three
// micelles (left) and in a pot (right, 1 unit ≈ 3 cm).
//   Dahi: mixed lactic acid bacteria, 30–43 °C, acid arrives slowly, gel at pH 4.6.
//   Yoghurt: only Streptococcus thermophilus + Lactobacillus delbrueckii subsp. bulgaricus
//     (Codex CXS 243-2003; FSSAI 2.1.13), 42–43 °C for 3–5 h, pH about 4.5.
//   Paneer and chhena: acid (lemon juice, citric acid, sour whey) stirred into hot milk. Typical
//     practice: heat to 82–90 °C, coagulate at about 70–80 °C and pH 5.3–5.4 (Sachdeva & Singh 1988;
//     Bhattacharya et al. 1971). Heat has already stuck the whey proteins to the casein, so the
//     curds form in seconds and squeeze out clear whey. FSSAI 2.1.16: paneer at most 60% moisture,
//     at least 50% milk fat in the dry matter.
//   Cheese: rennet. Its enzyme chymosin cuts κ-casein between Phe105 and Met106, so the hairs fall
//     off while the milk is still sweet (pH about 6.5–6.6, 30–35 °C, 30–40 minutes), and calcium
//     bridges the bare micelles. The gel is cut, and whey drains.
import { THREE, M, swarm } from '../kit.js';
import { VIEW, REEL_VIEW, CHART, CHART_POS, COL, hex, board, panelBg, axes, title, dot, note, dots, micelle, rng, fitNarrow, reelChart, clamp, lerp, smoothK, PH_MILK, TAU } from '../curd.js';

export const METHODS = {
  dahi: { label: 'Dahi', n: 'Dahi (curd)', by: 'Acid, made slowly by a mixed team of lactic acid bacteria', T: 38, Ttxt: '30–43 °C', ph: 4.6, time: '5–12 hours', whey: 'stays inside the gel', col: '#f4f1e8', end: 'A smooth gel that fills the pot' },
  yoghurt: { label: 'Yoghurt', n: 'Yoghurt', by: 'Acid from two chosen bacteria: S. thermophilus and L. bulgaricus', T: 42, Ttxt: '42–43 °C', ph: 4.5, time: '3–5 hours', whey: 'stays inside the gel', col: '#fff6d8', end: 'A smooth gel, the same every time' },
  paneer: { label: 'Paneer', n: 'Paneer and chhena', by: 'Acid (lemon, citric acid, sour whey) stirred into hot milk', T: 78, Ttxt: 'about 70–85 °C', ph: 5.35, time: 'under a minute', whey: 'drains away, clear and green', col: '#ffe9b0', end: 'Curds scooped out and pressed into a block' },
  cheese: { label: 'Cheese', n: 'Rennet cheese', by: 'An enzyme, chymosin, that cuts the hairs off the micelles', T: 32, Ttxt: '30–35 °C', ph: 6.55, time: '30–40 minutes', whey: 'drains away when the gel is cut', col: '#ffc857', end: 'A sweet gel, cut into cubes, drained and pressed' },
};

export default {
  id: 'cousins',
  short: 'Curd\'s cousins',
  title: 'Dahi, yoghurt, paneer and cheese',
  subtitle: 'Four foods from one trick: make the casein micelles stick. Slow acid, hot acid or an enzyme each give a different result.',
  view: VIEW,
  learn: `<p>Every one of these foods starts by taking away what keeps casein micelles apart. They differ in how.</p>
    <p><b>Dahi</b> uses slow acid from a mixed team of bacteria. Each home's jaman is a little different, so each home's dahi tastes a little different. <b>Yoghurt</b> is the same idea with the team fixed by law: only <i>Streptococcus thermophilus</i> and <i>Lactobacillus bulgaricus</i>, kept at about 42 °C. In India the two words are often swapped, but food standards treat them as two products.</p>
    <p><b>Paneer</b> and <b>chhena</b> use acid and heat together. Lemon juice or citric acid goes into milk at about 80 °C. Hot casein clumps the moment the pH reaches about 5.3, taking the heat-softened whey proteins and most of the fat with it. The curds tighten and push out clear green whey. No bacteria are involved, so paneer is not sour.</p>
    <p><b>Cheese</b> uses <b>rennet</b>. Its enzyme snips the κ-casein hairs clean off. The bald micelles are joined by calcium while the milk is still sweet. The gel is cut into cubes so the whey can run out.</p>
    <p>Dahi itself has a family. Whisk it with water for <b>lassi</b>. Churn it and butter comes out, leaving <b>chaas</b>: that story is <a href="https://glassbox.how/butterclear/">ButterClear</a>, and <a href="https://glassbox.how/gheeclear/">GheeClear</a> follows the butter to ghee. Hang dahi in muslin to drain the whey and you get <b>chakka</b>, which becomes <b>shrikhand</b> with sugar. Set sweetened, thickened milk in a clay pot and you have Bengal's <b>mishti doi</b>.</p>
    <p>Dahi also has a long place in Indian tradition. Ayurvedic texts describe dadhi (curd) and takra (buttermilk) and their qualities, and curd is one of the five ingredients of panchamrita. That is tradition, not tested medicine: <a href="https://glassbox.how/ayurvedaclear/">AyurvedaClear</a> explains how that system works.</p>
    <p class="tip"><b>Try it:</b> choose each food and drag <b>Watch it happen</b>. Look at what removes the blue hairs each time: red acid, or the orange enzyme. Then compare where each food sits on the chart.</p>`,
  terms: [
    { t: 'Yoghurt', d: 'Milk fermented by two named bacteria, Streptococcus thermophilus and Lactobacillus delbrueckii subsp. bulgaricus.' },
    { t: 'Paneer', d: 'Fresh, unsalted, non-melting cheese made by adding acid to hot milk and pressing the curds.' },
    { t: 'Chhena', d: 'Softer, moister acid-and-heat curd, kneaded for rasgulla and sandesh.' },
    { t: 'Rennet', d: 'A mix of enzymes, chiefly chymosin, that clots milk for cheese. Today most of it comes from microbes.' },
    { t: 'Chakka', d: 'Dahi with part of its whey drained off through cloth. The base of shrikhand.' },
    { t: 'Lassi and chaas', d: 'Drinks made from dahi and water. Chaas is traditionally the liquid left after churning butter out of dahi.' },
    { t: 'Mishti doi', d: 'Sweet Bengali curd made from thickened, sweetened milk, usually set in a clay pot.' },
  ],
  defaults: { method: 'dahi', p: 0 },
  controls: [
    { key: 'method', type: 'seg', label: 'Make', options: Object.entries(METHODS).map(([v, m]) => ({ v, label: m.label })) },
    { key: 'p', type: 'range', label: 'Watch it happen', min: 0, max: 1, step: 0.01, ends: ['milk', 'done'], fmt: (v) => Math.round(v * 100) + '%' },
  ],
  onChange(s, key) { if (key === 'method') s.p = 0.0; },
  quiz: [
    { q: 'What is the main difference between dahi and yoghurt?', options: ['Yoghurt is made from cream', 'Yoghurt must be made with two specific bacteria; dahi uses a mixed lactic culture', 'Dahi has no bacteria', 'Yoghurt is not sour'], answer: 1, why: 'Food standards define yoghurt by Streptococcus thermophilus and Lactobacillus bulgaricus. Dahi may use any harmless lactic acid bacteria.' },
    { q: 'Why is paneer not sour like dahi, although both use acid?', options: ['Paneer uses no acid', 'A little acid is added to hot milk, the curd forms at about pH 5.3, and the sour whey drains away', 'Paneer is washed in sugar', 'Heat destroys acid'], answer: 1, why: 'Hot milk clots at a higher pH than cold milk, so less acid is needed, and much of it leaves with the whey.' },
    { q: 'How does rennet clot milk for cheese?', options: ['It adds acid', 'It boils the milk', 'Its enzyme cuts the κ-casein hairs off the micelles', 'It freezes the water'], answer: 2, why: 'Chymosin snips κ-casein at one exact bond. Without their hairy coat, micelles join through calcium at near-neutral pH.' },
  ],
  reel: [
    { ms: 5600, caption: 'Paneer skips the bacteria: acid in hot milk makes curds in seconds. Cheese uses an enzyme that cuts the hairs off the micelles.', set: { method: 'paneer' }, anim: { p: [0, 1] }, view: REEL_VIEW, spin: 0.15 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root);
    const world = new THREE.Group(); world.scale.setScalar(0.82); world.position.set(0, 0.45, 0); root.add(world);
    const rnd = rng(17), col = new THREE.Color();
    const counter = new THREE.Mesh(new THREE.BoxGeometry(12.6, 0.3, 4.6), M.matte(0x2b3039)); counter.position.y = 0.15; world.add(counter);
    // ---- micro side: three micelles in a round window
    const WX = -3.3, WY = 3.3, WR = 2.7;
    const win = new THREE.Mesh(new THREE.CircleGeometry(WR, 56), M.ghost(0x6fb6ff, 0.1)); win.position.set(WX, WY, -1.2); world.add(win);
    const wring = new THREE.Mesh(new THREE.TorusGeometry(WR, 0.06, 8, 64), M.matte(0x8c95a3)); wring.position.set(WX, WY, -1.2); world.add(wring);
    const RM = 0.78, homes = [[-1.25, 0.85], [1.3, 0.6], [0.05, -1.3]];
    const mics = homes.map((h, i) => { const m = micelle(RM, 30 + i, 90); world.add(m); return m; });
    const NA = 70, agents = dots(NA, 0.075, hex(COL.acid), 6); world.add(agents);
    const NW = 36, wheyP = dots(NW, 0.1, hex(COL.wheyP), 6); world.add(wheyP);
    const ag = Array.from({ length: NA + NW }, (_, i) => ({ x: (rnd() - 0.5) * 2 * WR * 0.68, y: (rnd() - 0.5) * 2 * WR * 0.68, a: rnd() * TAU, b: rnd() * TAU, m: i % 3, th: rnd() * TAU }));
    const lMic = stage.label('', [WX, WY - WR - 0.4, 0], world, 'hot');
    // ---- kitchen side: a pot
    const PX = 2.9, R = 1.9, H = 2.0, Y = 0.3;
    const steel = M.metal(0xc9ced6, { side: THREE.DoubleSide, roughness: 0.3 });
    const wall = new THREE.Mesh(new THREE.CylinderGeometry(R, R, H, 56, 1, true, Math.PI * 0.3, Math.PI * 1.4), steel); wall.position.set(PX, Y + H / 2, 0); world.add(wall);   // cut away at the front
    const base = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 0.06, 56), steel); base.position.set(PX, Y + 0.03, 0); world.add(base);
    const FILL = 1.5;
    const liqMat = new THREE.MeshStandardMaterial({ color: 0xf6f3ea, roughness: 0.35, transparent: true, opacity: 1 });
    const liquid = new THREE.Mesh(new THREE.CylinderGeometry(R - 0.06, R - 0.06, FILL, 56), liqMat); liquid.position.set(PX, Y + 0.06 + FILL / 2, 0); world.add(liquid);
    const NL = 46, lumps = dots(NL, 0.2, 0xffffff, 8); lumps.material = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 }); world.add(lumps);
    const cubes = swarm(NL, new THREE.BoxGeometry(0.3, 0.3, 0.3), new THREE.MeshStandardMaterial({ color: 0xfff0c2, roughness: 0.7 })); cubes.frustumCulled = false; world.add(cubes);
    const lp = Array.from({ length: NL }, () => { const r = (R - 0.4) * Math.sqrt(rnd()), a = rnd() * TAU; return { x: r * Math.cos(a), z: r * Math.sin(a), y: rnd(), s: 0.7 + rnd() * 0.7, a: rnd() * TAU }; });
    const block = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.6, 1.0), new THREE.MeshStandardMaterial({ color: 0xfbf7ea, roughness: 0.8 })); block.position.set(PX - 0.2, Y + 0.3, 2.4); world.add(block);
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 0.5, 40), new THREE.MeshStandardMaterial({ color: 0xf2c14e, roughness: 0.7 })); wheel.position.set(PX - 0.2, Y + 0.25, 2.5); world.add(wheel);
    const flame = new THREE.Mesh(new THREE.TorusGeometry(R * 0.6, 0.09, 8, 40), M.glow(0x4aa3ff)); flame.rotation.x = Math.PI / 2; flame.position.set(PX, Y - 0.02, 0); world.add(flame);
    const lPot = stage.label('', [PX, Y + H + 0.75, 0], world, 'hot');
    const lEnd = stage.label('', [PX, Y - 0.15, 2.7], world);

    let S = { ...this.defaults }, key = '', cur = '';
    const chart = board(root, CHART.w, CHART.h, CHART.px, CHART.py, (g, w, h) => {
      panelBg(g, w, h);
      title(g, 'Where each one clots', '');
      const { X, Y, x0, x1 } = axes(g, w, h, { x0: 54, x1: w - 20, y1: 60, y0: h - 44, xMin: 0, xMax: 100, yMin: 4, yMax: 7, xTicks: [0, 25, 50, 75, 100], yTicks: [4, 5, 6, 7], xFmt: (v) => v + ' °C', yFmt: String });
      note(g, 'pH', x0 + 6, 54, 'rgba(255,255,255,.7)', 16);
      const m = METHODS[S.method], p = smoothK(S.p);
      g.strokeStyle = 'rgba(255,255,255,.5)'; g.setLineDash([6, 5]); g.lineWidth = 2; g.beginPath(); g.moveTo(X(m.T), Y(PH_MILK)); g.lineTo(X(m.T), Y(m.ph)); g.stroke(); g.setLineDash([]);
      Object.entries(METHODS).forEach(([k, q]) => { const on = k === S.method; dot(g, X(q.T), Y(q.ph), on ? q.col : 'rgba(255,255,255,.3)', on ? 9 : 6); note(g, q.label, X(q.T) + (k === 'paneer' ? -12 : 12), Y(q.ph) + (k === 'yoghurt' ? 22 : k === 'dahi' ? -8 : 6), on ? '#fff' : 'rgba(255,255,255,.55)', 16, k === 'paneer' ? 'right' : 'left'); });
      dot(g, X(m.T), Y(lerp(PH_MILK, m.ph, p)), '#fff', 6);
    }, CHART_POS);

    return {
      update(dt, s, time) {
        dt = Math.max(0, Math.min(dt, 0.05)); S = s;
        const narrow = fitNarrow(stage, [lEnd]);
        chart.mesh.visible = !narrow && reelChart(stage, chart);
        const m = METHODS[s.method], p = clamp(s.p, 0, 1), acidic = s.method !== 'cheese', hot = s.method === 'paneer';
        // stage 1 (p 0–0.55): the coat goes. stage 2 (0.45–0.85): micelles join. stage 3: result in the pot.
        const strip = smoothK(clamp(p / 0.55, 0, 1)), join = smoothK(clamp((p - 0.45) / 0.4, 0, 1)), done = smoothK(clamp((p - 0.8) / 0.2, 0, 1));
        const tight = hot ? 0.62 : s.method === 'cheese' ? 0.74 : 0.8;
        mics.forEach((mc, i) => {
          const h = homes[i], k = lerp(1, tight * (RM * 1.02) / 1.4, join), j = (1 - join) * 0.12;
          mc.position.set(WX + h[0] * lerp(1, 0.52 * tight / 0.8, join) + j * Math.sin(time * 1.2 + i * 2), WY + h[1] * lerp(1, 0.52 * tight / 0.8, join) + j * Math.sin(time + i), -0.3);
          mc.rotation.y = time * 0.1 * (i - 1);
          if (acidic) mc.setCoat(1 - strip); else mc.setCoat(1, strip);
        });
        agents.material.color.set(acidic ? COL.acid : 0xff9a3c);
        const na = Math.round(NA * (acidic ? clamp(p * 1.6, 0.08, 1) : 0.35));
        ag.forEach((q, i) => {
          const x = q.x + 0.3 * Math.sin(time * 1.5 + q.a), y = q.y + 0.3 * Math.sin(time * 1.2 + q.b), mc = mics[q.m].position;
          if (i < NA) {
            if (i >= na) { agents.hide(i); return; }
            const st = (i % 2 ? strip : strip * 0.5), ox = RM * 1.08 * Math.cos(q.th), oy = RM * 1.08 * Math.sin(q.th);
            agents.place(i, lerp(WX + x, mc.x + ox, st), lerp(WY + y, mc.y + oy, st), lerp(0, mc.z + 0.4, st), acidic ? 1 : 1.6);
          } else {
            const n = i - NA, st = hot ? smoothK(clamp(p / 0.3, 0, 1)) : 0, ox = RM * 0.98 * Math.cos(q.th), oy = RM * 0.98 * Math.sin(q.th);  // heat sticks whey proteins to casein
            if (Math.hypot(x, y) > WR * 0.9 && st < 0.5) { wheyP.hide(n); return; }
            wheyP.place(n, lerp(WX + x, mc.x + ox, st), lerp(WY + y, mc.y + oy, st), lerp(0, mc.z + 0.45, st));
          }
        });
        agents.done(); wheyP.done();
        lMic.element.style.setProperty('--c', acidic ? COL.acid : '#ff9a3c');
        lMic.element.innerHTML = p < 0.05 ? 'micelles in milk: hairy and apart' : !acidic ? (join < 0.5 ? '<b>chymosin</b> cuts the hairs off' : 'bald micelles joined by calcium') : hot ? (p < 0.3 ? 'heat sticks <b>whey proteins</b> on' : join < 0.5 ? '<b>acid</b> flattens the hairs' : 'tight clumps: whey squeezed out') : (join < 0.5 ? '<b>acid</b> slowly flattens the hairs' : 'a soft, open network');
        // the pot
        const separates = s.method === 'paneer' || s.method === 'cheese';
        liqMat.color.set(0xf6f3ea).lerp(col.set(separates ? hex(COL.whey) : 0xffffff), separates ? join : join * 0.7);
        liqMat.opacity = separates ? lerp(1, 0.55, join) : 1; liqMat.roughness = separates ? 0.2 : 0.3 + 0.5 * join; liqMat.depthWrite = !separates || join < 0.2;
        flame.visible = hot; wall.material.color.set(0xc9ced6);
        lp.forEach((q, i) => {
          const show = separates ? join * (1 - done * 0.85) : 0, y = Y + 0.25 + (s.method === 'paneer' ? lerp(q.y, 0.75 + q.y * 0.25, join) : q.y * 0.9) * (FILL - 0.3) + 0.03 * Math.sin(time * 1.5 + q.a);
          if (s.method === 'paneer') { lumps.place(i, PX + q.x, y, q.z, Math.max(0.0001, show * q.s)); cubes.place(i, [0, -99, 0], null, 0.0001); }
          else if (s.method === 'cheese') { cubes.place(i, [PX + q.x, y, q.z], [0, q.a, 0], Math.max(0.0001, show)); lumps.hide(i); }
          else { lumps.hide(i); cubes.place(i, [0, -99, 0], null, 0.0001); }
        });
        lumps.done(); cubes.done();
        block.visible = s.method === 'paneer' && done > 0.02; block.scale.setScalar(Math.max(0.001, done));
        wheel.visible = s.method === 'cheese' && done > 0.02; wheel.scale.setScalar(Math.max(0.001, done));
        lPot.element.style.setProperty('--c', m.col);
        lPot.element.innerHTML = `<b>${m.label}</b> · ${m.Ttxt} · pH ${lerp(PH_MILK, m.ph, smoothK(p)).toFixed(2)}`;
        lEnd.element.innerHTML = p > 0.8 ? m.end : separates && join > 0.3 ? 'curds in whey' : p < 0.05 ? 'milk' : 'thickening';
        const k2 = `${s.method}|${s.p}`; if (k2 !== key) { key = k2; chart.redraw(); }
      },
      readout: (s) => {
        const m = METHODS[s.method];
        return `<div class="big">${m.n}</div>
          <div class="row"><span>Clots at</span><b>${m.Ttxt} · pH ${m.ph}</b></div>
          <div class="row"><span>Takes</span><b>${m.time}</b></div>
          <div class="row"><span>The whey</span><b style="color:${COL.whey}">${m.whey}</b></div>
          <small><b>How:</b> ${m.by}. Temperatures and pH are typical values.</small>`;
      },
    };
  },
};
