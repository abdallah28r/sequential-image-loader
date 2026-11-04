// Sequential Image Loader — interface translations (popup + options page).
// English is the default; the user can switch to Arabic in Settings.
(function (root) {
  'use strict';

  const LANG_KEY = 'uiLang';
  const DEFAULT_LANG = 'en';

  // Unicode "left-to-right isolate" ... "pop directional isolate".
  const LTR = (v) => '⁦' + String(v) + '⁩';

  const STRINGS = {
    en: {
      // Popup
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
      advanced: 'Advanced settings: URL rules',
      ruleOn: 'On for this page by rule: {rule}',
      ruleOff: 'Off for this page by rule: {rule}',

      // Options page
      optTitle: 'Advanced settings',
      rulesTitle: 'URL rules',
      rulesIntro: 'Write one link per line. Use * to mean "anything".',
      fromPage: 'Page you came from',
      addInclude: '+ Always on',
      addExclude: '+ Never on',
      includeTitle: 'Always on for these links',
      includeHelp: 'Sequential loading runs on matching pages, even when the whole site is not enabled.',
      excludeTitle: 'Never on for these links',
      excludeHelp: 'Sequential loading never runs on matching pages. This wins over everything else.',
      rulesCount: '{n} rules',
      save: 'Save',
      saved: 'Saved ✓',
      unsaved: 'Unsaved changes',
      testTitle: 'Test a link',
      testPlaceholder: 'Paste a link to see what happens on it',
      testOnInclude: '✅ On: matches the "Always on" rule {rule}',
      testOnSite: '✅ On: the whole site is enabled',
      testOffExclude: '⛔ Off: matches the "Never on" rule {rule}',
      testOffNone: '— Off: no rule matches and the site is not enabled',
      testUnsaved: '(based on the text above, not saved yet)',
      tipsTitle: 'How links are matched',
      tip1: '* matches anything, including "/". Example: https://example.com/comics/*',
      tip2: 'It also works in the middle: https://example.com/node/*/8/simple',
      tip3: 'http / https and "www." are ignored.',
      tip4: '"?…" and "#…" at the end of a link are ignored, unless your rule contains them.',
      tip5: 'Upper and lower case letters are treated the same.',
      applyNote: 'Changes apply right away to newly added images. Reload open tabs to apply them to the whole page.',
    },
    ar: {
      // Popup
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
      advanced: 'إعدادات متقدمة: قواعد الروابط',
      ruleOn: 'مفعّل لهذه الصفحة بسبب القاعدة: {rule}',
      ruleOff: 'موقوف لهذه الصفحة بسبب القاعدة: {rule}',

      // Options page
      optTitle: 'الإعدادات المتقدمة',
      rulesTitle: 'قواعد الروابط',
      rulesIntro: 'اكتب رابطاً واحداً في كل سطر. استخدم * بمعنى «أي شيء».',
      fromPage: 'الصفحة اللي جيت منها',
      addInclude: '+ تفعيل دائماً',
      addExclude: '+ منع دائماً',
      includeTitle: 'مفعّل دائماً على هذه الروابط',
      includeHelp: 'التحميل التسلسلي يشتغل على الصفحات المطابقة حتى لو الموقع كامل غير مفعّل.',
      excludeTitle: 'ممنوع دائماً على هذه الروابط',
      excludeHelp: 'التحميل التسلسلي ما يشتغل أبداً على الصفحات المطابقة، وهذا يتقدّم على أي إعداد ثاني.',
      rulesCount: '{n} قاعدة',
      save: 'حفظ',
      saved: 'تم الحفظ ✓',
      unsaved: 'تغييرات غير محفوظة',
      testTitle: 'جرّب رابط',
      testPlaceholder: 'الصق رابطاً لتعرف وش يصير فيه',
      testOnInclude: '✅ مفعّل: يطابق قاعدة «مفعّل دائماً» {rule}',
      testOnSite: '✅ مفعّل: الموقع كامل مفعّل',
      testOffExclude: '⛔ موقوف: يطابق قاعدة «ممنوع دائماً» {rule}',
      testOffNone: '— موقوف: ما فيه قاعدة تطابقه والموقع غير مفعّل',
      testUnsaved: '(حسب النص أعلاه، لم يُحفظ بعد)',
      tipsTitle: 'كيف تتم مطابقة الروابط',
      tip1: '* تطابق أي شيء، حتى "/". مثال: ' + LTR('https://example.com/comics/*'),
      tip2: 'وتشتغل في الوسط أيضاً: ' + LTR('https://example.com/node/*/8/simple'),
      tip3: 'يتم تجاهل ' + LTR('http / https') + ' و ' + LTR('"www."') + '.',
      tip4: 'يتم تجاهل ' + LTR('"?…"') + ' و ' + LTR('"#…"') + ' في آخر الرابط، إلا إذا كانت موجودة في قاعدتك.',
      tip5: 'الحروف الكبيرة والصغيرة تُعامل نفس الشيء.',
      applyNote: 'التغييرات تنطبق مباشرة على الصور الجديدة. أعد تحميل التبويبات المفتوحة لتنطبق على الصفحة كاملة.',
    },
  };

  let lang = DEFAULT_LANG;

  function t(key, vars) {
    let s = (STRINGS[lang] && STRINGS[lang][key]) || STRINGS.en[key] || key;
    if (vars) {
      // Wrap values (links, hosts, numbers) in a left-to-right isolate so they
      // don't get scrambled inside Arabic (right-to-left) sentences.
      for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(LTR(v));
    }
    return s;
  }

  function setLang(next) {
    if (STRINGS[next]) lang = next;
    return lang;
  }

  async function loadLang() {
    const stored = await chrome.storage.local.get([LANG_KEY]);
    return setLang(stored[LANG_KEY]);
  }

  // Translate every element marked with data-i18n / data-i18n-label /
  // data-i18n-placeholder and flip the page direction.
  function applyTo(doc) {
    const d = doc || document;
    d.documentElement.lang = lang;
    d.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    d.querySelectorAll('[data-i18n]').forEach((el) => {
      el.textContent = t(el.dataset.i18n);
    });
    d.querySelectorAll('[data-i18n-label]').forEach((el) => {
      const label = t(el.dataset.i18nLabel);
      el.title = label;
      el.setAttribute('aria-label', label);
    });
    d.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
      el.placeholder = t(el.dataset.i18nPlaceholder);
    });
  }

  root.SILI18n = {
    LANG_KEY,
    STRINGS,
    t,
    setLang,
    loadLang,
    applyTo,
    get lang() {
      return lang;
    },
  };
})(globalThis);
