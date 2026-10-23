/**
 * Lote: a rounded lot with a setback line and four buildings of different
 * heights. The building under the pointer rises to the height the slider
 * allows; its neighbours rise a little less, staggered outward from it.
 * At rest the tallest one holds the bright edge. The slider is that height.
 *
 * Pattern: discrete items (Riffle). Tweens, a stagger by distance, and a hit
 * test on each building's rest centre, so a rising block never flips the choice.
 */
const {
  Cam, clamp, facing, fit, poly, proj, prism, rings, ringAt, rrect,
  solid, put, tset, tval, tdone, tween, disposer, mk, pointer, register,
} = HL;

const LX = 172, LY = 104, LR = 8, TH = 6, SB = 9;          // lot size, corner radius, thickness, setback
const BW = 28, BD = 46, GAP = 10, BY0 = 30;                // building footprint and spacing
const REST = [18, 34, 14, 24];                             // composed rest heights (rule 05)
const NEAR = 0.45;                                         // how much a neighbour follows the chosen one
const N = REST.length, X0 = 16;
const bx = (i) => X0 + i * (BW + GAP);

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let maxH = value;

  const C = Cam(45, 0.5, 1.62);
  fit(C, [[0, 0, -TH], [LX, LY, -TH], [LX, 0, 0], [0, LY, 0], [bx(0), BY0, 90], [bx(N - 1) + BW, BY0 + BD, 90]], 200, 166);
  const P = proj(C), front = facing(C);
  const g = mk("g", {}, svg);

  // the lot: an opaque plate, then its setback guide on top
  const [lotRing, lotInner] = rings(0, 0, LX, LY, LR, 1.6);
  put(solid(g), prism(P, front, lotRing, lotInner, -TH, 0));
  mk("path", { d: poly(ringAt(P, rrect(SB, SB, LX - SB, LY - SB, LR - 3, 6), 0)), class: "nf dash" }, g);

  // buildings, back to front (ascending x)
  const blocks = REST.map((h, i) => {
    const [ring, inner] = rings(bx(i), BY0, bx(i) + BW, BY0 + BD, 3.2, 1.4);
    const s = solid(g);
    return { ring, inner, s, z: tween(h), last: -1 };
  });

  function draw(b, h) {
    if (Math.abs(h - b.last) < 0.01) return;
    b.last = h;
    put(b.s, prism(P, front, b.ring, b.inner, 0, h));
  }

  const B = register(stage, (_dt, now) => {
    let moving = false;
    blocks.forEach((b) => { draw(b, tval(b.z, now)); if (!tdone(b.z, now)) moving = true; });
    return moving;
  });
  bag.add(B.unregister);

  // hit test on rest poses: nearest rest centre on screen x, inside the lot's band (rule 01)
  const centres = blocks.map((_, i) => P(bx(i) + BW / 2, BY0 + BD / 2, REST[i]));
  const top = Math.min(...centres.map((c) => c[1])) - 60, bottom = P(LX, LY, -TH)[1] + 6;
  const left = P(0, LY, 0)[0] - 6, right = P(LX, 0, 0)[0] + 6;
  function hit([x, y]) {
    if (x < left || x > right || y < top || y > bottom) return -1;
    let best = -1, d = 1e9;
    centres.forEach((c, i) => { const k = Math.abs(c[0] - x); if (k < d) { d = k; best = i; } });
    return d < BW * 1.4 ? best : -1;
  }

  const tallest = REST.indexOf(Math.max(...REST));
  let act = -2;
  function setActive(a) {
    if (a === act) return;
    const now = performance.now(), from = a >= 0 ? a : Math.max(act, 0);
    act = a;
    blocks.forEach((b, i) => {
      const lift = a < 0 ? REST[i] : i === a ? maxH : clamp(REST[i] + (maxH - REST[i]) * NEAR / (1 + Math.abs(i - a)), REST[i], maxH);
      tset(b.z, lift, now, Math.abs(i - from) * 45);
      b.s.sil.classList.toggle("hi", a < 0 ? i === tallest : i === a);
    });
    read.textContent = a < 0 ? "rest" : "0" + (a + 1);
    B.wake();
  }

  bag.add(pointer(stage, { move: (p) => setActive(hit(p)), leave: () => setActive(-1) }));
  bag.add(() => svg.replaceChildren());
  setActive(-1);

  return {
    set: (v) => { maxH = v; if (act >= 0) { const a = act; act = -2; setActive(a); } },
    destroy: bag.dispose,
  };
}

hairline({
  name: "lote",
  means: "A lot and what it can hold: the building under the pointer rises to the height the zoning allows.",
  rules: [1, 2, 5, 9],
  range: [40, 62, 84],
  tour: [[150, 150], [205, 170], [255, 190], null],
  mount,
});
