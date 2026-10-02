// Chapter 3: the pH falls and the gel forms. Scene: 1 unit ≈ 210 nm, so a micelle (r = 0.36) is
// about 150 nm across. Fat globules would be 20 times wider than a micelle; the two shown are drawn
// far too small so they fit. Blue dots are water, red dots hydrogen ions (their number follows the
// logarithm of the real concentration), purple dots the calcium that leaves the micelles.
// Physics shown (curd.js): micelle charge (zeta potential) about −20 mV at pH 6.65, zero at the
// isoelectric point 4.6; calcium phosphate dissolving out of the micelle between about pH 6 and 5
// (fully by about 5.0: Dalgleish & Law 1989, Lucey 2004); gel point near pH 5.3 for boiled milk and
// 4.95 for raw milk; final stiffness about 410 Pa against under 20 Pa (Lucey et al. 1998).
import { THREE, M } from '../kit.js';
import { VIEW, REEL_VIEW, CHART, CHART_POS, COL, hex, board, panelBg, axes, title, line, dot, note, dashV, dots, tank, rng, fitNarrow, reelChart, clamp, lerp, smoothK, zeta, firmness, gelFrac, GEL, PH_MILK, PH_ISO, TAU } from '../curd.js';

const stateOf = (ph, boiled) => {
  const g = boiled ? GEL.boiled.ph : GEL.raw.ph;
  if (ph > g + 0.5) return ['Liquid milk: micelles push each other away', COL.water];
  if (ph > g) return ['Charge fading: micelles start to touch', COL.sugar];
  if (ph > 4.75) return ['Gelling: chains of micelles link up', COL.sugar];
  if (ph > 4.3) return ['Set curd: one network holding the water', COL.good];
  return ['Over-sour: the network tightens and squeezes out whey', COL.bad];
};

export default {
  id: 'gel',
  short: 'From liquid to gel',
  title: 'At pH 4.6 the milk sets',
  subtitle: 'Acid cancels the charge that keeps casein micelles apart. They link into a sponge that holds all the water in place.',
  view: VIEW,
  learn: `<p>Fresh milk has a <b>pH</b> of about 6.7, nearly neutral. As the bacteria make lactic acid, the pH slides down. Each step of one pH unit means ten times more hydrogen ions (H<sup>+</sup>).</p>
    <p>Remember the casein micelles and their negatively charged hairs. Hydrogen ions are positive. They settle on the hairs and cancel the negative charge, bit by bit. The hairs flop down. Acid also dissolves the calcium phosphate "glue" inside the micelles, which loosens them.</p>
    <p>At about <b>pH 4.6</b> the casein has no net charge at all. This is its <b>isoelectric point</b>. With nothing pushing them apart, micelles that bump now stick. They join into chains, and the chains join into a three-dimensional <b>network</b>.</p>
    <p>That network is only a few percent of the curd. The rest, mostly water, sits trapped in its pores along with the fat. Nothing was removed and nothing dried out. A liquid has become a soft solid: a <b>gel</b>.</p>
    <p>Boiling the milk first matters here. Heat unfolds the <b>whey proteins</b> and they stick onto the micelles. Coated micelles start linking earlier, near pH 5.3, and build a gel about twenty times stiffer than raw milk gives.</p>
    <p class="tip"><b>Try it:</b> drag the pH down slowly from 6.7. Watch the blue charge clouds shrink, then the micelles link up near 5.3. Now switch off <b>Milk was boiled first</b> and see how weak the gel is.</p>`,
  terms: [
    { t: 'pH', d: 'A scale of acidity. Lower is more acid. One unit down means ten times more hydrogen ions.' },
    { t: 'Isoelectric point', d: 'The pH at which a protein carries no net charge. For casein it is 4.6.' },
    { t: 'Gel', d: 'A soft solid: a thin network that traps a lot of liquid. Curd, jelly and paneer are gels.' },
    { t: 'Coagulation', d: 'Particles in a liquid joining into a solid mass.' },
    { t: 'Colloidal calcium phosphate', d: 'Tiny clusters of calcium and phosphate that hold a micelle together. Acid dissolves them.' },
    { t: 'Denaturation', d: 'A protein losing its folded shape, here from heat. Unfolded whey proteins stick to casein.' },
    { t: 'Storage modulus (G′)', d: 'A measure of how stiff a gel is, in pascals. Lab curd from heated milk reaches about 400 Pa.' },
  ],
  defaults: { ph: 6.65, boiled: true },
  controls: [
    { key: 'ph', type: 'range', label: 'pH of the milk', min: 3.9, max: 6.65, step: 0.01, ends: ['3.9 sour', '6.65 fresh'], fmt: (v) => v.toFixed(2) },
    { key: 'boiled', type: 'toggle', label: 'Milk was boiled first', hint: 'Heat makes whey proteins stick to the micelles. The curd sets sooner and much firmer.' },
  ],
  quiz: [
    { q: 'What happens to casein micelles at pH 4.6?', options: ['They dissolve completely', 'They lose their net charge and stick together', 'They turn into fat', 'They become bacteria'], answer: 1, why: 'pH 4.6 is casein\'s isoelectric point. With no charge to push them apart, the micelles join into a network.' },
    { q: 'Where does the water go when milk becomes curd?', options: ['It evaporates', 'The bacteria drink it', 'It stays, trapped in the pores of the protein network', 'It turns into acid'], answer: 2, why: 'Curd weighs the same as the milk it came from. The casein network is a thin sponge holding the water in place.' },
    { q: 'Milk goes from pH 6.6 to pH 4.6. How much has the hydrogen ion concentration grown?', options: ['2 times', '20 times', '100 times', '1,000 times'], answer: 2, why: 'Each pH unit is a factor of ten. Two units down is 10 × 10 = 100 times more hydrogen ions.' },
  ],
  reel: [
    { ms: 6200, caption: 'The acid cancels the charge on the micelles. Near pH 4.6 they stick together and build a network.', set: { boiled: true }, anim: { ph: [6.65, 4.5] }, view: REEL_VIEW, spin: 0.2 },
    { ms: 4600, caption: 'That network is a sponge. It traps the water and fat, and liquid milk becomes a soft solid: curd.', set: { boiled: true, ph: 4.5 }, view: REEL_VIEW, spin: 0.6 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root);
    const rnd = rng(5), col = new THREE.Color();
    const BX = 5.4, BY0 = 0.4, BY1 = 5.4, BZ = 2.0, RM = 0.36;
    tank(root, BX, BY0, BY1, BZ);
    // network: random-walk strands of touching micelles that wander through the tank
    const NMIC = 84, mic = [], bonds = [];
    const inside = (p) => Math.abs(p[0]) < BX - RM && p[1] > BY0 + RM && p[1] < BY1 - RM && Math.abs(p[2]) < BZ - RM;
    const starts = [[-4.6, 1.2, 0], [-4.4, 4.6, 0.8], [4.6, 1.4, -0.6], [4.4, 4.7, 0.4], [0, 0.9, 1.2], [0.3, 4.9, -1.0]];
    starts.forEach((p) => mic.push({ g: p }));
    for (let tries = 0, last = 0; tries < 6000 && mic.length < NMIC; tries++) {
      const pi = rnd() < 0.72 ? last : Math.floor(rnd() * mic.length), p = mic[pi].g;
      const th = Math.acos(2 * rnd() - 1), ph = rnd() * TAU;
      const c = [p[0] + Math.sin(th) * Math.cos(ph) * RM * 2.05, p[1] + Math.cos(th) * RM * 2.05, p[2] + Math.sin(th) * Math.sin(ph) * RM * 2.05];
      if (!inside(c) || mic.some((m) => Math.hypot(m.g[0] - c[0], m.g[1] - c[1], m.g[2] - c[2]) < RM * 1.9)) { if (tries % 9 === 8) last = Math.floor(rnd() * mic.length); continue; }
      mic.push({ g: c }); bonds.push([pi, mic.length - 1]); last = mic.length - 1;
    }
    while (mic.length < NMIC) mic.push({ g: [(rnd() - 0.5) * 8, BY0 + 1 + rnd() * 3, (rnd() - 0.5) * 2] });
    mic.forEach((m, i) => { m.f = [(rnd() - 0.5) * 2 * (BX - RM * 2), BY0 + RM * 2 + rnd() * (BY1 - BY0 - RM * 4), (rnd() - 0.5) * 2 * (BZ - RM * 2)]; m.a = rnd() * TAU; m.b = rnd() * TAU; m.rank = rnd(); m.p = [0, 0, 0]; });
    const balls = dots(NMIC, RM, hex(COL.casein), 14); balls.material = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 }); root.add(balls);
    const clouds = dots(NMIC, RM * 1.55, 0x6fb6ff, 10); clouds.material = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.16, depthWrite: false }); root.add(clouds);
    const coatW = dots(NMIC * 3, RM * 0.32, hex(COL.wheyP), 6); root.add(coatW);       // whey proteins stuck on boiled-milk micelles
    const bg = new THREE.BufferGeometry(), barr = new Float32Array(bonds.length * 6); bg.setAttribute('position', new THREE.BufferAttribute(barr, 3));
    const bmat = new THREE.LineBasicMaterial({ color: 0xffe9b0, transparent: true, opacity: 0 }); const blines = new THREE.LineSegments(bg, bmat); blines.frustumCulled = false; root.add(blines);
    const NW = 150, water = dots(NW, 0.07, hex(COL.water), 6); root.add(water);
    const NH = 90, hplus = dots(NH, 0.085, hex(COL.acid), 6); root.add(hplus);
    const NC = 60, cal = dots(NC, 0.08, hex(COL.ca), 6); root.add(cal);
    const wp = Array.from({ length: NW + NH + NC }, () => ({ x: (rnd() - 0.5) * 2 * BX, y: BY0 + rnd() * (BY1 - BY0), z: (rnd() - 0.5) * 2 * BZ, a: rnd() * TAU, b: rnd() * TAU, m: Math.floor(rnd() * NMIC) }));
    const fat = [[-2.2, 3.1, 0.3], [2.6, 2.4, -0.4]].map((p) => { const g = new THREE.Mesh(new THREE.SphereGeometry(0.95, 28, 18), new THREE.MeshStandardMaterial({ color: hex(COL.fat), roughness: 0.3, transparent: true, opacity: 0.9 })); g.position.set(...p); root.add(g); return g; });
    const lState = stage.label('', [-1.6, BY1 + 0.38, 0], root, 'hot');
    const lFat = stage.label('fat globule (drawn far too small)', [2.6, 1.1, 0.4], root, 'hot'); lFat.element.style.setProperty('--c', COL.fat);
    const lKey = stage.label('<span style="color:#ff7a8a">●</span> H⁺ &nbsp;<span style="color:#c49bff">●</span> calcium &nbsp;<span style="color:#6fb6ff">●</span> water &nbsp;<span style="color:#8ef0c0">●</span> whey protein', [0, BY0 - 0.4, BZ], root);

    let S = { ph: 6.65, boiled: true }, key = '', gk = 0, coat = 1;
    const chart = board(root, CHART.w, CHART.h, CHART.px, CHART.py, (g, w, h) => {
      panelBg(g, w, h);
      title(g, 'Charge and firmness', '');
      const { X, Y, x0, x1, y0, y1 } = axes(g, w, h, { x0: 62, x1: w - 56, y1: 78, y0: h - 44, xMin: 6.65, xMax: 3.9, yMin: -22, yMax: 12, xTicks: [6.5, 6, 5.5, 5, 4.6, 4], yTicks: [-20, -10, 0, 10], xFmt: (v) => String(v), yFmt: (v) => v + '' });
      const F = (pa) => y0 - (pa / 620) * (y0 - y1);
      dashV(g, X(PH_ISO), y1, y0, '', 'rgba(255,255,255,.55)');
      const z = [], f = []; for (let p = 6.65; p >= 3.9; p -= 0.05) { z.push([p, zeta(p)]); f.push(p); }
      line(g, z, X, Y, '#8fd0ff', 4);
      g.strokeStyle = COL.good; g.lineWidth = 4; g.beginPath(); f.forEach((p, i) => { const y = F(firmness(p, S.boiled)); i ? g.lineTo(X(p), y) : g.moveTo(X(p), y); }); g.stroke();
      [200, 400].forEach((v) => note(g, v + ' Pa', x1 + 4, F(v) + 6, COL.good, 15));
      note(g, 'charge, mV', x0 + 6, 70, '#8fd0ff', 17); note(g, 'firmness', x1 + 50, 70, COL.good, 17, 'right'); note(g, 'pH →', x1, h - 6, 'rgba(255,255,255,.6)', 16, 'right');
      dot(g, X(S.ph), Y(zeta(S.ph)), '#8fd0ff', 8); dot(g, X(S.ph), F(firmness(S.ph, S.boiled)), COL.good, 8);
    }, CHART_POS);

    return {
      update(dt, s, time) {
        dt = Math.max(0, Math.min(dt, 0.05)); S = s;
        const narrow = fitNarrow(stage, [lKey, lFat]);
        chart.mesh.visible = !narrow && reelChart(stage, chart);
        const target = gelFrac(s.ph, s.boiled), over = clamp((4.35 - s.ph) / 0.45, 0, 1);
        gk += (target - gk) * (1 - Math.exp(-dt * 3));
        coat += (clamp(Math.abs(zeta(s.ph)) / 20, 0, 1) - coat) * (1 - Math.exp(-dt * 5));
        const cx = 0, cy = (BY0 + BY1) / 2, shrink = 1 - 0.16 * over;                 // over-acid: the network contracts (syneresis)
        mic.forEach((m, i) => {
          const k = smoothK(clamp(gk * 1.7 - m.rank * 0.7, 0, 1)), j = (1 - k) * 0.55 + 0.03;
          const fx = m.f[0] + j * Math.sin(time * 1.1 + m.a), fy = m.f[1] + j * Math.sin(time * 0.9 + m.b), fz = m.f[2] + j * 0.6 * Math.cos(time * 0.8 + m.a);
          m.p[0] = lerp(fx, cx + (m.g[0] - cx) * shrink, k); m.p[1] = lerp(fy, cy + (m.g[1] - cy) * shrink - 0.25 * over, k); m.p[2] = lerp(fz, m.g[2] * shrink, k); m.k = k;
          balls.place(i, m.p[0], m.p[1], m.p[2]);
          clouds.place(i, m.p[0], m.p[1], m.p[2], Math.max(0.66, 0.66 + 0.34 * coat));
          for (let q = 0; q < 3; q++) { if (!s.boiled) { coatW.hide(i * 3 + q); continue; } const an = m.a + q * 2.1; coatW.place(i * 3 + q, m.p[0] + RM * 0.95 * Math.cos(an), m.p[1] + RM * 0.95 * Math.sin(an), m.p[2] + RM * 0.3 * Math.sin(an * 2)); }
        });
        clouds.material.opacity = 0.03 + 0.15 * coat; clouds.material.color.set(s.ph < PH_ISO - 0.15 ? 0xff9aa5 : 0x6fb6ff);
        balls.done(); clouds.done(); coatW.done();
        bonds.forEach(([a, b], i) => { const A = mic[a], B = mic[b], on = Math.min(A.k, B.k) > 0.6; for (let q = 0; q < 3; q++) { barr[i * 6 + q] = on ? A.p[q] : 0; barr[i * 6 + 3 + q] = on ? B.p[q] : 0; } });
        bg.attributes.position.needsUpdate = true; bmat.opacity = 0.75 * clamp(gk * 1.5, 0, 1);
        const free = 1 - 0.8 * gk, nh = Math.round(8 + (NH - 8) * clamp((PH_MILK - s.ph) / 2.75, 0, 1)), nc = Math.round(NC * clamp((6.2 - s.ph) / 1.2, 0, 1));
        wp.forEach((q, i) => {
          const amp = i < NW ? 0.7 * free + 0.08 : 0.5, sp = i < NW ? 1.2 : 1.8;
          const x = q.x + amp * Math.sin(time * sp + q.a), y = q.y + amp * Math.sin(time * sp * 0.8 + q.b), z = q.z + amp * 0.6 * Math.cos(time * sp * 0.7 + q.a);
          if (i < NW) water.place(i, x, y, z);
          else if (i < NW + NH) { const n = i - NW; if (n >= nh) hplus.hide(n); else { const m = mic[q.m], st = clamp((6.0 - s.ph) / 1.4, 0, 1) * (n % 2 ? 1 : 0); hplus.place(n, lerp(x, m.p[0] + RM * 1.1 * Math.cos(q.a), st), lerp(y, m.p[1] + RM * 1.1 * Math.sin(q.a), st), lerp(z, m.p[2], st)); } }
          else { const n = i - NW - NH; if (n >= nc) cal.hide(n); else { const m = mic[q.m], out = clamp((6.2 - s.ph) / 1.2 - (n / NC) * 0.5, 0, 1); cal.place(n, lerp(m.p[0], x, out), lerp(m.p[1], y, out), lerp(m.p[2], z, out)); } }
        });
        water.done(); hplus.done(); cal.done();
        const [txt, c] = stateOf(s.ph, s.boiled);
        lState.element.style.setProperty('--c', c); lState.element.innerHTML = `<b>${txt}</b>`;
        const k2 = `${s.ph}|${s.boiled}`; if (k2 !== key) { key = k2; chart.redraw(); }
      },
      readout: (s) => {
        const [txt, c] = stateOf(s.ph, s.boiled), G = firmness(s.ph, s.boiled), x = Math.pow(10, PH_MILK - s.ph);
        return `<div class="big">pH ${s.ph.toFixed(2)}</div>
          <div class="row"><span>Hydrogen ions, against fresh milk</span><b style="color:${COL.acid}">× ${x < 10 ? x.toFixed(1) : Math.round(x)}</b></div>
          <div class="row"><span>Charge on a micelle</span><b style="color:#8fd0ff">${zeta(s.ph) > 0 ? '+' : ''}${zeta(s.ph).toFixed(0)} mV</b></div>
          <div class="row"><span>Gel starts at</span><b>pH ${(s.boiled ? GEL.boiled.ph : GEL.raw.ph).toFixed(2)}</b></div>
          <div class="row"><span>Firmness (stiffness G′)</span><b style="color:${COL.good}">${G < 1 ? 'liquid' : Math.round(G) + ' Pa'}</b></div>
          <small style="color:${c}">${txt}.</small> <small>Charge and firmness are typical lab values for ${s.boiled ? 'heated' : 'unheated'} milk.</small>`;
      },
    };
  },
};
