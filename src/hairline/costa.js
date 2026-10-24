/**
 * Costa: from $15,000 on the coast. A strip of land with a dashed shoreline,
 * five gabled homes growing along it, one per budget, trees in front, waves
 * and a jetty on the water. The home under the pointer rises; the others
 * follow less, outward from it. The largest is bright at rest.
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

const L = 196, D = 96, TH = 5, SHORE = 64;
const HOMES = [{ x: 10, w: 18, h: 9 }, { x: 40, w: 24, h: 12 }, { x: 76, w: 28, h: 15 }, { x: 116, w: 30, h: 19 }, { x: 158, w: 30, h: 25 }];
const shoreY = (x) => SHORE + Math.sin(x / 15) * 3;

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let lift = value;
  const C = Cam(45, 0.5, 1.4);
  fit(C, [[0, 0, -TH], [L, D, -TH], [L, 0, 0], [0, D, 0], [172, 14, 25 + 12]], 200, 160);
  const P = proj(C), front = facing(C);
  const g = mk("g", {}, svg);
  const [pr, pi] = rings(0, 0, L, D, 8, 1.6);
  put(solid(g), prism(P, front, pr, pi, -TH, 0));
  const shore = []; for (let x = 4; x <= L - 4; x += 4) shore.push(P(x, shoreY(x), 0));
  mk("path", { d: open(shore), class: "nf dash" }, g);
  let waves = ""; [74, 82, 90].forEach((y, k) => { for (let x0 = 10 + k * 9; x0 < L - 24; x0 += 34) { const pts = []; for (let x = x0; x <= x0 + 18; x += 2) pts.push(P(x, y + Math.sin((x - x0) / 3) * 1.2, 0)); waves += open(pts); } });
  mk("path", { d: waves, class: "nf lo" }, g);
  const homes = HOMES.map((h) => { const [r, inn] = rings(h.x, 14, h.x + h.w, 14 + h.w, 2.4, 1.2); return { ...h, r, inn, body: solid(g), roof: solid(g), z: tween(h.h), last: -1 }; });
  [[34, 53, 17], [110, 55, 19], [151, 56, 15]].forEach(([x, y, h]) => plant(g, P, front, x, y, 3.6, h));
  put(solid(g), box(P, front, 182, shoreY(182) - 2, 188, D - 6, 0.5, 2, 1));
  const B = register(stage, (_dt, now) => {
    let m = false;
    homes.forEach((t) => { const z = tval(t.z, now); if (Math.abs(z - t.last) > 0.01) { t.last = z; put(t.body, prism(P, front, t.r, t.inn, 0, z)); put(t.roof, roof(P, front, t.x, 14, t.x + t.w, 14 + t.w, z, t.w * 0.42)); } if (!tdone(t.z, now)) m = true; });
    return m;
  });
  bag.add(B.unregister);
  const cx = HOMES.map((h) => P(h.x + h.w / 2, 14 + h.w / 2, 0)[0]);
  function hit([x, y]) { if (y < 50 || y > 290) return -1; let b = -1, d = 1e9; cx.forEach((c, i) => { if (Math.abs(c - x) < d) { d = Math.abs(c - x); b = i; } }); return d < 26 ? b : -1; }
  let act = -2;
  function setActive(a) {
    if (a === act) return; const from = a >= 0 ? a : Math.max(act, 0); act = a; const now = performance.now();
    homes.forEach((t, i) => { const d = Math.abs(i - from); tset(t.z, t.h + (a < 0 ? 0 : clamp(lift / (1 + d * 2), 0, lift)), now, d * 45); const on = a < 0 ? i === 4 : i === a; t.body.sil.classList.toggle("hi", on); t.roof.sil.classList.toggle("hi", on); });
    read.textContent = a < 0 ? "rest" : "0" + (a + 1); B.wake();
  }
  bag.add(pointer(stage, { move: (p) => setActive(hit(p)), leave: () => setActive(-1) }));
  bag.add(() => svg.replaceChildren());
  setActive(-1);
  return { set: (v) => { lift = v; }, destroy: bag.dispose };
}
hairline({ name: "costa", means: "From $15,000 on the coast: five homes along the shore, each one budget bigger than the last.", rules: [1, 2, 5, 9], range: [6, 12, 20], tour: [[140, 190], [205, 175], [265, 150], null], mount });
