const { absoluteUrl, decodeBase64, parseHtml } = require('../shared/html');
const { getJson, getText, withReferer } = require('../shared/http');
const { getMediaInfo } = require('../shared/media');
const { bestTitleMatch } = require('../shared/matching');
const { parseQuality, resolveFinalUrl, uniqueStreams } = require('../shared/streams');

const BASE_URL = 'https://coflix.wales';
const API_URL = `${BASE_URL}/wp-json/apiflix/v1`;
const HEADERS = withReferer({
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36'
}, `${BASE_URL}/`);

async function getStreams(tmdbId, mediaType, season = 1, episode = 1) {
  try {
    const { title } = await getMediaInfo(tmdbId, mediaType, { headers: HEADERS });
    if (!title) return [];
    const search = await getJson(`${BASE_URL}/suggest.php?query=${encodeURIComponent(title)}`, { headers: HEADERS });
    const results = Array.isArray(search) ? search : [];
    const match = bestTitleMatch(results, title) || results[0];
    const pageUrl = absoluteUrl(match?.url, BASE_URL);
    if (!pageUrl) return [];

    const pageHtml = await getText(pageUrl, { headers: HEADERS });
    const $ = parseHtml(pageHtml);
    let streamPageUrl = pageUrl;
    if (mediaType === 'tv') {
      const seasonInput = $(`section.sc-seasons input[data-season="${Number(season) || 1}"]`).first();
      const postId = seasonInput.attr('post-id') || $('section.sc-seasons input[post-id]').first().attr('post-id');
      if (!postId) return [];
      const data = await getJson(`${API_URL}/series/${postId}/${Number(season) || 1}`, { headers: HEADERS });
      const target = (data.episodes || []).find((item) => Number(item.number) === (Number(episode) || 1));
      streamPageUrl = absoluteUrl(target?.links, pageUrl);
      if (!streamPageUrl) return [];
    }

    const streamHtml = await getText(streamPageUrl, { headers: withReferer(HEADERS, pageUrl) });
    const streamDoc = parseHtml(streamHtml);
    const iframeUrl = absoluteUrl(streamDoc('div.embed iframe').attr('src') || streamDoc('iframe').attr('src'), streamPageUrl);
    if (!iframeUrl) return [];
    const iframeHtml = await getText(iframeUrl, { headers: withReferer(HEADERS, streamPageUrl) });
    const iframeDoc = parseHtml(iframeHtml);
    const candidates = [];
    iframeDoc('li[onclick]').each((_, item) => {
      const encoded = (iframeDoc(item).attr('onclick') || '').match(/showVideo\(['"]([^'"]+)/)?.[1];
      try {
        const url = absoluteUrl(decodeBase64(encoded), iframeUrl);
        if (url) candidates.push({ url, label: iframeDoc(item).text().trim() });
      } catch (_) {}
    });

    const streams = [];
    for (const candidate of candidates) {
      const requestHeaders = withReferer(HEADERS, iframeUrl);
      const finalUrl = await resolveFinalUrl(candidate.url, { headers: requestHeaders }).catch(() => null);
      if (finalUrl) streams.push({ url: finalUrl, quality: parseQuality(finalUrl, candidate.label), title: `Coflix [${candidate.label || 'Stream'}]`, headers: requestHeaders, subtitles: [] });
    }
    return uniqueStreams(streams);
  } catch (error) {
    console.error('[Coflix]', error.message || error);
    return [];
  }
}

module.exports = { getStreams };
