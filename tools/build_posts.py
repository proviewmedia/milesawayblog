#!/usr/bin/env python3
"""Build blog posts written in Pages CMS (content/posts/*.md) into posts/<slug>.html.

Run from the repo root:  python3 tools/build_posts.py
The GitHub Action in .github/workflows/build-posts.yml runs this on every save.

Only touches pages it generated (marked <meta name="generator" content="milesaway-cms">)
and the CMS regions between <!-- CMS:... --> markers on the listing pages.
The hand-built posts are never modified.
"""
import glob, html, json, math, os, re, sys
from datetime import date, datetime

import yaml

try:
    from PIL import Image
except ImportError:
    Image = None

SITE = 'https://www.milesawayblog.com'
GEN_MARK = '<meta name="generator" content="milesaway-cms">'
PROPERTY = '5480944'
AFFILIATE_HOSTS = re.compile(r'https?://[^/"]*(pxf\.io|sjv\.io|tnu8\.net|vdvm\.net|i\d+\.net|7eer\.net|evyy\.net|ojrq\.net|mlz3\.net|amzn\.to|amazon\.com)')
IMPACT_HOSTS = re.compile(r'https?://[^/"]*(pxf\.io|sjv\.io|tnu8\.net|vdvm\.net|i\d+\.net|7eer\.net|evyy\.net|ojrq\.net|mlz3\.net)/')

CATEGORIES = {
    # category: (tag shown on post, breadcrumb label, section page, homepage bucket)
    'Destination guide': ('Destinations', 'Destinations', 'destinations.html', 'destinations'),
    'Review': ('Reviews', 'Gear & Reviews', 'gear.html', 'reviews'),
    'Travel tip': ('Travel Tips', 'Travel Tips', 'tips.html', 'reviews'),
}
CONTINENTS = {'North America': 'north-america', 'Europe': 'europe', 'Asia': 'asia',
              'Latin America': 'latin-america', 'Africa': 'africa', 'Oceania': 'oceania'}

esc = lambda s: html.escape(str(s or ''), quote=True)
problems = []


def slugify(s):
    return re.sub(r'[^a-z0-9]+', '-', s.lower()).strip('-')


def parse_md(path):
    raw = open(path, encoding='utf-8').read()
    m = re.match(r'^---\s*\n(.*?)\n---\s*\n?(.*)$', raw, re.S)
    if not m:
        return {}, raw
    meta = yaml.safe_load(m.group(1)) or {}
    return meta, m.group(2)


def to_date(v):
    if isinstance(v, datetime):
        return v.date()
    if isinstance(v, date):
        return v
    try:
        return datetime.strptime(str(v)[:10], '%Y-%m-%d').date()
    except Exception:
        return date.today()


def partner_keys():
    src = open('partners.js', encoding='utf-8').read()
    block = src[src.index('var P = {'):src.index('};', src.index('var P = {'))]
    keys = re.findall(r'^\s*"?([a-z][a-z-]*)"?\s*:\s*\{', block, re.M)
    sky = [k for k in keys if re.search(r'^\s*"?' + re.escape(k) + r'"?\s*:\s*\{[^\n]*\bsky:', block, re.M)]
    return keys, sky


def tag_link(url, slug, placement):
    """Add per-post Impact attribution to Impact tracking links."""
    if not IMPACT_HOSTS.match(url) or 'subId1=' in url:
        return url
    sep = '&' if '?' in url else '?'
    return f'{url}{sep}subId1={slug}&subId2={placement}&partnerpropertyid={PROPERTY}'


def site_path(p):
    """Turn a CMS media path (/images/uploads/x.jpg) into a path relative to /posts/."""
    p = (p or '').strip()
    if p.startswith('http'):
        return p
    return '../' + p.lstrip('/')


def make_images(slug, hero):
    """Return (hero_src, card_src_from_root, og_url). Generates resized copies when Pillow is available."""
    rel = (hero or '').lstrip('/')
    if not rel or rel.startswith('http') or not os.path.exists(rel):
        if hero:
            problems.append(f'{slug}: main image not found ({hero})')
        return '', '', ''
    out = 'images/uploads/generated'
    os.makedirs(out, exist_ok=True)
    if Image is None:
        return '../' + rel, rel, f'{SITE}/{rel}'
    im = Image.open(rel).convert('RGB')
    w, h = im.size
    hero_p, card_p, og_p = f'{out}/{slug}-hero.jpg', f'{out}/{slug}-card.jpg', f'{out}/{slug}-og.jpg'
    hero_im = im.resize((1600, round(h * 1600 / w)), Image.LANCZOS) if w > 1600 else im
    hero_im.save(hero_p, quality=85, optimize=True)
    # og/card: centre crop to 1.905:1
    target = 1200 / 630
    if w / h > target:
        nw = round(h * target); box = ((w - nw) // 2, 0, (w - nw) // 2 + nw, h)
    else:
        nh = round(w / target); box = (0, (h - nh) // 2, w, (h - nh) // 2 + nh)
    og = im.crop(box).resize((1200, 630), Image.LANCZOS)
    og.save(og_p, quality=85, optimize=True)
    og.resize((800, 420), Image.LANCZOS).save(card_p, quality=85, optimize=True)
    return '../' + hero_p, card_p, f'{SITE}/{og_p}'


def existing_posts():
    """Title/section/date for every post page, for Keep Reading and sidebars."""
    out = {}
    for f in glob.glob('posts/*.html'):
        s = open(f, encoding='utf-8').read()
        t = re.search(r'<h1 class="post-title">(.*?)</h1>', s, re.S)
        sec = re.search(r'<div class="back-bar">.*?<span>/</span><a href="\.\./([a-z]+)\.html">', s, re.S)
        d = re.search(r'"datePublished":\s*"([^"]+)"', s)
        if t:
            out[os.path.basename(f)[:-5]] = {
                'title': re.sub(r'<[^>]+>', '', t.group(1)).strip(),
                'section': sec.group(1) if sec else '',
                'date': d.group(1)[:10] if d else '2000-01-01',
            }
    return out


def callout(label, title, url, slug):
    url = tag_link(url, slug, 'callout')
    rel = 'sponsored noopener' if AFFILIATE_HOSTS.match(url) else 'noopener'
    return (f'<div class="callout">\n  <span class="callout-label">{esc(label)}</span>\n'
            f'  <p><a href="{esc(url)}" target="_blank" rel="{rel}">{esc(title)} &rarr;</a></p>\n</div>')


def banner(key, keys):
    # Vegas.com offers share one advertiser; data-force lets a post show several of them
    force = ' data-force' if key.startswith('vegas') or key == 'grand-canyon' else ''
    return f'<div class="partner-slot" data-format="inline" data-partner="{key}"{force}></div>' if key in keys else ''


def load_image_styles():
    """Extra class/style for images in the older posts, keyed by site path. The editor can't hold these."""
    try:
        return json.load(open('tools/image_styles.json', encoding='utf-8'))
    except FileNotFoundError:
        return {}


def editor_html(b, slug):
    """Turn what the rich-text editor saves into the site's post markup."""
    styles = load_image_styles()
    # a quote block starting with a bold-only line is a text box; any other quote block is a pull quote
    def quote(m):
        inner = m.group(1).strip()
        lab = re.match(r'<p>\s*<strong>([^<]+)</strong>\s*</p>\s*(.*)$', inner, re.S)
        if lab:
            return f'<div class="callout">\n  <span class="callout-label">{lab.group(1).strip()}</span>\n  {lab.group(2).strip()}\n</div>'
        return '<div class="pullquote">' + re.sub(r'^<p>(.*)</p>$', r'\1', inner, flags=re.S) + '</div>'
    b = re.sub(r'<blockquote>(.*?)</blockquote>', quote, b, flags=re.S)
    # the editor wraps list items in paragraphs
    b = re.sub(r'<li>\s*<p>((?:(?!</?p>).)*)</p>\s*</li>', r'<li>\1</li>', b, flags=re.S)
    # an italic-only line right under an image is its photo credit
    b = re.sub(r'(<img[^>]*>)\s*<p>\s*<em>((?:(?!</?(?:p|em)>).)*)</em>\s*</p>', r'\1\n<p class="img-credit">\2</p>', b, flags=re.S)
    # small print typed as an italic line: the disclosure note, and hero photo credits
    b = re.sub(r'<p>\s*<em>((?:Note|Heads up):(?:(?!</?p>).)*?)</em>\s*</p>',
               r'<p style="font-size:14px;color:#777;"><em>\1</em></p>', b, flags=re.S)
    b = re.sub(r'<p>\s*<em>(Hero (?:photo|image)(?:(?!</?(?:p|em)>).)*)</em>\s*</p>',
               r'<p style="font-size:12px;color:#999;margin-top:32px;">\1</p>', b, flags=re.S)
    def img(m):
        tag = m.group(0)
        src = re.search(r'src="([^"]*)"', tag)
        st = styles.get(src.group(1), {}) if src else {}
        if 'class=' not in tag:
            cls = ('inline-img ' + st.get('class', '')).strip()
            tag = tag.replace('<img', f'<img class="{cls}"' + (f' style="{st["style"]}"' if st.get('style') else ''), 1)
        return tag
    b = re.sub(r'<img [^>]*>', img, b)
    # media paths from the editor are site-absolute; posts live one folder down
    b = re.sub(r'(src|href)="/(images/[^"]+)"', r'\1="../\2"', b)
    # links: tag Impact links, open outside links in a new tab, mark affiliate links sponsored
    def fix_a(m):
        attrs = dict(re.findall(r'(\w[\w-]*)="([^"]*)"', m.group(0)))
        url = html.unescape(attrs.get('href', ''))
        if not url.startswith('http'):
            return f'<a href="{esc(url)}">'
        url = tag_link(url, slug, 'text')
        rel = 'sponsored noopener' if AFFILIATE_HOSTS.match(url) else 'noopener'
        return f'<a href="{esc(url)}" target="_blank" rel="{rel}">'
    b = re.sub(r'<a [^>]*>', fix_a, b)
    return b


def build_body(meta, body, slug, keys, posts, keep_reading=True):
    b = editor_html(body.strip(), slug)

    shops = [s for s in (meta.get('shop_links') or []) if isinstance(s, dict) and s.get('link')]
    shop_html = [callout(s.get('box_label') or 'Shop This', s.get('label') or 'Check the price', s['link'], slug) for s in shops]
    picked = meta.get('banners') or []
    if isinstance(picked, str):
        picked = [picked]
    picked += [meta.get(k) for k in ('banner_1', 'banner_2') if meta.get(k)]
    banners = [x for x in (banner(k, keys) for k in picked) if x]

    # [shop] and [banner] markers typed on their own line in the editor
    marker = lambda word: re.compile(r'<p>\s*\[' + word + r'\]\s*</p>|^\s*\[' + word + r'\]\s*$', re.M | re.I)
    for word, pool in (('shop', shop_html), ('banner', banners)):
        def put(_m, pool=pool):
            return pool.pop(0) if pool else ''
        b = marker(word).sub(put, b)

    # banners not placed by a marker go before every other section heading (2nd, 4th, 6th...)
    heads = [m.start() for m in re.finditer(r'<h2[\s>]', b)]
    for slot, idx in zip(list(banners), range(1, len(heads), 2)):
        if idx < len(heads):
            pos = heads[idx]
            b = b[:pos] + slot + '\n\n' + b[pos:]
            heads = [m.start() for m in re.finditer(r'<h2[\s>]', b)]
            banners.remove(slot)
    b += ''.join('\n\n' + x for x in banners)
    b += ''.join('\n\n' + x for x in shop_html)

    # FTC note after the first paragraph when the post carries any partner link
    has_note = re.search(r'<em>(?:Note|Heads up):[^<]*affiliate', b)
    if not has_note and (meta.get('shop_links') or picked or AFFILIATE_HOSTS.search(b)):
        note = ('<p style="font-size:14px;color:#777;"><em>Note: this post contains affiliate links. If you buy '
                'through them I may earn a small commission at no cost to you. See the '
                '<a href="../disclosure.html">disclosure</a>.</em></p>')
        end = b.find('</p>')
        b = b[:end + 4] + '\n\n' + note + b[end + 4:] if end > -1 else note + '\n\n' + b

    # Keep Reading: up to 3 posts from the same section, newest first
    sec = CATEGORIES[meta['_category']][2][:-5]
    rel = sorted((p for k, p in posts.items() if k != slug and p['section'] == sec),
                 key=lambda p: p['date'], reverse=True)[:3]
    if len(rel) < 3:
        rel += sorted((p for k, p in posts.items() if k != slug and p not in rel),
                      key=lambda p: p['date'], reverse=True)[:3 - len(rel)]
    if rel and keep_reading:
        b += '\n\n<h2 id="keep-reading">Keep Reading</h2>\n<ul>' + ''.join(
            f'\n  <li><a href="{p["slug"]}.html">{esc(p["title"])}</a></li>' for p in rel) + '\n</ul>'

    unboxed = [u for u in re.findall(r'href="([^"]+)"', re.sub(r'<div class="callout">.*?</div>', '', b, flags=re.S))
               if AFFILIATE_HOSTS.match(html.unescape(u))]
    if unboxed:
        problems.append(f'{slug}: affiliate link written in the text (better as a Shop link box): {unboxed[0][:60]}')
    return b


def sidebar(meta, slug, sky_keys, posts):
    sky = meta.get('sidebar_banner')
    parts = []
    if sky in sky_keys:
        parts.append(f'    <div class="sidebar-section"><div class="partner-slot" data-partner="{sky}" data-sky></div></div>')
    recent = sorted((p for k, p in posts.items() if k != slug), key=lambda p: p['date'], reverse=True)[:4]
    names = {'destinations': 'Destinations', 'gear': 'Reviews', 'tips': 'Travel Tips'}
    items = ''.join(
        f'\n      <div class="sidebar-post-item"><div class="sp-tag">{names.get(p["section"], "Stories")}</div>'
        f'<a class="sp-title" href="{p["slug"]}.html">{esc(p["title"])}</a>'
        f'<div class="sp-meta">{to_date(p["date"]).strftime("%b %-d, %Y")}</div></div>' for p in recent)
    parts.append(f'    <div class="sidebar-section">\n      <div class="sidebar-label">More Stories</div>{items}\n    </div>')
    return '\n'.join(parts)


def render(meta, body, slug, keys, sky_keys, posts, template):
    tag, crumb_label, section_page, _ = CATEGORIES[meta['_category']]
    title = str(meta['title']).strip()
    desc = re.sub(r'\s+', ' ', str(meta.get('description') or '')).strip()
    seo = title if len(title) > 47 else f'{title} | Miles Away'
    d = to_date(meta.get('date'))
    author = meta.get('author') or 'Melvin'
    url = f'{SITE}/posts/{slug}.html'
    hero, card, og = make_images(slug, meta.get('hero'))
    body_html = build_body(meta, body, slug, keys, posts)
    words = len(re.sub(r'<[^>]+>', ' ', body_html).split())
    person = {'@type': 'Person', 'name': author}
    if author == 'Melvin':
        person['url'] = f'{SITE}/about.html'
    post_ld = {
        '@context': 'https://schema.org', '@type': 'BlogPosting', 'headline': title, 'description': desc,
        'image': og or None, 'author': person,
        'publisher': {'@type': 'Organization', 'name': 'Miles Away Blog', 'url': SITE,
                      'logo': {'@type': 'ImageObject', 'url': f'{SITE}/favicon.svg'}},
        'datePublished': d.isoformat(), 'dateModified': to_date(meta.get('updated') or d).isoformat(),
        'inLanguage': 'en-US', 'articleSection': tag, 'mainEntityOfPage': url,
    }
    crumb_ld = {'@context': 'https://schema.org', '@type': 'BreadcrumbList', 'itemListElement': [
        {'@type': 'ListItem', 'position': 1, 'name': 'Miles Away', 'item': f'{SITE}/'},
        {'@type': 'ListItem', 'position': 2, 'name': crumb_label, 'item': f'{SITE}/{section_page}'},
        {'@type': 'ListItem', 'position': 3, 'name': title, 'item': url}]}
    active = {'destinations.html': 'ACTIVE_DEST', 'gear.html': 'ACTIVE_GEAR', 'tips.html': 'ACTIVE_TIPS'}
    vals = {
        'SEO_TITLE': esc(seo), 'TITLE': esc(title), 'DESCRIPTION': esc(desc), 'AUTHOR': esc(author), 'URL': url,
        'OG_IMAGE': og, 'DATE': d.isoformat(), 'DATE_LONG': d.strftime('%B %-d, %Y'), 'SECTION': tag, 'TAG': tag,
        'SECTION_PAGE': section_page, 'SECTION_HTML': esc(crumb_label), 'CRUMB': esc(title if len(title) < 45 else title.split(':')[0]),
        'HERO': hero, 'HERO_ALT': esc(meta.get('hero_alt') or title), 'READ_MIN': max(1, math.ceil(words / 230)),
        'JSONLD_POST': json.dumps(post_ld, indent=2), 'JSONLD_BREADCRUMB': json.dumps(crumb_ld, indent=2),
        'BODY': body_html, 'SIDEBAR': sidebar(meta, slug, sky_keys, posts),
        'ACTIVE_DEST': '', 'ACTIVE_GEAR': '', 'ACTIVE_TIPS': '',
    }
    vals[active[section_page]] = ' class="active"'
    out = template
    for k, v in vals.items():
        out = out.replace('{{' + k + '}}', str(v))
    if not hero:
        out = out.replace('  <img class="post-hero-img" src="" alt="' + vals['HERO_ALT'] + '">\n', '')
    assert '{{' not in out, re.findall(r'\{\{[A-Z_]+\}\}', out)
    return out, {'slug': slug, 'title': title, 'desc': desc, 'date': d, 'card': card, 'alt': meta.get('hero_alt') or title,
                 'category': meta['_category'], 'tag': tag, 'continent': meta.get('continent'),
                 'place': meta.get('place') or ''}


# ---------- the older hand-built posts ----------
# Their pages keep their own design. The article between <!-- CMS:body --> markers
# and a few details (title, byline, summary, main image, sidebar banner) come from the editor.

import hashlib

BODY_RE = re.compile(r'<!-- CMS:body v=([0-9a-f]*) -->\n(.*?)<!-- /CMS:body -->', re.S)


def entry_hash(meta, body):
    keep = {k: meta.get(k) for k in ('title', 'author', 'description', 'hero', 'hero_alt', 'shop_links',
                                      'banners', 'banner_1', 'banner_2', 'sidebar_banner')}
    return hashlib.sha1((json.dumps(keep, sort_keys=True, default=str) + body).encode()).hexdigest()[:12]


def faq_schema(body_html):
    m = re.search(r'<h2>Frequently Asked Questions</h2>(.*?)(?=<h2|$)', body_html, re.S)
    if not m:
        return None
    text = lambda x: re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', '', x))).strip()
    qa = re.findall(r'<h3>(.*?)</h3>\s*((?:<p>.*?</p>\s*)+)', m.group(1), re.S)
    return [{'@type': 'Question', 'name': text(q),
             'acceptedAnswer': {'@type': 'Answer', 'text': text(a)}} for q, a in qa] or None


def patch_legacy(path, meta, body, slug, keys, sky_keys, posts):
    """Update an older post in place. Returns True when the page changed."""
    page = open(path, encoding='utf-8').read()
    m = BODY_RE.search(page)
    h = entry_hash(meta, body)
    if m.group(1) == h:
        return False
    first_run = m.group(1) == ''
    body_html = build_body(meta, body, slug, keys, posts, keep_reading=False)
    page = page[:m.start()] + f'<!-- CMS:body v={h} -->\n' + body_html + '\n<!-- /CMS:body -->' + page[m.end():]

    plain = lambda x: html.unescape(re.sub(r'<[^>]+>', '', x or '')).strip()
    def swap(pattern, value, text, flags=0):
        """Replace group 2 of pattern with value (escaped) only when the visible text differs."""
        def r(x):
            return x.group(1) + esc(value) + x.group(3) if plain(x.group(2)) != str(value).strip() else x.group(0)
        return re.sub(pattern, r, text, count=1, flags=flags)
    title = str(meta.get('title') or '').strip()
    h1 = re.search(r'<h1 class="post-title">(.*?)</h1>', page, re.S)
    title_changed = bool(title and h1 and plain(h1.group(1)) != title)
    if title_changed:
        page = swap(r'(<h1 class="post-title">)(.*?)(</h1>)', title, page, re.S)
        page = re.sub(r'("headline":\s*)"[^"]*"', lambda x: x.group(1) + json.dumps(title, ensure_ascii=False), page, count=1)
    author = str(meta.get('author') or 'Melvin')
    page = swap(r'(<div class="post-meta"><span>By <strong>)([^<]*)(</strong>)', author, page)
    page = re.sub(r'("author":\s*\{\s*"@type":\s*"Person",\s*"name":\s*)"([^"]*)"',
                  lambda x: x.group(0) if x.group(2) == author else x.group(1) + json.dumps(author, ensure_ascii=False), page, count=1)
    desc = re.sub(r'\s+', ' ', str(meta.get('description') or '')).strip()
    if desc:
        for pat in (r'(<meta name="description" content=")([^"]*)(")', r'(<meta property="og:description" content=")([^"]*)(")',
                    r'(<meta name="twitter:description" content=")([^"]*)(")'):
            page = swap(pat, desc, page)
    hero = (meta.get('hero') or '').strip()
    cur = re.search(r'<img class="post-hero-img" src="([^"]*)"', page)
    if hero and cur and site_path(hero) != cur.group(1):
        if hero.lstrip('/').startswith('images/uploads/'):
            src, _, og = make_images(slug, hero)
        else:
            src, og = site_path(hero), f'{SITE}/{hero.lstrip("/")}'
        if src:
            # the old width/height belonged to the old picture
            page = re.sub(r'<img class="post-hero-img" src="[^"]*"((?: (?:width|height)="\d+")*)',
                          lambda x: f'<img class="post-hero-img" src="{src}"', page, count=1)
            for pat in (r'(<meta property="og:image" content=")[^"]*', r'(<meta name="twitter:image" content=")[^"]*'):
                page = re.sub(pat, lambda x: x.group(1) + og, page, count=1)
    if meta.get('hero_alt'):
        page = swap(r'(<img class="post-hero-img"[^>]*? alt=")([^"]*)(")', str(meta['hero_alt']), page)
    sky = meta.get('sidebar_banner')
    if sky in sky_keys:
        page = re.sub(r'(data-partner=")[a-z-]+(" data-sky)', lambda x: x.group(1) + sky + x.group(2), page, count=1)
    # read time moves in proportion to the change in length, so the original estimate stays the baseline
    count = lambda x: len(re.sub(r'<[^>]+>', ' ', x).split())
    old_words, new_words = count(m.group(2)), count(body_html)
    if old_words and abs(new_words - old_words) > 30:
        page = re.sub(r'(&middot; )(\d+)( min read)', lambda x: x.group(1) + str(max(1, round(int(x.group(2)) * new_words / old_words))) + x.group(3), page, count=1)
    faq = faq_schema(body_html) if not first_run else None
    if faq:
        page = re.sub(r'("@type":\s*"FAQPage",\s*"mainEntity":\s*)\[.*?\]\s*(\}\s*</script>)',
                      lambda x: x.group(1) + json.dumps(faq, ensure_ascii=False) + x.group(2), page, count=1, flags=re.S)
    if not first_run:
        today = date.today().isoformat()
        page = re.sub(r'("dateModified":\s*)"[^"]*"', lambda x: x.group(1) + f'"{today}"', page, count=1)
        sm = open('sitemap.xml', encoding='utf-8').read()
        sm = re.sub(r'(<loc>' + re.escape(f'{SITE}/posts/{slug}.html') + r'</loc>\s*<lastmod>)[^<]*',
                    lambda x: x.group(1) + today, sm, count=1)
        open('sitemap.xml', 'w', encoding='utf-8').write(sm)
        if title_changed:
            update_cards(slug, title)
    open(path, 'w', encoding='utf-8').write(page)
    return True


def update_cards(slug, title):
    """Keep the hand-built listing cards for an older post in step with its title."""
    if not title:
        return
    for f in ('index.html', 'archive.html', 'gear.html', 'tips.html', 'destinations.html'):
        s = open(f, encoding='utf-8').read()
        link = f'posts/{slug}.html'
        def card(m):
            c = m.group(0)
            if link not in c:
                return c
            c = re.sub(r'(<div class="(?:grid-card|post-card)-title">).*?(</div>)', lambda x: x.group(1) + esc(title) + x.group(2), c, count=1, flags=re.S)
            return c
        s2 = re.sub(r'<(?:a|div) class="(?:grid-card|post-card)"[^>]*>.*?</(?:a|div)>\s*</(?:a|div)>', card, s, flags=re.S)
        if s2 != s:
            open(f, 'w', encoding='utf-8').write(s2)


# ---------- listing pages ----------

def short(s, n=130):
    return s if len(s) <= n else s[:n].rsplit(' ', 1)[0].rstrip(',.;:') + '...'


def grid_card(p, tag=None, meta_line=None):
    img = f'\n    <img class="grid-card-img" src="{p["card"]}" alt="{esc(p["alt"])}">' if p['card'] else ''
    return (f'  <a class="grid-card" href="posts/{p["slug"]}.html">{img}\n    <div class="grid-card-body">\n'
            f'      <div class="grid-card-tag">{esc(tag or p["tag"])}</div>\n'
            f'      <div class="grid-card-title">{esc(p["title"])}</div>\n'
            f'      <div class="grid-card-excerpt">{esc(short(p["desc"]))}</div>\n'
            f'      <div class="grid-card-meta">{meta_line or p["date"].strftime("%b %-d, %Y") + " &middot; " + esc(p["tag"])}</div>\n'
            f'    </div>\n  </a>\n')


def home_card(p):
    img = f'\n    <img class="post-card-img" src="{p["card"]}" alt="{esc(p["alt"])}">' if p['card'] else ''
    return (f'  <div class="post-card" onclick="location.href=\'posts/{p["slug"]}.html\'" style="cursor:pointer">{img}\n'
            f'    <div class="post-card-body">\n      <div class="post-card-tag">{esc(p["tag"])}</div>\n'
            f'      <a href="posts/{p["slug"]}.html" style="text-decoration:none;color:inherit"><div class="post-card-title">{esc(p["title"])}</div></a>\n'
            f'      <div class="post-card-excerpt">{esc(short(p["desc"]))}</div>\n'
            f'      <div class="post-card-meta">{p["date"].strftime("%b %-d, %Y")} &middot; {esc(p["place"] or p["tag"])}</div>\n'
            f'    </div>\n  </div>\n')


def set_region(s, name, content, anchor_re):
    """Replace <!-- CMS:name -->...<!-- /CMS:name -->, creating it right after anchor_re on first run."""
    start, end = f'<!-- CMS:{name} -->', f'<!-- /CMS:{name} -->'
    if start not in s:
        m = re.search(anchor_re, s, re.S)
        if not m:
            problems.append(f'could not find where to put {name}')
            return s
        s = s[:m.end()] + f'\n{start}\n{end}' + s[m.end():]
    a, b = s.index(start) + len(start), s.index(end)
    return s[:a] + '\n' + content + s[b:]


def update_listings(published):
    newest = sorted(published, key=lambda p: p['date'], reverse=True)
    pick = lambda *cats: [p for p in newest if p['category'] in cats]

    f = 'index.html'; s = open(f, encoding='utf-8').read()
    s = set_region(s, 'home-destinations', ''.join(home_card(p) for p in pick('Destination guide')),
                   r'<h2>Destinations</h2>.*?<div class="post-grid">')
    s = set_region(s, 'home-reviews', ''.join(home_card(p) for p in pick('Review', 'Travel tip')),
                   r'<h2>Reviews &(?:amp;)? Gear</h2>.*?<div class="post-grid">')
    open(f, 'w', encoding='utf-8').write(s)

    for f, cats in (('archive.html', ('Destination guide', 'Review', 'Travel tip')),
                    ('gear.html', ('Review', 'Travel tip')), ('tips.html', ('Travel tip',))):
        s = open(f, encoding='utf-8').read()
        s = set_region(s, 'grid', ''.join(grid_card(p) for p in pick(*cats)), r'<div class="posts-grid">')
        open(f, 'w', encoding='utf-8').write(s)

    f = 'destinations.html'; s = open(f, encoding='utf-8').read()
    for name, cid in CONTINENTS.items():
        cards = [p for p in pick('Destination guide') if p['continent'] == name]
        grid_id = f'id="grid-{cid}"'
        if cards and re.search(r'<div class="coming-soon-panel" ' + grid_id + r'>.*?</div>\s*</div>', s, re.S):
            # first story on this continent: swap the Coming Soon panel for a real grid
            s = re.sub(r'<div class="coming-soon-panel" ' + grid_id + r'>.*?</div>\s*</div>',
                       f'<div class="posts-grid" {grid_id} style="display:none;">\n  </div>', s, count=1, flags=re.S)
        if grid_id in s and 'posts-grid' in s[s.rfind('<div', 0, s.index(grid_id)):s.index(grid_id)]:
            s = set_region(s, f'dest-{cid}', ''.join(
                grid_card(p, tag=p['place'] or p['tag'], meta_line=p['date'].strftime('%b %-d, %Y') + ' &middot; ' + esc(p['place'] or name)).replace('\n  <', '\n    <')
                for p in cards), r'<div class="posts-grid" ' + grid_id + r'[^>]*>')
        elif cards:
            problems.append(f'no {name} section on destinations.html')
    # story counts on the continent tabs
    for name, cid in CONTINENTS.items():
        m = re.search(r'<div class="posts-grid" id="grid-' + cid + r'"[^>]*>(.*?)\n  </div>\n', s, re.S)
        if m:
            n = m.group(1).count('class="grid-card"')
            s = re.sub(r'(data-continent="' + cid + r'">\s*<div class="tab-inner">\s*<span class="tab-count">)[^<]*',
                       lambda mm: mm.group(1) + (f'{n} Story' if n == 1 else f'{n} Stories'), s, count=1)
    open(f, 'w', encoding='utf-8').write(s)

    f = 'sitemap.xml'; s = open(f, encoding='utf-8').read()
    urls = ''.join(f'  <url>\n    <loc>{SITE}/posts/{p["slug"]}.html</loc>\n    <lastmod>{p["date"].isoformat()}</lastmod>\n'
                   f'    <changefreq>monthly</changefreq>\n    <priority>0.8</priority>\n  </url>\n' for p in newest)
    start, end = '<!-- CMS:posts -->', '<!-- /CMS:posts -->'
    if start not in s:
        s = s.replace('</urlset>', f'  {start}\n  {end}\n</urlset>')
    a, b = s.index(start) + len(start), s.index(end)
    s = s[:a] + '\n' + urls + '  ' + s[b:]
    open(f, 'w', encoding='utf-8').write(s)


def main():
    template = open('tools/post_template.html', encoding='utf-8').read()
    keys, sky_keys = partner_keys()
    posts = existing_posts()
    for k in posts:
        posts[k]['slug'] = k

    entries = []
    for path in sorted(glob.glob('content/posts/*.md')):
        meta, body = parse_md(path)
        slug = slugify(os.path.basename(path)[:-3])
        if not meta.get('title'):
            problems.append(f'{slug}: no title, skipped'); continue
        cat = meta.get('category') if meta.get('category') in CATEGORIES else 'Travel tip'
        meta['_category'] = cat
        entries.append((slug, meta, body))

    # CMS posts count for Keep Reading/sidebars too
    for slug, meta, _ in entries:
        if str(meta.get('status', 'Draft')).lower() == 'published':
            posts[slug] = {'slug': slug, 'title': str(meta['title']).strip(), 'date': to_date(meta.get('date')).isoformat(),
                           'section': CATEGORIES[meta['_category']][2][:-5]}

    published, keep = [], set()
    for slug, meta, body in entries:
        out_path = f'posts/{slug}.html'
        is_live = str(meta.get('status', 'Draft')).lower() == 'published'
        if os.path.exists(out_path) and GEN_MARK not in open(out_path, encoding='utf-8').read():
            if not BODY_RE.search(open(out_path, encoding='utf-8').read()):
                problems.append(f'{slug}: a hand-built post already uses this name, rename the post')
            elif is_live and patch_legacy(out_path, meta, body, slug, keys, sky_keys, posts):
                print(f'updated {slug}')
            continue
        if not is_live:
            continue
        page, card = render(meta, body, slug, keys, sky_keys, posts, template)
        open(out_path, 'w', encoding='utf-8').write(page)
        published.append(card); keep.add(out_path)

    # unpublished or deleted posts come down
    for f in glob.glob('posts/*.html'):
        if f not in keep and GEN_MARK in open(f, encoding='utf-8').read():
            os.remove(f)
            for suffix in ('hero', 'card', 'og'):
                p = f'images/uploads/generated/{os.path.basename(f)[:-5]}-{suffix}.jpg'
                if os.path.exists(p):
                    os.remove(p)

    update_listings(published)

    # plain store links that still need an Impact tracking link (Claude swaps these in)
    todo = []
    for slug, meta, body in entries:
        for s in meta.get('shop_links') or []:
            if isinstance(s, dict) and s.get('link') and not AFFILIATE_HOSTS.match(s['link']):
                todo.append(f'- [ ] `{slug}`: {s.get("label") or ""} -> {s["link"]}')
    with open('content/LINKS-TO-TRACK.md', 'w', encoding='utf-8') as fh:
        fh.write('# Shop links waiting for an affiliate tracking link\n\nAsk Claude to "convert the links in LINKS-TO-TRACK".\n\n'
                 + ('\n'.join(todo) if todo else '_None right now._') + '\n')

    print(f'built {len(published)} post(s)')
    for p in problems:
        print('NOTE:', p)


if __name__ == '__main__':
    main()
