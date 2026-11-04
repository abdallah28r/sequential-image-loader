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
