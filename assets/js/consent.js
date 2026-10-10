(function () {
  'use strict';
  const tracking = window.SheilaTracking;
  const notice = document.getElementById('privacy-notice');
  const settings = document.getElementById('privacy-settings');
  if (!tracking || !notice || !settings || notice.dataset.ready) return;
  notice.dataset.ready = 'true';
  const key = 'sheila_privacy_choice_v1';
  const lifetime = 180 * 24 * 60 * 60 * 1000;
  const accept = document.getElementById('privacy-accept');
  const reject = document.getElementById('privacy-reject');
  const signal = document.getElementById('privacy-signal');
  const denied = () => navigator.globalPrivacyControl === true || navigator.doNotTrack === '1' || window.doNotTrack === '1';
  const parseChoice = value => {
    try {
      const choice = JSON.parse(value);
      const age = Date.now() - choice.savedAt;
      return choice.version === 1 && typeof choice.analytics === 'boolean' && Number.isFinite(choice.savedAt) && age >= 0 && age < lifetime ? choice : null;
    } catch (_) { return null; }
  };
  const readChoice = () => { try { return parseChoice(localStorage.getItem(key)); } catch (_) { return null; } };
  const clearAnalyticsCookies = () => {
    const names = ['_ga', '_ga_' + window.SheilaTrackingConfig.ga4Id.slice(2).replace(/-/g, '_')];
    const parts = location.hostname.split('.');
    const domains = ['', ...parts.map((_, i) => '.' + parts.slice(i).join('.'))];
    names.forEach(name => domains.forEach(domain => {
      document.cookie = name + '=; Max-Age=0; path=/; SameSite=Lax' + (domain ? '; domain=' + domain : '');
    }));
  };
  const show = (focus = false) => {
    accept.disabled = denied();
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
    const wasActive = tracking.getStatus().analytics;
    const analytics = choice?.analytics === true && !denied();
    tracking.setConsent({analytics, marketing:false});
    if (!analytics) clearAnalyticsCookies();
    // Unload the Google library after revocation, including automatic listeners.
    if (wasActive && !analytics) location.reload();
  };
  const choose = analytics => {
    const choice = {version:1, analytics:analytics && !denied(), savedAt:Date.now()};
    try { localStorage.setItem(key, JSON.stringify(choice)); } catch (_) { /* Choice still applies to this page. */ }
    apply(choice);
    hide();
  };
  accept.addEventListener('click', () => choose(true));
  reject.addEventListener('click', () => choose(false));
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
