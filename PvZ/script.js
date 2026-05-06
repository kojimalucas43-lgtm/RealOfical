// ─────────────────────────────────────────────
//  PLANTAS VS ZUMBIS — game.js
// ─────────────────────────────────────────────

const COLS = 9, ROWS = 5;
let CELL_W, CELL_H;
let canvas, ctx, gameArea;

// ── STATE ──
let sun, score, wave, paused, gameRunning;
let plants, zombies, projectiles, particles, fallingSuns;
let selectedPlant = null;
let lastTime = 0;
let zombieSpawnTimer = 0;
let sunProduceTimers = [];
let waveCooldown = 0;
let zombiesThisWave = 0, zombiesSpawned = 0;
let waveActive = false;
let plantCooldowns = {};

// ── PLANT DEFINITIONS ──
const PLANT_DEFS = {
  sunflower: { cost: 50,  hp: 150, color: '#f5c518', borderColor: '#d4a000', emoji: '🌻', shootInterval: 0, sunInterval: 8000, name: 'Girassol' },
  peashooter:{ cost: 100, hp: 200, color: '#4aaa20', borderColor: '#2a7a10', emoji: '🌿', shootInterval: 1500, sunInterval: 0, name: 'Ervilheiro' },
  wallnut:   { cost: 50,  hp: 800, color: '#d4a040', borderColor: '#a07020', emoji: '🌰', shootInterval: 0, sunInterval: 0, name: 'Nogueira' },
  snowpea:   { cost: 175, hp: 200, color: '#80d0ff', borderColor: '#40a0d0', emoji: '❄️', shootInterval: 1500, sunInterval: 0, freeze: true, name: 'Ervilha Gelada' },
  cherry:    { cost: 150, hp: 1,   color: '#e84040', borderColor: '#a00000', emoji: '🍒', shootInterval: 0, sunInterval: 0, explosion: true, name: 'Cereja Bomba' },
};

// ── ZOMBIE DEFINITIONS ──
const ZOMBIE_DEFS = [
  { type: 'normal', hp: 180, speed: 28, color: '#7aad5e', borderColor: '#4a7a2e', emoji: '🧟', damage: 40, score: 10 },
  { type: 'cone',   hp: 360, speed: 25, color: '#8aba6e', borderColor: '#5a8a3e', emoji: '🧟', hat: '🔺', damage: 40, score: 20 },
  { type: 'bucket', hp: 700, speed: 20, color: '#9aca7e', borderColor: '#6a9a4e', emoji: '🧟', hat: '🪣', damage: 60, score: 40 },
  { type: 'fast',   hp: 120, speed: 55, color: '#aada8e', borderColor: '#7aaa5e', emoji: '🧟', damage: 25, score: 15 },
];

// ─────────────────────────────────────────────
//  INIT
// ─────────────────────────────────────────────
function init() {
  canvas    = document.getElementById('gameCanvas');
  ctx       = canvas.getContext('2d');
  gameArea  = document.getElementById('gameArea');

  resize();
  window.addEventListener('resize', resize);

  // Start screen
  document.getElementById('startBtn').addEventListener('click', startGame);
  document.getElementById('restartBtn').addEventListener('click', startGame);
  document.getElementById('pauseBtn').addEventListener('click', togglePause);

  // Plant tray
  document.querySelectorAll('.plant-card').forEach(card => {
    card.addEventListener('click', () => {
      const type = card.dataset.plant;
      if (card.classList.contains('disabled')) return;
      if (selectedPlant === type) {
        selectedPlant = null;
        document.querySelectorAll('.plant-card').forEach(c => c.classList.remove('selected'));
      } else {
        selectedPlant = type;
        document.querySelectorAll('.plant-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        canvas.style.cursor = 'crosshair';
      }
    });
  });

  canvas.addEventListener('click', onCanvasClick);
}

function resize() {
  const rect = gameArea.getBoundingClientRect();
  canvas.width  = rect.width;
  canvas.height = rect.height;
  CELL_W = canvas.width / COLS;
  CELL_H = canvas.height / ROWS;
}

// ─────────────────────────────────────────────
//  GAME START / RESET
// ─────────────────────────────────────────────
function startGame() {
  sun         = 100;
  score       = 0;
  wave        = 1;
  paused      = false;
  gameRunning = true;
  plants      = [];
  zombies     = [];
  projectiles = [];
  particles   = [];
  fallingSuns = [];
  sunProduceTimers = [];
  plantCooldowns   = {};
  selectedPlant    = null;
  zombieSpawnTimer = 0;
  waveCooldown     = 0;
  waveActive       = false;
  zombiesThisWave  = 0;
  zombiesSpawned   = 0;

  document.getElementById('startScreen').classList.remove('active');
  document.getElementById('gameOverScreen').classList.remove('active');
  document.getElementById('gameContainer').classList.remove('hidden');
  document.querySelectorAll('.plant-card').forEach(c => c.classList.remove('selected', 'disabled'));
  canvas.style.cursor = 'default';

  updateHUD();
  startWave(1);

  // Natural sun drops
  setInterval(dropNaturalSun, 7000 + Math.random() * 3000);

  lastTime = performance.now();
  requestAnimationFrame(loop);
}

// ─────────────────────────────────────────────
//  WAVE SYSTEM
// ─────────────────────────────────────────────
function startWave(w) {
  wave = w;
  zombiesThisWave = 5 + w * 3;
  zombiesSpawned  = 0;
  zombieSpawnTimer = 0;
  waveActive = true;
  waveCooldown = 0;
  updateHUD();
}

function waveZombieCount(w) { return 5 + w * 3; }

// ─────────────────────────────────────────────
//  MAIN LOOP
// ─────────────────────────────────────────────
function loop(ts) {
  if (!gameRunning) return;
  const dt = Math.min(ts - lastTime, 50);
  lastTime = ts;

  if (!paused) {
    update(dt);
    draw();
  }
  requestAnimationFrame(loop);
}

// ─────────────────────────────────────────────
//  UPDATE
// ─────────────────────────────────────────────
function update(dt) {
  updateWave(dt);
  updatePlants(dt);
  updateZombies(dt);
  updateProjectiles(dt);
  updateParticles(dt);
  checkCollisions();
  checkGameOver();
  updateHUD();
  updateTray();
}

function updateWave(dt) {
  if (!waveActive) {
    waveCooldown += dt;
    if (waveCooldown > 5000) startWave(wave + 1);
    return;
  }
  zombieSpawnTimer += dt;
  const interval = Math.max(1500, 4000 - wave * 200);
  if (zombiesSpawned < zombiesThisWave && zombieSpawnTimer > interval) {
    spawnZombie();
    zombiesSpawned++;
    zombieSpawnTimer = 0;
  }
  if (zombiesSpawned >= zombiesThisWave && zombies.length === 0) {
    waveActive = false;
    waveCooldown = 0;
  }
}

function updatePlants(dt) {
  plants.forEach(p => {
    const def = PLANT_DEFS[p.type];

    // Sunflower produces sun
    if (def.sunInterval > 0) {
      p.sunTimer = (p.sunTimer || 0) + dt;
      if (p.sunTimer >= def.sunInterval) {
        p.sunTimer = 0;
        spawnPlantSun(p);
      }
    }

    // Shooter plants
    if (def.shootInterval > 0) {
      p.shootTimer = (p.shootTimer || 0) + dt;
      const hasTarget = zombies.some(z => z.row === p.row && z.x < canvas.width);
      if (hasTarget && p.shootTimer >= def.shootInterval) {
        p.shootTimer = 0;
        fireProjectile(p, def);
      }
    }

    // Cherry bomb explodes immediately
    if (def.explosion && !p.exploded) {
      p.exploded = true;
      cherryExplosion(p);
    }
  });
}

function updateZombies(dt) {
  zombies.forEach(z => {
    if (z.frozen > 0) {
      z.frozen -= dt;
      return;
    }
    const blocking = plants.find(p => p.row === z.row && cellX(p.col) + CELL_W > z.x && cellX(p.col) < z.x + 40);
    if (blocking) {
      z.eating = true;
      blocking.hp -= z.damage * (dt / 1000);
      if (blocking.hp <= 0) {
        removePlant(blocking);
        z.eating = false;
      }
    } else {
      z.eating = false;
      z.x -= z.speed * (dt / 1000);
    }

    // Zombie walking animation
    z.walkFrame = (z.walkFrame || 0) + dt * 0.008;
  });

  // Remove dead zombies
  for (let i = zombies.length - 1; i >= 0; i--) {
    if (zombies[i].hp <= 0) {
      spawnParticles(zombies[i].x + 20, cellY(zombies[i].row) + CELL_H / 2, '#7aad5e', 12);
      score += zombies[i].scorePts;
      zombies.splice(i, 1);
    }
  }
}

function updateProjectiles(dt) {
  projectiles.forEach(p => {
    p.x += p.vx * (dt / 1000);
    p.frame = (p.frame || 0) + dt * 0.02;
  });
  for (let i = projectiles.length - 1; i >= 0; i--) {
    if (projectiles[i].x > canvas.width + 20) projectiles.splice(i, 1);
  }
}

function updateParticles(dt) {
  particles.forEach(p => {
    p.x  += p.vx * (dt / 1000);
    p.y  += p.vy * (dt / 1000);
    p.vy += 200 * (dt / 1000);
    p.life -= dt;
    p.alpha = Math.max(0, p.life / p.maxLife);
  });
  for (let i = particles.length - 1; i >= 0; i--) {
    if (particles[i].life <= 0) particles.splice(i, 1);
  }
}

function checkCollisions() {
  projectiles.forEach(proj => {
    zombies.forEach(z => {
      if (z.row !== proj.row) return;
      if (proj.x + 10 >= z.x && proj.x - 10 <= z.x + 40) {
        z.hp -= proj.damage;
        if (proj.freeze) z.frozen = 2500;
        spawnParticles(proj.x, proj.y, proj.color, 5);
        proj.x = canvas.width + 100; // mark for removal
      }
    });
  });
}

function checkGameOver() {
  if (zombies.some(z => z.x < -10)) {
    endGame(false);
  }
}

// ─────────────────────────────────────────────
//  SPAWN HELPERS
// ─────────────────────────────────────────────
function spawnZombie() {
  const row  = Math.floor(Math.random() * ROWS);
  const pool = wave < 3 ? [0, 0, 0, 3] : wave < 5 ? [0, 0, 1, 3] : [0, 1, 2, 3];
  const def  = ZOMBIE_DEFS[pool[Math.floor(Math.random() * pool.length)]];
  zombies.push({
    ...def,
    hp: def.hp * (1 + wave * 0.15),
    maxHp: def.hp * (1 + wave * 0.15),
    x: canvas.width + 60 + Math.random() * 100,
    row,
    scorePts: def.score,
    eating: false,
    walkFrame: 0,
    frozen: 0,
  });
}

function fireProjectile(plant, def) {
  projectiles.push({
    x: cellX(plant.col) + CELL_W,
    y: cellY(plant.row) + CELL_H / 2,
    row: plant.row,
    vx: def.freeze ? 300 : 380,
    damage: def.freeze ? 20 : 30,
    color: def.freeze ? '#80d0ff' : '#60cc20',
    freeze: def.freeze || false,
    frame: 0,
  });
}

function cherryExplosion(plant) {
  const cx = cellX(plant.col) + CELL_W / 2;
  const cy = cellY(plant.row) + CELL_H / 2;
  const radius = CELL_W * 1.8;

  zombies.forEach(z => {
    const zx = z.x + 20, zy = cellY(z.row) + CELL_H / 2;
    const dist = Math.hypot(cx - zx, cy - zy);
    if (dist < radius) z.hp -= 900;
  });

  spawnParticles(cx, cy, '#ff4040', 30);
  spawnParticles(cx, cy, '#ffa020', 20);
  spawnParticles(cx, cy, '#fff070', 15);

  // Remove cherry after explosion
  setTimeout(() => removePlant(plant), 50);
}

function dropNaturalSun() {
  if (!gameRunning || paused) return;
  const x = 60 + Math.random() * (canvas.width - 120);
  createFallingSun(x);
  setTimeout(dropNaturalSun, 6000 + Math.random() * 4000);
}

function spawnPlantSun(plant) {
  const x = cellX(plant.col) + CELL_W / 2;
  createFallingSun(x);
}

function createFallingSun(x) {
  const el = document.createElement('div');
  el.className = 'falling-sun';
  el.textContent = '☀️';
  el.style.left = x + 'px';
  el.style.top  = (getCanvasTop() + 20) + 'px';
  el.style.position = 'absolute';

  const value = 25;
  el.addEventListener('click', () => {
    sun += value;
    spawnParticles(x, parseFloat(el.style.top) - getCanvasTop(), '#ffd700', 8);
    el.remove();
  });

  gameArea.appendChild(el);
  setTimeout(() => el.remove(), 6200);
}

function getCanvasTop() {
  return canvas.getBoundingClientRect().top - gameArea.getBoundingClientRect().top;
}

function spawnParticles(x, y, color, count) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 60 + Math.random() * 140;
    particles.push({
      x, y, color,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 80,
      life: 400 + Math.random() * 300,
      maxLife: 700,
      alpha: 1,
      size: 3 + Math.random() * 4,
    });
  }
}

// ─────────────────────────────────────────────
//  GRID HELPERS
// ─────────────────────────────────────────────
function cellX(col) { return col * CELL_W; }
function cellY(row) { return row * CELL_H; }

function onCanvasClick(e) {
  if (!gameRunning || paused || !selectedPlant) return;
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;
  const col = Math.floor(mx / CELL_W);
  const row = Math.floor(my / CELL_H);
  if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return;
  if (plants.some(p => p.col === col && p.row === row)) return;

  const def = PLANT_DEFS[selectedPlant];
  if (sun < def.cost) return;

  sun -= def.cost;
  plants.push({
    type: selectedPlant, col, row,
    hp: def.hp, maxHp: def.hp,
    shootTimer: 0, sunTimer: 0,
    exploded: false,
  });

  spawnParticles(cellX(col) + CELL_W / 2, cellY(row) + CELL_H / 2, def.color, 10);

  selectedPlant = null;
  document.querySelectorAll('.plant-card').forEach(c => c.classList.remove('selected'));
  canvas.style.cursor = 'default';
}

function removePlant(p) {
  const idx = plants.indexOf(p);
  if (idx !== -1) plants.splice(idx, 1);
}

// ─────────────────────────────────────────────
//  DRAW
// ─────────────────────────────────────────────
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBackground();
  drawGrid();
  drawPlants();
  drawProjectiles();
  drawZombies();
  drawParticles();
  drawHoverCell();
}

function drawBackground() {
  // Sky
  const sky = ctx.createLinearGradient(0, 0, 0, canvas.height * 0.4);
  sky.addColorStop(0, '#87ceeb');
  sky.addColorStop(1, '#aee8f8');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, canvas.width, canvas.height * 0.4);

  // Grass rows alternate
  for (let r = 0; r < ROWS; r++) {
    const y = cellY(r);
    const grd = ctx.createLinearGradient(0, y, 0, y + CELL_H);
    grd.addColorStop(0, r % 2 === 0 ? '#5ab52a' : '#4aaa20');
    grd.addColorStop(1, r % 2 === 0 ? '#4aaa20' : '#3a9a10');
    ctx.fillStyle = grd;
    ctx.fillRect(0, y, canvas.width, CELL_H);
  }

  // Danger zone
  ctx.fillStyle = 'rgba(220,40,40,0.10)';
  ctx.fillRect(0, 0, CELL_W * 0.5, canvas.height);

  // Right edge
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.fillRect(canvas.width - 4, 0, 4, canvas.height);
}

function drawGrid() {
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.lineWidth = 1;
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r < ROWS; r++) {
      ctx.strokeRect(cellX(c), cellY(r), CELL_W, CELL_H);
    }
  }
}

function drawHoverCell() {
  if (!selectedPlant) return;
  // We track mouse on canvas
}

canvas_mousemove: {
  let hoverCol = -1, hoverRow = -1;
  document.addEventListener('mousemove', e => {
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    hoverCol = Math.floor((e.clientX - rect.left) / CELL_W);
    hoverRow = Math.floor((e.clientY - rect.top)  / CELL_H);
  });

  // Patch drawHoverCell
  const origDraw = drawHoverCell;
  // Override with closure
  window._hoverDraw = function() {
    if (!selectedPlant || hoverCol < 0 || hoverCol >= COLS || hoverRow < 0 || hoverRow >= ROWS) return;
    const occupied = plants.some(p => p.col === hoverCol && p.row === hoverRow);
    ctx.fillStyle = occupied ? 'rgba(220,60,60,0.35)' : 'rgba(255,255,255,0.25)';
    ctx.fillRect(cellX(hoverCol), cellY(hoverRow), CELL_W, CELL_H);
    ctx.strokeStyle = occupied ? '#e84040' : '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(cellX(hoverCol), cellY(hoverRow), CELL_W, CELL_H);
  };
}

function drawPlants() {
  plants.forEach(p => {
    const def  = PLANT_DEFS[p.type];
    const x    = cellX(p.col);
    const y    = cellY(p.row);
    const cx   = x + CELL_W / 2;
    const cy   = y + CELL_H / 2;
    const r    = Math.min(CELL_W, CELL_H) * 0.4;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.ellipse(cx, y + CELL_H - 4, r * 0.7, r * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body circle
    ctx.fillStyle = def.color;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = def.borderColor;
    ctx.lineWidth = 3;
    ctx.stroke();

    // Emoji
    ctx.font = `${r * 1.2}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(def.emoji, cx, cy);

    // HP bar
    const hpRatio = p.hp / p.maxHp;
    const bw = CELL_W * 0.7, bh = 6;
    const bx = cx - bw / 2, by = y + CELL_H - 12;
    ctx.fillStyle = '#333';
    ctx.fillRect(bx, by, bw, bh);
    ctx.fillStyle = hpRatio > 0.5 ? '#40cc20' : hpRatio > 0.25 ? '#f0c020' : '#e84040';
    ctx.fillRect(bx, by, bw * hpRatio, bh);
  });
}

function drawZombies() {
  zombies.forEach(z => {
    const def  = ZOMBIE_DEFS.find(d => d.type === z.type) || ZOMBIE_DEFS[0];
    const y    = cellY(z.row);
    const cy   = y + CELL_H / 2;
    const r    = Math.min(CELL_W, CELL_H) * 0.38;
    const wobble = Math.sin(z.walkFrame) * (z.eating ? 3 : 5);

    ctx.save();
    ctx.translate(z.x + 20, cy + wobble);

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.ellipse(0, r * 0.9, r * 0.7, r * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body
    ctx.fillStyle = z.frozen > 0 ? '#a0d8ff' : def.color;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = z.frozen > 0 ? '#60a0e0' : def.borderColor;
    ctx.lineWidth = 3;
    ctx.stroke();

    // Emoji
    ctx.font = `${r * 1.2}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(def.emoji, 0, 0);

    // Hat
    if (def.hat) {
      ctx.font = `${r * 0.9}px serif`;
      ctx.fillText(def.hat, 0, -r * 0.8);
    }

    // Freeze sparkle
    if (z.frozen > 0) {
      ctx.font = `${r * 0.6}px serif`;
      ctx.fillText('❄', r * 0.7, -r * 0.7);
    }

    ctx.restore();

    // HP bar
    const hpRatio = z.hp / z.maxHp;
    const bw = CELL_H * 0.7, bh = 6;
    const bx = z.x + 20 - bw / 2, by = y + CELL_H - 12;
    ctx.fillStyle = '#333';
    ctx.fillRect(bx, by, bw, bh);
    ctx.fillStyle = hpRatio > 0.5 ? '#cc2020' : '#ff6040';
    ctx.fillRect(bx, by, bw * Math.max(0, hpRatio), bh);
  });
}

function drawProjectiles() {
  projectiles.forEach(p => {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.frame);

    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(0, 0, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(-2, -2, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  });
}

function drawParticles() {
  particles.forEach(p => {
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * p.alpha, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
}

// Patch draw to call hover overlay
const _origDraw = draw;
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBackground();
  drawGrid();
  if (window._hoverDraw) window._hoverDraw();
  drawPlants();
  drawProjectiles();
  drawZombies();
  drawParticles();
  drawWaveAnnouncement();
}

let waveAnnounceTimer = 0;
let waveAnnounceText = '';
const origStartWave = startWave;
function startWave(w) {
  wave = w;
  zombiesThisWave = 5 + w * 3;
  zombiesSpawned  = 0;
  zombieSpawnTimer = 0;
  waveActive = true;
  waveCooldown = 0;
  updateHUD();
  waveAnnounceTimer = 2500;
  waveAnnounceText = w === 1 ? '🧟 PRIMEIRA ONDA!' : `🧟 ONDA ${w}!`;
}

function drawWaveAnnouncement() {
  if (waveAnnounceTimer <= 0) return;
  const alpha = Math.min(1, waveAnnounceTimer / 500);
  ctx.globalAlpha = alpha;
  ctx.font = `bold ${Math.round(canvas.height * 0.07)}px 'Fredoka One', cursive`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffd700';
  ctx.shadowColor = '#000';
  ctx.shadowBlur = 12;
  ctx.fillText(waveAnnounceText, canvas.width / 2, canvas.height / 2);
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;
}

// Patch update to tick announcement
const _origUpdate = update;
function update(dt) {
  if (waveAnnounceTimer > 0) waveAnnounceTimer -= dt;
  updateWave(dt);
  updatePlants(dt);
  updateZombies(dt);
  updateProjectiles(dt);
  updateParticles(dt);
  checkCollisions();
  checkGameOver();
  updateHUD();
  updateTray();
}

// ─────────────────────────────────────────────
//  HUD & TRAY
// ─────────────────────────────────────────────
function updateHUD() {
  document.getElementById('sunValue').textContent = Math.floor(sun);
  document.getElementById('waveNum').textContent  = wave;
  document.getElementById('scoreVal').textContent = score;
}

function updateTray() {
  document.querySelectorAll('.plant-card').forEach(card => {
    const cost = parseInt(card.dataset.cost);
    card.classList.toggle('disabled', sun < cost);
  });
}

// ─────────────────────────────────────────────
//  PAUSE
// ─────────────────────────────────────────────
function togglePause() {
  paused = !paused;
  document.getElementById('pauseBtn').textContent = paused ? '▶' : '⏸';
  if (!paused) {
    lastTime = performance.now();
    requestAnimationFrame(loop);
  }
}

// ─────────────────────────────────────────────
//  GAME OVER
// ─────────────────────────────────────────────
function endGame(won) {
  gameRunning = false;
  document.getElementById('gameContainer').classList.add('hidden');
  const goScreen = document.getElementById('gameOverScreen');
  goScreen.classList.add('active');
  document.getElementById('gameOverTitle').textContent = won ? '🏆 VITÓRIA!' : '💀 GAME OVER';
  document.getElementById('gameOverMsg').textContent   = won ? 'Você defendeu o jardim!' : 'Os zumbis invadiram seu jardim!';
  document.getElementById('finalScore').textContent    = `Pontuação: ${score} | Onda: ${wave}`;
}

// ─────────────────────────────────────────────
//  BOOT
// ─────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', init);
