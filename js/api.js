/* ══════════════════════════════
   14. API FETCH
══════════════════════════════ */
import { API_KEY, BASE_URL, state } from './config.js';
import { showSkeletons, hideSkeletons } from './ui.js';
import { addToHistory } from './search.js';
import { clearAlerts, fetchAlerts } from './alerts.js';
import { fetchAQI } from './aqi.js';
import { renderCurrentWeather, renderHourly, renderDaily } from './render.js';

// ─── Fetch helpers ────────────────────────────────────────────────────────────

/**
 * fetch() with an AbortController timeout.
 * Rejects with an AbortError if the request takes longer than `timeoutMs`.
 */
function fetchWithTimeout(url, timeoutMs = 10_000) {
  const controller = new AbortController();
  const timer      = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(timer));
}

/**
 * Builds the OWM current-weather URL for either a city-name string
 * or a { lat, lon } coordinate object.
 */
function weatherUrl(query) {
  const base = `${BASE_URL}/weather?appid=${API_KEY}&units=metric`;
  return typeof query === 'string'
    ? `${base}&q=${encodeURIComponent(query)}`
    : `${base}&lat=${query.lat}&lon=${query.lon}`;
}

// ─── Error / loading UI ───────────────────────────────────────────────────────

export function showError(msg) {
  const banner = document.getElementById('error-banner');
  document.getElementById('error-msg').textContent = msg;
  banner.removeAttribute('hidden');
  setTimeout(() => banner.setAttribute('hidden', ''), 5000);
}

function setLoading(on) {
  const btn    = document.getElementById('search-btn');
  btn.disabled = on;
  btn.textContent = on ? '…' : 'Search';
  if (on) showSkeletons();
}

/** Inline error inside the forecast card — doesn't disturb the hero. */
function showForecastError() {
  const skeleton = document.getElementById('forecast-skeleton');
  const content  = document.getElementById('forecast-content');
  if (skeleton) skeleton.style.display = 'none';
  if (content) {
    content.style.display = '';
    content.innerHTML = `
      <div style="
        display:flex;flex-direction:column;align-items:center;justify-content:center;
        gap:8px;padding:40px 20px;text-align:center;
        color:var(--text-muted);font-family:var(--font-body);
      ">
        <span style="font-size:2rem">📡</span>
        <div style="font-size:0.95rem;font-weight:500">Forecast unavailable</div>
        <div style="font-size:0.82rem;opacity:0.75">Couldn't load hourly & daily data.<br>Try searching again.</div>
      </div>`;
  }
}

// ─── Side-effect helpers shared by fetchWeather and restoreFromCache ──────────

/**
 * Fires alerts + AQI in parallel for a given coordinate pair.
 * Both calls are fire-and-forget; individual failures are handled internally.
 */
function fetchSideEffects(lat, lon) {
  Promise.allSettled([
    fetchAlerts(lat, lon),
    fetchAQI(lat, lon),
  ]);
}

// ─── Public fetch functions ───────────────────────────────────────────────────

export async function fetchWeather(query) {
  setLoading(true);
  clearAlerts();

  try {
    let response;
    try {
      response = await fetchWithTimeout(weatherUrl(query));
    } catch (e) {
      if (e.name === 'AbortError') {
        showError('Request timed out. Check your connection.');
        hideSkeletons();
        return;
      }
      throw e;
    }

    if (response.status === 404) { showError('City not found. Try another name.'); hideSkeletons(); return; }
    if (response.status === 401) { showError('Invalid API key.');                  hideSkeletons(); return; }
    if (!response.ok)            { showError('Weather service unavailable.');      hideSkeletons(); return; }

    const data = await response.json();
    state.currentWeatherData = data;

    try {
      renderCurrentWeather(data);
    } catch (e) {
      console.error('[Atmos] renderCurrentWeather failed:', e);
      showError('Failed to display weather data. Please try again.');
      hideSkeletons();
      return;
    }

    hideSkeletons();

    // Only add named searches to history — coordinate-based lookups (autocomplete
    // select) already add via the city name returned in data.name after fetch.
    if (typeof query === 'string') addToHistory(data.name);

    const { lat, lon } = data.coord;

    // Forecast must complete before we cache, so hourly/daily are included.
    await fetchForecast(lat, lon);
    cacheWeatherData({ weather: data, city: data.name, hourly: state.lastHourlyData, daily: state.lastDailyData });

    fetchSideEffects(lat, lon);

  } catch (e) {
    console.error('[Atmos] fetchWeather error:', e);
    showError('No connection. Check your internet and try again.');
    hideSkeletons();
  } finally {
    setLoading(false);
  }
}

export async function fetchForecast(lat, lon) {
  try {
    let response;
    try {
      response = await fetchWithTimeout(`${BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`);
    } catch (e) {
      if (e.name === 'AbortError') { showForecastError(); return; }
      throw e;
    }

    if (!response.ok) {
      console.warn(`[Atmos] Forecast fetch failed — HTTP ${response.status}`);
      showForecastError();
      return;
    }

    const data = await response.json();

    if (!Array.isArray(data.list) || data.list.length === 0) {
      console.warn('[Atmos] Forecast response has no list items');
      showForecastError();
      return;
    }

    const hourly   = data.list.slice(0, 8);
    const dailyMap = groupForecastByDay(data.list);
    const daily    = buildDailyForecast(dailyMap);

    const allHighs = daily.map(d => d.high);
    const allLows  = daily.map(d => d.low);
    state.dailyGlobalRange = { min: Math.min(...allLows), max: Math.max(...allHighs) };

    try {
      renderHourly(hourly);
      renderDaily(daily);
    } catch (e) {
      console.error('[Atmos] Forecast render failed:', e);
      showForecastError();
      return;
    }

    state.lastHourlyData = hourly;
    state.lastDailyData  = daily;

  } catch (e) {
    console.error('[Atmos] fetchForecast network error:', e);
    showForecastError();
  }
}

// ─── Forecast data helpers ────────────────────────────────────────────────────

/** Groups the flat OWM 3-hourly list into { 'YYYY-MM-DD': [items] }. */
function groupForecastByDay(list) {
  return list.reduce((map, item) => {
    const date = item.dt_txt?.split(' ')[0];
    if (date) {
      if (!map[date]) map[date] = [];
      map[date].push(item);
    }
    return map;
  }, {});
}

/** Converts a day-keyed map into the shape renderDaily expects. */
function buildDailyForecast(dailyMap) {
  return Object.entries(dailyMap).slice(0, 5).map(([date, items]) => {
    const representative = items.find(i => i.dt_txt?.includes('12:00')) ?? items[0];
    const maxPop         = Math.round(Math.max(...items.map(i => i.pop ?? 0)) * 100);

    return {
      date,
      icon : representative.weather[0].icon,
      desc : representative.weather[0].description,
      high : Math.max(...items.map(i => i.main.temp_max)),
      low  : Math.min(...items.map(i => i.main.temp_min)),
      pop  : maxPop,
    };
  });
}

// ─── Session cache ────────────────────────────────────────────────────────────

const CACHE_KEY    = 'atmos_cache';
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 min — aligns with OWM station refresh rate

function cacheWeatherData(payload) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), ...payload }));
  } catch (e) {
    console.warn('[Atmos] Cache write failed:', e);
  }
}

export function loadCache() {
  try {
    const cached = JSON.parse(sessionStorage.getItem(CACHE_KEY));
    if (cached && Date.now() - cached.ts < CACHE_TTL_MS) return cached;
  } catch (e) {
    console.warn('[Atmos] Cache read failed:', e);
  }
  return null;
}

/**
 * Restores the last session on page load.
 *
 * Covers all four things a live fetchWeather call would do:
 *   1. Render current weather + forecast from cached data (instant, no network).
 *   2. Re-add the city to search history so Recent still shows it after a refresh.
 *   3. Re-fetch live AQI + alerts (not cached — cheap parallel calls, always current).
 *
 * Returns true if the cache was valid and the UI was restored, false otherwise.
 */
export function restoreFromCache() {
  const cached = loadCache();
  if (!cached) return false;

  try {
    state.currentWeatherData = cached.weather;
    renderCurrentWeather(cached.weather);
    hideSkeletons();

    if (cached.hourly) { renderHourly(cached.hourly); state.lastHourlyData = cached.hourly; }
    if (cached.daily)  { renderDaily(cached.daily);   state.lastDailyData  = cached.daily;  }

    // Re-populate search history so the city appears in Recent after a refresh.
    if (cached.city) addToHistory(cached.city);

    // AQI and alerts are not cached — re-fetch them live so they're always current.
    const { lat, lon } = cached.weather.coord;
    fetchSideEffects(lat, lon);

    return true;
  } catch (e) {
    console.warn('[Atmos] Cache restore failed:', e);
    return false;
  }
}