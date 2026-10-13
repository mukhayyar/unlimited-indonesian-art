// App shell: gallery switcher, infinite pan, palette, SVG export.
// Rendering rule (fixes "blank page"): we only ever set innerHTML on the HTML
// container (#stage), so the HTML parser namespaces the <svg> subtree correctly.
// Panning within a mounted chunk-set mutates the groups' transform via
// setAttribute (safe on existing SVG nodes); crossing a chunk boundary repaints.
import { hashSeed } from './prng.js';
import { PALETTES } from './brush.js';
import { VW, VH, CHUNK } from './common.js';
import { GALLERIES } from './galleries.js';

const $ = (id) => document.getElementById(id);
const stage = $('stage');

const state = {
  gi: 0, paletteKey: GALLERIES[0].defaultPalette, seedStr: 'nusantara',
  viewX: 0, auto: false, inst: null, chunkKey: '',
};
const gallery = () => GALLERIES[state.gi];
const pal = () => PALETTES[state.paletteKey];

function defs() {
  const p = pal();
  return `<defs>
    <linearGradient id="paper" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${p.paper1}"/><stop offset="100%" stop-color="${p.paper2}"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="42%" r="60%">
      <stop offset="0%" stop-color="${p.glow}" stop-opacity="0.55"/>
      <stop offset="60%" stop-color="${p.glow}" stop-opacity="0.12"/>
      <stop offset="100%" stop-color="${p.glow}" stop-opacity="0"/>
    </radialGradient>
  </defs>`;
}
function frame() {
  const p = pal();
  return `<rect x="6" y="6" width="${VW - 12}" height="${VH - 12}" fill="none" stroke="${p.gold}" stroke-width="2" opacity="0.5"/>`
    + `<rect x="11" y="11" width="${VW - 22}" height="${VH - 22}" fill="none" stroke="${p.gold}" stroke-width="0.8" opacity="0.4"/>`;
}
function visibleChunks() {
  const a = Math.floor(state.viewX / CHUNK) - 1, b = Math.floor((state.viewX + VW) / CHUNK) + 1;
  const out = []; for (let c = a; c <= b; c++) out.push(c); return out;
}
function worldSVG(extraAttr = '') {
  const chunks = visibleChunks(); let back = '', front = '';
  for (const c of chunks) { const k = state.inst.chunk(c, pal()); back += k.back; front += (k.front || ''); }
  const tx = -state.viewX;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VW} ${VH}" `
    + `preserveAspectRatio="xMidYMid slice"${extraAttr}>`
    + defs() + state.inst.background(pal())
    + `<g id="back" transform="translate(${tx},0)">${back}</g>`
    + `<g id="front" transform="translate(${tx},0)">${front}</g>`
    + `<g>${frame()}</g></svg>`;
}

function paint() {
  stage.innerHTML = worldSVG();
  state.chunkKey = state.gi + state.paletteKey + visibleChunks()[0];
}
function pan() {
  if (state.gi + state.paletteKey + visibleChunks()[0] !== state.chunkKey) { paint(); return; }
  const tx = `translate(${-state.viewX},0)`;
  const b = $('back'), f = $('front');
  if (b) b.setAttribute('transform', tx);
  if (f) f.setAttribute('transform', tx);
}
function regen() {
  state.inst = gallery().create(hashSeed(state.seedStr + ':' + gallery().id));
  paint();
  $('seedLabel').textContent = state.seedStr;
  document.querySelectorAll('#galleries button').forEach((bb, i) => bb.classList.toggle('on', i === state.gi));
  $('palette').textContent = pal().name;
}
function exportSVG() {
  const doc = worldSVG(` width="${VW}" height="${VH}"`);
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([doc], { type: 'image/svg+xml' }));
  a.download = `${gallery().id}-${state.seedStr}-${Math.round(state.viewX)}.svg`;
  a.click(); URL.revokeObjectURL(a.href);
}

// interaction (bound to the persistent container, not the re-created svg)
let drag = false, lastX = 0;
const sc = () => VW / (stage.getBoundingClientRect().width || VW);
stage.addEventListener('pointerdown', (e) => { drag = true; lastX = e.clientX; stage.setPointerCapture(e.pointerId); });
stage.addEventListener('pointermove', (e) => { if (drag) { state.viewX -= (e.clientX - lastX) * sc(); lastX = e.clientX; pan(); } });
stage.addEventListener('pointerup', (e) => { drag = false; try { stage.releasePointerCapture(e.pointerId); } catch {} });
addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') { state.viewX += 140; pan(); } if (e.key === 'ArrowLeft') { state.viewX -= 140; pan(); } });
function loop() { if (state.auto && !drag) { state.viewX += 1.1; pan(); } requestAnimationFrame(loop); }

// gallery nav
GALLERIES.forEach((g, i) => {
  const b = document.createElement('button');
  b.textContent = g.name;
  b.addEventListener('click', () => { state.gi = i; state.paletteKey = g.defaultPalette; state.viewX = 0; regen(); });
  $('galleries').appendChild(b);
});
$('newSeed').addEventListener('click', () => { state.seedStr = Math.random().toString(36).slice(2, 9); $('seedInput').value = state.seedStr; state.viewX = 0; regen(); });
$('seedInput').addEventListener('change', (e) => { state.seedStr = e.target.value.trim() || 'nusantara'; state.viewX = 0; regen(); });
$('palette').addEventListener('click', () => { state.paletteKey = state.paletteKey === 'klasik' ? 'malam' : 'klasik'; regen(); });
$('auto').addEventListener('click', () => { state.auto = !state.auto; $('auto').textContent = state.auto ? '⏸ Berhenti' : '▶ Jalan'; $('auto').classList.toggle('on', state.auto); });
$('download').addEventListener('click', exportSVG);

// boot — never leave a blank screen
try {
  const gq = new URLSearchParams(location.search).get('g');
  if (gq) { const idx = GALLERIES.findIndex(g => g.id === gq); if (idx >= 0) { state.gi = idx; state.paletteKey = GALLERIES[idx].defaultPalette; } }
  $('seedInput').value = state.seedStr;
  regen(); loop();
} catch (err) {
  console.error(err);
  stage.innerHTML = `<pre style="color:#f2e2b8;padding:24px;white-space:pre-wrap;font:13px monospace">UniiArt error:\n${(err && err.stack) || err}</pre>`;
}
