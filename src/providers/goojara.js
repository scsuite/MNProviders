const { absoluteUrl, parseHtml } = require('../shared/html');
const { getText, request, withReferer } = require('../shared/http');
const { getMediaInfo } = require('../shared/media');
const { bestTitleMatch, matchesEpisode } = require('../shared/matching');
const { parseQuality, resolveFinalUrl, uniqueStreams } = require('../shared/streams');

const BASE_URL = 'https://ww1.goojara.to';
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:140.0) Gecko/20100101 Firefox/140.0',
  Accept: '*/*'
};

function responseCookie(response, html) {
  const setCookie = response.headers?.get?.('set-cookie') || '';
  const primary = setCookie.split(';')[0];
  const check = html.match(/_3chk\(\s*'([^']+)'\s*,\s*'([^']+)'/);
  return [primary, check ? `${check[1]}=${check[2]}` : ''].filter(Boolean).join('; ');
}

async function getStreams(tmdbId, mediaType, season = 1, episode = 1) {
  try {
    const { title } = await getMediaInfo(tmdbId, mediaType);
    if (!title) return [];
    const response = await request(`${BASE_URL}/xmre.php`, {
      method: 'POST',
      headers: withReferer({ ...HEADERS, 'Content-Type': 'application/x-www-form-urlencoded' }, BASE_URL),
      body: new URLSearchParams({ z: 'Mwxxa3Vnaw', x: 'b3716e05ff', q: title }).toString()
    });
    if (!response.ok) return [];
    const searchDoc = parseHtml(await response.text());
    const results = searchDoc('li a').toArray().map((item) => ({
      title: searchDoc(item).text().trim(),
      url: absoluteUrl(searchDoc(item).attr('href'), BASE_URL)
    })).filter((item) => item.url);
    const match = bestTitleMatch(results, title) || results[0];
    if (!match) return [];

    const matchDoc = parseHtml(await getText(match.url, { headers: withReferer(HEADERS, BASE_URL) }));
    const showUrl = absoluteUrl(matchDoc('div.snfo h1 a').attr('href'), match.url) || match.url;
    const showDoc = parseHtml(await getText(showUrl, { headers: withReferer(HEADERS, match.url) }));
    let targetUrl = showUrl;
    if (mediaType === 'tv') {
      const seasonLink = absoluteUrl(showDoc('#sesh a.ste').attr('href'), showUrl);
      if (!seasonLink) return [];
      const seasonUrl = seasonLink.replace(/([?&]s=)\d+/, `$1${Number(season) || 1}`);
      const seasonDoc = parseHtml(await getText(seasonUrl, { headers: withReferer(HEADERS, showUrl) }));
      const item = seasonDoc('div.seho').toArray().find((element) => matchesEpisode(seasonDoc(element).text(), Number(episode) || 1));
      targetUrl = absoluteUrl(seasonDoc(item).find('a').attr('href'), seasonUrl);
      if (!targetUrl) return [];
    }

    const playerResponse = await request(targetUrl, { headers: withReferer(HEADERS, showUrl) });
    if (!playerResponse.ok) return [];
    const playerHtml = await playerResponse.text();
    const playerDoc = parseHtml(playerHtml);
    const cookie = responseCookie(playerResponse, playerHtml);
    const streams = [];
    for (const element of playerDoc('#drl a').toArray()) {
      const link = absoluteUrl(playerDoc(element).attr('href'), targetUrl);
      if (!link) continue;
      const requestHeaders = withReferer({ ...HEADERS, Cookie: cookie }, targetUrl);
      const finalUrl = await resolveFinalUrl(link, { headers: requestHeaders }).catch(() => null);
      if (finalUrl) streams.push({ url: finalUrl, quality: parseQuality(finalUrl), title: 'Goojara', headers: requestHeaders, subtitles: [] });
    }
    return uniqueStreams(streams);
  } catch (error) {
    console.error('[Goojara]', error.message || error);
    return [];
  }
}

module.exports = { getStreams };
