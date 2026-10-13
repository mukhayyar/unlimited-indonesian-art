// Shared line-art motifs, drawn with the brush engine (curvy, ink-on-paper).
import { raw, group, circle, curve, blob, brush, hatch, curl, ink } from './brush.js';

export const VW = 1280, VH = 760, CHUNK = 440;

// Paper background with a faint fibre texture.
export function paperBg(pal) {
  let out = `<rect width="${VW}" height="${VH}" fill="url(#paper)"/>`;
  return out;
}

// A continuous rolling hill: curvy top outline + soft hatch body.
export function hill(perlin, x0, x1, baseY, amp, pal, { tone = pal.wash, freq = 0.0016, hatchA = 24 } = {}) {
  const pts = [];
  for (let x = x0 - 20; x <= x1 + 20; x += 24) pts.push([x, baseY - perlin.fbm1D(x * freq, 4) * amp]);
  // fill wash under the ridge
  const fillPts = [[x0 - 20, VH], ...pts, [x1 + 20, VH]];
  let out = blob(fillPts, { fill: tone, stroke: 'none', opacity: 0.16 });
  out += curve(pts, { stroke: pal.ink, sw: 1.7, opacity: 0.9 });
  // a couple of soft contour lines below the ridge
  for (let k = 1; k <= 2; k++) {
    out += curve(pts.map(([x, y]) => [x, y + k * 10 + 6]), { stroke: pal.inkSoft, sw: 0.8, opacity: 0.25 });
  }
  return group(out);
}

// Volcano drawn as line art: two curvy flanks, crater, contour hatch, smoke curls.
export function gunung(x, baseY, h, rng, pal, { tone = pal.wash } = {}) {
  const w = h * (1.05 + rng() * 0.25), cr = w * 0.12, apex = baseY - h;
  const flankL = [[x - w, baseY], [x - w * 0.55, baseY - h * 0.5], [x - cr, apex + 6]];
  const flankR = [[x + cr, apex + 6], [x + w * 0.55, baseY - h * 0.5], [x + w, baseY]];
  const outline = [...flankL, ...flankR];
  let out = blob([[x - w, baseY], ...outline.slice(1, -1), [x + w, baseY]], { fill: tone, stroke: 'none', opacity: 0.12 });
  out += curve(flankL, { stroke: pal.ink, sw: 2, opacity: 0.95 });
  out += curve(flankR, { stroke: pal.ink, sw: 2, opacity: 0.95 });
  out += curve([[x - cr, apex + 6], [x, apex + 11], [x + cr, apex + 6]], { stroke: pal.ink, sw: 1.4, opacity: 0.8 }); // crater
  // interior contour strokes with brush taper
  for (let i = 0; i < 3; i++) {
    const t = 0.3 + i * 0.22;
    out += brush([[x - cr * 0.5, apex + h * 0.18 + i * 10], [x - w * t * 0.5, baseY - h * 0.25], [x - w * t * 0.8, baseY - 2]], 3.2 - i * 0.6, { fill: pal.inkSoft, opacity: 0.4 });
  }
  // smoke scrolls
  if (rng() < 0.7) {
    let sx = x, sy = apex;
    for (let i = 0; i < 3; i++) { out += curl(sx + (rng() - 0.5) * 10, sy - i * h * 0.16, h * 0.08 + i * 3, i % 2 ? 1 : -1, pal, 1.3); sy -= h * 0.16; }
  }
  return group(out);
}

// Mega mendung cloud as nested curly scrolls — pure line art.
export function awan(x, y, s, rng, pal) {
  let out = '';
  const lobes = 4 + Math.floor(rng() * 3);
  const top = [], bot = [];
  for (let i = 0; i <= lobes; i++) {
    const t = i / lobes;
    top.push([x - s + t * s * 2, y - Math.sin(t * Math.PI) * s * 0.6]);
    bot.push([x - s + t * s * 2, y + Math.sin(t * Math.PI + 0.5) * s * 0.1]);
  }
  out += blob([...top, ...bot.reverse()], { fill: pal.wash, stroke: 'none', opacity: 0.1 });
  out += curve(top, { stroke: pal.ink, sw: 1.6, opacity: 0.85 });
  // inner echo lines (the mega-mendung gradation)
  for (let k = 1; k <= 3; k++) out += curve(top.map(([px, py]) => [px, py + k * 6]), { stroke: pal.inkSoft, sw: 1, opacity: 0.4 - k * 0.07 });
  // end scroll
  out += curl(top[top.length - 1][0], top[top.length - 1][1] + 2, s * 0.22, 1, pal, 1.4);
  out += curl(top[0][0], top[0][1] + 2, s * 0.22, -1, pal, 1.4);
  return group(out);
}

// Coconut palm in brush strokes.
export function pohon(x, baseY, s, rng, pal) {
  const lean = (rng() - 0.5) * s * 0.5, tx = x + lean, ty = baseY - s * 2;
  let out = brush([[x, baseY], [x + lean * 0.4, baseY - s], [tx, ty]], (t) => (1 - t) * s * 0.13 + 1.5, { fill: pal.ink, opacity: 0.9 });
  const n = 7;
  for (let i = 0; i < n; i++) {
    const ang = Math.PI + Math.PI * (0.12 + 0.76 * (i / (n - 1)));
    const ex = tx + Math.cos(ang) * s * 1.0, ey = ty - Math.sin(ang) * s * 0.5 + s * 0.5;
    out += brush([[tx, ty], [(tx + ex) / 2, ty + (ey - ty) * 0.3 - s * 0.18], [ex, ey]], (t) => (1 - t) * 6 + 0.6, { fill: pal.ink, opacity: 0.8 });
  }
  for (let i = 0; i < 3; i++) out += circle(tx + (rng() - 0.5) * s * 0.18, ty + s * 0.12, s * 0.06, { fill: pal.ink, opacity: 0.8 });
  return group(out);
}

// Hokusai-ish line-art waves across a span.
export function ombak(perlin, x0, x1, y, pal, row = 0) {
  const pts = [];
  for (let x = x0 - 20; x <= x1 + 20; x += 20) pts.push([x, y + perlin.noise2D(x * 0.02, row * 1.3) * (4 + row)]);
  let out = curve(pts, { stroke: pal.ink, sw: 1 + row * 0.1, opacity: 0.3 + row * 0.08 });
  // small cresting curls here and there
  for (let x = x0; x < x1; x += 90) {
    if (perlin.noise2D(x * 0.05, row) > 0.25) out += curl(x, y - 2, 4 + row, 1, pal, 0.9);
  }
  return group(out);
}

export function matahari(x, y, r, pal, moon = false) {
  let out = circle(x, y, r, { stroke: pal.gold, sw: 2, opacity: 0.9 });
  if (!moon) for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; out += raw(`M ${x + Math.cos(a) * r * 1.25} ${y + Math.sin(a) * r * 1.25} L ${x + Math.cos(a) * r * 1.6} ${y + Math.sin(a) * r * 1.6}`, { stroke: pal.gold, sw: 1.4, opacity: 0.6 }); }
  else out += circle(x + r * 0.35, y - r * 0.2, r * 0.85, { fill: pal.paper1, opacity: 1 });
  return group(out);
}

export function burung(x, y, s, pal) {
  return curve([[x - s, y], [x - s * 0.3, y - s * 0.5], [x, y - s * 0.1], [x + s * 0.3, y - s * 0.5], [x + s, y]], { stroke: pal.ink, sw: 1.2, opacity: 0.5 });
}
