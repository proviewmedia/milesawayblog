/* ============================================================
   MILES AWAY BLOG — PARTNER DATABASE + RENDERER
   ------------------------------------------------------------
   Source of truth for every affiliate/partner placement. All links
   are real Impact Radius tracking links (publisher 5096957) and open
   in a new tab with rel="sponsored". Banner creatives are self-hosted
   in /images/partners/ (so ad blockers can't hide them and they load
   fast + responsive). Named "partner" (not "ad") on purpose so ad
   blockers don't strip them — do NOT rename to ad/ads/banner/sponsor.

   PLACEMENTS:
     <div class="partner-slot" data-partner="nordvpn"></div>  -> that partner
     <div class="partner-slot"></div>                          -> rotates

   TO EDIT: change an entry in P below. Banner entries use
   {img,w,h,url,alt}; text entries use {label,tag,title,body,cta,url}.
   ============================================================ */

(function () {
  var IMG = "images/partners/"; // path relative to site root

  // ---------------------- PARTNER DATABASE ----------------------
  var P = {
    // ---- image-banner partners (self-hosted creatives) ----
    nordvpn:        { img:"nordvpn.jpg",      w:1200, h:628, url:"https://nordvpn.sjv.io/c/5096957/976012/7452",             alt:"NordVPN — 68% off the 2-year deal" },
    airhub:         { img:"airhub.png",       w:524,  h:240, url:"https://gighubsystemsinc.sjv.io/c/5096957/1790409/21179",  alt:"AirHub travel eSIM data plans" },
    "vegas-hotels": { img:"vegas-hotels.gif", w:728,  h:90,  url:"https://vegas.vdvm.net/c/5096957/271012/4221",             alt:"Vegas.com — best Las Vegas hotel prices" },
    "vegas-shows":  { img:"vegas-shows.gif",  w:468,  h:60,  url:"https://vegas.vdvm.net/c/5096957/271413/4221",             alt:"Save up to 40% on Las Vegas show tickets" },
    "grand-canyon": { img:"grand-canyon.jpg", w:300,  h:250, url:"https://vegas.vdvm.net/c/5096957/491743/4221",             alt:"Maverick Grand Canyon tours from Las Vegas" },
    alltrails:      { img:"alltrails.jpg",    w:1400, h:350, url:"https://alltrails.pxf.io/c/5096957/1908284/22353",         alt:"AllTrails — hiking, biking & trail maps" },
    backcountry:    { img:"backcountry.jpg",  w:728,  h:90,  url:"https://backcountry.tnu8.net/c/5096957/2129785/5311",      alt:"Backcountry — outdoor gear and apparel" },
    budget:         { img:"budget.png",       w:728,  h:90,  url:"https://budget.pxf.io/c/5096957/1877222/20801",            alt:"Budget car rental deals" },
    babbel:         { img:"babbel.png",       w:300,  h:250, url:"https://babbel.sjv.io/c/5096957/1069912/13589",            alt:"Babbel — learn a new language" },
    glo:            { img:"glo.jpg",          w:1200, h:628, url:"https://glodigitalinc.pxf.io/c/5096957/2220231/26739",     alt:"Glo — yoga, meditation & Pilates" },
    fabletics:      { img:"fabletics.png",    w:1200, h:675, url:"https://fableticsperformance.pxf.io/c/5096957/2814340/32253", alt:"Fabletics — activewear, 80% off first order" },

    // ---- text partners (no landscape banner creative) ----
    airalo:         { label:"Partner", tag:"eSIM",       title:"Airalo — Travel eSIMs", body:"Skip roaming fees. Instant mobile data in 200+ countries the moment you land.", cta:"Get an eSIM", url:"https://airalo.pxf.io/c/5096957/1349058/15608" },
    "vegas-caesars":{ label:"Partner", tag:"Las Vegas",  title:"Caesars Hotels",        body:"Stay on the Las Vegas Strip for less — rooms from $29.",                        cta:"Book a Room", url:"https://vegas.vdvm.net/c/5096957/410014/4221" }
  };
  // rotation pool for bare slots — image-banner partners only
  var ROTATE = ["nordvpn","vegas-hotels","backcountry","alltrails","babbel","budget","glo","airhub","vegas-shows","fabletics","grand-canyon"];
  // --------------------------------------------------------------

  window.MA_PARTNERS = P;

  var prefix = (location.pathname.indexOf('/posts/') > -1) ? '../' : '';

  var css =
    '.partner-slot{display:block}' +
    '.mp-banner{margin:34px 0;text-align:center;}' +
    '.mp-banner .mp-spon{display:block;font-size:9px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;' +
      'color:#c2beb5;margin-bottom:8px;font-family:"DM Sans",sans-serif;}' +
    '.mp-banner a{display:inline-block;width:100%;line-height:0;border:0;text-decoration:none;}' +
    '.mp-banner img{width:100%;height:auto;display:block;border:0;}' +
    '.mp-unit{border:2.5px solid #0D0D0D;background:#F7F4EF;display:flex;align-items:center;gap:20px;' +
      'padding:18px 22px;font-family:"DM Sans",sans-serif;margin:34px 0;}' +
    '.mp-unit-label{font-size:9px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#999;' +
      'border:1px solid #ccc;padding:3px 8px;flex-shrink:0;align-self:flex-start;}' +
    '.mp-unit-body{flex:1;min-width:0;}' +
    '.mp-unit-chip{display:inline-block;font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#E8421A;margin-bottom:5px;}' +
    '.mp-unit-body strong{font-family:"Fraunces",serif;font-size:16px;line-height:1.2;display:block;margin-bottom:4px;color:#0D0D0D;}' +
    '.mp-unit-body p{font-size:13px;color:#555;line-height:1.5;margin:0;}' +
    '.mp-unit-cta{font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#F7F4EF;' +
      'background:#E8421A;padding:11px 18px;text-decoration:none;white-space:nowrap;flex-shrink:0;}' +
    '.mp-unit-cta:hover{background:#0D0D0D;}' +
    '@media(max-width:600px){.mp-unit{flex-wrap:wrap;gap:12px;}.mp-unit-cta{width:100%;text-align:center;}}';
  var style = document.createElement('style');
  style.setAttribute('data-mp', '');
  style.appendChild(document.createTextNode(css));
  document.head.appendChild(style);

  function bannerHTML(p) {
    var cap = Math.min(p.w, 460); // keep banners a modest, centered unit — never a full-width takeover
    return '<div class="mp-banner"><span class="mp-spon">Sponsored</span>' +
      '<a href="' + p.url + '" target="_blank" rel="sponsored noopener" style="max-width:' + cap + 'px;">' +
        '<img src="' + prefix + IMG + p.img + '" width="' + p.w + '" height="' + p.h + '" loading="lazy" ' +
             'style="aspect-ratio:' + p.w + '/' + p.h + '" alt="' + (p.alt || '') + '"></a></div>';
  }
  function textHTML(p) {
    var chip = p.tag ? '<span class="mp-unit-chip">' + p.tag + '</span>' : '';
    return '<div class="mp-unit"><span class="mp-unit-label">' + (p.label || 'Sponsored') + '</span>' +
        '<div class="mp-unit-body">' + chip + '<strong>' + p.title + '</strong><p>' + p.body + '</p></div>' +
        '<a class="mp-unit-cta" href="' + p.url + '" target="_blank" rel="sponsored noopener">' + (p.cta || 'Learn More') + ' →</a></div>';
  }

  // advertiser/brand for a key — all Vegas.com creatives count as one brand
  function brandOf(key) { return (key.indexOf('vegas') === 0 || key === 'grand-canyon') ? 'vegas' : key; }

  function fill() {
    var slots = document.querySelectorAll('.partner-slot');
    var used = {}, r = 0;
    function pickUnused() {
      for (var t = 0; t < ROTATE.length; t++) {
        var k = ROTATE[(r + t) % ROTATE.length];
        if (!used[brandOf(k)]) { r = r + t + 1; return k; }
      }
      return null;
    }
    for (var i = 0; i < slots.length; i++) {
      var key = slots[i].getAttribute('data-partner');
      // if unset, unknown, or its advertiser already appeared on this page, pick an unused one
      if (!key || !P[key] || used[brandOf(key)]) key = pickUnused();
      if (!key) continue;
      used[brandOf(key)] = 1;
      var p = P[key];
      slots[i].innerHTML = p.img ? bannerHTML(p) : textHTML(p);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fill);
  } else { fill(); }
})();
