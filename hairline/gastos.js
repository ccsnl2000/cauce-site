/**
 * Gastos: what a yield leaves. The rented house on its plate, a dashed line
 * carrying its rent to a tray, and the rent as a stack of six slabs on the
 * tray. The pointer splits the stack at the slab under it: everything above
 * lifts away as costs, what stays is what you keep. The slider is the gap.
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

const N = 6, S = 64, T = 8, REST = 2.4;
const z0 = (i, gap) => i * (T + REST) + gap;
const HX0 = -92, HX1 = -58, HY0 = 20, HY1 = 50;

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let gap = value;
  const C = Cam(45, 0.5, 1.45);
  const ZT = (N - 1) * (T + REST) + T;
  fit(C, [[-8, S + 8, -3], [S + 8, S + 8, -3], [S + 8, -8, 0], [0, 0, ZT], [S, 0, ZT], [0, S, ZT], [HX0 - 10, HY0 - 10, 0], [HX0 - 10, HY1 + 10, -3]], 200, 160);
  const P = proj(C), front = facing(C);
  const g = mk("g", {}, svg);
  // the house: plate, body, roof, door and windows, a tree
  put(solid(g), box(P, front, HX0 - 10, HY0 - 10, HX1 + 10, HY1 + 10, -3, 0, 5));
  put(solid(g), box(P, front, HX0, HY0, HX1, HY1, 0, 20, 1));
  put(solid(g), roof(P, front, HX0, HY0, HX1, HY1, 20, 12));
  const win = (x0, x1, y, a, b) => poly([P(x0, y, a), P(x0, y, b), P(x1, y, b), P(x1, y, a)]);
  mk("path", { d: win(HX0 + 6, HX0 + 12, HY1, 0, 11) + win(HX0 + 18, HX0 + 28, HY1, 8, 14) + poly([P(HX1, HY0 + 6, 8), P(HX1, HY0 + 6, 14), P(HX1, HY0 + 14, 14), P(HX1, HY0 + 14, 8)]), class: "nf lo" }, g);
  plant(g, P, front, HX0 - 4, HY1 + 4, 3.6, 16);
  // the rent's path, then the tray
  mk("path", { d: open([[HX1 + 4, HY1 + 6], [HX1 + 20, HY1 + 10], [-14, S / 2 + 10], [-10, S / 2]].map(([x, y]) => P(x, y, 0))), class: "nf dash" }, g);
  put(solid(g), box(P, front, -8, -8, S + 8, S + 8, -3, 0, 7));
  const [r, inn] = rings(0, 0, S, S, 7, 1.6);
  const slabs = [...Array(N).keys()].map((i) => ({ s: solid(g), z: tween(z0(i, 0)), last: -1 }));
  const B = register(stage, (_dt, now) => {
    let m = false;
    slabs.forEach((t) => { const b = tval(t.z, now); if (Math.abs(b - t.last) > 0.01) { t.last = b; put(t.s, prism(P, front, r, inn, b, b + T)); } if (!tdone(t.z, now)) m = true; });
    return m;
  });
  bag.add(B.unregister);
  const ys = slabs.map((_, i) => P(S, S, z0(i, 0) + T / 2)[1]);
  const left = P(0, S, 0)[0] - 10, right = P(S, 0, 0)[0] + 10;
  function hit([x, y]) { if (x < left || x > right) return -1; let b = -1, d = 1e9; ys.forEach((c, i) => { if (Math.abs(c - y) < d) { d = Math.abs(c - y); b = i; } }); return d < 30 ? b : -1; }
  let act = -2;
  function setActive(a) {
    if (a === act) return; const from = a >= 0 ? a : Math.max(act, 0); act = a; const now = performance.now();
    slabs.forEach((t, i) => { tset(t.z, z0(i, a >= 0 && i > a ? clamp(gap, 0, 30) : 0), now, Math.abs(i - from) * 40); t.s.sil.classList.toggle("hi", a < 0 ? i === 0 : i === a); });
    read.textContent = a < 0 ? "rest" : "0" + (a + 1); B.wake();
  }
  bag.add(pointer(stage, { move: (p) => setActive(hit(p)), leave: () => setActive(-1) }));
  bag.add(() => svg.replaceChildren());
  setActive(-1);
  return { set: (v) => { gap = v; }, destroy: bag.dispose };
}
hairline({ name: "gastos", means: "A house and its rent as a stack: the pointer lifts away the costs above it, and what stays is what you keep.", rules: [1, 2, 5, 6], range: [10, 18, 28], tour: [[240, 210], [240, 170], [240, 130], null], mount });
