const { absoluteUrl, parseHtml } = require('../shared/html');
const { getText, withReferer } = require('../shared/http');
const { resolveFinalUrl, uniqueStreams } = require('../shared/streams');

const BASE_URL = 'https://onepace.co';
const SERIES_URL = `${BASE_URL}/series/one-pace-english-sub/`;
const HEADERS = withReferer({
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36'
}, `${BASE_URL}/`);

async function getStreams(tmdbId, mediaType, season = 1, episode = 1) {
  try {
    // One Pace has one fixed catalogue; tmdbId/mediaType are accepted for the Nuvio contract.
    const document = parseHtml(await getText(SERIES_URL, { headers: HEADERS }));
    const wantedSeason = Number(season) || 1;
    const wantedEpisode = Number(episode) || 1;
    const episodeItem = document('ul.seasons-lst.anm-a li').toArray().find((item) => {
      const label = document(item).find('h3.title > span').text();
      const match = label.match(/S(\d+)\s*[-–]?\s*E(\d+)/i);
      return match && Number(match[1]) === wantedSeason && Number(match[2]) === wantedEpisode;
    });
    const episodeUrl = absoluteUrl(document(episodeItem).find('a').attr('href'), SERIES_URL);
    if (!episodeUrl) return [];

    const episodeHtml = await getText(episodeUrl, { headers: withReferer(HEADERS, SERIES_URL) });
    const episodeDoc = parseHtml(episodeHtml);
    const id = (episodeDoc('body').attr('class') || '').match(/(?:term|postid)-(\d+)/)?.[1];
    if (!id) return [];

    const streams = [];
    for (let slot = 0; slot <= 7; slot += 1) {
      const slotUrl = `${BASE_URL}/?trdekho=${slot}&trid=${id}&trtype=2`;
      const slotDoc = parseHtml(await getText(slotUrl, { headers: withReferer(HEADERS, episodeUrl) }).catch(() => ''));
      const embedUrl = absoluteUrl(slotDoc('iframe').attr('src'), slotUrl);
      if (!embedUrl) continue;
      const requestHeaders = withReferer(HEADERS, slotUrl);
      const finalUrl = await resolveFinalUrl(embedUrl, { headers: requestHeaders }).catch(() => null);
      if (finalUrl) streams.push({
        url: finalUrl,
        quality: 'Unknown',
        title: `OnePace [Server ${slot + 1}]`,
        headers: requestHeaders,
        subtitles: []
      });
    }
    return uniqueStreams(streams);
  } catch (error) {
    console.error('[OnePace]', error.message || error);
    return [];
  }
}

module.exports = { getStreams };
