/* ══════════════════════════════
   6. SEARCH HISTORY
══════════════════════════════ */
import { API_KEY } from './config.js';
import { fetchWeather } from './api.js';

export function getHistory() {
  try { return JSON.parse(sessionStorage.getItem('atmos_history')) || []; }
  catch { return []; }
}

function saveHistory(cities) {
  try { sessionStorage.setItem('atmos_history', JSON.stringify(cities)); }
  catch {}
}

export function addToHistory(city) {
  let h = getHistory().filter(c => c.toLowerCase() !== city.toLowerCase());
  h.unshift(city);
  if (h.length > 5) h = h.slice(0, 5);
  saveHistory(h);
}

export function removeFromHistory(city) {
  saveHistory(getHistory().filter(c => c !== city));
  renderDropdown();
}

export function historySearch(city) {
  document.getElementById('city-input').value = city;
  closeDropdown();
  fetchWeather(city);
}


/* ══════════════════════════════
   6b. AUTOCOMPLETE SUGGESTIONS
══════════════════════════════ */
let _acDebounce   = null;
let _acController = null;
export let _currentSuggestions = [];
export let _activeIndex  = -1;

function setActiveIndex(v) { _activeIndex = v; }
function setCurrentSuggestions(v) { _currentSuggestions = v; }

function countryCodeToFlag(cc) {
  if (!cc || cc.length !== 2) return '🌐';
  return String.fromCodePoint(...[...cc.toUpperCase()].map(c => 0x1F1E6 - 65 + c.charCodeAt(0)));
}

async function fetchSuggestions(query) {
  if (_acController) _acController.abort();
  _acController = new AbortController();
  try {
    const url = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=5&appid=${API_KEY}`;
    const res  = await fetch(url, { signal: _acController.signal });
    if (!res.ok) return [];
    const data = await res.json();
    return data.map(p => ({
      name    : p.name,
      state   : p.state || '',
      country : p.country || '',
      lat     : p.lat,
      lon     : p.lon,
    }));
  } catch (e) {
    if (e.name !== 'AbortError') console.warn('Autocomplete error', e);
    return [];
  }
}

export function renderDropdown(suggestions = []) {
  const el      = document.getElementById('search-history');
  const history = getHistory();
  setCurrentSuggestions(suggestions);
  setActiveIndex(-1);

  let html = '';

  if (suggestions.length > 0) {
    suggestions.forEach((s, i) => {
      const flag    = countryCodeToFlag(s.country);
      const sub     = [s.state, s.country].filter(Boolean).join(', ');
      const latStr  = Math.abs(s.lat).toFixed(2) + (s.lat >= 0 ? '°N' : '°S');
      const lonStr  = Math.abs(s.lon).toFixed(2) + (s.lon >= 0 ? '°E' : '°W');
      html += `<div class="suggest-item" data-index="${i}" role="option" tabindex="-1">
        <span class="suggest-flag">${flag}</span>
        <span class="suggest-body">
          <span class="suggest-name">${s.name}</span>
          <span class="suggest-sub">${sub}</span>
        </span>
        <span class="suggest-coords">${latStr}, ${lonStr}</span>
      </div>`;
    });
  }

  if (history.length > 0) {
    html += `<div class="history-label" style="margin-top:${suggestions.length ? '4px' : '0'}">Recent</div>`;
    history.forEach(c => {
      html += `<div class="history-item" data-history="${encodeURIComponent(c)}">
        <span>🕑 ${c}</span>
        <button class="history-del" data-del="${encodeURIComponent(c)}" aria-label="Remove ${c}">✕</button>
      </div>`;
    });
  }

  if (!html) { closeDropdown(); return; }
  el.innerHTML = html;
  el.classList.add('open');
}

export function selectSuggestion(index) {
  const s = _currentSuggestions[index];
  if (!s) return;
  const displayName = s.state ? `${s.name}, ${s.state}` : s.name;
  document.getElementById('city-input').value = displayName;
  closeDropdown();
  fetchWeather({ lat: s.lat, lon: s.lon });
}

export function closeDropdown() {
  document.getElementById('search-history').classList.remove('open');
  setCurrentSuggestions([]);
  setActiveIndex(-1);
}

export function handleAutocomplete(query) {
  clearTimeout(_acDebounce);
  if (query.length < 2) {
    const history = getHistory();
    if (history.length) renderDropdown([]);
    else closeDropdown();
    return;
  }
  _acDebounce = setTimeout(async () => {
    const suggestions = await fetchSuggestions(query);
    renderDropdown(suggestions);
  }, 280);
}

export function navigateSuggestions(direction) {
  const el = document.getElementById('search-history');
  // Include both autocomplete suggestions and history items so arrow keys
  // can reach every visible row — previously only .suggest-item was selected,
  // meaning history rows were skipped entirely when no suggestions were shown.
  const items = el.querySelectorAll('.suggest-item, .history-item');
  if (!items.length) return;

  items.forEach(i => i.classList.remove('active'));
  _activeIndex = (_activeIndex + direction + items.length) % items.length;
  items[_activeIndex].classList.add('active');

  // Only autocomplete suggestions pre-fill the input.
  // History items are labelled with data-history and already contain the city name.
  const s = _currentSuggestions[_activeIndex];
  if (s) {
    const sub = s.state ? `${s.name}, ${s.state}` : s.name;
    document.getElementById('city-input').value = sub;
  } else {
    // Navigated onto a history row — read the city name from the element itself.
    const histEl = items[_activeIndex];
    const encoded = histEl?.dataset?.history;
    if (encoded) document.getElementById('city-input').value = decodeURIComponent(encoded);
  }
}