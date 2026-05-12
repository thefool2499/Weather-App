/* ══════════════════════════════
   13. CANVAS WEATHER ENGINE
══════════════════════════════ */
const canvas = document.getElementById('weather-canvas');
const ctx    = canvas.getContext('2d');
let W, H, animId;
let particles = [], clouds = [], stars = [];
let lightningTimer = 0, lightningFlash = 0;
export let currentMood = null;
export let moonPhaseData = null;

export function setMoonPhaseData(v) { moonPhaseData = v; }

export function resizeCanvas() {
  const prevW = W, prevH = H;
  W = canvas.width  = window.innerWidth;
  H = canvas.height = window.innerHeight;

  // On first call prevW/prevH are undefined — nothing to rescale yet.
  if (!prevW || !prevH) return;

  const scaleX = W / prevW;
  const scaleY = H / prevH;

  // Rescale existing particles/clouds/stars proportionally so resize doesn't
  // nuke the scene. This avoids the flash from initScene() being called on every resize.
  particles.forEach(p => {
    if (p.x !== undefined) p.x *= scaleX;
    if (p.y !== undefined) p.y *= scaleY;
  });
  clouds.forEach(c => {
    c.x *= scaleX;
    c.y *= scaleY;
  });
  stars.forEach(s => {
    s.x *= scaleX;
    s.y *= scaleY;
  });
}

export function getMood(condId, isDaytime) {
  if (condId >= 200 && condId <= 232) return 'stormy';
  if (condId >= 300 && condId <= 321) return 'drizzle';
  if (condId >= 500 && condId <= 531) return 'rainy';
  if (condId >= 600 && condId <= 622) return 'snowy';
  if (condId >= 700 && condId <= 781) return 'foggy';
  if (condId === 800) return isDaytime ? 'sunny' : 'night';
  if (condId === 801 || condId === 802) return isDaytime ? 'partly-cloudy' : 'night';
  return 'cloudy';
}

const MOOD_BG = {
  sunny:          [['#ff9a3c','0%'], ['#f97316','40%'], ['#fde68a','100%']],
  night:          [['#020617','0%'], ['#0a0f2e','50%'], ['#1e1b4b','100%']],
  'partly-cloudy':[['#2196f3','0%'], ['#64b5f6','50%'], ['#bbdefb','100%']],
  cloudy:         [['#546e7a','0%'], ['#78909c','50%'], ['#b0bec5','100%']],
  drizzle:        [['#1a2a4a','0%'], ['#1e3a5f','60%'], ['#1e293b','100%']],
  rainy:          [['#080f1e','0%'], ['#0f172a','50%'], ['#1a2744','100%']],
  stormy:         [['#050507','0%'], ['#09090b','50%'], ['#0f0e14','100%']],
  snowy:          [['#90caf9','0%'], ['#bbdefb','50%'], ['#e3f2fd','100%']],
  foggy:          [['#9e9e9e','0%'], ['#bdbdbd','50%'], ['#e0e0e0','100%']],
};

function paintBg(mood) {
  const stops = MOOD_BG[mood] || MOOD_BG.cloudy;
  const g     = ctx.createLinearGradient(0, 0, 0, H);
  stops.forEach(([c, p]) => g.addColorStop(parseFloat(p) / 100, c));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

export function initScene(mood) {
  const fadeEl = document.getElementById('theme-fade');
  fadeEl.classList.add('fading');
  setTimeout(() => fadeEl.classList.remove('fading'), 500);

  cancelAnimationFrame(animId);
  particles = []; clouds = []; stars = [];
  lightningTimer = 0; lightningFlash = 0;
  currentMood = mood;
  document.body.className = 'mood-' + mood;
  canvas.classList.add('visible');
  ({
    sunny:          initSunny,
    night:          initNight,
    'partly-cloudy':initPartlyCloudy,
    cloudy:         initCloudy,
    drizzle:        initDrizzle,
    rainy:          initRain,
    stormy:         initStormy,
    snowy:          initSnow,
    foggy:          initFoggy,
  }[mood] || initCloudy)();
  animate();
}

/* --- Scene initialisers --- */
function initSunny() {
  particles.push({ type: 'sun', x: W * 0.82, y: H * 0.16, r: 58, phase: 0 });
  for (let i = 0; i < 14; i++) particles.push({ type: 'ray', angle: (i / 14) * Math.PI * 2, base: 12, len: 26 + Math.random() * 20, phase: Math.random() * Math.PI * 2 });
  for (let i = 0; i < 4; i++)  clouds.push({ x: -80 + Math.random() * W * 0.7, y: H * 0.12 + i * H * 0.09, w: 160 + Math.random() * 140, h: 52 + Math.random() * 28, speed: 0.2 + Math.random() * 0.12 });
}
function initNight() {
  for (let i = 0; i < 130; i++) stars.push({ x: Math.random() * W, y: Math.random() * H * 0.82, r: 0.4 + Math.random() * 1.8, phase: Math.random() * Math.PI * 2, speed: 0.012 + Math.random() * 0.02 });
  particles.push({ type: 'moon', x: Math.min(W * 0.82, W - 90), y: Math.max(H * 0.14, 80), r: Math.min(52, W * 0.07) });
  particles.push({ type: 'shooting', x: -60, y: Math.random() * H * 0.25, vx: 7, vy: 3, alpha: 0 });
}
function initPartlyCloudy() {
  particles.push({ type: 'sun', x: W * 0.76, y: H * 0.14, r: 46, phase: 0 });
  for (let i = 0; i < 10; i++) particles.push({ type: 'ray', angle: (i / 10) * Math.PI * 2, base: 10, len: 16 + Math.random() * 14, phase: Math.random() * Math.PI * 2 });
  for (let i = 0; i < 5;  i++) clouds.push({ x: Math.random() * W * 1.2, y: H * 0.05 + i * H * 0.1, w: 130 + Math.random() * 160, h: 44 + Math.random() * 30, speed: 0.24 + Math.random() * 0.14 });
}
function initCloudy() {
  for (let i = 0; i < 7; i++) clouds.push({ x: -200 + Math.random() * W * 1.4, y: H * 0.02 + i * H * 0.12, w: 220 + Math.random() * 200, h: 65 + Math.random() * 40, speed: 0.12 + Math.random() * 0.1 });
}
function initDrizzle() {
  for (let i = 0; i < 60; i++) particles.push({ type: 'drop', x: Math.random() * W, y: Math.random() * H, len: 7 + Math.random() * 5, speed: 4 + Math.random() * 3, opacity: 0.12 + Math.random() * 0.18, angle: 0.06 });
  for (let i = 0; i < 3;  i++) clouds.push({ x: -80 + Math.random() * W, y: H * 0.02 + i * H * 0.09, w: 170 + Math.random() * 120, h: 48 + Math.random() * 28, speed: 0.15 });
}
function initRain() {
  for (let i = 0; i < 110; i++) particles.push({ type: 'drop', x: Math.random() * W, y: Math.random() * H, len: 16 + Math.random() * 10, speed: 10 + Math.random() * 6, opacity: 0.18 + Math.random() * 0.24, angle: 0.13 });
  for (let i = 0; i < 4;   i++) clouds.push({ x: -100 + Math.random() * W, y: H * 0.02 + i * H * 0.08, w: 190 + Math.random() * 140, h: 55 + Math.random() * 30, speed: 0.18 });
  for (let i = 0; i < 10;  i++) particles.push({ type: 'ripple', x: Math.random() * W, y: H * 0.88 + Math.random() * H * 0.1, r: 0, maxR: 18 + Math.random() * 18, speed: 0.4 + Math.random() * 0.3, alpha: 0.35 });
}
function initStormy() {
  for (let i = 0; i < 150; i++) particles.push({ type: 'drop', x: Math.random() * W, y: Math.random() * H, len: 22 + Math.random() * 14, speed: 18 + Math.random() * 8, opacity: 0.18 + Math.random() * 0.28, angle: 0.24 });
  for (let i = 0; i < 6;   i++) clouds.push({ x: -200 + Math.random() * W * 1.3, y: H * 0.01 + i * H * 0.1, w: 260 + Math.random() * 200, h: 70 + Math.random() * 45, speed: 0.3 + Math.random() * 0.15 });
  lightningTimer = 70 + Math.random() * 80;
  particles.push({ type: 'bolt', segments: [], alpha: 0 });
}
function initSnow() {
  for (let i = 0; i < 85; i++) particles.push({ type: 'snow', x: Math.random() * W, y: Math.random() * H, r: 1.8 + Math.random() * 4.8, speed: 0.5 + Math.random() * 1.4, drift: (Math.random() - 0.5) * 0.5, phase: Math.random() * Math.PI * 2, opacity: 0.5 + Math.random() * 0.45 });
  for (let i = 0; i < 3;  i++) clouds.push({ x: Math.random() * W, y: H * 0.02 + i * H * 0.09, w: 170 + Math.random() * 140, h: 48 + Math.random() * 26, speed: 0.14 });
}
function initFoggy() {
  for (let i = 0; i < 8; i++) clouds.push({ x: -300 + Math.random() * W * 1.5, y: H * 0.04 + i * (H * 0.13), w: 380 + Math.random() * 300, h: 80 + Math.random() * 65, speed: 0.09 + Math.random() * 0.11 });
}

/* --- Draw helpers --- */
function drawDetailedSun(sx, sy, r, phase, op = 1) {
  ctx.save(); ctx.globalAlpha = op;
  const halo = ctx.createRadialGradient(sx, sy, r * 0.9, sx, sy, r * 4.5);
  halo.addColorStop(0, 'rgba(255,200,50,0.18)'); halo.addColorStop(1, 'rgba(255,120,0,0)');
  ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(sx, sy, r * 4.5, 0, Math.PI * 2); ctx.fill();
  const pulse = 1 + Math.sin(phase) * 0.04;
  ctx.strokeStyle = 'rgba(255,220,80,0.35)'; ctx.lineWidth = r * 0.18;
  ctx.beginPath(); ctx.arc(sx, sy, r * 1.22 * pulse, 0, Math.PI * 2); ctx.stroke();
  const disc = ctx.createRadialGradient(sx - r * 0.25, sy - r * 0.25, 0, sx, sy, r);
  disc.addColorStop(0, '#fff7a0'); disc.addColorStop(0.5, '#ffd740'); disc.addColorStop(1, '#e65c00');
  ctx.fillStyle = disc; ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawSunRays(sx, sy, r, rays, alpha = 1) {
  ctx.save(); ctx.globalAlpha = alpha;
  rays.forEach(ray => {
    ray.phase += 0.022;
    const len  = ray.len * (1 + Math.sin(ray.phase) * 0.38);
    const grad = ctx.createLinearGradient(sx + Math.cos(ray.angle) * (r + ray.base), sy + Math.sin(ray.angle) * (r + ray.base), sx + Math.cos(ray.angle) * (r + ray.base + len), sy + Math.sin(ray.angle) * (r + ray.base + len));
    grad.addColorStop(0, 'rgba(255,215,50,0.7)'); grad.addColorStop(1, 'rgba(255,180,0,0)');
    ctx.strokeStyle = grad; ctx.lineWidth = 3.5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(sx + Math.cos(ray.angle) * (r + ray.base), sy + Math.sin(ray.angle) * (r + ray.base)); ctx.lineTo(sx + Math.cos(ray.angle) * (r + ray.base + len), sy + Math.sin(ray.angle) * (r + ray.base + len)); ctx.stroke();
  });
  ctx.restore();
}

function drawDetailedMoon(mx, my, r, phaseValue) {
  ctx.save();
  const glow = ctx.createRadialGradient(mx, my, r * 0.8, mx, my, r * 3);
  glow.addColorStop(0, 'rgba(180,200,255,0.2)'); glow.addColorStop(1, 'rgba(100,120,255,0)');
  ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(mx, my, r * 3, 0, Math.PI * 2); ctx.fill();
  const moonDisc = ctx.createRadialGradient(mx - r * 0.2, my - r * 0.2, 0, mx, my, r);
  moonDisc.addColorStop(0, '#f0f4ff'); moonDisc.addColorStop(0.6, '#d0d8f0'); moonDisc.addColorStop(1, '#a0b0d8');
  ctx.fillStyle = moonDisc; ctx.beginPath(); ctx.arc(mx, my, r, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawDetailedCloud(x, y, w, h, baseColor, shadowColor, opacity = 1) {
  ctx.save(); ctx.globalAlpha = opacity;
  const puffs = [
    { ox: 0.5,  oy: 0.68, rx: 0.5,  ry: 0.42 },
    { ox: 0.28, oy: 0.55, rx: 0.3,  ry: 0.52 },
    { ox: 0.72, oy: 0.60, rx: 0.26, ry: 0.44 },
    { ox: 0.5,  oy: 0.32, rx: 0.22, ry: 0.36 },
    { ox: 0.38, oy: 0.38, rx: 0.18, ry: 0.32 },
  ];
  puffs.forEach(p => { ctx.fillStyle = shadowColor; ctx.beginPath(); ctx.ellipse(x + p.ox * w, y + p.oy * h + h * 0.1, p.rx * w, p.ry * h * 0.7, 0, 0, Math.PI * 2); ctx.fill(); });
  puffs.forEach(p => { ctx.fillStyle = baseColor;   ctx.beginPath(); ctx.ellipse(x + p.ox * w, y + p.oy * h,           p.rx * w, p.ry * h,       0, 0, Math.PI * 2); ctx.fill(); });
  ctx.restore();
}

/* --- Main animation loop --- */
function animate() {
  ctx.clearRect(0, 0, W, H);
  paintBg(currentMood);

  if (currentMood === 'sunny') {
    const sun = particles.find(p => p.type === 'sun');
    if (sun) { sun.phase += 0.016; drawSunRays(sun.x, sun.y, sun.r, particles.filter(p => p.type === 'ray')); drawDetailedSun(sun.x, sun.y, sun.r, sun.phase); }
    clouds.forEach(c => { c.x += c.speed; if (c.x > W + c.w) c.x = -c.w; drawDetailedCloud(c.x, c.y, c.w, c.h, '#ffffff', 'rgba(180,200,220,0.5)', 0.72); });
  }
  else if (currentMood === 'night') {
    stars.forEach(s => { s.phase += s.speed; const op = Math.max(0, 0.3 + Math.sin(s.phase) * 0.5); ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fillStyle = `rgba(255,255,255,${op})`; ctx.fill(); });
    const moon = particles.find(p => p.type === 'moon');
    if (moon && moonPhaseData) drawDetailedMoon(moon.x, moon.y, moon.r, moonPhaseData.value);
    const ss = particles.find(p => p.type === 'shooting');
    if (ss) {
      ss.x += ss.vx; ss.y += ss.vy;
      if (ss.x < W * 0.45) ss.alpha = Math.min(1, ss.alpha + 0.035);
      else ss.alpha = Math.max(0, ss.alpha - 0.025);
      if (ss.x > W + 60) { ss.x = -60; ss.y = Math.random() * H * 0.28; ss.alpha = 0; }
      if (ss.alpha > 0) {
        const trail = ctx.createLinearGradient(ss.x - ss.vx * 12, ss.y - ss.vy * 12, ss.x, ss.y);
        trail.addColorStop(0, 'rgba(255,255,255,0)'); trail.addColorStop(1, `rgba(255,255,255,${ss.alpha * 0.8})`);
        ctx.strokeStyle = trail; ctx.lineWidth = 1.8; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(ss.x - ss.vx * 12, ss.y - ss.vy * 12); ctx.lineTo(ss.x, ss.y); ctx.stroke();
      }
    }
  }
  else if (currentMood === 'partly-cloudy') {
    const sun = particles.find(p => p.type === 'sun');
    if (sun) { sun.phase += 0.015; drawSunRays(sun.x, sun.y, sun.r, particles.filter(p => p.type === 'ray'), 0.8); drawDetailedSun(sun.x, sun.y, sun.r, sun.phase, 0.9); }
    clouds.forEach(c => { c.x += c.speed; if (c.x > W + c.w) c.x = -c.w; drawDetailedCloud(c.x, c.y, c.w, c.h, '#ffffff', 'rgba(160,185,210,0.45)', 0.82); });
  }
  else if (currentMood === 'cloudy') {
    clouds.forEach(c => { c.x += c.speed; if (c.x > W + c.w) c.x = -c.w; drawDetailedCloud(c.x, c.y, c.w, c.h, '#d0d8e4', 'rgba(120,140,165,0.45)', 0.88); });
  }
  else if (currentMood === 'drizzle' || currentMood === 'rainy') {
    const grey = currentMood === 'drizzle' ? '180,200,220' : '100,130,160';
    clouds.forEach(c => { c.x += c.speed; if (c.x > W + c.w) c.x = -c.w; drawDetailedCloud(c.x, c.y, c.w, c.h, `rgb(${grey})`, `rgba(${grey},0.45)`, 0.78); });
    particles.forEach(p => {
      if (p.type === 'drop') {
        ctx.strokeStyle = `rgba(147,197,253,${p.opacity})`; ctx.lineWidth = currentMood === 'drizzle' ? 0.8 : 1.2;
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + Math.sin(p.angle) * p.len, p.y + p.len); ctx.stroke();
        p.y += p.speed; p.x += Math.sin(p.angle) * p.speed * 0.5;
        if (p.y > H + 20) { p.y = -20; p.x = Math.random() * W; }
        if (p.x > W + 20) p.x = -20;
      }
      if (p.type === 'ripple') {
        p.r += p.speed; p.alpha -= 0.01;
        if (p.r > p.maxR || p.alpha <= 0) { p.r = 0; p.x = Math.random() * W; p.alpha = 0.35; }
        ctx.strokeStyle = `rgba(147,197,253,${p.alpha})`; ctx.lineWidth = 0.8;
        ctx.beginPath(); ctx.ellipse(p.x, p.y, p.r, p.r * 0.28, 0, 0, Math.PI * 2); ctx.stroke();
      }
    });
  }
  else if (currentMood === 'stormy') {
    clouds.forEach(c => { c.x += c.speed; if (c.x > W + c.w) c.x = -c.w; drawDetailedCloud(c.x, c.y, c.w, c.h, '#37474f', 'rgba(10,10,15,0.7)', 0.9); });
    particles.filter(p => p.type === 'drop').forEach(p => {
      ctx.strokeStyle = `rgba(140,185,230,${p.opacity})`; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + Math.sin(p.angle) * p.len, p.y + p.len); ctx.stroke();
      p.y += p.speed; p.x += Math.sin(p.angle) * p.speed * 0.5;
      if (p.y > H + 20) { p.y = -20; p.x = Math.random() * W; }
      if (p.x > W + 20) p.x = -20;
    });
    lightningTimer--;
    if (lightningTimer <= 0) {
      lightningFlash = 12; lightningTimer = 65 + Math.random() * 85;
      const bolt = particles.find(p => p.type === 'bolt');
      if (bolt) {
        bolt.segments = []; let bx = W * 0.2 + Math.random() * W * 0.6, by = 0;
        while (by < H * 0.6) { const nx = bx + (Math.random() - 0.5) * 55, ny = by + 16 + Math.random() * 22; bolt.segments.push([bx, by, nx, ny]); bx = nx; by = ny; }
        bolt.alpha = 1;
      }
    }
    if (lightningFlash > 0) {
      ctx.fillStyle = `rgba(255,240,150,${lightningFlash * 0.016})`; ctx.fillRect(0, 0, W, H);
      const bolt = particles.find(p => p.type === 'bolt');
      if (bolt && bolt.alpha > 0) {
        ctx.strokeStyle = `rgba(255,220,80,${bolt.alpha * 0.25})`; ctx.lineWidth = 10; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.beginPath(); bolt.segments.forEach(([x1, y1, x2, y2], i) => { if (i === 0) ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); }); ctx.stroke();
        ctx.strokeStyle = `rgba(255,250,200,${bolt.alpha * 0.95})`; ctx.lineWidth = 2.5;
        ctx.beginPath(); bolt.segments.forEach(([x1, y1, x2, y2], i) => { if (i === 0) ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); }); ctx.stroke();
        bolt.alpha -= 0.12;
      }
      lightningFlash--;
    }
  }
  else if (currentMood === 'snowy') {
    clouds.forEach(c => { c.x += c.speed; if (c.x > W + c.w) c.x = -c.w; drawDetailedCloud(c.x, c.y, c.w, c.h, '#e3f2fd', 'rgba(120,160,210,0.35)', 0.7); });
    particles.filter(p => p.type === 'snow').forEach(p => {
      p.phase += 0.018; p.x += p.drift + Math.sin(p.phase) * 0.55; p.y += p.speed;
      if (p.y > H + 10) { p.y = -10; p.x = Math.random() * W; }
      if (p.x > W + 10) p.x = -10;
      if (p.x < -10)    p.x = W + 10;
      ctx.save(); ctx.globalAlpha = p.opacity;
      if (p.r > 3.2) {
        ctx.strokeStyle = 'rgba(255,255,255,0.95)'; ctx.lineWidth = 1.1; ctx.lineCap = 'round';
        for (let a = 0; a < 6; a++) { const ang = (a / 6) * Math.PI; ctx.beginPath(); ctx.moveTo(p.x - Math.cos(ang) * p.r, p.y - Math.sin(ang) * p.r); ctx.lineTo(p.x + Math.cos(ang) * p.r, p.y + Math.sin(ang) * p.r); ctx.stroke(); }
      } else {
        ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    });
  }
  else if (currentMood === 'foggy') {
    clouds.forEach(c => { c.x += c.speed; if (c.x > W + c.w) c.x = -c.w; drawDetailedCloud(c.x, c.y, c.w, c.h, 'rgba(210,215,220,0.9)', 'rgba(160,165,170,0.3)', 0.35); });
  }

  animId = requestAnimationFrame(animate);
}

// Pause the animation loop when the tab is hidden to avoid wasting CPU/battery.
// Resume exactly where it left off when the tab becomes visible again.
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    cancelAnimationFrame(animId);
  } else if (currentMood) {
    animate();
  }
});