/**
 * Ciudad: a block of the city under the mountain. Nine buildings on one plate,
 * each a different height with its floors drawn, trees on the near edge, and
 * the ridge of the Ávila behind. The building under the pointer rises; the
 * ones around it rise less, staggered outward. At rest the tallest is bright.
 */
const { Cam, clamp, facing, fit, hull, open, poly, proj, prism, rings, ringAt, rrect, run, seg, unproj, solid, put, tset, tval, tdone, tween, disposer, mk, pointer, register } = HL;
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

const G = 3, BW = 30, GAP = 11, M = 14, TH = 6;
const SIDE = M * 2 + G * BW + (G - 1) * GAP;
const REST = [12, 26, 16, 30, 20, 38, 14, 22, 18];
const at = (i) => [M + (i % G) * (BW + GAP), M + Math.floor(i / G) * (BW + GAP)];
const RC = -6, ridge = (t) => 6 + 48 * Math.exp(-(((t + 24) / 42) ** 2)) + 32 * Math.exp(-(((t - 58) / 30) ** 2));

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let rise = value;
  const C = Cam(45, 0.5, 1.22);
  const T = []; for (let t = -96; t <= 96; t += 4) T.push(t);
  const R = (t, k = 1) => [RC + t, RC - t, ridge(t) * k];
  fit(C, [[0, 0, -TH], [SIDE, SIDE, -TH], [SIDE, 0, 0], [0, SIDE, 0], R(-96), R(96), R(-24)], 200, 160);
  const P = proj(C), front = facing(C);
  const g = mk("g", {}, svg);
  // the mountain: an opaque profile, its ridge, and one inner contour
  const prof = T.map((t) => P(...R(t)));
  mk("path", { d: poly([...prof, P(RC + 96, RC - 96, 0), P(RC - 96, RC + 96, 0)]), class: "fo" }, g);
  mk("path", { d: open(prof), class: "nf sil" }, g);
  mk("path", { d: open(T.filter((t) => Math.abs(t + 20) < 64).map((t) => P(RC + t + 14, RC - t + 14, ridge(t) * 0.55))), class: "nf lo" }, g);
  mk("path", { d: open(T.filter((t) => t > 30 && t < 86).map((t) => P(RC + t + 10, RC - t + 10, ridge(t) * 0.62))), class: "nf lo" }, g);
  // the block
  const [plate, plateIn] = rings(0, 0, SIDE, SIDE, 9, 1.6);
  put(solid(g), prism(P, front, plate, plateIn, -TH, 0));
  mk("path", { d: poly(ringAt(P, rrect(M - 6, M - 6, SIDE - M + 6, SIDE - M + 6, 6, 6), 0)), class: "nf dash" }, g);
  const order = REST.map((_, i) => i).sort((a, b) => at(a)[0] + at(a)[1] - (at(b)[0] + at(b)[1]));
  const blocks = [];
  order.forEach((i) => { const [x, y] = at(i), [ring, inner] = rings(x, y, x + BW, y + BW, 3.4, 1.4), s = solid(g); blocks[i] = { ring, inner, s, fl: mk("path", { class: "nf lo" }, s.g), z: tween(REST[i]), last: -1 }; });
  [[SIDE - 6, 30], [SIDE - 6, 72], [SIDE - 6, 114], [30, SIDE - 6], [72, SIDE - 6]].forEach(([x, y]) => plant(g, P, front, x, y, 3.6, 15));

  const draw = (b, i, h) => { if (Math.abs(h - b.last) < 0.01) return; b.last = h; put(b.s, prism(P, front, b.ring, b.inner, 0, h)); const [x, y] = at(i); b.fl.setAttribute("d", floors(P, x, y, x + BW, y + BW, h, 6)); };
  const B = register(stage, (_dt, now) => { let m = false; blocks.forEach((b, i) => { draw(b, i, tval(b.z, now)); if (!tdone(b.z, now)) m = true; }); return m; });
  bag.add(B.unregister);
  function hit([sx, sy]) {
    let best = -1, key = -1;
    REST.forEach((h, i) => { const [x, y] = at(i), [wx, wy] = unproj(C, sx, sy, h); if (wx >= x - 3 && wx <= x + BW + 3 && wy >= y - 3 && wy <= y + BW + 3 && x + y > key) { key = x + y; best = i; } });
    return best;
  }
  const tallest = REST.indexOf(Math.max(...REST));
  let act = -2;
  function setActive(a) {
    if (a === act) return;
    const now = performance.now(), from = a >= 0 ? a : Math.max(act, 0); act = a;
    blocks.forEach((b, i) => {
      const d = Math.abs((i % G) - (from % G)) + Math.abs(Math.floor(i / G) - Math.floor(from / G));
      tset(b.z, a < 0 ? REST[i] : REST[i] + clamp(rise / (1 + d * 1.6), 0, rise) * (i === a ? 1 : 0.5), now, d * 45);
      b.s.sil.classList.toggle("hi", a < 0 ? i === tallest : i === a);
    });
    read.textContent = a < 0 ? "rest" : (a % G + 1) + "·" + (Math.floor(a / G) + 1); B.wake();
  }
  bag.add(pointer(stage, { move: (p) => setActive(hit(p)), leave: () => setActive(-1) }));
  bag.add(() => svg.replaceChildren());
  setActive(-1);
  return { set: (v) => { rise = v; if (act >= 0) { const a = act; act = -2; setActive(a); } }, destroy: bag.dispose };
}
hairline({ name: "ciudad", means: "A city block under the mountain: the building under the pointer rises, and the ones around it follow, less the farther they stand.", rules: [1, 2, 3, 5], range: [24, 42, 60], tour: [[175, 175], [215, 195], [250, 180], null], mount });
