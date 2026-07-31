const TMDB_API = 'https://api.themoviedb.org/3';
const { resolveVCloud } = require('./vcloud');
const { mapConcurrent, uniqueExactStreams } = require('../shared/streams');
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

function cleanText(value) {
  return String(value || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function headingBlocks(html) {
  const blocks = [];
  const regex = /<(h[3-5])\b[^>]*>([\s\S]*?)<\/\1>([\s\S]*?)(?=<h[3-5]\b|$)/gi;
  let match;
  while ((match = regex.exec(html))) blocks.push({ heading: cleanText(match[2]), body: match[3] });
  return blocks;
}

function anchors(html, base) {
  const values = [];
  const regex = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = regex.exec(html))) {
    const url = absoluteUrl(match[1].replace(/&amp;/gi, '&'), base);
    if (url) values.push({ url, text: cleanText(match[2]) });
  }
  return values;
}

function movieReleaseLinks(html, base) {
  const links = [];
  for (const block of headingBlocks(html)) {
    for (const anchor of anchors(block.body, base)) {
      if (/nexdrive|dwd-button|download now/i.test(anchor.url + ' ' + anchor.text + ' ' + block.body)) {
        links.push({ url: anchor.url, label: block.heading });
      }
    }
  }
  return links;
}

function episodeReleaseLinks(html, base, season, episode) {
  const links = [];
  const seasonRegex = new RegExp(`season\\s*0?${season}(?:\\D|$)`, 'i');
  for (const block of headingBlocks(html)) {
    if (!seasonRegex.test(block.heading)) continue;
    for (const anchor of anchors(block.body, base)) {
      if (/(g-?direct|v-?cloud|single|download|nexdrive)/i.test(anchor.text + ' ' + anchor.url)) {
        links.push({ url: anchor.url, label: block.heading });
      }
    }
  }
  return links;
}

async function resolveFastdl(directPage, pageUrl) {
  try {
    const embed = await requestText(directPage, pageUrl);
    const match = embed.match(/(?:var\s+reurl\s*=\s*|['"])(?:https:\/\/fastdl\.[^/]+\/dl\.php\?link=)(https:\/\/video-downloads\.googleusercontent\.com\/[^'"\s<]+)/i);
    if (!match) return null;
    return { name: 'G-Direct (VLC)', url: match[1].replace(/&amp;/g, '&'), referer: directPage, compatibility: 'external' };
  } catch (_) { return null; }
}

function qualityFrom(label) {
  const match = String(label).match(/(2160|1080|720|480|360)p?/i);
  if (!match) return 'Unknown';
  return match[1] === '2160' ? '4K' : `${match[1]}p`;
}

async function discoverCandidates(tmdbId, mediaType, season, episode) {
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

    const candidateJobs = releases.map(async release => {
      try {
        const page = await requestText(release.url, base);
        let routes = [];
        if (mediaType === 'tv' && episode) {
          const episodeRegex = new RegExp(`episodes?\\s*:\\s*0?${episode}(?:\\D|$)`, 'i');
          for (const block of headingBlocks(page)) {
            if (!episodeRegex.test(block.heading)) continue;
            routes = anchors(block.body, release.url);
            break;
          }
        } else {
          routes = anchors(page, release.url);
        }
        const useful = routes.filter(item => /g-?direct|instant|fastdl|v-?cloud|resumable|vcloud\.zip/i.test(item.text + ' ' + item.url));
        const quality = qualityFrom(release.label);
        return useful.map(route => ({
          provider: 'vegamovies',
          source: /vcloud\.zip|v-?cloud|resumable/i.test(route.text + ' ' + route.url) ? 'VCloud' : 'FastDL',
          quality,
          url: route.url,
          label: release.label,
          referer: release.url,
          headers: { 'User-Agent': USER_AGENT, Referer: release.url },
          resolverType: /vcloud\.zip|v-?cloud|resumable/i.test(route.text + ' ' + route.url) ? 'vcloud' : 'fastdl'
        }));
      } catch (_) { return []; }
    });

    const candidatesList = await Promise.all(candidateJobs);
    return candidatesList.flat();
  } catch (error) {
    console.log(`[VegaMovies Candidates] ${error && error.message ? error.message : error}`);
    return [];
  }
}

async function resolveCandidate(candidate) {
  if (!candidate || !candidate.url) return [];
  try {
    if (candidate.resolverType === 'vcloud') {
      const resolved = await resolveVCloud(candidate.url, candidate.referer, candidate.label || candidate.quality);
      return (resolved.streams || []).map(stream => ({
        ...stream,
        quality: candidate.quality || stream.quality,
        provider: 'vegamovies',
        source: stream.name || 'VCloud',
        subtitles: []
      }));
    } else if (candidate.resolverType === 'fastdl') {
      const direct = await resolveFastdl(candidate.url, candidate.referer);
      if (!direct) return [];
      return [{
        name: `VegaMovies G-Direct - ${candidate.quality || 'Unknown'}`,
        title: candidate.label || 'VegaMovies Stream',
        url: direct.url,
        quality: candidate.quality || 'Unknown',
        headers: { 'User-Agent': USER_AGENT, Referer: candidate.referer },
        provider: 'vegamovies',
        source: 'FastDL',
        subtitles: []
      }];
    } else if (candidate.resolverType === 'direct') {
      return [{
        name: `VegaMovies Direct - ${candidate.quality || 'Unknown'}`,
        url: candidate.url,
        quality: candidate.quality || 'Unknown',
        headers: candidate.headers,
        provider: 'vegamovies',
        source: candidate.source || 'Direct',
        subtitles: []
      }];
    }
    return [];
  } catch (_) {
    return [];
  }
}

async function getStreams(tmdbId, mediaType, season, episode, options = {}) {
  try {
    const candidates = await discoverCandidates(tmdbId, mediaType, season, episode);
    const resolvedResults = await mapConcurrent(candidates, 4, resolveCandidate);
    const flat = resolvedResults.flat().filter(Boolean);
    return uniqueExactStreams(flat);
  } catch (error) {
    console.log(`[VegaMovies] ${error && error.message ? error.message : error}`);
    return [];
  }
}

module.exports = { discoverCandidates, resolveCandidate, getStreams };
