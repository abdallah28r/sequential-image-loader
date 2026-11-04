const STORAGE_KEY = 'siteSettings';
const FROM_KEY = 'silFromUrl'; // handed to the options page via storage.session

const I18n = globalThis.SILI18n;
const Rules = globalThis.SILRules;
const t = I18n.t;

// --- Elements & state ------------------------------------------------------

const els = {
  hostname: document.getElementById('hostname'),
  unsupported: document.getElementById('unsupported'),
  controls: document.getElementById('controls'),
  enableToggle: document.getElementById('enableToggle'),
  ruleStatus: document.getElementById('ruleStatus'),
  concurrency: document.getElementById('concurrency'),
  status: document.getElementById('status'),
  statusText: document.getElementById('statusText'),
  barFill: document.getElementById('barFill'),
  settingsBtn: document.getElementById('settingsBtn'),
  mainView: document.getElementById('mainView'),
  settingsView: document.getElementById('settingsView'),
  siteList: document.getElementById('siteList'),
  noSites: document.getElementById('noSites'),
  advancedBtn: document.getElementById('advancedBtn'),
  langButtons: document.querySelectorAll('[data-lang]'),
};

let currentTab = null;
let hostname = null;
let lastStats = null;
let compiledRules = { include: [], exclude: [] };

function isSupportedUrl(url) {
  return /^https?:\/\//i.test(url || '');
}

// --- Storage ---------------------------------------------------------------

async function getAllSettings() {
  const res = await chrome.storage.local.get([STORAGE_KEY]);
  return res[STORAGE_KEY] || {};
}

async function loadSettings() {
  const all = await getAllSettings();
  return all[hostname] || { enabled: false, concurrency: 1 };
}

async function saveSettings(next) {
  const all = await getAllSettings();
  all[hostname] = next;
  await chrome.storage.local.set({ [STORAGE_KEY]: all });
}

// --- Language --------------------------------------------------------------

function applyLang() {
  I18n.applyTo(document);
  els.langButtons.forEach((btn) => {
    btn.setAttribute('aria-checked', String(btn.dataset.lang === I18n.lang));
  });
  if (!hostname) els.hostname.textContent = currentTab ? t('unsupportedHost') : '—';
  renderRuleStatus();
  renderStats();
  renderSiteList();
}

async function setLang(next) {
  if (next === I18n.lang) return;
  I18n.setLang(next);
  applyLang();
  await chrome.storage.local.set({ [I18n.LANG_KEY]: I18n.lang });
}

// --- URL rule status for the current page -----------------------------------

function renderRuleStatus() {
  if (!hostname || !currentTab) {
    els.ruleStatus.classList.add('hidden');
    return;
  }
  const r = Rules.evaluate(currentTab.url, compiledRules, els.enableToggle.checked);
  if (r.reason !== 'include' && r.reason !== 'exclude') {
    els.ruleStatus.classList.add('hidden');
    return;
  }
  const key = r.reason === 'include' ? 'ruleOn' : 'ruleOff';
  els.ruleStatus.textContent = t(key, { rule: r.rule });
  els.ruleStatus.className = 'rule-status ' + (r.reason === 'include' ? 'is-on' : 'is-off');
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
  const pct = resp.total ? Math.round((resp.done / resp.total) * 100) : 0;
  els.barFill.style.width = pct + '%';
}

function refreshStats() {
  if (!currentTab || !hostname) return;
  chrome.tabs.sendMessage(currentTab.id, { type: 'SIL_GET_STATS' }, (resp) => {
    lastStats = chrome.runtime.lastError ? null : resp || null;
    renderStats();
  });
}

// --- Settings view ---------------------------------------------------------

function toggleSettings(open) {
  els.settingsView.classList.toggle('hidden', !open);
  els.mainView.classList.toggle('hidden', open);
  els.settingsBtn.setAttribute('aria-expanded', String(open));
  if (open) renderSiteList();
}

let renderToken = 0;

async function renderSiteList() {
  const token = ++renderToken;
  const all = await getAllSettings();
  if (token !== renderToken) return; // a newer render started meanwhile

  const hosts = Object.keys(all).filter((h) => all[h] && all[h].enabled).sort();
  els.siteList.replaceChildren();
  els.siteList.classList.toggle('hidden', hosts.length === 0);
  els.noSites.classList.toggle('hidden', hosts.length > 0);

  for (const host of hosts) {
    const li = document.createElement('li');
    li.className = 'site-item';

    const name = document.createElement('span');
    name.className = 'site-host';
    name.dir = 'ltr';
    name.textContent = host;
    name.title = host;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'site-disable';
    btn.textContent = t('disable');
    btn.setAttribute('aria-label', t('disableFor', { host }));
    btn.addEventListener('click', () => disableSite(host));

    li.append(name, btn);
    els.siteList.append(li);
  }
}

async function disableSite(host) {
  const all = await getAllSettings();
  if (!all[host]) return;
  all[host] = { ...all[host], enabled: false };
  await chrome.storage.local.set({ [STORAGE_KEY]: all });

  // If it's the site in the current tab, keep the main switch in sync
  // and reload so the page goes back to normal loading.
  if (host === hostname && currentTab) {
    els.enableToggle.checked = false;
    lastStats = null;
    renderStats();
    renderRuleStatus();
    chrome.tabs.reload(currentTab.id);
  }
  renderSiteList();
}

async function openAdvanced() {
  // Let the options page offer "add this page" buttons for the current tab.
  if (chrome.storage.session) {
    if (hostname && currentTab) {
      await chrome.storage.session.set({ [FROM_KEY]: currentTab.url });
    } else {
      await chrome.storage.session.remove(FROM_KEY);
    }
  }
  await chrome.runtime.openOptionsPage();
  window.close();
}

// --- Init ------------------------------------------------------------------

async function init() {
  await I18n.loadLang();
  const stored = await chrome.storage.local.get([Rules.RULES_KEY]);
  compiledRules = Rules.compile(stored[Rules.RULES_KEY]);

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  currentTab = tab || null;

  // Settings work on every page, including unsupported ones.
  els.settingsBtn.addEventListener('click', () => {
    toggleSettings(els.settingsView.classList.contains('hidden'));
  });
  els.langButtons.forEach((btn) => {
    btn.addEventListener('click', () => setLang(btn.dataset.lang));
  });
  els.advancedBtn.addEventListener('click', openAdvanced);

  if (!tab || !isSupportedUrl(tab.url)) {
    els.controls.classList.add('hidden');
    els.unsupported.classList.remove('hidden');
    applyLang();
    return;
  }

  hostname = new URL(tab.url).hostname;
  els.hostname.textContent = hostname;

  const settings = await loadSettings();
  els.enableToggle.checked = !!settings.enabled;
  els.concurrency.value = String(settings.concurrency || 1);

  applyLang();
  refreshStats();
  setInterval(refreshStats, 800);

  els.enableToggle.addEventListener('change', async () => {
    const next = {
      enabled: els.enableToggle.checked,
      concurrency: parseInt(els.concurrency.value, 10) || 1,
    };
    await saveSettings(next);
    chrome.tabs.reload(currentTab.id);
    window.close();
  });

  els.concurrency.addEventListener('change', async () => {
    const next = {
      enabled: els.enableToggle.checked,
      concurrency: parseInt(els.concurrency.value, 10) || 1,
    };
    await saveSettings(next);
    if (next.enabled) {
      chrome.tabs.reload(currentTab.id);
      window.close();
    }
  });
}

init();
