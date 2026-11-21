// scenes.js — the painters of Pell Harbor.
//
// Each level's scene is drawn twice by one painter function: once with the
// level's base variant flags (the left picture) and once with the right
// variant from differences.js. A painter draws the whole 580 by 580 panel
// with Canvas 2D vector shapes — there are no image files. Everything is
// placed by hand or by a fixed arithmetic scatter, never by a random source,
// so the two pictures differ only where a difference flag says they do.

const W = 580;
const H = 580;

// ---------- small drawing helpers ----------

function fillRect(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

function fillCircle(ctx, x, y, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function strokeCircle(ctx, x, y, r, color, width) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
}

function line(ctx, x1, y1, x2, y2, color, width) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function poly(ctx, points, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
  ctx.closePath();
  ctx.fill();
}

function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

function fillRoundRect(ctx, x, y, w, h, r, color) {
  roundRectPath(ctx, x, y, w, h, r);
  ctx.fillStyle = color;
  ctx.fill();
}

function skyGradient(ctx, stops) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  for (const [at, color] of stops) g.addColorStop(at, color);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

function glow(ctx, x, y, r, color, alpha) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color);
  g.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
  ctx.restore();
}

function cloud(ctx, x, y, s, color, shade) {
  ctx.fillStyle = shade;
  ctx.beginPath();
  ctx.ellipse(x, y + 10 * s, 52 * s, 15 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = color;
  for (const [dx, dy, r] of [[-34, 4, 17], [-12, -6, 23], [14, -8, 25], [36, 2, 18], [0, 6, 24]]) {
    ctx.beginPath();
    ctx.arc(x + dx * s, y + dy * s, r * s, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillRect(x - 50 * s, y, 100 * s, 12 * s);
}

function gull(ctx, x, y, s, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.4 * s;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(x - 8 * s, y, 8 * s, Math.PI * 1.15, Math.PI * 1.95);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x + 8 * s, y, 8 * s, Math.PI * 1.05, Math.PI * 1.85);
  ctx.stroke();
}

// A house window with a cross mullion; lit windows glow warm.
function houseWindow(ctx, x, y, w, h, lit, frame = '#5d4a36') {
  fillRect(ctx, x - 2, y - 2, w + 4, h + 4, frame);
  fillRect(ctx, x, y, w, h, lit ? '#ffd873' : '#33506b');
  if (lit) fillRect(ctx, x, y, w, h / 2, '#ffe49a');
  line(ctx, x + w / 2, y, x + w / 2, y + h, frame, 2);
  line(ctx, x, y + h / 2, x + w, y + h / 2, frame, 2);
}

// A shore house: body, pitched roof, chimney, door, and its windows.
function shoreHouse(ctx, x, baseY, w, h, wall, roof, windows, doorColor) {
  fillRect(ctx, x, baseY - h, w, h, wall);
  poly(ctx, [[x - 7, baseY - h], [x + w + 7, baseY - h], [x + w - 12, baseY - h - 24], [x + 12, baseY - h - 24]], roof);
  fillRect(ctx, x + w - 24, baseY - h - 34, 11, 18, '#8a7a68');
  fillRect(ctx, x + w / 2 - 9, baseY - 30, 18, 30, doorColor);
  fillCircle(ctx, x + w / 2 + 5, baseY - 15, 1.8, '#e8dcc0');
  for (const win of windows) houseWindow(ctx, win[0], win[1], win[2], win[3], win[4]);
}

// A striped canopy over a market stall: a slanted band whose back edge sits
// higher and a little to the left of its front edge, striped along its length.
function stallAwning(ctx, x1, x2, yBack, yFront, stripeA, stripeB) {
  const stripes = 8;
  const lean = -12;
  for (let i = 0; i < stripes; i++) {
    const fx0 = x1 + (x2 - x1) * (i / stripes);
    const fx1 = x1 + (x2 - x1) * ((i + 1) / stripes);
    poly(ctx, [
      [fx0, yFront],
      [fx1, yFront],
      [fx1 + lean, yBack],
      [fx0 + lean, yBack],
    ], i % 2 === 0 ? stripeA : stripeB);
  }
  line(ctx, x1, yFront, x2, yFront, 'rgba(90, 60, 30, 0.35)', 2);
}

// A paper lantern hanging from a point: cord, caps and a ribbed glowing body.
function paperLantern(ctx, x, yTop, r, color, dark) {
  line(ctx, x, yTop, x, yTop + 7, dark, 1.6);
  glow(ctx, x, yTop + 7 + r, r * 2.5, color, 0.35);
  fillRoundRect(ctx, x - r, yTop + 7, r * 2, r * 1.9, r * 0.8, color);
  ctx.save();
  ctx.globalAlpha = 0.35;
  ctx.strokeStyle = dark;
  ctx.lineWidth = 1;
  for (const dx of [-r * 0.55, 0, r * 0.55]) {
    ctx.beginPath();
    ctx.ellipse(x + dx, yTop + 7 + r * 0.95, r * 0.28, r * 0.92, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
  fillRect(ctx, x - r * 0.45, yTop + 5, r * 0.9, 4, dark);
  fillRect(ctx, x - r * 0.45, yTop + 7 + r * 1.9 - 2, r * 0.9, 4, dark);
}

// A point on a quadratic curve (for bunting and lantern strings).
function quadPoint(p0, p1, p2, t) {
  const a = (1 - t) * (1 - t);
  const b = 2 * (1 - t) * t;
  const c = t * t;
  return [a * p0[0] + b * p1[0] + c * p2[0], a * p0[1] + b * p1[1] + c * p2[1]];
}

function strokeQuad(ctx, p0, p1, p2, color, width) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(p0[0], p0[1]);
  ctx.quadraticCurveTo(p1[0], p1[1], p2[0], p2[1]);
  ctx.stroke();
}

// ---------- level 1: First Light, the dawn harbor ----------

function paintDawn(ctx, v) {
  skyGradient(ctx, [[0, '#7d9cc4'], [0.42, '#e0a878'], [0.62, '#f7dcb0'], [0.64, '#39698c'], [1, '#2c4f6e']]);

  // Sun low over the water, with its glow.
  glow(ctx, 452, 132, 74, 'rgba(255, 226, 150, 0.9)', 0.8);
  fillCircle(ctx, 452, 132, 30, '#fff3c4');
  fillCircle(ctx, 452, 132, 36, 'rgba(255, 243, 196, 0.35)');

  cloud(ctx, 110, 84, 1.0, '#fdf3e3', '#f0c9a0');
  cloud(ctx, 292, 56, 0.62, '#fdf3e3', '#f0c9a0');
  cloud(ctx, 486, 62, 0.78, '#fbeed9', '#eec39a');

  gull(ctx, 196, 120, 1.0, '#4a5a70');
  gull(ctx, 408, 142, 0.8, '#4a5a70');
  if (v.thirdGull) gull(ctx, 330, 96, 0.9, '#4a5a70');

  // Distant hills behind the shore.
  ctx.fillStyle = 'rgba(93, 114, 144, 0.85)';
  ctx.beginPath();
  ctx.moveTo(0, 332);
  ctx.bezierCurveTo(80, 296, 150, 306, 240, 318);
  ctx.bezierCurveTo(330, 330, 420, 300, 580, 322);
  ctx.lineTo(580, 356);
  ctx.lineTo(0, 356);
  ctx.closePath();
  ctx.fill();

  // The shore houses, bases tucked behind the quay.
  shoreHouse(ctx, 176, 350, 74, 92, '#ead9b8', '#b0563a',
    [[190, 282, 13, 16, false], [226, 282, 13, 16, false]], '#7a4a2b');
  shoreHouse(ctx, 258, 350, 84, 118, '#dde8ec', '#4f6f8f',
    [[270, 246, 14, 18, false], [314, 246, 14, 18, false]], '#5d4630');
  houseWindow(ctx, 292, 284, 16, 20, v.tallWinLit);
  shoreHouse(ctx, 350, 350, 70, 84, '#ecd9b0', '#7a8c4f',
    [[364, 286, 13, 16, false], [392, 286, 13, 16, true]], '#6b5136');
  shoreHouse(ctx, 428, 350, 88, 104, '#e6c9bd', '#6b4a63',
    [[444, 262, 14, 18, true], [478, 262, 14, 18, false], [444, 300, 14, 18, false], [478, 300, 14, 18, false]], '#54405a');

  // The quay the houses stand on.
  fillRect(ctx, 0, 348, 580, 20, '#77644e');
  fillRect(ctx, 0, 348, 580, 4, '#97835f');

  paintDawnLighthouse(ctx, v);
  paintDawnSea(ctx);
  paintDawnBoats(ctx, v);
  paintDawnPier(ctx, v);
}

function paintDawnLighthouse(ctx, v) {
  // Rocks the lighthouse stands on.
  poly(ctx, [[24, 356], [66, 332], [118, 338], [172, 354], [180, 388], [20, 388]], '#565064');
  poly(ctx, [[52, 356], [96, 344], [140, 354], [150, 380], [46, 380]], '#686078');
  // Tower: a tapered shaft, white with red bands.
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(74, 352);
  ctx.lineTo(126, 352);
  ctx.lineTo(117, 208);
  ctx.lineTo(83, 208);
  ctx.closePath();
  ctx.clip();
  fillRect(ctx, 70, 200, 60, 156, '#f4efe4');
  fillRect(ctx, 70, 316, 60, 22, '#c4503f');
  fillRect(ctx, 70, 262, 60, 22, '#c4503f');
  fillRect(ctx, 70, 210, 60, 16, '#c4503f');
  ctx.restore();
  // Gallery, lamp room and roof.
  fillRect(ctx, 74, 204, 52, 6, '#37424e');
  fillRect(ctx, 81, 180, 38, 24, '#37424e');
  if (v.lampLit) {
    glow(ctx, 100, 192, 44, 'rgba(255, 205, 80, 0.95)', 0.9);
    fillCircle(ctx, 100, 192, 9, '#ffd94d');
    fillCircle(ctx, 100, 192, 4.5, '#fff6d8');
  } else {
    fillCircle(ctx, 100, 192, 9, '#8fa5b5');
  }
  poly(ctx, [[76, 180], [124, 180], [100, 156]], '#37424e');
  fillCircle(ctx, 100, 154, 3, '#37424e');
}

function paintDawnSea(ctx) {
  // Sparkles and wavelets on the water (fixed scatter, same in both pictures).
  ctx.strokeStyle = 'rgba(207, 230, 242, 0.5)';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  for (let i = 0; i < 42; i++) {
    const x = 14 + ((i * 137) % 548);
    const y = 388 + ((i * 89) % 168);
    const len = 8 + ((i * 29) % 14);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + len, y);
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(255, 220, 160, 0.55)';
  for (let i = 0; i < 10; i++) {
    const x = 408 + ((i * 41) % 120);
    const y = 380 + i * 17;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 20 - (i % 3) * 5, y);
    ctx.stroke();
  }
}

function paintDawnBoats(ctx, v) {
  // A small fishing boat at anchor on the left.
  poly(ctx, [[84, 492], [152, 492], [140, 514], [96, 514]], '#6e4525');
  fillRect(ctx, 84, 488, 68, 5, '#8a5a30');
  fillRect(ctx, 104, 468, 26, 20, '#e8dcc4');
  fillRect(ctx, 110, 474, 9, 9, '#33506b');
  line(ctx, 122, 468, 122, 436, '#5d4630', 3);
  fillCircle(ctx, 122, 434, 3.4, '#ffd94d');

  // The big sailboat in the middle of the bay.
  line(ctx, 232, 452, 232, 316, '#5d4630', 4);
  const sailFill = v.sailColor === 'coral' ? '#e2604d' : '#f7efdb';
  poly(ctx, [[239, 330], [239, 438], [302, 438]], sailFill);
  poly(ctx, [[225, 344], [225, 432], [184, 432]], '#f7efdb');
  line(ctx, 232, 316, 302, 438, 'rgba(93, 70, 48, 0.6)', 1.4);
  line(ctx, 232, 316, 184, 432, 'rgba(93, 70, 48, 0.6)', 1.4);
  poly(ctx, [[192, 452], [274, 452], [259, 480], [205, 480]], '#7a4a2b');
  fillRect(ctx, 192, 452, 82, 5, '#a9713f');
  fillCircle(ctx, 250, 466, 4, '#e8dcc4');

  // A rowboat on the right, oar shipped.
  poly(ctx, [[446, 486], [512, 486], [498, 506], [458, 506]], '#5d7a8c');
  fillRect(ctx, 446, 482, 66, 5, '#7d9db0');
  line(ctx, 470, 484, 442, 462, '#8a6844', 3.4);

  // The channel buoy.
  if (v.buoy) {
    poly(ctx, [[416, 466], [440, 466], [434, 440], [422, 440]], '#d64541');
    fillRect(ctx, 420, 452, 16, 5, '#f4efe4');
    line(ctx, 428, 440, 428, 430, '#37424e', 3);
    strokeCircle(ctx, 428, 427, 4.5, '#37424e', 2.4);
    line(ctx, 404, 472, 452, 472, 'rgba(207, 230, 242, 0.7)', 2);
  }
}

function paintDawnPier(ctx, v) {
  // A wooden pier across the foreground, posts going down into the water.
  for (const px of [18, 108, 198, 288]) fillRect(ctx, px, 540, 10, 40, '#6f4f30');
  fillRect(ctx, 0, 526, 332, 9, '#8a6844');
  fillRect(ctx, 0, 535, 332, 9, '#77572f');
  line(ctx, 0, 526, 332, 526, '#a97c4c', 2);
  // A barrel on the pier, and the harbor cat on the barrel.
  fillRoundRect(ctx, 234, 498, 37, 30, 6, '#9a6b40');
  line(ctx, 234, 508, 271, 508, '#6f4a2a', 3);
  line(ctx, 234, 519, 271, 519, '#6f4a2a', 3);
  if (v.catOnBarrel) {
    ctx.fillStyle = '#2e2a33';
    ctx.beginPath();
    ctx.ellipse(252, 488, 13, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    fillCircle(ctx, 263, 478, 7, '#2e2a33');
    poly(ctx, [[258, 474], [261, 466], [264, 473]], '#2e2a33');
    poly(ctx, [[264, 473], [268, 466], [270, 474]], '#2e2a33');
    ctx.strokeStyle = '#2e2a33';
    ctx.lineWidth = 3.4;
    ctx.beginPath();
    ctx.moveTo(240, 490);
    ctx.quadraticCurveTo(228, 484, 232, 470);
    ctx.stroke();
    fillCircle(ctx, 261, 477, 1.3, '#ffd94d');
  }
  // The flagpole at the pier's end, and its flag.
  line(ctx, 318, 528, 318, 450, '#5d4630', 4);
  fillCircle(ctx, 318, 448, 3.4, '#c9a227');
  if (v.pierFlag) poly(ctx, [[318, 452], [352, 459], [318, 470]], '#2e8f86');
}

// ---------- level 2: Market Day, the noon square ----------

function paintMarket(ctx, v) {
  skyGradient(ctx, [[0, '#79bfe6'], [0.4, '#dff3fb'], [0.42, '#e8cf9e'], [1, '#caa96f']]);

  glow(ctx, 70, 64, 56, 'rgba(255, 246, 191, 0.95)', 0.85);
  fillCircle(ctx, 70, 64, 25, '#fff6bf');
  cloud(ctx, 186, 56, 0.8, '#ffffff', '#cfe4f2');
  cloud(ctx, 428, 80, 0.95, '#ffffff', '#cfe4f2');
  cloud(ctx, 524, 38, 0.55, '#ffffff', '#cfe4f2');

  paintMarketBunting(ctx, v);
  paintMarketRooftops(ctx);

  // The plaza floor, with a cobble pattern of pale arcs.
  const g = ctx.createLinearGradient(0, 300, 0, 580);
  g.addColorStop(0, '#e2c491');
  g.addColorStop(1, '#caa96f');
  ctx.fillStyle = g;
  ctx.fillRect(0, 300, 580, 280);
  ctx.strokeStyle = 'rgba(120, 90, 40, 0.16)';
  ctx.lineWidth = 2;
  for (let row = 0; row < 7; row++) {
    const y = 336 + row * 36;
    for (let i = 0; i < 9; i++) {
      const x = 12 + i * 66 + (row % 2) * 30;
      ctx.beginPath();
      ctx.arc(x, y, 22, Math.PI * 1.08, Math.PI * 1.92);
      ctx.stroke();
    }
  }

  paintMarketTower(ctx, v);
  paintMarketBuildings(ctx, v);
  paintMarketStallBack(ctx, v);
  paintMarketStallLeft(ctx, v);
  paintMarketStallRight(ctx, v);
  paintMarketFountain(ctx, v);
  paintMarketSacks(ctx, v);
  paintMarketCart(ctx, v);

  // Two ground pigeons pecking by the fountain, the same in both pictures.
  paintPigeon(ctx, 336, 542, 0.8);
  paintPigeon(ctx, 360, 552, 0.65);
}

function paintMarketBunting(ctx, v) {
  const p0 = [4, 116];
  const p1 = [290, 158];
  const p2 = [576, 100];
  strokeQuad(ctx, p0, p1, p2, '#7a6248', 2);
  const colors = ['#e2604d', '#2e8f86', '#f2b544', '#7fae7a'];
  const flags = 13;
  for (let i = 0; i < flags; i++) {
    const t = (i + 0.5) / flags;
    const [x, y] = quadPoint(p0, p1, p2, t);
    // The pennant near x = 422 is the one a difference can take away.
    if (!v.buntingFlag && Math.abs(x - 422) < 24) continue;
    poly(ctx, [[x - 10, y], [x + 10, y], [x, y + 20]], colors[i % colors.length]);
  }
}

function paintMarketRooftops(ctx) {
  ctx.fillStyle = '#c49a6c';
  ctx.fillRect(0, 208, 580, 46);
  const roofs = [[10, 178, 70], [92, 190, 54], [392, 186, 62], [470, 176, 74], [150, 196, 48], [336, 198, 44]];
  for (const [x, y, w] of roofs) {
    poly(ctx, [[x, 210], [x + w, 210], [x + w - 10, y], [x + 10, y]], '#a9764f');
  }
  fillRect(ctx, 30, 168, 9, 16, '#8a6242');
  fillRect(ctx, 500, 164, 9, 16, '#8a6242');
}

function paintMarketTower(ctx, v) {
  // The clock tower behind the square.
  fillRect(ctx, 252, 84, 76, 218, '#ddd3bf');
  fillRect(ctx, 252, 84, 8, 218, '#cbbca2');
  fillRect(ctx, 320, 84, 8, 218, '#cbbca2');
  poly(ctx, [[242, 86], [338, 86], [290, 24]], '#7a4a3a');
  fillCircle(ctx, 290, 20, 4, '#c9a227');
  // Clock face; the minute hand is what a difference moves.
  fillCircle(ctx, 290, 150, 29, '#6b5136');
  fillCircle(ctx, 290, 150, 25, '#fbf7ec');
  ctx.fillStyle = '#6b5136';
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    ctx.fillRect(290 + Math.cos(a) * 20 - 1, 150 + Math.sin(a) * 20 - 1, 2, 2);
  }
  const hourA = Math.PI; // the hour hand rests at nine
  const minA = -Math.PI / 2 + (v.clockMinute / 60) * Math.PI * 2;
  line(ctx, 290, 150, 290 + Math.cos(hourA) * 13, 150 + Math.sin(hourA) * 13, '#3a2e22', 4.4);
  line(ctx, 290, 150, 290 + Math.cos(minA) * 19, 150 + Math.sin(minA) * 19, '#3a2e22', 3);
  fillCircle(ctx, 290, 150, 3, '#3a2e22');
  // A bell arch under the clock.
  ctx.fillStyle = '#5d4a36';
  ctx.beginPath();
  ctx.moveTo(277, 226);
  ctx.lineTo(277, 204);
  ctx.arc(290, 204, 13, Math.PI, 0);
  ctx.lineTo(303, 226);
  ctx.closePath();
  ctx.fill();
  fillCircle(ctx, 290, 210, 6, '#c9a227');
  fillRect(ctx, 272, 262, 36, 40, '#8a6242');
  line(ctx, 290, 262, 290, 302, '#6f4f30', 2);
}

function paintMarketBuildings(ctx, v) {
  // The chandlery on the left, with its hanging sign.
  fillRect(ctx, 0, 176, 124, 236, '#eccfb2');
  poly(ctx, [[-6, 178], [130, 178], [104, 146], [20, 146]], '#9a5f43');
  houseWindow(ctx, 18, 268, 16, 20, false, '#7a6248');
  houseWindow(ctx, 84, 268, 16, 20, true, '#7a6248');
  houseWindow(ctx, 18, 322, 16, 20, true, '#7a6248');
  fillRect(ctx, 78, 348, 26, 64, '#6f4f30');
  // Sign bracket and the round sign itself; its glyph is a difference.
  line(ctx, 6, 206, 56, 206, '#37424e', 4);
  line(ctx, 6, 206, 6, 190, '#37424e', 4);
  line(ctx, 52, 206, 52, 214, '#37424e', 3);
  fillCircle(ctx, 52, 234, 21, '#6b5136');
  fillCircle(ctx, 52, 234, 17.5, '#fbf3dd');
  ctx.strokeStyle = '#44586b';
  ctx.fillStyle = '#44586b';
  ctx.lineWidth = 2.4;
  if (v.signGlyph === 'fish') {
    ctx.beginPath();
    ctx.ellipse(50, 234, 10, 5.6, 0, 0, Math.PI * 2);
    ctx.fill();
    poly(ctx, [[59, 234], [67, 228], [67, 240]], '#44586b');
    fillCircle(ctx, 45, 232, 1.5, '#fbf3dd');
  } else {
    line(ctx, 52, 224, 52, 242, '#44586b', 2.6);
    strokeCircle(ctx, 52, 221, 3.4, '#44586b', 2.2);
    line(ctx, 43, 236, 61, 236, '#44586b', 2.6);
    line(ctx, 43, 236, 47, 230, '#44586b', 2.4);
    line(ctx, 61, 236, 57, 230, '#44586b', 2.4);
  }
  // The tall house on the right, with flower boxes.
  fillRect(ctx, 456, 184, 124, 228, '#dfe8dd');
  poly(ctx, [[450, 186], [586, 186], [560, 152], [476, 152]], '#5f7a68');
  houseWindow(ctx, 476, 232, 16, 20, false, '#5d6e5a');
  houseWindow(ctx, 528, 232, 16, 20, false, '#5d6e5a');
  houseWindow(ctx, 476, 300, 16, 20, true, '#5d6e5a');
  fillRect(ctx, 470, 254, 28, 8, '#b0563a');
  fillCircle(ctx, 478, 252, 4, '#e2604d');
  fillCircle(ctx, 488, 251, 4, '#f2b544');
  fillRect(ctx, 502, 348, 26, 64, '#54685a');
}

function paintMarketStallBack(ctx, v) {
  // The small stall in the middle distance, in front of the tower.
  fillRect(ctx, 238, 282, 6, 76, '#8a6242');
  fillRect(ctx, 338, 282, 6, 76, '#8a6242');
  stallAwning(ctx, 226, 358, 258, 282, '#7fae7a', '#f7efdb');
  fillRect(ctx, 228, 330, 128, 28, '#a9743f');
  fillRect(ctx, 228, 330, 128, 6, '#c08b52');
  // Pots and jars along its counter.
  for (const [x, c] of [[244, '#b0563a'], [268, '#2e8f86'], [292, '#f2b544'], [316, '#7a4a63']]) {
    fillRoundRect(ctx, x, 312, 16, 18, 4, c);
    fillRect(ctx, x + 2, 308, 12, 5, '#6f4f30');
  }
  // A lantern hung under its awning, when the variant keeps it.
  if (v.stallLantern) {
    line(ctx, 258, 284, 258, 290, '#5d4630', 2);
    glow(ctx, 258, 300, 20, 'rgba(255, 190, 90, 0.9)', 0.7);
    fillRoundRect(ctx, 250, 290, 16, 20, 6, '#ffb84d');
    fillRect(ctx, 253, 287, 10, 4, '#5d4630');
    fillRect(ctx, 253, 309, 10, 4, '#5d4630');
  }
}

function paintMarketStallLeft(ctx, v) {
  // The fruit stall on the left of the square.
  fillRect(ctx, 46, 300, 7, 132, '#8a6242');
  fillRect(ctx, 192, 300, 7, 132, '#8a6242');
  stallAwning(ctx, 30, 214, 262, 302, '#e2604d', '#f7efdb');
  fillRect(ctx, 36, 392, 168, 42, '#a9743f');
  fillRect(ctx, 36, 392, 168, 7, '#c08b52');
  // Jars and loaves on the counter.
  for (const [x, c] of [[52, '#d64541'], [76, '#f08c2e'], [100, '#7fae7a']]) {
    fillRoundRect(ctx, x, 368, 18, 24, 4, c);
    fillRect(ctx, x + 3, 363, 12, 6, '#c9a227');
  }
  ctx.fillStyle = '#d9a45b';
  for (const x of [136, 162]) {
    ctx.beginPath();
    ctx.ellipse(x, 384, 13, 8, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // Two crates of fruit on the ground in front; the fruit is a difference.
  const fruitColor = v.fruit === 'oranges' ? '#f08c2e' : '#d64541';
  for (const cx of [64, 126]) {
    fillRect(ctx, cx, 452, 54, 36, '#b0824f');
    line(ctx, cx, 464, cx + 54, 464, '#8a6242', 3);
    line(ctx, cx, 476, cx + 54, 476, '#8a6242', 3);
    for (let r = 0; r < 2; r++) {
      for (let i = 0; i < 3; i++) {
        const fx = cx + 11 + i * 16;
        const fy = 446 + r * 13;
        fillCircle(ctx, fx, fy, 7, fruitColor);
        if (v.fruit === 'apples') fillCircle(ctx, fx + 2, fy - 6, 2.2, '#7fae7a');
      }
    }
  }
}

function paintMarketStallRight(ctx, v) {
  // The cloth stall on the right; its awning colour is a difference.
  fillRect(ctx, 386, 300, 7, 132, '#8a6242');
  fillRect(ctx, 530, 300, 7, 132, '#8a6242');
  const awn = v.awningB === 'coral' ? '#e2604d' : '#2e8f86';
  stallAwning(ctx, 370, 554, 262, 302, awn, '#f7efdb');
  fillRect(ctx, 376, 392, 168, 42, '#a9743f');
  fillRect(ctx, 376, 392, 168, 7, '#c08b52');
  // Bolts of cloth stacked on the counter.
  const bolts = [[392, '#7a4a63'], [392, '#f2b544'], [392, '#2e8f86'], [452, '#b0563a'], [452, '#5f7a68']];
  bolts.forEach(([x, c], i) => {
    fillRoundRect(ctx, x, 384 - (i % 3) * 13, 52, 12, 5, c);
  });
  // Clay pots under the counter's right end.
  for (const x of [492, 516]) {
    poly(ctx, [[x, 434], [x + 18, 434], [x + 15, 452], [x + 3, 452]], '#b0563a');
  }
}

function paintPigeon(ctx, x, y, s) {
  ctx.fillStyle = '#9aa7ad';
  ctx.beginPath();
  ctx.ellipse(x, y, 10 * s, 7 * s, -0.25, 0, Math.PI * 2);
  ctx.fill();
  fillCircle(ctx, x + 8 * s, y - 6 * s, 4.6 * s, '#8b98a0');
  poly(ctx, [[x - 9 * s, y - 2 * s], [x - 16 * s, y - 6 * s], [x - 14 * s, y + 2 * s]], '#8b98a0');
  fillCircle(ctx, x + 9 * s, y - 7 * s, 1.1 * s, '#2e2a33');
  fillCircle(ctx, x + 12 * s, y - 5 * s, 1.6 * s, '#e2a13d');
}

function paintMarketFountain(ctx, v) {
  // The fountain at the square's heart.
  ctx.fillStyle = 'rgba(120, 90, 40, 0.25)';
  ctx.beginPath();
  ctx.ellipse(290, 500, 100, 30, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#aebfc6';
  ctx.beginPath();
  ctx.ellipse(290, 492, 88, 26, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#79c2dc';
  ctx.beginPath();
  ctx.ellipse(290, 489, 74, 19, 0, 0, Math.PI * 2);
  ctx.fill();
  fillRect(ctx, 282, 428, 16, 44, '#b9c6cc');
  ctx.fillStyle = '#aebfc6';
  ctx.beginPath();
  ctx.ellipse(290, 428, 30, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(230, 246, 252, 0.85)';
  ctx.lineWidth = 2;
  for (const dx of [-16, 0, 16]) {
    ctx.beginPath();
    ctx.moveTo(290 + dx * 0.3, 434);
    ctx.quadraticCurveTo(290 + dx, 452, 290 + dx * 1.5, 478);
    ctx.stroke();
  }
  // The pigeon on the rim, when the variant keeps it.
  if (v.pigeon) paintPigeon(ctx, 222, 452, 1.0);
}

function paintMarketSacks(ctx, v) {
  // Grain sacks leaning by the fruit stall; the top one is a difference.
  const sack = (x, y, w, h, c) => {
    fillRoundRect(ctx, x, y, w, h, 9, c);
    line(ctx, x + 6, y + 5, x + w - 6, y + 5, 'rgba(90, 70, 30, 0.4)', 2);
  };
  sack(146, 496, 36, 26, '#cbb27f');
  sack(184, 500, 34, 24, '#bfa76e');
  if (v.sackCount >= 3) sack(164, 476, 32, 24, '#d8c08a');
}

function paintMarketCart(ctx, v) {
  // The hand cart in the right foreground; a difference shifts it a pace.
  ctx.save();
  ctx.translate(v.cartShift, 0);
  fillRect(ctx, 428, 478, 112, 14, '#9a6b40');
  fillRect(ctx, 428, 478, 112, 4, '#b0824f');
  line(ctx, 428, 486, 398, 468, '#8a6242', 5);
  line(ctx, 432, 492, 420, 516, '#8a6242', 5);
  // A barrel and a sack ride on the bed.
  fillRoundRect(ctx, 488, 446, 32, 33, 6, '#9a6b40');
  line(ctx, 488, 457, 520, 457, '#6f4a2a', 3);
  line(ctx, 488, 468, 520, 468, '#6f4a2a', 3);
  fillRoundRect(ctx, 442, 452, 36, 26, 9, '#cbb27f');
  // The big spoked wheel and the small one.
  const wheel = (x, y, r) => {
    strokeCircle(ctx, x, y, r, '#5d4630', 6);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      line(ctx, x, y, x + Math.cos(a) * (r - 3), y + Math.sin(a) * (r - 3), '#8a6242', 3);
    }
    fillCircle(ctx, x, y, 5, '#5d4630');
  };
  wheel(452, 522, 24);
  wheel(524, 530, 14);
  ctx.restore();
}

// ---------- level 3: Lantern Dusk, the festival evening ----------

function paintDusk(ctx, v) {
  skyGradient(ctx, [[0, '#1f1c3f'], [0.45, '#46325e'], [0.68, '#7a4460'], [0.7, '#1b2a52'], [1, '#131f3d']]);

  paintDuskStars(ctx, v);
  paintDuskFirework(ctx, 92, 128, v.fireworkColor === 'violet' ? '#b892ff' : '#ffd166');
  paintDuskFirework(ctx, 168, 176, '#ff7d9c');
  paintDuskMoon(ctx, v);

  // The lighthouse and its beam come before the lantern strings, so the
  // strings hang in front of the light.
  paintDuskLighthouse(ctx, v);
  paintDuskHouses(ctx, v);
  paintDuskLanternStrings(ctx, v);

  // The water, and what the water remembers.
  if (v.lightReflection) paintDuskLightPath(ctx, 92, 402, 486, 'rgba(255, 190, 90, 0.4)');
  paintDuskSparkles(ctx);
  paintDuskBoats(ctx, v);
}

function paintDuskStars(ctx, v) {
  ctx.fillStyle = '#e8e4f5';
  for (let i = 0; i < 52; i++) {
    const x = 12 + ((i * 149) % 556);
    const y = 14 + ((i * 83) % 300);
    if (Math.abs(x - 150) < 16 && Math.abs(y - 70) < 16) continue; // the bright star's place
    if (Math.abs(x - 478) < 34 && Math.abs(y - 88) < 34) continue; // the moon's place
    ctx.globalAlpha = 0.35 + ((i * 29) % 60) / 100;
    ctx.fillRect(x, y, 2, 2);
  }
  ctx.globalAlpha = 1;
  if (v.brightStar) {
    fillCircle(ctx, 150, 70, 3.2, '#ffffff');
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(150, 58);
    ctx.lineTo(150, 82);
    ctx.moveTo(138, 70);
    ctx.lineTo(162, 70);
    ctx.stroke();
  }
}

function paintDuskFirework(ctx, cx, cy, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.2;
  ctx.lineCap = 'round';
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const inner = 8;
    const outer = 24 + ((i * 13) % 14);
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * inner, cy + Math.sin(a) * inner);
    ctx.lineTo(cx + Math.cos(a) * outer, cy + Math.sin(a) * outer);
    ctx.stroke();
    fillCircle(ctx, cx + Math.cos(a) * (outer + 4), cy + Math.sin(a) * (outer + 4), 1.8, color);
  }
  fillCircle(ctx, cx, cy, 2.6, '#ffffff');
}

function paintDuskMoon(ctx, v) {
  // A crescent cut from a disc on a scratch canvas, so the sky shows through
  // the cut; flipping the difference mirrors which way the crescent opens.
  const scratch = document.createElement('canvas');
  scratch.width = 64;
  scratch.height = 64;
  const s = scratch.getContext('2d');
  s.fillStyle = '#f6ead2';
  s.beginPath();
  s.arc(32, 32, 24, 0, Math.PI * 2);
  s.fill();
  s.globalCompositeOperation = 'destination-out';
  s.beginPath();
  s.arc(v.moonFlip ? 20 : 44, 25, 20, 0, Math.PI * 2);
  s.fill();
  ctx.drawImage(scratch, 478 - 32, 88 - 32);
  glow(ctx, 478, 88, 44, 'rgba(246, 234, 210, 0.5)', 0.35);
}

function paintDuskLighthouse(ctx, v) {
  // Rocks and a dark tower; the lamp itself burns in both pictures.
  poly(ctx, [[18, 396], [62, 372], [122, 378], [168, 396], [174, 420], [14, 420]], '#171430');
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(68, 392);
  ctx.lineTo(116, 392);
  ctx.lineTo(108, 224);
  ctx.lineTo(76, 224);
  ctx.closePath();
  ctx.clip();
  fillRect(ctx, 64, 218, 56, 178, '#2b2752');
  fillRect(ctx, 64, 356, 56, 20, '#3d3670');
  fillRect(ctx, 64, 292, 56, 20, '#3d3670');
  fillRect(ctx, 64, 232, 56, 14, '#3d3670');
  ctx.restore();
  fillRect(ctx, 70, 220, 44, 6, '#171430');
  fillRect(ctx, 78, 198, 28, 22, '#171430');
  glow(ctx, 92, 209, 40, 'rgba(255, 205, 80, 0.95)', 0.9);
  fillCircle(ctx, 92, 209, 8, '#ffd94d');
  fillCircle(ctx, 92, 209, 4, '#fff6d8');
  poly(ctx, [[72, 198], [112, 198], [92, 176]], '#171430');
  // The beam, when the variant keeps it: a soft cone reaching over the bay.
  if (v.beam) {
    const beamGrad = ctx.createLinearGradient(104, 0, 340, 0);
    beamGrad.addColorStop(0, 'rgba(255, 214, 120, 0.4)');
    beamGrad.addColorStop(1, 'rgba(255, 214, 120, 0.03)');
    ctx.fillStyle = beamGrad;
    ctx.beginPath();
    ctx.moveTo(104, 197);
    ctx.lineTo(340, 156);
    ctx.lineTo(340, 240);
    ctx.lineTo(104, 221);
    ctx.closePath();
    ctx.fill();
  }
}

function paintDuskHouses(ctx, v) {
  // Silhouette houses along the shore, their windows lit for the festival.
  const house = (x, baseY, w, h, windows) => {
    fillRect(ctx, x, baseY - h, w, h, '#241f42');
    poly(ctx, [[x - 6, baseY - h], [x + w + 6, baseY - h], [x + w - 10, baseY - h - 22], [x + 10, baseY - h - 22]], '#1b1836');
    for (const [wx, wy, lit] of windows) {
      fillRect(ctx, wx, wy, 13, 17, lit ? '#ffca66' : '#17142e');
      if (lit) fillRect(ctx, wx, wy, 13, 8, '#ffdf9e');
    }
  };
  house(150, 392, 90, 92, [[166, 330, true], [204, 330, true], [166, 358, false]]);
  house(252, 392, 96, 110, [[268, 312, true], [312, 312, false], [268, 348, true], [312, 348, true]]);
  house(360, 392, 110, 96, [[376, 326, true], [440, 326, true], [376, 356, false]]);
  // The difference window of the third house, lit or dark by the variant.
  fillRect(ctx, 408, 322, 16, 20, v.duskWinLit ? '#ffca66' : '#17142e');
  if (v.duskWinLit) fillRect(ctx, 408, 322, 16, 9, '#ffdf9e');
  house(482, 392, 98, 86, [[534, 332, true], [534, 360, false]]);
  fillRect(ctx, 496, 340, 15, 19, '#ffca66');
  // The owl on the last house's roof, when the variant keeps it.
  if (v.owl) {
    ctx.fillStyle = '#12102a';
    ctx.beginPath();
    ctx.ellipse(508, 276, 8, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    poly(ctx, [[501, 270], [503, 263], [506, 269]], '#12102a');
    poly(ctx, [[510, 269], [513, 263], [515, 270]], '#12102a');
    fillCircle(ctx, 505, 274, 1.7, '#ffca66');
    fillCircle(ctx, 511, 274, 1.7, '#ffca66');
  }
}

function paintDuskLanternStrings(ctx, v) {
  const cycle = ['#ffb84d', '#7fe0c3', '#ff7d9c', '#ffd166'];
  const stringOf = (p0, p1, p2, count, colorOverride, dropIndex) => {
    strokeQuad(ctx, p0, p1, p2, '#0f0d24', 2);
    for (let i = 0; i < count; i++) {
      const t = (i + 0.5) / count;
      const [x, y] = quadPoint(p0, p1, p2, t);
      let color = cycle[i % cycle.length];
      if (colorOverride && colorOverride.index === i) color = colorOverride.color;
      const drop = dropIndex === i ? v.dropLantern : 0;
      paperLantern(ctx, x, y + drop, 8.5, color, '#0f0d24');
    }
  };
  // Upper string: its third lantern is rose on the left, teal on the right —
  // the variant's stringLanternColor is what the painter lays down.
  stringOf([8, 150], [290, 182], [572, 196], 9,
    { index: 2, color: v.stringLanternColor === 'teal' ? '#7fe0c3' : '#ff7d9c' }, -1);
  // Lower string: its sixth lantern hangs lower when the variant drops it.
  stringOf([8, 238], [290, 266], [572, 262], 8, null, 5);
}

function paintDuskLightPath(ctx, cx, y0, y1, color) {
  ctx.strokeStyle = color;
  ctx.lineCap = 'round';
  for (let i = 0; i < 9; i++) {
    const y = y0 + ((y1 - y0) / 9) * i;
    const wdt = 26 - i * 1.6 + ((i * 17) % 7);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx - wdt / 2, y);
    ctx.lineTo(cx + wdt / 2, y);
    ctx.stroke();
  }
}

function paintDuskSparkles(ctx) {
  ctx.strokeStyle = 'rgba(190, 200, 255, 0.3)';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  for (let i = 0; i < 34; i++) {
    const x = 16 + ((i * 131) % 540);
    const y = 408 + ((i * 71) % 150);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 7 + ((i * 19) % 10), y);
    ctx.stroke();
  }
  // The moon lays its own pale path on the right.
  paintDuskLightPath(ctx, 478, 404, 470, 'rgba(230, 228, 245, 0.22)');
}

function paintDuskBoats(ctx, v) {
  // The festival boat in the middle of the bay, dressed with a mast lantern.
  line(ctx, 292, 452, 292, 372, '#0f0d24', 4);
  poly(ctx, [[298, 384], [298, 442], [344, 442]], '#3a3468');
  poly(ctx, [[238, 452], [348, 452], [330, 482], [254, 482]], '#131126');
  line(ctx, 238, 452, 348, 452, '#6a5a8c', 2.4);
  glow(ctx, 292, 366, 26, 'rgba(255, 184, 77, 0.9)', 0.85);
  paperLantern(ctx, 292, 352, 7, '#ffb84d', '#0f0d24');
  fillCircle(ctx, 268, 466, 3, '#ffca66');
  fillCircle(ctx, 316, 466, 3, '#ff7d9c');
  // Its reflection, when the variant keeps it.
  if (v.boatReflection) {
    paintDuskLightPath(ctx, 292, 492, 548, 'rgba(150, 175, 255, 0.3)');
    ctx.strokeStyle = 'rgba(255, 184, 77, 0.45)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(284, 496);
    ctx.lineTo(300, 496);
    ctx.stroke();
  }
  // A small boat on the right; its mast flag is a difference.
  line(ctx, 472, 474, 472, 428, '#0f0d24', 3);
  poly(ctx, [[472, 428], [472, 441], [489, 434]], v.boatFlagColor === 'teal' ? '#57c9b4' : '#ffb84d');
  poly(ctx, [[440, 474], [506, 474], [494, 494], [452, 494]], '#131126');
  line(ctx, 440, 474, 506, 474, '#6a5a8c', 2);
  glow(ctx, 472, 462, 14, 'rgba(255, 184, 77, 0.8)', 0.6);
  fillCircle(ctx, 472, 462, 3, '#ffca66');
}

// ---------- dispatch ----------

const PAINTERS = {
  dawn: paintDawn,
  market: paintMarket,
  dusk: paintDusk,
};

// paintScene(ctx, level, variant) draws one whole panel of a level: the
// painter named by the level, reading the variant flags it is given.
export function paintScene(ctx, level, variant) {
  ctx.clearRect(0, 0, W, H);
  PAINTERS[level.painter](ctx, variant);
}
