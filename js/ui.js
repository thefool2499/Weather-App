/* ══════════════════════════════
   5. SKELETON LOADERS
══════════════════════════════ */
export function showSkeletons() {
  document.getElementById('hero-skeleton').style.display     = '';
  document.getElementById('forecast-skeleton').style.display = '';
  document.getElementById('hero-content').style.display      = 'none';
  document.getElementById('forecast-content').style.display  = 'none';
  document.getElementById('empty-state').style.display       = 'none';
}

export function hideSkeletons() {
  document.getElementById('hero-skeleton').style.display     = 'none';
  document.getElementById('forecast-skeleton').style.display = 'none';
  document.getElementById('hero-content').style.display      = '';
  document.getElementById('forecast-content').style.display  = '';
  document.getElementById('empty-state').style.display       = 'none';
}

export function showEmptyState() {
  document.getElementById('hero-skeleton').style.display     = 'none';
  document.getElementById('forecast-skeleton').style.display = 'none';
  document.getElementById('hero-content').style.display      = 'none';
  document.getElementById('forecast-content').style.display  = 'none';
  document.getElementById('empty-state').style.display       = '';
}


/* ══════════════════════════════
   7. CLOCK
══════════════════════════════ */
import { state } from './config.js';

export function startClock(timezoneOffset, cityName) {
  if (state.clockInterval) clearInterval(state.clockInterval);
  const clockEl = document.getElementById('clock-time');
  const labelEl = document.getElementById('clock-label');
  labelEl.textContent = cityName + ' local';

  function tick() {
    const d    = new Date(Date.now() + (timezoneOffset * 1000));
    const h    = d.getUTCHours();
    const m    = String(d.getUTCMinutes()).padStart(2, '0');
    const s    = String(d.getUTCSeconds()).padStart(2, '0');
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12  = h % 12 || 12;
    clockEl.textContent = `${h12}:${m}:${s} ${ampm}`;
  }

  tick();
  state.clockInterval = setInterval(tick, 1000);
  document.getElementById('city-clock').classList.add('visible');
}


/* ══════════════════════════════
   8. MOON PHASE
══════════════════════════════ */
export function getMoonPhase(date) {
  const ref   = new Date('2000-01-06T18:14:00Z');
  const cycle = 29.530588853;
  const days  = ((date - ref) / 864e5 % cycle + cycle) % cycle;

  if (days < 1.85)  return { name: 'New Moon',        emoji: '🌑', value: days / cycle };
  if (days < 7.38)  return { name: 'Waxing Crescent',  emoji: '🌒', value: days / cycle };
  if (days < 9.22)  return { name: 'First Quarter',    emoji: '🌓', value: days / cycle };
  if (days < 14.76) return { name: 'Waxing Gibbous',   emoji: '🌔', value: days / cycle };
  if (days < 16.61) return { name: 'Full Moon',        emoji: '🌕', value: days / cycle };
  if (days < 22.15) return { name: 'Waning Gibbous',   emoji: '🌖', value: days / cycle };
  if (days < 23.99) return { name: 'Last Quarter',     emoji: '🌗', value: days / cycle };
  return                   { name: 'Waning Crescent',  emoji: '🌘', value: days / cycle };
}


/* ══════════════════════════════
   9. DAYLIGHT BAR
══════════════════════════════ */
export function renderDaylightBar(sunrise, sunset, now, timezone) {
  const fill     = document.getElementById('daylight-fill');
  const thumb    = document.getElementById('daylight-thumb');
  const srLabel  = document.getElementById('sunrise-label');
  const ssLabel  = document.getElementById('sunset-label');
  const pctLabel = document.getElementById('daylight-pct-label');

  function cityTime(unix) { return new Date((unix + timezone) * 1000); }
  function fmt(d) {
    const h = d.getUTCHours(), m = String(d.getUTCMinutes()).padStart(2, '0');
    const a = h >= 12 ? 'PM' : 'AM', h12 = h % 12 || 12;
    return `${h12}:${m} ${a}`;
  }

  srLabel.textContent = fmt(cityTime(sunrise));
  ssLabel.textContent = fmt(cityTime(sunset));

  const total     = sunset - sunrise;
  const elapsed   = Math.max(0, Math.min(now - sunrise, total));
  const pct       = Math.round((elapsed / total) * 100);
  const isDaytime = now > sunrise && now < sunset;

  fill.style.width  = pct + '%';
  thumb.style.left  = pct + '%';
  thumb.classList.toggle('night-mode', !isDaytime);

  const totalMins = Math.round(total / 60);
  const dHrs      = Math.floor(totalMins / 60);
  const dMins     = totalMins % 60;

  if (isDaytime) {
    pctLabel.textContent = `${dHrs}h ${dMins}m of daylight`;
  } else {
    const nextSunrise = now < sunrise ? sunrise : sunrise + 86400;
    const minsUntil   = Math.round((nextSunrise - now) / 60);
    const uHrs        = Math.floor(minsUntil / 60);
    const uMins       = minsUntil % 60;
    pctLabel.textContent = uHrs > 0 ? `Sunrise in ${uHrs}h ${uMins}m` : `Sunrise in ${uMins}m`;
  }

  document.getElementById('daylight-wrap').style.display = 'block';
}

export function renderSunTimes(sunrise, sunset, timezone) {
  function fmt(unix) {
    const d  = new Date((unix + timezone) * 1000);
    const h  = d.getUTCHours(), m = String(d.getUTCMinutes()).padStart(2, '0');
    const a  = h >= 12 ? 'PM' : 'AM', h12 = h % 12 || 12;
    return `${h12}:${m} ${a}`;
  }
  document.getElementById('sunrise-val').textContent = fmt(sunrise);
  document.getElementById('sunset-val').textContent  = fmt(sunset);
  document.getElementById('sun-times').style.display = 'flex';
}


/* ══════════════════════════════
   10. WIND HELPERS
══════════════════════════════ */


export function getWindDir(deg) {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return dirs[Math.round(deg / 45) % 8];
}