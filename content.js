// Sequential Image Loader — content script
// Runs on every page at document_start. It only does work when the page is
// active: its site is enabled, or an "Always on" URL rule matches, and no
// "Never on" rule matches. Off by default. Matching lives in rules.js.
(function () {
  'use strict';

  if (window.__silInjected) return;
  window.__silInjected = true;

  const Rules = globalThis.SILRules;
  const STORAGE_KEY = 'siteSettings';
  const RULES_KEY = Rules.RULES_KEY;
  const PROCESSED_ATTR = 'data-sil-processed';
  const hostname = location.hostname;

  let siteEntry = { enabled: false, concurrency: 1 };
  let compiled = { include: [], exclude: [] };
  let active = false;
  let started = false; // has the first activation scanned the page yet?
  let observer = null;
  let lastHref = location.href;

  let queue = [];
  let activeCount = 0;
  let concurrency = 1;
  let totalSeen = 0;
  let totalDone = 0;
  let indicatorEl = null;
  let hideTimer = null;

  // --- Detection -----------------------------------------------------
  // Handles plain <img src>, <img srcset>, and <picture><source srcset>.
  // Lazy-loaded images that the site itself controls via data-* attributes
  // (no src set yet) are left alone until the site actually assigns src.

  function isCandidateImg(img) {
    if (img.hasAttribute(PROCESSED_ATTR)) return false;
    const src = img.getAttribute('src');
    if (!src || src.startsWith('data:') || src.startsWith('blob:')) return false;
    if (img.complete && img.naturalWidth > 0) return false; // already loaded
    return true;
  }

  function collectFrom(root) {
    if (!active) return;
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

  // Release everything still waiting (used when the page becomes inactive,
  // e.g. the site navigated to an excluded URL without reloading).
  function flushQueue() {
    while (queue.length > 0) loadOne(queue.shift());
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
    if (totalSeen === 0) return;
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
      sendResponse({ enabled: active, total: totalSeen, done: totalDone });
    }
  });

  // --- Activation --------------------------------------------------------

  // Only watch the page if it could ever become active here: the site is
  // enabled, or some "Always on" rule could match a page on this host.
  function mightBeActive() {
    // location.host keeps the port, so rules like "localhost:8080/*" work too.
    return siteEntry.enabled || Rules.couldMatchHost(compiled.include, location.host);
  }

  function ensureObserver() {
    if (observer) return;
    observer = new MutationObserver((mutations) => {
      checkUrl();
      if (!active) return;
      for (const m of mutations) {
        m.addedNodes.forEach(collectFrom);
      }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  function recompute() {
    const wasActive = active;
    active = Rules.evaluate(location.href, compiled, siteEntry.enabled).active;
    concurrency = Math.max(1, parseInt(siteEntry.concurrency, 10) || 1);

    if (mightBeActive()) ensureObserver();

    if (active && !wasActive) {
      // First activation on page load: take over images already in the DOM.
      // Later activations (URL change, rule edit) only affect new images.
      if (!started) collectFrom(document.documentElement);
      pump();
    } else if (!active && wasActive) {
      flushQueue();
    }
    started = true;
  }

  // Single-page sites change the URL without reloading the page.
  function checkUrl() {
    if (location.href === lastHref) return;
    lastHref = location.href;
    recompute();
  }

  window.addEventListener('popstate', checkUrl);
  window.addEventListener('hashchange', checkUrl);
  if (window.navigation && window.navigation.addEventListener) {
    window.navigation.addEventListener('currententrychange', checkUrl);
  }

  // Apply settings or rule edits made in the popup / options page right away.
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;
    if (!changes[STORAGE_KEY] && !changes[RULES_KEY]) return;
    load(recompute);
  });

  function load(cb) {
    chrome.storage.local.get([STORAGE_KEY, RULES_KEY], (res) => {
      const all = res[STORAGE_KEY] || {};
      siteEntry = all[hostname] || { enabled: false, concurrency: 1 };
      compiled = Rules.compile(res[RULES_KEY]);
      cb();
    });
  }

  load(recompute);
})();
