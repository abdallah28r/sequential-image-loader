// Sequential Image Loader — advanced settings page (URL rules).
(function () {
  'use strict';

  const I18n = globalThis.SILI18n;
  const Rules = globalThis.SILRules;
  const t = I18n.t;
  const SITES_KEY = 'siteSettings';
  const FROM_KEY = 'silFromUrl'; // set by the popup in chrome.storage.session

  const els = {
    includeText: document.getElementById('includeText'),
    excludeText: document.getElementById('excludeText'),
    includeCount: document.getElementById('includeCount'),
    excludeCount: document.getElementById('excludeCount'),
    saveBtn: document.getElementById('saveBtn'),
    saveState: document.getElementById('saveState'),
    testUrl: document.getElementById('testUrl'),
    testResult: document.getElementById('testResult'),
    fromBox: document.getElementById('fromBox'),
    fromUrl: document.getElementById('fromUrl'),
    addInclude: document.getElementById('addInclude'),
    addExclude: document.getElementById('addExclude'),
    langButtons: document.querySelectorAll('[data-lang]'),
  };

  let saved = { include: [], exclude: [] };
  let sites = {};
  let justSaved = false;

  // --- Helpers ---------------------------------------------------------------

  function unique(list) {
    return [...new Set(list)];
  }

  function current() {
    return {
      include: unique(Rules.parseLines(els.includeText.value)),
      exclude: unique(Rules.parseLines(els.excludeText.value)),
    };
  }

  function isDirty() {
    const c = current();
    return JSON.stringify(c) !== JSON.stringify(saved);
  }

  // --- Rendering -------------------------------------------------------------

  function renderLang() {
    I18n.applyTo(document);
    els.langButtons.forEach((btn) => {
      btn.setAttribute('aria-checked', String(btn.dataset.lang === I18n.lang));
    });
    renderState();
  }

  function renderState() {
    const c = current();
    els.includeCount.textContent = t('rulesCount', { n: c.include.length });
    els.excludeCount.textContent = t('rulesCount', { n: c.exclude.length });

    const dirty = isDirty();
    if (dirty) justSaved = false;
    els.saveBtn.disabled = !dirty;
    els.saveState.textContent = dirty ? t('unsaved') : justSaved ? t('saved') : '';
    els.saveState.classList.toggle('is-dirty', dirty);
    renderTest();
  }

  function renderTest() {
    const raw = els.testUrl.value.trim();
    if (!raw) {
      els.testResult.textContent = '';
      els.testResult.className = 'test-result';
      return;
    }
    let host = '';
    try {
      host = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : 'https://' + raw).hostname;
    } catch (_) {
      host = '';
    }
    const siteEnabled = !!(sites[host] && sites[host].enabled);
    const r = Rules.evaluate(raw, Rules.compile(current()), siteEnabled);

    let msg;
    if (r.reason === 'exclude') msg = t('testOffExclude', { rule: r.rule });
    else if (r.reason === 'include') msg = t('testOnInclude', { rule: r.rule });
    else if (r.reason === 'site') msg = t('testOnSite');
    else msg = t('testOffNone');
    if (isDirty()) msg += ' ' + t('testUnsaved');

    els.testResult.textContent = msg;
    els.testResult.className = 'test-result ' + (r.active ? 'is-on' : 'is-off');
  }

  // --- Actions ---------------------------------------------------------------

  async function save() {
    const next = current();
    await chrome.storage.local.set({ [Rules.RULES_KEY]: next });
    saved = next;
    // Tidy the text boxes (trimmed, no blanks or duplicates).
    els.includeText.value = next.include.join('\n');
    els.excludeText.value = next.exclude.join('\n');
    justSaved = true;
    renderState();
  }

  function addLine(textarea, line) {
    const lines = Rules.parseLines(textarea.value);
    if (!lines.includes(line)) lines.push(line);
    textarea.value = lines.join('\n');
    textarea.focus();
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);
    renderState();
  }

  async function showFromUrl() {
    if (!chrome.storage.session) return;
    const res = await chrome.storage.session.get([FROM_KEY]);
    const url = res[FROM_KEY];
    if (!url) {
      els.fromBox.classList.add('hidden');
      return;
    }
    const clean = url.split(/[?#]/)[0];
    els.fromUrl.textContent = clean;
    els.fromBox.classList.remove('hidden');
    if (!els.testUrl.value) els.testUrl.value = url;
    renderTest();
  }

  // --- Init ------------------------------------------------------------------

  async function init() {
    await I18n.loadLang();
    const res = await chrome.storage.local.get([Rules.RULES_KEY, SITES_KEY]);
    const stored = res[Rules.RULES_KEY] || {};
    saved = {
      include: unique(Rules.parseLines((stored.include || []).join('\n'))),
      exclude: unique(Rules.parseLines((stored.exclude || []).join('\n'))),
    };
    sites = res[SITES_KEY] || {};
    els.includeText.value = saved.include.join('\n');
    els.excludeText.value = saved.exclude.join('\n');

    renderLang();
    await showFromUrl();

    els.includeText.addEventListener('input', renderState);
    els.excludeText.addEventListener('input', renderState);
    els.testUrl.addEventListener('input', renderTest);
    els.saveBtn.addEventListener('click', save);
    els.addInclude.addEventListener('click', () => addLine(els.includeText, els.fromUrl.textContent));
    els.addExclude.addEventListener('click', () => addLine(els.excludeText, els.fromUrl.textContent));

    els.langButtons.forEach((btn) => {
      btn.addEventListener('click', async () => {
        I18n.setLang(btn.dataset.lang);
        renderLang();
        await chrome.storage.local.set({ [I18n.LANG_KEY]: I18n.lang });
      });
    });

    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (isDirty()) save();
      }
    });

    window.addEventListener('beforeunload', (e) => {
      if (isDirty()) {
        e.preventDefault();
        e.returnValue = '';
      }
    });

    // Stay in sync with the popup (language, enabled sites, "came from" page).
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'session' && changes[FROM_KEY]) showFromUrl();
      if (area !== 'local') return;
      if (changes[I18n.LANG_KEY]) {
        I18n.setLang(changes[I18n.LANG_KEY].newValue);
        renderLang();
      }
      if (changes[SITES_KEY]) {
        sites = changes[SITES_KEY].newValue || {};
        renderTest();
      }
    });
  }

  init();
})();
