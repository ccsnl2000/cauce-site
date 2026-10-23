/**
 * Fuentes: two columns on one plate, one 2.8 times the other: the same city
 * measured by two sources. A dashed guide at the tall one's height shows the
 * gap. The column under the pointer rises by the slider; the tall one is
 * bright at rest.
 */
const { Cam, facing, fit, open, proj, prism, rings, solid, put, tset, tval, tdone, tween, disposer, mk, pointer, register } = HL;

const PW = 150, PD = 70, TH = 6, CW = 34, CD = 34;
const COLS = [{ x: 26, h: 72 }, { x: 90, h: 26 }];

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let rise = value;
  const C = Cam(45, 0.5, 1.7);
  fit(C, [[0, 0, -TH], [PW, PD, -TH], [PW, 0, 0], [0, PD, 0], [COLS[0].x, 18, COLS[0].h]], 200, 160);
  const P = proj(C), front = facing(C);
  const g = mk("g", {}, svg);
  const [pr, pi] = rings(0, 0, PW, PD, 8, 1.6);
  put(solid(g), prism(P, front, pr, pi, -TH, 0));
  mk("path", { d: open([P(COLS[0].x + CW, 18 + CD, COLS[0].h), P(COLS[1].x + CW, 18 + CD, COLS[0].h)]), class: "nf dash" }, g);
  const cols = COLS.map((c) => { const [r, i] = rings(c.x, 18, c.x + CW, 18 + CD, 4, 1.4); return { r, i, s: solid(g), z: tween(c.h), h: c.h, last: -1 }; });
  const B = register(stage, (_dt, now) => {
    let m = false;
    cols.forEach((c) => { const h = tval(c.z, now); if (Math.abs(h - c.last) > 0.01) { c.last = h; put(c.s, prism(P, front, c.r, c.i, 0, h)); } if (!tdone(c.z, now)) m = true; });
    return m;
  });
  bag.add(B.unregister);
  const cx = COLS.map((c) => P(c.x + CW / 2, 18 + CD / 2, 0)[0]);
  const hit = ([x, y]) => (y < 40 || y > 290 ? -1 : Math.abs(x - cx[0]) < Math.abs(x - cx[1]) ? 0 : 1);
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
hairline({ name: "fuentes", means: "Two sources, one city: one column stands 2.8 times the other, and the dashed line shows the gap.", rules: [4, 5, 9, 10], range: [6, 14, 22], tour: [[170, 150], [235, 185], null], mount });
