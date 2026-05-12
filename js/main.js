/* ══════════════════════════════
   17. EVENT LISTENERS & INIT
══════════════════════════════ */
import { state } from './config.js';
import { setUnit, initTemperatureModule } from './temperature.js';
import { renderHourly, renderDaily } from './render.js';
import { showEmptyState } from './ui.js';
import { fetchWeather, restoreFromCache } from './api.js';
import {
  handleAutocomplete, closeDropdown, navigateSuggestions, selectSuggestion,
  getHistory, renderDropdown, removeFromHistory, historySearch,
  _currentSuggestions, _activeIndex,
} from './search.js';
import { resizeCanvas, initScene, currentMood } from './canvas.js';
import { renderCurrentWeather } from './render.js';
import { toggleAlertDesc } from './alerts.js';



const input = document.getElementById('city-input');

// Unit toggle (desktop)
document.getElementById('btn-c').addEventListener('click', () => setUnit('C'));
document.getElementById('btn-f').addEventListener('click', () => setUnit('F'));

// Unit toggle (mobile)
document.getElementById('btn-c-m').addEventListener('click', () => setUnit('C'));
document.getElementById('btn-f-m').addEventListener('click', () => setUnit('F'));

// Scroll fade — hourly and daily lists
document.addEventListener('DOMContentLoaded', () => {
  const hourlyScroll = document.querySelector('.hourly-scroll');
  if (hourlyScroll) {
    hourlyScroll.addEventListener('scroll', () => {
      const atEnd = hourlyScroll.scrollLeft + hourlyScroll.clientWidth >= hourlyScroll.scrollWidth - 8;
      hourlyScroll.classList.toggle('scrolled-end', atEnd);
    }, { passive: true });
  }

  // Daily list has the same right-edge fade mask on mobile.
  // Without this listener the mask never clears, permanently clipping the last card.
  const dailyList = document.querySelector('.daily-list');
  if (dailyList) {
    dailyList.addEventListener('scroll', () => {
      const atEnd = dailyList.scrollLeft + dailyList.clientWidth >= dailyList.scrollWidth - 8;
      dailyList.classList.toggle('scrolled-end', atEnd);
    }, { passive: true });
  }
});

// Search button
document.getElementById('search-btn').addEventListener('click', () => {
  const v = input.value.trim();
  if (v.length >= 2) { closeDropdown(); fetchWeather(v); }
});

// Typing → autocomplete + clear button visibility
input.addEventListener('input', () => {
  handleAutocomplete(input.value.trim());
  document.getElementById('input-clear').classList.toggle('visible', input.value.length > 0);
});

// Clear button
document.getElementById('input-clear').addEventListener('click', () => {
  input.value = '';
  input.focus();
  document.getElementById('input-clear').classList.remove('visible');
  closeDropdown();
});

// Keyboard navigation
input.addEventListener('keydown', e => {
  const el     = document.getElementById('search-history');
  const isOpen = el.classList.contains('open');

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    if (isOpen) navigateSuggestions(1);
    return;
  }
  if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (isOpen) navigateSuggestions(-1);
    return;
  }
  if (e.key === 'Escape') {
    closeDropdown();
    input.blur();
    return;
  }
  if (e.key === 'Enter') {
    // Read live values from the module
    const { _currentSuggestions: sug, _activeIndex: idx } = window.__atmos_search__;
    if (idx >= 0 && sug[idx]) {
      // Active row is an autocomplete suggestion
      selectSuggestion(idx);
    } else if (idx >= 0) {
      // Active row is a history item — the input was already pre-filled by
      // navigateSuggestions, so just trigger a search on whatever is in the input.
      const v = input.value.trim();
      if (v.length >= 2) { closeDropdown(); fetchWeather(v); }
    } else {
      const v = input.value.trim();
      if (v.length >= 2) { closeDropdown(); fetchWeather(v); }
    }
  }
});

// Show history on focus
input.addEventListener('focus', () => {
  if (!input.value.trim()) {
    const history = getHistory();
    if (history.length) renderDropdown([]);
  }
});

// Close dropdown when clicking outside
document.addEventListener('click', e => {
  if (!e.target.closest('.search-clock-group')) closeDropdown();
});

// Close error banner
document.getElementById('error-close').addEventListener('click', () => {
  document.getElementById('error-banner').setAttribute('hidden', '');
});

// Resize
window.addEventListener('resize', () => {
  resizeCanvas();

  // Re-evaluate whether scroll containers need the right-edge fade.
  // On resize the overflow state can change (e.g. narrow → fade needed, wide → no fade).
  const scroll = document.querySelector('.hourly-scroll');
  if (scroll) {
    const needsScroll = scroll.scrollWidth > scroll.clientWidth + 8;
    scroll.classList.toggle('scrolled-end', !needsScroll);
  }

  const dailyList = document.querySelector('.daily-list');
  if (dailyList) {
    const needsScroll = dailyList.scrollWidth > dailyList.clientWidth + 8;
    dailyList.classList.toggle('scrolled-end', !needsScroll);
  }
});

// Delegated listener — search dropdown
document.getElementById('search-history').addEventListener('click', e => {
  const delBtn = e.target.closest('[data-del]');
  if (delBtn) {
    e.stopPropagation();
    removeFromHistory(decodeURIComponent(delBtn.dataset.del));
    return;
  }
  const histItem = e.target.closest('[data-history]');
  if (histItem) { historySearch(decodeURIComponent(histItem.dataset.history)); return; }
  const sugItem  = e.target.closest('[data-index]');
  if (sugItem)  { selectSuggestion(Number(sugItem.dataset.index)); }
});

// Delegated listener — weather alerts
document.getElementById('alerts-container').addEventListener('click', e => {
  const dismissBtn = e.target.closest('.alert-dismiss');
  if (dismissBtn) { dismissBtn.closest('.alert-banner').remove(); return; }
  const expandBtn  = e.target.closest('[data-expand]');
  if (expandBtn)   { toggleAlertDesc(expandBtn.dataset.expand, expandBtn); }
});

// Boot
function init() {
  resizeCanvas();

  // Restore last session from cache; fall back to empty state if nothing cached.
  if (!restoreFromCache()) {
    showEmptyState();
  }
}

// Expose search state live reference for keyboard navigation in Enter handler
import * as searchModule from './search.js';
window.__atmos_search__ = searchModule;

// Wire up render functions into the temperature module so that toggling
// °C / °F re-renders the hourly and 5-day forecast cards.
// Must be called before init() — _renderHourly/_renderDaily are null until this runs.
initTemperatureModule({ renderHourly, renderDaily });

init();