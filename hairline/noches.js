/**
 * Noches: a month of nights as a 7 × 4 grid of tiles; the occupied nights
 * (about a third) stand raised. The pointer lifts the tile under it and its
 * neighbours less, outward by distance. The slider is how high they lift.
 */
const { Cam, clamp, facing, fit, proj, prism, rings, unproj, solid, put, tset, tval, tdone, tween, disposer, mk, pointer, register } = HL;

const CX = 7, CY = 4, T = 16, GP = 5, M = 8, TH = 5;
const W = M * 2 + CX * T + (CX - 1) * GP, D = M * 2 + CY * T + (CY - 1) * GP;
const BUSY = new Set([1, 4, 5, 9, 12, 16, 19, 23, 26]);
const at = (i) => [M + (i % CX) * (T + GP), M + Math.floor(i / CX) * (T + GP)];
const restH = (i) => (BUSY.has(i) ? 10 : 2);

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let lift = value;
  const C = Cam(45, 0.5, 1.55);
  fit(C, [[0, 0, -TH], [W, D, -TH], [W, 0, 0], [0, D, 0], [W / 2, D / 2, 10]], 200, 160);
  const P = proj(C), front = facing(C);
  const g = mk("g", {}, svg);
  const [pr, pi] = rings(0, 0, W, D, 7, 1.6);
  put(solid(g), prism(P, front, pr, pi, -TH, 0));
  const N = CX * CY, order = [...Array(N).keys()].sort((a, b) => at(a)[0] + at(a)[1] - (at(b)[0] + at(b)[1]));
  const tiles = [];
  order.forEach((i) => { const [x, y] = at(i), [r, inn] = rings(x, y, x + T, y + T, 2.6, 1.2); tiles[i] = { r, inn, s: solid(g), z: tween(restH(i)), last: -1 }; });
  const B = register(stage, (_dt, now) => {
    let m = false;
    tiles.forEach((t) => { const h = tval(t.z, now); if (Math.abs(h - t.last) > 0.01) { t.last = h; put(t.s, prism(P, front, t.r, t.inn, 0, h)); } if (!tdone(t.z, now)) m = true; });
    return m;
  });
  bag.add(B.unregister);
  function hit([sx, sy]) {
    const [wx, wy] = unproj(C, sx, sy, 2);
    if (wx < 0 || wy < 0 || wx > W || wy > D) return -1;
    return clamp(Math.floor((wy - M + GP / 2) / (T + GP)), 0, CY - 1) * CX + clamp(Math.floor((wx - M + GP / 2) / (T + GP)), 0, CX - 1);
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
hairline({ name: "noches", means: "A month of nights: the raised tiles are the booked ones, about a third of them.", rules: [1, 2, 3, 5], range: [8, 16, 26], tour: [[160, 150], [210, 165], [250, 175], null], mount });
