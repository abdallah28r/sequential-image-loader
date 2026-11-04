// Everything is a URL rule. There is no separate "site" switch;
// "Turn on for the whole site" simply adds the rule  host/*.
const STORAGE_KEY = 'siteSettings'; // still holds per-site concurrency
const FROM_KEY = 'silFromUrl';

const I18n = globalThis.SILI18n;
const Rules = globalThis.SILRules;
const t = I18n.t;

const els = {
  hostname: document.getElementById('hostname'),
  unsupported: document.getElementById('unsupported'),
  controls: document.getElementById('controls'),
  stateBanner: document.getElementById('stateBanner'),
  stateTitle: document.getElementById('stateTitle'),
  stateReason: document.getElementById('stateReason'),
  addSite: document.getElementById('addSite'),
  addPage: document.getElementById('addPage'),
  blockPage: document.getElementById('blockPage'),
  unblockPage: document.getElementById('unblockPage'),
  openAdvancedLink: document.getElementById('openAdvancedLink'),
  matchBox: document.getElementById('matchBox'),
  matchList: document.getElementById('matchList'),
  concurrency: document.getElementById('concurrency'),
  status: document.getElementById('status'),
  statusText: document.getElementById('statusText'),
  barFill: document.getElementById('barFill'),
  settingsBtn: document.getElementById('settingsBtn'),
  mainView: document.getElementById('mainView'),
  settingsView: document.getElementById('settingsView'),
  rulesSummary: document.getElementById('rulesSummary'),
  advancedBtn: document.getElementById('advancedBtn'),
  langButtons: document.querySelectorAll('[data-lang]'),
};

let currentTab = null;
let hostname = null;
let lastStats = null;
let rules = { include: [], exclude: [] };

function isSupportedUrl(url) {
  return /^https?:\/\//i.test(url || '');
}

// --- Rule helpers ----------------------------------------------------------

function sitePattern() {
  const u = new URL(currentTab.url);
  return u.host.replace(/^www\./i, '') + '/*';
}

function pagePattern() {
  const u = new URL(currentTab.url);
  // Store readable letters (e.g. Arabic) instead of %D8%AA... codes.
  return Rules.safeDecode((u.host.replace(/^www\./i, '') + u.pathname).replace(/\/+$/, ''));
}

function matches(pattern) {
  const c = Rules.compileOne(pattern);
  return !!(c && c.re.test(Rules.normalize(currentTab.url, c.keepQuery)));
}

async function saveRules(next) {
  rules = next;
  await chrome.storage.local.set({ [Rules.RULES_KEY]: next });
}

async function addRule(list, pattern) {
  const next = { include: [...rules.include], exclude: [...rules.exclude] };
  const k = Rules.keyOf(pattern);
  // The same rule can't be in both lists: it moves to the list chosen last.
  const other = list === 'include' ? 'exclude' : 'include';
  next[other] = next[other].filter((p) => Rules.keyOf(p) !== k);
  if (!next[list].some((p) => Rules.keyOf(p) === k)) next[list].push(pattern);
  await saveRules(next);
  render();
  chrome.tabs.reload(currentTab.id);
}

// Is this rule exactly "this page only" (not a site- or section-wide rule)?
function isPageRule(pattern) {
  return Rules.keyOf(pattern) === Rules.keyOf(pagePattern());
}

// Remove every "never on" rule that blocks this page.
async function unblock() {
  await saveRules({ ...rules, exclude: rules.exclude.filter((p) => !matches(p)) });
  render();
  chrome.tabs.reload(currentTab.id);
}

async function removeRule(list, pattern) {
  await saveRules({ ...rules, [list]: rules[list].filter((p) => p !== pattern) });
  render();
  chrome.tabs.reload(currentTab.id);
}

// --- Rendering -------------------------------------------------------------

function renderState() {
  const r = Rules.evaluate(currentTab.url, Rules.compile(rules), false);
  let state, title, reason;
  if (r.reason === 'exclude') { state = 'blocked'; title = t('stateBlocked'); reason = t('reasonExclude', { rule: r.rule }); }
  else if (r.reason === 'include') { state = 'on'; title = t('stateOn'); reason = t('reasonInclude', { rule: r.rule }); }
  else { state = 'off'; title = t('stateOff'); reason = t('reasonNoneC'); }
  els.stateTitle.textContent = title;
  els.stateReason.textContent = reason;
  els.stateBanner.className = 'state-banner is-' + state;

  // Which buttons make sense for this page:
  //   off                         -> whole site, this page only
  //   on by "this page only" rule -> whole site
  //   on by a wider rule          -> never on this page (+ whole site if not already)
  //   blocked                     -> unblock this page
  const hasSiteRule = rules.include.some((p) => Rules.normalize(p, false).toLowerCase() === sitePattern().toLowerCase());
  const wider = rules.include.filter((p) => matches(p) && !isPageRule(p));
  const show = { addSite: false, addPage: false, blockPage: false, unblockPage: false };
  if (r.reason === 'exclude') show.unblockPage = true;
  else if (r.reason === 'include') {
    if (wider.length) { show.blockPage = true; show.addSite = !hasSiteRule; }
    else show.addSite = true;
  } else { show.addSite = true; show.addPage = true; }
  for (const [id, on] of Object.entries(show)) els[id].classList.toggle('hidden', !on);
}

function renderMatches() {
  const hits = [
    ...rules.include.filter(matches).map((p) => ['include', p]),
    ...rules.exclude.filter(matches).map((p) => ['exclude', p]),
  ];
  els.matchBox.classList.toggle('hidden', hits.length === 0);
  els.matchList.replaceChildren();
  for (const [list, p] of hits) {
    const li = document.createElement('li');
    li.className = 'site-item';
    const tag = document.createElement('span');
    tag.className = 'ic ' + (list === 'include' ? 'on' : 'off');
    tag.textContent = list === 'include' ? '✓' : '✕';
    tag.setAttribute('aria-hidden', 'true');
    const name = document.createElement('span');
    name.className = 'site-host';
    name.dir = 'ltr';
    name.textContent = p;
    name.title = p;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'site-disable';
    btn.textContent = t('remove');
    btn.setAttribute('aria-label', t('removeRule', { rule: p }));
    btn.addEventListener('click', () => removeRule(list, p));
    li.append(tag, name, btn);
    els.matchList.append(li);
  }
}

function renderSummary() {
  els.rulesSummary.textContent = t('rulesSummary', { on: rules.include.length, off: rules.exclude.length });
}

function render() {
  if (hostname) {
    renderState();
    renderMatches();
  }
  renderSummary();
}

function applyLang() {
  I18n.applyTo(document);
  els.langButtons.forEach((btn) => btn.setAttribute('aria-checked', String(btn.dataset.lang === I18n.lang)));
  if (!hostname) els.hostname.textContent = currentTab ? t('unsupportedHost') : '—';
  render();
  renderStats();
}

// --- Live stats ------------------------------------------------------------

function renderStats() {
  const resp = lastStats;
  if (!resp || !resp.enabled || resp.total === 0) {
    els.status.classList.add('hidden');
    return;
  }
  els.status.classList.remove('hidden');
  els.statusText.textContent = t('progress', { done: resp.done, total: resp.total });
  els.barFill.style.width = Math.round((resp.done / resp.total) * 100) + '%';
}

function refreshStats() {
  if (!currentTab || !hostname) return;
  chrome.tabs.sendMessage(currentTab.id, { type: 'SIL_GET_STATS' }, (resp) => {
    lastStats = chrome.runtime.lastError ? null : resp || null;
    renderStats();
  });
}

// --- Navigation ------------------------------------------------------------

function toggleSettings(open) {
  els.settingsView.classList.toggle('hidden', !open);
  els.mainView.classList.toggle('hidden', open);
  els.settingsBtn.setAttribute('aria-expanded', String(open));
}

async function openAdvanced() {
  if (chrome.storage.session) {
    if (hostname && currentTab) await chrome.storage.session.set({ [FROM_KEY]: currentTab.url });
    else await chrome.storage.session.remove(FROM_KEY);
  }
  await chrome.runtime.openOptionsPage();
  window.close();
}

// --- Init ------------------------------------------------------------------

async function init() {
  await I18n.loadLang();
  const stored = await chrome.storage.local.get([Rules.RULES_KEY, STORAGE_KEY]);
  rules = { include: [], exclude: [], ...(stored[Rules.RULES_KEY] || {}) };

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  currentTab = tab || null;

  els.settingsBtn.addEventListener('click', () => toggleSettings(els.settingsView.classList.contains('hidden')));
  els.langButtons.forEach((btn) =>
    btn.addEventListener('click', async () => {
      I18n.setLang(btn.dataset.lang);
      applyLang();
      await chrome.storage.local.set({ [I18n.LANG_KEY]: I18n.lang });
    })
  );
  els.advancedBtn.addEventListener('click', openAdvanced);

  if (!tab || !isSupportedUrl(tab.url)) {
    els.controls.classList.add('hidden');
    els.unsupported.classList.remove('hidden');
    applyLang();
    return;
  }

  hostname = new URL(tab.url).hostname;
  els.hostname.textContent = hostname;
  const sites = stored[STORAGE_KEY] || {};
  els.concurrency.value = String((sites[hostname] && sites[hostname].concurrency) || 1);

  els.addSite.addEventListener('click', () => addRule('include', sitePattern()));
  els.addPage.addEventListener('click', () => addRule('include', pagePattern()));
  els.blockPage.addEventListener('click', () => addRule('exclude', pagePattern()));
  els.unblockPage.addEventListener('click', unblock);
  els.openAdvancedLink.addEventListener('click', openAdvanced);
  els.concurrency.addEventListener('change', async () => {
    const all = (await chrome.storage.local.get([STORAGE_KEY]))[STORAGE_KEY] || {};
    all[hostname] = { enabled: false, concurrency: parseInt(els.concurrency.value, 10) || 1 };
    await chrome.storage.local.set({ [STORAGE_KEY]: all });
    if (Rules.evaluate(currentTab.url, Rules.compile(rules), false).active) chrome.tabs.reload(currentTab.id);
  });

  // Stay in sync with edits made on the Advanced settings page.
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;
    if (changes[Rules.RULES_KEY]) {
      rules = { include: [], exclude: [], ...(changes[Rules.RULES_KEY].newValue || {}) };
      render();
    }
    if (changes[I18n.LANG_KEY]) {
      I18n.setLang(changes[I18n.LANG_KEY].newValue);
      applyLang();
    }
  });

  applyLang();
  refreshStats();
  setInterval(refreshStats, 800);
}

init();
