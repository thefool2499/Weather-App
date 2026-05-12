/* ══════════════════════════════
   1. CONFIG & STATE
══════════════════════════════ */
export const API_KEY  = '02aeffb7f7cf8e338abaeebefec49695';
export const BASE_URL = 'https://api.openweathermap.org/data/2.5';

export const state = {
  currentWeatherData : null,
  clockInterval      : null,
  unitMode           : 'C',
  lastHourlyData     : null,
  lastDailyData      : null,
  dailyGlobalRange   : { min: -10, max: 45 },
};
