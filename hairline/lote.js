/**
 * Lote: the Porlamar study. A rounded lot with its setback line and four
 * buildings of different heights, trees along the front, the street in front
 * with its centre line and a crossing, and the neighbour's lot behind. The
 * building under the pointer rises to the height the slider allows; its
 * neighbours rise less, staggered outward. At rest the tallest is bright.
 */
const { Cam, clamp, facing, fit, hull, open, poly, proj, prism, rings, ringAt, rrect, run, seg, solid, put, tset, tval, tdone, tween, disposer, mk, pointer, register } = HL;
/* kit: a box, a gabled roof, a tree, floor lines; all built from the kernel's rings and hulls */
const box = (P, front, x0, y0, x1, y1, z0, z1, r = 1.4) => { const [a, b] = rings(x0, y0, x1, y1, r, 1.1); return prism(P, front, a, b, z0, z1); };
function roof(P, front, x0, y0, x1, y1, z, rh) {
  const ym = (y0 + y1) / 2, foot = rrect(x0, y0, x1, y1, 1, 3), ridge = rrect(x0 + 0.6, ym - 0.4, x1 - 0.6, ym + 0.4, 0.4, 2);
  const top = (x) => P(x, ym, z + rh);
  return { sil: poly(hull(ringAt(P, foot, z).concat(ringAt(P, ridge, z + rh)))),
    crease: open(ringAt(P, run(foot, front), z)) + seg(top(x0 + 0.6), top(x1 - 0.6)) + seg(P(x1, y0 + 1, z), top(x1 - 0.6)) + seg(top(x1 - 0.6), P(x1, y1 - 1, z)) };
}
function tree(P, front, x, y, r, h) {
  const q = (k) => rrect(x - r * k, y - r * k, x + r * k, y + r * k, r * k, 4), t = q(0.16), mid = q(1);
  return [{ sil: poly(hull(ringAt(P, t, 0).concat(ringAt(P, t, h * 0.45)))), crease: "" },
    { sil: poly(hull(ringAt(P, q(0.5), h * 0.36).concat(ringAt(P, mid, h * 0.66), ringAt(P, q(0.32), h)))), crease: open(ringAt(P, run(mid, front), h * 0.66)) }];
}
const plant = (g, P, front, x, y, r, h) => tree(P, front, x, y, r, h).forEach((s) => put(solid(g), s));
function floors(P, x0, y0, x1, y1, h, step) { let d = ""; for (let z = step; z < h - 3; z += step) d += open([P(x0 + 2, y1, z), P(x1 - 1, y1, z), P(x1, y1 - 1, z), P(x1, y0 + 2, z)]); return d; }

const LX = 172, LY = 104, LR = 8, TH = 6, SB = 9;
const BW = 28, BD = 46, GAP = 10, BY0 = 30, REST = [18, 34, 14, 24], NEAR = 0.45, N = REST.length, X0 = 16;
const bx = (i) => X0 + i * (BW + GAP);
const NX0 = -62, NX1 = -12, SX0 = -62, SX1 = LX + 16, SY0 = LY + 10, SY1 = LY + 38;

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let maxH = value;
  const C = Cam(45, 0.5, 1.1);
  fit(C, [[NX0, 0, -3], [NX0, 0, 16], [LX, 0, 0], [SX0, SY1, -3], [SX1, SY1, -3], [SX1, SY0, 0], [bx(1), BY0, 34]], 200, 155);
  const P = proj(C), front = facing(C);
  const g = mk("g", {}, svg);
  // the neighbour, behind: its lot, its setback, two low blocks
  const [nr, ni] = rings(NX0, 0, NX1, LY, 6, 1.4);
  put(solid(g), prism(P, front, nr, ni, -3, 0));
  mk("path", { d: poly(ringAt(P, rrect(NX0 + 7, 7, NX1 - 7, LY - 7, 3, 6), 0)), class: "nf dash" }, g);
  put(solid(g), box(P, front, NX0 + 11, 14, NX1 - 11, 58, 0, 16));
  put(solid(g), box(P, front, NX0 + 11, 66, NX1 - 11, 90, 0, 8));
  // the lot
  const [lotRing, lotInner] = rings(0, 0, LX, LY, LR, 1.6);
  put(solid(g), prism(P, front, lotRing, lotInner, -TH, 0));
  mk("path", { d: poly(ringAt(P, rrect(SB, SB, LX - SB, LY - SB, LR - 3, 6), 0)), class: "nf dash" }, g);
  const blocks = REST.map((h, i) => { const [ring, inner] = rings(bx(i), BY0, bx(i) + BW, BY0 + BD, 3.2, 1.4); const s = solid(g); return { ring, inner, s, fl: mk("path", { class: "nf lo" }, s.g), z: tween(h), last: -1 }; });
  // trees in the front setback, then the street
  [24, 62, 100, 138].forEach((x) => plant(g, P, front, x, LY - 4.5, 4, 17));
  put(solid(g), box(P, front, SX0, SY0, SX1, SY1, -3, 0, 4));
  mk("path", { d: open([P(SX0 + 6, (SY0 + SY1) / 2, 0), P(SX1 - 6, (SY0 + SY1) / 2, 0)]), class: "nf dash" }, g);
  let zebra = ""; for (let k = 0; k < 6; k++) { const x = LX - 30 + k * 4.5; zebra += seg(P(x, SY0 + 3, 0), P(x, SY1 - 3, 0)); }
  mk("path", { d: zebra, class: "nf lo" }, g);

  const draw = (b, i, h) => { if (Math.abs(h - b.last) < 0.01) return; b.last = h; put(b.s, prism(P, front, b.ring, b.inner, 0, h)); b.fl.setAttribute("d", floors(P, bx(i), BY0, bx(i) + BW, BY0 + BD, h, 7)); };
  const B = register(stage, (_dt, now) => { let m = false; blocks.forEach((b, i) => { draw(b, i, tval(b.z, now)); if (!tdone(b.z, now)) m = true; }); return m; });
  bag.add(B.unregister);
  const centres = blocks.map((_, i) => P(bx(i) + BW / 2, BY0 + BD / 2, REST[i]));
  const top = Math.min(...centres.map((c) => c[1])) - 60, bottom = P(LX, LY, -TH)[1] + 6;
  const left = P(0, LY, 0)[0] - 6, right = P(LX, 0, 0)[0] + 6;
  function hit([x, y]) {
    if (x < left || x > right || y < top || y > bottom) return -1;
    let best = -1, d = 1e9;
    centres.forEach((c, i) => { const k = Math.abs(c[0] - x); if (k < d) { d = k; best = i; } });
    return d < BW * 1.1 ? best : -1;
  }
  const tallest = REST.indexOf(Math.max(...REST));
  let act = -2;
  function setActive(a) {
    if (a === act) return;
    const now = performance.now(), from = a >= 0 ? a : Math.max(act, 0); act = a;
    blocks.forEach((b, i) => {
      const lift = a < 0 ? REST[i] : i === a ? maxH : clamp(REST[i] + (maxH - REST[i]) * NEAR / (1 + Math.abs(i - a)), REST[i], maxH);
      tset(b.z, lift, now, Math.abs(i - from) * 45); b.s.sil.classList.toggle("hi", a < 0 ? i === tallest : i === a);
    });
    read.textContent = a < 0 ? "rest" : "0" + (a + 1); B.wake();
  }
  bag.add(pointer(stage, { move: (p) => setActive(hit(p)), leave: () => setActive(-1) }));
  bag.add(() => svg.replaceChildren());
  setActive(-1);
  return { set: (v) => { maxH = v; if (act >= 0) { const a = act; act = -2; setActive(a); } }, destroy: bag.dispose };
}
hairline({ name: "lote", means: "The lot, its street and its neighbour: the building under the pointer rises to the height the zoning allows.", rules: [1, 2, 5, 9], range: [40, 62, 84], tour: [[170, 150], [215, 165], [255, 185], null], mount });
