/* ============================================================
   MILES AWAY BLOG — AFFILIATE / PARTNER DATABASE + RENDERER
   ------------------------------------------------------------
   This ONE file is the source of truth for every affiliate/partner
   placement on the site. All links are real Impact Radius tracking
   links (publisher 5096957) and open in a new tab with rel="sponsored".

   HOW PLACEMENTS WORK:
   Put a slot anywhere in a page:
     <div class="partner-slot" data-partner="airalo"></div>   -> shows that partner
     <div class="partner-slot"></div>                      -> rotates partners
   The `data-partner` value is the program's key in the ADS object below.

   TO ADD / EDIT A PARTNER: add or edit an entry in ADS. Fields:
     label  small kicker ("Partner" / "Sponsored")
     tag    category chip (e.g. "eSIM"); "" hides it
     title  bold headline (the brand / offer)
     body   one or two sentences
     cta    button text
     url    the Impact tracking link (…/c/5096957/adId/campaignId)
     active true to show, false to pause
   ============================================================ */

(function () {
  // ---------------------- AFFILIATE DATABASE ----------------------
  var ADS = {
    airalo:      { label:"Partner", tag:"eSIM",        title:"Airalo — Travel eSIMs",         body:"Skip roaming fees. Instant mobile data in 200+ countries the moment you land.",        cta:"Get an eSIM",       url:"https://airalo.pxf.io/c/5096957/1349058/15608",            active:true },
    airhub:      { label:"Partner", tag:"eSIM",        title:"AirHub eSIM",                    body:"Affordable global data plans for travelers — stay connected anywhere.",                 cta:"See Plans",         url:"https://gighubsystemsinc.sjv.io/c/5096957/1790409/21179",   active:true },
    nordvpn:     { label:"Partner", tag:"VPN",         title:"NordVPN",                        body:"Protect your connection on public Wi-Fi and access home content from abroad.",          cta:"Get NordVPN",       url:"https://nordvpn.sjv.io/c/5096957/464440/7452",              active:true },
    "vegas-hotels":      { label:"Partner", tag:"Las Vegas",  title:"Vegas.com — Best Hotel Prices",  body:"Compare the best deals on Las Vegas hotels, right on the Strip.",              cta:"Find Hotels",       url:"https://vegas.vdvm.net/c/5096957/271012/4221",              active:true },
    "vegas-shows":       { label:"Partner", tag:"Las Vegas",  title:"Vegas.com — Shows & Tickets",    body:"Save on the best Las Vegas shows, from Cirque to headliners.",                 cta:"Browse Shows",      url:"https://vegas.vdvm.net/c/5096957/262153/4221",              active:true },
    "vegas-caesars":     { label:"Partner", tag:"Las Vegas",  title:"Caesars Hotels — Rooms from $29",body:"Stay on the Strip for less at Caesars Entertainment hotels.",                  cta:"Book a Room",       url:"https://vegas.vdvm.net/c/5096957/410014/4221",              active:true },
    "grand-canyon":      { label:"Partner", tag:"Tours",      title:"Grand Canyon Day Tours",         body:"Guided day trips to the Grand Canyon from Las Vegas with Maverick.",           cta:"See Tours",         url:"https://vegas.vdvm.net/c/5096957/491743/4221",              active:true },
    alltrails:   { label:"Partner", tag:"Outdoors",    title:"AllTrails+",                     body:"Offline maps, wrong-turn alerts, and 450k+ trails. Try 7 days free.",                   cta:"Start Free Trial",  url:"https://alltrails.pxf.io/c/5096957/1918532/22353",          active:true },
    backcountry: { label:"Partner", tag:"Gear",        title:"Backcountry",                    body:"Outdoor gear, apparel, and camp essentials — 15% off your first order.",                cta:"Shop Gear",         url:"https://backcountry.tnu8.net/c/5096957/1107360/5311",       active:true },
    osprey:      { label:"Partner", tag:"Gear",        title:"Osprey Packs",                   body:"The travel and hiking packs I trust — up to 40% off sale items.",                       cta:"Shop Packs",        url:"https://osprey.pxf.io/c/5096957/2991713/20745",             active:true },
    budget:      { label:"Partner", tag:"Car Rental",  title:"Budget Car Rental",              body:"Wheels for your next road trip at a price that fits the budget.",                       cta:"Find a Car",        url:"https://budget.pxf.io/c/5096957/1877222/20801",             active:true },
    babbel:      { label:"Partner", tag:"Language",    title:"Babbel",                         body:"Learn the local language before your trip — real conversations, fast.",                 cta:"Start Learning",    url:"https://babbel.sjv.io/c/5096957/1069912/13589",             active:true },
    glo:         { label:"Partner", tag:"Wellness",    title:"Glo — Yoga & Wellness",          body:"Yoga, meditation, and Pilates you can do anywhere. Reset on the road.",                 cta:"Try Glo",           url:"https://glodigitalinc.pxf.io/c/5096957/2220231/26739",      active:true },
    fabletics:   { label:"Partner", tag:"Activewear",  title:"Fabletics",                      body:"Travel-ready activewear — 80% off your first VIP order.",                              cta:"Shop the Deal",     url:"https://fableticsperformance.pxf.io/c/5096957/2814335/32253",active:true }
  };
  // rotation pool for slots without a specific data-partner (travel-relevant first)
  var ROTATE = ["airalo","nordvpn","vegas-hotels","backcountry","alltrails","babbel","osprey","budget","glo","airhub","vegas-shows","fabletics"];
  // ---------------------------------------------------------------

  window.MA_AFFILIATES = ADS; // expose the database

  var css =
    '.partner-slot{display:block}' +
    '.mp-unit{border:2.5px solid #0D0D0D;background:#F7F4EF;display:flex;align-items:center;gap:20px;' +
      'padding:18px 22px;font-family:"DM Sans",sans-serif;}' +
    '.mp-unit--inline{margin:36px 0;}' +
    '.mp-unit-label{font-size:9px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#999;' +
      'border:1px solid #ccc;padding:3px 8px;flex-shrink:0;align-self:flex-start;}' +
    '.mp-unit-body{flex:1;min-width:0;}' +
    '.mp-unit-chip{display:inline-block;font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;' +
      'color:#E8421A;margin-bottom:5px;}' +
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

  function render(ad) {
    var chip = ad.tag ? '<span class="mp-unit-chip">' + ad.tag + '</span>' : '';
    return '<div class="mp-unit mp-unit--inline">' +
        '<span class="mp-unit-label">' + (ad.label || 'Sponsored') + '</span>' +
        '<div class="mp-unit-body">' + chip +
          '<strong>' + ad.title + '</strong>' +
          '<p>' + ad.body + '</p>' +
        '</div>' +
        '<a class="mp-unit-cta" href="' + ad.url + '" target="_blank" rel="sponsored noopener">' + (ad.cta || 'Learn More') + ' →</a>' +
      '</div>';
  }

  function fill() {
    var slots = document.querySelectorAll('.partner-slot');
    var r = 0;
    for (var i = 0; i < slots.length; i++) {
      var key = slots[i].getAttribute('data-partner');
      var ad = key && ADS[key] && ADS[key].active !== false ? ADS[key] : null;
      if (!ad) { // rotate through the pool
        for (var t = 0; t < ROTATE.length; t++) {
          var cand = ADS[ROTATE[(r + t) % ROTATE.length]];
          if (cand && cand.active !== false) { ad = cand; r = r + t + 1; break; }
        }
      }
      if (ad) slots[i].innerHTML = render(ad);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fill);
  } else { fill(); }
})();
