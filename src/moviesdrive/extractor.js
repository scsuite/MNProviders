import cheerio from 'cheerio-without-node-native';
import { HEADERS } from './constants.js';

function absoluteUrl(value, base) {
  if (!value || typeof value !== 'string') return null;
  try { return new URL(value, base).toString(); } catch (_) { return null; }
}

function parseSize(value) {
  const match = String(value || '').match(/([\d.]+)\s*(GB|MB)/i);
  return match ? `${Number(match[1]).toFixed(match[1].includes('.') ? 1 : 0)} ${match[2].toUpperCase()}` : undefined;
}

function parseQuality(value) {
  const text = String(value || '');
  if (/\b(?:2160p?|4k)\b/i.test(text)) return '4K';
  const match = text.match(/\b(1080|720|480|360|240)p?\b/i);
  return match ? `${match[1]}p` : 'Unknown';
}

function safeUrl(value) {
  if (!value) return null;
  const parsed = new URL(value);
  parsed.pathname = parsed.pathname.split('/').map(segment => {
    try { return encodeURIComponent(decodeURIComponent(segment)); }
    catch (_) { return encodeURIComponent(segment); }
  }).join('/');
  return parsed.toString();
}

function hubCloudServer(text, link) {
  const value = `${text || ''} ${link || ''}`.toLowerCase();
  if (/gpdl\.|server\s*:\s*10gbps/.test(value)) return 'HubCloud Pixel 10Gbps';
  if (/fslv2/.test(value)) return 'HubCloud FSLv2';
  if (/fsl/.test(value)) return 'HubCloud FSL';
  if (/s3 server/.test(value)) return 'HubCloud S3';
  if (/mega server/.test(value)) return 'HubCloud Mega';
  if (/pdl server/.test(value)) return 'HubCloud PDL';
  if (/buzzserver/.test(value)) return 'HubCloud BuzzServer';
  if (/pixeldrain/.test(value)) return 'HubCloud Pixeldrain';
  if (/pixel\.|pixelserver/.test(value)) return 'HubCloud Pixel';
  if (/workers\.dev|download file/.test(value)) return 'HubCloud Direct';
  return 'HubCloud';
}

export async function expandMovieButton(url, hint = {}) {
  try {
    const response = await fetch(url, { headers: HEADERS });
    const html = await response.text();
    if (/search-recover\.php/i.test(response.url || url)) {
      const query = html.match(/Q_INITIAL\s*=\s*"([^"]+)"/)?.[1];
      const token = html.match(/FROM_AC_TOKEN\s*=\s*"([^"]+)"/)?.[1];
      if (!query || !token) return [];
      const endpoint = (response.url || url).split('?')[0];
      const pageNumbers = hint.season && hint.episode ? [1, 2, 3, 4, 5] : [1];
      const payloads = await Promise.all(pageNumbers.map(page => {
        const params = new URLSearchParams({ api: 'search', q: query, page: String(page), from_ac: token });
        return fetch(`${endpoint}?${params}`, { headers: { ...HEADERS, Accept: 'application/json' } })
          .then(r => r.json()).catch(() => ({ hits: [] }));
      }));
      const hits = payloads.flatMap(data => data.hits || []);
      const words = query.toLowerCase().replace(/\b(download|19\d{2}|20\d{2}|2160p|1080p|720p|480p)\b/g, '').split(/\W+/).filter(w => w.length > 2);
      return hits.filter(hit => {
        const name = String(hit.file_name || '');
        const normalized = name.toLowerCase();
        if (!words.every(word => normalized.includes(word)) || /\.zip(?:$|\?)/i.test(name)) return false;
        if (!hint.season || !hint.episode) return true;
        const season = Number(hint.season);
        const episode = Number(hint.episode);
        const seasonMatch = new RegExp(`(?:s|season[ ._-]*)0?${season}(?:\\D|$)`, 'i').test(name);
        const episodeMatch = new RegExp(`(?:e|ep|episode[ ._-]*)0?${episode}(?:\\D|$)`, 'i').test(name);
        const compactMatch = new RegExp(`(?:^|\\D)${season}x0?${episode}(?:\\D|$)`, 'i').test(name);
        return (seasonMatch && episodeMatch) || compactMatch;
      }).map(hit => hit.url).filter((link, index, all) => link && all.indexOf(link) === index);
    }
    const $ = cheerio.load(html);
    const hosts = $('a[href]').map((_, anchor) => $(anchor).attr('href')).get().filter(href => /hubcloud/i.test(href || ''));
    return hosts.length ? hosts : [response.url || url];
  } catch (_) { return []; }
}

export async function extractHubCloud(url, referer) {
  try {
    let currentUrl = url.replace('hubcloud.foo', 'hubcloud.cx').replace('hubcloud.ink', 'hubcloud.dad');
    let response = await fetch(currentUrl, { headers: { ...HEADERS, Referer: referer } });
    let html = await response.text();
    let pageUrl = response.url || currentUrl;
    let $ = cheerio.load(html);
    const generate = $('a[href*="hubcloud.php"]').first().attr('href') || $('#download').attr('href') || html.match(/var url = '([^']+)'/)?.[1];
    if (generate) {
      const next = absoluteUrl(generate, pageUrl);
      if (next) {
        response = await fetch(next, { headers: { ...HEADERS, Referer: pageUrl } });
        html = await response.text();
        pageUrl = response.url || next;
        $ = cheerio.load(html);
      }
    }
    const header = $('div.card-header').text().trim() || $('title').text().trim();
    const size = parseSize($('i#size').text());
    const quality = parseQuality(header);
    const buttons = $('a.btn[href]').map((_, element) => {
      const link = $(element).attr('href');
      const text = $(element).text().toLowerCase();
      if (!link || !/(download file|download\s*\[server|fsl|buzzserver|pixeldra|pixelserver|pixel server|s3 server|mega server|pdl server)/i.test(text)) return null;
      if (/workers\.dev/i.test(link) && /download file/i.test(text)) return null;
      return { link: absoluteUrl(link, pageUrl), text };
    }).get().filter(Boolean);
    const streams = await Promise.all(buttons.map(async button => {
      let link = button.link;
      // Phisher's original Pixel path converts /u/{id} share pages into the
      // host's direct /api/file/{id}?download endpoint without pre-validating it.
      if (/pixeldra|pixelserver|pixel server/i.test(button.text)) {
        try {
          const parsed = new URL(link);
          const id = parsed.pathname.split('/').filter(Boolean).pop();
          if (!/download/i.test(link) && id) link = `${parsed.origin}/api/file/${id}?download`;
        } catch (_) { return null; }
      } else if (/gpdl\.|download\s*\[server\s*:\s*10gbps/i.test(`${button.link} ${button.text}`)) {
        try {
          const gateway = await fetch(link, { redirect: 'manual', headers: { ...HEADERS, Referer: pageUrl } });
          const worker = absoluteUrl(gateway.headers?.get?.('location'), link);
          if (!worker) return null;
          const generated = await fetch(worker, { redirect: 'manual', headers: { ...HEADERS, Referer: link } });
          const wrapper = absoluteUrl(generated.headers?.get?.('location'), worker);
          if (!wrapper) return null;
          link = new URL(wrapper).searchParams.get('link');
          if (!link) return null;
        } catch (_) { return null; }
      } else if (/buzzserver/i.test(button.text)) {
        try {
          const response = await fetch(link, { redirect: 'manual', headers: { ...HEADERS, Referer: pageUrl } });
          link = absoluteUrl(response.headers?.get?.('hx-redirect') || response.headers?.get?.('location'), link);
          if (!link) return null;
        } catch (_) { return null; }
      }
      return {
        source: hubCloudServer(button.text, button.link),
        title: [quality, size].filter(Boolean).join(' • '),
        url: safeUrl(link),
        quality,
        size,
        headers: { ...HEADERS, Referer: pageUrl },
        subtitles: []
      };
    }));
    return streams.filter(Boolean);
  } catch (_) { return []; }
}

async function extractGdflix(url, referer, hint = {}) {
  const makeStream = (source, link, quality, size, pageUrl, headers = {}) => ({
    source,
    title: [quality, size].filter(Boolean).join(' • '),
    url: safeUrl(link),
    quality,
    size,
    headers: { ...HEADERS, Referer: pageUrl, ...headers },
    subtitles: []
  });

  const metaRefreshUrl = (html, base) => {
    const $ = cheerio.load(html || '');
    const content = $('meta[http-equiv="refresh"]').first().attr('content') || '';
    const target = content.match(/url\s*=\s*["']?([^"';]+)/i)?.[1]?.trim();
    return target ? absoluteUrl(target, base) : null;
  };

  const extractGofile = async (link, quality, size, pageUrl) => {
    try {
      const id = link.match(/(?:[?&]c=|\/d\/)([a-zA-Z0-9-]+)/)?.[1];
      if (!id) return [];
      const account = await fetch('https://api.gofile.io/accounts', {
        method: 'POST', headers: { ...HEADERS, Accept: 'application/json' }
      }).then(response => response.json());
      const token = account?.data?.token;
      if (!token) return [];
      const globalJs = await fetch('https://gofile.io/dist/js/global.js', { headers: HEADERS }).then(response => response.text());
      const wt = globalJs.match(/appdata\.wt\s*=\s*["']([^"']+)/)?.[1];
      if (!wt) return [];
      const data = await fetch(`https://api.gofile.io/contents/${id}?wt=${encodeURIComponent(wt)}`, {
        headers: { ...HEADERS, Accept: 'application/json', Authorization: `Bearer ${token}` }
      }).then(response => response.json());
      const children = Object.values(data?.data?.children || {});
      return children.filter(file => file?.link).map(file => makeStream(
        'GDFlix GoFile', file.link, parseQuality(file.name) === 'Unknown' ? quality : parseQuality(file.name),
        parseSize(file.name) || size, pageUrl, { Cookie: `accountToken=${token}` }
      ));
    } catch (_) { return []; }
  };

  try {
    // Phisher first resolves the meta-refresh/HTTP redirect and then scrapes the
    // download buttons. Manual redirect keeps the Location header available in JS.
    const first = await fetch(url, { redirect: 'manual', headers: { ...HEADERS, Referer: referer } });
    const firstHtml = await first.text();
    const redirected = absoluteUrl(first.headers?.get?.('location'), url) || metaRefreshUrl(firstHtml, url);
    const id = url.match(/\/(?:w?file)\/([^/?#]+)/i)?.[1];
    const pageCandidates = [...new Set([
      redirected,
      first.ok && !redirected ? (first.url || url) : null,
      id ? `https://new3.gdflix.cfd/file/${id}` : null,
      id ? `https://new2.gdflix.cfd/file/${id}` : null
    ].filter(Boolean))];

    const pages = await Promise.all(pageCandidates.map(async pageUrl => {
      try {
        if (pageUrl === (first.url || url) && first.ok && !redirected) return { html: firstHtml, pageUrl };
        const response = await fetch(pageUrl, { headers: { ...HEADERS, Referer: url } });
        return response.ok ? { html: await response.text(), pageUrl: response.url || pageUrl } : null;
      } catch (_) { return null; }
    }));

    const results = [];
    for (const page of pages.filter(Boolean)) {
      const $ = cheerio.load(page.html);
      const details = $('ul > li.list-group-item').text() || $('li').text() || $('title').text();
      const detectedQuality = parseQuality(details);
      const quality = detectedQuality === 'Unknown' ? (hint.quality || '1080p') : detectedQuality;
      const size = parseSize(details) || hint.size;
      const buttons = [];
      $('div.text-center a[href], a.btn[href]').each((_, element) => {
        buttons.push({ text: $(element).text().trim(), link: absoluteUrl($(element).attr('href'), page.pageUrl) });
      });
      // Retired cfd domains currently return an ad-redirect shell. Do not spend
      // more requests on its fake markup or expose it as a CF/media result.
      if (!/list-group-item|direct\s*dl|instant\s*dl|gofile|pixeldra|pixelserver/i.test(page.html)) continue;

      for (const button of buttons) {
        if (!button.link) continue;
        if (/direct\s*dl/i.test(button.text)) {
          results.push(makeStream('GDFlix Direct', button.link, quality, size, page.pageUrl));
        } else if (/instant\s*dl/i.test(button.text)) {
          try {
            const instant = await fetch(button.link, { redirect: 'manual', headers: { ...HEADERS, Referer: page.pageUrl } });
            const location = instant.headers?.get?.('location') || instant.url;
            const direct = location?.match(/[?&]url=([^&]+)/i)?.[1];
            const resolved = direct ? decodeURIComponent(direct) : location;
            if (resolved && resolved !== button.link) results.push(makeStream('GDFlix Instant Download', resolved, quality, size, page.pageUrl));
          } catch (_) {}
        } else if (/gofile/i.test(button.text)) {
          results.push(...await extractGofile(button.link, quality, size, page.pageUrl));
        } else if (/pixeldra|pixelserver|\bpixel\b/i.test(button.text)) {
          const pixelUrl = /\/download(?:[/?#]|$)/i.test(button.link)
            ? button.link
            : `${new URL(button.link).origin}/api/file/${button.link.split('/').filter(Boolean).pop()}?download`;
          results.push(makeStream('GDFlix Pixeldrain', pixelUrl, quality, size, page.pageUrl));
        }
      }

      // Phisher additionally checks wfile?type=1 and type=2 for CF mirrors.
      const cfBase = page.pageUrl.replace('/file/', '/wfile/').replace(/\?.*$/, '');
      const cfPages = await Promise.all(['type=1', 'type=2'].map(async query => {
        try {
          const cfUrl = `${cfBase}?${query}`;
          const response = await fetch(cfUrl, { headers: { ...HEADERS, Referer: page.pageUrl } });
          return response.ok ? { html: await response.text(), url: response.url || cfUrl } : null;
        } catch (_) { return null; }
      }));
      for (const cfPage of cfPages.filter(Boolean)) {
        const $$ = cheerio.load(cfPage.html);
        const link = absoluteUrl($$('a.btn-success[href]').first().attr('href'), cfPage.url);
        if (link) results.push(makeStream('GDFlix CF', link, quality, size, cfPage.url));
      }
    }
    if (results.length) return results;
  } catch (_) {}

  // Phisher does not return the GDFlix HTML page as a stream. Returning an
  // empty result here keeps Nuvio from trying to play a Cloudflare/web page.
  return [];
}

export function extractHost(url, referer, hint = {}) {
  return /gdflix|gdlink/i.test(url) ? extractGdflix(url, referer, hint) : extractHubCloud(url, referer);
}

export function sortAndUnique(streams) {
  const rank = { '4K': 2160, '1080p': 1080, '720p': 720, '480p': 480, '360p': 360, '240p': 240 };
  const order = { '4K': '01', '1080p': '02', '720p': '03', '480p': '04', '360p': '05', '240p': '06' };
  const seen = new Set();
  return streams.filter(stream => {
    if (!stream || !stream.url || stream.quality === 'Unknown') return false;
    // The source can reuse one Pixel URL under multiple quality entries.
    // Preserve those Phisher callbacks while still removing true duplicates.
    const key = `${stream.quality}|${stream.source || ''}|${stream.url}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  })
    .sort((a, b) => (rank[b.quality] || 0) - (rank[a.quality] || 0))
    .map(stream => ({
      ...stream,
      name: `${order[stream.quality] || '99'} • MoviesDrive • ${stream.quality} • ${stream.source || 'Direct'}`
    }));
}
