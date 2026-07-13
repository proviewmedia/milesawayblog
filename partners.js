/* ============================================================
   MILES AWAY BLOG — PARTNER DATABASE + RENDERER
   ------------------------------------------------------------
   Source of truth for every affiliate/partner placement. Links are real
   Impact Radius tracking links (publisher 5096957), open in a new tab
   with rel="sponsored". Creatives are self-hosted in /images/partners/
   (ad-blocker-safe, fast, responsive). Named "partner" (not "ad") on
   purpose — do NOT rename to ad/ads/banner/sponsor.

   PLACEMENTS:
     <div class="partner-slot" data-partner="nordvpn"></div>          in-content: pitch + banner
     <div class="partner-slot" data-partner="nordvpn" data-sky></div> sidebar: pitch + tall skyscraper
     <div class="partner-slot"></div>                                 rotates (deduped by advertiser)

   Each entry: pitch (bold one-liner), url (tracking link), a banner
   {img,w,h} and/or a skyscraper {sky,skyW,skyH}, alt. Text-only entries
   use {label,tag,title,body,cta,url}.
   ============================================================ */

(function () {
  var IMG = "images/partners/";

  var P = {
    nordvpn:        { pitch:"Hotel and airport Wi‑Fi is a gamble — NordVPN keeps your connection private wherever you land.", url:"https://nordvpn.sjv.io/c/5096957/976012/7452", img:"nordvpn.jpg", w:1200, h:628, sky:"nordvpn-sky.jpg", skyW:260, skyH:450, alt:"NordVPN — 68% off the 2-year deal" },
    airhub:         { pitch:"Land with data already working — AirHub travel eSIMs skip the roaming fees and the SIM hunt.", url:"https://gighubsystemsinc.sjv.io/c/5096957/1790409/21179", img:"airhub.png", w:524, h:240, alt:"AirHub travel eSIM data plans" },
    "vegas-hotels": { pitch:"Book your Strip stay for less — Vegas.com surfaces the best hotel prices in one place.", url:"https://vegas.vdvm.net/c/5096957/271012/4221", img:"vegas-hotels.gif", w:728, h:90, alt:"Vegas.com — best Las Vegas hotel prices" },
    "vegas-shows":  { pitch:"The shows are half the reason to go — grab Vegas tickets for up to 40% off.", url:"https://vegas.vdvm.net/c/5096957/271413/4221", img:"vegas-shows.gif", w:468, h:60, alt:"Save up to 40% on Las Vegas show tickets" },
    "grand-canyon": { pitch:"One of the world's great wonders is a day trip from Vegas — go see the Grand Canyon.", url:"https://vegas.vdvm.net/c/5096957/491743/4221", img:"grand-canyon.jpg", w:300, h:250, alt:"Maverick Grand Canyon tours from Las Vegas" },
    alltrails:      { pitch:"I never hit a trail without AllTrails — offline maps and wrong‑turn alerts keep you on track.", url:"https://alltrails.pxf.io/c/5096957/1908284/22353", img:"alltrails.jpg", w:1400, h:350, alt:"AllTrails — hiking, biking & trail maps" },
    backcountry:    { pitch:"Gear that survives real trips, for less — new customers get 15% off at Backcountry.", url:"https://backcountry.tnu8.net/c/5096957/2129785/5311", img:"backcountry.jpg", w:728, h:90, sky:"backcountry-sky.jpg", skyW:300, skyH:600, alt:"Backcountry — outdoor gear and apparel" },
    budget:         { pitch:"Your road‑trip wheels shouldn't break the bank — grab a deal from Budget.", url:"https://budget.pxf.io/c/5096957/1877222/20801", img:"budget.png", w:728, h:90, alt:"Budget car rental deals" },
    babbel:         { pitch:"A few weeks with Babbel and you'll actually talk to locals — not just point at menus.", url:"https://babbel.sjv.io/c/5096957/1069912/13589", img:"babbel.png", w:300, h:250, sky:"babbel-sky.png", skyW:600, skyH:1200, alt:"Babbel — learn a new language" },
    glo:            { pitch:"Keep your practice on the road — Glo has yoga and meditation you can do from any hotel room.", url:"https://glodigitalinc.pxf.io/c/5096957/2220231/26739", img:"glo.jpg", w:1200, h:628, alt:"Glo — yoga, meditation & Pilates" },
    fabletics:      { pitch:"Travel‑ready activewear that packs light — new VIPs get 80% off the first order.", url:"https://fableticsperformance.pxf.io/c/5096957/2814340/32253", img:"fabletics.png", w:1200, h:675, alt:"Fabletics — activewear, 80% off first order" },
    airalo:         { pitch:"Skip roaming fees — Airalo gives you instant mobile data in 200+ countries.", url:"https://airalo.pxf.io/c/5096957/1349058/15608", alt:"Airalo — travel eSIMs", label:"Partner", tag:"eSIM", title:"Airalo — Travel eSIMs", body:"Skip roaming fees. Instant mobile data in 200+ countries the moment you land.", cta:"Get an eSIM" },
    "vegas-caesars":{ label:"Partner", tag:"Las Vegas", title:"Caesars Hotels", body:"Stay on the Las Vegas Strip for less — rooms from $29.", cta:"Book a Room", url:"https://vegas.vdvm.net/c/5096957/410014/4221" }
  };
  var ROTATE = ["nordvpn","vegas-hotels","backcountry","alltrails","babbel","budget","glo","airhub","vegas-shows","fabletics","grand-canyon"];

  window.MA_PARTNERS = P;
  var prefix = (location.pathname.indexOf('/posts/') > -1) ? '../' : '';

  var css =
    '.partner-slot{display:block}' +
    '.mp-spon{display:block;font-size:9px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#c2beb5;margin-bottom:7px;font-family:"DM Sans",sans-serif;}' +
    // in-content recommendation block: pitch beside banner
    '.mp-rec{display:flex;align-items:center;gap:26px;margin:38px 0;border-top:2.5px solid #0D0D0D;border-bottom:2.5px solid #0D0D0D;padding:22px 4px;}' +
    '.mp-rec.mp-rec--right{flex-direction:row-reverse;}' +
    '.mp-rec-pitch{flex:1 1 46%;min-width:0;font-family:"Fraunces",serif;font-weight:700;font-size:20px;line-height:1.32;color:#0D0D0D;}' +
    '.mp-rec-pitch a{color:inherit;text-decoration:none;font-weight:inherit;}.mp-rec-pitch a:hover{color:#E8421A;}' +
    '.mp-rec-media{flex-shrink:0;max-width:56%;}' +
    '.mp-rec-media a{display:inline-block;width:100%;line-height:0;border:0;text-decoration:none;}' +
    '.mp-rec-media img{width:100%;height:auto;display:block;border:0;}' +
    '@media(max-width:640px){.mp-rec,.mp-rec.mp-rec--right{flex-direction:column;align-items:stretch;gap:14px;}.mp-rec-pitch{font-size:18px;}.mp-rec-media{max-width:100%;text-align:center;}.mp-rec-media a{max-width:100%!important;}}' +
    // sidebar skyscraper
    '.mp-sky{margin:0 0 8px;text-align:center;}' +
    '.mp-sky-pitch{font-family:"Fraunces",serif;font-weight:700;font-size:15px;line-height:1.3;color:#0D0D0D;margin-bottom:12px;text-align:left;}' +
    '.mp-sky-pitch a{color:inherit;text-decoration:none;font-weight:inherit;}.mp-sky-pitch a:hover{color:#E8421A;}' +
    '.mp-sky a{display:inline-block;width:100%;max-width:300px;line-height:0;border:0;}' +
    '.mp-sky img{width:100%;height:auto;display:block;border:0;}' +
    // text fallback box
    '.mp-unit{border:2.5px solid #0D0D0D;background:#F7F4EF;display:flex;align-items:center;gap:20px;padding:18px 22px;font-family:"DM Sans",sans-serif;margin:34px 0;}' +
    '.mp-unit-label{font-size:9px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#999;border:1px solid #ccc;padding:3px 8px;flex-shrink:0;align-self:flex-start;}' +
    '.mp-unit-body{flex:1;min-width:0;}.mp-unit-chip{display:inline-block;font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#E8421A;margin-bottom:5px;}' +
    '.mp-unit-body strong{font-family:"Fraunces",serif;font-size:16px;line-height:1.2;display:block;margin-bottom:4px;color:#0D0D0D;}.mp-unit-body p{font-size:13px;color:#555;line-height:1.5;margin:0;}' +
    '.mp-unit-text{display:block;text-decoration:none;color:inherit;}.mp-unit-text:hover strong{color:#E8421A;}' +
    '.mp-unit-cta{font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#F7F4EF;background:#E8421A;padding:11px 18px;text-decoration:none;white-space:nowrap;flex-shrink:0;}.mp-unit-cta:hover{background:#0D0D0D;}' +
    '@media(max-width:600px){.mp-unit{flex-wrap:wrap;gap:12px;}.mp-unit-cta{width:100%;text-align:center;}}';
  var style = document.createElement('style');
  style.setAttribute('data-mp', '');
  style.appendChild(document.createTextNode(css));
  document.head.appendChild(style);

  function recHTML(p, idx) {
    var cap = Math.min(p.w, 400);
    var side = (idx % 2 === 1) ? ' mp-rec--right' : '';
    return '<div class="mp-rec' + side + '">' +
        '<div class="mp-rec-pitch"><a href="' + p.url + '" target="_blank" rel="sponsored noopener"><strong>' + p.pitch + '</strong></a></div>' +
        '<div class="mp-rec-media"><span class="mp-spon">Sponsored</span>' +
          '<a href="' + p.url + '" target="_blank" rel="sponsored noopener" style="max-width:' + cap + 'px;">' +
            '<img src="' + prefix + IMG + p.img + '" width="' + p.w + '" height="' + p.h + '" loading="lazy" style="aspect-ratio:' + p.w + '/' + p.h + '" alt="' + (p.alt || '') + '"></a></div>' +
      '</div>';
  }
  function skyHTML(p) {
    return '<div class="mp-sky"><div class="mp-sky-pitch"><a href="' + p.url + '" target="_blank" rel="sponsored noopener">' + (p.pitch || '') + '</a></div><span class="mp-spon">Sponsored</span>' +
        '<a href="' + p.url + '" target="_blank" rel="sponsored noopener">' +
          '<img src="' + prefix + IMG + p.sky + '"' + (p.skyW ? ' width="' + p.skyW + '" height="' + p.skyH + '" style="aspect-ratio:' + p.skyW + '/' + p.skyH + '"' : '') + ' loading="lazy" alt="' + (p.alt || '') + '"></a></div>';
  }
  function textHTML(p) {
    var chip = p.tag ? '<span class="mp-unit-chip">' + p.tag + '</span>' : '';
    return '<div class="mp-unit"><span class="mp-unit-label">' + (p.label || 'Sponsored') + '</span>' +
        '<div class="mp-unit-body">' + chip + '<a class="mp-unit-text" href="' + p.url + '" target="_blank" rel="sponsored noopener"><strong>' + p.title + '</strong><p>' + p.body + '</p></a></div>' +
        '<a class="mp-unit-cta" href="' + p.url + '" target="_blank" rel="sponsored noopener">' + (p.cta || 'Learn More') + ' →</a></div>';
  }

  function brandOf(key) { return (key.indexOf('vegas') === 0 || key === 'grand-canyon') ? 'vegas' : key; }

  function fill() {
    var slots = document.querySelectorAll('.partner-slot');
    var used = {}, r = 0, bIdx = 0;
    function pickUnused(needSky) {
      for (var t = 0; t < ROTATE.length; t++) {
        var k = ROTATE[(r + t) % ROTATE.length];
        if (!used[brandOf(k)] && (!needSky || P[k].sky)) { r = r + t + 1; return k; }
      }
      return null;
    }
    for (var i = 0; i < slots.length; i++) {
      var isSky = slots[i].hasAttribute('data-sky');
      var forced = slots[i].hasAttribute('data-force'); // bypass the per-advertiser dedupe (e.g. a Vegas post showing several Vegas.com offers)
      var key = slots[i].getAttribute('data-partner');
      if (!(forced && key && P[key])) {
        var ok = key && P[key] && !used[brandOf(key)] && (!isSky || P[key].sky);
        if (!ok) key = pickUnused(isSky);
      }
      if (!key) continue;
      used[brandOf(key)] = 1;
      var p = P[key];
      if (isSky && p.sky) slots[i].innerHTML = skyHTML(p);
      else if (p.img) slots[i].innerHTML = recHTML(p, bIdx++);
      else slots[i].innerHTML = textHTML(p);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fill);
  } else { fill(); }
})();
