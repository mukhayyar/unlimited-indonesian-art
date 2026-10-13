// Line-art brush engine: tapered strokes, curvy closed forms, hatching.
// Everything is built from a few organic primitives so the whole site reads as
// ink-on-paper line art with soft, curvy finishing (in the spirit of shan-shui-inf).

export const SVGNS = 'http://www.w3.org/2000/svg';
const f = (n) => Math.round(n * 100) / 100;

// Warm batik-paper palettes. Line art = ink lines + translucent washes.
export const PALETTES = {
  klasik: {
    name: 'Klasik (sogan)',
    paper1: '#f6ecd2', paper2: '#ead9b0', ink: '#2c2016', inkSoft: '#5b4328',
    wash: '#c98a3f', wash2: '#8a5a2a', gold: '#b9832e', accent: '#9c3b24',
    glow: '#e8b858',
  },
  malam: {
    name: 'Malam (kelir)',
    paper1: '#140e1f', paper2: '#241433', ink: '#f2e2b8', inkSoft: '#caa96a',
    wash: '#e6a93a', wash2: '#b5462f', gold: '#f2c35e', accent: '#e8884a',
    glow: '#f4cf7a',
  },
};

// --- low-level emitters ---------------------------------------------------
export function raw(d, { fill = 'none', stroke = 'none', sw = 1, opacity = 1 } = {}) {
  return `<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${f(sw)}" `
    + `opacity="${f(opacity)}" stroke-linejoin="round" stroke-linecap="round"/>`;
}
export function group(inner, { transform = '', opacity = 1 } = {}) {
  return `<g${transform ? ` transform="${transform}"` : ''}${opacity !== 1 ? ` opacity="${f(opacity)}"` : ''}>${inner}</g>`;
}
export function circle(cx, cy, r, o = {}) {
  const { fill = 'none', stroke = 'none', sw = 1, opacity = 1 } = o;
  return `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" fill="${fill}" stroke="${stroke}" stroke-width="${f(sw)}" opacity="${f(opacity)}"/>`;
}

// Smooth OPEN path through points (Catmull-Rom → bezier) — the curvy finishing.
export function curve(points, { stroke = '#000', sw = 1.4, opacity = 1, fill = 'none' } = {}) {
  if (points.length < 2) return '';
  if (points.length === 2) return raw(`M ${f(points[0][0])} ${f(points[0][1])} L ${f(points[1][0])} ${f(points[1][1])}`, { stroke, sw, opacity, fill });
  let d = `M ${f(points[0][0])} ${f(points[0][1])}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] || points[i], p1 = points[i], p2 = points[i + 1], p3 = points[i + 2] || p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${f(c1x)} ${f(c1y)} ${f(c2x)} ${f(c2y)} ${f(p2[0])} ${f(p2[1])}`;
  }
  return raw(d, { stroke, sw, opacity, fill });
}

// Smooth CLOSED path (Catmull-Rom loop) — curvy blobs: hills, clouds, bodies.
function closedD(points) {
  const n = points.length;
  const P = (i) => points[((i % n) + n) % n];
  let d = `M ${f(P(0)[0])} ${f(P(0)[1])}`;
  for (let i = 0; i < n; i++) {
    const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
    const c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${f(c1x)} ${f(c1y)} ${f(c2x)} ${f(c2y)} ${f(p2[0])} ${f(p2[1])}`;
  }
  return d + ' Z';
}
export function blob(points, { fill = 'none', stroke = '#000', sw = 1.4, opacity = 1 } = {}) {
  const d = closedD(points);
  let out = '';
  if (fill !== 'none') out += raw(d, { fill, opacity: opacity * (stroke === 'none' ? 1 : 0.9) });
  if (stroke !== 'none') out += raw(d, { stroke, sw, opacity });
  return out;
}

// Tapered brush stroke: a filled ribbon around a centre-line, width tapering to
// zero at both ends (a real calligraphic mark). `w` = max width, or a function
// t∈[0,1]→width, or an array per point.
export function brush(points, w = 6, { fill = '#000', opacity = 1 } = {}) {
  const n = points.length;
  if (n < 2) return '';
  const widthAt = (i) => {
    const t = i / (n - 1);
    if (typeof w === 'function') return w(t);
    if (Array.isArray(w)) return w[i];
    return w * Math.sin(Math.PI * (0.08 + 0.84 * t)); // taper both ends
  };
  const left = [], right = [];
  for (let i = 0; i < n; i++) {
    const a = points[Math.max(0, i - 1)], b = points[Math.min(n - 1, i + 1)];
    let dx = b[0] - a[0], dy = b[1] - a[1];
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len, ny = dx / len, hw = widthAt(i) / 2;
    left.push([points[i][0] + nx * hw, points[i][1] + ny * hw]);
    right.push([points[i][0] - nx * hw, points[i][1] - ny * hw]);
  }
  const loop = [...left, ...right.reverse()];
  return raw(closedD(loop), { fill, opacity });
}

// A single confident contour line with a hint of taper (for outlines).
export function ink(points, pal, sw = 1.6, opacity = 1) {
  return curve(points, { stroke: pal.ink, sw, opacity });
}

// Parallel hatching inside a direction, for soft shading.
export function hatch(x, y, w, h, angleDeg, gap, pal, opacity = 0.18) {
  const a = (angleDeg * Math.PI) / 180, dx = Math.cos(a), dy = Math.sin(a);
  let out = '';
  const steps = Math.ceil((w + h) / gap);
  for (let i = -steps; i < steps; i++) {
    const ox = x + i * gap * -dy, oy = y + i * gap * dx;
    out += raw(`M ${f(ox)} ${f(oy)} L ${f(ox + dx * w)} ${f(oy + dy * w)}`, { stroke: pal.inkSoft, sw: 0.7, opacity });
  }
  return out;
}

// A decorative double-spiral curl (lung-style) — the signature of Nusantara
// ornament, used as leaf tips, cloud scrolls, puppet filigree.
export function curl(x, y, r, dir, pal, sw = 1.5) {
  const pts = [], turns = 1.6;
  for (let t = 0; t <= 1; t += 0.08) {
    const ang = dir * t * turns * Math.PI * 2, rr = r * (1 - t * 0.78);
    pts.push([x + Math.cos(ang) * rr, y + Math.sin(ang) * rr - r]);
  }
  return curve(pts, { stroke: pal.ink, sw, opacity: 0.9 });
}
