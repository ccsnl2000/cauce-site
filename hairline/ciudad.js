/**
 * Ciudad: a block of the city, nine buildings on one plate, each a different
 * height. The building under the pointer rises; the ones around it rise less,
 * staggered outward by distance. At rest the tallest holds the bright edge.
 * The slider is how far the chosen building rises.
 *
 * Pattern: discrete items on a grid. Tweens, a stagger by distance, and a hit
 * test against each building's rest top, never the pose on screen.
 */
const {
  Cam, clamp, facing, fit, poly, proj, prism, rings, ringAt, rrect, unproj,
  solid, put, tset, tval, tdone, tween, disposer, mk, pointer, register,
} = HL;

const G = 3, BW = 30, GAP = 11, M = 12, TH = 6;
const SIDE = M * 2 + G * BW + (G - 1) * GAP;
const REST = [12, 26, 16, 30, 20, 38, 14, 22, 18];        // composed, never uniform (rule 05)
const at = (i) => [M + (i % G) * (BW + GAP), M + Math.floor(i / G) * (BW + GAP)];

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let rise = value;

  const C = Cam(45, 0.5, 1.52);
  fit(C, [[0, 0, -TH], [SIDE, SIDE, -TH], [SIDE, 0, 0], [0, SIDE, 0], ...REST.flatMap((h, i) => { const [x, y] = at(i); return [[x, y, h], [x + BW, y, h], [x, y + BW, h]]; })], 200, 160);
  const P = proj(C), front = facing(C);
  const g = mk("g", {}, svg);

  const [plate, plateIn] = rings(0, 0, SIDE, SIDE, 9, 1.6);
  put(solid(g), prism(P, front, plate, plateIn, -TH, 0));
  mk("path", { d: poly(ringAt(P, rrect(M - 5, M - 5, SIDE - M + 5, SIDE - M + 5, 6, 6), 0)), class: "nf dash" }, g);

  // back to front: ascending x + y
  const order = REST.map((_, i) => i).sort((a, b) => (at(a)[0] + at(a)[1]) - (at(b)[0] + at(b)[1]));
  const blocks = [];
  order.forEach((i) => {
    const [x, y] = at(i);
    const [ring, inner] = rings(x, y, x + BW, y + BW, 3.4, 1.4);
    blocks[i] = { ring, inner, s: solid(g), z: tween(REST[i]), last: -1 };
  });

  const draw = (b, h) => { if (Math.abs(h - b.last) < 0.01) return; b.last = h; put(b.s, prism(P, front, b.ring, b.inner, 0, h)); };
  const B = register(stage, (_dt, now) => {
    let moving = false;
    blocks.forEach((b) => { draw(b, tval(b.z, now)); if (!tdone(b.z, now)) moving = true; });
    return moving;
  });
  bag.add(B.unregister);

  /** The building whose rest top holds the point; the nearest to the viewer wins. */
  function hit([sx, sy]) {
    let best = -1, key = -1;
    REST.forEach((h, i) => {
      const [x, y] = at(i), [wx, wy] = unproj(C, sx, sy, h);
      if (wx >= x - 3 && wx <= x + BW + 3 && wy >= y - 3 && wy <= y + BW + 3 && x + y > key) { key = x + y; best = i; }
    });
    return best;
  }

  const tallest = REST.indexOf(Math.max(...REST));
  let act = -2;
  function setActive(a) {
    if (a === act) return;
    const now = performance.now(), from = a >= 0 ? a : Math.max(act, 0);
    act = a;
    blocks.forEach((b, i) => {
      const d = Math.abs((i % G) - (from % G)) + Math.abs(Math.floor(i / G) - Math.floor(from / G));
      const lift = a < 0 ? REST[i] : REST[i] + clamp(rise / (1 + d * 1.6), 0, rise) * (i === a ? 1 : 0.5);
      tset(b.z, lift, now, d * 45);
      b.s.sil.classList.toggle("hi", a < 0 ? i === tallest : i === a);
    });
    read.textContent = a < 0 ? "rest" : (a % G + 1) + "·" + (Math.floor(a / G) + 1);
    B.wake();
  }

  bag.add(pointer(stage, { move: (p) => setActive(hit(p)), leave: () => setActive(-1) }));
  bag.add(() => svg.replaceChildren());
  setActive(-1);

  return {
    set: (v) => { rise = v; if (act >= 0) { const a = act; act = -2; setActive(a); } },
    destroy: bag.dispose,
  };
}

hairline({
  name: "ciudad",
  means: "A city block: the building under the pointer rises, and the ones around it follow, less the farther they stand.",
  rules: [1, 2, 3, 5],
  range: [24, 42, 60],
  tour: [[170, 140], [215, 170], [250, 150], null],
  mount,
});
