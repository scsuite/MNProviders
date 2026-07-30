const { absoluteUrl, decodeBase64, parseHtml } = require('../shared/html');
const { getText, withReferer } = require('../shared/http');
const { getMediaInfo } = require('../shared/media');
const { bestTitleMatch, matchesEpisode } = require('../shared/matching');
const { parseQuality, resolveFinalUrl, uniqueStreams } = require('../shared/streams');

const BASE_URL = 'https://animekhor.org';
const HEADERS = withReferer({
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36'
}, `${BASE_URL}/`);

async function getStreams(tmdbId, mediaType, season = 1, episode = 1) {
  try {
    const { title } = await getMediaInfo(tmdbId, mediaType);
    if (!title) return [];
    const searchHtml = await getText(`${BASE_URL}/page/1/?s=${encodeURIComponent(title)}`, { headers: HEADERS });
    const $ = parseHtml(searchHtml);
    const results = $('div.listupd > article').toArray().map((element) => ({
      title: $(element).find('.tt, h2, h3').first().text().trim() || $(element).find('a').attr('title'),
      url: absoluteUrl($(element).find('div.bsx > a').attr('href'), BASE_URL)
    })).filter((item) => item.url);
    const match = bestTitleMatch(results, title) || results[0];
    if (!match) return [];

    const animeHtml = await getText(match.url, { headers: HEADERS });
    const animeDoc = parseHtml(animeHtml);
    const episodeItems = animeDoc('.eplister li > a').toArray();
    let episodeUrl;
    if (mediaType === 'movie' || animeDoc('.spe').text().toLowerCase().includes('movie')) {
      episodeUrl = absoluteUrl(animeDoc('.eplister li > a').first().attr('href'), match.url) || match.url;
    } else {
      const wanted = Number(episode) || 1;
      const item = episodeItems.find((element) => matchesEpisode(animeDoc(element).text(), wanted));
      episodeUrl = absoluteUrl(animeDoc(item || episodeItems[episodeItems.length - 1]).attr('href'), match.url);
    }
    if (!episodeUrl) return [];

    const epHtml = await getText(episodeUrl, { headers: withReferer(HEADERS, match.url) });
    const epDoc = parseHtml(epHtml);
    const candidates = [];
    epDoc('.mobius option').each((_, option) => {
      try {
        const decoded = decodeBase64(epDoc(option).attr('value'));
        const src = decoded.match(/src=["']([^"']+)["']/i)?.[1];
        const url = absoluteUrl(src, episodeUrl);
        if (url) candidates.push(url);
      } catch (_) {}
    });

    const streams = [];
    for (const candidate of candidates) {
      const finalUrl = await resolveFinalUrl(candidate, { headers: withReferer(HEADERS, episodeUrl) }).catch(() => null);
      if (finalUrl) streams.push({ url: finalUrl, quality: parseQuality(finalUrl), title: 'Animekhor', headers: withReferer(HEADERS, candidate), subtitles: [] });
    }
    return uniqueStreams(streams);
  } catch (error) {
    console.error('[Animekhor]', error.message || error);
    return [];
  }
}

module.exports = { getStreams };
