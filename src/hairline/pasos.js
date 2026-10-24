/**
 * Pasos: buying from abroad, step by step. A suitcase on its own plate across
 * a dashed border, five steps rising toward a house, each step marked with
 * its number in dots, and a dashed flight from the suitcase to the house. The
 * step under the pointer lifts and turns bright; the others follow a little.
 */
const { Cam, clamp, facing, fit, flatDot, hull, open, place, poly, proj, prism, rings, ringAt, rrect, run, seg, solid, put, tset, tval, tdone, tween, disposer, mk, pointer, register } = HL;
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

const N = 5, SW = 24, SD = 46, UP = 11;
const base = (i) => 8 + i * UP;
const y0 = (i) => -(i + 1) * SW + 3, y1 = (i) => -i * SW;   // step i climbs away along -y, up and to the right
const OX0 = 4, OX1 = 42, OY0 = 22, OY1 = 56;

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let lift = value;
  const C = Cam(45, 0.5, 1.5);
  const L = N - 1;
  fit(C, [[0, 0, 0], [SD, 0, 0], [OX0, OY1, -3], [OX1, OY1, -3], [0, y0(L), base(L) + 30], [SD, y0(L), base(L)], [OX0 + 19, 39, 40]], 200, 149);
  const P = proj(C), front = facing(C);
  const g = mk("g", {}, svg);
  // the steps, far to near, each with its dots
  const steps = [...Array(N).keys()].map((i) => ({ i })).reverse().map(({ i }) => {
    const [r, inn] = rings(0, y0(i), SD, y1(i), 4, 1.4), s = solid(g);
    const dots = [...Array(i + 1).keys()].map(() => flatDot(s.g, C, 1.3, "dot off"));
    return { i, r, inn, s, dots, z: tween(base(i)), last: -1 };
  }).sort((a, b) => a.i - b.i);
  // the house on the top step
  const hs = { body: solid(g), roof: solid(g) }, HX0 = 9, HX1 = SD - 9, HY0 = y0(L) + 2, HY1 = y1(L) - 3;
  // the border, then abroad: a plate and a suitcase with its handle and straps
  mk("path", { d: open([P(-10, 13, 0), P(SD + 10, 13, 0)]), class: "nf dash" }, g);
  put(solid(g), box(P, front, OX0, OY0, OX1, OY1, -3, 0, 5));
  put(solid(g), box(P, front, OX0 + 10, OY0 + 11, OX1 - 10, OY1 - 11, 0, 22, 2.5));
  const sx = (OX0 + OX1) / 2;
  mk("path", { d: open([P(sx, OY0 + 17, 22), P(sx, OY0 + 17, 27), P(sx, OY1 - 17, 27), P(sx, OY1 - 17, 22)]) + seg(P(OX1 - 10, OY0 + 16, 0), P(OX1 - 10, OY0 + 16, 22)) + seg(P(OX1 - 10, OY1 - 16, 0), P(OX1 - 10, OY1 - 16, 22)), class: "nf sil" }, g);
  const arc = mk("path", { class: "nf dash" }, g);
  const B = register(stage, (_dt, now) => {
    let m = false;
    steps.forEach((t) => {
      const h = tval(t.z, now), i = t.i;
      if (Math.abs(h - t.last) > 0.01) {
        t.last = h; put(t.s, prism(P, front, t.r, t.inn, 0, h));
        t.dots.forEach((el, d) => place(el, P(8 + d * 7, (y0(i) + y1(i)) / 2, h)));
        if (i === L) {
          put(hs.body, box(P, front, HX0, HY0, HX1, HY1, h, h + 13, 1)); put(hs.roof, roof(P, front, HX0, HY0, HX1, HY1, h + 13, 8));
          const a = [sx, 39, 30], b = [(HX0 + HX1) / 2, (HY0 + HY1) / 2, h + 24], pts = [];
          for (let k = 0; k <= 24; k++) { const u = k / 24; pts.push(P(a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u + Math.sin(u * Math.PI) * 26)); }
          arc.setAttribute("d", open(pts));
        }
      }
      if (!tdone(t.z, now)) m = true;
    });
    return m;
  });
  bag.add(B.unregister);
  const cx = steps.map((_, i) => P(SD / 2, (y0(i) + y1(i)) / 2, base(i))[0]);
  function hit([x, y]) { if (y < 30 || y > 300) return -1; let b = -1, d = 1e9; cx.forEach((c, i) => { if (Math.abs(c - x) < d) { d = Math.abs(c - x); b = i; } }); return d < 16 ? b : -1; }
  let act = -2;
  function setActive(a) {
    if (a === act) return; const from = a >= 0 ? a : Math.max(act, 0); act = a; const now = performance.now();
    steps.forEach((t, i) => {
      const d = Math.abs(i - from); tset(t.z, base(i) + (a < 0 ? 0 : clamp(lift / (1 + d * 2), 0, lift)), now, d * 45);
      const on = a < 0 ? i === 0 : i === a; t.s.sil.classList.toggle("hi", on); t.dots.forEach((el) => el.setAttribute("class", on ? "dot" : "dot off"));
    });
    read.textContent = a < 0 ? "rest" : "0" + (a + 1); B.wake();
  }
  bag.add(pointer(stage, { move: (p) => setActive(hit(p)), leave: () => setActive(-1) }));
  bag.add(() => svg.replaceChildren());
  setActive(-1);
  return { set: (v) => { lift = v; }, destroy: bag.dispose };
}
hairline({ name: "pasos", means: "From a suitcase abroad to a house: five numbered steps, and the one under the pointer lifts.", rules: [1, 2, 5, 9], range: [6, 12, 20], tour: [[150, 190], [200, 165], [245, 140], null], mount });
