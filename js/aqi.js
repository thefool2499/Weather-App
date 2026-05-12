/* ══════════════════════════════
   16. AIR QUALITY INDEX (AQI)
══════════════════════════════ */
import { API_KEY } from './config.js';

const AQI_META = [
  { label: 'Good',      color: '#22c55e', bg: 'rgba(34,197,94,0.14)'   },
  { label: 'Fair',      color: '#84cc16', bg: 'rgba(132,204,22,0.14)'  },
  { label: 'Moderate',  color: '#eab308', bg: 'rgba(234,179,8,0.14)'   },
  { label: 'Poor',      color: '#f97316', bg: 'rgba(249,115,22,0.14)'  },
  { label: 'Very Poor', color: '#ef4444', bg: 'rgba(239,68,68,0.14)'   },
];

export async function fetchAQI(lat, lon) {
  try {
    const r = await fetch(
      `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`
    );

    if (!r.ok) {
      console.warn(`[Atmos] AQI fetch failed — HTTP ${r.status}`);
      showAQIUnavailable();
      return;
    }

    const d = await r.json();

    if (!d.list || d.list.length === 0) {
      console.warn('[Atmos] AQI response has no data');
      showAQIUnavailable();
      return;
    }

    renderAQI(d.list[0]);

  } catch (e) {
    console.warn('[Atmos] fetchAQI network error:', e);
    showAQIUnavailable();
  }
}

function renderAQI(data) {
  try {
    const aqi  = data.main.aqi;

    // Guard: aqi must be 1–5; anything outside that range crashes the lookup
    if (typeof aqi !== 'number' || aqi < 1 || aqi > 5) {
      console.warn('[Atmos] AQI value out of expected range:', aqi);
      showAQIUnavailable();
      return;
    }

    const meta = AQI_META[aqi - 1];

    const statNum = document.getElementById('aqi-stat-num');
    if (statNum) { statNum.textContent = aqi; statNum.style.color = meta.color; }

    const statLbl = document.getElementById('aqi-stat-label');
    if (statLbl) {
      statLbl.textContent      = meta.label;
      statLbl.style.background = meta.bg;
      statLbl.style.color      = meta.color;
    }

    const thumb = document.getElementById('aqi-stat-thumb');
    if (thumb) {
      thumb.style.left        = ((aqi - 1) / 4 * 100).toFixed(1) + '%';
      thumb.style.borderColor = meta.color;
    }

  } catch (e) {
    console.error('[Atmos] renderAQI failed:', e);
    showAQIUnavailable();
  }
}

// Gracefully marks AQI as unavailable rather than leaving it stuck at "—"
function showAQIUnavailable() {
  const statNum = document.getElementById('aqi-stat-num');
  const statLbl = document.getElementById('aqi-stat-label');
  const thumb   = document.getElementById('aqi-stat-thumb');

  if (statNum) { statNum.textContent = '—'; statNum.style.color = ''; }
  if (statLbl) {
    statLbl.textContent      = 'Unavailable';
    statLbl.style.background = 'rgba(148,163,184,0.14)';
    statLbl.style.color      = 'var(--text-muted)';
  }
  if (thumb) { thumb.style.left = '0%'; thumb.style.borderColor = 'var(--text-muted)'; }
}