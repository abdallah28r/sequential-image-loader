// Sequential Image Loader — advanced settings page (URL rules).
// Each site is a folded row (with its logo). Opening it shows the full links in
// two sections, "Always on" and "Never on", each with its own Add button.
// Every add/delete is saved immediately, and the page follows changes made
// from the popup.
(function () {
  'use strict';

  const I18n = globalThis.SILI18n;
  const Rules = globalThis.SILRules;
  const t = I18n.t;
  const FROM_KEY = 'silFromUrl'; // set by the popup in chrome.storage.session
  const OTHER = '__other__'; // group for wildcard hosts like *.example.com
  const LISTS = ['include', 'exclude'];

  const els = {
    siteInput: document.getElementById('siteInput'),
    siteBtn: document.getElementById('siteBtn'),
    siteErr: document.getElementById('siteErr'),
    toast: document.getElementById('toast'),
    emptyAll: document.getElementById('emptyAll'),
    siteList: document.getElementById('siteList'),
    testUrl: document.getElementById('testUrl'),
    testResult: document.getElementById('testResult'),
    langButtons: document.querySelectorAll('[data-lang]'),
  };

  let rules = { include: [], exclude: [] };
  const open = new Set(); // sites whose fold is open
  const pending = new Set(); // sites added with "+ Add site" that have no rules yet
  let adding = null; // { site, list, value, error } while a section's add form is open
  let toastTimer = null;

  // --- Data ------------------------------------------------------------------

  // Drop blanks and duplicates (same rule written differently counts once).
  function clean(list) {
    const seen = new Set();
    const out = [];
    for (const raw of list || []) {
      const p = String(raw).trim();
      if (!p) continue;
      const k = Rules.keyOf(p);
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(p);
    }
    return out;
  }

  function setRules(value) {
    const v = value || {};
    const exclude = clean(v.exclude);
    // Older data may have the same rule in both lists. "Never on" always won,
    // so show (and later save) it only there.
    const blocked = new Set(exclude.map(Rules.keyOf));
    rules = { include: clean(v.include).filter((p) => !blocked.has(Rules.keyOf(p))), exclude };
  }

  async function save() {
    await chrome.storage.local.set({ [Rules.RULES_KEY]: rules });
  }

  const groupOf = (p) => Rules.siteOf(p) || OTHER;

  // All sites (with rules, plus newly added empty ones), wildcard group last.
  function sites() {
    const map = new Map();
    for (const s of pending) map.set(s, { include: [], exclude: [] });
    for (const list of LISTS) {
      for (const p of rules[list]) {
        const g = groupOf(p);
        if (!map.has(g)) map.set(g, { include: [], exclude: [] });
        map.get(g)[list].push(p);
      }
    }
    return [...map.entries()].sort(([a], [b]) => (a === OTHER) - (b === OTHER) || a.localeCompare(b));
  }

  // "https://www.Example.com/a?b" -> "example.com" (null if not a usable host).
  function hostOf(raw) {
    const h = Rules.normalize(String(raw || ''), false).split('/')[0].toLowerCase();
    return h && h.includes('.') && !h.includes('*') && !/\s/.test(h) ? h : null;
  }

  // --- Actions ---------------------------------------------------------------

  function showToast(msg) {
    els.toast.textContent = msg;
    els.toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => els.toast.classList.remove('show'), 1800);
  }

  // Add to one list; the same rule in the other list moves over (no conflicts).
  async function addRule(list, raw) {
    const p = Rules.safeDecode(String(raw || '').trim());
    const k = Rules.keyOf(p);
    const other = list === 'include' ? 'exclude' : 'include';
    rules[other] = rules[other].filter((x) => Rules.keyOf(x) !== k);
    if (!rules[list].some((x) => Rules.keyOf(x) === k)) rules[list].push(p);
    adding = null;
    open.add(groupOf(p));
    await save();
    render();
    showToast(t('addedToast'));
  }

  async function removeRule(list, p) {
    rules[list] = rules[list].filter((x) => x !== p);
    // Keep the site on screen (empty) so the user can add to it again.
    const g = groupOf(p);
    if (g !== OTHER) pending.add(g);
    await save();
    render();
    showToast(t('removedToast'));
  }

  // "+ Add site": show the site open with empty sections. Nothing is saved
  // until a link is added to one of them.
  function addSite() {
    const host = hostOf(els.siteInput.value);
    if (!host) {
      els.siteErr.classList.remove('hidden');
      els.siteInput.focus();
      return;
    }
    els.siteErr.classList.add('hidden');
    els.siteInput.value = '';
    pending.add(host);
    open.add(host);
    startAdd(host, 'include');
  }

  function startAdd(site, list, value) {
    adding = { site, list, value: value != null ? value : site === OTHER ? '' : site + '/', error: false };
    open.add(site);
    render();
    const input = els.siteList.querySelector('.sec-form input');
    if (input) {
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
    }
  }

  function submitAdd() {
    const v = adding.value.trim();
    const prefix = adding.site === OTHER ? '' : adding.site + '/';
    if (!v || Rules.keyOf(v) === Rules.keyOf(prefix) || !Rules.compileOne(v)) {
      adding.error = true;
      render();
      const input = els.siteList.querySelector('.sec-form input');
      if (input) input.focus();
      return;
    }
    addRule(adding.list, v);
  }

  // --- Rendering -------------------------------------------------------------

  function renderLang() {
    I18n.applyTo(document);
    els.langButtons.forEach((btn) => btn.setAttribute('aria-checked', String(btn.dataset.lang === I18n.lang)));
    render();
  }

  function siteLabel(g) {
    return g === OTHER ? t('otherSites') : g;
  }

  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function render() {
    const all = sites();
    els.emptyAll.classList.toggle('hidden', all.length > 0);
    els.siteList.replaceChildren(...all.map(([g, lists]) => renderSite(g, lists)));
    renderTest();
  }

  // Site logo from Chrome's own favicon cache (no network request). Falls back
  // to the first letter when Chrome has no icon for the site.
  function renderLogo(g) {
    const box = el('span', 'site-logo');
    box.setAttribute('aria-hidden', 'true');
    const letter = g === OTHER ? '*' : g[0].toUpperCase();
    if (g === OTHER || !chrome.runtime.getURL) {
      box.textContent = letter;
      return box;
    }
    const img = document.createElement('img');
    img.alt = '';
    img.src = chrome.runtime.getURL('/_favicon/') + '?pageUrl=' + encodeURIComponent('https://' + g + '/') + '&size=32';
    img.addEventListener('error', () => {
      box.classList.remove('has-img');
      box.textContent = letter;
    });
    box.classList.add('has-img');
    box.append(img);
    return box;
  }

  function renderSite(g, lists) {
    const isOpen = open.has(g);
    const li = el('li', 'fold');

    const head = el('button', 'fold-head');
    head.type = 'button';
    head.setAttribute('aria-expanded', String(isOpen));
    const total = lists.include.length + lists.exclude.length;
    head.setAttribute('aria-label', t(total === 1 ? 'siteRules1' : 'siteRules', { site: siteLabel(g), n: total }));
    const chev = el('span', 'chev', '›');
    chev.setAttribute('aria-hidden', 'true');
    const name = el('span', 'site-name', siteLabel(g));
    if (g !== OTHER) name.dir = 'ltr';
    const badges = el('span', 'site-badges');
    if (lists.include.length) badges.append(el('span', 'count count-on', '✓ ' + lists.include.length));
    if (lists.exclude.length) badges.append(el('span', 'count count-off', '✕ ' + lists.exclude.length));
    head.append(chev, renderLogo(g), name, badges);
    head.addEventListener('click', () => {
      if (open.has(g)) {
        open.delete(g);
        if (adding && adding.site === g) adding = null;
      } else open.add(g);
      render();
    });
    li.append(head);

    if (isOpen) {
      const body = el('div', 'fold-body');
      for (const list of LISTS) body.append(renderSection(g, list, lists[list]));
      li.append(body);
    }
    return li;
  }

  function renderSection(g, list, items) {
    const on = list === 'include';
    const sec = el('section', 'sec');
    const head = el('div', 'sec-head');
    const tag = el('span', 'tag ' + (on ? 'tag-on' : 'tag-off'), on ? '✓' : '✕');
    tag.setAttribute('aria-hidden', 'true');
    const title = el('span', null, t(on ? 'pillOn' : 'pillOff'));
    const n = el('span', 'sec-n', String(items.length));
    const add = el('button', 'btn btn-small sec-add ' + (on ? 'on' : 'off'), t('secAdd'));
    add.type = 'button';
    add.setAttribute('aria-label', t('addRuleTo', { list: t(on ? 'pillOn' : 'pillOff'), site: siteLabel(g) }));
    add.addEventListener('click', () => startAdd(g, list));
    head.append(tag, title, n, add);
    sec.append(head);

    const isAdding = adding && adding.site === g && adding.list === list;
    if (isAdding) sec.append(renderForm(on));

    const ul = el('ul', 'rule-list');
    for (const p of items) ul.append(renderRow(list, p));
    if (items.length) sec.append(ul);
    else if (!isAdding) sec.append(el('p', 'sec-none', t('listEmpty')));
    return sec;
  }

  function renderForm(on) {
    const wrap = el('div');
    const form = el('div', 'sec-form');
    const input = el('input');
    input.type = 'text';
    input.dir = 'ltr';
    input.spellcheck = false;
    input.autocomplete = 'off';
    input.value = adding.value;
    input.setAttribute('aria-label', t('addRuleTo', { list: t(on ? 'pillOn' : 'pillOff'), site: siteLabel(adding.site) }));
    input.placeholder = adding.site === OTHER ? '*.example.com/*' : adding.site + '/gallery/*';
    input.addEventListener('input', () => {
      adding.value = input.value;
      if (adding.error) {
        adding.error = false;
        wrap.querySelector('.field-err')?.remove();
      }
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') submitAdd();
      if (e.key === 'Escape') {
        adding = null;
        render();
      }
    });
    const ok = el('button', 'btn btn-primary', t('addBtn'));
    ok.type = 'button';
    ok.addEventListener('click', submitAdd);
    const cancel = el('button', 'btn', t('cancel'));
    cancel.type = 'button';
    cancel.addEventListener('click', () => {
      adding = null;
      render();
    });
    form.append(input, ok, cancel);
    wrap.append(form);
    if (adding.error) {
      const err = el('p', 'field-err', t('needPath'));
      err.setAttribute('role', 'alert');
      wrap.append(err);
    }
    return wrap;
  }

  // Rows show the full link, e.g. https://reddit.com/r/pics/*
  function renderRow(list, p) {
    const li = el('li', 'rule-row');
    const shown = 'https://' + Rules.normalize(Rules.safeDecode(p), /[?#]/.test(p));
    const text = el('span', 'rule-text', shown);
    text.dir = 'ltr';
    text.title = shown;
    const del = el('button', 'row-del', '✕');
    del.type = 'button';
    del.title = t('removeRule', { rule: Rules.safeDecode(p) });
    del.setAttribute('aria-label', del.title);
    del.addEventListener('click', () => removeRule(list, p));
    li.append(text, del);
    return li;
  }

  function renderTest() {
    const raw = els.testUrl.value.trim();
    if (!raw) {
      els.testResult.textContent = '';
      els.testResult.className = 'test-result';
      return;
    }
    const r = Rules.evaluate(raw, Rules.compile(rules), false);
    let msg;
    if (r.reason === 'exclude') msg = t('testOffExclude', { rule: Rules.safeDecode(r.rule) });
    else if (r.reason === 'include') msg = t('testOnInclude', { rule: Rules.safeDecode(r.rule) });
    else msg = t('testOffNoneC');
    els.testResult.textContent = msg;
    els.testResult.className = 'test-result ' + (r.active ? 'is-on' : r.reason === 'exclude' ? 'is-blocked' : 'is-off');
  }

  // Coming from the popup: open that page's site (even if it has no rules yet)
  // and put the page link in the tester.
  async function useFromUrl() {
    if (!chrome.storage.session) return;
    const res = await chrome.storage.session.get([FROM_KEY]);
    const url = res[FROM_KEY];
    if (!url) return;
    els.testUrl.value = url;
    const host = hostOf(url);
    if (host) {
      pending.add(host);
      open.add(host);
    }
    render();
  }

  // --- Init ------------------------------------------------------------------

  async function init() {
    await I18n.loadLang();
    const res = await chrome.storage.local.get([Rules.RULES_KEY]);
    setRules(res[Rules.RULES_KEY]);
    renderLang();
    await useFromUrl();

    globalThis.SILTheme.init();
    els.siteBtn.addEventListener('click', addSite);
    els.siteInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') addSite();
    });
    els.siteInput.addEventListener('input', () => els.siteErr.classList.add('hidden'));
    els.testUrl.addEventListener('input', renderTest);
    els.langButtons.forEach((btn) =>
      btn.addEventListener('click', async () => {
        I18n.setLang(btn.dataset.lang);
        renderLang();
        await chrome.storage.local.set({ [I18n.LANG_KEY]: I18n.lang });
      })
    );

    // Follow changes made from the popup (and other open copies of this page).
    // An add form the user is typing in stays open.
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'session' && changes[FROM_KEY]) useFromUrl();
      if (area !== 'local') return;
      if (changes[Rules.RULES_KEY]) {
        setRules(changes[Rules.RULES_KEY].newValue);
        const focused = document.activeElement && document.activeElement.closest('.sec-form');
        render();
        if (focused) {
          const input = els.siteList.querySelector('.sec-form input');
          if (input) {
            input.focus();
            input.setSelectionRange(input.value.length, input.value.length);
          }
        }
      }
      if (changes[I18n.LANG_KEY]) {
        I18n.setLang(changes[I18n.LANG_KEY].newValue);
        renderLang();
      }
    });
  }

  init();
})();
