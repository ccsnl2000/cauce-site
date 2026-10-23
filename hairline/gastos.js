/**
 * Gastos: a gross yield drawn as a stack of six slabs, slightly fanned at
 * rest. The pointer splits the stack at the slab under it: everything above
 * lifts away, what is left is what you keep. The slider is the split's gap.
 */
const { Cam, clamp, facing, fit, proj, prism, rings, solid, put, tset, tval, tdone, tween, disposer, mk, pointer, register } = HL;

const N = 6, S = 70, T = 8, REST = 2.4;
const z0 = (i, gap) => i * (T + REST) + gap;

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let gap = value;
  const C = Cam(45, 0.5, 1.75);
  const ZT = (N - 1) * (T + REST) + T;
  fit(C, [[0, 0, 0], [S, S, 0], [S, 0, 0], [0, S, 0], [0, 0, ZT], [S, 0, ZT], [0, S, ZT]], 200, 160);
  const P = proj(C), front = facing(C);
  const g = mk("g", {}, svg);
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
hairline({ name: "gastos", means: "A yield as a stack: the pointer lifts away the costs above it, and what stays is what you keep.", rules: [1, 2, 5, 6], range: [10, 18, 28], tour: [[200, 200], [200, 160], [200, 120], null], mount });
