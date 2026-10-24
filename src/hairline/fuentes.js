/**
 * Fuentes: two sources, one city. Two buildings on one plate, one 2.8 times
 * the other, each with its floors, each over a source card marked with one
 * dot or two. A measuring rod stands behind, and a dashed guide carries the
 * tall one's height across. The building under the pointer rises; at rest the
 * tall one is bright.
 */
const { Cam, facing, fit, flatDot, hull, open, place, poly, proj, prism, rings, ringAt, rrect, run, seg, solid, put, tset, tval, tdone, tween, disposer, mk, pointer, register } = HL;
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

const PW = 150, PD = 92, TH = 6, CW = 34, CY0 = 14, CD = 34, ROD = 84;
const COLS = [{ x: 30, h: 72 }, { x: 94, h: 26 }];

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let rise = value;
  const C = Cam(45, 0.5, 1.45);
  fit(C, [[0, 0, -TH], [PW, PD, -TH], [PW, 0, 0], [0, PD, 0], [COLS[0].x, CY0, COLS[0].h], [8, 8, ROD]], 200, 160);
  const P = proj(C), front = facing(C);
  const g = mk("g", {}, svg);
  const [pr, pi] = rings(0, 0, PW, PD, 8, 1.6);
  put(solid(g), prism(P, front, pr, pi, -TH, 0));
  // the measuring rod, with a tick every ten
  put(solid(g), box(P, front, 6, 6, 10, 10, 0, ROD, 1.2));
  let ticks = ""; for (let z = 10; z < ROD; z += 10) ticks += seg(P(10, 8, z), P(z % 20 ? 14 : 17, 8, z));
  mk("path", { d: ticks, class: "nf lo" }, g);
  mk("path", { d: open([P(17, 8, COLS[0].h), P(COLS[1].x + CW, CY0 + CD, COLS[0].h)]), class: "nf dash" }, g);
  // the buildings, then their source cards in front
  const cols = COLS.map((c) => { const [r, i] = rings(c.x, CY0, c.x + CW, CY0 + CD, 4, 1.4), s = solid(g); return { ...c, r, i, s, fl: mk("path", { class: "nf lo" }, s.g), z: tween(c.h), last: -1 }; });
  cols.forEach((c, k) => {
    const y0 = CY0 + CD + 10, y1 = y0 + 22;
    put(solid(g), box(P, front, c.x + 2, y0, c.x + CW - 2, y1, 0, 1.6, 2));
    mk("path", { d: seg(P(c.x + 7, y1 - 6, 1.6), P(c.x + CW - 7, y1 - 6, 1.6)) + seg(P(c.x + 7, y1 - 10, 1.6), P(c.x + CW - 12, y1 - 10, 1.6)), class: "nf lo" }, g);
    for (let d = 0; d <= k; d++) place(flatDot(g, C, 1.3, "dot m"), P(c.x + 9 + d * 5, y0 + 6, 1.6));
  });
  const B = register(stage, (_dt, now) => {
    let m = false;
    cols.forEach((c) => { const h = tval(c.z, now); if (Math.abs(h - c.last) > 0.01) { c.last = h; put(c.s, prism(P, front, c.r, c.i, 0, h)); c.fl.setAttribute("d", floors(P, c.x, CY0, c.x + CW, CY0 + CD, h, 7)); } if (!tdone(c.z, now)) m = true; });
    return m;
  });
  bag.add(B.unregister);
  const cx = COLS.map((c) => P(c.x + CW / 2, CY0 + CD / 2, 0)[0]);
  const hit = ([x, y]) => (y < 30 || y > 300 ? -1 : Math.abs(x - cx[0]) < Math.abs(x - cx[1]) ? 0 : 1);
  let act = -2;
  function setActive(a) {
    if (a === act) return; act = a; const now = performance.now();
    cols.forEach((c, i) => { tset(c.z, c.h + (i === a ? rise : 0), now, 0); c.s.sil.classList.toggle("hi", a < 0 ? i === 0 : i === a); });
    read.textContent = a < 0 ? "rest" : a === 0 ? "1.551" : "547"; B.wake();
  }
  bag.add(pointer(stage, { move: (p) => setActive(hit(p)), leave: () => setActive(-1) }));
  bag.add(() => svg.replaceChildren());
  setActive(-1);
  return { set: (v) => { rise = v; }, destroy: bag.dispose };
}
hairline({ name: "fuentes", means: "Two sources, one city: one building stands 2.8 times the other, and the rod and dashed line show the gap.", rules: [4, 5, 9, 10], range: [6, 14, 22], tour: [[170, 150], [235, 185], null], mount });
