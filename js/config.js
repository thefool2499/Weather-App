/* ══════════════════════════════
   1. CONFIG & STATE
══════════════════════════════ */
export const API_KEY  = null; // no longer needed on frontend
export const BASE_URL = '/api/weather'; // points to your netlify function

export const state = {
  currentWeatherData : null,
  clockInterval      : null,
  unitMode           : 'C',
  lastHourlyData     : null,
  lastDailyData      : null,
  dailyGlobalRange   : { min: -10, max: 45 },
};
