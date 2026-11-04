// Sequential Image Loader — background service worker
// Keeps the toolbar badge in sync with per-tab loading progress.

const ACCENT = '#5B8DEF';

chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg && msg.type === 'SIL_STATS' && sender.tab && sender.tab.id != null) {
    const remaining = msg.total - msg.done;
    chrome.action.setBadgeText({
      tabId: sender.tab.id,
      text: remaining > 0 ? String(remaining) : ''
    });
    chrome.action.setBadgeBackgroundColor({ tabId: sender.tab.id, color: ACCENT });
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  chrome.action.setBadgeText({ tabId, text: '' }).catch(() => {});
});

// There is no "whole site" switch any more (v1.1.0). Convert sites that
// were enabled with the old switch into the rule  host/*  (once).
async function migrateSitesToRules() {
  const res = await chrome.storage.local.get(['siteSettings', 'urlRules']);
  const sites = res.siteSettings || {};
  const rules = { include: [], exclude: [], ...(res.urlRules || {}) };
  let changed = false;
  for (const [host, entry] of Object.entries(sites)) {
    if (entry && entry.enabled) {
      const p = host.replace(/^www\./i, '') + '/*';
      if (!rules.include.includes(p)) rules.include.push(p);
      sites[host] = { ...entry, enabled: false };
      changed = true;
    }
  }
  if (changed) await chrome.storage.local.set({ siteSettings: sites, urlRules: rules });
}

chrome.runtime.onInstalled.addListener(migrateSitesToRules);
chrome.runtime.onStartup.addListener(migrateSitesToRules);
