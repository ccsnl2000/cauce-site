/**
 * Costa: a long strip of coast with a dashed shoreline and five homes growing
 * in size along it, one per budget. The home under the pointer rises; the
 * others follow less, outward from it. The largest is bright at rest.
 */
const { Cam, clamp, facing, fit, open, proj, prism, rings, solid, put, tset, tval, tdone, tween, disposer, mk, pointer, register } = HL;

const L = 190, D = 70, TH = 5;
const HOMES = [{ x: 10, w: 18, h: 10 }, { x: 40, w: 24, h: 14 }, { x: 76, w: 28, h: 18 }, { x: 116, w: 30, h: 24 }, { x: 156, w: 26, h: 32 }];

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let lift = value;
  const C = Cam(45, 0.5, 1.45);
  fit(C, [[0, 0, -TH], [L, D, -TH], [L, 0, 0], [0, D, 0], [170, 20, 32]], 200, 160);
  const P = proj(C), front = facing(C);
  const g = mk("g", {}, svg);
  const [pr, pi] = rings(0, 0, L, D, 8, 1.6);
  put(solid(g), prism(P, front, pr, pi, -TH, 0));
  const shore = []; for (let x = 4; x <= L - 4; x += 6) shore.push(P(x, D - 14 + Math.sin(x / 14) * 4, 0));
  mk("path", { d: open(shore), class: "nf dash" }, g);
  const homes = HOMES.map((h) => { const [r, inn] = rings(h.x, 14, h.x + h.w, 14 + h.w, 3, 1.3); return { r, inn, h: h.h, s: solid(g), z: tween(h.h), last: -1 }; });
  const B = register(stage, (_dt, now) => {
    let m = false;
    homes.forEach((t) => { const z = tval(t.z, now); if (Math.abs(z - t.last) > 0.01) { t.last = z; put(t.s, prism(P, front, t.r, t.inn, 0, z)); } if (!tdone(t.z, now)) m = true; });
    return m;
  });
  bag.add(B.unregister);
  const cx = HOMES.map((h) => P(h.x + h.w / 2, 14 + h.w / 2, 0)[0]);
  function hit([x, y]) { if (y < 60 || y > 290) return -1; let b = -1, d = 1e9; cx.forEach((c, i) => { if (Math.abs(c - x) < d) { d = Math.abs(c - x); b = i; } }); return d < 30 ? b : -1; }
  let act = -2;
  function setActive(a) {
    if (a === act) return; const from = a >= 0 ? a : Math.max(act, 0); act = a; const now = performance.now();
    homes.forEach((t, i) => { const d = Math.abs(i - from); tset(t.z, t.h + (a < 0 ? 0 : clamp(lift / (1 + d * 2), 0, lift)), now, d * 45); t.s.sil.classList.toggle("hi", a < 0 ? i === 4 : i === a); });
    read.textContent = a < 0 ? "rest" : "0" + (a + 1); B.wake();
  }
  bag.add(pointer(stage, { move: (p) => setActive(hit(p)), leave: () => setActive(-1) }));
  bag.add(() => svg.replaceChildren());
  setActive(-1);
  return { set: (v) => { lift = v; }, destroy: bag.dispose };
}
hairline({ name: "costa", means: "From $15,000 on the coast: five homes along the shore, each one budget bigger than the last.", rules: [1, 2, 5, 9], range: [6, 12, 20], tour: [[140, 190], [205, 175], [265, 150], null], mount });
