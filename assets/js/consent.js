(function () {
  'use strict';
  const tracking = window.SheilaTracking;
  const notice = document.getElementById('privacy-notice');
  const settings = document.getElementById('privacy-settings');
  if (!tracking || !notice || !settings || notice.dataset.ready) return;
  notice.dataset.ready = 'true';
  // New purpose requires a new choice; never reinterpret an analytics-only acceptance as marketing consent.
  const key = 'sheila_privacy_choice_v2';
  const lifetime = 180 * 24 * 60 * 60 * 1000;
  const accept = document.getElementById('privacy-accept');
  const reject = document.getElementById('privacy-reject');
  const save = document.getElementById('privacy-save');
  const analyticsOption = document.getElementById('privacy-analytics');
  const marketingOption = document.getElementById('privacy-marketing');
  const signal = document.getElementById('privacy-signal');
  const denied = () => navigator.globalPrivacyControl === true || navigator.doNotTrack === '1' || window.doNotTrack === '1';
  const parseChoice = value => {
    try {
      const choice = JSON.parse(value);
      const age = Date.now() - choice.savedAt;
      return choice.version === 2 && typeof choice.analytics === 'boolean' && typeof choice.marketing === 'boolean' && Number.isFinite(choice.savedAt) && age >= 0 && age < lifetime ? choice : null;
    } catch (_) { return null; }
  };
  const readChoice = () => { try { return parseChoice(localStorage.getItem(key)); } catch (_) { return null; } };
  const clearCookies = names => {
    const parts = location.hostname.split('.');
    const domains = ['', ...parts.map((_, i) => '.' + parts.slice(i).join('.'))];
    names.forEach(name => domains.forEach(domain => {
      document.cookie = name + '=; Max-Age=0; path=/; SameSite=Lax' + (domain ? '; domain=' + domain : '');
    }));
  };
  const show = (focus = false) => {
    const current = tracking.getStatus();
    accept.disabled = denied();
    analyticsOption.disabled = marketingOption.disabled = denied();
    analyticsOption.checked = current.analytics && !denied();
    marketingOption.checked = current.marketing && !denied();
    signal.hidden = !denied();
    notice.hidden = false;
    settings.setAttribute('aria-expanded', 'true');
    if (focus) (accept.disabled ? reject : accept).focus();
  };
  const hide = () => {
    const hadFocus = notice.contains(document.activeElement);
    notice.hidden = true;
    settings.setAttribute('aria-expanded', 'false');
    if (hadFocus) settings.focus({preventScroll:true});
  };
  const apply = choice => {
    const previous = tracking.getStatus();
    const analytics = choice?.analytics === true && !denied();
    const marketing = choice?.marketing === true && !denied();
    tracking.setConsent({analytics, marketing});
    if (!analytics) clearCookies(['_ga', '_ga_' + window.SheilaTrackingConfig.ga4Id.slice(2).replace(/-/g, '_')]);
    if (!marketing) clearCookies(['_fbp', '_fbc']);
    // Unload vendor libraries after revocation, including automatic listeners.
    if ((previous.analytics && !analytics) || (previous.marketing && !marketing)) location.reload();
  };
  const choose = (analytics, marketing) => {
    const choice = {version:2, analytics:analytics && !denied(), marketing:marketing && !denied(), savedAt:Date.now()};
    try { localStorage.setItem(key, JSON.stringify(choice)); } catch (_) { /* Choice still applies to this page. */ }
    apply(choice);
    hide();
  };
  accept.addEventListener('click', () => choose(true, true));
  reject.addEventListener('click', () => choose(false, false));
  save.addEventListener('click', () => choose(analyticsOption.checked, marketingOption.checked));
  settings.hidden = false;
  settings.addEventListener('click', () => show(true));
  window.addEventListener('storage', event => {
    if (event.storageArea !== localStorage || (event.key !== key && event.key !== null)) return;
    const choice = readChoice();
    apply(choice);
    if (choice) hide(); else show();
  });
  const saved = readChoice();
  if (saved) { apply(saved); hide(); }
  else if (window.SheilaConsent) { hide(); } // Preserve an explicitly supplied external CMP integration.
  else { apply(null); show(); }
})();
