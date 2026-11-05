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
  // Lives in a closed shadow root so the page's CSS can't restyle it.

  let pillText = null;
  let pillFill = null;
  let pillIcon = null;

  function updateIndicator() {
    if (totalSeen === 0) return;
    if (!indicatorEl) createIndicator();

    const remaining = totalSeen - totalDone;
    pillText.textContent = remaining > 0 ? `${totalDone} / ${totalSeen}` : String(totalSeen);
    pillFill.style.width = Math.round((totalDone / totalSeen) * 100) + '%';
    pillIcon.dataset.state = remaining > 0 ? 'loading' : 'done';
    indicatorEl.style.display = 'block';

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
      all: 'initial',
      position: 'fixed',
      bottom: '14px',
      right: '14px',
      zIndex: '2147483647',
      pointerEvents: 'none',
    });
    const root = indicatorEl.attachShadow({ mode: 'closed' });
    root.innerHTML = `
      <style>
        .pill { display: flex; align-items: center; gap: 8px; padding: 6px 11px 6px 8px;
          background: rgba(16, 20, 27, 0.92); color: #eceef2; border-radius: 999px;
          font: 600 12px/1 ui-monospace, SFMono-Regular, Consolas, monospace; letter-spacing: .02em;
          box-shadow: 0 2px 10px rgba(0, 0, 0, .3); }
        svg { width: 16px; height: 16px; display: block; }
        .bar { width: 44px; height: 4px; border-radius: 4px; background: rgba(255, 255, 255, .18); overflow: hidden; }
        .fill { height: 100%; width: 0; background: #f5a524; border-radius: 4px; transition: width .2s ease; }
        [data-state="done"] .frames { display: none; }
        [data-state="loading"] .check { display: none; }
        @media (prefers-reduced-motion: reduce) { .fill { transition: none; } }
      </style>
      <div class="pill">
        <span class="icon" data-state="loading">
          <svg class="frames" viewBox="0 0 48 48" aria-hidden="true">
            <rect x="18" y="5" width="25" height="21" rx="4" fill="#a9c0f0"/>
            <rect x="11" y="12" width="25" height="21" rx="4" fill="#6f95e4"/>
            <rect x="4" y="19" width="27" height="23" rx="4" fill="#3b6fd8"/>
            <circle cx="12" cy="27" r="3" fill="#f59e0b"/>
            <path d="M6 39l8-8 5 5 4-3 6 6z" fill="#fff"/>
          </svg>
          <svg class="check" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="10" fill="#4fd18b"/>
            <path d="M7.5 12.5l3 3 6-6.5" fill="none" stroke="#0c2a1a" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </span>
        <span class="text"></span>
        <span class="bar"><span class="fill" style="display:block"></span></span>
      </div>`;
    pillText = root.querySelector('.text');
    pillFill = root.querySelector('.fill');
    pillIcon = root.querySelector('.icon');
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
