import cheerio from 'cheerio-without-node-native';
import { HEADERS, MAIN_URL, TMDB_API_KEY } from './constants.js';
import { expandMovieButton, extractHost } from './extractor.js';
import { mapConcurrent, uniqueExactStreams } from '../shared/streams.js';
import DOMAINS from '../config/domains.js';

const DOMAINS_URL = DOMAINS.PHISHER_DOMAINS;

function normalizeType(value) {
  return /^(tv|series|show)$/i.test(String(value || '')) ? 'tv' : 'movie';
}

async function getMetadata(tmdbId, mediaType) {
  const response = await fetch(`${DOMAINS.TMDB_API}/${mediaType}/${tmdbId}?api_key=${TMDB_API_KEY}&append_to_response=external_ids`, { headers: HEADERS });
  if (!response.ok) return null;
  const data = await response.json();
  return { title: mediaType === 'tv' ? data.name : data.title, imdbId: data.external_ids?.imdb_id };
}

function coversSeason(document, season) {
  if (!season) return true;
  const text = `${document.post_title || ''} ${document.permalink || ''}`;
  const range = text.match(/season\s*0?(\d+)\s*[-–—]\s*0?(\d+)/i);
  if (range && season >= Number(range[1]) && season <= Number(range[2])) return true;
  return new RegExp(`(?:season[ ._/-]*|\\bs)0?${season}(?:\\D|$)`, 'i').test(text);
}

async function getMainUrls() {
  const candidates = [];
  try {
    const response = await fetch(DOMAINS_URL, { headers: HEADERS });
    if (response.ok) {
      const configured = String((await response.json()).moviesdrive || '').replace(/\/$/, '');
      if (/^https?:\/\//i.test(configured)) candidates.push(configured);
    }
  } catch (_) {}
  candidates.push(MAIN_URL);
  return [...new Set(candidates)];
}

async function search(metadata, season, mainUrls) {
  const queries = [metadata.imdbId, metadata.title].filter(Boolean);
  const attempts = mainUrls.flatMap(mainUrl => queries.map(async query => {
        const data = await fetch(`${mainUrl}/search.php?q=${encodeURIComponent(query)}&page=1`, { headers: { ...HEADERS, Referer: `${mainUrl}/` } }).then(r => r.json());
        const documents = (data.hits || []).map(hit => hit.document).filter(Boolean);
        const exact = metadata.imdbId ? documents.filter(doc => doc.imdb_id === metadata.imdbId) : [];
        const titled = documents.filter(doc => String(doc.post_title || '').toLowerCase().includes(String(metadata.title || '').toLowerCase()));
        const candidates = exact.length ? exact : titled;
        const match = candidates.find(doc => coversSeason(doc, season));
        if (match) return `${mainUrl}${String(match.permalink).startsWith('/') ? '' : '/'}${match.permalink}`;
        throw new Error('No matching result');
  }));
  try { return await Promise.any(attempts); }
  catch (_) { return null; }
}

function seasonPages($, season) {
  const result = [];
  const pattern = new RegExp(`Season\\s*0?${season}(?:\\D|$)`, 'i');
  $('h5').each((_, heading) => {
    if (!pattern.test($(heading).text())) return;
    let node = $(heading).next();
    let traversed = 0;
    while (node.length && traversed++ < 100) {
      const nodeText = node.text();
      const anchors = node.attr('href') ? [node] : node.find('a[href]').get();
      anchors.forEach(anchor => {
        const text = $(anchor).text();
        const href = $(anchor).attr('href');
        if (href && /single\s*episode/i.test(text) && !/zip/i.test(text) && !result.some(item => item.url === href)) {
          const qualityMatch = text.match(/\b(1080|720|480|360|240)p?\b/i);
          const quality = /(?:2160p?|4k)/i.test(text) ? '4K' : qualityMatch ? `${qualityMatch[1]}p` : 'Unknown';
          result.push({ url: href, quality });
        }
      });
      if (/Season\s*\d+/i.test(nodeText)) break;
      node = node.next();
    }
  });
  return result;
}

function episodeLinks($, episode) {
  const result = [];
  const pattern = new RegExp(`(?:Ep|Episode)\\s*0?${episode}(?:\\D|$)`, 'i');
  $('h5').each((_, heading) => {
    const headingText = $(heading).text();
    if (!pattern.test(headingText)) return;
    const qualityMatch = headingText.match(/\b(1080|720|480|360|240)p?\b/i);
    const quality = /(?:2160p?|4k)/i.test(headingText)
      ? '4K'
      : qualityMatch ? `${qualityMatch[1]}p` : 'Unknown';
    const size = headingText.match(/([\d.]+)\s*(GB|MB)/i)?.[0];
    let node = $(heading).next();
    let traversed = 0;
    while (node.length && traversed++ < 100) {
      const nodeText = node.text();
      const anchors = node.attr('href') ? [node] : node.find('a[href]').get();
      anchors.forEach(anchor => {
        const href = $(anchor).attr('href');
        if (href && /(hubcloud|gdflix|gdlink)/i.test(href) && !result.some(item => item.url === href)) {
          result.push({ url: href, quality, size });
        }
      });
      if (/(?:Ep|Episode)\s*\d+/i.test(nodeText)) break;
      node = node.next();
    }
  });
  return result;
}

export async function discoverCandidates(tmdbId, mediaType, season = 1, episode = 1) {
  try {
    const type = normalizeType(mediaType);
    const seasonNumber = Number(season) || 1;
    const episodeNumber = Number(episode) || 1;
    const [metadata, mainUrls] = await Promise.all([
      getMetadata(String(tmdbId).replace(/^tmdb:/i, ''), type),
      getMainUrls()
    ]);
    if (!metadata?.title) return [];
    const mediaUrl = await search(metadata, type === 'tv' ? seasonNumber : null, mainUrls);
    if (!mediaUrl) return [];
    const html = await fetch(mediaUrl, { headers: HEADERS }).then(r => r.text());
    const $ = cheerio.load(html);
    let hostPages = [];
    if (type === 'movie') {
      const buttons = $('h5 > a[href]').map((_, anchor) => $(anchor).attr('href')).get().filter(Boolean);
      hostPages = (await Promise.all([...new Set(buttons)].map(expandMovieButton))).flat();
    } else {
      const pages = seasonPages($, seasonNumber);
      const pageResults = await Promise.all(pages.map(async page => {
        try {
          if (/search-recover\.php/i.test(page.url)) {
            return [{ ...page, season: seasonNumber, episode: episodeNumber, referer: mediaUrl }];
          }
          const episodeHtml = await fetch(page.url, { headers: HEADERS }).then(r => r.text());
          return episodeLinks(cheerio.load(episodeHtml), episodeNumber).map(item => ({
            ...item,
            season: seasonNumber,
            episode: episodeNumber,
            referer: page.url
          }));
        } catch (_) { return []; }
      }));
      hostPages = pageResults.flat();
    }
    const uniqueHosts = hostPages.filter((item, index, all) => {
      const url = typeof item === 'string' ? item : item.url;
      return all.findIndex(other => (typeof other === 'string' ? other : other.url) === url) === index;
    });
    const expandedHosts = (await Promise.all(uniqueHosts.map(async item => {
      const url = typeof item === 'string' ? item : item.url;
      if (!/search-recover\.php/i.test(url)) return [item];
      const expanded = await expandMovieButton(url, typeof item === 'string' ? {} : item);
      return expanded.map(expandedUrl => typeof item === 'string' ? expandedUrl : { ...item, url: expandedUrl });
    }))).flat();

    return expandedHosts.map(item => {
      const hint = typeof item === 'string' ? {} : item;
      const url = typeof item === 'string' ? item : item.url;
      const referer = hint.referer || mediaUrl;
      const isGdflix = /gdflix|gdlink/i.test(url);
      const isHubcloud = /hubcloud/i.test(url);
      return {
        provider: 'MoviesDrive',
        source: isGdflix ? 'GDFlix' : isHubcloud ? 'HubCloud' : 'MoviesDrive Host',
        quality: hint.quality || 'Unknown',
        size: hint.size,
        url,
        referer,
        headers: { ...HEADERS, Referer: referer },
        resolverType: isGdflix ? 'gdflix' : isHubcloud ? 'hubcloud' : 'direct'
      };
    });
  } catch (error) {
    console.error('[MoviesDrive Candidate Discovery] Error:', error.message);
    return [];
  }
}

export async function resolveCandidate(candidate) {
  if (!candidate || !candidate.url) return [];
  try {
    if (candidate.resolverType === 'direct') {
      return [{
        name: candidate.name || `MoviesDrive • ${candidate.quality || 'Unknown'} • ${candidate.source || 'Direct'}`,
        title: candidate.title,
        url: candidate.url,
        quality: candidate.quality || 'Unknown',
        size: candidate.size,
        headers: candidate.headers || HEADERS,
        provider: 'MoviesDrive',
        source: candidate.source || 'Direct',
        subtitles: []
      }];
    }
    const streams = await extractHost(candidate.url, candidate.referer || MAIN_URL, {
      quality: candidate.quality,
      size: candidate.size
    });
    return (streams || []).map(stream => ({
      ...stream,
      provider: 'MoviesDrive'
    }));
  } catch (error) {
    return [];
  }
}

export async function getStreams(tmdbId, mediaType, season = 1, episode = 1) {
  try {
    const candidates = await discoverCandidates(tmdbId, mediaType, season, episode);
    const resolvedResults = await mapConcurrent(candidates, 4, resolveCandidate);
    const flatStreams = resolvedResults.flat().filter(Boolean);
    return uniqueExactStreams(flatStreams);
  } catch (error) {
    console.error('[MoviesDrive] Error:', error.message);
    return [];
  }
}

export default { discoverCandidates, resolveCandidate, getStreams };
