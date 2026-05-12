/* ══════════════════════════════
   15. RENDER FUNCTIONS
══════════════════════════════ */
import { state } from './config.js';
import { getWeatherIcon } from './icons.js';
import { animateTempTo, animateFeelsTo, toDisplay, windDisplay, calcDewPoint, updateFeelsDesc } from './temperature.js';
import { getMoonPhase, renderDaylightBar, renderSunTimes, startClock, getWindDir } from './ui.js';
import { getMood, initScene, resizeCanvas, setMoonPhaseData } from './canvas.js';

export function renderCurrentWeather(d) {
  // Validate required top-level fields before touching the DOM at all.
  // A partial response (e.g. malformed cache) would otherwise crash halfway
  // through and leave the UI in a broken half-rendered state.
  if (!d || !d.main || !d.weather?.[0] || !d.sys || !d.wind) {
    throw new Error('Weather data is missing required fields');
  }

  try {
    const isDaytime = d.dt > d.sys.sunrise && d.dt < d.sys.sunset;
    const mood      = getMood(d.weather[0].id, isDaytime);

    const cityMs   = d.dt * 1000 + (d.timezone * 1000);
    const cityDate = new Date(cityMs);
    const dateStr  = cityDate.toLocaleDateString('en', { weekday: 'long', month: 'short', day: 'numeric', timeZone: 'UTC' });

    document.getElementById('location-line').textContent = `${d.sys.country} · ${dateStr}`;
    document.getElementById('city-display').textContent  = d.name;

    animateTempTo(toDisplay(d.main.temp));
    animateFeelsTo(toDisplay(d.main.feels_like));
    document.getElementById('cond-text').textContent = d.weather[0].description;

    const hum = d.main.humidity;
    document.getElementById('humidity').innerHTML       = `${hum}<span class="stat-unit">%</span>`;
    document.getElementById('humidity-bar').style.width = hum + '%';

    try {
      const dewC = calcDewPoint(d.main.temp, hum);
      document.getElementById('dew-point').innerHTML = `${toDisplay(dewC)}<span class="stat-unit">°</span>`;
      document.getElementById('dew-desc').textContent =
        dewC < 10  ? 'Dry & comfortable' :
        dewC < 16  ? 'Comfortable' :
        dewC < 21  ? 'Slightly humid' :
        dewC < 24  ? 'Humid' :
        dewC < 27  ? 'Very humid' : 'Oppressive';
    } catch (e) {
      console.warn('[Atmos] Dew point calc failed:', e);
      document.getElementById('dew-point').innerHTML = `—<span class="stat-unit">°</span>`;
      document.getElementById('dew-desc').textContent = '';
    }

    try {
      const wind = windDisplay(d.wind.speed);
      document.getElementById('wind').innerHTML = `${wind.val}<span class="stat-unit">${wind.unit}</span>`;
      if (d.wind.deg !== undefined) {
        const dir = getWindDir(d.wind.deg);
        document.getElementById('wind-dir').innerHTML =
          `<span class="wind-arrow" style="transform:rotate(${d.wind.deg}deg)">↑</span> ${dir}`;
      }
    } catch (e) {
      console.warn('[Atmos] Wind render failed:', e);
      document.getElementById('wind').innerHTML = `—<span class="stat-unit"> km/h</span>`;
    }

    updateFeelsDesc(d.main.temp, d.main.feels_like);

    try {
      document.getElementById('cond-icon-wrap').innerHTML = getWeatherIcon(d.weather[0].icon, 64);
    } catch (e) {
      console.warn('[Atmos] Condition icon render failed:', e);
      document.getElementById('cond-icon-wrap').innerHTML = '';
    }

    try {
      const pressure = d.main.pressure;
      document.getElementById('pressure').innerHTML = `${pressure}<span class="stat-unit"> hPa</span>`;
      document.getElementById('pressure-desc').textContent =
        pressure < 1000 ? 'Low pressure' :
        pressure < 1013 ? 'Below normal' :
        pressure < 1020 ? 'Normal' :
        pressure < 1030 ? 'Above normal' : 'High pressure';
    } catch (e) {
      console.warn('[Atmos] Pressure render failed:', e);
      document.getElementById('pressure').innerHTML = `—<span class="stat-unit"> hPa</span>`;
    }

    try {
      const visKm = d.visibility !== undefined ? (d.visibility / 1000).toFixed(1) : null;
      document.getElementById('visibility').innerHTML = visKm
        ? `${visKm}<span class="stat-unit"> km</span>`
        : `—`;
      document.getElementById('visibility-desc').textContent = visKm
        ? (parseFloat(visKm) >= 10 ? 'Clear view' :
           parseFloat(visKm) >= 5  ? 'Moderate' :
           parseFloat(visKm) >= 2  ? 'Poor' : 'Very poor')
        : '';
    } catch (e) {
      console.warn('[Atmos] Visibility render failed:', e);
      document.getElementById('visibility').innerHTML = `—<span class="stat-unit"> km</span>`;
    }

    try {
      if (!isDaytime) {
        const moonData = getMoonPhase(new Date());
        setMoonPhaseData(moonData);
        document.getElementById('moon-phase-icon').textContent = moonData.emoji;
        document.getElementById('moon-phase-name').textContent = moonData.name;
        document.getElementById('moon-badge').classList.add('visible');
      } else {
        setMoonPhaseData(null);
        document.getElementById('moon-badge').classList.remove('visible');
      }
    } catch (e) {
      console.warn('[Atmos] Moon phase render failed:', e);
    }

    try {
      renderDaylightBar(d.sys.sunrise, d.sys.sunset, d.dt, d.timezone);
      renderSunTimes(d.sys.sunrise, d.sys.sunset, d.timezone);
    } catch (e) {
      console.warn('[Atmos] Daylight bar render failed:', e);
    }

    try {
      startClock(d.timezone, d.name);
    } catch (e) {
      console.warn('[Atmos] Clock start failed:', e);
    }

    try {
      resizeCanvas();
      initScene(mood);
    } catch (e) {
      console.warn('[Atmos] Canvas init failed:', e);
    }

  } catch (e) {
    // Re-throw so api.js can catch it and show the error banner
    console.error('[Atmos] renderCurrentWeather failed:', e);
    throw e;
  }
}

// Rolls a single DOM element's text from `from` → `to` with an eased counter,
// matching the same feel as animateTempTo / animateFeelsTo in the hero card.
function animateForecastNumber(el, from, to, suffix = '°') {
  if (from === to || isNaN(from) || isNaN(to)) return;
  const duration  = Math.min(600, Math.max(220, Math.abs(to - from) * 18));
  const startTime = performance.now();
  function step(now) {
    const t    = Math.min((now - startTime) / duration, 1);
    const ease = 1 - Math.pow(1 - t, 3); // cubic ease-out — same curve as hero
    el.textContent = Math.round(from + (to - from) * ease) + suffix;
    if (t < 1) requestAnimationFrame(step);
    else el.textContent = to + suffix;
  }
  requestAnimationFrame(step);
}

export function renderHourly(data) {
  const container = document.getElementById('hourly-row');
  if (!container) return;

  if (!Array.isArray(data) || data.length === 0) {
    container.innerHTML = `<div style="padding:20px;color:var(--text-muted);font-size:0.85rem">No hourly data available.</div>`;
    return;
  }

  const tz = state.currentWeatherData?.timezone || 0;

  // Snapshot whatever numbers are currently visible BEFORE rebuilding HTML.
  // After the rebuild we animate from these old values → new unit values.
  const oldTemps = [...container.querySelectorAll('.hour-temp')]
    .map(el => parseInt(el.textContent));

  const slots = data.map((item, idx) => {
    try {
      const d     = new Date((item.dt + tz) * 1000);
      const h     = d.getUTCHours();
      const label = h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`;
      const pop      = Math.round((item.pop || 0) * 100);
      const barColor = pop >= 70 ? '#3b82f6' : pop >= 40 ? '#60a5fa' : '#93c5fd';
      return `<div class="hour-slot">
        <div class="hour-time">${label}</div>
        <div class="wx-icon">${getWeatherIcon(item.weather[0].icon, 44)}</div>
        <div class="hour-temp">${toDisplay(item.main.temp)}°</div>
        <div class="hour-precip-wrap">
          <div class="hour-precip-bar-track">
            <div class="hour-precip-bar-fill" style="height:${pop}%;background:${pop > 0 ? barColor : 'transparent'}"></div>
          </div>
          <div class="hour-precip-label" style="color:${pop > 0 ? barColor : 'var(--text-muted)'}">${pop > 0 ? pop + '%' : ''}</div>
        </div>
      </div>`;
    } catch (e) {
      // One bad slot: render a placeholder so the rest still show
      console.warn(`[Atmos] renderHourly slot ${idx} failed:`, e);
      return `<div class="hour-slot" style="opacity:0.4">
        <div class="hour-time">—</div>
        <div class="hour-temp">—°</div>
      </div>`;
    }
  });

  container.innerHTML = slots.join('');

  // Animate each slot's temp from its previous displayed value → new unit value.
  // If there were no previous slots (first load), numbers just appear — no animation needed.
  if (oldTemps.length > 0) {
    container.querySelectorAll('.hour-temp').forEach((el, i) => {
      const to   = parseInt(el.textContent);
      const from = oldTemps[i];
      if (from !== undefined && !isNaN(from) && from !== to) {
        el.textContent = from + '°'; // reset to old value so animation starts from there
        animateForecastNumber(el, from, to, '°');
      }
    });
  }

  // After the DOM updates, check whether the scroll container actually overflows.
  // If all cards fit without scrolling, remove the right-edge fade immediately —
  // the JS scroll listener only fires when the user scrolls, so without this check
  // the fade stays on permanently and clips the last visible card.
  requestAnimationFrame(() => {
    const scroll = container.closest('.hourly-scroll');
    if (!scroll) return;
    const needsScroll = scroll.scrollWidth > scroll.clientWidth + 8;
    scroll.classList.toggle('scrolled-end', !needsScroll);
  });
}

export function renderDaily(data) {
  const container = document.getElementById('daily-list');
  if (!container) return;

  if (!Array.isArray(data) || data.length === 0) {
    container.innerHTML = `<div style="padding:20px;color:var(--text-muted);font-size:0.85rem">No daily forecast available.</div>`;
    return;
  }

  const days   = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  // Snapshot current high/low numbers before rebuilding HTML.
  const oldHighs = [...container.querySelectorAll('.day-card-high')]
    .map(el => parseInt(el.textContent));
  const oldLows  = [...container.querySelectorAll('.day-card-low')]
    .map(el => parseInt(el.textContent));

  const tz       = state.currentWeatherData?.timezone || 0;
  const nowCity  = new Date(Date.now() + tz * 1000);
  const todayStr = [
    nowCity.getUTCFullYear(),
    String(nowCity.getUTCMonth() + 1).padStart(2, '0'),
    String(nowCity.getUTCDate()).padStart(2, '0'),
  ].join('-');

  const cards = data.map((d, i) => {
    try {
      // Guard: malformed date string would crash split/map
      if (!d.date || !d.date.includes('-')) throw new Error('Invalid date: ' + d.date);

      const [year, month, day] = d.date.split('-').map(Number);
      const dayName   = days[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
      const dateLabel = `${months[month - 1]} ${day}`;
      const popHtml   = d.pop > 0
        ? `<div class="day-card-pop"><span class="day-card-pop-icon">💧</span>${d.pop}%</div>`
        : `<div class="day-card-pop day-card-pop--empty"></div>`;
      const isToday = d.date === todayStr;

      return `<div class="day-card${isToday ? ' day-card--today' : ''}">
        <div class="day-card-header">
          <div class="day-card-name">${isToday ? 'Today' : dayName}</div>
          <div class="day-card-date">${dateLabel}</div>
        </div>
        <div class="day-card-icon">${getWeatherIcon(d.icon, 56)}</div>
        <div class="day-card-temps">
          <div class="day-card-temp-block">
            <span class="day-card-high">${toDisplay(d.high)}°</span>
            <span class="day-card-temp-label day-card-temp-label--high">HIGH</span>
          </div>
          <div class="day-card-temp-divider"></div>
          <div class="day-card-temp-block">
            <span class="day-card-low">${toDisplay(d.low)}°</span>
            <span class="day-card-temp-label day-card-temp-label--low">LOW</span>
          </div>
        </div>
        <div class="day-card-desc">${d.desc}</div>
        ${popHtml}
      </div>`;
    } catch (e) {
      // One bad day card: render a placeholder so the rest still show
      console.warn(`[Atmos] renderDaily card ${i} failed:`, e);
      return `<div class="day-card" style="opacity:0.4;display:flex;align-items:center;justify-content:center;min-height:80px">
        <span style="color:var(--text-muted);font-size:0.85rem">—</span>
      </div>`;
    }
  });

  container.innerHTML = cards.join('');

  // Animate highs and lows from their previous values → new unit values.
  if (oldHighs.length > 0) {
    container.querySelectorAll('.day-card-high').forEach((el, i) => {
      const to = parseInt(el.textContent), from = oldHighs[i];
      if (from !== undefined && !isNaN(from) && from !== to) {
        el.textContent = from + '°';
        animateForecastNumber(el, from, to, '°');
      }
    });
    container.querySelectorAll('.day-card-low').forEach((el, i) => {
      const to = parseInt(el.textContent), from = oldLows[i];
      if (from !== undefined && !isNaN(from) && from !== to) {
        el.textContent = from + '°';
        animateForecastNumber(el, from, to, '°');
      }
    });
  }
}