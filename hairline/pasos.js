/**
 * Pasos: five steps climbing to the right, each a rounded slab: buying from
 * abroad, step by step. The step under the pointer rises and turns bright;
 * the others follow a little, outward from it. At rest the first is bright.
 */
const { Cam, clamp, facing, fit, proj, prism, rings, solid, put, tset, tval, tdone, tween, disposer, mk, pointer, register } = HL;

const N = 5, SW = 26, SD = 60, UP = 12;
const base = (i) => 8 + i * UP;

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let lift = value;
  const C = Cam(45, 0.5, 1.7);
  fit(C, [[0, 0, 0], [N * SW, SD, 0], [N * SW, 0, 0], [0, SD, 0], ...[...Array(N).keys()].flatMap((i) => [[i * SW, 0, base(i)], [i * SW + SW, 0, base(i)], [i * SW, SD, base(i)]])], 200, 160);
  const P = proj(C), front = facing(C);
  const g = mk("g", {}, svg);
  const steps = [...Array(N).keys()].map((i) => { const [r, inn] = rings(i * SW, 0, i * SW + SW - 3, SD, 4, 1.4); return { r, inn, s: solid(g), z: tween(base(i)), last: -1 }; });
  const B = register(stage, (_dt, now) => {
    let m = false;
    steps.forEach((t) => { const h = tval(t.z, now); if (Math.abs(h - t.last) > 0.01) { t.last = h; put(t.s, prism(P, front, t.r, t.inn, 0, h)); } if (!tdone(t.z, now)) m = true; });
    return m;
  });
  bag.add(B.unregister);
  const cx = steps.map((_, i) => P(i * SW + SW / 2, SD / 2, base(i))[0]);
  function hit([x, y]) { if (y < 30 || y > 300) return -1; let b = -1, d = 1e9; cx.forEach((c, i) => { if (Math.abs(c - x) < d) { d = Math.abs(c - x); b = i; } }); return d < 40 ? b : -1; }
  let act = -2;
  function setActive(a) {
    if (a === act) return; const from = a >= 0 ? a : Math.max(act, 0); act = a; const now = performance.now();
    steps.forEach((t, i) => { const d = Math.abs(i - from); tset(t.z, base(i) + (a < 0 ? 0 : clamp(lift / (1 + d * 2), 0, lift)), now, d * 45); t.s.sil.classList.toggle("hi", a < 0 ? i === 0 : i === a); });
    read.textContent = a < 0 ? "rest" : "0" + (a + 1); B.wake();
  }
  bag.add(pointer(stage, { move: (p) => setActive(hit(p)), leave: () => setActive(-1) }));
  bag.add(() => svg.replaceChildren());
  setActive(-1);
  return { set: (v) => { lift = v; }, destroy: bag.dispose };
}
hairline({ name: "pasos", means: "Buying from abroad, step by step: five rising steps, and the one under the pointer lifts.", rules: [1, 2, 5, 9], range: [6, 12, 20], tour: [[150, 190], [210, 160], [260, 130], null], mount });
