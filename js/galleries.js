// The galleries. Each is its own infinite, seeded line-art generator with a
// distinct subject, all sharing the brush engine so the site reads as one hand.
import { mulberry32, subSeed, Perlin } from './prng.js';
import { raw, group, circle, curve, blob, brush, hatch, curl, ink } from './brush.js';
import { VW, VH, CHUNK, hill, gunung, awan, pohon, ombak, matahari, burung } from './common.js';

const R = (seed, c) => mulberry32(subSeed(seed, c));

// ====================== gallery-specific motifs ===========================

// Candi Borobudur as line art: curvy stepped platforms + bell stupas.
function candiBorobudur(x, baseY, s, rng, pal) {
  let out = ''; let w = s * 1.7, y = baseY;
  for (let i = 0; i < 4; i++) {
    const h = s * 0.3;
    out += curve([[x - w, y], [x - w, y - h], [x + w, y - h], [x + w, y]], { stroke: pal.ink, sw: 1.7, opacity: 0.9 });
    out += hatch(x - w, y - h, w * 2, h, 20, 7, pal, 0.1);
    y -= h; w *= 0.8;
  }
  for (let row = 0; row < 2; row++) {
    const n = 5 - row * 2;
    for (let k = 0; k < n; k++) out += bell(x - w + (2 * w) * (k / (n - 1 || 1)), y, s * (0.15 - row * 0.02), pal);
    y -= s * 0.24; w *= 0.72;
  }
  out += bell(x, y + s * 0.06, s * 0.32, pal);
  return group(out);
}
function bell(x, baseY, r, pal) {
  let out = curve([[x - r, baseY], [x - r * 0.9, baseY - r * 1.2], [x, baseY - r * 1.7], [x + r * 0.9, baseY - r * 1.2], [x + r, baseY]], { stroke: pal.ink, sw: 1.3, opacity: 0.85 });
  out += raw(`M ${x} ${baseY - r * 1.7} L ${x} ${baseY - r * 2.1}`, { stroke: pal.ink, sw: 1.3, opacity: 0.85 });
  return out;
}
// Prambanan: tall tapering line-art spire.
function candiPrambanan(x, baseY, s, rng, pal) {
  let out = ''; let w = s * 0.8, y = baseY;
  for (let i = 0; i < 6; i++) {
    const h = s * 0.34;
    out += curve([[x - w, y], [x - w, y - h], [x + w, y - h], [x + w, y]], { stroke: pal.ink, sw: 1.6, opacity: 0.9 });
    y -= h; w *= 0.84;
  }
  out += curve([[x - w, y], [x, y - s * 0.5], [x + w, y]], { stroke: pal.ink, sw: 1.5, opacity: 0.9 });
  out += circle(x, y - s * 0.56, s * 0.12, { stroke: pal.ink, sw: 1.4, opacity: 0.9 });
  return group(out);
}

// Kapal Pinisi in line art: curvy hull, brush masts, outlined sails, rigging.
function pinisi(x, seaY, s, rng, pal) {
  const hw = s * 2.2, hh = s * 0.42;
  let out = curve([[x - hw, seaY], [x - hw * 1.05, seaY - hh * 1.5], [x - hw * 0.7, seaY - hh], [x + hw * 0.8, seaY - hh], [x + hw * 1.15, seaY - hh * 1.9], [x + hw, seaY], [x, seaY + hh * 0.5], [x - hw, seaY]], { stroke: pal.ink, sw: 2, opacity: 0.95 });
  out += hatch(x - hw * 0.7, seaY - hh, hw * 1.5, hh, 0, 6, pal, 0.12);
  const mast = (mx, mh, rake) => { const tx = mx + rake, ty = seaY - hh - mh; out += brush([[mx, seaY - hh], [tx, ty]], (t) => (1 - t) * s * 0.06 + 1.2, { fill: pal.ink, opacity: 0.9 }); return [tx, ty]; };
  const [m1x, m1y] = mast(x - hw * 0.3, s * 2, s * 0.26);
  const [m2x, m2y] = mast(x + hw * 0.35, s * 1.6, s * 0.2);
  const sail = (ax, ay, bx, by, cx, cy) => {
    out += blob([[ax, ay], [bx, by], [cx, cy]], { fill: pal.paper1, stroke: pal.ink, sw: 1.3, opacity: 0.95 });
    out += curve([[ax, ay], [(ax + cx) / 2 - 4, (ay + cy) / 2], [cx, cy]], { stroke: pal.inkSoft, sw: 0.8, opacity: 0.4 });
  };
  sail(m1x, m1y, x - hw * 0.3, seaY - hh, x + hw * 0.1, seaY - hh);
  sail(m1x, m1y, x + hw * 0.1, seaY - hh, m2x, m2y);
  sail(m2x, m2y, x + hw * 0.35, seaY - hh, x + hw * 0.72, seaY - hh);
  sail(m2x, m2y, x + hw * 0.72, seaY - hh, x + hw * 0.92, seaY - hh * 2.2);
  const bow = x + hw * 1.02;
  sail(m1x, m1y, bow, seaY - hh, x + hw * 0.5, seaY - hh);
  sail(m1x, m1y + s * 0.5, bow, seaY - hh, x + hw * 0.5, seaY - hh * 1.3);
  sail(m1x, m1y + s, bow, seaY - hh, x + hw * 0.5, seaY - hh * 1.7);
  return group(out);
}
function perahu(x, seaY, s, pal) {
  let out = curve([[x - s, seaY], [x, seaY + s * 0.4], [x + s, seaY]], { stroke: pal.ink, sw: 1.6, opacity: 0.9 });
  out += brush([[x, seaY], [x, seaY - s * 0.9]], 2, { fill: pal.ink, opacity: 0.8 });
  out += blob([[x, seaY - s * 0.9], [x, seaY - s * 0.1], [x + s * 0.7, seaY - s * 0.15]], { fill: pal.paper1, stroke: pal.ink, sw: 1.2, opacity: 0.95 });
  return out;
}

// Gunungan / kayon — the wayang tree-of-life, ornate line art.
function gunungan(x, baseY, s, rng, pal) {
  const w = s * 0.92, h = s * 2.3, top = baseY - h;
  const outline = [[x, baseY], [x - w, baseY - h * 0.12], [x - w * 0.5, baseY - h * 0.5], [x - w * 0.82, baseY - h * 0.72], [x - w * 0.3, baseY - h * 0.9], [x, top], [x + w * 0.3, baseY - h * 0.9], [x + w * 0.82, baseY - h * 0.72], [x + w * 0.5, baseY - h * 0.5], [x + w, baseY - h * 0.12], [x, baseY]];
  let out = blob(outline, { fill: pal.wash, stroke: 'none', opacity: 0.08 });
  out += curve(outline, { stroke: pal.ink, sw: 2.1, opacity: 0.95 });
  out += curve(outline.map(([px, py]) => [x + (px - x) * 0.86, py + (baseY - py) * 0.04]), { stroke: pal.gold, sw: 1.1, opacity: 0.6 });
  // central tree of life
  out += brush([[x, baseY - h * 0.08], [x, baseY - h * 0.55]], (t) => (1 - t) * 5 + 1.4, { fill: pal.ink, opacity: 0.9 });
  for (let i = 0; i < 5; i++) {
    const yy = baseY - h * (0.22 + i * 0.07), ww = w * (0.4 - i * 0.05);
    out += curve([[x - ww, yy + 4], [x, yy - s * 0.1], [x + ww, yy + 4]], { stroke: pal.ink, sw: 1.1, opacity: 0.6 });
    out += curl(x - ww, yy + 4, 4, -1, pal, 1); out += curl(x + ww, yy + 4, 4, 1, pal, 1);
  }
  // gate / gapura at the base
  out += curve([[x - w * 0.26, baseY], [x - w * 0.26, baseY - h * 0.17], [x + w * 0.26, baseY - h * 0.17], [x + w * 0.26, baseY]], { stroke: pal.ink, sw: 1.3, opacity: 0.7 });
  // edge filigree
  for (let i = 1; i < 6; i++) { const t = i / 6; out += curl(x - w * (1 - t) * 0.9, baseY - h * t * 0.5, 4, -1, pal, 0.9); out += curl(x + w * (1 - t) * 0.9, baseY - h * t * 0.5, 4, 1, pal, 0.9); }
  return group(out);
}

// A stylised wayang figure (ksatria) in line art — slim, crowned, filigreed.
function wayangFigure(x, baseY, s, rng, pal) {
  const faceX = x - s * 0.15;
  let out = '';
  // body (sarong + torso) as a slim curvy silhouette
  out += curve([[x - s * 0.22, baseY], [x - s * 0.3, baseY - s * 0.9], [x - s * 0.1, baseY - s * 1.5], [x - s * 0.18, baseY - s * 1.9]], { stroke: pal.ink, sw: 1.9, opacity: 0.95 });
  out += curve([[x + s * 0.3, baseY], [x + s * 0.34, baseY - s * 0.9], [x + s * 0.12, baseY - s * 1.5], [x + s * 0.02, baseY - s * 1.95]], { stroke: pal.ink, sw: 1.9, opacity: 0.95 });
  // long thin arm
  out += brush([[x - s * 0.05, baseY - s * 1.55], [x - s * 0.5, baseY - s * 1.1], [x - s * 0.75, baseY - s * 0.5]], (t) => (1 - t) * 3 + 1, { fill: pal.ink, opacity: 0.9 });
  // head profile + crown (gelung)
  out += curve([[faceX, baseY - s * 1.95], [faceX - s * 0.18, baseY - s * 2.05], [faceX - s * 0.1, baseY - s * 2.25], [faceX + s * 0.05, baseY - s * 2.2], [faceX + s * 0.1, baseY - s * 2.0]], { stroke: pal.ink, sw: 1.7, opacity: 0.95 });
  out += curl(faceX + s * 0.02, baseY - s * 2.28, s * 0.14, 1, pal, 1.4); // crown ornament
  out += circle(faceX - s * 0.05, baseY - s * 2.08, 1.6, { fill: pal.ink }); // eye
  // sabuk + filigree dots
  for (let i = 0; i < 5; i++) out += circle(x - s * 0.1 + i * s * 0.06, baseY - s * 1.0, 1.3, { fill: pal.inkSoft, opacity: 0.7 });
  return group(out);
}

// ===== batik tiling motifs (seamless on world-x) =====
function batikTile(kind, cx, cy, u, pal) {
  let out = '';
  if (kind === 'kawung') {
    for (const [ox, oy] of [[-u * 0.5, 0], [u * 0.5, 0], [0, -u * 0.5], [0, u * 0.5]])
      out += blob([[cx + ox, cy + oy - u * 0.28], [cx + ox + u * 0.2, cy + oy], [cx + ox, cy + oy + u * 0.28], [cx + ox - u * 0.2, cy + oy]], { stroke: pal.ink, sw: 1.3, opacity: 0.8 });
    out += circle(cx, cy, 1.6, { fill: pal.ink });
  } else if (kind === 'ceplok') {
    out += circle(cx, cy, u * 0.3, { stroke: pal.ink, sw: 1.3, opacity: 0.8 });
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; out += circle(cx + Math.cos(a) * u * 0.42, cy + Math.sin(a) * u * 0.42, u * 0.1, { stroke: pal.ink, sw: 1, opacity: 0.7 }); }
  } else { // parang — diagonal slash with a scroll
    out += brush([[cx - u * 0.45, cy + u * 0.45], [cx, cy], [cx + u * 0.45, cy - u * 0.45]], (t) => Math.sin(Math.PI * t) * u * 0.14 + 1, { fill: pal.wash2, opacity: 0.55 });
    out += curl(cx + u * 0.45, cy - u * 0.45, u * 0.14, 1, pal, 1.1);
    out += circle(cx - u * 0.2, cy + u * 0.2, 1.4, { fill: pal.ink, opacity: 0.6 });
  }
  return out;
}

// ============================ gallery specs ===============================
function landscapeBase(id, name, pal0, builder) {
  return {
    id, name, defaultPalette: pal0,
    create(seed) {
      const terr = new Perlin(subSeed(seed, 11)), wv = new Perlin(subSeed(seed, 22));
      const sun = (() => { const r = mulberry32(subSeed(seed, 7)); return { x: r.range(0, 3500), y: r.range(70, 150), r: r.range(30, 48) }; })();
      return {
        background: () => `<rect width="${VW}" height="${VH}" fill="url(#paper)"/>`,
        chunk: (c, pal) => builder(c, pal, { rng: R(seed, c), terr, wv, sun, seed }),
      };
    },
  };
}

export const GALLERIES = [
  // --- Gunung: volcanic landscape ---
  landscapeBase('gunung', 'Gunung', 'klasik', (c, pal, ctx) => {
    const { rng, terr, sun } = ctx, x0 = c * CHUNK; let back = '', front = '';
    if (sun.x >= x0 && sun.x < x0 + CHUNK) back += matahari(sun.x, sun.y, sun.r, pal, pal.name.includes('Malam'));
    for (let i = 0; i < rng.int(1, 2); i++) back += gunung(x0 + rng() * CHUNK, 330 + rng.range(-10, 20), rng.range(170, 300), rng, pal);
    for (let i = 0; i < rng.int(1, 2); i++) back += awan(x0 + rng() * CHUNK, rng.range(60, 150), rng.range(26, 40), rng, pal);
    back += hill(terr, x0, x0 + CHUNK, 470, 46, pal);
    for (let i = 0; i < rng.int(1, 3); i++) { const ex = x0 + rng() * CHUNK; back += pohon(ex, 470 - terr.fbm1D(ex * 0.0016, 4) * 46 + 6, rng.range(55, 95), rng, pal); }
    if (rng() < 0.4) for (let k = 0; k < 3; k++) back += burung(x0 + rng() * CHUNK + k * 16, rng.range(90, 180), 9, pal);
    return { back: group(back), front: group(front) };
  }),

  // --- Candi: temple hills ---
  landscapeBase('candi', 'Candi', 'klasik', (c, pal, ctx) => {
    const { rng, terr } = ctx, x0 = c * CHUNK; let back = '';
    for (let i = 0; i < rng.int(1, 2); i++) back += awan(x0 + rng() * CHUNK, rng.range(55, 150), rng.range(24, 40), rng, pal);
    if (rng() < 0.5) back += gunung(x0 + rng() * CHUNK, 300, rng.range(150, 230), rng, pal, { tone: pal.wash2 });
    back += hill(terr, x0, x0 + CHUNK, 500, 40, pal);
    const ex = x0 + CHUNK * 0.5, gy = 500 - terr.fbm1D(ex * 0.0016, 4) * 40 + 6;
    back += (rng() < 0.5 ? candiBorobudur : candiPrambanan)(ex, gy, rng.range(60, 95), rng, pal);
    if (rng() < 0.6) back += pohon(x0 + rng() * CHUNK * 0.3, 500 - terr.fbm1D((x0) * 0.0016, 4) * 40 + 6, rng.range(50, 80), rng, pal);
    return { back: group(back), front: '' };
  }),

  // --- Bahari: pinisi on the sea ---
  landscapeBase('bahari', 'Bahari', 'klasik', (c, pal, ctx) => {
    const { rng, terr, wv } = ctx, x0 = c * CHUNK, LY = 430; let back = '', front = '';
    for (let i = 0; i < rng.int(1, 2); i++) back += awan(x0 + rng() * CHUNK, rng.range(50, 130), rng.range(24, 38), rng, pal);
    if (rng() < 0.6) back += gunung(x0 + rng() * CHUNK, LY, rng.range(120, 220), rng, pal, { tone: pal.wash2 });
    for (let row = 0; row < 7; row++) front += ombak(wv, x0, x0 + CHUNK, LY + 20 + row * ((VH - LY) / 7), pal, row);
    if (rng() < 0.75) { const sy = rng.range(LY + 40, VH - 90), d = (sy - LY) / (VH - LY); front += pinisi(x0 + rng() * CHUNK, sy, rng.range(26, 40) * (0.7 + d * 0.6), rng, pal); }
    if (rng() < 0.6) front += perahu(x0 + rng() * CHUNK, rng.range(LY + 30, VH - 50), rng.range(16, 28), pal);
    return { back: group(back), front: group(front) };
  }),

  // --- Wayang: the kelir, gunungan and figures (the unique one) ---
  {
    id: 'wayang', name: 'Wayang', defaultPalette: 'malam',
    create(seed) {
      const terr = new Perlin(subSeed(seed, 33));
      return {
        background: (pal) => `<rect width="${VW}" height="${VH}" fill="url(#paper)"/>` +
          `<ellipse cx="${VW / 2}" cy="${VH * 0.42}" rx="${VW * 0.7}" ry="${VH * 0.6}" fill="url(#glow)"/>`,
        chunk: (c, pal) => {
          const rng = R(seed, c), x0 = c * CHUNK; let back = '';
          // the debog (banana-log ground line) with soft hatch
          back += raw(`M ${x0} 612 L ${x0 + CHUNK} 612`, { stroke: pal.ink, sw: 2, opacity: 0.7 });
          back += hatch(x0, 612, CHUNK, 30, 0, 8, pal, 0.12);
          const roll = rng();
          if (roll < 0.33) back += gunungan(x0 + CHUNK * 0.5, 610, rng.range(130, 180), rng, pal);
          else { const n = rng.int(1, 2); for (let i = 0; i < n; i++) back += wayangFigure(x0 + (i + 0.5) * (CHUNK / n), 610, rng.range(150, 210), rng, pal); }
          for (let i = 0; i < rng.int(0, 2); i++) back += awan(x0 + rng() * CHUNK, rng.range(80, 220), rng.range(20, 34), rng, pal);
          return { back: group(back), front: '' };
        },
      };
    },
  },

  // --- Batik: an endless cloth of motifs ---
  {
    id: 'batik', name: 'Batik', defaultPalette: 'klasik',
    create(seed) {
      return {
        background: () => `<rect width="${VW}" height="${VH}" fill="url(#paper)"/>`,
        chunk: (c, pal) => {
          const rng = R(seed, c), x0 = c * CHUNK; let back = '';
          const kind = ['kawung', 'ceplok', 'parang'][Math.abs(subSeed(seed, c) >> 4) % 3];
          const u = 64, cols = Math.ceil(CHUNK / u) + 1;
          for (let gy = 40; gy < VH - 20; gy += u) {
            for (let i = -1; i < cols; i++) {
              const cx = Math.floor(x0 / u) * u + i * u + (Math.round(gy / u) % 2 ? u / 2 : 0);
              back += batikTile(kind, cx, gy, u, pal);
            }
          }
          return { back: group(back), front: '' };
        },
      };
    },
  },
];
