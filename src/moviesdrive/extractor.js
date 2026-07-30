import cheerio from 'cheerio-without-node-native';
import { HEADERS } from './constants.js';

function absoluteUrl(value, base) {
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
  if (/fslv2/.test(value)) return 'HubCloud FSLv2';
  if (/fsl/.test(value)) return 'HubCloud FSL';
  if (/s3 server/.test(value)) return 'HubCloud S3';
  if (/mega server/.test(value)) return 'HubCloud Mega';
  if (/pixeldrain/.test(value)) return 'HubCloud Pixeldrain';
  if (/workers\.dev|download file/.test(value)) return 'HubCloud Direct';
  return 'HubCloud';
}

export async function expandMovieButton(url) {
  try {
    const response = await fetch(url, { headers: HEADERS });
    const html = await response.text();
    if (/search-recover\.php/i.test(response.url || url)) {
      const query = html.match(/Q_INITIAL\s*=\s*"([^"]+)"/)?.[1];
      const token = html.match(/FROM_AC_TOKEN\s*=\s*"([^"]+)"/)?.[1];
      if (!query || !token) return [];
      const endpoint = (response.url || url).split('?')[0];
      const params = new URLSearchParams({ api: 'search', q: query, page: '1', from_ac: token });
      const data = await fetch(`${endpoint}?${params}`, { headers: { ...HEADERS, Accept: 'application/json' } }).then(r => r.json());
      const words = query.toLowerCase().replace(/\b(download|19\d{2}|20\d{2}|2160p|1080p|720p|480p)\b/g, '').split(/\W+/).filter(w => w.length > 2);
      return (data.hits || []).filter(hit => words.every(word => String(hit.file_name || '').toLowerCase().includes(word))).map(hit => hit.url).filter(Boolean);
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
    return $('a.btn[href]').map((_, element) => {
      const link = $(element).attr('href');
      const text = $(element).text().toLowerCase();
      if (!link || !/(download file|fsl|s3 server|mega server)/i.test(text)) return null;
      return {
        source: hubCloudServer(text, link),
        title: [quality, size].filter(Boolean).join(' • '),
        url: safeUrl(absoluteUrl(link, pageUrl)),
        quality,
        size,
        headers: { ...HEADERS, Referer: pageUrl },
        subtitles: []
      };
    }).get().filter(Boolean);
  } catch (_) { return []; }
}

async function extractGdflix(url, referer, hint = {}) {
  try {
    let response = await fetch(url, { headers: { ...HEADERS, Referer: referer } });
    if (!response.ok) throw new Error(`GDFlix HTTP ${response.status}`);
    let html = await response.text();
    let pageUrl = response.url || url;
    const redirect = html.match(/(?:location\.replace\(|url=)["']?([^"')>\s]+)/i)?.[1];
    if (redirect) {
      const next = absoluteUrl(redirect, pageUrl);
      if (next) {
        response = await fetch(next, { headers: { ...HEADERS, Referer: pageUrl } });
        if (!response.ok) return [];
        html = await response.text();
        pageUrl = response.url || next;
      }
    }
    const $ = cheerio.load(html);
    const header = $('li').text() || $('title').text();
    const quality = parseQuality(header) === 'Unknown' ? hint.quality : parseQuality(header);
    const size = parseSize(header) || hint.size;
    const results = [];
    $('a[href]').each((_, element) => {
      const text = $(element).text().trim();
      const link = absoluteUrl($(element).attr('href'), pageUrl);
      if (!link || !/(direct|instant|index|drivebot|gofile|pixel)/i.test(text)) return;
      // A GDFlix HTML/file page is not a playable stream. Only emit URLs that
      // are already direct media/CDN routes; Cloudflare-blocked pages stay hidden.
      if (!/(googleusercontent\.com|workers\.dev|r2\.dev|pixeldrain\.com\/api\/file|[?&]export=download|\.(?:mkv|mp4|m3u8)(?:[?#]|$))/i.test(link)) return;
      results.push({
        source: `GDFlix ${text || 'Direct'}`.trim(),
        title: [quality, size].filter(Boolean).join(' • '),
        url: safeUrl(link),
        quality,
        size,
        headers: { ...HEADERS, Referer: pageUrl },
        subtitles: []
      });
    });
    if (results.length) return results;
  } catch (_) {}

  // Yoruix-compatible fallback: expose the original GDFlix page when its
  // Cloudflare-protected direct resolver is unavailable. This is labelled as
  // a web link so it cannot be mistaken for HubCloud's verified direct CDN.
  return [{
    source: 'GDFlix Web Link',
    title: [hint.quality, hint.size].filter(Boolean).join(' • '),
    url,
    quality: hint.quality || '1080p',
    size: hint.size,
    headers: { ...HEADERS, Referer: referer },
    subtitles: []
  }];
}

export function extractHost(url, referer, hint = {}) {
  return /gdflix|gdlink/i.test(url) ? extractGdflix(url, referer, hint) : extractHubCloud(url, referer);
}

export function sortAndUnique(streams) {
  const rank = { '4K': 2160, '1080p': 1080, '720p': 720, '480p': 480, '360p': 360, '240p': 240 };
  const order = { '4K': '01', '1080p': '02', '720p': '03', '480p': '04', '360p': '05', '240p': '06' };
  const seen = new Set();
  return streams.filter(stream => stream && stream.url && stream.quality !== 'Unknown' && !seen.has(stream.url) && seen.add(stream.url))
    .sort((a, b) => (rank[b.quality] || 0) - (rank[a.quality] || 0))
    .map(stream => ({
      ...stream,
      name: `${order[stream.quality] || '99'} • MoviesDrive • ${stream.quality} • ${stream.source || 'Direct'}`
    }));
}
