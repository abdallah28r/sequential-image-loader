const STORAGE_KEY = 'siteSettings';
const LANG_KEY = 'uiLang';
const DEFAULT_LANG = 'en';

// --- Translations --------------------------------------------------------

const STRINGS = {
  en: {
    title: 'Sequential Image Loader',
    unsupported: "Can't be enabled on this page.",
    unsupportedHost: 'Not supported',
    enableSite: 'Enable for this site',
    concurrency: 'Images at a time',
    concurrencyOne: '1 (fully sequential)',
    hint: 'Changing a setting reloads the page automatically.',
    progress: '{done} / {total} images',
    settings: 'Settings',
    language: 'Language',
    enabledSites: 'Enabled sites',
    noSites: 'No sites enabled yet.',
    disable: 'Disable',
    disableFor: 'Disable for {host}',
    sitesHint: 'Other open tabs of a disabled site return to normal after a reload.',
  },
  ar: {
    title: 'تحميل متسلسل للصور',
    unsupported: 'لا يمكن التفعيل على هذه الصفحة.',
    unsupportedHost: 'غير مدعوم',
    enableSite: 'تفعيل لهذا الموقع',
    concurrency: 'عدد الصور المتزامنة',
    concurrencyOne: '1 (متسلسل بالكامل)',
    hint: 'تفعيل/تغيير الإعداد يعيد تحميل الصفحة تلقائياً.',
    progress: '{done} / {total} صورة',
    settings: 'الإعدادات',
    language: 'اللغة',
    enabledSites: 'المواقع المفعّلة',
    noSites: 'لا توجد مواقع مفعّلة بعد.',
    disable: 'إيقاف',
    disableFor: 'إيقاف لـ {host}',
    sitesHint: 'التبويبات المفتوحة الأخرى للموقع الموقوف ترجع طبيعية بعد إعادة تحميلها.',
  },
};

let lang = DEFAULT_LANG;

function t(key, vars) {
  let s = (STRINGS[lang] && STRINGS[lang][key]) || STRINGS.en[key] || key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v));
  }
  return s;
}

// --- Elements & state ------------------------------------------------------

const els = {
  hostname: document.getElementById('hostname'),
  unsupported: document.getElementById('unsupported'),
  controls: document.getElementById('controls'),
  enableToggle: document.getElementById('enableToggle'),
  concurrency: document.getElementById('concurrency'),
  status: document.getElementById('status'),
  statusText: document.getElementById('statusText'),
  barFill: document.getElementById('barFill'),
  settingsBtn: document.getElementById('settingsBtn'),
  mainView: document.getElementById('mainView'),
  settingsView: document.getElementById('settingsView'),
  siteList: document.getElementById('siteList'),
  noSites: document.getElementById('noSites'),
  langButtons: document.querySelectorAll('[data-lang]'),
};

let currentTab = null;
let hostname = null;
let lastStats = null;

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
  const root = document.documentElement;
  root.lang = lang;
  root.dir = lang === 'ar' ? 'rtl' : 'ltr';

  document.querySelectorAll('[data-i18n]').forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-label]').forEach((el) => {
    const label = t(el.dataset.i18nLabel);
    el.title = label;
    el.setAttribute('aria-label', label);
  });
  els.langButtons.forEach((btn) => {
    btn.setAttribute('aria-checked', String(btn.dataset.lang === lang));
  });

  if (!hostname) els.hostname.textContent = currentTab ? t('unsupportedHost') : '—';
  renderStats();
  renderSiteList();
}

async function setLang(next) {
  if (!STRINGS[next] || next === lang) return;
  lang = next;
  applyLang();
  await chrome.storage.local.set({ [LANG_KEY]: lang });
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
    chrome.tabs.reload(currentTab.id);
  }
  renderSiteList();
}

// --- Init ------------------------------------------------------------------

async function init() {
  const stored = await chrome.storage.local.get([LANG_KEY]);
  if (STRINGS[stored[LANG_KEY]]) lang = stored[LANG_KEY];

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  currentTab = tab || null;

  // Settings work on every page, including unsupported ones.
  els.settingsBtn.addEventListener('click', () => {
    toggleSettings(els.settingsView.classList.contains('hidden'));
  });
  els.langButtons.forEach((btn) => {
    btn.addEventListener('click', () => setLang(btn.dataset.lang));
  });

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
