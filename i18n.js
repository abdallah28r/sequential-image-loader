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
      unsupported: "This page can't use the extension (only http and https pages can).",
      unsupportedHost: 'Not supported',
      concurrency: 'Images at a time',
      concurrencyOne: '1 (fully sequential)',
      hint: 'Changing a setting reloads the page automatically.',
      progress: '{done} / {total} images',
      settings: 'Settings',
      language: 'Language',

      // Options page
      optTitle: 'Advanced settings',
      testTitle: 'Test a link',
      testPlaceholder: 'Paste a link to see what happens on it',
      testOnInclude: 'On: matches the "Always on" rule {rule}',
      testOffExclude: 'Off: matches the "Never on" rule {rule}',
      tipsTitle: 'How links are matched',
      tip1: '* matches anything, including "/". Example: https://example.com/gallery/*',
      tip2: 'It also works in the middle: https://example.com/albums/*/photos',
      tip3: 'http / https and "www." are ignored.',
      tip4: '"?…" and "#…" at the end of a link are ignored, unless your rule contains them.',
      tip5: 'Upper and lower case letters are treated the same.',
      stateOn: "Running on this page",
      stateOff: "Not running on this page",
      stateBlocked: "Blocked on this page",
      reasonInclude: "Because of the rule {rule}",
      reasonExclude: "Because of the rule {rule}",
      reasonNoneC: "Use a button below to turn it on.",
      actSite: "Turn on for the whole site",
      actPage: "Turn on for this page only",
      actBlock: "Never on this page",
      matchTitle: "Rules affecting this page",
      remove: "Remove",
      removeRule: "Remove rule {rule}",
      yourRules: "Your rules",
      rulesSummary: "{on} always on · {off} never on",
      advancedAll: "Manage all rules",
      openAdvanced: "Open Advanced settings",
      actUnblock: "Unblock this page",
      otherSites: "Other (wildcard sites)",
      noRules: "No rules yet. Add one above, or use the buttons in the popup.",
      listEmpty: "None",
      addedToast: "Added ✓",
      removedToast: "Removed ✓",
      testOffNoneC: "Off: no rule matches this link",
      pillOn: "Always on",
      pillOff: "Never on",
      addBtn: "Add",
      siteRules: "{site}: {n} rules",
      siteRules1: "{site}: 1 rule",
      themeTitle: "Appearance",
      themeLight: "Light",
      themeDark: "Dark",
      themeAuto: "Auto",
      sitesHint2: "Open a site to see its links. Use + Add next to Always on or Never on to add a link for that site. Use * to mean \"anything\".",
      addSitePh: "example.com",
      addSiteBtn: "+ Add site",
      badSite: "Enter a site name, like example.com",
      secAdd: "+ Add",
      addRuleTo: "Add a link to {list} for {site}",
      cancel: "Cancel",
      needPath: "Type the rest of the link, for example /gallery/*",
      applyNote: 'Changes apply right away to newly added images. Reload open tabs to apply them to the whole page.',
    },
    ar: {
      // Popup
      title: 'تحميل متسلسل للصور',
      unsupported: 'الإضافة ما تشتغل على هذه الصفحة (تشتغل فقط على صفحات http و https).',
      unsupportedHost: 'غير مدعوم',
      concurrency: 'عدد الصور المتزامنة',
      concurrencyOne: '1 (متسلسل بالكامل)',
      hint: 'تغيير أي إعداد يعيد تحميل الصفحة تلقائياً.',
      progress: '{done} / {total} صورة',
      settings: 'الإعدادات',
      language: 'اللغة',

      // Options page
      optTitle: 'الإعدادات المتقدمة',
      testTitle: 'جرّب رابط',
      testPlaceholder: 'الصق رابطاً لتعرف وش يصير فيه',
      testOnInclude: 'مفعّل: يطابق قاعدة «مفعّل دائماً» {rule}',
      testOffExclude: 'موقوف: يطابق قاعدة «ممنوع دائماً» {rule}',
      tipsTitle: 'كيف تتم مطابقة الروابط',
      tip1: '* تطابق أي شيء، حتى "/". مثال: ' + LTR('https://example.com/gallery/*'),
      tip2: 'وتشتغل في الوسط أيضاً: ' + LTR('https://example.com/albums/*/photos'),
      tip3: 'يتم تجاهل ' + LTR('http / https') + ' و ' + LTR('"www."') + '.',
      tip4: 'يتم تجاهل ' + LTR('"?…"') + ' و ' + LTR('"#…"') + ' في آخر الرابط، إلا إذا كانت موجودة في قاعدتك.',
      tip5: 'الحروف الكبيرة والصغيرة تُعامل نفس الشيء.',
      stateOn: "شغّال على هذه الصفحة",
      stateOff: "غير شغّال على هذه الصفحة",
      stateBlocked: "ممنوع على هذه الصفحة",
      reasonInclude: "بسبب القاعدة {rule}",
      reasonExclude: "بسبب القاعدة {rule}",
      reasonNoneC: "استخدم أحد الأزرار تحت لتشغيله.",
      actSite: "تشغيل على كامل الموقع",
      actPage: "تشغيل على هذه الصفحة فقط",
      actBlock: "منع دائماً على هذه الصفحة",
      matchTitle: "القواعد اللي تأثر على هذه الصفحة",
      remove: "حذف",
      removeRule: "حذف القاعدة {rule}",
      yourRules: "قواعدك",
      rulesSummary: "{on} تفعيل دائماً · {off} منع دائماً",
      advancedAll: "إدارة كل القواعد",
      openAdvanced: "افتح الإعدادات المتقدمة",
      actUnblock: "إلغاء المنع عن هذه الصفحة",
      otherSites: "أخرى (مواقع بنجمة)",
      noRules: "ما فيه قواعد بعد. أضف وحدة من فوق، أو استخدم أزرار نافذة الإضافة.",
      listEmpty: "لا يوجد",
      addedToast: "تمت الإضافة ✓",
      removedToast: "تم الحذف ✓",
      testOffNoneC: "موقوف: ما فيه قاعدة تطابق هذا الرابط",
      pillOn: "مفعّل دائماً",
      pillOff: "ممنوع دائماً",
      addBtn: "أضف",
      siteRules: "{site}: {n} قاعدة",
      siteRules1: "{site}: قاعدة واحدة",
      themeTitle: "المظهر",
      themeLight: "فاتح",
      themeDark: "داكن",
      themeAuto: "تلقائي",
      sitesHint2: "افتح الموقع عشان تشوف روابطه. اضغط «+ أضف» جنب «مفعّل دائماً» أو «ممنوع دائماً» لإضافة رابط لهذا الموقع. استخدم * بمعنى «أي شيء».",
      addSitePh: "example.com",
      addSiteBtn: "+ أضف موقع",
      badSite: "اكتب اسم موقع، مثل " + LTR('example.com'),
      secAdd: "+ أضف",
      addRuleTo: "أضف رابط إلى «{list}» لـ {site}",
      cancel: "إلغاء",
      needPath: "أكمل الرابط، مثلاً " + LTR('/gallery/*'),
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
