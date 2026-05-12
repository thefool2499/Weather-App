/* ══════════════════════════════
   3. TEMPERATURE ANIMATION
══════════════════════════════ */
import { state } from './config.js';

function animateCounter(targetVal, getShown, setShown, rafRef, durationFn) {
  if (rafRef.id) cancelAnimationFrame(rafRef.id);
  const current = getShown();
  if (current === null) { setShown(targetVal); return; }
  const delta = targetVal - current;
  if (delta === 0) return;
  const duration  = durationFn(Math.abs(delta));
  const startTime = performance.now();
  const startVal  = current;
  function step(now) {
    const t = Math.min((now - startTime) / duration, 1);
    const e = 1 - Math.pow(1 - t, 3);
    setShown(Math.round(startVal + delta * e));
    if (t < 1) rafRef.id = requestAnimationFrame(step);
    else setShown(targetVal);
  }
  rafRef.id = requestAnimationFrame(step);
}

let _shownTemp = null;
const _tempRaf = { id: null };
export function animateTempTo(targetVal) {
  animateCounter(
    targetVal,
    () => _shownTemp,
    val => { _shownTemp = val; document.getElementById('temp-number').textContent = val; },
    _tempRaf,
    d => Math.min(900, Math.max(300, d * 22))
  );
}

let _shownFeels = null;
const _feelsRaf = { id: null };
export function animateFeelsTo(targetVal) {
  animateCounter(
    targetVal,
    () => _shownFeels,
    val => { _shownFeels = val; document.getElementById('feels-stat').innerHTML = `${val}<span class="stat-unit">°</span>`; },
    _feelsRaf,
    d => Math.min(700, Math.max(250, d * 18))
  );
}


/* ══════════════════════════════
   4. UNIT CONVERSION
══════════════════════════════ */

// Render functions are injected from main.js to avoid a circular import with render.js.
// main.js calls initTemperatureModule({ renderHourly, renderDaily }) before init().
let _renderHourly = null;
let _renderDaily  = null;

export function initTemperatureModule({ renderHourly, renderDaily }) {
  _renderHourly = renderHourly;
  _renderDaily  = renderDaily;
}

export function setUnit(u) {
  state.unitMode = u;
  ['', '-m'].forEach(suffix => {
    const btnC = document.getElementById(`btn-c${suffix}`);
    const btnF = document.getElementById(`btn-f${suffix}`);
    if (!btnC || !btnF) return;
    btnC.classList.toggle('active', u === 'C');
    btnF.classList.toggle('active', u === 'F');
    btnC.setAttribute('aria-pressed', u === 'C' ? 'true' : 'false');
    btnF.setAttribute('aria-pressed', u === 'F' ? 'true' : 'false');
  });
  if (state.currentWeatherData) updateTemperatureDisplays();
}

export function toDisplay(c) {
  return state.unitMode === 'F' ? Math.round(c * 9 / 5 + 32) : Math.round(c);
}

export function windDisplay(ms) {
  if (state.unitMode === 'F') {
    return { val: Math.round(ms * 2.23694), unit: ' mph' };
  }
  return { val: Math.round(ms * 3.6), unit: ' km/h' };
}

export function calcDewPoint(tempC, humidity) {
  const a = 17.625, b = 243.04;
  const gamma = Math.log(humidity / 100) + (a * tempC) / (b + tempC);
  return (b * gamma) / (a - gamma);
}

export function updateFeelsDesc(tempC, feelsC) {
  const diff = feelsC - tempC;
  document.getElementById('feels-desc').textContent =
    diff < -4 ? 'Wind chill' :
    diff > 4  ? 'Humid / heat index' :
                'Similar to actual';
}

export function updateTemperatureDisplays() {
  const d = state.currentWeatherData;
  if (!d) return;

  animateTempTo(toDisplay(d.main.temp));
  animateFeelsTo(toDisplay(d.main.feels_like));
  updateFeelsDesc(d.main.temp, d.main.feels_like);

  const wind = windDisplay(d.wind.speed);
  document.getElementById('wind').innerHTML = `${wind.val}<span class="stat-unit">${wind.unit}</span>`;

  // Re-render wind direction arrow — it doesn't change value but the unit label did
  if (d.wind.deg !== undefined) {
    const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const dir  = dirs[Math.round(d.wind.deg / 45) % 8];
    const windDirEl = document.getElementById('wind-dir');
    if (windDirEl) {
      windDirEl.innerHTML =
        `<span class="wind-arrow" style="transform:rotate(${d.wind.deg}deg)">↑</span> ${dir}`;
    }
  }

  if (d.main.humidity !== undefined && d.main.temp !== undefined) {
    const dewC = calcDewPoint(d.main.temp, d.main.humidity);
    document.getElementById('dew-point').innerHTML = `${toDisplay(dewC)}<span class="stat-unit">°</span>`;
    const dewDescEl = document.getElementById('dew-desc');
    if (dewDescEl) {
      dewDescEl.textContent =
        dewC < 10  ? 'Dry & comfortable' :
        dewC < 16  ? 'Comfortable' :
        dewC < 21  ? 'Slightly humid' :
        dewC < 24  ? 'Humid' :
        dewC < 27  ? 'Very humid' : 'Oppressive';
    }
  }

  // Use injected render functions — provided by main.js via initTemperatureModule()
  if (state.lastHourlyData && _renderHourly) _renderHourly(state.lastHourlyData);
  if (state.lastDailyData  && _renderDaily)  _renderDaily(state.lastDailyData);
}