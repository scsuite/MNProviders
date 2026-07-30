const { absoluteUrl, parseHtml } = require('../shared/html');
const { getJson, getText, withReferer } = require('../shared/http');
const { getMediaInfo } = require('../shared/media');
const { bestTitleMatch } = require('../shared/matching');
const { parseMediaAttributes, resolveFinalUrl, uniqueStreams } = require('../shared/streams');

const DOMAINS_URL = 'https://raw.githubusercontent.com/phisher98/TVVVV/refs/heads/main/domains.json';
const FALLBACK_URL = 'https://4khdhub.one';
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36';

async function getBaseUrl() {
  try { return (await getJson(DOMAINS_URL, { retries: 0 }))['4khdhub'] || FALLBACK_URL; }
  catch (_) { return FALLBACK_URL; }
}

async function resolveDownload(url, referer, label) {
  const headers = withReferer({ 'User-Agent': USER_AGENT }, referer);
  const firstDoc = parseHtml(await getText(url, { headers }).catch(() => ''));
  const next = absoluteUrl(firstDoc('#download').attr('href'), url);
  const candidates = next ? [next] : [url];
  if (next) {
    const nextDoc = parseHtml(await getText(next, { headers: withReferer(headers, url) }).catch(() => ''));
    nextDoc('a.btn, a[href]').each((_, item) => {
      const href = absoluteUrl(nextDoc(item).attr('href'), next);
      if (href && candidates.length < 3) candidates.push(href);
    });
  }
  for (const candidate of candidates.slice(0, 3)) {
    const finalUrl = await resolveFinalUrl(candidate, { headers: withReferer(headers, next || url) }).catch(() => null);
    if (finalUrl) return { url: finalUrl, headers: withReferer(headers, next || url), ...parseMediaAttributes(label, finalUrl) };
  }
  return null;
}

async function getStreams(tmdbId, mediaType, season = 1, episode = 1) {
  try {
    const baseUrl = await getBaseUrl();
    const headers = withReferer({ 'User-Agent': USER_AGENT }, `${baseUrl}/`);
    const { title } = await getMediaInfo(tmdbId, mediaType);
    const searchDoc = parseHtml(await getText(`${baseUrl}/?s=${encodeURIComponent(title)}`, { headers }));
    const results = searchDoc('div.card-grid a, article a').toArray().map((item) => ({
      title: searchDoc(item).find('h2, h3').first().text().trim() || searchDoc(item).attr('title'),
      url: absoluteUrl(searchDoc(item).attr('href'), baseUrl)
    })).filter((item) => item.url);
    const match = bestTitleMatch(results, title) || results[0];
    if (!match) return [];
    const pageDoc = parseHtml(await getText(match.url, { headers }));
    const links = [];
    if (mediaType === 'tv') {
      pageDoc('div.episode-download-item').each((_, item) => {
        const label = pageDoc(item).text().replace(/\s+/g, ' ').trim();
        const marker = label.match(/S(?:eason)?[- ]?0*(\d+).*?E(?:pisode)?[- ]?0*(\d+)/i) || label.match(/Episode[- ]?0*(\d+)/i);
        const matches = marker && (marker.length === 3
          ? Number(marker[1]) === Number(season) && Number(marker[2]) === Number(episode)
          : Number(marker[1]) === Number(episode));
        if (matches) pageDoc(item).find('a').each((__, anchor) => links.push({ url: absoluteUrl(pageDoc(anchor).attr('href'), match.url), label }));
      });
    } else {
      pageDoc('div.download-item a').each((_, item) => links.push({ url: absoluteUrl(pageDoc(item).attr('href'), match.url), label: pageDoc(item).closest('.download-item').text().replace(/\s+/g, ' ').trim() }));
    }
    const streams = [];
    for (const link of links.filter((item) => item.url).slice(0, 3)) {
      const resolved = await resolveDownload(link.url, match.url, link.label);
      if (resolved) streams.push({ ...resolved, title: `4KHDHub [${link.label || 'Stream'}]`, label: link.label, subtitles: [] });
    }
    return uniqueStreams(streams);
  } catch (error) {
    console.error('[4KHDHub]', error.message || error);
    return [];
  }
}

module.exports = { getStreams };
