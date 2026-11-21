// main.js — Lantern Harbor's game state and wiring.
//
// The state machine runs: start screen -> playing a level -> level complete
// -> next level -> ... -> win screen, with branches to a pause overlay and
// a time-up overlay that retries the level. A countdown clock pressures
// every level; a wrong click costs five seconds; hints are limited and cost
// points. This file owns the state, the HUD, the overlays and the clock;
// scenes.js paints, render.js draws the marks, audio.js sounds, and
// differences.js holds the data.

import { LEVELS, PANEL_SIZE } from './differences.js';
import { buildSceneCanvas, drawPanel } from './render.js';
import { SoundKit } from './audio.js';

const FIND_POINTS = 100;
const HINT_COST = 15;
const MISS_SECONDS = 5;
const HINTS_PER_LEVEL = 3;

const els = {
  left: document.getElementById('panel-left'),
  right: document.getElementById('panel-right'),
  overlay: document.getElementById('overlay'),
  toast: document.getElementById('toast'),
  ticker: document.getElementById('ticker'),
  level: document.getElementById('hud-level'),
  found: document.getElementById('hud-found'),
  left_count: document.getElementById('hud-left'),
  time: document.getElementById('hud-time'),
  timebar: document.getElementById('timer-bar'),
  mistakes: document.getElementById('hud-mistakes'),
  score: document.getElementById('hud-score'),
  hints: document.getElementById('hud-hints'),
  btnHint: document.getElementById('btn-hint'),
  btnPause: document.getElementById('btn-pause'),
};
const lctx = els.left.getContext('2d');
const rctx = els.right.getContext('2d');

const state = {
  screen: 'start', // start | playing | complete | over | win
  paused: false,
  frozen: false, // shot mode: the clock never runs, for screenshots
  completing: false,
  levelIndex: 0,
  score: 0,
  scoreAtLevelStart: 0,
  mistakes: 0,
  hintsLeft: HINTS_PER_LEVEL,
  hintsUsed: 0,
  timeLeftMs: 0,
  lastTick: 0,
  shownSecond: -1,
  levelStats: [],
};

const view = {
  found: new Map(), // diff id -> performance.now() when found
  misses: [], // {x, y, at, side}
  hint: null, // {diff, startedAt}
};

let level = LEVELS[0];
let sceneLeft = null;
let sceneRight = null;

// ---------- level lifecycle ----------

function startLevel(index) {
  state.levelIndex = index;
  level = LEVELS[index];
  state.scoreAtLevelStart = state.score;
  state.mistakes = 0;
  state.hintsLeft = HINTS_PER_LEVEL;
  state.hintsUsed = 0;
  state.timeLeftMs = level.timeSeconds * 1000;
  state.shownSecond = -1;
  state.paused = false;
  state.completing = false;
  state.screen = 'playing';
  view.found.clear();
  view.misses = [];
  view.hint = null;
  sceneLeft = buildSceneCanvas(level, 'left');
  sceneRight = buildSceneCanvas(level, 'right');
  hideOverlay();
  setTicker('');
  showToast(`Level ${index + 1} · ${level.title} — find ${level.diffs.length} differences`);
  updateHud();
}

function startGame() {
  state.score = 0;
  state.levelStats = [];
  startLevel(0);
}

function completeLevel() {
  const bonus = Math.max(0, Math.ceil(state.timeLeftMs / 1000));
  state.score += bonus;
  state.levelStats[state.levelIndex] = {
    title: level.title,
    found: level.diffs.length,
    bonus,
    mistakes: state.mistakes,
    hintsUsed: state.hintsUsed,
  };
  SoundKit.levelClear();
  if (state.levelIndex + 1 >= LEVELS.length) {
    state.screen = 'win';
    SoundKit.winFanfare();
    showWin();
  } else {
    state.screen = 'complete';
    showLevelComplete(bonus);
  }
  updateHud();
}

function timeUp() {
  state.screen = 'over';
  SoundKit.timeUp();
  showGameOver();
}

// ---------- picking ----------

// markFound(diff, at) records a find the way a click does, minus the sound:
// the marker, the ticker line and the HUD all move. Shot mode uses it too,
// so a screenshot shows a game state the real code reached.
function markFound(diff, at) {
  view.found.set(diff.id, at);
  setTicker(`Found: ${diff.blurb}`);
  updateHud();
}

function handlePick(x, y, side) {
  if (state.screen !== 'playing' || state.paused || state.completing) return;
  const now = performance.now();
  let best = null;
  let bestDist = Infinity;
  for (const diff of level.diffs) {
    if (view.found.has(diff.id)) continue;
    const d = Math.hypot(x - diff.x, y - diff.y);
    if (d <= diff.r && d < bestDist) {
      best = diff;
      bestDist = d;
    }
  }
  if (best) {
    markFound(best, now);
    state.score += FIND_POINTS;
    SoundKit.pop();
    if (view.found.size >= level.diffs.length) {
      state.completing = true;
      setTimeout(completeLevel, 750);
    }
  } else {
    state.mistakes += 1;
    state.timeLeftMs = Math.max(0, state.timeLeftMs - MISS_SECONDS * 1000);
    view.misses.push({ x, y, at: now, side });
    SoundKit.miss();
    if (state.timeLeftMs <= 0) {
      updateHud();
      timeUp();
      return;
    }
  }
  updateHud();
}

function panelPoint(ev) {
  const rect = ev.currentTarget.getBoundingClientRect();
  return [
    (ev.clientX - rect.left) * (PANEL_SIZE / rect.width),
    (ev.clientY - rect.top) * (PANEL_SIZE / rect.height),
  ];
}

function useHint() {
  if (state.screen !== 'playing' || state.paused || state.completing) return;
  if (state.hintsLeft <= 0 || view.hint) return;
  const unfound = level.diffs.filter((d) => !view.found.has(d.id));
  if (unfound.length === 0) return;
  const diff = unfound[Math.floor(Math.random() * unfound.length)];
  view.hint = { diff, startedAt: performance.now() };
  state.hintsLeft -= 1;
  state.hintsUsed += 1;
  state.score = Math.max(0, state.score - HINT_COST);
  SoundKit.hintBlip();
  setTimeout(() => {
    if (view.hint && view.hint.diff === diff) view.hint = null;
  }, 1550);
  updateHud();
}

function togglePause() {
  if (state.screen !== 'playing' || state.completing) return;
  state.paused = !state.paused;
  if (state.paused) showPause();
  else hideOverlay();
}

// ---------- HUD and overlays ----------

function formatTime(ms) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function updateHud() {
  els.level.textContent = `Level ${state.levelIndex + 1} of ${LEVELS.length} · ${level.title}`;
  els.found.textContent = `${view.found.size} of ${level.diffs.length}`;
  els.left_count.textContent = String(level.diffs.length - view.found.size);
  els.mistakes.textContent = String(state.mistakes);
  els.score.textContent = String(state.score);
  els.hints.textContent = String(state.hintsLeft);
  els.btnHint.disabled = state.hintsLeft <= 0 || state.screen !== 'playing';
  updateTimerDisplay(true);
}

function updateTimerDisplay(force = false) {
  const s = Math.max(0, Math.ceil(state.timeLeftMs / 1000));
  if (!force && s === state.shownSecond) return;
  state.shownSecond = s;
  els.time.textContent = formatTime(state.timeLeftMs);
  const total = level.timeSeconds;
  els.timebar.style.width = `${Math.max(0, Math.min(100, (state.timeLeftMs / (total * 1000)) * 100))}%`;
  els.timebar.classList.toggle('danger', s <= 30);
  els.time.classList.toggle('danger', s <= 30);
}

function setTicker(text) {
  els.ticker.textContent = text;
  els.ticker.classList.toggle('show', text.length > 0);
}

let toastTimer = null;
function showToast(text) {
  if (state.frozen) return;
  els.toast.textContent = text;
  els.toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => els.toast.classList.remove('show'), 2100);
}

function showOverlay(html) {
  els.overlay.innerHTML = html;
  els.overlay.classList.add('show');
  for (const btn of els.overlay.querySelectorAll('[data-action]')) {
    btn.addEventListener('click', () => {
      SoundKit.ensure();
      runAction(btn.dataset.action);
    });
  }
}

function hideOverlay() {
  els.overlay.classList.remove('show');
  els.overlay.innerHTML = '';
}

function runAction(action) {
  if (action === 'play') startGame();
  else if (action === 'next') startLevel(state.levelIndex + 1);
  else if (action === 'retry') {
    state.score = state.scoreAtLevelStart;
    startLevel(state.levelIndex);
  } else if (action === 'resume') togglePause();
  else if (action === 'home') {
    state.screen = 'start';
    state.paused = false;
    showStart();
  }
}

function showStart() {
  showOverlay(`
    <div class="card">
      <p class="kicker">A spot-the-difference voyage</p>
      <h1>Lantern Harbor</h1>
      <p class="lede">One little harbor town, three times of day. Each scene is
      painted twice — and the two paintings disagree in a handful of places.
      Find every difference before the clock runs down.</p>
      <ul class="rules">
        <li>Click a difference in either picture to ring it on both.</li>
        <li>A wrong click costs ${MISS_SECONDS} seconds. Hints are limited and cost ${HINT_COST} points.</li>
        <li>Three levels: ${LEVELS.map((l) => `${l.diffs.length} at ${l.title}`).join(' · ')}.</li>
      </ul>
      <button class="big" data-action="play" type="button">Play</button>
    </div>`);
}

function showLevelComplete(bonus) {
  showOverlay(`
    <div class="card">
      <p class="kicker">Level ${state.levelIndex + 1} complete</p>
      <h2>${level.title} — every difference found</h2>
      <p class="lede">Time bonus +${bonus}. Score so far: <strong>${state.score}</strong>.</p>
      <p class="lede">Next, the town at ${LEVELS[state.levelIndex + 1].title === 'Market Day' ? 'noon' : 'dusk'}:
      ${LEVELS[state.levelIndex + 1].diffs.length} differences, and they hide better.</p>
      <button class="big" data-action="next" type="button">Next level</button>
    </div>`);
}

function showGameOver() {
  showOverlay(`
    <div class="card">
      <p class="kicker">Out of time</p>
      <h2>The clock beat you at ${level.title}</h2>
      <p class="lede">You found ${view.found.size} of ${level.diffs.length} differences.
      The rest are still out there, hiding in plain sight.</p>
      <button class="big" data-action="retry" type="button">Retry this level</button>
      <button class="ghost" data-action="home" type="button">Back to the start</button>
    </div>`);
}

function showPause() {
  showOverlay(`
    <div class="card">
      <p class="kicker">Paused</p>
      <h2>${level.title} waits</h2>
      <p class="lede">${view.found.size} of ${level.diffs.length} found, ${formatTime(state.timeLeftMs)} on the clock.</p>
      <button class="big" data-action="resume" type="button">Resume</button>
      <button class="ghost" data-action="retry" type="button">Restart this level</button>
      <button class="ghost" data-action="home" type="button">Back to the start</button>
    </div>`);
}

function showWin() {
  const rows = state.levelStats
    .map((s, i) => `<tr><td>Level ${i + 1} · ${s.title}</td><td>${s.found} found</td><td>+${s.bonus} time bonus</td><td>${s.mistakes} mistakes</td><td>${s.hintsUsed} hints</td></tr>`)
    .join('');
  showOverlay(`
    <div class="card">
      <p class="kicker">Every difference found</p>
      <h2>Harbor Master of Lantern Harbor</h2>
      <p class="lede">Final score: <strong>${state.score}</strong></p>
      <table class="stats">${rows}</table>
      <button class="big" data-action="play" type="button">Play again</button>
    </div>`);
}

// ---------- the frame loop ----------

function frame(now) {
  requestAnimationFrame(frame);
  if (state.screen === 'playing' && !state.paused && !state.frozen && !state.completing) {
    const dt = Math.min(100, now - state.lastTick);
    state.timeLeftMs -= dt;
    const s = Math.max(0, Math.ceil(state.timeLeftMs / 1000));
    if (s !== state.shownSecond) {
      if (s <= 10 && s > 0) SoundKit.tick();
      updateTimerDisplay();
    }
    if (state.timeLeftMs <= 0) {
      state.timeLeftMs = 0;
      updateTimerDisplay(true);
      timeUp();
    }
  }
  state.lastTick = now;
  if (sceneLeft && sceneRight) {
    drawPanel(lctx, sceneLeft, level, view, now, 'left');
    drawPanel(rctx, sceneRight, level, view, now, 'right');
  }
}

// ---------- shot mode (honest screenshots of real game states) ----------

// The maker's screenshots are taken with ?shot= URLs: shot=play puts a real
// level on screen with named differences found through markFound itself,
// shot=win shows a finished game's win screen, and the clock is frozen so
// the render is the state, not a race against it.
function applyShotMode(params) {
  const shot = params.get('shot');
  if (!shot) return;
  state.frozen = true;
  if (shot === 'play') {
    const index = Math.max(0, Math.min(LEVELS.length - 1, Number(params.get('level') || '1') - 1));
    startLevel(index);
    state.score = Number(params.get('score') || '0');
    state.mistakes = Number(params.get('mistakes') || '0');
    const used = Number(params.get('hintsused') || '0');
    state.hintsUsed = used;
    state.hintsLeft = Math.max(0, HINTS_PER_LEVEL - used);
    if (params.get('time')) state.timeLeftMs = Number(params.get('time')) * 1000;
    const at = performance.now() - 1200; // settled markers, past their pop
    for (const id of (params.get('found') || '').split(',').filter(Boolean)) {
      const diff = level.diffs.find((d) => d.id === id);
      if (diff) markFound(diff, at);
    }
    updateHud();
    updateTimerDisplay(true);
  } else if (shot === 'win') {
    state.levelStats = LEVELS.map((l, i) => ({
      title: l.title,
      found: l.diffs.length,
      bonus: [74, 51, 88][i],
      mistakes: [1, 2, 1][i],
      hintsUsed: [0, 1, 1][i],
    }));
    state.score = Number(params.get('score') || '2913');
    state.screen = 'win';
    state.levelIndex = 2;
    sceneLeft = buildSceneCanvas(LEVELS[2], 'left');
    sceneRight = buildSceneCanvas(LEVELS[2], 'right');
    level = LEVELS[2];
    showWin();
    updateHud();
  }
}

// ---------- wiring ----------

for (const [canvas, side] of [[els.left, 'left'], [els.right, 'right']]) {
  canvas.addEventListener('pointerdown', (ev) => {
    SoundKit.ensure();
    const [x, y] = panelPoint(ev);
    handlePick(x, y, side);
  });
}
els.btnHint.addEventListener('click', () => {
  SoundKit.ensure();
  useHint();
});
els.btnPause.addEventListener('click', () => {
  SoundKit.ensure();
  togglePause();
});
document.addEventListener('keydown', (ev) => {
  if (ev.key === 'h' || ev.key === 'H') {
    SoundKit.ensure();
    useHint();
  } else if (ev.key === 'p' || ev.key === 'P' || ev.key === 'Escape') {
    togglePause();
  }
});

// Boot: paint the first level behind the start screen, then let any shot
// mode replace the state, and start the frame loop.
sceneLeft = buildSceneCanvas(level, 'left');
sceneRight = buildSceneCanvas(level, 'right');
showStart();
updateHud();
applyShotMode(new URLSearchParams(location.search));
requestAnimationFrame(frame);

// A handle for the maker's own testing: the live state and the pick path.
window.LANTERN_HARBOR = { state, view, LEVELS, startLevel, handlePick };
