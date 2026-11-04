const STORAGE_KEY = 'siteSettings';

const els = {
  hostname: document.getElementById('hostname'),
  unsupported: document.getElementById('unsupported'),
  controls: document.getElementById('controls'),
  enableToggle: document.getElementById('enableToggle'),
  concurrency: document.getElementById('concurrency'),
  status: document.getElementById('status'),
  statusText: document.getElementById('statusText'),
  barFill: document.getElementById('barFill'),
};

let currentTab = null;
let hostname = null;

function isSupportedUrl(url) {
  return /^https?:\/\//i.test(url || '');
}

async function loadSettings() {
  const res = await chrome.storage.local.get([STORAGE_KEY]);
  const all = res[STORAGE_KEY] || {};
  return all[hostname] || { enabled: false, concurrency: 1 };
}

async function saveSettings(next) {
  const res = await chrome.storage.local.get([STORAGE_KEY]);
  const all = res[STORAGE_KEY] || {};
  all[hostname] = next;
  await chrome.storage.local.set({ [STORAGE_KEY]: all });
}

function refreshStats() {
  if (!currentTab) return;
  chrome.tabs.sendMessage(currentTab.id, { type: 'SIL_GET_STATS' }, (resp) => {
    if (chrome.runtime.lastError || !resp) {
      els.status.classList.add('hidden');
      return;
    }
    if (!resp.enabled || resp.total === 0) {
      els.status.classList.add('hidden');
      return;
    }
    els.status.classList.remove('hidden');
    els.statusText.textContent = `${resp.done} / ${resp.total} صورة`;
    const pct = resp.total ? Math.round((resp.done / resp.total) * 100) : 0;
    els.barFill.style.width = pct + '%';
  });
}

async function init() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  currentTab = tab;

  if (!tab || !isSupportedUrl(tab.url)) {
    els.controls.classList.add('hidden');
    els.unsupported.classList.remove('hidden');
    els.hostname.textContent = 'غير مدعوم';
    return;
  }

  hostname = new URL(tab.url).hostname;
  els.hostname.textContent = hostname;

  const settings = await loadSettings();
  els.enableToggle.checked = !!settings.enabled;
  els.concurrency.value = String(settings.concurrency || 1);

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
