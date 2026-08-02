const cheerio = require('cheerio-without-node-native');
const DOMAINS = require('../config/domains');
const sharedMetadata = require('../shared/metadata');
const { mapConcurrent, parseMediaAttributes, parseQuality, uniqueExactStreams } = require('../shared/streams');

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36';
const HEADERS = {
  'User-Agent': USER_AGENT,
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9'
};

function clean(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function absolute(value, base) {
  try { return new URL(value, base).href; } catch (_) { return null; }
}

async function responseText(url, options = {}) {
  const response = await fetch(url, {
    redirect: 'follow',
    ...options,
    headers: { ...HEADERS, ...(options.headers || {}) }
  });
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
  return { response, html: await response.text() };
}

async function getBaseUrl() {
  try {
    const { html } = await responseText(DOMAINS.PHISHER_DOMAINS, { headers: { Accept: 'application/json' } });
    const domains = JSON.parse(html);
    if (domains.UHDMovies) return String(domains.UHDMovies).replace(/\/$/, '');
  } catch (_) {}
  return DOMAINS.UHDMOVIES_FALLBACK;
}

function normalizedTitle(value) {
  return clean(value).toLowerCase()
    .replace(/^download\s+/, '')
    .replace(/\b(?:19|20)\d{2}(?:\s*[-\u2013]\s*(?:19|20)\d{2})?\b/g, ' ')
    .replace(/\bseason\s*\d+(?:\s*[-\u2013]\s*\d+)?\b/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function catalogTitle(value) {
  return clean(value).replace(/^download\s+/i, '').split(/\(\s*(?:19|20)\d{2}/)[0].trim();
}

function yearMatchesResult(value, year) {
  if (!year) return true;
  const range = clean(value).match(/\b((?:19|20)\d{2})\s*[-\u2013]\s*((?:19|20)\d{2})\b/);
  if (range) return Number(year) >= Number(range[1]) && Number(year) <= Number(range[2]);
  const years = clean(value).match(/\b(?:19|20)\d{2}\b/g) || [];
  return !years.length || years.some(valueYear => Number(valueYear) === Number(year));
}

function resultSupportsSeason(value, season) {
  if (!season) return true;
  const text = clean(value);
  const range = text.match(/(?:season\s*|\bS)0*(\d+)\s*[-\u2013]\s*(?:season\s*|S)?0*(\d+)/i);
  if (range) return Number(season) >= Number(range[1]) && Number(season) <= Number(range[2]);
  const seasons = [...text.matchAll(/(?:season\s*|\bS)0*(\d+)/gi)].map(match => Number(match[1]));
  return !seasons.length || seasons.includes(Number(season));
}

function resultScore(result, metadata, mediaType, season) {
  const target = normalizedTitle(metadata.title);
  const candidate = normalizedTitle(catalogTitle(result.title));
  const targetWords = target.split(' ').filter(word => word && !/^(?:a|an|the)$/.test(word));
  const candidateWords = candidate.split(' ').filter(word => word && !/^(?:a|an|the)$/.test(word));
  const candidateSet = new Set(candidateWords);
  const commonWords = targetWords.filter(word => candidateSet.has(word)).length;
  const closeVariant = Math.min(targetWords.length, candidateWords.length) >= 2 &&
    commonWords / Math.min(targetWords.length, candidateWords.length) >= 0.8 &&
    commonWords / Math.max(targetWords.length, candidateWords.length) >= 0.6;
  let score = candidate === target ? 10
    : target.split(' ').length > 1 && candidate.startsWith(`${target} `) ? 7
      : closeVariant ? 6 : 0;
  if (!score) return 0;
  if (mediaType === 'movie' && !yearMatchesResult(result.title, metadata.year)) return 0;
  if (mediaType === 'tv' && !resultSupportsSeason(result.title, season)) return 0;
  if (metadata.year) score += 2;
  if (mediaType === 'tv' && /season|series|\bS\d+/i.test(result.title)) score += 1;
  return score;
}

function chooseResult(results, metadata, mediaType, season) {
  return (results || []).map(result => ({ result, score: resultScore(result, metadata, mediaType, season) }))
    .filter(item => item.score > 0).sort((a, b) => b.score - a.score)[0]?.result || null;
}

async function findDetailPage(base, metadata, mediaType, season) {
  const primary = metadata.title.replace(/:/g, '').replace(/\s*&\s*/g, ' and ');
  const withoutMiddleSubtitle = metadata.title.replace(/\s*[-\u2013\u2014]\s*[^:]+:\s*/g, ' ');
  const queries = [...new Set([primary, withoutMiddleSubtitle].map(clean).filter(Boolean))];
  let resultCount = 0;

  for (const query of queries) {
    const { response, html } = await responseText(`${base}/search/${encodeURIComponent(query)}`, {
      headers: { Referer: `${base}/` }
    });
    const $ = cheerio.load(html);
    const results = [];
    $('article.gridlove-post').each((_, article) => {
      let found = null;
      $(article).find('a[href*="/download-"]').each((__, anchor) => {
        if (found) return;
        const url = absolute($(anchor).attr('href'), response.url || base);
        const title = clean($(anchor).attr('title') || $(article).find('h1.sanket').text() || $(anchor).text());
        if (url && title) found = { title, url };
      });
      if (found && !results.some(item => item.url === found.url)) results.push(found);
    });
    if (!results.length) {
      $('a[href*="/download-"]').each((_, anchor) => {
        const url = absolute($(anchor).attr('href'), response.url || base);
        const title = clean($(anchor).attr('title') || $(anchor).text());
        if (url && title && !results.some(item => item.url === url)) results.push({ title, url });
      });
    }
    resultCount += results.length;
    const selected = chooseResult(results, metadata, mediaType, season);
    if (selected) return selected;
  }

  console.log(`[UHDMovies Search] No exact match for ${metadata.title} (${metadata.year || 'N/A'}) among ${resultCount} results`);
  return null;
}

function sizeFrom(value) {
  const match = clean(value).match(/\b\d+(?:\.\d+)?\s*(?:GB|MB)(?:\s*\/\s*E)?\b/i);
  return match ? match[0].replace(/\s+/g, ' ') : undefined;
}

function hasReleaseDescriptor(value) {
  return parseQuality(value) !== 'Unknown' && !!sizeFrom(value);
}

function cloudLinks($, element) {
  const links = [];
  $(element).find('a[href]').each((_, anchor) => {
    const url = $(anchor).attr('href');
    if (!/cloud\.unblockedgames\.world/i.test(url || '')) return;
    links.push({ label: clean($(anchor).text()), url });
  });
  return links;
}

function makeCandidate(route, descriptor, detailUrl) {
  const attributes = parseMediaAttributes(descriptor);
  return {
    provider: 'UHDMovies',
    source: 'DriveSeed Resume',
    url: route.url,
    label: route.label,
    descriptor,
    quality: attributes.quality,
    size: attributes.size || sizeFrom(descriptor),
    referer: detailUrl,
    headers: { ...HEADERS, Referer: detailUrl },
    resolverType: 'driveseed-sid'
  };
}

function parseMovieCandidates($, detailUrl) {
  const candidates = [];
  let descriptor = '';
  $('.entry-content p, .entry-content h2, .entry-content h3, .entry-content h4, .entry-content pre').each((_, element) => {
    const text = clean($(element).text());
    const links = cloudLinks($, element);
    if (!links.length && hasReleaseDescriptor(text)) descriptor = text;
    if (!descriptor) return;
    for (const route of links) {
      if (/^download\b/i.test(route.label)) candidates.push(makeCandidate(route, descriptor, detailUrl));
    }
  });
  return candidates;
}

function parseTvCandidates($, detailUrl, targetSeason, targetEpisode) {
  const candidates = [];
  let currentSeason = null;
  let descriptor = '';
  $('.entry-content p, .entry-content h2, .entry-content h3, .entry-content h4, .entry-content pre').each((_, element) => {
    const text = clean($(element).text());
    const seasonMatch = text.match(/\bseason\s*0*(\d+)\b/i);
    const links = cloudLinks($, element);
    // Nuvio's QuickJS Cheerio wrapper does not expose element.name. Season
    // headings are reliably identifiable as non-release rows with no links.
    if (seasonMatch && !links.length && !hasReleaseDescriptor(text)) {
      currentSeason = Number(seasonMatch[1]);
      descriptor = '';
      return;
    }
    if (!links.length && hasReleaseDescriptor(text)) {
      const descriptorSeason = text.match(/\bS0*(\d+)(?:E\d+|\b)/i)?.[1];
      const belongsToTarget = descriptorSeason
        ? Number(descriptorSeason) === Number(targetSeason)
        : currentSeason === Number(targetSeason);
      descriptor = belongsToTarget ? text : '';
    }
    if (!descriptor) return;
    const episodePattern = new RegExp(`^episode\\s*0*${Number(targetEpisode)}(?:\\D|$)`, 'i');
    for (const route of links) {
      if (episodePattern.test(route.label) && !/zip|pack/i.test(route.label)) {
        candidates.push(makeCandidate(route, descriptor, detailUrl));
      }
    }
  });
  return candidates;
}

function distinctCandidates(candidates) {
  const seen = new Set();
  return (candidates || []).filter(item => {
    const key = `${item.quality}|${item.source}|${item.url}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function discoverCandidates(tmdbId, mediaType, season = 1, episode = 1) {
  try {
    const type = mediaType === 'tv' ? 'tv' : 'movie';
    if (!tmdbId || (type === 'tv' && (!season || !episode))) return [];
    const [base, metadata] = await Promise.all([getBaseUrl(), sharedMetadata.getMetadata(tmdbId, type)]);
    if (!metadata?.title) return [];
    const result = await findDetailPage(base, metadata, type, season);
    if (!result?.url) return [];
    const { response, html } = await responseText(result.url, { headers: { Referer: base } });
    const $ = cheerio.load(html);
    const detailUrl = response.url || result.url;
    const candidates = type === 'tv'
      ? parseTvCandidates($, detailUrl, season, episode)
      : parseMovieCandidates($, detailUrl);
    if (!candidates.length) console.log(`[UHDMovies Candidates] No ${type === 'tv' ? `S${season}E${episode} ` : ''}release links on ${detailUrl}`);
    return distinctCandidates(candidates);
  } catch (error) {
    console.log(`[UHDMovies Candidates] ${error?.message || error}`);
    return [];
  }
}

async function postForm(url, values, referer) {
  return responseText(url, {
    method: 'POST',
    // Nuvio's native fetch bridge does not serialize URLSearchParams objects.
    // Pass the encoded string explicitly so form verification works in QuickJS.
    body: new URLSearchParams(values).toString(),
    headers: { Referer: referer, 'Content-Type': 'application/x-www-form-urlencoded' }
  });
}

async function resolveSid(url, referer) {
  const first = await responseText(url, { headers: { Referer: referer } });
  const $first = cheerio.load(first.html);
  const firstForm = $first('form#landing');
  const firstAction = absolute(firstForm.attr('action'), first.response.url || url);
  const wpHttp = firstForm.find('input[name="_wp_http"]').attr('value');
  if (!firstAction || !wpHttp) return null;

  const second = await postForm(firstAction, { _wp_http: wpHttp }, first.response.url || url);
  const $second = cheerio.load(second.html);
  const secondForm = $second('form#landing');
  const secondAction = absolute(secondForm.attr('action'), second.response.url || firstAction);
  const wpHttp2 = secondForm.find('input[name="_wp_http2"]').attr('value') || '';
  const token = secondForm.find('input[name="token"]').attr('value') || '';
  if (!secondAction) return null;

  const verification = await postForm(secondAction, { _wp_http2: wpHttp2, token }, second.response.url || firstAction);
  const cookieMatch = verification.html.match(/s_343\('([^']+)',\s*'([^']+)'/);
  const linkMatch = verification.html.match(/c\.setAttribute\(["']href["'],\s*["']([^"']+)["']\)/);
  if (!cookieMatch || !linkMatch) return null;

  const finalUrl = absolute(linkMatch[1], verification.response.url || secondAction);
  if (!finalUrl) return null;
  const landing = await responseText(finalUrl, {
    headers: {
      Referer: verification.response.url || secondAction,
      Cookie: `${cookieMatch[1]}=${cookieMatch[2]}`
    }
  });
  const $landing = cheerio.load(landing.html);
  const content = $landing('meta[http-equiv="refresh"]').attr('content') || '';
  const target = content.match(/url\s*=\s*["']?([^"';]+)/i)?.[1];
  return target ? absolute(target, landing.response.url || finalUrl) : null;
}

function extractFileInfo($) {
  let name = clean($('title').text());
  let size;
  $('ul.list-group li').each((_, item) => {
    const text = clean($(item).text());
    if (/^name\s*:/i.test(text)) name = clean(text.replace(/^name\s*:/i, '')) || name;
    if (/^size\s*:/i.test(text)) size = clean(text.replace(/^size\s*:/i, ''));
  });
  return { name, size };
}

function findLinkByText($, pattern) {
  let found = null;
  $('a[href]').each((_, anchor) => {
    if (found || !pattern.test(clean($(anchor).text()))) return;
    found = $(anchor).attr('href');
  });
  return found;
}

function isAllowedMediaUrl(value) {
  try {
    const url = new URL(value);
    if (!/^https?:$/.test(url.protocol)) return false;
    if (/(?:^|\/)null(?:\/|$)/i.test(url.pathname)) return false;
    const hostname = url.hostname.toLowerCase();
    return hostname === 'video-downloads.googleusercontent.com' ||
      hostname.endsWith('.workers.dev') ||
      hostname.endsWith('.cloudflarestorage.com');
  } catch (_) {
    return false;
  }
}

function directUrlFromRedirect(location, base) {
  try {
    const redirectUrl = new URL(location, base);
    if (isAllowedMediaUrl(redirectUrl.href)) return redirectUrl.href;
    const nestedUrl = redirectUrl.searchParams.get('url');
    return isAllowedMediaUrl(nestedUrl) ? new URL(nestedUrl).href : null;
  } catch (_) {
    return null;
  }
}

function buildStream(info, item, directUrl, source, seekable, headers = {}) {
  const attributes = parseMediaAttributes(info.name, item.descriptor);
  const quality = attributes.quality === 'Unknown' ? item.quality : attributes.quality;
  return {
    name: `UHDMovies \u2022 ${quality} \u2022 ${source}`,
    title: info.name || item.descriptor,
    url: directUrl,
    quality,
    size: info.size || item.size,
    source,
    provider: 'UHDMovies',
    headers,
    subtitles: [],
    seekable,
    ...(attributes.hdr ? { hdr: true } : {}),
    ...(attributes.codec ? { codec: attributes.codec } : {}),
    ...(attributes.audio ? { audio: attributes.audio } : {}),
    ...(attributes.languages.length ? { languages: attributes.languages } : {})
  };
}

async function resolveResumeRoute($file, filePage, fileUrl, info, item) {
  const resumePath = findLinkByText($file, /^Resume Cloud$/i);
  const resumeUrl = absolute(resumePath, filePage.response.url || fileUrl);
  if (!resumeUrl) return null;

  const resume = await responseText(resumeUrl, { headers: { Referer: filePage.response.url || fileUrl } });
  const $resume = cheerio.load(resume.html);
  const directPath = findLinkByText($resume, /^Cloud Resume Download$/i);
  const directUrl = absolute(directPath, resume.response.url || resumeUrl);
  if (!isAllowedMediaUrl(directUrl)) return null;

  return buildStream(info, item, directUrl, 'DriveSeed Resume', true, {
    ...HEADERS,
    Referer: resume.response.url || resumeUrl
  });
}

async function resolveInstantRoute($file, filePage, fileUrl, info, item) {
  const instantPath = findLinkByText($file, /^Instant Download$/i);
  const instantUrl = absolute(instantPath, filePage.response.url || fileUrl);
  if (!instantUrl) return null;

  const requestOptions = {
    method: 'GET',
    headers: { ...HEADERS, Referer: filePage.response.url || fileUrl }
  };
  const response = await fetch(instantUrl, { ...requestOptions, redirect: 'manual' });
  let directUrl = directUrlFromRedirect(response.headers?.get?.('location'), instantUrl) ||
    directUrlFromRedirect(response.url, instantUrl);

  // Android fetch bridges do not all expose manual redirects identically:
  // some report status 0/200, hide Location, or only expose the followed URL.
  // Retry with normal redirect handling only when the manual response contains
  // no usable target, then cancel a possible media body after reading headers.
  if (!directUrl) {
    const followed = await fetch(instantUrl, { ...requestOptions, redirect: 'follow' });
    directUrl = directUrlFromRedirect(followed.url, instantUrl) ||
      directUrlFromRedirect(followed.headers?.get?.('location'), instantUrl);
    try { await followed.body?.cancel?.(); } catch (_) {}
  }
  if (!directUrl) return null;

  return buildStream(info, item, directUrl, 'DriveSeed Instant', false);
}

async function resolveDriveSeed(landingUrl, item) {
  const initial = await responseText(landingUrl, { headers: { Referer: item.url } });
  const redirectPath = initial.html.match(/window\.location\.replace\(["']([^"']+)/)?.[1];
  const fileUrl = redirectPath ? absolute(redirectPath, initial.response.url || landingUrl) : initial.response.url || landingUrl;
  if (!fileUrl || !/driveseed\.org\/file\//i.test(fileUrl)) return [];

  const filePage = redirectPath
    ? await responseText(fileUrl, { headers: { Referer: initial.response.url || landingUrl } })
    : initial;
  const $file = cheerio.load(filePage.html);
  const info = extractFileInfo($file);

  const routes = await Promise.all([
    resolveResumeRoute($file, filePage, fileUrl, info, item).catch(() => null),
    resolveInstantRoute($file, filePage, fileUrl, info, item).catch(() => null)
  ]);
  return routes.filter(Boolean);
}

async function resolveCandidate(item) {
  if (!item?.url || item.resolverType !== 'driveseed-sid') return [];
  try {
    const landingUrl = await resolveSid(item.url, item.referer);
    if (!landingUrl || !/driveseed\.org\//i.test(landingUrl)) return [];
    return resolveDriveSeed(landingUrl, item);
  } catch (error) {
    console.log(`[UHDMovies Resolve] ${error?.message || error}`);
    return [];
  }
}

async function getStreams(tmdbId, mediaType = 'movie', season = 1, episode = 1) {
  const candidates = await discoverCandidates(tmdbId, mediaType, season, episode);
  const resolved = await mapConcurrent(candidates, 4, resolveCandidate);
  return uniqueExactStreams(resolved.flat().filter(Boolean));
}

module.exports = { discoverCandidates, resolveCandidate, getStreams };
