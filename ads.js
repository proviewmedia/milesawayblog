/* ============================================================
   MILES AWAY BLOG — CENTRAL AD MANAGER
   ------------------------------------------------------------
   This ONE file controls every partnership/affiliate ad on the
   whole site. Edit the ADS array below and it updates everywhere.

   HOW TO ADD OR CHANGE AN AD:
   Add/edit an object in the ADS array. Fields:
     label : small kicker text  (e.g. "Sponsored", "Affiliate", "Partner")
     tag   : optional category chip (e.g. "Credit Cards"). Use "" to hide.
     title : bold headline (the product/partner name)
     body  : one or two sentences
     cta   : button text (e.g. "Learn More")
     url   : destination link (your affiliate/partner URL)
     active: true to show, false to pause without deleting

   HOW ADS APPEAR ON A PAGE:
   Put a placeholder anywhere in a page's HTML:
     <div class="ad-slot"></div>                 (banner strip)
     <div class="ad-slot" data-format="inline"></div>   (inside article text)
   This script fills every .ad-slot automatically. Multiple slots on
   one page rotate through the active ads so they don't repeat.
   ============================================================ */

(function () {
  // ---------------------- EDIT ADS HERE ----------------------
  var ADS = [
    {
      label: "Partner",
      tag: "Credit Cards",
      title: "Capital One Venture X",
      body: "Fund your next trip. 2x miles on every purchase, premium lounge access, and an annual travel credit that pays for itself.",
      cta: "Learn More",
      url: "#",          // TODO: replace with real partner/affiliate link
      active: true
    },
    {
      label: "Affiliate",
      tag: "Travel Gear",
      title: "The Carry-On That Does It All",
      body: "The travel backpack built for long flights — the one piece of gear I never leave home without.",
      cta: "See the Gear",
      url: "#",          // TODO: replace with real affiliate link
      active: true
    },
    {
      label: "Partner",
      tag: "Shopping",
      title: "Temu — Travel Essentials for Less",
      body: "Packing cubes, adapters, and the little things that make a trip smoother, without the markup.",
      cta: "Shop Now",
      url: "#",          // TODO: replace with real partner link
      active: true
    }
  ];
  // -----------------------------------------------------------

  var active = ADS.filter(function (a) { return a.active !== false; });
  if (!active.length) return;

  // Inject styling once, namespaced (.ma-ad*) so it never clashes with page CSS.
  var css =
    '.ad-slot{display:block}' +
    '.ma-ad{border:2.5px solid #0D0D0D;background:#F7F4EF;display:flex;align-items:center;gap:20px;' +
      'padding:18px 22px;font-family:"DM Sans",sans-serif;}' +
    '.ma-ad--banner{margin:0;border-left:none;border-right:none;}' +
    '.ma-ad--inline{margin:36px 0;}' +
    '.ma-ad-label{font-size:9px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#999;' +
      'border:1px solid #ccc;padding:3px 8px;flex-shrink:0;align-self:flex-start;}' +
    '.ma-ad-body{flex:1;}' +
    '.ma-ad-chip{display:inline-block;font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;' +
      'color:#E8421A;margin-bottom:5px;}' +
    '.ma-ad-body strong{font-family:"Fraunces",serif;font-size:16px;line-height:1.2;display:block;margin-bottom:4px;color:#0D0D0D;}' +
    '.ma-ad-body p{font-size:13px;color:#555;line-height:1.5;margin:0;}' +
    '.ma-ad-cta{font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#F7F4EF;' +
      'background:#E8421A;padding:11px 18px;text-decoration:none;white-space:nowrap;flex-shrink:0;}' +
    '.ma-ad-cta:hover{background:#0D0D0D;}' +
    '@media(max-width:640px){.ma-ad{flex-wrap:wrap;gap:12px;}.ma-ad-cta{width:100%;text-align:center;}}';
  var style = document.createElement('style');
  style.setAttribute('data-miles-ads', '');
  style.appendChild(document.createTextNode(css));
  document.head.appendChild(style);

  function render(ad, format) {
    var chip = ad.tag ? '<span class="ma-ad-chip">' + ad.tag + '</span>' : '';
    return '<div class="ma-ad ma-ad--' + (format === 'inline' ? 'inline' : 'banner') + '">' +
        '<span class="ma-ad-label">' + (ad.label || 'Sponsored') + '</span>' +
        '<div class="ma-ad-body">' + chip +
          '<strong>' + ad.title + '</strong>' +
          '<p>' + ad.body + '</p>' +
        '</div>' +
        '<a class="ma-ad-cta" href="' + ad.url + '"' +
          (/^https?:/.test(ad.url) ? ' target="_blank" rel="sponsored noopener"' : '') +
          '>' + (ad.cta || 'Learn More') + ' →</a>' +
      '</div>';
  }

  function fill() {
    var slots = document.querySelectorAll('.ad-slot');
    for (var i = 0; i < slots.length; i++) {
      var ad = active[i % active.length];   // rotate so repeated slots differ
      var format = slots[i].getAttribute('data-format') || 'banner';
      slots[i].innerHTML = render(ad, format);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fill);
  } else {
    fill();
  }
})();
