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
      synced: 'Updated from the popup ✓',
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
      stateOn: "Running on this page",
      stateOff: "Not running on this page",
      stateBlocked: "Blocked on this page",
      reasonInclude: "Because of the rule {rule}",
      reasonExclude: "By the rule {rule}",
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
      addTitle: "Add a rule",
      addHint: "Paste a link. Use * to mean \"anything\". Adding a link to one list removes it from the other.",
      addPlaceholder: "https://example.com/comics/*",
      searchSites: "Search sites",
      otherSites: "Other (wildcard sites)",
      noRules: "No rules yet. Add one above, or use the buttons in the popup.",
      noMatchSites: "No sites match your search.",
      listEmpty: "None",
      wholeSiteRow: "(whole site)",
      homePage: "(home page)",
      deleteRule: "Delete rule {rule}",
      addedToast: "Added ✓",
      removedToast: "Removed ✓",
      testOffNoneC: "— Off: no rule matches this link",
      pillOn: "Always on",
      pillOff: "Never on",
      addAs: "Rule type",
      addBtn: "Add",
      emptyTab: "No rules in this list yet.",
      siteRules: "{site}: {n} rules",
      sitesHint2: "Open a site to see its links. Use + Add next to Always on or Never on to add a link for that site. Use * to mean \"anything\".",
      addSitePh: "example.com",
      addSiteBtn: "+ Add site",
      badSite: "Enter a site name, like example.com",
      secAdd: "+ Add",
      addRuleTo: "Add a link to {list} for {site}",
      cancel: "Cancel",
      needPath: "Type the rest of the link, for example /comics/*",
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
      synced: 'تم التحديث من نافذة الإضافة ✓',
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
      addTitle: "أضف قاعدة",
      addHint: "الصق رابطاً. استخدم * بمعنى «أي شيء». إضافة رابط لقائمة تشيله من القائمة الثانية.",
      addPlaceholder: "https://example.com/comics/*",
      searchSites: "ابحث في المواقع",
      otherSites: "أخرى (مواقع بنجمة)",
      noRules: "ما فيه قواعد بعد. أضف وحدة من فوق، أو استخدم أزرار نافذة الإضافة.",
      noMatchSites: "ما فيه مواقع تطابق بحثك.",
      listEmpty: "لا يوجد",
      wholeSiteRow: "(الموقع كامل)",
      homePage: "(الصفحة الرئيسية)",
      deleteRule: "حذف القاعدة {rule}",
      addedToast: "تمت الإضافة ✓",
      removedToast: "تم الحذف ✓",
      testOffNoneC: "— موقوف: ما فيه قاعدة تطابق هذا الرابط",
      pillOn: "مفعّل دائماً",
      pillOff: "ممنوع دائماً",
      addAs: "نوع القاعدة",
      addBtn: "أضف",
      emptyTab: "ما فيه قواعد في هذي القائمة بعد.",
      siteRules: "{site}: {n} قاعدة",
      sitesHint2: "افتح الموقع عشان تشوف روابطه. اضغط «+ أضف» جنب «مفعّل دائماً» أو «ممنوع دائماً» لإضافة رابط لهذا الموقع. استخدم * بمعنى «أي شيء».",
      addSitePh: "example.com",
      addSiteBtn: "+ أضف موقع",
      badSite: "اكتب اسم موقع، مثل " + LTR('example.com'),
      secAdd: "+ أضف",
      addRuleTo: "أضف رابط إلى «{list}» لـ {site}",
      cancel: "إلغاء",
      needPath: "أكمل الرابط، مثلاً " + LTR('/comics/*'),
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
