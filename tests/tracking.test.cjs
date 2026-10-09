/* Run with Node + Playwright. Third-party traffic is mocked; no production events. */
const http = require('http');
const fs = require('fs');
const path = require('path');
const assert = require('node:assert/strict');
const {chromium} = require('playwright');
const root = path.resolve(__dirname, '..');
const script = fs.readFileSync(path.join(root, 'assets/js/tracking.js'), 'utf8');
const originalConfig = fs.readFileSync(path.join(root, 'assets/js/tracking-config.js'), 'utf8');
const campaignQuery = '?utm_source=instagram&utm_medium=paid_social&utm_campaign=teste_sheila&fbclid=teste123&debug_mode=true';
const mime = {'.html':'text/html', '.css':'text/css', '.js':'text/javascript', '.webp':'image/webp', '.jpeg':'image/jpeg', '.png':'image/png', '.mp4':'video/mp4'};
const server = http.createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  const file = path.join(root, pathname === '/' ? 'index.html' : pathname);
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404); res.end(); return; }
  res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
  fs.createReadStream(file).pipe(res);
});
let base;
const reports = [];
const eventList = (page, name) => page.evaluate(name => (window.dataLayer || []).map(a => Array.from(a)).filter(a => a[0] === 'event' && (!name || a[1] === name)), name);
const queue = page => page.evaluate(() => (window.dataLayer || []).map(a => Array.from(a)));
const tick = page => page.waitForTimeout(180);
async function setup(browser, options = {}) {
  const context = await browser.newContext({viewport: {width: options.mobile ? 390 : 1366, height: 850}, hasTouch: !!options.mobile, isMobile: !!options.mobile, reducedMotion: 'reduce'});
  const requests = [];
  const outbound = [];
  const errors = [];
  await context.addInitScript(options => {
    if (options.storageBlocked) Object.defineProperty(Storage.prototype, 'setItem', {value() {throw new Error('Storage blocked');}});
    if (options.gpc) Object.defineProperty(navigator, 'globalPrivacyControl', {value: true});
    if (options.consent) window.SheilaConsent = {analytics:true, marketing:true};
  }, options);
  await context.route('**/*', async route => {
    const url = route.request().url();
    if (url.includes('tracking-config.js') && (options.meta || options.manual90)) {
      let config = originalConfig;
      if (options.meta) config = config.replace('enabled: false', 'enabled: true').replace('policyReviewed: false', 'policyReviewed: true');
      if (options.manual90) config = config.replace("scroll90: 'automatic'", "scroll90: 'manual'");
      return route.fulfill({contentType:'text/javascript', body:config});
    }
    if (url.includes('googletagmanager.com/gtag/js') || url.includes('connect.facebook.net')) {
      requests.push(url);
      if (options.blockPlatforms) return route.abort();
      return route.fulfill({contentType:'text/javascript', body:'/* Test double: vendor traffic intentionally disabled. */'});
    }
    if (url.includes('api.whatsapp.com/send')) {
      outbound.push(url);
      return route.fulfill({contentType:'text/html', body:'<!doctype html><title>WhatsApp navigation test</title>'});
    }
    if (!url.startsWith(base)) return route.abort();
    return route.continue();
  });
  const page = await context.newPage();
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(base + '/' + campaignQuery, {waitUntil:'load'});
  await page.waitForFunction(() => !!window.SheilaTracking);
  const clickWA = async (selector = '.hero .button') => {
    const opened = page.waitForEvent('popup');
    await page.locator(selector).click();
    const popup = await opened;
    await popup.waitForLoadState('domcontentloaded');
    const url = popup.url();
    await popup.close();
    await tick(page);
    return new URL(url);
  };
  return {context, page, requests, outbound, errors, clickWA};
}
async function run(browser) {
  const html = fs.readFileSync(path.join(root,'index.html'), 'utf8');
  assert(!/GTM-|AW-|gtm\.js|event['"],\s*['"]conversion/.test(html + script));
  assert.equal((html.match(/src="assets\/js\/tracking\.js/g) || []).length, 1);
  assert.equal((html.match(/href="https:\/\/wa.link\/53n205"/g) || []).length, 9);
  reports.push('Static audit: one module, 9 CTAs, no Google Ads or GTM');

  {
    const t = await setup(browser);
    assert.equal(t.requests.length, 0);
    assert.equal((await queue(t.page)).length, 0);
    const first = await t.clickWA();
    assert.equal(first.searchParams.get('phone'), '557499236477');
    const message = first.searchParams.get('text');
    assert.match(message, /^Olá! Gostaria de mais informações sobre DIU e Implanon, por favor\.\n\nRef: SHA-DI-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{8}$/);
    assert(!/utm_|fbclid|teste123/.test(message));
    const again = await t.clickWA();
    assert.equal(again.searchParams.get('text'), message);
    assert.equal(await t.page.evaluate(() => localStorage.getItem('sheila_implanon_diu_lead_last_sent')), null);
    await t.page.reload({waitUntil:'load'});
    const reloaded = await t.clickWA();
    assert.equal(reloaded.searchParams.get('text'), message);
    assert.equal(t.requests.length, 0);
    assert.equal(t.errors.length, 0);
    reports.push('No consent: no vendor request/event/campaign storage; native WhatsApp opens with stable session reference');
    await t.context.close();
  }
  {
    const t = await setup(browser, {consent:true});
    assert.equal(t.requests.filter(u => u.includes('gtag/js')).length, 1);
    assert.equal(t.requests.filter(u => u.includes('facebook')).length, 0);
    const configCalls = (await queue(t.page)).filter(a => a[0] === 'config');
    assert.equal(configCalls.length, 1);
    assert.equal(configCalls[0][1], 'G-5RG0MN2QET');
    assert.equal(configCalls[0][2].send_page_view, true);
    assert(!configCalls[0][2].page_location.includes('?'));
    assert.equal((await eventList(t.page, 'page_view')).length, 0);
    await t.page.addScriptTag({content:script});
    assert.equal((await queue(t.page)).filter(a => a[0] === 'config').length, 1);
    const saved = await t.page.evaluate(() => JSON.parse(sessionStorage.getItem('sheila_implanon_diu_campaign')));
    assert.equal(saved.utm_source, 'instagram');
    assert.equal(saved.fbclid, 'teste123');
    const selectors = ['.nav-cta','.hero .button','#videos .button','#metodos .button','#sobre .button','#depoimentos .button','#consultorio .button','#faq .button','.whatsapp-float'];
    for (const selector of selectors) await t.clickWA(selector);
    const events = await eventList(t.page, 'lead_lp_implanon_diu');
    assert.equal(events.length, 1);
    assert.equal(events[0][2].button_location, 'header');
    assert.equal(events[0][2].utm_campaign, 'teste_sheila');
    const id = await t.page.evaluate(() => sessionStorage.getItem('sheila_implanon_diu_lead_id'));
    assert.equal(events[0][2].lead_id, id);
    assert.equal((await eventList(t.page, 'whatsapp_repeat_click')).length, 8);
    assert.deepEqual([events[0], ...(await eventList(t.page,'whatsapp_repeat_click'))].map(a=>a[2].button_location), ['header','hero','videos','consulta_implanon_diu','sobre_sheila','depoimentos','consultorio','faq','floating_whatsapp']);
    assert.equal(new Set(t.outbound.map(u => new URL(u).searchParams.get('text'))).size, 1);
    const tabs = await Promise.all([t.context.newPage(), t.context.newPage()]);
    await t.page.evaluate(() => localStorage.removeItem('sheila_implanon_diu_lead_last_sent'));
    await Promise.all(tabs.map(tab => tab.goto(base + '/', {waitUntil:'load'})));
    await Promise.all(tabs.map(async tab => {
      const popup = tab.waitForEvent('popup');
      await tab.locator('.hero .button').click();
      await (await popup).close();
      await tick(tab);
    }));
    assert.equal((await eventList(tabs[0],'lead_lp_implanon_diu')).length + (await eventList(tabs[1],'lead_lp_implanon_diu')).length, 1, 'Concurrent tabs must not duplicate the principal event');
    await Promise.all(tabs.map(tab => tab.close()));
    await t.page.evaluate(() => localStorage.setItem('sheila_implanon_diu_lead_last_sent', String(Date.now()-86400001)));
    await t.page.goto(base + '/?utm_source=&debug_mode=true', {waitUntil:'load'});
    assert.equal(await t.page.evaluate(() => JSON.parse(sessionStorage.getItem('sheila_implanon_diu_campaign')).utm_source), 'instagram');
    await t.clickWA();
    assert.equal((await eventList(t.page, 'lead_lp_implanon_diu')).length, 1, 'A new main event is allowed after 24h');
    assert.equal(await t.page.evaluate(() => sessionStorage.getItem('sheila_implanon_diu_lead_id')), id);
    await t.page.evaluate(() => window.SheilaTracking.setConsent({analytics:false, marketing:false}));
    const eventCount = (await eventList(t.page)).length;
    await t.clickWA();
    assert.equal((await eventList(t.page)).length, eventCount);
    assert.equal(await t.page.evaluate(() => sessionStorage.getItem('sheila_implanon_diu_campaign')), null);
    assert.equal(t.errors.length, 0);
    reports.push('GA4: one config/page_view request, double-load guard, all 9 CTAs, 24h lock including concurrent tabs, repeat clicks, expiry, campaign persistence and revocation');
    await t.context.close();
  }
  {
    const t = await setup(browser, {consent:true, meta:true});
    const metaQueue = () => t.page.evaluate(() => window.fbq.queue.map(a => Array.from(a)));
    assert.equal(t.requests.filter(u => u.includes('fbevents.js')).length, 1);
    let fb = await metaQueue();
    assert.deepEqual(fb.filter(a => a[0] === 'init').map(a => a[1]), ['3112315745824007','301854493012933']);
    assert.equal(fb.filter(a => a[0] === 'track' && a[1] === 'PageView').length, 1);
    await t.clickWA();
    await t.clickWA();
    fb = await metaQueue();
    const custom = fb.filter(a => a[0] === 'trackCustom');
    assert.equal(custom.length, 1);
    assert.equal(custom[0][1], 'contact_click');
    assert.deepEqual(custom[0][2], {contact_channel:'whatsapp'});
    assert(!JSON.stringify(custom).includes('SHA-DI-'));
    await t.page.evaluate(() => window.SheilaTracking.setConsent({analytics:false, marketing:false}));
    assert((await metaQueue()).some(a => a[0] === 'consent' && a[1] === 'revoke'));
    reports.push('Meta test fixture only: one loader, two init IDs, one PageView broadcast, one minimal custom event, repeat blocked, revoke');
    await t.context.close();
  }
  {
    const t = await setup(browser, {consent:true, mobile:true});
    assert.equal((await eventList(t.page, 'lead_lp_implanon_diu')).length, 0);
    await t.page.locator('#faq').scrollIntoViewIfNeeded();
    await t.page.locator('#faq summary').first().click();
    await tick(t.page);
    assert.equal((await eventList(t.page, 'faq_open')).length, 1);
    await t.page.locator('#faq summary').first().click();
    await tick(t.page);
    assert.equal((await eventList(t.page, 'faq_open')).length, 1);
    await t.page.locator('.menu-toggle').click();
    await t.page.locator('#menu a[href="#sobre"]').click();
    assert.equal((await eventList(t.page, 'cta_click')).length, 1);
    await t.page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
    await tick(t.page);
    const scrolls = await eventList(t.page, 'scroll');
    assert.deepEqual(scrolls.map(a => a[2].percent_scrolled).sort((a,b)=>a-b), [25,50,75]);
    await t.page.evaluate(() => { scrollTo(0,0); });
    await tick(t.page);
    await t.page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
    await tick(t.page);
    assert.equal((await eventList(t.page, 'scroll')).length, 3);
    await t.page.locator('#depoimentos').scrollIntoViewIfNeeded();
    assert.equal((await eventList(t.page, 'testimonial_interaction')).length, 0);
    await t.page.locator('.carousel-dots button').nth(2).click();
    await tick(t.page);
    const dot = (await eventList(t.page,'testimonial_interaction'))[0][2];
    assert.equal(dot.interaction_type,'dot_navigation');
    assert.equal(dot.testimonial_index,3);
    const cdp = await t.context.newCDPSession(t.page);
    const card = await t.page.locator('.testimonial-card.active').boundingBox();
    const y = card.y + card.height/2;
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:320,y}]});
    for (let i=1;i<=12;i++) {
      await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:320-i*23,y}]});
      await t.page.waitForTimeout(25);
    }
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    await t.page.waitForTimeout(900);
    assert.equal((await eventList(t.page,'testimonial_interaction')).filter(a=>a[2].interaction_type==='swipe').length,1);
    assert.equal((await eventList(t.page,'lead_lp_implanon_diu')).length,0);
    await t.clickWA('.whatsapp-float');
    assert.equal((await eventList(t.page,'lead_lp_implanon_diu')).length,1);
    assert.equal(t.errors.length,0);
    reports.push('Mobile: FAQ open-only, navigation, once-only 25/50/75 scroll, dots + real touch swipe, no engagement conversions');
    await t.context.close();
  }
  {
    const t = await setup(browser,{consent:true,manual90:true});
    await t.page.evaluate(() => scrollTo(0,document.documentElement.scrollHeight));
    await tick(t.page);
    assert.equal((await eventList(t.page,'scroll')).filter(a=>a[2].percent_scrolled===90).length,1);
    await t.page.evaluate(() => {
      document.querySelectorAll('#videos video').forEach(video => {
        let time=0;
        Object.defineProperty(video,'duration',{get:()=>100,configurable:true});
        Object.defineProperty(video,'currentTime',{get:()=>time,configurable:true});
        Object.defineProperty(video,'paused',{get:()=>false,configurable:true});
        video.dispatchEvent(new Event('play'));
        video.dispatchEvent(new Event('play'));
        for(time=1;time<=100;time++) video.dispatchEvent(new Event('timeupdate'));
        time=100;
        video.dispatchEvent(new Event('ended'));
        video.dispatchEvent(new Event('ended'));
      });
    });
    assert.equal((await eventList(t.page,'video_start')).length,4);
    assert.equal((await eventList(t.page,'video_progress')).length,16);
    assert.equal((await eventList(t.page,'video_complete')).length,4);
    for(let i=1;i<=4;i++) assert.deepEqual((await eventList(t.page,'video_progress')).filter(a=>a[2].video_index===i).map(a=>a[2].video_percent),[10,25,50,75]);
    await t.page.evaluate(() => {
      const video=document.querySelector('video');
      Object.defineProperty(video,'currentTime',{get:()=>0,configurable:true});
      video.dispatchEvent(new Event('play'));
      Object.defineProperty(video,'currentTime',{get:()=>80,configurable:true});
      video.dispatchEvent(new Event('seeking'));
      video.dispatchEvent(new Event('seeked'));
      video.dispatchEvent(new Event('timeupdate'));
    });
    assert.equal((await eventList(t.page,'video_start')).length,5);
    assert.equal((await eventList(t.page,'video_progress')).length,16,'Seeking must not count skipped milestones');
    /* Fixture link only: production contains a cross-origin iframe, no Maps anchor. */
    await t.page.evaluate(()=>{
      const a=document.createElement('a');a.id='test-map';a.href='https://maps.google.com/maps?q=office';a.target='_blank';a.textContent='Map fixture';document.querySelector('#consultorio').append(a);
    });
    const popup=t.page.waitForEvent('popup');
    await t.page.locator('#test-map').click();
    await (await popup).close();
    assert.equal((await eventList(t.page,'click_maps')).length,1);
    const all = await eventList(t.page);
    all.forEach(([,name,params])=>{
      assert(name.length<=40);
      assert(Object.keys(params).length<=25,name);
      assert(!('fbclid' in params || '_fbp' in params || '_fbc' in params));
      assert(!JSON.stringify(params).includes('557499236477'));
      assert(!JSON.stringify(params).includes('teste123'));
    });
    assert.equal(t.errors.length,0);
    reports.push('Video state-machine fixtures: four players, start/progress/end once, replay, seek protection; manual 90; Maps link fixture; GA4 payload limits');
    await t.context.close();
  }
  for (const options of [{consent:true,gpc:true},{consent:true,storageBlocked:true,blockPlatforms:true}]) {
    const t=await setup(browser,options);
    const url=await t.clickWA();
    const again=await t.clickWA();
    assert.equal(url.searchParams.get('text'),again.searchParams.get('text'));
    if(options.gpc){assert.equal(t.requests.length,0);assert.equal((await eventList(t.page)).length,0);}
    else {assert.equal((await eventList(t.page,'lead_lp_implanon_diu')).length,1);assert.equal((await eventList(t.page,'whatsapp_repeat_click')).length,1);}
    assert.equal(t.errors.length,0);
    await t.context.close();
  }
  reports.push('GPC veto, blocked storage and unavailable analytics: contact navigation preserved, in-memory reference/duplicate fallback');
}
(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  base='http://127.0.0.1:'+server.address().port;
  const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'});
  try{await run(browser); console.log(JSON.stringify({status:'passed',scope:'local browser + intercepted vendors; not account/server receipt',checks:reports},null,2));}
  finally{await browser.close();server.close();}
})().catch(error=>{console.error(error);server.close();process.exitCode=1;});
