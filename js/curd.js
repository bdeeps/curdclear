// Shared parts for CurdClear: what milk is made of, how lactic acid bacteria grow and make acid,
// how acid turns into pH, when casein micelles gel, plus chart boards and small 3D pieces.
// Everything marked "typical" is a textbook mid-range value, not a law of nature.
import { THREE, M, box, beam, sphere, arrow, clamp, lerp } from './kit.js';

export const TAU = Math.PI * 2;

// ---------------------------------------------------------------- milk
// Typical composition, grams in 100 g. Cow: Walstra, Wouters & Geurts, Dairy Science and Technology
// (2nd ed. 2006, table 1.1: water 87.1, fat 4.0, protein 3.3 of which casein 2.6, lactose 4.6,
// minerals 0.7), rounded to sum to 100. Buffalo: mid-range of Indian reports (fat 6.5–8, protein
// 3.9–4.5, lactose 4.5–5.2, ash 0.8), e.g. Murrah herd studies in the Indian Journal of Animal
// Sciences; the casein to whey ratio is about 82:18 in both. Milk varies with breed, feed and season.
// FSSAI minimums, all India (Food Products Standards and Food Additives Regulations 2011,
// sub-regulation 2.1.2, compendium version of 1 September 2023): cow milk fat 3.2%, solids-not-fat
// 8.3%; buffalo milk fat 5.0%, SNF 9.0%; mixed milk 4.5% and 8.5%.
export const MILK = {
  cow: { n: 'Cow milk', water: 87.2, fat: 3.9, casein: 2.6, whey: 0.7, lactose: 4.8, minerals: 0.8, fssai: 'fat ≥ 3.2%, SNF ≥ 8.3%', globule: 3.5 },
  buffalo: { n: 'Buffalo milk', water: 83.0, fat: 7.0, casein: 3.5, whey: 0.8, lactose: 4.9, minerals: 0.8, fssai: 'fat ≥ 5.0%, SNF ≥ 9.0%', globule: 5 },
};
export const PARTS = [
  { k: 'water', n: 'Water', col: '#6fb6ff' },
  { k: 'lactose', n: 'Lactose (milk sugar)', col: '#ffd166' },
  { k: 'fat', n: 'Fat', col: '#ffb547' },
  { k: 'casein', n: 'Casein protein', col: '#f4f1e8' },
  { k: 'whey', n: 'Whey protein', col: '#8ef0c0' },
  { k: 'minerals', n: 'Minerals (calcium, phosphate…)', col: '#c49bff' },
];
// Sizes. Casein micelles: 50–600 nm across, about 150 nm on average, each made of roughly 10,000
// casein chains glued by tiny (2–3 nm) calcium phosphate clusters (de Kruif & Holt; Dalgleish 2011).
// Fat globules in unhomogenised cow milk: mostly 2–4 µm (0.2–15 µm overall); buffalo globules are
// larger, about 5 µm. A lactic acid bacterium is about 1 µm. Lactose is about 1 nm.
export const SIZE = { micelle: 150e-9, globule: 3.5e-6, bacterium: 1e-6, lactose: 1e-9 };

// ---------------------------------------------------------------- acid and pH
// Fresh milk: pH about 6.6–6.7 and a "titratable acidity" of about 0.15% counted as lactic acid
// (that first 0.15% is not lactic acid at all: it is the buffering of the proteins and phosphates).
// Milk is strongly buffered, so pH falls slowly at first. Typical titration of fermenting milk
// (Tamime & Robinson, Yoghurt: Science and Technology; Indian dahi studies report 0.72–0.81% at
// pH 4.5–4.6). FSSAI (sub-regulation 2.1.13, fermented milk products): starter bacteria at least
// 10⁷ cfu/g, protein at least 2.9%, titratable acidity at least 0.45% (0.6% for yoghurt and
// flavoured dahi); plain dahi keeps the minimum fat and SNF of the milk it was made from.
const TITRATION = [[0.15, 6.65], [0.20, 6.35], [0.25, 6.05], [0.32, 5.75], [0.40, 5.5], [0.50, 5.2], [0.57, 5.0], [0.66, 4.8], [0.75, 4.6], [0.87, 4.4], [1.02, 4.2], [1.20, 4.0], [1.45, 3.8], [1.80, 3.6]];
export function interp(tab, x) {
  if (x <= tab[0][0]) return tab[0][1];
  for (let i = 1; i < tab.length; i++) if (x <= tab[i][0]) { const [x0, y0] = tab[i - 1], [x1, y1] = tab[i]; return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0); }
  return tab[tab.length - 1][1];
}
export const PH_MILK = 6.65, TA_MILK = 0.15, PH_ISO = 4.6;
export const phOfAcid = (ta) => interp(TITRATION, ta);
export const acidOfPh = (ph) => interp(TITRATION.map(([a, p]) => [-p, a]).reverse(), -ph);
// Lactose → lactic acid. Homofermentative bacteria split lactose (342 g/mol) into glucose and
// galactose and turn each sugar (180 g/mol) into two lactic acids (90 g/mol). Many yoghurt strains
// use only the glucose half and leave the galactose, so each gram of acid costs 1.0–1.9 g of lactose.
// We use 1.5 as a mid value: a set dahi has used about a fifth to a third of its lactose, in line
// with measured 16–30% (Mljekarstvo 2011, read from the abstract).
export const LACTOSE_PER_ACID = 1.5;
// Net charge on a casein micelle (zeta potential). About −20 mV in fresh milk, falling to zero
// at the isoelectric point pH 4.6 and turning positive below it (typical curve; Dalgleish 1984,
// Anema & Klostermeyer 1996 report about −17 to −21 mV at natural pH).
export const zeta = (ph) => clamp(-20 * Math.tanh((ph - PH_ISO) / 0.85) / Math.tanh((PH_MILK - PH_ISO) / 0.85), -24, 12);
// When does the gel start? Boiled or pasteurised milk: whey proteins unfold above about 70 °C and
// stick to the micelles; they lose their charge sooner (isoelectric near pH 5.2–5.3), so the gel
// begins at about pH 5.3. Unheated milk gels only near pH 4.9–5.0. And the heated gel is far
// stiffer: storage modulus about 390–430 Pa against under 20 Pa (Lucey, Tamehana, Singh & Munro,
// J. Dairy Research 65, 1998: skim milk, 80 °C for 30 min, acidified at 30 °C to pH 4.6).
export const GEL = { boiled: { ph: 5.3, G: 410 }, raw: { ph: 4.95, G: 20 } };
export function firmness(ph, boiled = true) {
  const g = boiled ? GEL.boiled : GEL.raw;
  if (ph >= g.ph) return 0;
  return g.G * Math.pow(clamp((g.ph - ph) / (g.ph - PH_ISO), 0, 1.1), 1.6);   // Pa, levels off below 4.6
}
// How far the micelles have joined up, 0 (free) to 1 (one network).
export const gelFrac = (ph, boiled = true) => { const g = boiled ? GEL.boiled : GEL.raw; return clamp((g.ph - ph) / (g.ph - PH_ISO), 0, 1); };

// ---------------------------------------------------------------- the bacteria
// Dahi is a mixed culture. We model two teams:
//   mesophiles (Lactococcus lactis and friends): grow about 10–40 °C, best near 30 °C;
//   thermophiles (Streptococcus thermophilus with Lactobacillus delbrueckii): about 18–52 °C, best
//   near 42 °C (cardinal temperatures for S. thermophilus: min 17, opt 40–42, max 52 °C).
// Growth rate against temperature: the cardinal temperature model of Rosso et al. (1993).
// Best-case doubling times in milk: about 30 min for thermophiles, about 50 min for mesophiles
// (typical). Above its maximum a team dies, faster the hotter it is.
export const TEAMS = {
  meso: { n: 'Mesophiles (Lactococcus)', Tmin: 8, Topt: 30, Tmax: 41, mu: 0.85, phStop: 4.3, col: '#8fb0ff' },
  thermo: { n: 'Thermophiles (S. thermophilus, Lactobacillus)', Tmin: 18, Topt: 42, Tmax: 52, mu: 1.4, phStop: 3.7, col: '#ff8a5c' },
};
export function ctmi(T, { Tmin, Topt, Tmax, mu }) {
  if (T <= Tmin || T >= Tmax) return 0;
  const a = (T - Tmax) * (T - Tmin) * (T - Tmin), b = (Topt - Tmin) * ((Topt - Tmin) * (T - Topt) - (Topt - Tmax) * (Topt + Tmin - 2 * T));
  return Math.max(0, (mu * a) / b);
}
export const growthRate = (T) => Math.max(ctmi(T, TEAMS.meso), ctmi(T, TEAMS.thermo));   // per hour, the faster team
export const doubling = (T) => { const m = growthRate(T); return m > 1e-6 ? (Math.LN2 / m) * 60 : Infinity; };   // minutes
const deathRate = (T, tm) => (T <= tm.Tmax ? 0 : 3 * Math.exp((T - tm.Tmax) / 3.5));   // per hour (illustrative)

// A spoon of jaman: good dahi carries around 10⁸–10⁹ live bacteria per gram (FSSAI and Codex
// CXS 243 ask for at least 10⁷). The milk can feed about 10⁹ per mL before acid stops them.
export const JAMAN_CFU = 5e8, N_MAX = 1.2e9, LAG_H = 0.4;
// Acid making: Luedeking & Piret (1959) found for lactic fermentation that the rate of acid
// production = α × growth + β × number alive. α and β here are set so that at 42 °C a 3% inoculum
// reaches pH 4.6 in a little over 4 hours and a 1% inoculum in about 5, and at 30 °C in about 8:
// the ranges dairies and homes report (yoghurt 42–43 °C for 3–5 h; dahi 30–45 °C for 4–12 h).
const ALPHA = 0.40 / 1e9, BETA = 0.30 / 1e9;
// Cooling of the pot (Newton's law): time constants are estimates for about 1 litre.
export const WRAPS = { bare: { n: 'Bare steel pot', tau: 1.4 }, wrap: { n: 'Wrapped in a blanket or casserole', tau: 6 }, hold: { n: 'Held warm (oven light, dahi maker)', tau: Infinity } };

// Run a batch. T0 = milk temperature when the jaman goes in, room = kitchen temperature (°C),
// wrap = key of WRAPS, inoc = jaman as % of the milk, hours to simulate. Returns one row every
// STEP hours: { t, T, N (per mL), nm, nt, ta (% as lactic), ph, G (Pa) }.
export const STEP = 0.05;
const cache = new Map();
export function runBatch({ T0 = 42, room = 25, wrap = 'wrap', inoc = 1, boiled = true, hours = 24, shake = false, fridgeAt = null } = {}) {
  const key = [T0, room, wrap, inoc, boiled, hours, shake, fridgeAt].join('|');
  if (cache.has(key)) return cache.get(key);
  const tau = WRAPS[wrap].tau, rows = [];
  const warm = (t) => (tau === Infinity ? T0 : room + (T0 - room) * Math.exp(-t / tau));
  // In the fridge (about 5 °C) the pot cools with a time constant of about 1.5 h (estimate).
  const Tat = (t) => (fridgeAt !== null && t > fridgeAt ? 5 + (warm(fridgeAt) - 5) * Math.exp(-(t - fridgeAt) / 1.5) : warm(t));
  let nm = (inoc / 100) * JAMAN_CFU * 0.5, nt = nm, ta = TA_MILK + (inoc / 100) * 0.7, dead = 0;
  const sub = 5, h = STEP / sub;
  for (let i = 0; i <= Math.round(hours / STEP); i++) {
    const t = i * STEP, T = Tat(t), ph = phOfAcid(ta);
    rows.push({ t, T, N: nm + nt, nm, nt, ta, ph, G: firmness(ph, boiled) * (shake ? 0.35 : 1), dead });
    for (let j = 0; j < sub; j++) {
      const tt = t + j * h, Tj = Tat(tt), p = phOfAcid(ta);
      const lag = clamp(tt / LAG_H, 0, 1), room_ = Math.max(0, 1 - (nm + nt) / N_MAX);
      let dA = 0;
      [['m', TEAMS.meso], ['t', TEAMS.thermo]].forEach(([k, tm]) => {
        const n = k === 'm' ? nm : nt, mu = ctmi(Tj, tm), fp = clamp((p - tm.phStop) / 0.9, 0, 1);
        const grow = mu * n * room_ * fp * lag, die = deathRate(Tj, tm) * n;
        dA += ALPHA * grow + BETA * n * (mu / tm.mu) * fp * lag;
        const nn = Math.max(0, n + (grow - die) * h);
        dead += Math.min(n, die * h);
        if (k === 'm') nm = nn; else nt = nn;
      });
      ta += dA * h;
    }
  }
  if (cache.size > 400) cache.clear();
  cache.set(key, rows);
  return rows;
}
export const rowAt = (rows, t) => rows[clamp(Math.round(t / STEP), 0, rows.length - 1)];
// Hours until the pH first reaches a value (Infinity if it never does in the run).
export const timeTo = (rows, ph) => { const r = rows.find((q) => q.ph <= ph); return r ? r.t : Infinity; };
// What you would call it at the table.
export function verdict(r, boiled = true) {
  if (r.N < 1e4 && r.ph > 5.5) return { k: 'dead', n: 'The jaman is dead: plain milk', col: COL.bad };
  if (r.ph > (boiled ? GEL.boiled.ph : GEL.raw.ph)) return { k: 'milk', n: r.ph < 6.2 ? 'Still liquid, turning sour' : 'Still milk', col: COL.water };
  if (r.ph > 4.75) return { k: 'soft', n: 'Just setting: wobbly', col: COL.sugar };
  if (r.ph > 4.35) return { k: 'set', n: 'Set: mild, firm dahi', col: COL.good };
  if (r.ph > 4.1) return { k: 'tangy', n: 'Tangy, with a little whey', col: COL.acid };
  return { k: 'sour', n: 'Sour, with whey on top', col: COL.bad };
}
// Whey on top (syneresis), 0–1, illustrative: the gel shrinks and squeezes whey out when it
// over-acidifies, when it sets hot and fast (above about 44 °C), or when it is shaken while setting
// (Lucey 2004 on whey separation in yoghurt; these three causes are his, the numbers are ours).
export function wheyIndex(r, { Tset = 40, shake = false } = {}) {
  if (r.G <= 0) return 0;
  return clamp(clamp((4.45 - r.ph) / 0.7, 0, 1) * 0.7 + clamp((Tset - 43) / 8, 0, 1) * 0.3 + (shake ? 0.45 : 0), 0, 1);
}

// ---------------------------------------------------------------- colours and formats
export const COL = {
  water: '#6fb6ff', milk: '#f4f1e8', fat: '#ffb547', sugar: '#ffd166', lactose: '#ffd166', acid: '#ff7a8a',
  casein: '#f4f1e8', whey: '#b9d98a', wheyP: '#8ef0c0', bug: '#8fb0ff', rod: '#ff8a5c', ca: '#c49bff',
  good: '#5ce1a9', bad: '#ff6b6b', text: '#e8eef8', temp: '#ffb547',
};
export const fmtH = (h) => (h === Infinity ? 'never' : h < 1 ? Math.round(h * 60) + ' min' : h.toFixed(1).replace('.0', '') + ' h');
export const fmtN = (n) => { if (n < 1) return '0'; const e = Math.floor(Math.log10(n)), m = n / Math.pow(10, e); const sup = String(e).replace(/\d/g, (d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d]); return (m < 1.5 ? '' : m.toFixed(0) + ' × ') + '10' + sup; };
export const hex = (c) => new THREE.Color(c).getHex();
// ---------------------------------------------------------------- boards (live charts in 3D)
export function panelBg(g, w, h) { g.clearRect(0, 0, w, h); g.fillStyle = 'rgba(10,12,18,.9)'; g.fillRect(0, 0, w, h); }
export function board(root, w, h, pxW, pxH, draw, pos) {
  const c = document.createElement('canvas'); c.width = pxW; c.height = pxH;
  const g = c.getContext('2d'), tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const redraw = () => { draw(g, pxW, pxH); tex.needsUpdate = true; };
  redraw();
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false, side: THREE.DoubleSide }));
  m.position.set(...pos); root.add(m);
  return { tex, redraw, canvas: c, mesh: m };
}
export function axes(g, w, h, { x0 = 84, x1 = w - 28, y0 = h - 64, y1 = 70, xMax, yMax, xMin = 0, yMin = 0, xTicks, yTicks, xFmt = String, yFmt = String, xLabel = '', yLabel = '', logX = false, logY = false }) {
  const L = Math.log10;
  const X = logX ? (x) => x0 + ((L(Math.max(x, 1e-30)) - L(xMin)) / (L(xMax) - L(xMin))) * (x1 - x0) : (x) => x0 + ((x - xMin) / (xMax - xMin)) * (x1 - x0);
  const Y = logY ? (y) => y0 - ((L(Math.max(y, 1e-30)) - L(yMin)) / (L(yMax) - L(yMin))) * (y0 - y1) : (y) => y0 - ((y - yMin) / (yMax - yMin)) * (y0 - y1);
  g.strokeStyle = 'rgba(255,255,255,.12)'; g.lineWidth = 1; g.fillStyle = 'rgba(255,255,255,.6)'; g.font = '19px sans-serif';
  for (const t of xTicks) { g.beginPath(); g.moveTo(X(t), y1); g.lineTo(X(t), y0); g.stroke(); const s = xFmt(t); g.fillText(s, X(t) - g.measureText(s).width / 2, y0 + 26); }
  for (const t of yTicks) { g.beginPath(); g.moveTo(x0, Y(t)); g.lineTo(x1, Y(t)); g.stroke(); const s = yFmt(t); g.fillText(s, x0 - 10 - g.measureText(s).width, Y(t) + 6); }
  g.strokeStyle = 'rgba(255,255,255,.4)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x0, y1); g.lineTo(x0, y0); g.lineTo(x1, y0); g.stroke();
  g.fillStyle = 'rgba(255,255,255,.75)'; g.font = '18px sans-serif';
  if (xLabel) g.fillText(xLabel, x1 - g.measureText(xLabel).width, y0 + 52);
  if (yLabel) g.fillText(yLabel, x0 + 8, y1 - 10);
  return { X, Y, x0, x1, y0, y1 };
}
export function title(g, text, sub = '') {
  g.fillStyle = COL.text; g.font = 'bold 24px sans-serif'; g.fillText(text, 20, 34);
  if (sub) { const x = 34 + g.measureText(text).width; g.font = '17px sans-serif'; g.fillStyle = 'rgba(255,255,255,.6)'; g.fillText(sub, x, 34); }
}
export function line(g, pts, X, Y, col, wdt = 5, dash = null) {
  if (pts.length < 2) return;
  g.strokeStyle = col; g.lineWidth = wdt; g.setLineDash(dash || []); g.lineJoin = 'round'; g.beginPath();
  pts.forEach(([x, y], i) => (i ? g.lineTo(X(x), Y(y)) : g.moveTo(X(x), Y(y))));
  g.stroke(); g.setLineDash([]);
}
export function dot(g, x, y, col, r = 10) { g.fillStyle = col; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 2; g.stroke(); }
export function note(g, text, x, y, col = 'rgba(255,255,255,.8)', font = 17, align = 'left') {
  g.font = `${font}px sans-serif`; g.fillStyle = col;
  const w = g.measureText(text).width;
  g.fillText(text, align === 'right' ? x - w : align === 'center' ? x - w / 2 : x, y);
}
export function legend(g, items, x = 24, y = 50, font = 18) {
  g.font = `bold ${font}px sans-serif`;
  for (const [n, c] of items) { g.fillStyle = c; g.fillRect(x, y, 16, 16); g.fillStyle = COL.text; g.fillText(n, x + 22, y + 15); x += 36 + g.measureText(n).width; }
}
export function dashH(g, X0, X1, y, text = '', col = 'rgba(255,255,255,.5)') {
  g.strokeStyle = col; g.setLineDash([8, 6]); g.lineWidth = 2; g.beginPath(); g.moveTo(X0, y); g.lineTo(X1, y); g.stroke(); g.setLineDash([]);
  if (text) { g.font = '17px sans-serif'; g.fillStyle = col; g.fillText(text, X1 - g.measureText(text).width - 4, y - 8); }
}
export function dashV(g, x, Y0, Y1, text = '', col = 'rgba(255,255,255,.5)') {
  g.strokeStyle = col; g.setLineDash([8, 6]); g.lineWidth = 2; g.beginPath(); g.moveTo(x, Y0); g.lineTo(x, Y1); g.stroke(); g.setLineDash([]);
  if (text) { g.font = '17px sans-serif'; g.fillStyle = col; g.fillText(text, x + 6, Y1 + 18); }
}
// Horizontal bars with labels: rows [{ label, value, color, text? }], values in one unit.
export function bars(g, rows, { x = 20, y = 64, w = 600, rowH = 52, labelW = 230, unit = (v) => v, max = null } = {}) {
  const mx = max ?? Math.max(1e-9, ...rows.map((r) => Math.abs(r.value))) * 1.15, span = w - labelW - 20;
  rows.forEach((r, i) => {
    const yy = y + i * rowH, L = Math.min(span, (Math.abs(r.value) / mx) * span);
    g.font = 'bold 19px sans-serif'; g.fillStyle = r.color; g.fillText(r.label, x, yy + 24);
    g.globalAlpha = 0.85; g.fillRect(x + labelW, yy + 6, Math.max(2, L), rowH - 18); g.globalAlpha = 1;
    g.font = '18px sans-serif'; g.fillStyle = '#fff'; const t = r.text ?? unit(r.value), tw = g.measureText(t).width;
    g.fillText(t, x + labelW + L + 8 + tw > w ? x + labelW + L - tw - 8 : x + labelW + L + 8, yy + 25);
  });
}

// ---------------------------------------------------------------- random numbers
export function rng(seed = 1) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
// A normally distributed number (Box–Muller).
export const gauss = (rnd) => Math.sqrt(-2 * Math.log(Math.max(1e-9, rnd()))) * Math.cos(TAU * rnd());

// ---------------------------------------------------------------- 3D pieces
// Glowing dots, one instanced mesh, each with its own colour.
export function dots(n, r, color = 0xffffff, seg = 8) {
  const mesh = new THREE.InstancedMesh(new THREE.SphereGeometry(r, seg, Math.max(4, seg - 2)), new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }), n);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.frustumCulled = false;
  const o = new THREE.Object3D(), col = new THREE.Color(color);
  for (let i = 0; i < n; i++) mesh.setColorAt(i, col);
  mesh.place = (i, x, y, z, s = 1) => { o.position.set(x, y, z); o.scale.setScalar(Math.max(0.0001, s)); o.updateMatrix(); mesh.setMatrixAt(i, o.matrix); };
  mesh.hide = (i) => mesh.place(i, 0, -99, 0, 0.0001);
  mesh.tint = (i, c) => mesh.setColorAt(i, c);
  mesh.done = () => { mesh.instanceMatrix.needsUpdate = true; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true; };
  return mesh;
}
const UP = new THREE.Vector3(0, 1, 0), tmpV = new THREE.Vector3();
export function flowArrow(color, r = 0.05, head = 0.28) {
  const a = arrow(color, 1, head, r);
  a.traverse((o) => { if (o.material) { o.material.depthTest = false; o.renderOrder = 10; } });
  a.aim = (from, dir, len) => {
    a.position.set(...from);
    tmpV.set(...dir); if (tmpV.lengthSq() < 1e-9) tmpV.set(1, 0, 0);
    a.quaternion.setFromUnitVectors(UP, tmpV.normalize());
    a.set(Math.max(0.001, len));
    if (len < 0.05) a.visible = false;
  };
  return a;
}
// A water-filled glass cylinder standing on y0 (open top), radius r, height h. setLevel(y) fills it.
export function jar(parent, x, z, y0, r, h, waterCol = 0x3b82f6, glassOp = 0.16) {
  const g = new THREE.Group(); g.position.set(x, 0, z); parent.add(g);
  const glass = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 48, 1, true), M.clear(0xe6f6ff, glassOp)); glass.position.y = y0 + h / 2; g.add(glass);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.04, 48), M.clear(0xe6f6ff, 0.3)); base.position.y = y0 + 0.02; g.add(base);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(r, 0.015, 8, 48), M.clear(0xffffff, 0.5)); rim.rotation.x = Math.PI / 2; rim.position.y = y0 + h; g.add(rim);
  const wmat = new THREE.MeshStandardMaterial({ color: waterCol, roughness: 0.1, transparent: true, opacity: 0.35, depthWrite: false });
  const water = new THREE.Mesh(new THREE.CylinderGeometry(r - 0.02, r - 0.02, 1, 48), wmat); g.add(water);
  g.setLevel = (lv) => { const hh = Math.max(0.001, lv - y0 - 0.04); water.scale.y = hh; water.position.y = y0 + 0.04 + hh / 2; water.visible = hh > 0.002; };
  g.setLevel(y0 + h * 0.7);
  g.water = water; g.wmat = wmat;
  return g;
}
export function fitNarrow(stage, minor = []) {
  const narrow = stage.host.clientWidth < 560, r = inReel();
  minor.forEach((l) => { if (l) l.visible = !narrow; });
  const y = r ? (tallReel(stage) ? -0.2 : 0) : narrow ? -0.1 : 0;
  if (!stage.shift || stage.shift[1] !== y) stage.setShift(0, y);
  return narrow;
}
// True while the Glassbox studio records the reel: scenes then choose their own camera views.
export const inReel = () => document.body.classList.contains('gb-reel');
const tallReel = (stage) => inReel() && stage.camera.aspect < 0.75;
// In a tall reel, float the chart board in the empty top part of the frame, sized to the view.
// Returns whether the chart should be shown.
export function reelChart(stage, chart) {
  if (!inReel()) return true;
  if (!tallReel(stage) || !stage.home) return false;
  const { pos, target } = stage.home, asp = stage.camera.aspect;
  const k = Math.min(2.5, Math.max(1, 1.45 / Math.max(0.3, asp)));
  const dist = Math.hypot(pos[0] - target[0], pos[1] - target[1], pos[2] - target[2]) * k;
  const H = 2 * (dist - target[2]) * Math.tan((21 * Math.PI) / 180);
  const { width, height } = chart.mesh.geometry.parameters;
  const sc = Math.min((0.9 * H * asp) / width, (0.3 * H) / height);
  chart.mesh.position.set(target[0], target[1] + 0.2 * H + 0.27 * H, 0);
  chart.mesh.scale.setScalar(sc);
  return true;
}
// Switch between the focus groups of a chapter and fly to that focus's view.
export function focusSwitch(stage, groups, views) {
  let cur = '';
  return (f) => {
    if (f === cur) return false;
    cur = f;
    Object.entries(groups).forEach(([k, g]) => { g.visible = k === f; });
    const v = views[f]; if (v && !inReel()) stage.setView(v.pos, v.target, 1.0);
    return true;
  };
}
export { clamp, lerp, beam, box, sphere };
export const smoothK = (k) => { k = clamp(k, 0, 1); return k * k * (3 - 2 * k); };
// Every chapter frames its model in the lower part of the stage (the readout sits upper left) and
// floats its chart upper right. Scenes span about x −5.5…5.5, y 0…6.3.
export const VIEW = { pos: [0, 4.9, 10.5], target: [0, 4.45, 0] };
// In the recorded reel the model is centred instead, and tall videos float the chart above it.
export const REEL_VIEW = { pos: [0, 3.3, 10.5], target: [0, 2.9, 0] };
export const CHART = { w: 4.4, h: 3.16, px: 440, py: 316 };
export const CHART_POS = [2.95, 7.45, 0];

// A casein micelle for close-ups: a clump of protein blobs with purple calcium phosphate clusters,
// a coat of κ-casein hairs (line segments) and a faint halo for its charge cloud. R = radius.
// g.setCoat(k): 1 = hairs up and charged, 0 = collapsed or cut off.
export function micelle(R = 2.3, seed = 1, nHair = 150) {
  const rnd = rng(seed), g = new THREE.Group(), col = new THREE.Color();
  const blobs = dots(90, R * 0.27, hex(COL.casein), 10), cc = dots(40, R * 0.07, hex(COL.ca), 6);
  for (let i = 0; i < 90; i++) { const r = R * 0.82 * Math.cbrt(rnd()), th = Math.acos(2 * rnd() - 1), ph = rnd() * TAU; blobs.place(i, r * Math.sin(th) * Math.cos(ph), r * Math.cos(th), r * Math.sin(th) * Math.sin(ph), 0.8 + rnd() * 0.4); blobs.tint(i, col.set(COL.casein).multiplyScalar(0.82 + rnd() * 0.18)); }
  for (let i = 0; i < 40; i++) { const r = R * 0.95 * Math.cbrt(rnd()), th = Math.acos(2 * rnd() - 1), ph = rnd() * TAU; cc.place(i, r * Math.sin(th) * Math.cos(ph), r * Math.cos(th), r * Math.sin(th) * Math.sin(ph)); }
  blobs.done(); cc.done(); g.add(blobs, cc);
  const dir = [];
  for (let i = 0; i < nHair; i++) { const th = Math.acos(2 * rnd() - 1), ph = rnd() * TAU; dir.push([Math.sin(th) * Math.cos(ph), Math.cos(th), Math.sin(th) * Math.sin(ph)]); }
  const hg = new THREE.BufferGeometry(), arr = new Float32Array(nHair * 6); hg.setAttribute('position', new THREE.BufferAttribute(arr, 3));
  const hmat = new THREE.LineBasicMaterial({ color: 0x8fd0ff, transparent: true, opacity: 0.9 });
  const hairs = new THREE.LineSegments(hg, hmat); hairs.frustumCulled = false; g.add(hairs);
  const halo = new THREE.Mesh(new THREE.SphereGeometry(R * 1.35, 32, 20), M.ghost(0x6fb6ff, 0.07)); g.add(halo);
  // k: coat length 0–1; fly: 0–1 sends the hairs drifting away (rennet has cut them off)
  g.setCoat = (k, fly = 0) => {
    const L = R * 0.33 * Math.max(0.02, k);
    dir.forEach((d, i) => { const a = R * 0.95 + fly * R * (0.8 + (i % 7) * 0.22), b = a + (fly > 0 ? R * 0.25 : L); for (let j = 0; j < 3; j++) { arr[i * 6 + j] = d[j] * a; arr[i * 6 + 3 + j] = d[j] * b; } });
    hg.attributes.position.needsUpdate = true; hmat.opacity = 0.9 * (1 - fly * 0.75);
    halo.scale.setScalar(Math.max(0.74, 0.74 + 0.26 * k * (1 - fly))); halo.material.opacity = 0.07 * k * (1 - fly);
  };
  g.setCoat(1); g.R = R; g.halo = halo;
  return g;
}
// A see-through tank of milk serum for the microscope views.
export function tank(g, bx, y0, y1, bz, color = 0x6fb6ff) {
  const b = new THREE.Mesh(new THREE.BoxGeometry(bx * 2, y1 - y0, bz * 2), M.clear(color, 0.07)); b.position.y = (y0 + y1) / 2; g.add(b);
  const e = new THREE.LineSegments(new THREE.EdgesGeometry(b.geometry), new THREE.LineBasicMaterial({ color: 0x6f86a3, transparent: true, opacity: 0.6 })); e.position.copy(b.position); g.add(e);
  return b;
}
