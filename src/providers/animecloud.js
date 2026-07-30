const { absoluteUrl, parseHtml } = require('../shared/html');
const { getJson, getText, withReferer } = require('../shared/http');
const { getMediaInfo } = require('../shared/media');
const { bestTitleMatch } = require('../shared/matching');
const { parseQuality, resolveFinalUrl, uniqueStreams } = require('../shared/streams');

const BASE_URL = 'https://fireani.me';
const HEADERS = withReferer({
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36'
}, `${BASE_URL}/`);

async function getStreams(tmdbId, mediaType, season = 1, episode = 1) {
  try {
    const { title } = await getMediaInfo(tmdbId, mediaType);
    if (!title) return [];
    const search = await getJson(`${BASE_URL}/api/anime/search?q=${encodeURIComponent(title)}`, { headers: HEADERS });
    const results = Array.isArray(search?.data) ? search.data : [];
    const match = bestTitleMatch(results, title, (item) => item.title || item.name || item.slug);
    if (!match?.slug) return [];

    const targetSeason = Number(season) === 0 ? 'Filme' : String(Number(season) || 1);
    const data = await getJson(`${BASE_URL}/api/anime/episode?slug=${encodeURIComponent(match.slug)}&season=${encodeURIComponent(targetSeason)}&episode=${Number(episode) || 1}`, { headers: HEADERS });
    const links = data?.data?.anime_episode_links || [];
    const streams = [];
    for (const link of links) {
      const pageUrl = absoluteUrl(link.link, BASE_URL);
      if (!pageUrl) continue;
      const pageHeaders = withReferer(HEADERS, BASE_URL);
      const finalUrl = await resolveFinalUrl(pageUrl, { headers: pageHeaders }).catch(() => null);
      if (!finalUrl) continue;
      streams.push({
        url: finalUrl,
        quality: parseQuality(finalUrl, link.quality),
        title: `AnimeCloud [${String(link.lang || 'Unknown').toUpperCase()}]`,
        headers: withReferer(HEADERS, pageUrl),
        subtitles: []
      });
    }
    return uniqueStreams(streams);
  } catch (error) {
    console.error('[AnimeCloud]', error.message || error);
    return [];
  }
}

module.exports = { getStreams };
