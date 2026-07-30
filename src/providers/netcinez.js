const { absoluteUrl, parseHtml } = require('../shared/html');
const { getText, withReferer } = require('../shared/http');
const { getMediaInfo } = require('../shared/media');
const { bestTitleMatch } = require('../shared/matching');
const { parseMediaAttributes, resolveFinalUrl, uniqueStreams } = require('../shared/streams');

const BASE_URL = 'https://netcinez.si';
const HEADERS = withReferer({ 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36' }, `${BASE_URL}/`);

async function finalStreamsFromPage(pageUrl, pageReferer) {
  const pageDoc = parseHtml(await getText(pageUrl, { headers: withReferer(HEADERS, pageReferer) }));
  const iframeUrl = absoluteUrl(pageDoc('#player-container iframe').attr('src') || pageDoc('#player-container iframe').attr('data-src'), pageUrl);
  if (!iframeUrl) return [];
  const iframeDoc = parseHtml(await getText(iframeUrl, { headers: withReferer(HEADERS, pageUrl) }));
  const buttons = iframeDoc('div.btn-container a').toArray();
  const streams = [];
  for (const button of buttons.slice(0, 8)) {
    const label = iframeDoc(button).text().replace(/\s+/g, ' ').trim();
    const intermediate = absoluteUrl(iframeDoc(button).attr('href'), iframeUrl);
    if (!intermediate) continue;
    const requestHeaders = withReferer(HEADERS, iframeUrl);
    const finalUrl = await resolveFinalUrl(intermediate, { headers: requestHeaders }).catch(() => null);
    if (finalUrl) streams.push({ url: finalUrl, title: `Netcinez [${label || 'Stream'}]`, label, headers: requestHeaders, subtitles: [], ...parseMediaAttributes(label, finalUrl) });
  }
  return uniqueStreams(streams);
}

async function getStreams(tmdbId, mediaType, season = 1, episode = 1) {
  try {
    const { title } = await getMediaInfo(tmdbId, mediaType);
    const searchDoc = parseHtml(await getText(`${BASE_URL}/?s=${encodeURIComponent(title)}`, { headers: HEADERS }));
    const results = searchDoc('#box_movies > div.movie, article, .result-item').toArray().map((item) => ({
      title: searchDoc(item).find('h2, h3').first().text().trim(),
      url: absoluteUrl(searchDoc(item).find('a').first().attr('href'), BASE_URL)
    })).filter((item) => item.url);
    const match = bestTitleMatch(results, title) || results[0];
    if (!match) return [];
    if (mediaType !== 'tv') return await finalStreamsFromPage(match.url, BASE_URL);
    const showDoc = parseHtml(await getText(match.url, { headers: HEADERS }));
    const wanted = `${Number(season) || 1}-${Number(episode) || 1}`;
    const episodeLink = showDoc('div.post #cssmenu li li a').toArray().find((item) => showDoc(item).find('.datex').text().trim() === wanted);
    const episodeUrl = absoluteUrl(showDoc(episodeLink).attr('href'), match.url);
    return episodeUrl ? await finalStreamsFromPage(episodeUrl, match.url) : [];
  } catch (error) {
    console.error('[Netcinez]', error.message || error);
    return [];
  }
}

module.exports = { getStreams };
