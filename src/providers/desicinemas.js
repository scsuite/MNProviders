const { absoluteUrl, parseHtml } = require('../shared/html');
const { getText, withReferer } = require('../shared/http');
const { getMediaInfo } = require('../shared/media');
const { bestTitleMatch } = require('../shared/matching');
const { parseMediaAttributes, resolveFinalUrl, uniqueStreams } = require('../shared/streams');

const BASE_URL = 'https://desicinemas.to';
const PROXY = 'https://desicinemas.phisherdesicinema.workers.dev/';
const HEADERS = withReferer({
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:139.0) Gecko/20100101 Firefox/139.0',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
}, BASE_URL);

const proxyUrl = (url) => `${PROXY}?url=${encodeURIComponent(url)}`;

async function getStreams(tmdbId, mediaType, season = 1, episode = 1) {
  try {
    const { title } = await getMediaInfo(tmdbId, mediaType);
    const searchDoc = parseHtml(await getText(proxyUrl(`${BASE_URL}/?s=${encodeURIComponent(title)}`), { headers: HEADERS }));
    const results = searchDoc('.MovieList li, .MovieList .TPostMv').toArray().map((item) => ({
      title: searchDoc(item).find('h2, h3').first().text().trim(),
      url: absoluteUrl(searchDoc(item).find('a').first().attr('href'), BASE_URL)
    })).filter((item) => item.url);
    const match = bestTitleMatch(results, title) || results[0];
    if (!match) return [];
    const pageDoc = parseHtml(await getText(proxyUrl(match.url), { headers: HEADERS }));
    const boxes = pageDoc('.MovieList .OptionBx, .OptionBx').toArray();
    const streams = [];
    for (const box of boxes) {
      const label = pageDoc(box).text().replace(/\s+/g, ' ').trim();
      if (mediaType === 'tv') {
        const marker = label.match(/S(?:eason)?\s*0*(\d+).*?E(?:pisode)?\s*0*(\d+)/i);
        if (marker && (Number(marker[1]) !== Number(season) || Number(marker[2]) !== Number(episode))) continue;
      }
      const pageUrl = absoluteUrl(pageDoc(box).find('a').attr('href'), match.url);
      if (!pageUrl) continue;
      const embedDoc = parseHtml(await getText(pageUrl, { headers: withReferer(HEADERS, match.url) }).catch(() => ''));
      const embedUrl = absoluteUrl(embedDoc('iframe').attr('src'), pageUrl);
      if (!embedUrl) continue;
      const requestHeaders = withReferer(HEADERS, pageUrl);
      const finalUrl = await resolveFinalUrl(embedUrl, { headers: requestHeaders }).catch(() => null);
      if (!finalUrl) continue;
      streams.push({ url: finalUrl, title: `Desicinemas [${label || 'Stream'}]`, label, headers: requestHeaders, subtitles: [], ...parseMediaAttributes(label, finalUrl) });
    }
    return uniqueStreams(streams);
  } catch (error) {
    console.error('[Desicinemas]', error.message || error);
    return [];
  }
}

module.exports = { getStreams };
