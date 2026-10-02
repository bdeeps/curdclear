// Chapter 4: set your own dahi. A steel patila of boiled, cooled milk on the counter (1 unit ≈ 3 cm),
// a spoon of jaman, a thermometer, a clock, and a blanket if you want one.
// The batch is computed by runBatch() in curd.js: the pot cools towards the kitchen temperature
// (Newton's law; time constants are estimates for about a litre: bare 1.4 h, wrapped 6 h), the two
// teams of bacteria grow by the cardinal temperature model, acid follows Luedeking–Piret, pH follows
// a typical titration curve, and the curd sets when the pH passes the gel point (5.3 for boiled
// milk) and firms towards pH 4.6. 1% jaman is one teaspoon (5 g) in half a litre.
// Tilt test: a liquid surface stays level when the pot tips; a set curd tips with the pot.
import { THREE, M } from '../kit.js';
import { VIEW, REEL_VIEW, CHART, CHART_POS, COL, WRAPS, GEL, hex, board, panelBg, axes, title, line, dot, note, dashH, rng, fitNarrow, reelChart, clamp, lerp, smoothK, runBatch, rowAt, timeTo, verdict, wheyIndex, fmtN, fmtH, TA_MILK } from '../curd.js';

const HOURS = 24;
const batch = (s) => runBatch({ T0: s.T0, room: s.room, wrap: s.wrap, inoc: s.inoc, boiled: s.boiled, hours: HOURS });
const roomName = (v) => (v <= 12 ? 'a north Indian winter night' : v <= 20 ? 'a cool day' : v <= 30 ? 'a mild day' : 'a hot summer day');
const feel = (v) => (v < 30 ? 'cool to the finger' : v < 37 ? 'barely warm' : v <= 45 ? 'lukewarm: right' : v <= 52 ? 'hot: risky' : 'too hot: kills the jaman');

export default {
  id: 'set',
  short: 'Set your own dahi',
  title: 'Warmth and time',
  subtitle: 'Lukewarm milk, a spoon of jaman and a warm spot. Change any of them and the same pot sets in five hours, or not at all.',
  view: VIEW,
  learn: `<p>The home recipe is short. <b>Boil</b> the milk. Let it cool until it is just warm to a clean finger, about 40 °C. Stir in a spoon of <b>jaman</b>. Cover it, leave it somewhere warm, and <b>do not disturb it</b>.</p>
    <p>Each step has a reason. Boiling kills other microbes that would compete with the jaman, and makes the curd firmer (see the last chapter). Cooling is for the bacteria: above about 50 °C they start to die. And <b>warmth</b> sets the pace. At 40–43 °C the pot can set in about five hours. At 25 °C it takes all night.</p>
    <p>A pot does not stay warm by itself. On a winter night in Delhi or Lucknow the milk cools to room temperature within a couple of hours and the bacteria almost stop. That is why homes <b>wrap the pot</b> in a blanket, tuck it into a casserole or an atta bin, or leave it in the oven with the light on. In summer the trouble is the opposite: the curd sets fast, then keeps souring unless it goes into the fridge.</p>
    <p>More jaman gives the bacteria a head start, so the curd sets sooner. Too much makes it sour and watery. A dairy does the same job with more control: pasteurised milk, a measured culture, warm rooms held at a set temperature, then quick chilling.</p>
    <p class="tip"><b>Try it:</b> set the kitchen to 10 °C with a bare pot and slide the hours: it never sets. Now wrap it. Then try jaman at 65 °C, and try a hot summer kitchen left for 24 hours. Tick <b>Tilt the pot</b> to test whether it has set.</p>`,
  terms: [
    { t: 'Incubation', d: 'Keeping the inoculated milk warm and still while the bacteria work.' },
    { t: 'Inoculation', d: 'Adding the starter. One teaspoon of jaman in half a litre of milk is about 1%.' },
    { t: 'Lukewarm', d: 'About 37–43 °C, warm but comfortable on a clean finger. The range dahi bacteria like best.' },
    { t: 'Pasteurisation', d: 'Heating milk enough to kill disease-causing microbes, for example 72 °C for 15 seconds.' },
    { t: 'Titratable acidity', d: 'How much acid a food holds, measured in a lab and counted as lactic acid. Set dahi is about 0.6–0.8%.' },
    { t: 'Newton\'s law of cooling', d: 'A warm object cools faster the bigger the gap between it and its surroundings.' },
  ],
  defaults: { hours: 0, T0: 42, room: 25, wrap: 'wrap', inoc: 1, boiled: true, tilt: false },
  controls: [
    { key: 'hours', type: 'range', label: 'Hours since the jaman went in', min: 0, max: HOURS, step: 0.1, ends: ['0', '24 h'], fmt: (v) => fmtH(v) },
    { key: 'T0', type: 'range', label: 'Milk temperature when the jaman goes in', min: 15, max: 75, step: 1, ends: ['15 °C', '75 °C'], fmt: (v) => `${v} °C · ${feel(v)}` },
    { key: 'room', type: 'range', label: 'Kitchen temperature', min: 5, max: 42, step: 1, ends: ['5 °C', '42 °C'], fmt: (v) => `${v} °C · ${roomName(v)}` },
    { key: 'wrap', type: 'seg', label: 'The pot is', options: [{ v: 'bare', label: 'Bare' }, { v: 'wrap', label: 'Wrapped' }, { v: 'hold', label: 'Held warm' }], fmt: (v) => WRAPS[v].n },
    { key: 'inoc', type: 'range', label: 'Jaman', min: 0.2, max: 5, step: 0.1, ends: ['a pinch', 'a ladle'], fmt: (v) => `${v.toFixed(1)}% · ${(v * 1).toFixed(1)} tsp in ½ litre` },
    { key: 'boiled', type: 'toggle', label: 'Milk was boiled first' },
    { key: 'tilt', type: 'toggle', label: 'Tilt the pot', hint: 'Liquid milk stays level. Set curd tips with the pot.' },
  ],
  quiz: [
    { q: 'Why do many Indian homes wrap the dahi pot in a blanket in winter?', options: ['To keep light out', 'To keep the milk warm so the bacteria keep working', 'To stop it smelling', 'To add flavour'], answer: 1, why: 'A bare pot cools to room temperature in a couple of hours. Below about 20 °C the bacteria grow very slowly, so the curd does not set.' },
    { q: 'Why must boiled milk cool before the jaman goes in?', options: ['Hot milk has no lactose', 'Heat above about 50 °C kills the bacteria in the jaman', 'Hot milk is too thin', 'The spoon would melt'], answer: 1, why: 'Dahi bacteria grow best around 30–43 °C and die quickly above about 55 °C.' },
    { q: 'In a hot summer kitchen, the curd set by morning but tastes very sour by evening. Why?', options: ['The bacteria kept making acid after it set', 'The milk ran out of water', 'The fat went bad', 'It absorbed heat'], answer: 0, why: 'Setting does not stop the bacteria. Kept warm, they go on making lactic acid until the pH falls near 4. A fridge slows them almost to a stop.' },
  ],
  reel: [
    { ms: 6000, caption: 'Warm milk at about 40 °C sets in five to seven hours. The pH falls from 6.7 to 4.6 and the pot turns solid.', set: { T0: 42, room: 25, wrap: 'wrap', inoc: 1, boiled: true, tilt: false }, anim: { hours: [0, 8] }, view: REEL_VIEW, spin: 0.15 },
    { ms: 5200, caption: 'On a cold night a bare pot cools and the bacteria stall. That is why the pot gets a blanket.', set: { T0: 42, room: 10, wrap: 'bare', inoc: 1, boiled: true, hours: 10 }, anim: { tilt: [false, true] }, view: REEL_VIEW, spin: 0.15 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root);
    const col = new THREE.Color(), rnd = rng(3);
    const world = new THREE.Group(); world.scale.setScalar(0.9); world.position.set(0.5, 0.45, 0); root.add(world);
    const counter = new THREE.Mesh(new THREE.BoxGeometry(11.4, 0.3, 4.6), M.matte(0x3a2f28)); counter.position.y = 0.15; counter.receiveShadow = true; world.add(counter);
    // the pot (patila): open steel cylinder with a rolled rim, pivoting about its base edge when tilted
    const PX = -1.5, R = 1.75, H = 2.3, Y = 0.3;
    const piv = new THREE.Group(); piv.position.set(PX + R, Y, 0); world.add(piv);
    const pot = new THREE.Group(); pot.position.set(-R, 0, 0); piv.add(pot);
    const steel = M.metal(0xc9ced6, { side: THREE.DoubleSide, roughness: 0.3 });
    const wall = new THREE.Mesh(new THREE.CylinderGeometry(R, R, H, 56, 1, true), steel); wall.position.y = H / 2; wall.castShadow = true; pot.add(wall);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 0.06, 56), steel); base.position.y = 0.03; pot.add(base);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(R + 0.04, 0.07, 10, 56), M.metal(0xdfe3ea)); rim.rotation.x = Math.PI / 2; rim.position.y = H; pot.add(rim);
    // milk: a short cylinder whose top can stay level (liquid) or tip with the pot (set)
    const MH = 1.7;
    const milkPiv = new THREE.Group(); milkPiv.position.set(0, 0.06 + MH, 0); pot.add(milkPiv);
    const milkMat = new THREE.MeshStandardMaterial({ color: 0xf6f3ea, roughness: 0.35 });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(R - 0.05, R - 0.05, MH, 56), milkMat); body.position.y = 0.06 + MH / 2; pot.add(body);
    const top = new THREE.Mesh(new THREE.CylinderGeometry(R - 0.06, R - 0.06, 0.05, 56), milkMat); milkPiv.add(top);
    const wheyMat = new THREE.MeshStandardMaterial({ color: hex(COL.whey), roughness: 0.1, transparent: true, opacity: 0.55, depthWrite: false });
    const whey = new THREE.Mesh(new THREE.CylinderGeometry(R - 0.07, R - 0.07, 1, 56), wheyMat); milkPiv.add(whey);
    // blanket and warm box
    const blanket = new THREE.Mesh(new THREE.CylinderGeometry(R + 0.32, R + 0.42, H * 0.86, 40, 1, true), new THREE.MeshStandardMaterial({ color: 0xb5524a, roughness: 0.95, side: THREE.DoubleSide })); blanket.position.y = H * 0.43; pot.add(blanket);
    const fold = new THREE.Mesh(new THREE.TorusGeometry(R + 0.36, 0.16, 10, 40), new THREE.MeshStandardMaterial({ color: 0xc8675e, roughness: 0.95 })); fold.rotation.x = Math.PI / 2; fold.position.y = H * 0.84; pot.add(fold);
    const oven = new THREE.Mesh(new THREE.BoxGeometry(5.2, 3.7, 4.4), M.clear(0xffb547, 0.07)); oven.position.set(PX, Y + 1.85, 0); world.add(oven);
    const ovenE = new THREE.LineSegments(new THREE.EdgesGeometry(oven.geometry), new THREE.LineBasicMaterial({ color: 0xffb547, transparent: true, opacity: 0.7 })); ovenE.position.copy(oven.position); world.add(ovenE);
    // spoon of jaman resting beside the pot
    const spoon = new THREE.Group(); spoon.position.set(PX + 3.0, Y + 0.08, 1.2); spoon.rotation.y = 0.5; world.add(spoon);
    const handle = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.05, 0.14), M.metal(0xd8dce3)); handle.position.x = 0.9; spoon.add(handle);
    const bowl = new THREE.Mesh(new THREE.SphereGeometry(0.3, 20, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), M.metal(0xd8dce3, { side: THREE.DoubleSide })); bowl.scale.set(1.25, 0.5, 1); bowl.position.y = 0.14; spoon.add(bowl);
    const dollop = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 10), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 })); dollop.scale.set(1.2, 0.6, 1); dollop.position.y = 0.2; spoon.add(dollop);
    // thermometer standing in the pot
    const th = new THREE.Group(); th.position.set(PX + 0.9, Y + 0.5, -0.5); th.rotation.z = -0.16; world.add(th);
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 3.4, 12), M.clear(0xffffff, 0.35)); tube.position.y = 1.7; th.add(tube);
    const merc = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1, 10), M.glow(0xff5a4e)); th.add(merc);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 10), M.glow(0xff5a4e)); th.add(bulb);
    // wall clock
    const clock = new THREE.Group(); clock.position.set(-4.4, 4.3, -1.6); world.add(clock);
    const face = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.95, 0.1, 40), M.matte(0xf2efe6)); face.rotation.x = Math.PI / 2; clock.add(face);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.07, 10, 40), M.matte(0x30343c)); clock.add(ring);
    for (let i = 0; i < 12; i++) { const t = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.16, 0.02), M.matte(0x30343c)); const a = (i / 12) * Math.PI * 2; t.position.set(0.78 * Math.sin(a), 0.78 * Math.cos(a), 0.07); t.rotation.z = -a; clock.add(t); }
    const hHand = new THREE.Group(), mHand = new THREE.Group(); hHand.position.z = mHand.position.z = 0.08; clock.add(hHand, mHand);
    const hh = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.5, 0.02), M.matte(0x16181d)); hh.position.y = 0.22; hHand.add(hh);
    const mh = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.74, 0.02), M.matte(0xd04a3c)); mh.position.y = 0.34; mHand.add(mh);
    const lT = stage.label('', [PX + 1.2, Y + 4.25, -0.5], world, 'hot'); lT.element.style.setProperty('--c', COL.temp);
    const lPot = stage.label('', [PX, Y - 0.05, 2.4], world, 'hot');
    const lClock = stage.label('', [-4.4, 3.05, -1.6], world);
    const lWrap = stage.label('', [PX + 3.3, Y + 1.5, 0], world);

    let S = { ...this.defaults }, key = '', tiltK = 0, setK = 0;
    const chart = board(root, CHART.w, CHART.h, CHART.px, CHART.py, (g, w, h) => {
      panelBg(g, w, h);
      const rows = batch(S), r = rowAt(rows, S.hours), gp = S.boiled ? GEL.boiled.ph : GEL.raw.ph;
      title(g, 'pH and temperature', '');
      const { X, Y, x0, x1, y0, y1 } = axes(g, w, h, { x0: 54, x1: w - 52, y1: 78, y0: h - 44, xMin: 0, xMax: HOURS, yMin: 3.6, yMax: 7, xTicks: [0, 6, 12, 18, 24], yTicks: [4, 5, 6, 7], xFmt: (v) => v + ' h', yFmt: String });
      g.fillStyle = 'rgba(92,225,169,.16)'; g.fillRect(x0, Y(4.75), x1 - x0, Y(4.35) - Y(4.75));
      note(g, 'set', x0 + 6, Y(4.47), COL.good, 15);
      dashH(g, x0, x1, Y(gp), '', 'rgba(255,255,255,.4)'); note(g, 'gel starts', x0 + 6, Y(gp) - 5, 'rgba(255,255,255,.6)', 14);
      const TY = (T) => y0 - (T / 80) * (y0 - y1);
      line(g, rows.filter((_, i) => i % 6 === 0).map((q) => [q.t, q.ph]), X, Y, '#fff', 4);
      g.strokeStyle = COL.temp; g.lineWidth = 3; g.beginPath(); rows.forEach((q, i) => { if (i % 6) return; i ? g.lineTo(X(q.t), TY(q.T)) : g.moveTo(X(q.t), TY(q.T)); }); g.stroke();
      [20, 40, 60].forEach((T) => note(g, T + '°', x1 + 6, TY(T) + 6, COL.temp, 15));
      note(g, 'pH', x0 + 6, 70, '#fff', 17); note(g, '°C', x1 + 40, 70, COL.temp, 17, 'right');
      dot(g, X(r.t), Y(r.ph), '#fff', 8); dot(g, X(r.t), TY(r.T), COL.temp, 6);
    }, CHART_POS);

    return {
      update(dt, s, time) {
        dt = Math.max(0, Math.min(dt, 0.05)); S = s;
        const narrow = fitNarrow(stage, [lClock, lWrap]);
        chart.mesh.visible = !narrow && reelChart(stage, chart);
        const rows = batch(s), r = rowAt(rows, s.hours), v = verdict(r, s.boiled), wi = wheyIndex(r, { Tset: s.T0 });
        const gp = s.boiled ? GEL.boiled.ph : GEL.raw.ph, setT = clamp((gp - r.ph) / 0.5, 0, 1);
        setK += (setT - setK) * (1 - Math.exp(-dt * 6));
        tiltK += ((s.tilt ? 1 : 0) - tiltK) * (1 - Math.exp(-dt * 4));
        const ang = -0.42 * smoothK(tiltK);
        piv.rotation.z = ang;
        // liquid: the surface counter-rotates to stay level and sloshes a little; set: it follows the pot
        milkPiv.rotation.z = -ang * (1 - setK) + (1 - setK) * 0.015 * Math.sin(time * 2.2) * (0.3 + tiltK);
        milkPiv.scale.x = 1 / Math.max(0.6, Math.cos(ang * (1 - setK)));
        milkMat.color.set(0xf6f3ea).lerp(col.set(0xffffff), setK * 0.6); milkMat.roughness = 0.3 + 0.5 * setK;
        const wh = 0.02 + 0.22 * wi; whey.visible = wi > 0.03; whey.scale.y = wh; whey.position.y = 0.025 + wh / 2; wheyMat.opacity = 0.25 + 0.4 * wi;
        blanket.visible = fold.visible = s.wrap === 'wrap'; oven.visible = ovenE.visible = s.wrap === 'hold';
        dollop.visible = s.hours < 0.15; spoon.visible = s.hours < 3;
        const mlen = 0.3 + clamp(r.T / 80, 0, 1) * 2.9; merc.scale.y = mlen; merc.position.y = mlen / 2 + 0.05; bulb.position.y = 0.05;
        th.visible = tiltK < 0.2;
        hHand.rotation.z = -((s.hours + 9) / 12) * Math.PI * 2; mHand.rotation.z = -(s.hours % 1) * Math.PI * 2;
        lT.visible = th.visible; lT.element.innerHTML = `<b>${r.T.toFixed(0)} °C</b>`;
        lPot.element.style.setProperty('--c', v.col); lPot.element.innerHTML = `<b>${v.n}</b>`;
        const hr = (21 + s.hours) % 24, hh12 = Math.floor(hr) % 12 || 12;
        lClock.element.innerHTML = `${hh12}:${String(Math.floor((hr % 1) * 60)).padStart(2, '0')} ${hr >= 12 ? 'pm' : 'am'}`;
        lWrap.element.innerHTML = WRAPS[s.wrap].n.toLowerCase();
        const k2 = [s.hours, s.T0, s.room, s.wrap, s.inoc, s.boiled].join('|'); if (k2 !== key) { key = k2; chart.redraw(); }
      },
      readout: (s) => {
        const rows = batch(s), r = rowAt(rows, s.hours), v = verdict(r, s.boiled), tset = timeTo(rows, 4.6);
        return `<div class="big" style="color:${v.col}">${v.n}</div>
          <div class="row"><span>Milk temperature now</span><b style="color:${COL.temp}">${r.T.toFixed(0)} °C</b></div>
          <div class="row"><span>pH · acidity as lactic acid</span><b>${r.ph.toFixed(2)} · ${r.ta.toFixed(2)}%</b></div>
          <div class="row"><span>Live bacteria per mL</span><b style="color:${COL.bug}">${fmtN(r.N)}</b></div>
          <div class="row"><span>Firmness</span><b style="color:${COL.good}">${r.G < 1 ? 'liquid' : Math.round(r.G) + ' Pa'}</b></div>
          <div class="row"><span>Reaches pH 4.6 after</span><b>${tset === Infinity ? 'not within 24 h' : fmtH(tset)}</b></div>
          <small>A model with typical values, not a recipe timer. Your milk, jaman and pot will differ.</small>`;
      },
    };
  },
};
