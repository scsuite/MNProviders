const cheerio = require('cheerio');

const TMDB_API = 'https://api.themoviedb.org/3';
const TMDB_KEY = '439c478a771f35c05022f9feabcca01c';
const DOMAINS_URL = 'https://raw.githubusercontent.com/phisher98/TVVVV/refs/heads/main/domains.json';
const VEGA_FALLBACK = 'https://vegamovies.catering';
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36';

async function requestText(url, referer) {
  let lastError;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await fetch(url, {
        redirect: 'follow',
        headers: {
          'User-Agent': USER_AGENT,
          Accept: 'text/html,application/json;q=0.9,*/*;q=0.8',
          ...(referer ? { Referer: referer } : {})
        }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
      return response.text();
    } catch (error) { lastError = error; }
  }
  throw lastError;
}

async function getMediaInfo(tmdbId, mediaType) {
  const endpoint = mediaType === 'tv' ? 'tv' : 'movie';
  const url = `${TMDB_API}/${endpoint}/${tmdbId}?api_key=${TMDB_KEY}&append_to_response=external_ids`;
  const data = JSON.parse(await requestText(url));
  return {
    title: mediaType === 'tv' ? data.name : data.title,
    year: Number(String(mediaType === 'tv' ? data.first_air_date : data.release_date).slice(0, 4)) || null,
    imdbId: data.imdb_id || (data.external_ids && data.external_ids.imdb_id) || null
  };
}

async function getVegaBase() {
  try {
    const domains = JSON.parse(await requestText(DOMAINS_URL));
    if (domains.vegamovies) return String(domains.vegamovies).replace(/\/$/, '');
  } catch (_) {}
  return VEGA_FALLBACK;
}

async function searchVega(base, query) {
  const data = JSON.parse(await requestText(`${base}/search.php?q=${encodeURIComponent(query)}`, base));
  return (data.hits || []).map(hit => hit && hit.document).filter(Boolean);
}

function chooseResult(results, media, mediaType) {
  const imdbMatch = results.find(item => media.imdbId && item.imdb_id === media.imdbId);
  if (imdbMatch) return imdbMatch;
  const title = String(media.title || '').toLowerCase();
  const year = String(media.year || '');
  return results.find(item => {
    const value = String(item.post_title || '').toLowerCase();
    return value.includes(title) && (!year || value.includes(year)) &&
      (mediaType !== 'tv' || /season|series|episode/i.test(value));
  }) || results[0];
}

function absoluteUrl(value, base) {
  if (!value) return null;
  const url = String(value).trim();
  if (/^https?:\/\//i.test(url)) return url;
  const origin = String(base || '').match(/^(https?:\/\/[^/]+)/i);
  if (!origin) return null;
  if (url.startsWith('/')) return origin[1] + url;
  return String(base).replace(/\/[^/]*$/, '/').replace(/\/$/, '/') + url.replace(/^\.\//, '');
}

function movieReleaseLinks(html, base) {
  const $ = cheerio.load(html);
  const links = [];
  $('button.dwd-button').each((_, button) => {
    const anchor = $(button).closest('a');
    const url = absoluteUrl(anchor.attr('href'), base);
    if (!url) return;
    const label = anchor.closest('p').prevAll('h3,h4,h5').first().text().replace(/\s+/g, ' ').trim();
    links.push({ url, label });
  });
  return links;
}

function episodeReleaseLinks(html, base, season, episode) {
  const $ = cheerio.load(html);
  const links = [];
  const seasonRegex = new RegExp(`season\\s*0?${season}(?:\\D|$)`, 'i');
  $('h3,h4,h5').each((_, heading) => {
    const label = $(heading).text().replace(/\s+/g, ' ').trim();
    if (!seasonRegex.test(label)) return;
    const container = $(heading).nextAll('p').first();
    container.find('a').each((__, anchor) => {
      const node = $(anchor);
      const url = absoluteUrl(node.attr('href'), base);
      if (url && /(g-?direct|v-?cloud|single|download)/i.test(node.text() + ' ' + url)) {
        links.push({ url, label });
      }
    });
  });
  return links;
}

async function resolveGDirect(pageUrl, base, episode) {
  const page = await requestText(pageUrl, base);
  const $ = cheerio.load(page);
  let directPage = null;
  if (episode) {
    const episodeRegex = new RegExp(`episodes?\\s*:\\s*0?${episode}(?:\\D|$)`, 'i');
    $('h3,h4,h5').each((_, heading) => {
      if (directPage || !episodeRegex.test($(heading).text())) return;
      const node = $(heading).nextAll('p').first().find('a').filter((__, anchor) => /g-?direct|instant/i.test($(anchor).text())).first();
      directPage = absoluteUrl(node.attr('href'), pageUrl);
    });
  } else {
    $('a').each((_, anchor) => {
      const node = $(anchor);
      if (!directPage && /g-?direct|instant/i.test(node.text())) directPage = absoluteUrl(node.attr('href'), pageUrl);
    });
  }
  if (!directPage) return null;
  const embed = await requestText(directPage, pageUrl);
  const match = embed.match(/(?:var\s+reurl\s*=\s*|['"])(?:https:\/\/fastdl\.[^/]+\/dl\.php\?link=)(https:\/\/video-downloads\.googleusercontent\.com\/[^'"\s<]+)/i);
  if (!match) return null;
  return { url: match[1].replace(/&amp;/g, '&'), referer: directPage };
}

function qualityFrom(label) {
  const match = String(label).match(/(2160|1080|720|480|360)p?/i);
  if (!match) return 'Unknown';
  return match[1] === '2160' ? '4K' : `${match[1]}p`;
}

async function getStreams(tmdbId, mediaType, season, episode) {
  if (!tmdbId || !['movie', 'tv'].includes(mediaType)) return [];
  if (mediaType === 'tv' && (!season || !episode)) return [];
  try {
    const [base, media] = await Promise.all([getVegaBase(), getMediaInfo(tmdbId, mediaType)]);
    let results = media.imdbId ? await searchVega(base, media.imdbId) : [];
    if (!results.length) results = await searchVega(base, media.title);
    const result = chooseResult(results, media, mediaType);
    if (!result || !result.permalink) return [];
    const detailUrl = absoluteUrl(result.permalink, base);
    const detail = await requestText(detailUrl, base);
    const releases = mediaType === 'movie'
      ? movieReleaseLinks(detail, base)
      : episodeReleaseLinks(detail, base, Number(season), Number(episode));
    const selected = releases.slice(0, 10);
    const resolved = await Promise.all(selected.map(async release => {
      try {
        const direct = await resolveGDirect(release.url, base, mediaType === 'tv' ? Number(episode) : null);
        if (!direct) return null;
        const quality = qualityFrom(release.label);
        return {
          name: `StreamPlay VegaMovies - ${quality}`,
          title: mediaType === 'tv' ? `${media.title} S${season}E${episode}` : media.title,
          url: direct.url,
          quality,
          headers: { 'User-Agent': USER_AGENT, Referer: direct.referer },
          provider: 'vegamovies',
          subtitles: []
        };
      } catch (_) { return null; }
    }));
    return resolved.filter(Boolean).filter((item, index, all) => all.findIndex(other => other.url === item.url) === index);
  } catch (error) {
    console.log(`[VegaMovies] ${error && error.message ? error.message : error}`);
    return [];
  }
}

module.exports = { getStreams };
