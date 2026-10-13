// Heritage motif generators. Each returns an SVG string and is deterministic
// given its rng. Silhouette style with a thin gold rim-light (the blencong-lamp
// glow of a wayang screen) in the dusk palette.
import { path, poly, polygon, circle, ellipse, group, smoothClosed, smoothOpen } from './brush.js';

const rim = (pal) => ({ stroke: pal.gold, sw: 1.1, opacity: 0.5 });

// --- Gunung: a volcano with a drifting smoke plume ------------------------
export function gunung(x, baseY, h, rng, pal, tone = pal.far) {
  const w = h * (1.15 + rng() * 0.3);
  const cr = w * 0.12;               // crater half-width
  const apex = baseY - h;
  // concave volcanic slopes via quadratic curves
  const d = `M ${x - w} ${baseY}`
    + ` Q ${x - w * 0.5} ${baseY - h * 0.45} ${x - cr} ${apex + h * 0.04}`
    + ` L ${x + cr} ${apex + h * 0.04}`
    + ` Q ${x + w * 0.5} ${baseY - h * 0.45} ${x + w} ${baseY} Z`;
  let s = path(d, { fill: tone });
  s += path(d, rim(pal));
  // ridge shading lines
  for (let i = 0; i < 3; i++) {
    const t = 0.25 + i * 0.22;
    s += smoothOpen([
      [x - cr - (w - cr) * t * 0.2, apex + h * 0.1 + h * 0.3 * i],
      [x - cr - (w) * t * 0.5, baseY - h * (0.3 - i * 0.08)],
      [x - cr - w * t * 0.75, baseY],
    ], { stroke: pal.ink, sw: 1, opacity: 0.18 });
  }
  // smoke plume
  if (rng.chance(0.7)) {
    const pts = [[x, apex]];
    let sx = x, sy = apex;
    for (let i = 0; i < 6; i++) { sx += (rng() - 0.5) * h * 0.18; sy -= h * 0.16; pts.push([sx, sy]); }
    s += smoothOpen(pts, { stroke: pal.foam, sw: 2.2, opacity: 0.35 });
  }
  return group(s);
}

// --- Awan Mega Mendung: the scalloped Cirebon batik cloud -----------------
export function megaMendung(x, y, s, rng, pal) {
  let out = '';
  const layers = 3 + (rng.int ? rng.int(0, 1) : 0);
  for (let L = layers; L >= 1; L--) {
    const scale = s * (0.5 + L * 0.22);
    const lobes = 4 + L;
    const pts = [];
    for (let i = 0; i <= lobes; i++) {
      const t = i / lobes;
      pts.push([x - scale + t * scale * 2, y - Math.sin(t * Math.PI) * scale * 0.55 - L * 3]);
    }
    // scalloped underside
    const under = [];
    for (let i = lobes; i >= 0; i--) {
      const t = i / lobes;
      const bump = (i % 2 === 0) ? scale * 0.12 : 0;
      under.push([x - scale + t * scale * 2, y - L * 3 + bump]);
    }
    const shade = L === layers ? pal.foam : pal.accent;
    out += smoothClosed([...pts, ...under], { fill: shade, opacity: 0.18 + L * 0.06 });
    out += smoothOpen(pts, { stroke: pal.ink, sw: 1, opacity: 0.25 });
  }
  return group(out, { opacity: 0.9 });
}

// --- Candi Borobudur: stepped stupa pyramid -------------------------------
export function candiBorobudur(x, baseY, s, rng, pal) {
  let out = '';
  const tiers = 4;
  let w = s * 1.6, y = baseY;
  for (let i = 0; i < tiers; i++) {
    const hgt = s * 0.3;
    out += polygon([[x - w, y], [x + w, y], [x + w * 0.9, y - hgt], [x - w * 0.9, y - hgt]],
      { fill: pal.mid });
    y -= hgt; w *= 0.78;
  }
  // circular terraces with small bell stupas
  for (let row = 0; row < 2; row++) {
    const n = 5 - row;
    for (let k = 0; k < n; k++) {
      const bx = x - w + (2 * w) * (k / (n - 1 || 1));
      out += bellStupa(bx, y, s * (0.16 - row * 0.02), pal);
    }
    y -= s * 0.22; w *= 0.7;
  }
  out += bellStupa(x, y + s * 0.05, s * 0.34, pal); // central stupa
  out = out.replace('/>', `/>`);
  return group(out + silhouetteRim(x, baseY, s * 3, pal));
}
function bellStupa(x, baseY, r, pal) {
  const d = `M ${x - r} ${baseY} Q ${x - r} ${baseY - r * 1.4} ${x} ${baseY - r * 1.7}`
    + ` Q ${x + r} ${baseY - r * 1.4} ${x + r} ${baseY} Z`;
  return path(d, { fill: pal.mid }) + poly([[x, baseY - r * 1.7], [x, baseY - r * 2.1]], { stroke: pal.mid, sw: r * 0.4 });
}

// --- Candi Prambanan: tall tapering Hindu spire ---------------------------
export function candiPrambanan(x, baseY, s, rng, pal) {
  let out = '';
  let w = s * 0.75, y = baseY;
  const tiers = 6;
  for (let i = 0; i < tiers; i++) {
    const hgt = s * 0.34;
    out += polygon([[x - w, y], [x + w, y], [x + w * 0.82, y - hgt], [x - w * 0.82, y - hgt]], { fill: pal.mid });
    // tier notches
    out += poly([[x - w, y], [x + w, y]], { stroke: pal.ink, sw: 1, opacity: 0.25 });
    y -= hgt; w *= 0.82;
  }
  // ratna finial
  out += path(`M ${x - w} ${y} Q ${x} ${y - s * 0.5} ${x + w} ${y} Z`, { fill: pal.mid });
  out += circle(x, y - s * 0.52, s * 0.12, { fill: pal.mid });
  return group(out);
}

// --- Rumah Gadang: Minangkabau house, upswept gonjong roof ----------------
export function rumahGadang(x, baseY, s, rng, pal) {
  let out = '';
  const w = s * 1.6, bodyH = s * 0.7;
  // stilts
  for (let i = -2; i <= 2; i++) out += poly([[x + i * w * 0.4, baseY], [x + i * w * 0.4, baseY - bodyH * 0.5]], { stroke: pal.near, sw: s * 0.06 });
  // body
  out += polygon([[x - w * 0.9, baseY - bodyH * 0.5], [x + w * 0.9, baseY - bodyH * 0.5],
    [x + w * 0.9, baseY - bodyH], [x - w * 0.9, baseY - bodyH]], { fill: pal.near });
  // gonjong roof: three upswept horns
  const roofY = baseY - bodyH;
  const horns = 3;
  for (let i = 0; i < horns; i++) {
    const cx = x - w + (2 * w) * (i / (horns - 1)) ;
    const hw = w * 0.55;
    const d = `M ${cx - hw} ${roofY}`
      + ` Q ${cx - hw * 0.3} ${roofY - s * 0.2} ${cx} ${roofY - s * 0.22}`
      + ` Q ${cx + hw * 0.3} ${roofY - s * 0.2} ${cx + hw} ${roofY}`
      + ` Q ${cx + hw * 0.5} ${roofY - s * 0.75} ${cx + hw * 0.1} ${roofY - s * 0.95}` // right horn up
      + ` L ${cx} ${roofY - s * 0.35}`
      + ` L ${cx - hw * 0.1} ${roofY - s * 0.95}` // left horn up
      + ` Q ${cx - hw * 0.5} ${roofY - s * 0.75} ${cx - hw} ${roofY} Z`;
    out += path(d, { fill: pal.accent });
    out += path(d, rim(pal));
  }
  return group(out);
}

// --- Pohon Kelapa: coconut palm ------------------------------------------
export function pohonKelapa(x, baseY, s, rng, pal) {
  let out = '';
  const lean = (rng() - 0.5) * s * 0.4;
  const topX = x + lean, topY = baseY - s * 2.1;
  out += path(`M ${x - s * 0.06} ${baseY} Q ${x + lean * 0.4} ${baseY - s} ${topX} ${topY}`
    + ` L ${topX + s * 0.08} ${topY} Q ${x + s * 0.06 + lean * 0.4} ${baseY - s} ${x + s * 0.06} ${baseY} Z`,
    { fill: pal.near });
  const fronds = 7;
  for (let i = 0; i < fronds; i++) {
    const ang = Math.PI * (0.1 + 0.8 * (i / (fronds - 1))) + Math.PI; // upper arc
    const dx = Math.cos(ang) * s * 0.95, dy = Math.sin(ang) * s * 0.95;
    out += smoothOpen([[topX, topY], [topX + dx * 0.5, topY + Math.abs(dy) * -0.2 + s * 0.1],
      [topX + dx, topY + s * 0.5 + i * 2]], { stroke: pal.near, sw: s * 0.05, opacity: 0.95 });
  }
  for (let i = 0; i < 3; i++) out += circle(topX + (rng() - 0.5) * s * 0.2, topY + s * 0.12, s * 0.07, { fill: pal.near });
  return group(out);
}

// --- Gunungan / Kayon: the wayang tree-of-life, opens the play -----------
export function gunungan(x, baseY, s, rng, pal) {
  const w = s * 0.9, h = s * 2.2;
  const top = baseY - h;
  const d = `M ${x} ${baseY}`
    + ` C ${x - w} ${baseY - h * 0.1} ${x - w} ${baseY - h * 0.45} ${x - w * 0.45} ${baseY - h * 0.62}`
    + ` C ${x - w * 0.8} ${baseY - h * 0.78} ${x - w * 0.35} ${baseY - h * 0.9} ${x} ${top}`
    + ` C ${x + w * 0.35} ${baseY - h * 0.9} ${x + w * 0.8} ${baseY - h * 0.78} ${x + w * 0.45} ${baseY - h * 0.62}`
    + ` C ${x + w} ${baseY - h * 0.45} ${x + w} ${baseY - h * 0.1} ${x} ${baseY} Z`;
  let out = path(d, { fill: pal.ink });
  out += path(d, { stroke: pal.gold, sw: 1.6, opacity: 0.6 });
  // inner tree + gate
  out += poly([[x, baseY - h * 0.1], [x, baseY - h * 0.55]], { stroke: pal.gold, sw: 1.3, opacity: 0.5 });
  out += polygon([[x - w * 0.22, baseY], [x + w * 0.22, baseY], [x + w * 0.22, baseY - h * 0.16], [x - w * 0.22, baseY - h * 0.16]], { stroke: pal.gold, sw: 1, opacity: 0.4 });
  for (let i = 0; i < 5; i++) {
    const yy = baseY - h * (0.2 + i * 0.07);
    const ww = w * (0.35 - i * 0.04);
    out += smoothOpen([[x - ww, yy], [x, yy - s * 0.12], [x + ww, yy]], { stroke: pal.gold, sw: 1, opacity: 0.45 });
  }
  return group(out);
}

// --- Kapal Pinisi: South Sulawesi schooner with its many sails -----------
export function pinisi(x, seaY, s, rng, pal) {
  let out = '';
  const hullW = s * 2.2, hullH = s * 0.4;
  // hull with upswept bow & stern
  const d = `M ${x - hullW} ${seaY}`
    + ` Q ${x - hullW * 1.05} ${seaY - hullH * 1.6} ${x - hullW * 0.75} ${seaY - hullH}`
    + ` L ${x + hullW * 0.8} ${seaY - hullH}`
    + ` Q ${x + hullW * 1.15} ${seaY - hullH * 1.9} ${x + hullW} ${seaY} Z`;
  out += path(d, { fill: pal.near });
  out += path(d, rim(pal));
  // two masts, raked forward
  const mast = (mx, mh, rake) => {
    const topX = mx + rake, topY = seaY - hullH - mh;
    out += poly([[mx, seaY - hullH], [topX, topY]], { stroke: pal.near, sw: s * 0.05 });
    return [topX, topY];
  };
  const [m1x, m1y] = mast(x - hullW * 0.3, s * 1.9, s * 0.25);
  const [m2x, m2y] = mast(x + hullW * 0.35, s * 1.6, s * 0.2);
  // gaff sails (two per mast) + head jibs (three) = the 7 layar pinisi
  const sail = (ax, ay, bx, by, cx, cy) => { out += polygon([[ax, ay], [bx, by], [cx, cy]], { fill: pal.foam, opacity: 0.9 }); out += polygon([[ax, ay], [bx, by], [cx, cy]], { stroke: pal.ink, sw: 0.8, opacity: 0.3 }); };
  sail(m1x, m1y, x - hullW * 0.3, seaY - hullH, x + hullW * 0.1, seaY - hullH);        // main lower
  sail(m1x, m1y, x + hullW * 0.1, seaY - hullH, m2x, m2y);                              // main upper
  sail(m2x, m2y, x + hullW * 0.35, seaY - hullH, x + hullW * 0.7, seaY - hullH);        // mizzen lower
  sail(m2x, m2y, x + hullW * 0.7, seaY - hullH, x + hullW * 0.9, seaY - hullH * 2.2);   // mizzen upper
  // three forward jibs from bow
  const bowX = x + hullW * 1.0, bx2 = x + hullW * 0.55;
  sail(m1x, m1y, bowX, seaY - hullH, bx2, seaY - hullH);
  sail(m1x, m1y + s * 0.4, bowX, seaY - hullH, bx2, seaY - hullH * 1.2);
  sail(m1x, m1y + s * 0.8, bowX, seaY - hullH, bx2, seaY - hullH * 1.6);
  return group(out);
}

// --- small perahu --------------------------------------------------------
export function perahu(x, seaY, s, pal) {
  let out = path(`M ${x - s} ${seaY} Q ${x} ${seaY + s * 0.35} ${x + s} ${seaY} Z`, { fill: pal.near });
  out += poly([[x, seaY], [x, seaY - s * 0.9]], { stroke: pal.near, sw: s * 0.08 });
  out += polygon([[x, seaY - s * 0.9], [x, seaY - s * 0.1], [x + s * 0.7, seaY - s * 0.1]], { fill: pal.foam, opacity: 0.9 });
  return group(out);
}

// --- sun / moon, birds ---------------------------------------------------
export function matahari(x, y, r, pal) {
  let out = circle(x, y, r, { fill: pal.sun, opacity: 0.95 });
  out += circle(x, y, r * 1.5, { fill: pal.sun, opacity: 0.12 });
  return group(out);
}
export function burung(x, y, s, pal) {
  return path(`M ${x - s} ${y} Q ${x - s * 0.4} ${y - s * 0.5} ${x} ${y} Q ${x + s * 0.4} ${y - s * 0.5} ${x + s} ${y}`,
    { stroke: pal.ink, sw: 1.4, opacity: 0.5 });
}

// faint gold halo helper used by temples at dusk
function silhouetteRim() { return ''; }
