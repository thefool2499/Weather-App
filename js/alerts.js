/* ══════════════════════════════
   11. WEATHER ALERTS
══════════════════════════════ */
import { state }                    from './config.js';
import { toDisplay, windDisplay }   from './temperature.js';

// ─── Alert rule definitions ───────────────────────────────────────────────────
// Each rule is evaluated against live weather data. Keeping the rules as a
// declarative table makes it trivial to add, remove, or reorder conditions
// without touching the inference logic below.
//
// Fields:
//   test(d, derived)  → boolean  — receives the OWM data object + pre-computed
//                                   { condId, tempC, windKph } so rules stay readable
//   event             → string   — alert title
//   description(d)    → string   — called only when test passes; receives same args
//   severity          → 'extreme' | 'severe' | 'moderate' | 'minor'
//   icon              → emoji

const ALERT_RULES = [
  {
    test: ({ condId })    => condId >= 200 && condId <= 232,
    event:                   'Thunderstorm Warning',
    description: ({ d }) => `Severe thunderstorm conditions detected — ${d.weather[0].description}. Avoid open areas and tall trees.`,
    severity:                'severe',
    icon:                    '⛈️',
  },
  {
    test: ({ windKph })   => windKph > 90,
    event:                   'Extreme Wind Warning',
    description: ({ windFormatted }) => `Dangerous wind speeds of ${windFormatted}. Stay indoors.`,
    severity:                'extreme',
    icon:                    '🌀',
  },
  {
    test: ({ windKph })   => windKph > 55,
    event:                   'High Wind Advisory',
    description: ({ windFormatted }) => `Strong winds of ${windFormatted}. Secure outdoor items.`,
    severity:                'moderate',
    icon:                    '💨',
  },
  {
    test: ({ tempC })     => tempC > 40,
    event:                   'Extreme Heat Warning',
    description: ({ tempFormatted }) => `Temperature of ${tempFormatted} is dangerously high. Stay hydrated.`,
    severity:                'extreme',
    icon:                    '🌡️',
  },
  {
    test: ({ tempC })     => tempC > 35,
    event:                   'Heat Advisory',
    description: ({ tempFormatted }) => `High temperature of ${tempFormatted}. Limit strenuous outdoor activities.`,
    severity:                'moderate',
    icon:                    '☀️',
  },
  {
    test: ({ tempC })     => tempC < -20,
    event:                   'Extreme Cold Warning',
    description: ({ tempFormatted }) => `Dangerous cold of ${tempFormatted}. Risk of frostbite on exposed skin.`,
    severity:                'extreme',
    icon:                    '🥶',
  },
  {
    test: ({ tempC })     => tempC < -10,
    event:                   'Cold Weather Advisory',
    description: ({ tempFormatted }) => `Very cold temperatures of ${tempFormatted}. Dress in warm layers.`,
    severity:                'moderate',
    icon:                    '❄️',
  },
  {
    test: ({ condId })    => condId >= 741 && condId <= 745,
    event:                   'Dense Fog Advisory',
    description:             () => 'Visibility significantly reduced. Drive with extra caution.',
    severity:                'minor',
    icon:                    '🌫️',
  },
  {
    test: ({ condId })    => condId >= 601 && condId <= 622,
    event:                   'Heavy Snow Warning',
    description:             () => 'Heavy snowfall conditions. Roads may be hazardous.',
    severity:                'severe',
    icon:                    '🌨️',
  },
  {
    test: ({ condId })    => condId >= 502 && condId <= 531,
    event:                   'Heavy Rainfall Warning',
    description:             () => 'Intense rainfall. Risk of localized flooding.',
    severity:                'severe',
    icon:                    '🌧️',
  },
  {
    test: ({ condId })    => condId === 781,
    event:                   'Tornado Warning',
    description:             () => 'Tornado conditions detected. Take shelter immediately.',
    severity:                'extreme',
    icon:                    '🌪️',
  },
];

// ─── Public API ───────────────────────────────────────────────────────────────

export async function fetchAlerts(/* lat, lon */) {
  // OWM One Call 3.0 requires a paid plan and returns 401 on free-tier keys.
  // We derive alerts from the already-fetched current-weather data instead.
  inferAlertsFromConditions();
}

export function renderAlerts(alerts)         { renderAlertBanners(alerts, { showTime: true }); }
export function renderAlertsInferred(alerts) { renderAlertBanners(alerts, { showTime: false }); }

export function toggleAlertDesc(id, btn) {
  const el = document.getElementById(id);
  el.classList.toggle('expanded');
  btn.textContent = el.classList.contains('expanded') ? 'Show less' : 'Show more';
}

export function clearAlerts() {
  document.getElementById('alerts-container').innerHTML = '';
}

// Exported so getAlertSeverity / getAlertIcon remain available to other modules
// (e.g. if real OWM alert objects are ever surfaced via a paid key).
export function getAlertSeverity(event) {
  const ev = (event || '').toLowerCase();
  if (ev.includes('extreme')  || ev.includes('tornado')  || ev.includes('hurricane')) return 'extreme';
  if (ev.includes('warning')  || ev.includes('severe')   || ev.includes('blizzard')  || ev.includes('storm'))   return 'severe';
  if (ev.includes('watch')    || ev.includes('advisory') || ev.includes('heat')       || ev.includes('wind'))    return 'moderate';
  return 'minor';
}

export function getAlertIcon(event) {
  const ev = (event || '').toLowerCase();
  if (ev.includes('tornado'))                               return '🌪️';
  if (ev.includes('thunder')  || ev.includes('lightning')) return '⛈️';
  if (ev.includes('snow')     || ev.includes('blizzard'))  return '🌨️';
  if (ev.includes('rain')     || ev.includes('flood'))     return '🌧️';
  if (ev.includes('wind'))                                  return '💨';
  if (ev.includes('heat')     || ev.includes('fire'))      return '🌡️';
  if (ev.includes('cold')     || ev.includes('freeze'))    return '❄️';
  if (ev.includes('fog'))                                   return '🌫️';
  if (ev.includes('hurricane'))                             return '🌀';
  return '⚠️';
}

// ─── Inference ────────────────────────────────────────────────────────────────

function inferAlertsFromConditions() {
  if (!state.currentWeatherData) return;

  const d = state.currentWeatherData;

  // Pre-compute derived values once so rule functions stay concise.
  // Temperatures and wind are formatted here so each rule description just
  // interpolates the already-unit-aware string — no raw °C numbers leak out.
  const condId  = d.weather[0].id;
  const tempC   = d.main.temp;
  const windMs  = d.wind.speed;
  const windKph = windMs * 3.6;

  const tempFormatted = `${toDisplay(tempC)}°${state.unitMode}`;
  const wind          = windDisplay(windMs);
  const windFormatted = `${wind.val}${wind.unit.trim()}`;

  const ctx = { d, condId, tempC, windKph, tempFormatted, windFormatted };

  // Wind rules are mutually exclusive (extreme vs moderate) so we evaluate
  // them independently; the table order handles priority via the test values.
  const inferred = ALERT_RULES
    .filter(rule => rule.test(ctx))
    .map(rule => ({
      event       : rule.event,
      description : rule.description(ctx),
      severity    : rule.severity,
      icon        : rule.icon,
    }));

  if (inferred.length > 0) renderAlertsInferred(inferred);
}

// ─── Rendering ────────────────────────────────────────────────────────────────

function renderAlertBanners(alerts, { showTime = false } = {}) {
  const container = document.getElementById('alerts-container');
  container.innerHTML = '';

  alerts.slice(0, 3).forEach((alert, i) => {
    const sev  = alert.severity || getAlertSeverity(alert.event);
    const icon = alert.icon     || getAlertIcon(alert.event);

    // Banner wrapper
    const banner = document.createElement('div');
    banner.className          = `alert-banner severity-${sev}`;
    banner.style.animationDelay = `${i * 0.08}s`;

    // Icon
    const iconEl = document.createElement('span');
    iconEl.className    = 'alert-icon';
    iconEl.textContent  = icon;

    // Body
    const body = document.createElement('div');
    body.className = 'alert-body';

    const eventEl = document.createElement('div');
    eventEl.className   = 'alert-event';
    eventEl.textContent = alert.event || '';

    const descId = `adesc-${i}`;
    const descEl = document.createElement('div');
    descEl.className   = 'alert-desc';
    descEl.id          = descId;
    descEl.textContent = alert.description || '';

    body.appendChild(eventEl);
    body.appendChild(descEl);

    // "Show more" toggle — only when description is long enough to be clamped
    if ((alert.description || '').length > 140) {
      const expandBtn = document.createElement('button');
      expandBtn.className        = 'alert-expand-btn';
      expandBtn.dataset.expand   = descId;
      expandBtn.textContent      = 'Show more';
      body.appendChild(expandBtn);
    }

    // Optional timestamp (real OWM alerts only)
    if (showTime && (alert.start || alert.end)) {
      const fmt      = unix => new Date(unix * 1000).toLocaleString('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
      const startStr = alert.start ? fmt(alert.start) : '';
      const endStr   = alert.end   ? fmt(alert.end)   : '';
      const timeStr  = startStr && endStr ? `${startStr} – ${endStr}` : (startStr || endStr);

      if (timeStr) {
        const meta = document.createElement('div');
        meta.className  = 'alert-meta';
        meta.textContent = `📅 ${timeStr}${alert.sender_name ? ` · ${alert.sender_name}` : ''}`;
        body.appendChild(meta);
      }
    }

    // Dismiss button
    const dismissBtn = document.createElement('button');
    dismissBtn.className              = 'alert-dismiss';
    dismissBtn.setAttribute('aria-label', 'Dismiss alert');
    dismissBtn.textContent            = '✕';

    banner.appendChild(iconEl);
    banner.appendChild(body);
    banner.appendChild(dismissBtn);
    container.appendChild(banner);
  });
}