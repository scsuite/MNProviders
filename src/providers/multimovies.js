const { absoluteUrl, parseHtml } = require('../shared/html');
const { getJson, getText, request, withReferer } = require('../shared/http');
const { getMediaInfo } = require('../shared/media');
const { bestTitleMatch } = require('../shared/matching');
const { parseMediaAttributes, resolveFinalUrl, uniqueStreams } = require('../shared/streams');

const DOMAINS_URL = 'https://raw.githubusercontent.com/phisher98/TVVVV/refs/heads/main/domains.json';
const FALLBACK_URL = 'https://multimovies.makeup';
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36';

async function getBaseUrl() {
  try { return (await getJson(DOMAINS_URL, { retries: 0 })).MultiMovies || FALLBACK_URL; }
  catch (_) { return FALLBACK_URL; }
}

async function playerCandidates(baseUrl, pageDoc, pageUrl) {
  const headers = withReferer({ 'User-Agent': USER_AGENT }, pageUrl);
  const candidates = [];
  for (const item of pageDoc('ul#playeroptionsul li').toArray().slice(0, 8)) {
    const post = pageDoc(item).attr('data-post');
    const nume = pageDoc(item).attr('data-nume');
    const type = pageDoc(item).attr('data-type');
    const label = pageDoc(item).text().replace(/\s+/g, ' ').trim();
    if (!post || !nume || /trailer/i.test(nume)) continue;
    const response = await request(`${baseUrl}/wp-admin/admin-ajax.php`, {
      method: 'POST', headers: { ...headers, 'Content-Type': 'application/x-www-form-urlencoded', 'X-Requested-With': 'XMLHttpRequest' },
      body: `action=doo_player_ajax&post=${encodeURIComponent(post)}&nume=${encodeURIComponent(nume)}&type=${encodeURIComponent(type || '')}`
    }).catch(() => null);
    if (!response?.ok) continue;
    const data = await response.json().catch(() => null);
    const embedHtml = data?.embed_url || '';
    const embedDoc = parseHtml(embedHtml);
    const embedUrl = absoluteUrl(embedDoc('iframe').attr('src') || embedHtml.replace(/^['"]|['"]$/g, ''), pageUrl);
    if (embedUrl && !/youtube/i.test(embedUrl)) candidates.push({ url: embedUrl, label, headers });
  }
  return candidates;
}

async function getStreams(tmdbId, mediaType, season = 1, episode = 1) {
  try {
    const baseUrl = await getBaseUrl();
    const headers = withReferer({ 'User-Agent': USER_AGENT }, `${baseUrl}/`);
    const { title } = await getMediaInfo(tmdbId, mediaType);
    const searchDoc = parseHtml(await getText(`${baseUrl}/?s=${encodeURIComponent(title)}`, { headers }));
    const results = searchDoc('div.result-item, article').toArray().map((item) => ({
      title: searchDoc(item).find('.title, h2, h3').first().text().trim(),
      url: absoluteUrl(searchDoc(item).find('a').first().attr('href'), baseUrl)
    })).filter((item) => item.url);
    const match = bestTitleMatch(results, title) || results[0];
    if (!match) return [];
    let pageUrl = match.url;
    let pageDoc = parseHtml(await getText(pageUrl, { headers }));
    if (mediaType === 'tv') {
      const episodeItems = pageDoc('#seasons ul.episodios li').toArray();
      const target = episodeItems.find((item) => {
        const text = pageDoc(item).text();
        const marker = text.match(/S(?:eason)?\s*0*(\d+).*?E(?:pisode)?\s*0*(\d+)/i);
        return marker && Number(marker[1]) === Number(season) && Number(marker[2]) === Number(episode);
      });
      pageUrl = absoluteUrl(pageDoc(target).find('a').attr('href'), match.url);
      if (!pageUrl) return [];
      pageDoc = parseHtml(await getText(pageUrl, { headers: withReferer(headers, match.url) }));
    }
    const candidates = await playerCandidates(baseUrl, pageDoc, pageUrl);
    const streams = [];
    for (const candidate of candidates) {
      const requestHeaders = withReferer(candidate.headers, pageUrl);
      const finalUrl = await resolveFinalUrl(candidate.url, { headers: requestHeaders }).catch(() => null);
      if (finalUrl) streams.push({ url: finalUrl, title: `MultiMovies [${candidate.label || 'Stream'}]`, label: candidate.label, headers: requestHeaders, subtitles: [], ...parseMediaAttributes(candidate.label, finalUrl) });
    }
    return uniqueStreams(streams);
  } catch (error) {
    console.error('[MultiMovies]', error.message || error);
    return [];
  }
}

module.exports = { getStreams };
