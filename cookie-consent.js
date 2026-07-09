/* ============================================================
   MILES AWAY BLOG — COOKIE CONSENT BANNER
   ------------------------------------------------------------
   Self-contained GDPR-style consent banner. Included on every
   page. Remembers the visitor's choice in localStorage.
   - "Accept"  -> analytics stays on
   - "Decline" -> disables Google Analytics (ga-disable flag) now
                  and on every future page load
   Pairs with a small guard in each page's <head> that re-applies
   the ga-disable flag before Analytics fires if consent was declined.
   ============================================================ */
(function () {
  var KEY = 'ma-cookie-consent';
  var GA = 'G-NLF96VDZ1B';
  var choice = null;
  try { choice = localStorage.getItem(KEY); } catch (e) {}

  if (choice === 'declined') { window['ga-disable-' + GA] = true; }
  if (choice === 'accepted' || choice === 'declined') return; // already decided

  var css =
    '#ma-cookie{position:fixed;left:0;right:0;bottom:0;z-index:9999;background:#0D0D0D;color:#F7F4EF;' +
      'border-top:2.5px solid #E8421A;font-family:"DM Sans",sans-serif;padding:16px 22px;display:flex;' +
      'align-items:center;gap:18px;flex-wrap:wrap;justify-content:center;}' +
    '#ma-cookie p{font-size:13px;line-height:1.55;margin:0;max-width:620px;color:rgba(247,244,239,0.85);}' +
    '#ma-cookie a{color:#E8421A;font-weight:600;text-decoration:underline;}' +
    '#ma-cookie .ma-cc-btns{display:flex;gap:10px;flex-shrink:0;}' +
    '#ma-cookie button{font-family:"DM Sans",sans-serif;font-weight:700;font-size:12px;letter-spacing:0.06em;' +
      'text-transform:uppercase;padding:10px 20px;cursor:pointer;border:2px solid #E8421A;}' +
    '#ma-cookie .ma-cc-accept{background:#E8421A;color:#F7F4EF;}' +
    '#ma-cookie .ma-cc-accept:hover{background:#F7F4EF;color:#0D0D0D;border-color:#F7F4EF;}' +
    '#ma-cookie .ma-cc-decline{background:transparent;color:#F7F4EF;border-color:rgba(247,244,239,0.4);}' +
    '#ma-cookie .ma-cc-decline:hover{border-color:#F7F4EF;}' +
    '@media(max-width:600px){#ma-cookie{flex-direction:column;text-align:center;padding:16px;}#ma-cookie .ma-cc-btns{width:100%;}#ma-cookie button{flex:1;}}';
  var style = document.createElement('style');
  style.appendChild(document.createTextNode(css));
  document.head.appendChild(style);

  var prefix = location.pathname.indexOf('/posts/') > -1 ? '../' : '';
  var bar = document.createElement('div');
  bar.id = 'ma-cookie';
  bar.setAttribute('role', 'dialog');
  bar.setAttribute('aria-label', 'Cookie consent');
  bar.innerHTML =
    '<p>We use cookies for analytics to understand which stories resonate. ' +
    'You can accept or decline. See our <a href="' + prefix + 'privacy.html">Privacy Policy</a>.</p>' +
    '<div class="ma-cc-btns">' +
      '<button type="button" class="ma-cc-decline">Decline</button>' +
      '<button type="button" class="ma-cc-accept">Accept</button>' +
    '</div>';

  function decide(v) {
    try { localStorage.setItem(KEY, v); } catch (e) {}
    if (v === 'declined') { window['ga-disable-' + GA] = true; }
    if (bar.parentNode) bar.parentNode.removeChild(bar);
  }
  function mount() {
    document.body.appendChild(bar);
    bar.querySelector('.ma-cc-accept').addEventListener('click', function () { decide('accepted'); });
    bar.querySelector('.ma-cc-decline').addEventListener('click', function () { decide('declined'); });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else { mount(); }
})();
