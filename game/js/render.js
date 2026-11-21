// render.js — turns a level into two painted panels and draws what the
// player has done on top of them: the found markers with their pop, the
// fading crosses of missed clicks, and the pulsing rings of a hint.
//
// Each scene is painted once per level onto an offscreen canvas (the left
// picture with the level's base variant, the right with the right variant),
// so the per-frame work is only an image blit plus a handful of markers.

import { paintScene } from './scenes.js';
import { rightVariant, PANEL_SIZE } from './differences.js';

// buildSceneCanvas(level, side) paints one whole panel offscreen.
export function buildSceneCanvas(level, side) {
  const canvas = document.createElement('canvas');
  canvas.width = PANEL_SIZE;
  canvas.height = PANEL_SIZE;
  const ctx = canvas.getContext('2d');
  paintScene(ctx, level, side === 'left' ? { ...level.base } : rightVariant(level));
  return canvas;
}

const MARKER_GOLD = '#ffd23f';
const MARKER_INK = 'rgba(23, 32, 48, 0.85)';

// drawFoundMarker(ctx, diff, ageMs) rings a found difference on a panel;
// young markers pop in with an expanding halo, then rest as a steady ring.
export function drawFoundMarker(ctx, diff, ageMs) {
  const grow = ageMs < 260 ? 0.55 + 0.45 * (ageMs / 260) : 1;
  const r = diff.r * grow;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.strokeStyle = MARKER_INK;
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.arc(diff.x, diff.y, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = MARKER_GOLD;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(diff.x, diff.y, r, 0, Math.PI * 2);
  ctx.stroke();
  if (ageMs < 480) {
    ctx.globalAlpha = 1 - ageMs / 480;
    ctx.strokeStyle = MARKER_GOLD;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(diff.x, diff.y, diff.r + ageMs * 0.07, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

// drawMissMark(ctx, miss, ageMs) draws the red cross of a wrong click,
// fading out over its lifetime.
export function drawMissMark(ctx, miss, ageMs) {
  const life = 650;
  if (ageMs > life) return;
  const s = 10;
  ctx.save();
  ctx.globalAlpha = 1 - ageMs / life;
  ctx.strokeStyle = '#ff5a5a';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(miss.x - s, miss.y - s);
  ctx.lineTo(miss.x + s, miss.y + s);
  ctx.moveTo(miss.x + s, miss.y - s);
  ctx.lineTo(miss.x - s, miss.y + s);
  ctx.stroke();
  ctx.restore();
}

// drawHintPulse(ctx, diff, startedAt, now) breathes two soft rings over
// the area of an unfound difference while a hint is active; it points at
// the neighbourhood, never the exact centre, and fades with the hint.
export function drawHintPulse(ctx, diff, startedAt, now) {
  const duration = 1500;
  const elapsed = now - startedAt;
  if (elapsed < 0 || elapsed > duration) return;
  const fade = elapsed > duration - 350 ? (duration - elapsed) / 350 : 1;
  ctx.save();
  for (const phase of [0, 0.5]) {
    const p = ((elapsed / 620) + phase) % 1;
    ctx.globalAlpha = (1 - p) * 0.75 * fade;
    ctx.strokeStyle = '#7fe0ff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(diff.x, diff.y, diff.r * (0.75 + p * 1.05), 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

// drawPanel(ctx, sceneCanvas, level, view, now, side) blits one painted
// panel and draws the player's marks on it. `view` carries the found map
// (diff id to the time it was found), the live miss marks (each tagged with
// the side it was clicked on, so a cross shows only on that panel), and the
// active hint.
export function drawPanel(ctx, sceneCanvas, level, view, now, side) {
  ctx.clearRect(0, 0, PANEL_SIZE, PANEL_SIZE);
  ctx.drawImage(sceneCanvas, 0, 0);
  if (view.hint) drawHintPulse(ctx, view.hint.diff, view.hint.startedAt, now);
  for (const miss of view.misses) {
    if (miss.side === side) drawMissMark(ctx, miss, now - miss.at);
  }
  for (const diff of level.diffs) {
    const foundAt = view.found.get(diff.id);
    if (foundAt !== undefined) drawFoundMarker(ctx, diff, now - foundAt);
  }
}
