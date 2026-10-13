// SVG building helpers and the colour palettes.
// We assemble the scene as SVG strings — same spirit as shan-shui-inf — so any
// frame can be downloaded as a crisp, editable .svg.

export const SVGNS = 'http://www.w3.org/2000/svg';

// Palettes evoke Indonesian art: "senja" = wayang-kelir dusk (indigo night to
// warm gold horizon, sogan-brown silhouettes); "siang" = bright batik day.
export const PALETTES = {
  senja: {
    name: 'Senja (wayang dusk)',
    skyTop: '#1b1033', skyMid: '#5b2a4e', skyHorizon: '#e8a13a', sun: '#ffd77a',
    far: '#3a2a4d', mid: '#5a3a2e', near: '#2a1a18', ink: '#140d10',
    sea: '#243b57', seaHi: '#3c6f94', foam: '#dcc9a6', gold: '#f2c35e',
    paper: '#f3e6c8', accent: '#b5462f',
  },
  siang: {
    name: 'Siang (batik day)',
    skyTop: '#9fd0e6', skyMid: '#cfe9f2', skyHorizon: '#f6efd6', sun: '#fff3c4',
    far: '#7d93a6', mid: '#6f7f57', near: '#3f5235', ink: '#2a2118',
    sea: '#3f87a6', seaHi: '#79b7cf', foam: '#f2efe2', gold: '#caa23a',
    paper: '#faf4e4', accent: '#9c3b24',
  },
};

// --- primitive string builders -------------------------------------------
const f = (n) => (Math.round(n * 100) / 100); // trim float noise in output

export function path(d, { fill = 'none', stroke = 'none', sw = 1, opacity = 1, lj = 'round' } = {}) {
  return `<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${f(sw)}" `
    + `opacity="${f(opacity)}" stroke-linejoin="${lj}" stroke-linecap="round"/>`;
}

export function poly(points, opts) {
  if (!points.length) return '';
  let d = `M ${f(points[0][0])} ${f(points[0][1])}`;
  for (let i = 1; i < points.length; i++) d += ` L ${f(points[i][0])} ${f(points[i][1])}`;
  return path(d, opts);
}

export function polygon(points, opts) {
  return poly([...points, points[0]], opts);
}

export function circle(cx, cy, r, { fill = 'none', stroke = 'none', sw = 1, opacity = 1 } = {}) {
  return `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" fill="${fill}" stroke="${stroke}" `
    + `stroke-width="${f(sw)}" opacity="${f(opacity)}"/>`;
}

export function ellipse(cx, cy, rx, ry, opts = {}) {
  const { fill = 'none', stroke = 'none', sw = 1, opacity = 1 } = opts;
  return `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rx)}" ry="${f(ry)}" fill="${fill}" `
    + `stroke="${stroke}" stroke-width="${f(sw)}" opacity="${f(opacity)}"/>`;
}

export function group(inner, { transform = '', opacity = 1 } = {}) {
  return `<g${transform ? ` transform="${transform}"` : ''}${opacity !== 1 ? ` opacity="${f(opacity)}"` : ''}>${inner}</g>`;
}

// A smooth closed blob through points via quadratic midpoints — good for clouds,
// hills and the organic silhouettes of mountains.
export function smoothClosed(points, opts) {
  if (points.length < 3) return polygon(points, opts);
  const n = points.length;
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  let d = `M ${f(mid(points[n - 1], points[0])[0])} ${f(mid(points[n - 1], points[0])[1])}`;
  for (let i = 0; i < n; i++) {
    const cur = points[i], nxt = points[(i + 1) % n];
    const m = mid(cur, nxt);
    d += ` Q ${f(cur[0])} ${f(cur[1])} ${f(m[0])} ${f(m[1])}`;
  }
  return path(d + ' Z', opts);
}

// Smooth open curve through points (ridge lines, fronds, waves).
export function smoothOpen(points, opts) {
  if (points.length < 3) return poly(points, opts);
  let d = `M ${f(points[0][0])} ${f(points[0][1])}`;
  for (let i = 1; i < points.length - 1; i++) {
    const m = [(points[i][0] + points[i + 1][0]) / 2, (points[i][1] + points[i + 1][1]) / 2];
    d += ` Q ${f(points[i][0])} ${f(points[i][1])} ${f(m[0])} ${f(m[1])}`;
  }
  const last = points[points.length - 1];
  d += ` L ${f(last[0])} ${f(last[1])}`;
  return path(d, opts);
}
