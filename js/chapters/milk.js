// Chapter 1: what is in milk. Three scales of the same glass:
//   the glass (1 unit ≈ 2 cm): its contents sorted into layers by weight (MILK in curd.js);
//   ×1,000 (1 unit = 2 µm): fat globules, each in its membrane, among specks of casein;
//   ×100,000 (1 unit = 20 nm): one casein micelle, about 150 nm across, with its calcium phosphate
//   clusters and its "hairy" coat of κ-casein (hairs drawn about twice their real 5–10 nm).
// Counts in the readout: micelles per mL = casein mass × voluminosity (about 4 mL of micelle per
// gram of casein, Walstra) ÷ the volume of a 150 nm sphere, which gives about 10¹⁴; fat globules
// per mL = fat volume (density 0.92 g/mL) ÷ the volume of one globule of the typical diameter.
import { THREE, M } from '../kit.js';
import { VIEW, REEL_VIEW, CHART, CHART_POS, MILK, PARTS, COL, hex, board, panelBg, title, bars, note, dots, jar, rng, fitNarrow, inReel, reelChart, focusSwitch, clamp, lerp, smoothK, fmtN, TAU } from '../curd.js';

const VIEWS = {
  glass: VIEW, micro: VIEW, nano: VIEW,
};
export const micellesPerMl = (m) => ((m.casein / 100) * 4.0) / ((Math.PI / 6) * Math.pow(150e-7, 3));        // cm³ per cm³ ÷ cm³
export const globulesPerMl = (m) => ((m.fat / 100) / 0.92) / ((Math.PI / 6) * Math.pow(m.globule * 1e-4, 3));

export default {
  id: 'milk',
  short: 'What is in milk',
  title: 'What is in a glass of milk?',
  subtitle: 'Mostly water, with fat droplets and protein balls floating in it and sugar dissolved in it. Curd is made from exactly these parts.',
  view: VIEWS.glass,
  learn: `<p>Milk looks like one smooth white liquid. It is really three things at once. About <b>87%</b> of cow milk is <b>water</b>. Dissolved in that water, like sugar in tea, are <b>lactose</b> (milk sugar), minerals and small <b>whey proteins</b>.</p>
    <p>Floating in it are droplets of <b>fat</b>, a few thousandths of a millimetre wide, each wrapped in a thin membrane. Fat floating in water is an <b>emulsion</b>. Leave milk alone and the droplets rise: that is <b>malai</b>, and it is the start of the story in <a href="https://glassbox.how/butterclear/">ButterClear</a>.</p>
    <p>Far smaller still are the <b>casein micelles</b>: balls of protein about 150 nanometres across, held together by calcium phosphate. A single drop of milk holds trillions. They scatter light, which is why milk is white. Tiny solid particles hanging in a liquid are a <b>colloid</b>.</p>
    <p>Each micelle wears a coat of <b>κ-casein</b> "hairs" that carry a negative charge. Like charges push apart, and the hairs act as bumpers, so the micelles never stick. Milk stays liquid. Making curd means taking that protection away.</p>
    <p><b>Buffalo milk</b> has less water and nearly twice the fat, with more protein. That is why buffalo dahi sets thicker.</p>
    <p class="tip"><b>Try it:</b> slide <b>Sort the glass</b> to pull milk apart into its ingredients. Then zoom in 1,000 times to meet the fat globules, and 100,000 times to see one hairy micelle. Switch to buffalo milk and watch what changes.</p>`,
  terms: [
    { t: 'Emulsion', d: 'Droplets of one liquid floating in another. In milk, fat droplets float in water.' },
    { t: 'Colloid', d: 'Tiny particles, too small to sink, spread through a liquid. Casein micelles make milk a colloid.' },
    { t: 'Casein', d: 'The main milk protein, about 80% of the protein in cow and buffalo milk. Curd, paneer and cheese are built from it.' },
    { t: 'Casein micelle', d: 'A ball of thousands of casein chains and calcium phosphate, about 150 nm across.' },
    { t: 'κ-casein (kappa-casein)', d: 'The casein on the outside of a micelle. Its charged hairs keep micelles apart.' },
    { t: 'Lactose', d: 'Milk sugar: one glucose joined to one galactose. Milk has about 4.8%.' },
    { t: 'Whey proteins', d: 'Small proteins dissolved in the water of milk. They stay in the whey unless heat makes them stick to casein.' },
    { t: 'SNF (solids-not-fat)', d: 'Everything in milk that is not water or fat: protein, lactose and minerals. Food standards set a minimum.' },
  ],
  defaults: { focus: 'glass', milk: 'cow', sort: 0 },
  controls: [
    { key: 'focus', type: 'seg', label: 'Look at', options: [{ v: 'glass', label: 'The glass' }, { v: 'micro', label: '×1,000' }, { v: 'nano', label: '×100,000' }] },
    { key: 'milk', type: 'seg', label: 'Milk from a', options: [{ v: 'cow', label: 'Cow' }, { v: 'buffalo', label: 'Buffalo' }], fmt: (v) => `fat ${MILK[v].fat}% · protein ${(MILK[v].casein + MILK[v].whey).toFixed(1)}% (typical)` },
    { key: 'sort', type: 'range', label: 'Sort the glass', min: 0, max: 1, step: 0.01, ends: ['mixed', 'sorted'], fmt: (v) => Math.round(v * 100) + '%' },
  ],
  onChange(s, key) { if (key === 'sort') s.focus = 'glass'; },
  quiz: [
    { q: 'What is most of milk made of?', options: ['Fat', 'Protein', 'Water', 'Sugar'], answer: 2, why: 'Cow milk is about 87% water and buffalo milk about 83%. Everything else floats or dissolves in it.' },
    { q: 'Why don\'t the casein micelles in fresh milk stick together?', options: ['They are too heavy', 'Their hairy coat carries negative charge, and like charges push apart', 'Fat keeps them apart', 'They are dissolved like sugar'], answer: 1, why: 'The κ-casein hairs are negatively charged and work like bumpers. Take the charge away and the micelles join: that is curd.' },
    { q: 'Why does buffalo milk make thicker dahi than cow milk?', options: ['It has more water', 'It has more fat and more protein in every glass', 'It has no lactose', 'It is whiter'], answer: 1, why: 'Buffalo milk carries around 7% fat and over 4% protein, against about 4% and 3.3% for cow milk. More casein builds a denser gel.' },
  ],
  reel: [
    { ms: 5200, caption: 'A glass of milk is about 87% water. The rest is fat, protein, milk sugar and minerals.', set: { focus: 'glass', milk: 'cow' }, anim: { sort: [0, 1] }, view: { pos: [0.2, 3.3, 10.5], target: [0.2, 2.9, 0] }, spin: 0 },
    { ms: 5600, caption: 'Zoom in 100,000 times: protein balls called casein micelles, kept apart by their charged, hairy coats.', set: { focus: 'nano', milk: 'cow', sort: 0 }, view: REEL_VIEW, spin: 0.25 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root);
    const rnd = rng(7), col = new THREE.Color();
    // ---------------------------------------------------------------- the glass, sorted
    const gG = new THREE.Group(); gG.position.set(0.2, 0.45, 0); gG.scale.setScalar(0.85); root.add(gG);
    const R = 1.25, H = 3.6, Y0 = 0.25;
    const glass = jar(gG, 0, 0, 0.1, R + 0.1, H + 1.5, 0xffffff, 0.14); glass.water.visible = false;
    const slabs = PARTS.map((p) => {
      const mat = new THREE.MeshStandardMaterial({ color: 0xf4f1e8, roughness: 0.35 });
      const m = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 1, 48), mat); gG.add(m);
      const l = stage.label('', [0, 0, 0], gG, 'hot'); l.element.style.setProperty('--c', p.col);
      return { p, m, mat, l, c: new THREE.Color(p.col) };
    });
    const table = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.6, 0.1, 64), M.matte(0x2b3039)); table.position.y = 0.05; gG.add(table);

    // ---------------------------------------------------------------- ×1,000: fat globules and specks of casein
    const gM = new THREE.Group(); root.add(gM);
    const BX = 5.4, BY0 = 0.4, BY1 = 5.4, BZ = 2.2;
    const tank = (g) => { const b = new THREE.Mesh(new THREE.BoxGeometry(BX * 2, BY1 - BY0, BZ * 2), M.clear(0x6fb6ff, 0.07)); b.position.y = (BY0 + BY1) / 2; g.add(b); const e = new THREE.LineSegments(new THREE.EdgesGeometry(b.geometry), new THREE.LineBasicMaterial({ color: 0x6f86a3, transparent: true, opacity: 0.6 })); e.position.copy(b.position); g.add(e); };
    tank(gM);
    const NG = 8;
    const globs = Array.from({ length: NG }, (_, i) => {
      const g = new THREE.Group();
      const core = new THREE.Mesh(new THREE.SphereGeometry(1, 28, 18), new THREE.MeshStandardMaterial({ color: hex(COL.fat), roughness: 0.3 })); g.add(core);
      const mem = new THREE.Mesh(new THREE.SphereGeometry(1.06, 28, 18), M.clear(0xff9ecf, 0.28)); g.add(mem);
      const q = { g, x: -BX + 1.4 + (((i % 4) + 0.5 + (rnd() - 0.5) * 0.3) / 4) * 2 * (BX - 1.4), y: i < 4 ? 1.75 + rnd() * 0.3 : 3.9 + rnd() * 0.3, z: (rnd() - 0.5) * 2 * (BZ - 1.3), ph: rnd() * TAU, k: 0.75 + rnd() * 0.5 };
      gM.add(g); return q;
    });
    const NM = 420, specks = dots(NM, 0.05, hex(COL.casein), 6); gM.add(specks);
    const sp = Array.from({ length: NM }, () => ({ x: (rnd() - 0.5) * 2 * BX, y: BY0 + rnd() * (BY1 - BY0), z: (rnd() - 0.5) * 2 * BZ, a: rnd() * TAU, b: rnd() * TAU }));
    const bar5 = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.06, 0.06), M.glow(0xffffff)); bar5.position.set(-BX + 1.25, BY0 - 0.25, BZ); gM.add(bar5);
    const lBar = stage.label('5 µm (a hair is about 70 µm wide)', [-BX + 2.2, BY0 - 0.62, BZ], gM);
    const lFat = stage.label('', [0, 0, 0], gM, 'hot'); lFat.element.style.setProperty('--c', COL.fat);
    const lSpeck = stage.label('white specks: <b>casein micelles</b>', [BX - 1.6, BY1 + 0.35, 0], gM, 'hot'); lSpeck.element.style.setProperty('--c', COL.casein);
    const lWat = stage.label('water, with lactose and minerals dissolved in it', [BX - 2.4, BY0 - 0.62, BZ], gM);

    // ---------------------------------------------------------------- ×100,000: one hairy micelle and its neighbour
    const gN = new THREE.Group(); root.add(gN);
    tank(gN);
    const RM = 2.3;                                     // 150 nm ÷ 20 nm per unit ÷ 2, drawn a little small to fit two
    const mkMicelle = (cx) => {
      const g = new THREE.Group(); g.position.set(cx, 2.9, 0); g.scale.setScalar(0.78); gN.add(g);
      const blobs = dots(90, 0.62, hex(COL.casein), 10); g.add(blobs);
      const cc = dots(40, 0.16, hex(COL.ca), 6); g.add(cc);
      for (let i = 0; i < 90; i++) { const r = RM * 0.82 * Math.cbrt(rnd()), th = Math.acos(2 * rnd() - 1), ph = rnd() * TAU; blobs.place(i, r * Math.sin(th) * Math.cos(ph), r * Math.cos(th), r * Math.sin(th) * Math.sin(ph), 0.8 + rnd() * 0.4); blobs.tint(i, col.set(COL.casein).multiplyScalar(0.82 + rnd() * 0.18)); }
      for (let i = 0; i < 40; i++) { const r = RM * 0.95 * Math.cbrt(rnd()), th = Math.acos(2 * rnd() - 1), ph = rnd() * TAU; cc.place(i, r * Math.sin(th) * Math.cos(ph), r * Math.cos(th), r * Math.sin(th) * Math.sin(ph)); }
      blobs.done(); cc.done();
      const hp = [];
      for (let i = 0; i < 150; i++) { const th = Math.acos(2 * rnd() - 1), ph = rnd() * TAU, d = [Math.sin(th) * Math.cos(ph), Math.cos(th), Math.sin(th) * Math.sin(ph)]; hp.push(d[0] * RM * 0.95, d[1] * RM * 0.95, d[2] * RM * 0.95, d[0] * (RM + 0.75), d[1] * (RM + 0.75), d[2] * (RM + 0.75)); }
      const hg = new THREE.BufferGeometry(); hg.setAttribute('position', new THREE.Float32BufferAttribute(hp, 3));
      g.add(new THREE.LineSegments(hg, new THREE.LineBasicMaterial({ color: 0x8fd0ff, transparent: true, opacity: 0.9 })));
      const halo = new THREE.Mesh(new THREE.SphereGeometry(RM + 0.8, 32, 20), M.ghost(0x6fb6ff, 0.07)); g.add(halo);
      return g;
    };
    const micA = mkMicelle(-2.7), micB = mkMicelle(2.7);
    const push = [-1, 1].map((sg) => { const a = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.6, 16), M.glow(0x8fd0ff)); a.rotation.z = sg > 0 ? -Math.PI / 2 : Math.PI / 2; gN.add(a); return { a, sg }; });
    const NS = 160, small = dots(NS, 0.1, 0xffffff, 6); gN.add(small);
    const sm = Array.from({ length: NS }, (_, i) => ({ x: (rnd() - 0.5) * 2 * BX, y: BY0 + rnd() * (BY1 - BY0), z: (rnd() - 0.5) * 2 * BZ, a: rnd() * TAU, b: rnd() * TAU, whey: i % 4 === 0 }));
    sm.forEach((q, i) => small.tint(i, col.set(q.whey ? COL.wheyP : COL.lactose)));
    const lMic = stage.label('<b>casein micelle</b>, about 150 nm', [-2.9, 5.75, 0], gN, 'hot'); lMic.element.style.setProperty('--c', COL.casein);
    const lHair = stage.label('κ-casein hairs: <b>negative charge</b>', [2.7, 5.75, 0], gN, 'hot'); lHair.element.style.setProperty('--c', '#8fd0ff');
    const lCa = stage.label('purple: calcium phosphate "glue"', [-2.9, 0.02, 0], gN, 'hot'); lCa.element.style.setProperty('--c', COL.ca);
    const lRep = stage.label('like charges push apart', [0, 3.75, 0], gN);
    const lSm = stage.label('yellow: lactose · green: whey protein', [2.7, 0.02, 0], gN);

    // ---------------------------------------------------------------- chart
    let S = {}, key = '';
    const chart = board(root, CHART.w, CHART.h, CHART.px, CHART.py, (g, w, h) => {
      panelBg(g, w, h);
      const m = MILK[S.milk || 'cow'];
      title(g, m.n, 'g in 100 g');
      bars(g, PARTS.map((p) => ({ label: p.n.replace(/ \(.*/, '').replace(' protein', ''), value: m[p.k], color: p.col, text: m[p.k].toFixed(1) })), { x: 16, y: 52, w: w - 16, rowH: 42, labelW: 110, max: 100 });
    }, CHART_POS);
    const setFocus = focusSwitch(stage, { glass: gG, micro: gM, nano: gN }, VIEWS);
    let sortK = 0, cur = { ...MILK.cow };

    return {
      update(dt, s, time) {
        dt = Math.max(0, Math.min(dt, 0.05)); S = s;
        const narrow = fitNarrow(stage, [lBar, lWat, lSm, lCa, lRep]);
        setFocus(s.focus);
        const m = MILK[s.milk];
        PARTS.forEach((p) => { cur[p.k] += (m[p.k] - cur[p.k]) * (1 - Math.exp(-dt * 4)); });
        chart.mesh.visible = !narrow && reelChart(stage, chart);
        if (s.focus === 'glass') {
          sortK += (s.sort - sortK) * (1 - Math.exp(-dt * 6));
          const k = smoothK(sortK); let y = Y0, ly = -1;
          slabs.forEach((sl, i) => {
            const hh = Math.max(0.012, (cur[sl.p.k] / 100) * H), gap = i ? 0.22 * k : 0;
            y += gap; sl.m.scale.y = hh; sl.m.position.set(0, y + hh / 2, 0); y += hh;
            sl.mat.color.set(0xf4f1e8).lerp(sl.c, k);
            ly = Math.max(sl.m.position.y, ly + 0.5);
            sl.l.visible = k > 0.5; sl.l.position.set(2.75, ly, 0);
            sl.l.element.innerHTML = `${sl.p.n.replace(/ \(.*/, '')} <b>${m[sl.p.k].toFixed(1)}%</b>`;
          });
        } else if (s.focus === 'micro') {
          const want = s.milk === 'buffalo' ? NG : 6, rr = m.globule / 4;   // 1 unit = 2 µm
          globs.forEach((q, i) => {
            q.g.visible = i < want; const r = rr * q.k;
            q.g.scale.setScalar(q.g.scale.x + (r - q.g.scale.x) * (1 - Math.exp(-dt * 4)));
            q.g.position.set(q.x + 0.25 * Math.sin(time * 0.5 + q.ph), clamp(q.y + 0.3 * Math.sin(time * 0.37 + q.ph * 2), BY0 + r, BY1 - r), q.z);
          });
          lFat.position.set(globs[0].g.position.x, globs[0].g.position.y + rr * globs[0].k + 0.5, globs[0].g.position.z);
          lFat.element.innerHTML = `<b>fat globule</b> in its membrane, about ${m.globule} µm`;
          const n = Math.round(NM * clamp(m.casein / 3.5, 0, 1));
          sp.forEach((q, i) => { if (i >= n) { specks.hide(i); return; } specks.place(i, q.x + 0.1 * Math.sin(time * 3.1 + q.a), q.y + 0.12 * Math.sin(time * 2.7 + q.b), q.z + 0.12 * Math.cos(time * 2.3 + q.a)); });
          specks.done();
        } else {
          const w = 0.12 * Math.sin(time * 1.3);
          micA.position.x = -2.7 - w; micB.position.x = 2.7 + w; micA.rotation.y = time * 0.15; micB.rotation.y = -time * 0.12;
          push.forEach(({ a, sg }) => { a.position.set(sg * (0.45 + 0.12 * Math.sin(time * 3)), 2.9, 0); });
          sm.forEach((q, i) => {
            let x = q.x + 0.5 * Math.sin(time * 1.9 + q.a), y = q.y + 0.5 * Math.sin(time * 1.6 + q.b), z = q.z + 0.4 * Math.cos(time * 1.4 + q.a);
            const near = Math.min(Math.hypot(x + 2.7, y - 2.9, z), Math.hypot(x - 2.7, y - 2.9, z)) / 0.78;
            small.place(i, x, y, z, near < RM + 0.8 ? 0.0001 : q.whey ? 1.5 : 0.7);
          });
          small.done();
        }
        const k2 = `${s.milk}`; if (k2 !== key) { key = k2; chart.redraw(); }
      },
      readout: (s) => {
        const m = MILK[s.milk], snf = m.casein + m.whey + m.lactose + m.minerals;
        if (s.focus === 'glass') return `<div class="big">${m.n}: ${m.water.toFixed(0)}% water</div>
          <div class="row"><span>Fat</span><b>${m.fat.toFixed(1)}%</b></div>
          <div class="row"><span>Protein (casein + whey)</span><b>${m.casein.toFixed(1)} + ${m.whey.toFixed(1)}%</b></div>
          <div class="row"><span>Lactose</span><b>${m.lactose.toFixed(1)}%</b></div>
          <div class="row"><span>Solids-not-fat (SNF)</span><b>${snf.toFixed(1)}%</b></div>
          <small>Typical values: real milk shifts with breed, feed and season. FSSAI minimum for ${s.milk} milk: ${m.fssai}.</small>`;
        if (s.focus === 'micro') return `<div class="big">An emulsion: fat in water</div>
          <div class="row"><span>Fat globule, typical width</span><b>${m.globule} µm</b></div>
          <div class="row"><span>Globules in 1 mL (if all that size)</span><b>about ${fmtN(globulesPerMl(m))}</b></div>
          <div class="row"><span>Casein micelle width</span><b>about 0.15 µm</b></div>
          <small>Each globule wears a thin membrane that stops it merging with its neighbours. Fat is lighter than water, so globules slowly rise as malai.</small>`;
        return `<div class="big">A colloid: protein balls in water</div>
          <div class="row"><span>Micelle width</span><b>50–600 nm, about 150</b></div>
          <div class="row"><span>Micelles in 1 mL</span><b>about ${fmtN(micellesPerMl(m))}</b></div>
          <div class="row"><span>Charge on each (zeta potential)</span><b>about −20 mV</b></div>
          <small>The hairs are drawn about twice their real length (5–10 nm). Lactose and whey proteins are drawn larger than life too.</small>`;
      },
    };
  },
};
