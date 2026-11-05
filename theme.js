// Sequential Image Loader — light / dark / auto theme for the popup and the
// settings page. "auto" (the default) follows the system setting via CSS.
(function (root) {
  'use strict';

  const THEME_KEY = 'uiTheme';
  const THEMES = ['auto', 'light', 'dark'];
  let current = 'auto';

  function apply(value) {
    current = THEMES.includes(value) ? value : 'auto';
    document.documentElement.dataset.theme = current;
    document.querySelectorAll('[data-theme-choice]').forEach((btn) => {
      btn.setAttribute('aria-checked', String(btn.dataset.themeChoice === current));
    });
  }

  async function load() {
    try {
      const res = await chrome.storage.local.get([THEME_KEY]);
      apply(res[THEME_KEY]);
    } catch (_) {
      apply('auto');
    }
  }

  // Wire every [data-theme-choice] button on the page and follow changes made
  // in the other window (popup <-> settings page).
  function init() {
    document.querySelectorAll('[data-theme-choice]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        apply(btn.dataset.themeChoice);
        await chrome.storage.local.set({ [THEME_KEY]: current });
      });
    });
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'local' && changes[THEME_KEY]) apply(changes[THEME_KEY].newValue);
    });
    apply(current);
  }

  root.SILTheme = { THEME_KEY, load, init, apply, get current() { return current; } };
  load();
})(globalThis);
