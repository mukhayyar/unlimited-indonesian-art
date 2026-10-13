// Deterministic randomness: a seeded PRNG and Perlin noise.
// Everything in Unlimited Indonesian Art derives from one seed, so the same
// seed always paints the same infinite scene (like shan-shui-inf).

// --- string -> 32-bit seed ------------------------------------------------
export function hashSeed(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^= h >>> 16) >>> 0;
}

// --- Mulberry32: tiny, fast, deterministic PRNG ---------------------------
export function mulberry32(seed) {
  let a = seed >>> 0;
  const rng = () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  // Convenience helpers hung off the rng function.
  rng.range = (lo, hi) => lo + (hi - lo) * rng();
  rng.int = (lo, hi) => Math.floor(rng.range(lo, hi + 1));
  rng.chance = (p) => rng() < p;
  rng.pick = (arr) => arr[Math.floor(rng() * arr.length)];
  return rng;
}

// A sub-generator keyed by a base seed and integers (e.g. chunk index) so each
// chunk is independent yet reproducible.
export function subSeed(base, ...ints) {
  let h = base >>> 0;
  for (const n of ints) {
    h = Math.imul(h ^ (n | 0), 2654435761) >>> 0;
    h = ((h << 13) | (h >>> 19)) >>> 0;
  }
  return h >>> 0;
}

// --- Perlin noise (classic Ken Perlin), permutation from the seed ---------
export class Perlin {
  constructor(seed) {
    const rng = mulberry32(seed);
    const p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) p[i] = i;
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [p[i], p[j]] = [p[j], p[i]];
    }
    this.perm = new Uint8Array(512);
    for (let i = 0; i < 512; i++) this.perm[i] = p[i & 255];
  }
  _fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
  _lerp(a, b, t) { return a + t * (b - a); }
  _grad(h, x, y) {
    const u = (h & 1) ? -x : x;
    const v = (h & 2) ? -y : y;
    return u + v;
  }
  // 2D noise in roughly [-1, 1].
  noise2D(x, y) {
    const X = Math.floor(x) & 255, Y = Math.floor(y) & 255;
    const xf = x - Math.floor(x), yf = y - Math.floor(y);
    const u = this._fade(xf), v = this._fade(yf);
    const p = this.perm;
    const aa = p[p[X] + Y], ab = p[p[X] + Y + 1];
    const ba = p[p[X + 1] + Y], bb = p[p[X + 1] + Y + 1];
    const x1 = this._lerp(this._grad(aa, xf, yf), this._grad(ba, xf - 1, yf), u);
    const x2 = this._lerp(this._grad(ab, xf, yf - 1), this._grad(bb, xf - 1, yf - 1), u);
    return this._lerp(x1, x2, v);
  }
  // Continuous 1D noise over world-x (seamless across chunks).
  noise1D(x) { return this.noise2D(x, 0.5); }
  // Fractal Brownian motion: layered octaves for natural, continuous terrain.
  fbm1D(x, octaves = 4, lacunarity = 2, gain = 0.5) {
    let amp = 0.5, freq = 1, sum = 0, norm = 0;
    for (let o = 0; o < octaves; o++) {
      sum += amp * this.noise1D(x * freq);
      norm += amp;
      amp *= gain;
      freq *= lacunarity;
    }
    return sum / norm; // ~[-1, 1]
  }
}
