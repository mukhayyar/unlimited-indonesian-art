// The infinite world: deterministic chunks laid out over world-x, each a band
// of sky, volcanoes, a coastline of heritage motifs, and a sea of pinisi.
import { mulberry32, subSeed, Perlin } from './prng.js';
import { poly, polygon, smoothOpen, group } from './brush.js';
import {
  gunung, megaMendung, candiBorobudur, candiPrambanan, rumahGadang,
  pohonKelapa, gunungan, pinisi, perahu, matahari, burung,
} from './motifs.js';

// Fixed internal coordinate system; the SVG scales to the container via viewBox.
export const VW = 1280;
export const VH = 720;
export const HORIZON = 300;   // volcano base line
export const LY = 470;        // sea surface / coastline baseline
export const CHUNK = 440;     // world-px per chunk

const LAND_PICKS = [
  { fn: pohonKelapa, w: 5, s: [70, 120] },
  { fn: candiBorobudur, w: 2, s: [60, 95] },
  { fn: candiPrambanan, w: 2, s: [55, 85] },
  { fn: rumahGadang, w: 2, s: [55, 80] },
  { fn: gunungan, w: 1, s: [90, 130] },
];
function weightedPick(rng, picks) {
  const total = picks.reduce((a, p) => a + p.w, 0);
  let r = rng() * total;
  for (const p of picks) { if ((r -= p.w) <= 0) return p; }
  return picks[0];
}

export class World {
  constructor(seed) {
    this.seed = seed >>> 0;
    this.land = new Perlin(subSeed(this.seed, 101));
    this.wave = new Perlin(subSeed(this.seed, 202));
    this.cache = new Map();
    // One sun/moon fixed in world space so it drifts as you scroll.
    const r = mulberry32(subSeed(this.seed, 7));
    this.sun = { x: r.range(0, 4000), y: r.range(70, 170), r: r.range(34, 52) };
  }

  landTop(worldX) {
    // Continuous coastline silhouette (seamless across chunk edges).
    return LY - 46 - this.land.fbm1D(worldX * 0.0016, 4) * 46;
  }

  chunk(c, pal) {
    const key = c + ':' + pal.name;
    if (this.cache.has(key)) return this.cache.get(key);
    const rng = mulberry32(subSeed(this.seed, c));
    const x0 = c * CHUNK;
    let back = '', front = '';

    // sun/moon (only in the chunk that contains it)
    if (this.sun.x >= x0 && this.sun.x < x0 + CHUNK) back += matahari(this.sun.x, this.sun.y, this.sun.r, pal);

    // far volcanoes
    const nM = rng.int(0, 2);
    for (let i = 0; i < nM; i++) {
      const mx = x0 + rng() * CHUNK;
      back += gunung(mx, HORIZON + rng.range(-6, 26), rng.range(150, 300), rng, pal, pal.far);
    }
    // mega mendung clouds
    const nC = rng.int(1, 3);
    for (let i = 0; i < nC; i++) back += megaMendung(x0 + rng() * CHUNK, rng.range(55, 170), rng.range(26, 46), rng, pal);
    // a flock of birds now and then
    if (rng.chance(0.4)) {
      const bx = x0 + rng() * CHUNK, by = rng.range(90, 200);
      for (let k = 0; k < rng.int(2, 5); k++) back += burung(bx + k * 16 + rng() * 8, by + (rng() - 0.5) * 18, rng.range(7, 11), pal);
    }

    // coastline land fill
    const step = 40, pts = [];
    for (let wx = x0; wx <= x0 + CHUNK + step; wx += step) pts.push([wx, this.landTop(wx)]);
    let d = `M ${x0} ${VH} L ${pts[0][0]} ${pts[0][1]}`;
    for (const p of pts) d += ` L ${p[0]} ${p[1]}`;
    d += ` L ${x0 + CHUNK} ${VH} Z`;
    back += `<path d="${d}" fill="${pal.mid}" opacity="0.9"/>`;
    back += `<path d="${d}" fill="none" stroke="${pal.ink}" stroke-width="1.5" opacity="0.3"/>`;

    // planted heritage motifs along the coast
    const nE = rng.int(1, 3);
    for (let i = 0; i < nE; i++) {
      const ex = x0 + (i + rng()) * (CHUNK / (nE + 0.5));
      const pick = weightedPick(rng, LAND_PICKS);
      const s = rng.range(pick.s[0], pick.s[1]);
      back += pick.fn(ex, this.landTop(ex) + 4, s, rng, pal);
    }

    // --- sea foreground ---
    for (let row = 0; row < 5; row++) {
      const y = LY + 18 + row * ((VH - LY) / 5);
      const wp = [];
      for (let wx = x0 - 20; wx <= x0 + CHUNK + 20; wx += 26) {
        wp.push([wx, y + this.wave.noise2D(wx * 0.02, row * 1.3) * (4 + row)]);
      }
      front += smoothOpen(wp, { stroke: pal.seaHi, sw: 1.2, opacity: 0.25 + row * 0.08 });
    }
    // ships: pinisi (depth by y) and small perahu
    if (rng.chance(0.7)) {
      const sy = rng.range(LY + 40, VH - 70), depth = (sy - LY) / (VH - LY);
      front += pinisi(x0 + rng() * CHUNK, sy, rng.range(26, 40) * (0.7 + depth * 0.7), rng, pal);
    }
    if (rng.chance(0.6)) {
      const sy = rng.range(LY + 30, VH - 40);
      front += perahu(x0 + rng() * CHUNK, sy, rng.range(16, 30), pal);
    }

    const out = { back: group(back), front: group(front) };
    this.cache.set(key, out);
    return out;
  }
}

// --- the batik frame drawn over the viewport (parang rusak slashes) --------
export function batikFrame(pal, w = VW, h = VH) {
  const band = 26;
  let out = `<rect x="0" y="0" width="${w}" height="${band}" fill="${pal.ink}" opacity="0.92"/>`;
  out += `<rect x="0" y="${h - band}" width="${w}" height="${band}" fill="${pal.ink}" opacity="0.92"/>`;
  // parang rusak: repeating diagonal rounded slashes in gold
  for (let x = -band; x < w + band; x += 22) {
    for (const yy of [0, h - band]) {
      const d = `M ${x} ${yy + band} q 8 -${band * 0.6} 16 -${band} q -3 ${band * 0.7} -10 ${band}`;
      out += `<path d="${d}" fill="none" stroke="${pal.gold}" stroke-width="3" stroke-linecap="round" opacity="0.8"/>`;
    }
  }
  // thin inner keylines
  out += `<rect x="3" y="3" width="${w - 6}" height="${h - 6}" fill="none" stroke="${pal.gold}" stroke-width="1.2" opacity="0.5"/>`;
  return out;
}
