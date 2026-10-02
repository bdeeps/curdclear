// Chapter 5: whey, sourness and what goes wrong. A glass bowl of dahi (1 unit ≈ 2 cm) beside a
// "microscope" window on its protein network. Each fault is a batch run with runBatch() in curd.js
// under different conditions; nothing here is hand-drawn except how the whey index (0–1,
// illustrative) is turned into a puddle. Causes of whey separation follow Lucey (2004): too much
// acid, setting hot and fast, a low starter rate, and moving the pot while the gel is forming.
// Whey is the water of milk with its lactose, minerals and whey proteins; its green-yellow tint
// is riboflavin (vitamin B2).
import { THREE, M } from '../kit.js';
import { VIEW, REEL_VIEW, CHART, CHART_POS, COL, GEL, hex, board, panelBg, axes, title, line, dot, note, dashH, dots, rng, fitNarrow, reelChart, clamp, lerp, smoothK, runBatch, rowAt, timeTo, verdict, wheyIndex, fmtH, TAU } from '../curd.js';

const HOURS = 24;
export const FAULTS = {
  right: { label: 'Just right', p: { T0: 42, room: 25, wrap: 'wrap', inoc: 1, boiled: true }, hours: 8, fridge: true, why: 'Lukewarm milk, a spoon of fresh jaman, a warm corner, left alone, then into the fridge once set.', fix: '' },
  long: { label: 'Left too long', p: { T0: 42, room: 36, wrap: 'bare', inoc: 1, boiled: true }, hours: 20, fridge: false, why: 'The bacteria never stopped. They kept making acid, the network tightened and squeezed whey out.', fix: 'Move it to the fridge as soon as it sets. In summer, use less jaman.' },
  hot: { label: 'Milk too hot', p: { T0: 66, room: 25, wrap: 'wrap', inoc: 1, boiled: true }, hours: 10, fridge: false, why: 'The jaman went into milk hot enough to kill it. No bacteria, no acid, no curd.', fix: 'Let the milk cool until a clean finger can stay in it comfortably, about 40 °C.' },
  cold: { label: 'Too cold', p: { T0: 38, room: 9, wrap: 'bare', inoc: 1, boiled: true }, hours: 12, fridge: false, why: 'The pot cooled to the kitchen\'s temperature and the bacteria almost stopped growing.', fix: 'Start a little warmer and wrap the pot, or keep it in a casserole or the oven with the light on.' },
  shaken: { label: 'Shaken', p: { T0: 42, room: 25, wrap: 'wrap', inoc: 1, boiled: true, shake: true }, hours: 8, fridge: true, why: 'Moving the pot while the gel was forming tore the young network. Broken gel cannot hold its water.', fix: 'Set it where nobody needs to move it, and do not stir to check.' },
  raw: { label: 'Not boiled', p: { T0: 42, room: 25, wrap: 'wrap', inoc: 1, boiled: false }, hours: 8, fridge: true, why: 'Without heating, the whey proteins never joined the network. The gel is weak and leaks, and other microbes in raw milk can spoil the taste.', fix: 'Boil the milk first, then cool it. India\'s food standard (FSSAI) requires the milk for dahi to be heat-treated.' },
};
const batch = (s) => {
  const f = FAULTS[s.fault], base = runBatch({ ...f.p, hours: HOURS });
  if (!s.fridge) return base;
  const t = timeTo(base, 4.6); return t === Infinity ? base : runBatch({ ...f.p, hours: HOURS, fridgeAt: t });
};
// The table verdict, corrected for a weak or leaking gel.
const say = (v, wi, G, boiled) => (v.k === 'set' || v.k === 'soft' ? (!boiled && G > 0 ? { n: 'Set, but weak and leaking whey', col: COL.sugar } : wi >= 0.3 ? { n: 'Set, but torn and watery', col: COL.sugar } : v) : v);
const wheyWords = (w) => (w < 0.05 ? 'none' : w < 0.3 ? 'a little' : w < 0.6 ? 'a puddle' : 'a lot');

export default {
  id: 'whey',
  short: 'Whey and sourness',
  title: 'Watery, sour, or not set at all',
  subtitle: 'The greenish water on top is whey squeezed out of the protein network. Every failed pot has a cause you can see.',
  view: VIEW,
  learn: `<p>Scoop a spoon out of a bowl of dahi and, an hour later, the hollow holds a little greenish water. That is <b>whey</b>: the water of the milk, with its lactose, minerals and whey proteins. It was inside the curd all along, held in the pores of the casein network.</p>
    <p>A gel is not frozen. Its strands keep pulling on each other, and over time the network tightens and squeezes liquid out. Scientists call this <b>syneresis</b>. A little whey is normal. A lot of it means the network is too coarse, too tight or torn.</p>
    <p>Three things make it worse. <b>Too much acid</b>: left warm, the bacteria carry on to pH 4 and the network shrinks. <b>Too hot and fast</b>: curd set above about 45 °C forms coarse, with big pores. And <b>shaking</b> the pot while it sets tears the young gel.</p>
    <p><b>Sourness</b> is simply more lactic acid. Mild dahi is about 0.6–0.8% acid. Left out in summer it passes 1%. Cold stops this: in a fridge at about 5 °C the bacteria hardly grow.</p>
    <p>And if the milk stays liquid? Either the jaman was killed by hot milk, or the pot was too cold for the bacteria to work, or the jaman was old and weak. Sour, over-set dahi is not wasted: it is what kadhi, dosa batter and <b>chaas</b> are made with.</p>
    <p class="tip"><b>Try it:</b> pick each fault and compare its pH curve with the dashed "just right" curve. On <b>Left too long</b>, switch on the fridge and watch the souring stop.</p>`,
  terms: [
    { t: 'Whey', d: 'The watery part of milk left when casein forms a curd. It holds lactose, minerals and whey proteins.' },
    { t: 'Syneresis', d: 'A gel shrinking and squeezing out liquid. In curd it shows as whey on top.' },
    { t: 'Sourness', d: 'The taste of acid. More lactic acid, and a lower pH, means more sour.' },
    { t: 'Riboflavin', d: 'Vitamin B2. It dissolves in the whey and gives it a green-yellow tint.' },
    { t: 'Refrigeration', d: 'Keeping food at about 5 °C. Lactic acid bacteria almost stop growing, so curd stays mild for days.' },
    { t: 'Over-set', d: 'Curd left warm after it has set, so it turns sour and watery.' },
  ],
  defaults: { fault: 'right', hours: 8, fridge: true },
  controls: [
    { key: 'fault', type: 'seg', label: 'What happened', options: Object.entries(FAULTS).map(([v, f]) => ({ v, label: f.label })) },
    { key: 'hours', type: 'range', label: 'Hours since the jaman went in', min: 0, max: HOURS, step: 0.1, ends: ['0', '24 h'], fmt: (v) => fmtH(v) },
    { key: 'fridge', type: 'toggle', label: 'Into the fridge once it sets', hint: 'At about 5 °C the bacteria nearly stop, so the acid stops rising.' },
  ],
  onChange(s, key) { if (key === 'fault') { s.hours = FAULTS[s.fault].hours; s.fridge = FAULTS[s.fault].fridge; } },
  quiz: [
    { q: 'What is the greenish water that collects on curd?', options: ['Melted fat', 'Whey: the water of milk, squeezed out of the protein network', 'Water from the air', 'Spoiled milk'], answer: 1, why: 'Whey was in the curd all along. The casein network shrinks a little over time and pushes some of it out.' },
    { q: 'Why does curd left out on a summer day turn very sour?', options: ['The bacteria keep making lactic acid in the warmth', 'Heat turns fat into acid', 'It absorbs sourness from the air', 'The whey evaporates'], answer: 0, why: 'Warm bacteria keep fermenting lactose until the pH is near 4. In the fridge they almost stop.' },
    { q: 'You checked on the dahi every hour by shaking the pot. It came out watery. Why?', options: ['Shaking cooled it', 'Shaking tore the gel while it was forming, so it could not hold its water', 'Shaking killed the bacteria', 'Shaking added air'], answer: 1, why: 'A young casein network is fragile. Once torn, it cannot rebuild evenly, and whey leaks out.' },
  ],
  reel: [
    { ms: 5600, caption: 'Leave curd in the warmth and the bacteria keep going. It turns sour, and the tightening network squeezes out whey.', set: { fault: 'long', fridge: false }, anim: { hours: [5, 22] }, view: REEL_VIEW, spin: 0.15 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root);
    const world = new THREE.Group(); world.scale.setScalar(0.82); world.position.set(0, 0.45, 0); root.add(world);
    const rnd = rng(9), col = new THREE.Color();
    const counter = new THREE.Mesh(new THREE.BoxGeometry(12.6, 0.3, 4.6), M.matte(0x3a2f28)); counter.position.y = 0.15; world.add(counter);
    // the bowl
    const BX = -2.7, R = 2.2, H = 1.9, Y = 0.3;
    const glass = new THREE.Mesh(new THREE.CylinderGeometry(R, R * 0.86, H, 56, 1, true), M.clear(0xe6f6ff, 0.2)); glass.position.set(BX, Y + H / 2, 0); world.add(glass);
    const gbase = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.86, R * 0.86, 0.06, 56), M.clear(0xe6f6ff, 0.3)); gbase.position.set(BX, Y + 0.03, 0); world.add(gbase);
    const grim = new THREE.Mesh(new THREE.TorusGeometry(R, 0.035, 8, 56), M.clear(0xffffff, 0.6)); grim.rotation.x = Math.PI / 2; grim.position.set(BX, Y + H, 0); world.add(grim);
    const FILL = 1.45;
    const curdMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.75 });
    const curd = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.955, R * 0.84, FILL, 56), curdMat); world.add(curd);
    const wheyMat = new THREE.MeshStandardMaterial({ color: hex(COL.whey), roughness: 0.1, transparent: true, opacity: 0.5, depthWrite: false });
    const whey = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.965, R * 0.85, 1, 56), wheyMat); world.add(whey);
    const dent = new THREE.Mesh(new THREE.SphereGeometry(0.62, 24, 14), wheyMat); dent.scale.set(1.25, 0.32, 1); world.add(dent);
    const dentRim = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.05, 8, 28), new THREE.MeshStandardMaterial({ color: 0xe9e6dc, roughness: 0.8 })); dentRim.rotation.x = Math.PI / 2; dentRim.scale.set(1.25, 1, 1); world.add(dentRim);
    const spoon = new THREE.Group(); spoon.position.set(BX + 3.0, Y + 0.08, 1.4); spoon.rotation.y = -0.4; world.add(spoon);
    const handle = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.05, 0.14), M.metal(0xd8dce3)); handle.position.x = 0.95; spoon.add(handle);
    const sb = new THREE.Mesh(new THREE.SphereGeometry(0.32, 20, 12, 0, TAU, Math.PI / 2, Math.PI / 2), M.metal(0xd8dce3, { side: THREE.DoubleSide })); sb.scale.set(1.25, 0.5, 1); sb.position.y = 0.15; spoon.add(sb);
    // the microscope window: a round patch of the network
    const WX = 3.3, WY = 2.85, WR = 2.25;
    const win = new THREE.Mesh(new THREE.CircleGeometry(WR, 56), M.ghost(0x6fb6ff, 0.1)); win.position.set(WX, WY, -0.3); world.add(win);
    const wring = new THREE.Mesh(new THREE.TorusGeometry(WR, 0.06, 8, 64), M.matte(0x8c95a3)); wring.position.set(WX, WY, -0.3); world.add(wring);
    const NM = 110, balls = dots(NM, 0.13, 0xffffff, 8); world.add(balls);
    const centres = Array.from({ length: 7 }, (_, i) => { const a = (i / 7) * TAU + 0.4, r = i === 0 ? 0 : WR * 0.62; return [r * Math.cos(a), r * Math.sin(a)]; });
    const mp = Array.from({ length: NM }, (_, i) => {
      const r = WR * 0.94 * Math.sqrt((i + 0.5) / NM), a = i * 2.39996;                  // even (sunflower) spread = a fine network
      const c = centres[i % 7], rr = 0.42 * Math.sqrt(rnd()), aa = rnd() * TAU;       // clumps = a coarse network
      return { fx: r * Math.cos(a), fy: r * Math.sin(a), cx: c[0] + rr * Math.cos(aa), cy: c[1] + rr * Math.sin(aa), lx: (rnd() - 0.5) * 2 * WR * 0.66, ly: (rnd() - 0.5) * 2 * WR * 0.66, a: rnd() * TAU, b: rnd() * TAU };
    });
    const NWH = 70, wd = dots(NWH, 0.06, hex(COL.whey), 6); world.add(wd);
    const wq = Array.from({ length: NWH }, () => ({ x: (rnd() - 0.5) * 2 * WR * 0.68, y: (rnd() - 0.5) * 2 * WR * 0.68, a: rnd() * TAU, t: rnd() }));
    const lWin = stage.label('', [WX, WY - WR - 0.4, 0], world);
    const lBowl = stage.label('', [BX, Y + H + 0.85, 0], world, 'hot');
    const lWhey = stage.label('', [BX + 1.0, Y - 0.1, 2.3], world, 'hot'); lWhey.element.style.setProperty('--c', COL.whey);

    let S = { ...this.defaults }, key = '', setK = 0, wK = 0, coarse = 0;
    const chart = board(root, CHART.w, CHART.h, CHART.px, CHART.py, (g, w, h) => {
      panelBg(g, w, h);
      const rows = batch(S), ref = runBatch({ ...FAULTS.right.p, hours: HOURS, fridgeAt: timeTo(runBatch({ ...FAULTS.right.p, hours: HOURS }), 4.6) }), r = rowAt(rows, S.hours);
      title(g, 'pH of the pot', '');
      const { X, Y, x0, x1 } = axes(g, w, h, { x0: 54, x1: w - 20, y1: 60, y0: h - 44, xMin: 0, xMax: HOURS, yMin: 3.6, yMax: 7, xTicks: [0, 6, 12, 18, 24], yTicks: [4, 5, 6, 7], xFmt: (v) => v + ' h', yFmt: String });
      g.fillStyle = 'rgba(92,225,169,.16)'; g.fillRect(x0, Y(4.75), x1 - x0, Y(4.35) - Y(4.75)); note(g, 'mild and set', x1 - 6, Y(4.47), COL.good, 15, 'right');
      g.fillStyle = 'rgba(255,107,107,.13)'; g.fillRect(x0, Y(4.1), x1 - x0, Y(3.6) - Y(4.1)); note(g, 'sour', x1 - 6, Y(3.75), COL.bad, 15, 'right');
      line(g, ref.filter((_, i) => i % 6 === 0).map((q) => [q.t, q.ph]), X, Y, 'rgba(255,255,255,.45)', 3, [7, 6]);
      line(g, rows.filter((_, i) => i % 6 === 0).map((q) => [q.t, q.ph]), X, Y, '#fff', 4);
      dot(g, X(r.t), Y(r.ph), '#fff', 8);
    }, CHART_POS);

    return {
      update(dt, s, time) {
        dt = Math.max(0, Math.min(dt, 0.05)); S = s;
        const narrow = fitNarrow(stage, [lWin]);
        chart.mesh.visible = !narrow && reelChart(stage, chart);
        const f = FAULTS[s.fault], rows = batch(s), r = rowAt(rows, s.hours), v = verdict(r, f.p.boiled);
        const gp = f.p.boiled ? GEL.boiled.ph : GEL.raw.ph, weak = (f.p.boiled ? 0 : 0.3);
        const wi = clamp(wheyIndex(r, { Tset: f.p.T0, shake: !!f.p.shake }) + (r.G > 0 ? weak : 0), 0, 1);
        setK += (clamp((gp - r.ph) / 0.5, 0, 1) - setK) * (1 - Math.exp(-dt * 5));
        wK += (wi - wK) * (1 - Math.exp(-dt * 4)); coarse += (clamp(wi * 1.2, 0, 1) - coarse) * (1 - Math.exp(-dt * 3));
        // the curd shrinks a little in its bowl and whey fills the gap and floats on top
        const sh = 1 - 0.07 * wK, ch = FILL * (1 - 0.1 * wK);
        curd.scale.set(sh, 1 - 0.1 * wK, sh); curd.position.set(BX, Y + 0.06 + ch / 2, 0);
        curdMat.color.set(0xf3efe2).lerp(col.set(0xffffff), setK); curdMat.roughness = 0.3 + 0.5 * setK;
        const wtop = FILL + 0.02 + 0.1 * wK; whey.visible = wK > 0.03; whey.scale.y = wtop; whey.position.set(BX, Y + 0.06 + wtop / 2, 0); wheyMat.opacity = 0.2 + 0.4 * wK;
        const dv = setK > 0.5 && s.hours > 0.5; dent.visible = dv && wK > 0.03; dentRim.visible = dv;
        dent.position.set(BX + 0.8, Y + 0.06 + ch - 0.02, 0.5); dent.scale.set(1.25 * (0.5 + 0.5 * wK), 0.32, 0.5 + 0.5 * wK); dentRim.position.set(BX + 0.8, Y + 0.07 + ch, 0.5);
        // the network under the microscope
        mp.forEach((q, i) => {
          const j = (1 - setK) * 0.35 + 0.015;
          const gx = lerp(q.fx, q.cx, smoothK(coarse)), gy = lerp(q.fy, q.cy, smoothK(coarse));
          const x = lerp(q.lx, gx, smoothK(setK)) + j * Math.sin(time * 1.4 + q.a), y = lerp(q.ly, gy, smoothK(setK)) + j * Math.sin(time * 1.1 + q.b);
          balls.place(i, WX + x, WY + y, -0.1);
        });
        wq.forEach((q, i) => {
          if (i > 12 + (NWH - 12) * clamp(wK * 1.4, 0, 1)) { wd.hide(i); return; }
          q.t = (q.t + dt * 0.25 * wK) % 1; const y = q.y + (wK > 0.2 ? q.t * 1.2 : 0) + 0.06 * Math.sin(time * 2 + q.a), x = q.x + 0.06 * Math.sin(time * 1.7 + q.a);
          if (Math.hypot(x, y) > WR * 0.92) wd.hide(i); else wd.place(i, WX + x, WY + y, 0);
        });
        balls.done(); wd.done();
        lWin.element.innerHTML = setK < 0.5 ? 'no network: micelles still drift free' : coarse > 0.45 ? 'coarse network, big pores: <b>whey escapes</b>' : 'fine, even network: <b>holds its whey</b>';
        const vv = say(v, wi, r.G, f.p.boiled); lBowl.element.style.setProperty('--c', vv.col); lBowl.element.innerHTML = `<b>${vv.n}</b>`;
        lWhey.visible = wK > 0.08; lWhey.element.innerHTML = 'whey';
        const k2 = [s.fault, s.hours, s.fridge].join('|'); if (k2 !== key) { key = k2; chart.redraw(); }
      },
      readout: (s) => {
        const f = FAULTS[s.fault], rows = batch(s), r = rowAt(rows, s.hours), v = verdict(r, f.p.boiled);
        const wi = clamp(wheyIndex(r, { Tset: f.p.T0, shake: !!f.p.shake }) + (r.G > 0 && !f.p.boiled ? 0.3 : 0), 0, 1);
        const vv = say(v, wi, r.G, f.p.boiled);
        return `<div class="big" style="color:${vv.col}">${vv.n}</div>
          <div class="row"><span>pH · acidity as lactic acid</span><b>${r.ph.toFixed(2)} · ${r.ta.toFixed(2)}%</b></div>
          <div class="row"><span>Milk temperature now</span><b style="color:${COL.temp}">${r.T.toFixed(0)} °C</b></div>
          <div class="row"><span>Firmness</span><b style="color:${COL.good}">${r.G < 1 ? 'liquid' : Math.round(r.G) + ' Pa'}</b></div>
          <div class="row"><span>Whey on top</span><b style="color:${COL.whey}">${wheyWords(wi)}</b></div>
          <small>${f.why}${f.fix ? ' <b>Fix:</b> ' + f.fix : ''}</small>`;
      },
    };
  },
};
