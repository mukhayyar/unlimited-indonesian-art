// Viewport, controls, infinite panning and SVG export.
import { hashSeed } from './prng.js';
import { PALETTES, batikFrame } from './brush.js';
import { World, VW, VH, LY, CHUNK } from './world.js';

const SVGNS = 'http://www.w3.org/2000/svg';
const $ = (id) => document.getElementById(id);

const state = {
  seedStr: 'nusantara',
  seed: 0,
  paletteKey: 'senja',
  viewX: 0,
  auto: false,
  mountedKey: '',
  world: null,
};

const svg = document.createElementNS(SVGNS, 'svg');
svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);
svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
svg.setAttribute('id', 'art');
$('stage').appendChild(svg);

function defsFor(pal) {
  return `<defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${pal.skyTop}"/>
      <stop offset="55%" stop-color="${pal.skyMid}"/>
      <stop offset="100%" stop-color="${pal.skyHorizon}"/>
    </linearGradient>
    <linearGradient id="sea" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${pal.skyHorizon}" stop-opacity="0.5"/>
      <stop offset="18%" stop-color="${pal.sea}"/>
      <stop offset="100%" stop-color="${pal.ink}"/>
    </linearGradient>
  </defs>`;
}

function visibleChunks() {
  const c0 = Math.floor(state.viewX / CHUNK) - 1;
  const c1 = Math.floor((state.viewX + VW) / CHUNK) + 1;
  const list = [];
  for (let c = c0; c <= c1; c++) list.push(c);
  return list;
}

function buildStatic(pal) {
  svg.innerHTML =
    defsFor(pal) +
    `<rect x="0" y="0" width="${VW}" height="${VH}" fill="url(#sky)"/>` +
    `<g id="back"></g>` +
    `<rect x="0" y="${LY}" width="${VW}" height="${VH - LY}" fill="url(#sea)"/>` +
    `<g id="front"></g>` +
    `<g id="frame">${batikFrame(pal)}</g>`;
}

function mountChunks() {
  const pal = PALETTES[state.paletteKey];
  const chunks = visibleChunks();
  const key = state.paletteKey + ':' + chunks[0] + ':' + chunks[chunks.length - 1];
  if (key === state.mountedKey) return;
  state.mountedKey = key;
  let back = '', front = '';
  for (const c of chunks) {
    const { back: b, front: fr } = state.world.chunk(c, pal);
    back += b; front += fr;
  }
  $('back').innerHTML = back;
  $('front').innerHTML = front;
}

function frame() {
  mountChunks();
  const tx = -state.viewX;
  $('back').setAttribute('transform', `translate(${tx},0)`);
  $('front').setAttribute('transform', `translate(${tx},0)`);
}

function regenerate(full = true) {
  state.seed = hashSeed(state.seedStr);
  state.world = new World(state.seed);
  state.mountedKey = '';
  if (full) buildStatic(PALETTES[state.paletteKey]);
  frame();
  $('seedLabel').textContent = state.seedStr;
}

// --- export the current view as a standalone .svg -------------------------
function exportSVG() {
  const pal = PALETTES[state.paletteKey];
  const chunks = visibleChunks();
  let back = '', front = '';
  for (const c of chunks) { const k = state.world.chunk(c, pal); back += k.back; front += k.front; }
  const tx = -state.viewX;
  const doc =
    `<svg xmlns="${SVGNS}" viewBox="0 0 ${VW} ${VH}" width="${VW}" height="${VH}">` +
    defsFor(pal) +
    `<rect x="0" y="0" width="${VW}" height="${VH}" fill="url(#sky)"/>` +
    `<g transform="translate(${tx},0)">${back}</g>` +
    `<rect x="0" y="${LY}" width="${VW}" height="${VH - LY}" fill="url(#sea)"/>` +
    `<g transform="translate(${tx},0)">${front}</g>` +
    batikFrame(pal) +
    `</svg>`;
  const blob = new Blob([doc], { type: 'image/svg+xml' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `indonesian-art-${state.seedStr}-${Math.round(state.viewX)}.svg`;
  a.click();
  URL.revokeObjectURL(a.href);
}

// --- interaction ----------------------------------------------------------
let dragging = false, lastX = 0;
const scale = () => VW / svg.getBoundingClientRect().width;
svg.addEventListener('pointerdown', (e) => { dragging = true; lastX = e.clientX; svg.setPointerCapture(e.pointerId); });
svg.addEventListener('pointermove', (e) => {
  if (!dragging) return;
  state.viewX -= (e.clientX - lastX) * scale();
  lastX = e.clientX; frame();
});
svg.addEventListener('pointerup', (e) => { dragging = false; try { svg.releasePointerCapture(e.pointerId); } catch {} });
window.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight') { state.viewX += 120; frame(); }
  if (e.key === 'ArrowLeft') { state.viewX -= 120; frame(); }
});

function loop() {
  if (state.auto && !dragging) { state.viewX += 1.1; frame(); }
  requestAnimationFrame(loop);
}

// --- controls -------------------------------------------------------------
$('newSeed').addEventListener('click', () => {
  state.seedStr = Math.random().toString(36).slice(2, 9);
  $('seedInput').value = state.seedStr;
  state.viewX = 0; regenerate();
});
$('seedInput').addEventListener('change', (e) => {
  state.seedStr = e.target.value.trim() || 'nusantara';
  state.viewX = 0; regenerate();
});
$('palette').addEventListener('click', () => {
  state.paletteKey = state.paletteKey === 'senja' ? 'siang' : 'senja';
  $('palette').textContent = PALETTES[state.paletteKey].name;
  regenerate();
});
$('auto').addEventListener('click', () => {
  state.auto = !state.auto;
  $('auto').textContent = state.auto ? '⏸ Berhenti' : '▶ Jalan';
  $('auto').classList.toggle('on', state.auto);
});
$('download').addEventListener('click', exportSVG);

// boot
$('seedInput').value = state.seedStr;
$('palette').textContent = PALETTES[state.paletteKey].name;
regenerate();
loop();
