// Sequential Image Loader — URL rule matching (shared by content script,
// popup and options page).
//
// Pattern syntax (one pattern per line):
//   *            matches anything (including "/")
//   scheme       optional and ignored: http, https and no scheme all match
//   www.         optional and ignored
//   ?query #hash ignored, unless the pattern itself contains "?" or "#"
//   trailing /   ignored, and "/*" at the end also matches the bare path
//   case         ignored
//
// Examples:
//   https://example.com/comics/*         every page under /comics/
//   https://example.com/node/*/8/simple  any id in the middle
//   https://*.example.com/*              every subdomain
//
// Exclude rules always win over include rules.
(function (root) {
  'use strict';

  if (root.SILRules) return;

  const RULES_KEY = 'urlRules';

  function escapeRe(s) {
    return s.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
  }

  // Bring a URL or a pattern to a comparable form.
  function normalize(input, keepQuery) {
    let s = String(input).trim();
    s = s.replace(/^[a-z][a-z0-9+.-]*:\/\//i, ''); // scheme
    s = s.replace(/^www\./i, '');
    if (!keepQuery) s = s.replace(/[?#].*$/, '');
    s = s.replace(/\/+$/, ''); // trailing slashes
    return s;
  }

  function compileOne(pattern) {
    const source = String(pattern).trim();
    if (!source) return null;

    const keepQuery = /[?#]/.test(source.replace(/^[a-z][a-z0-9+.-]*:\/\//i, ''));
    let p = normalize(source, keepQuery);
    if (!p) return null;

    // "/*" at the very end should also match the path without a slash.
    let tail = '';
    if (p.endsWith('/*')) {
      p = p.slice(0, -2);
      tail = '(?:/.*)?';
    }

    const body = p.split('*').map(escapeRe).join('.*');
    const host = p.split('/')[0];
    return {
      source,
      keepQuery,
      re: new RegExp('^' + body + tail + '$', 'i'),
      hostRe: new RegExp('^' + host.split('*').map(escapeRe).join('.*') + '$', 'i'),
    };
  }

  function parseLines(text) {
    return String(text || '')
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
  }

  function compile(rules) {
    const r = rules || {};
    return {
      include: (r.include || []).map(compileOne).filter(Boolean),
      exclude: (r.exclude || []).map(compileOne).filter(Boolean),
    };
  }

  function firstMatch(url, list) {
    for (const rule of list) {
      if (rule.re.test(normalize(url, rule.keepQuery))) return rule;
    }
    return null;
  }

  // Could any rule in the list match some page on this hostname?
  function couldMatchHost(list, hostname) {
    const h = normalize(hostname, false);
    return list.some((rule) => rule.hostRe.test(h));
  }

  /**
   * Decide whether sequential loading is active for a URL.
   * @returns {{active: boolean, reason: 'exclude'|'include'|'site'|'none', rule?: string}}
   */
  function evaluate(url, compiled, siteEnabled) {
    const c = compiled || { include: [], exclude: [] };
    const ex = firstMatch(url, c.exclude);
    if (ex) return { active: false, reason: 'exclude', rule: ex.source };
    const inc = firstMatch(url, c.include);
    if (inc) return { active: true, reason: 'include', rule: inc.source };
    if (siteEnabled) return { active: true, reason: 'site' };
    return { active: false, reason: 'none' };
  }

  root.SILRules = { RULES_KEY, normalize, compile, compileOne, parseLines, evaluate, couldMatchHost };
})(typeof globalThis !== 'undefined' ? globalThis : this);
