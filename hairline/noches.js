/**
 * Noches: a month of nights. A calendar of 7 × 4 tiles on its board, bound by
 * rings along the back; the booked nights, about a third, stand raised. Beside
 * it the flat that is rented out, a dashed path from its door to the calendar.
 * The pointer lifts the night under it and its neighbours less, by distance.
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

const CX = 7, CY = 4, T = 16, GP = 5, M = 8, TH = 5, HEAD = 12;
const W = M * 2 + CX * T + (CX - 1) * GP, D = HEAD + M * 2 + CY * T + (CY - 1) * GP;
const BUSY = new Set([1, 4, 5, 9, 12, 16, 19, 23, 26]);
const at = (i) => [M + (i % CX) * (T + GP), HEAD + M + Math.floor(i / CX) * (T + GP)];
const restH = (i) => (BUSY.has(i) ? 10 : 2);
const HX0 = W + 22, HX1 = W + 52, HY0 = 36, HY1 = 62;

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let lift = value;
  const C = Cam(45, 0.5, 1.3);
  fit(C, [[0, 0, -TH], [W, D, -TH], [0, D, 0], [W, 0, 0], [HX1 + 8, HY0 - 8, 0], [HX1 + 8, HY1 + 8, -3], [HX0, (HY0 + HY1) / 2, 34], [0, 0, 12]], 200, 153);
  const P = proj(C), front = facing(C);
  const g = mk("g", {}, svg);
  const [pr, pi] = rings(0, 0, W, D, 7, 1.6);
  put(solid(g), prism(P, front, pr, pi, -TH, 0));
  // the header strip and the binding rings
  mk("path", { d: open([P(6, HEAD, 0), P(W - 6, HEAD, 0)]), class: "nf lo" }, g);
  for (let k = 0; k < 5; k++) {
    const x = 22 + k * ((W - 44) / 4), pts = [];
    for (let a = -110; a <= 250; a += 15) { const r = (a * Math.PI) / 180; pts.push(P(x, 6 - 5 * Math.cos(r), 2 + 6 * Math.sin(r))); }
    mk("path", { d: open(pts), class: "nf sil" }, g);
  }
  const N = CX * CY, order = [...Array(N).keys()].sort((a, b) => at(a)[0] + at(a)[1] - (at(b)[0] + at(b)[1]));
  const tiles = [];
  order.forEach((i) => { const [x, y] = at(i), [r, inn] = rings(x, y, x + T, y + T, 2.6, 1.2); tiles[i] = { r, inn, s: solid(g), z: tween(restH(i)), last: -1 }; });
  // the flat: a plate, a house with its door and windows, a tree, a path to the calendar
  put(solid(g), box(P, front, HX0 - 8, HY0 - 8, HX1 + 8, HY1 + 8, -3, 0, 5));
  mk("path", { d: open([[HX0 + 12, HY1 + 1], [HX0 + 4, HY1 + 10], [W + 8, HY1 + 14], [W - 4, D - 30]].map(([x, y]) => P(x, y, 0))), class: "nf dash" }, g);
  put(solid(g), box(P, front, HX0, HY0, HX1, HY1, 0, 18, 1));
  put(solid(g), roof(P, front, HX0, HY0, HX1, HY1, 18, 11));
  mk("path", { d: poly([P(HX0 + 9, HY1, 0), P(HX0 + 9, HY1, 10), P(HX0 + 15, HY1, 10), P(HX0 + 15, HY1, 0)]) + poly([P(HX0 + 20, HY1, 7), P(HX0 + 20, HY1, 12), P(HX0 + 26, HY1, 12), P(HX0 + 26, HY1, 7)]) + poly([P(HX1, HY0 + 8, 7), P(HX1, HY0 + 8, 12), P(HX1, HY0 + 18, 12), P(HX1, HY0 + 18, 7)]), class: "nf lo" }, g);
  plant(g, P, front, HX1 + 2, HY1 + 3, 3.4, 15);

  const B = register(stage, (_dt, now) => {
    let m = false;
    tiles.forEach((t) => { const h = tval(t.z, now); if (Math.abs(h - t.last) > 0.01) { t.last = h; put(t.s, prism(P, front, t.r, t.inn, 0, h)); } if (!tdone(t.z, now)) m = true; });
    return m;
  });
  bag.add(B.unregister);
  function hit([sx, sy]) {
    const [wx, wy] = unproj(C, sx, sy, 2);
    if (wx < 0 || wy < HEAD || wx > W || wy > D) return -1;
    return clamp(Math.floor((wy - HEAD - M + GP / 2) / (T + GP)), 0, CY - 1) * CX + clamp(Math.floor((wx - M + GP / 2) / (T + GP)), 0, CX - 1);
  }
  let act = -2;
  function setActive(a) {
    if (a === act) return; act = a; const now = performance.now();
    tiles.forEach((t, i) => {
      const d = a < 0 ? 0 : Math.abs((i % CX) - (a % CX)) + Math.abs(Math.floor(i / CX) - Math.floor(a / CX));
      tset(t.z, a < 0 ? restH(i) : restH(i) + clamp(lift / (1 + d * 1.4), 0, lift) * (d < 3 ? 1 : 0), now, d * 40);
      t.s.sil.classList.toggle("hi", a < 0 ? i === 12 : i === a);
    });
    read.textContent = a < 0 ? "rest" : String(a + 1).padStart(2, "0"); B.wake();
  }
  bag.add(pointer(stage, { move: (p) => setActive(hit(p)), leave: () => setActive(-1) }));
  bag.add(() => svg.replaceChildren());
  setActive(-1);
  return { set: (v) => { lift = v; }, destroy: bag.dispose };
}
hairline({ name: "noches", means: "A month of nights beside the flat that earns them: the raised tiles are the booked ones, about a third.", rules: [1, 2, 3, 5], range: [8, 16, 26], tour: [[150, 150], [190, 165], [225, 180], null], mount });
