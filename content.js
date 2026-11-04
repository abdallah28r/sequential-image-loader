// Sequential Image Loader — content script
// Runs on every page at document_start, but only does anything if the
// current hostname is enabled in storage. Off by default.
(function () {
  'use strict';

  if (window.__silInjected) return;
  window.__silInjected = true;

  const hostname = location.hostname;
  const STORAGE_KEY = 'siteSettings';
  const PROCESSED_ATTR = 'data-sil-processed';

  let settings = null;
  let queue = [];
  let activeCount = 0;
  let concurrency = 1;
  let totalSeen = 0;
  let totalDone = 0;
  let indicatorEl = null;
  let hideTimer = null;

  function getSiteSettings(cb) {
    chrome.storage.local.get([STORAGE_KEY], (res) => {
      const all = res[STORAGE_KEY] || {};
      cb(all[hostname] || { enabled: false, concurrency: 1 });
    });
  }

  // --- Detection -----------------------------------------------------
  // Handles plain <img src>, <img srcset>, and <picture><source srcset>.
  // Lazy-loaded images that the site itself controls via data-* attributes
  // (no src set yet) are left alone until the site actually assigns src.

  function isCandidateImg(img) {
    if (img.hasAttribute(PROCESSED_ATTR)) return false;
    const src = img.getAttribute('src');
    if (!src || src.startsWith('data:') || src.startsWith('blob:')) return false;
    return true;
  }

  function collectFrom(root) {
    if (!settings || !settings.enabled) return;
    if (root.nodeType !== 1) return;
    if (root.tagName === 'IMG') enqueueImg(root);
    if (root.querySelectorAll) {
      root.querySelectorAll('img').forEach(enqueueImg);
    }
  }

  function enqueueImg(img) {
    if (!isCandidateImg(img)) return;
    img.setAttribute(PROCESSED_ATTR, '1');

    const realSrc = img.getAttribute('src');
    const realSrcset = img.getAttribute('srcset');

    img.setAttribute('data-sil-src', realSrc);
    if (realSrcset) {
      img.setAttribute('data-sil-srcset', realSrcset);
      img.removeAttribute('srcset');
    }
    img.removeAttribute('src');

    // Also pause <picture><source srcset> siblings so the browser's
    // picture-selection logic doesn't fetch those instead.
    const picture = img.closest('picture');
    if (picture) {
      picture.querySelectorAll('source[srcset]').forEach((source) => {
        if (source.hasAttribute(PROCESSED_ATTR)) return;
        source.setAttribute(PROCESSED_ATTR, '1');
        source.setAttribute('data-sil-srcset', source.getAttribute('srcset'));
        source.removeAttribute('srcset');
      });
    }

    totalSeen++;
    updateIndicator();
    queue.push(img);
    pump();
  }

  // --- Queue -----------------------------------------------------------

  function pump() {
    while (activeCount < concurrency && queue.length > 0) {
      loadOne(queue.shift());
    }
  }

  function loadOne(img) {
    activeCount++;
    const realSrc = img.getAttribute('data-sil-src');
    const realSrcset = img.getAttribute('data-sil-srcset');

    const finish = () => {
      img.removeEventListener('load', finish);
      img.removeEventListener('error', finish);
      activeCount--;
      totalDone++;
      updateIndicator();
      pump();
    };

    img.addEventListener('load', finish, { once: true });
    img.addEventListener('error', finish, { once: true });

    const picture = img.closest('picture');
    if (picture) {
      picture.querySelectorAll('source[data-sil-srcset]').forEach((source) => {
        source.setAttribute('srcset', source.getAttribute('data-sil-srcset'));
      });
    }
    if (realSrcset) img.setAttribute('srcset', realSrcset);
    img.setAttribute('src', realSrc);
  }

  // --- On-page status pill ---------------------------------------------

  function updateIndicator() {
    if (!settings || !settings.enabled || totalSeen === 0) return;
    if (!indicatorEl) createIndicator();

    const remaining = totalSeen - totalDone;
    indicatorEl.textContent = remaining > 0
      ? `⏳ ${totalDone}/${totalSeen}`
      : `✅ ${totalSeen}`;
    indicatorEl.style.display = 'flex';

    clearTimeout(hideTimer);
    if (remaining === 0) {
      hideTimer = setTimeout(() => {
        if (indicatorEl) indicatorEl.style.display = 'none';
      }, 2000);
    }

    chrome.runtime.sendMessage({ type: 'SIL_STATS', total: totalSeen, done: totalDone }).catch(() => {});
  }

  function createIndicator() {
    indicatorEl = document.createElement('div');
    indicatorEl.id = '__sil_indicator__';
    Object.assign(indicatorEl.style, {
      position: 'fixed',
      bottom: '14px',
      insetInlineEnd: '14px',
      zIndex: '2147483647',
      background: 'rgba(18,20,24,0.88)',
      color: '#fff',
      font: '600 12px/1 ui-monospace, SFMono-Regular, Menlo, monospace',
      padding: '7px 11px',
      borderRadius: '999px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.35)',
      pointerEvents: 'none',
      letterSpacing: '0.02em'
    });
    (document.body || document.documentElement).appendChild(indicatorEl);
  }

  // --- Popup can ask for live stats -------------------------------------

  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg && msg.type === 'SIL_GET_STATS') {
      sendResponse({ enabled: !!(settings && settings.enabled), total: totalSeen, done: totalDone });
    }
  });

  // --- Init --------------------------------------------------------------

  function init() {
    getSiteSettings((s) => {
      settings = s;
      if (!settings.enabled) return;
      concurrency = Math.max(1, parseInt(settings.concurrency, 10) || 1);

      const start = () => {
        collectFrom(document.documentElement);
        const mo = new MutationObserver((mutations) => {
          for (const m of mutations) {
            m.addedNodes.forEach(collectFrom);
          }
        });
        mo.observe(document.documentElement, { childList: true, subtree: true });
      };

      if (document.body) start();
      else document.addEventListener('DOMContentLoaded', start, { once: true });
    });
  }

  init();
})();
