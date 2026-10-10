(function () {
  'use strict';
  if (window.SheilaTracking || !document.querySelector('#hero-title')) return;

  const config = window.SheilaTrackingConfig;
  if (!config || !/^G-[A-Z0-9]+$/.test(config.ga4Id)) return;
  const prefix = 'sheila_implanon_diu_';
  const keys = {lead: prefix + 'lead_id', campaign: prefix + 'campaign', lock: prefix + 'lead_last_sent', metaLock: prefix + 'meta_lead_last_sent', session: prefix + 'session_id', anonymous: prefix + 'anonymous_id'};
  const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'utm_id'];
  const clickKeys = ['gclid', 'gbraid', 'wbraid', 'fbclid', 'msclkid', 'ttclid'];
  const query = new URLSearchParams(location.search);
  const debug = query.get('debug_mode') === 'true';
  const day = 24 * 60 * 60 * 1000;
  const memory = new Map();
  let consent = {analytics: false, marketing: false};
  let campaign = {};
  let gaConfigured = false;
  let metaConfigured = false;
  let gaClientId;
  let gaSessionId;
  let leadId;
  const lastMemorySent = {ga: 0, meta: 0};
  let contextSent = false;
  const visitedScroll = new Set();
  const deniedSignals = () => navigator.globalPrivacyControl === true || navigator.doNotTrack === '1' || window.doNotTrack === '1';
  const log = (message) => { if (debug) console.info('[Sheila Tracking] ' + message); };
  const read = (area, key) => {
    try { return window[area].getItem(key) || memory.get(key) || null; }
    catch (_) { return memory.get(key) || null; }
  };
  const write = (area, key, value) => {
    memory.set(key, value);
    try { window[area].setItem(key, value); } catch (_) { /* In-memory fallback. */ }
  };
  const remove = (area, key) => {
    memory.delete(key);
    try { window[area].removeItem(key); } catch (_) { /* Storage can be disabled. */ }
  };
  const randomCode = (length) => {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    if (window.crypto && window.crypto.getRandomValues) {
      const bytes = new Uint8Array(length * 2);
      while (code.length < length) {
        crypto.getRandomValues(bytes);
        for (const byte of bytes) {
          if (byte < 256 - (256 % alphabet.length)) code += alphabet[byte % alphabet.length];
          if (code.length === length) break;
        }
      }
      return code;
    }
    for (let i = 0; i < length; i++) code += alphabet[Math.floor(Math.random() * alphabet.length)];
    return code;
  };
  const getLeadId = () => {
    if (leadId) return leadId;
    const stored = read('sessionStorage', keys.lead);
    leadId = /^SHA-DI-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{8}$/.test(stored || '') ? stored : 'SHA-DI-' + randomCode(8);
    write('sessionStorage', keys.lead, leadId);
    if (leadId !== stored) log('Lead ID generated');
    return leadId;
  };
  const sessionToken = (key) => {
    let value = read('sessionStorage', key);
    if (!/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{16}$/.test(value || '')) {
      value = randomCode(16);
      write('sessionStorage', key, value);
    }
    return value;
  };
  const getSessionId = () => {
    if (gaSessionId) return String(gaSessionId);
    let value = read('sessionStorage', keys.session);
    if (!/^\d{10,}$/.test(value || '')) {
      value = String(Math.floor(Date.now() / 1000));
      write('sessionStorage', keys.session, value);
    }
    return value;
  };
  const parseJSON = (value) => { try { return JSON.parse(value) || {}; } catch (_) { return {}; } };
  const campaignValue = (key, value) => {
    if (typeof value !== 'string') return '';
    value = value.trim();
    if (!value || value.length > (clickKeys.includes(key) ? 250 : 100)) return '';
    if (clickKeys.includes(key)) return /^[A-Za-z0-9._~-]+$/.test(value) ? value : '';
    if (key === 'utm_id') return /^[A-Za-z0-9_-]+$/.test(value) ? value : '';
    /* Only campaign labels; reject obvious contact details, URLs and control characters. */
    if (/@|https?:|[\u0000-\u001f]|(?:\+?\d[\s().-]*){10,}/.test(value)) return '';
    return /^[\p{L}\p{N} _.,~:/+-]+$/u.test(value) ? value : '';
  };
  const captureCampaign = () => {
    if (!consent.analytics) return;
    const stored = parseJSON(read('sessionStorage', keys.campaign));
    campaign = {};
    [...utmKeys, ...clickKeys].forEach(key => {
      const oldValue = campaignValue(key, stored[key]);
      const newValue = campaignValue(key, query.get(key));
      if (newValue || oldValue) campaign[key] = newValue || oldValue;
    });
    write('sessionStorage', keys.campaign, JSON.stringify(campaign));
    log('Campaign captured');
  };
  const cleanPage = () => location.origin + location.pathname;
  const cleanReferrer = () => {
    try { return document.referrer ? new URL(document.referrer).origin + '/' : ''; }
    catch (_) { return ''; }
  };
  const technicalContext = () => {
    const ua = navigator.userAgent;
    const browser = /Edg\//.test(ua) ? 'Edge' : /Firefox\//.test(ua) ? 'Firefox' : /Chrome\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : 'Other';
    const os = /Android/.test(ua) ? 'Android' : /iPhone|iPad|iPod/.test(ua) ? 'iOS' : /Windows/.test(ua) ? 'Windows' : /Macintosh/.test(ua) ? 'macOS' : /Linux/.test(ua) ? 'Linux' : 'Other';
    let timezone = '';
    try { timezone = Intl.DateTimeFormat().resolvedOptions().timeZone; } catch (_) { /* Optional. */ }
    return {device_type: /Mobi|iPhone|Android/.test(ua) ? 'mobile' : /iPad|Tablet/.test(ua) ? 'tablet' : 'desktop', browser, operating_system: os, screen_width: screen.width, screen_height: screen.height, viewport_width: innerWidth, viewport_height: innerHeight, language: navigator.language, timezone};
  };
  const limitParams = (params) => {
    const result = {};
    Object.entries(params).forEach(([key, value]) => {
      if (Object.keys(result).length >= 25 || !/^[A-Za-z][A-Za-z0-9_]{0,39}$/.test(key)) return;
      if (value === undefined || value === null || value === '' || (typeof value === 'number' && !Number.isFinite(value))) return;
      if (typeof value === 'string') result[key] = value.slice(0, key === 'page_location' ? 1000 : key === 'page_title' ? 300 : key === 'page_referrer' ? 420 : 100);
      else if (typeof value === 'number' || typeof value === 'boolean') result[key] = value;
    });
    return result;
  };
  const gaParams = (specific = {}) => {
    const utms = Object.fromEntries(utmKeys.filter(k => campaign[k]).map(k => [k, campaign[k]]));
    return limitParams({
      send_to: config.ga4Id,
      ...(debug ? {debug_mode: true} : {}),
      ...specific,
      client_name: 'Sheila Antunes', lp_name: 'LP Sheila Antunes', lp_slug: 'sheila_implanon_diu', product_slug: 'implanon_diu',
      page_path: location.pathname, page_location: cleanPage(), page_title: document.title, page_referrer: cleanReferrer(),
      ...utms,
      ...technicalContext()
    });
  };
  const emitGA = (name, params) => {
    if (!consent.analytics || !gaConfigured || deniedSignals()) return false;
    try { window.gtag('event', name, gaParams(params)); return true; }
    catch (_) { return false; }
  };
  const appendScript = (id, src) => {
    if (document.getElementById(id)) return;
    const script = document.createElement('script');
    script.id = id;
    script.async = true;
    script.src = src;
    script.referrerPolicy = 'origin';
    script.onerror = () => log('Platform unavailable; contact navigation remains enabled');
    document.head.appendChild(script);
  };
  const initGA = () => {
    if (gaConfigured || !consent.analytics || deniedSignals()) return;
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
    window.gtag('consent', 'default', {analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied'});
    window.gtag('consent', 'update', {analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied'});
    window['ga-disable-' + config.ga4Id] = false;
    window.gtag('js', new Date());
    const mapping = {utm_id: 'campaign_id', utm_source: 'campaign_source', utm_medium: 'campaign_medium', utm_campaign: 'campaign_name', utm_content: 'campaign_content', utm_term: 'campaign_term'};
    const campaignConfig = Object.fromEntries(Object.entries(mapping).filter(([key]) => campaign[key]).map(([key, value]) => [value, campaign[key]]));
    window.gtag('config', config.ga4Id, {
      ...campaignConfig, send_page_view: true, page_location: cleanPage(), page_referrer: cleanReferrer(), page_title: document.title,
      allow_google_signals: false, allow_ad_personalization_signals: false,
      ...(debug ? {debug_mode: true} : {})
    });
    gaConfigured = true;
    window.gtag('get', config.ga4Id, 'client_id', value => { if (consent.analytics) gaClientId = value; });
    window.gtag('get', config.ga4Id, 'session_id', value => { if (consent.analytics) gaSessionId = value; });
    appendScript('sheila-ga4', 'https://www.googletagmanager.com/gtag/js?id=' + config.ga4Id);
    log('GA4 initialized');
    if (!contextSent) {
      contextSent = true;
      emitGA('tracking_context', {...technicalContext(), anonymous_id: sessionToken(keys.anonymous), session_id: getSessionId()});
    }
  };
  const metaAllowed = () => !!(config.meta && config.meta.enabled === true && config.meta.policyReviewed === true && consent.marketing && !deniedSignals() && config.meta.eventName === 'LEAD_LP');
  const initMeta = () => {
    if (!metaAllowed() || metaConfigured) return;
    /* Standard single Meta queue; never insert a second base for the second ID. */
    if (!window.fbq) {
      const queue = function () { queue.callMethod ? queue.callMethod.apply(queue, arguments) : queue.queue.push(arguments); };
      window.fbq = queue;
      if (!window._fbq) window._fbq = queue;
      queue.push = queue;
      queue.loaded = true;
      queue.version = '2.0';
      queue.queue = [];
    }
    window.fbq('consent', 'grant');
    config.meta.pixelIds.forEach(id => {
      window.fbq('set', 'autoConfig', false, id);
      window.fbq('init', id);
    });
    window.fbq('track', 'PageView');
    metaConfigured = true;
    appendScript('sheila-meta', 'https://connect.facebook.net/en_US/fbevents.js');
    log('Meta Pixels initialized');
  };
  const emitMeta = () => {
    if (!metaAllowed() || !metaConfigured) return false;
    try {
      /* No lead_id, URL, campaign, treatment, location or patient data in custom params. */
      window.fbq('trackCustom', config.meta.eventName, {contact_channel: 'whatsapp'});
      return true;
    } catch (_) { return false; }
  };
  const setConsent = (choice = {}) => {
    const previous = consent;
    consent = {analytics: choice.analytics === true && !deniedSignals(), marketing: choice.marketing === true && !deniedSignals()};
    if (consent.analytics) {
      captureCampaign();
      if (gaConfigured && !previous.analytics) {
        window['ga-disable-' + config.ga4Id] = false;
        window.gtag('consent', 'update', {analytics_storage: 'granted'});
      }
      initGA();
    } else {
      window['ga-disable-' + config.ga4Id] = true;
      if (gaConfigured && previous.analytics) window.gtag('consent', 'update', {analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied'});
      campaign = {};
      gaClientId = gaSessionId = undefined;
      if (previous.analytics || choice.analytics === false) {
        [keys.campaign, keys.session, keys.anonymous, keys.lead].forEach(key => remove('sessionStorage', key));
        leadId = undefined;
      }
    }
    if (consent.marketing) {
      if (metaConfigured && metaAllowed()) window.fbq('consent', 'grant');
      initMeta();
    } else if (metaConfigured) window.fbq('consent', 'revoke');
    log('Consent preferences applied');
  };
  const buttonLocation = (element) => {
    if (element.closest('.whatsapp-float')) return 'floating_whatsapp';
    if (element.closest('header')) return 'header';
    if (element.closest('footer')) return 'footer';
    if (element.closest('.hero')) return 'hero';
    if (element.closest('.comparison')) return 'comparativo_metodos';
    const section = element.closest('section');
    return ({videos: 'videos', metodos: 'consulta_implanon_diu', sobre: 'sobre_sheila', depoimentos: 'depoimentos', consultorio: 'consultorio', faq: 'faq'})[section && section.id] || 'navigation';
  };
  const whatsappLink = (link) => {
    try {
      const url = new URL(link.href, location.href);
      if (url.href === config.whatsappShortLink) return true;
      if (url.hostname === 'wa.me') return url.pathname.replace(/\D/g, '') === config.whatsappPhone;
      return /^(api\.|web\.)?whatsapp\.com$/.test(url.hostname) && url.searchParams.get('phone') === config.whatsappPhone;
    } catch (_) { return false; }
  };
  const prepareWhatsApp = (link) => {
    const url = new URL('https://api.whatsapp.com/send');
    url.searchParams.set('phone', config.whatsappPhone);
    url.searchParams.set('text', 'Olá! Gostaria de mais informações sobre DIU e Implanon, por favor.');
    link.href = url.href;
    return true;
  };
  const trackedClick = (link) => {
    log('WhatsApp clicked');
    if (!consent.analytics && !metaAllowed()) return;
    const now = Date.now();
    const duplicate = (platform, key) => {
      const last = Math.max(Number(read('localStorage', key)) || 0, lastMemorySent[platform]);
      return last > 0 && last <= now && now - last < day;
    };
    const markSent = (platform, key) => {
      lastMemorySent[platform] = now;
      write('localStorage', key, String(now));
      log('Lead conversion sent (request queued; delivery not confirmed)');
    };
    // Separate locks: authorizing one platform later must not suppress its first eligible click.
    if (consent.analytics) {
      const params = {button_text: link.classList.contains('whatsapp-float') ? 'WhatsApp' : link.textContent.replace(/↗/g, '').trim().slice(0, 100), button_location: buttonLocation(link), button_id: link.id || undefined, lead_id: getLeadId(), anonymous_id: sessionToken(keys.anonymous), session_id: getSessionId()};
      if (duplicate('ga', keys.lock)) {
        emitGA('whatsapp_repeat_click', params);
        log('Duplicate conversion prevented');
      } else if (emitGA('lead_lp_implanon_diu', params)) markSent('ga', keys.lock);
    }
    if (metaAllowed()) {
      if (duplicate('meta', keys.metaLock)) log('Duplicate conversion prevented');
      else if (emitMeta()) markSent('meta', keys.metaLock);
    }
  };
  const sendWhatsAppClick = (link) => {
    /* Serialize the 24h check across same-origin tabs where Web Locks is available. */
    if (navigator.locks && navigator.locks.request) {
      navigator.locks.request(keys.lock, () => trackedClick(link)).catch(() => trackedClick(link));
    } else trackedClick(link);
  };
  /* Preserve native anchors, targets, modifier keys and synchronous popup activation. */
  document.addEventListener('click', event => {
    if (!event.isTrusted || event.defaultPrevented || event.button !== 0) return;
    const link = event.target.closest('a[href]');
    if (!link) return;
    if (whatsappLink(link)) {
      try { prepareWhatsApp(link); sendWhatsAppClick(link); } catch (_) { log('Tracking unavailable; original contact link preserved'); }
      return;
    }
    let url;
    try { url = new URL(link.href, location.href); } catch (_) { return; }
    if ((/(^|\.)google\.[a-z.]+$/.test(url.hostname) && url.pathname.startsWith('/maps')) || ['maps.app.goo.gl', 'maps.apple.com'].includes(url.hostname)) {
      emitGA('click_maps', {button_location: 'consultorio'});
    } else if (url.origin === location.origin && url.pathname === location.pathname && url.hash) {
      emitGA('cta_click', {button_location: buttonLocation(link), button_id: link.id || undefined, target_section: url.hash.slice(1).replace(/[^a-z0-9_-]/gi, '').slice(0, 60)});
    }
  });
  document.addEventListener('auxclick', event => {
    if (!event.isTrusted || event.defaultPrevented || event.button !== 1) return;
    const link = event.target.closest('a[href]');
    if (link && whatsappLink(link)) {
      try { prepareWhatsApp(link); sendWhatsAppClick(link); } catch (_) { /* Preserve navigation. */ }
    }
  });
  document.querySelectorAll('#faq details').forEach((details, index) => {
    details.addEventListener('toggle', () => {
      if (!details.open) return;
      if (emitGA('faq_open', {faq_id: 'faq_' + (index + 1), faq_index: index + 1, faq_question_key: 'question_' + String(index + 1).padStart(2, '0'), button_location: 'faq'})) log('FAQ opened');
    });
  });
  let scrollFrame = 0;
  window.addEventListener('scroll', () => {
    if (scrollFrame || !consent.analytics) return;
    scrollFrame = requestAnimationFrame(() => {
      scrollFrame = 0;
      const height = document.documentElement.scrollHeight;
      const percent = Math.min(100, ((scrollY + innerHeight) / height) * 100);
      const milestones = config.scroll90 === 'manual' ? [25, 50, 75, 90] : [25, 50, 75];
      milestones.forEach(value => {
        if (percent >= value && !visitedScroll.has(value)) {
          visitedScroll.add(value);
          emitGA('scroll', {percent_scrolled: value});
        }
      });
    });
  }, {passive: true});
  document.querySelectorAll('#videos video').forEach((video, index) => {
    let started = false;
    let ended = false;
    let maxTime = 0;
    let lastTime = 0;
    let lastTick = 0;
    let seeking = false;
    const milestones = new Set();
    const params = (percent) => ({video_title: 'video_' + String(index + 1).padStart(2, '0'), video_url: new URL(video.getAttribute('src'), location.href).origin + new URL(video.getAttribute('src'), location.href).pathname, video_provider: 'html5', video_current_time: Math.round(video.currentTime), video_duration: Math.round(video.duration || 0), video_percent: percent, visible: (() => {const r = video.getBoundingClientRect(); return !document.hidden && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth;})(), video_index: index + 1});
    const start = () => {
      if (!consent.analytics || started) return;
      started = true;
      if (emitGA('video_start', params(0))) log('Video started');
    };
    const reset = () => {started = false; ended = false; maxTime = 0; milestones.clear();};
    video.addEventListener('play', () => {
      if (ended || (video.currentTime < .5 && maxTime > 1)) reset();
      lastTime = video.currentTime;
      lastTick = performance.now();
      start();
    });
    video.addEventListener('seeking', () => {seeking = true;});
    video.addEventListener('seeked', () => {
      if (video.currentTime < .5 && maxTime > 1) reset();
      lastTime = video.currentTime;
      lastTick = performance.now();
      seeking = false;
    });
    video.addEventListener('timeupdate', () => {
      if (video.paused || seeking || !consent.analytics || !Number.isFinite(video.duration) || !video.duration) return;
      start();
      const time = video.currentTime;
      const elapsed = Math.max(0, (performance.now() - lastTick) / 1000);
      const delta = time - lastTime;
      if (delta >= 0 && delta <= elapsed * video.playbackRate + 1.5) {
        [10, 25, 50, 75].forEach(value => {
          const threshold = video.duration * value / 100;
          if (!milestones.has(value) && lastTime <= threshold && time >= threshold) {
            milestones.add(value);
            if (emitGA('video_progress', params(value))) log('Video progress');
          }
        });
      }
      maxTime = Math.max(maxTime, time);
      lastTime = time;
      lastTick = performance.now();
    });
    video.addEventListener('ended', () => {
      if (!ended && started) emitGA('video_complete', params(100));
      ended = true;
    });
  });
  /* UI emits only technical interaction details; no patient text is inspected. */
  document.addEventListener('sheila:carousel-interaction', event => {
    const detail = event.detail || {};
    if (!['next', 'previous', 'dot_navigation', 'swipe'].includes(detail.type) || !Number.isInteger(detail.index)) return;
    emitGA('testimonial_interaction', {interaction_type: detail.type, testimonial_index: detail.index + 1});
  });
  window.SheilaTracking = Object.freeze({
    setConsent,
    getStatus: () => ({analytics: consent.analytics, marketing: consent.marketing, gaConfigured, metaConfigured, metaPolicyPending: !config.meta.policyReviewed, gaIdentifiersAvailable: !!(gaClientId && gaSessionId)})
  });
  window.addEventListener('sheila:consent', event => setConsent(event.detail || {}));
  setConsent(window.SheilaConsent || {});
  log('Initialized');
})();
