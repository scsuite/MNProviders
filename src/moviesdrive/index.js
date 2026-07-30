import cheerio from 'cheerio-without-node-native';
import { HEADERS, MAIN_URL, TMDB_API_KEY } from './constants.js';
import { expandMovieButton, extractHubCloud, sortAndUnique } from './extractor.js';

function normalizeType(value) {
  return /^(tv|series|show)$/i.test(String(value || '')) ? 'tv' : 'movie';
}

async function getMetadata(tmdbId, mediaType) {
  const response = await fetch(`https://api.themoviedb.org/3/${mediaType}/${tmdbId}?api_key=${TMDB_API_KEY}&append_to_response=external_ids`, { headers: HEADERS });
  if (!response.ok) return null;
  const data = await response.json();
  return { title: mediaType === 'tv' ? data.name : data.title, imdbId: data.external_ids?.imdb_id };
}

async function search(metadata) {
  const queries = [metadata.imdbId, metadata.title].filter(Boolean);
  for (const query of queries) {
    try {
      const data = await fetch(`${MAIN_URL}/search.php?q=${encodeURIComponent(query)}&page=1`, { headers: HEADERS }).then(r => r.json());
      const documents = (data.hits || []).map(hit => hit.document).filter(Boolean);
      const exact = metadata.imdbId && documents.find(doc => doc.imdb_id === metadata.imdbId);
      const match = exact || documents.find(doc => String(doc.post_title || '').toLowerCase().includes(String(metadata.title || '').toLowerCase()));
      if (match) return `${MAIN_URL}${String(match.permalink).startsWith('/') ? '' : '/'}${match.permalink}`;
    } catch (_) {}
  }
  return null;
}

function seasonPages($, season) {
  const result = [];
  const pattern = new RegExp(`Season\\s*0?${season}(?:\\D|$)`, 'i');
  $('h5').each((_, heading) => {
    if (!pattern.test($(heading).text())) return;
    let node = $(heading).next();
    let traversed = 0;
    while (node.length && traversed++ < 100) {
      // Nuvio's lightweight Cheerio bridge exposes no DOM node indexes and
      // does not implement addBack(). Text boundaries work in both Nuvio and Node.
      const nodeText = node.text();
      const anchors = node.attr('href') ? [node] : node.find('a[href]').get();
      anchors.forEach(anchor => {
        const text = $(anchor).text();
        const href = $(anchor).attr('href');
        if (href && /single\s*episode/i.test(text) && !/zip/i.test(text) && !result.includes(href)) result.push(href);
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
    if (!pattern.test($(heading).text())) return;
    let node = $(heading).next();
    let traversed = 0;
    while (node.length && traversed++ < 100) {
      const nodeText = node.text();
      const anchors = node.attr('href') ? [node] : node.find('a[href]').get();
      anchors.forEach(anchor => {
        const href = $(anchor).attr('href');
        if (href && /hubcloud/i.test(href) && !result.includes(href)) result.push(href);
      });
      if (/(?:Ep|Episode)\s*\d+/i.test(nodeText)) break;
      node = node.next();
    }
  });
  return result;
}

async function getStreams(tmdbId, mediaType, season = 1, episode = 1) {
  try {
    const type = normalizeType(mediaType);
    const seasonNumber = Number(season) || 1;
    const episodeNumber = Number(episode) || 1;
    const metadata = await getMetadata(String(tmdbId).replace(/^tmdb:/i, ''), type);
    if (!metadata?.title) return [];
    const mediaUrl = await search(metadata);
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
          const episodeHtml = await fetch(page, { headers: HEADERS }).then(r => r.text());
          return episodeLinks(cheerio.load(episodeHtml), episodeNumber);
        } catch (_) { return []; }
      }));
      hostPages = pageResults.flat();
    }
    const extracted = await Promise.all([...new Set(hostPages)].map(url => extractHubCloud(url, mediaUrl)));
    return sortAndUnique(extracted.flat());
  } catch (error) {
    console.error('[MoviesDrive] Error:', error.message);
    return [];
  }
}

module.exports = { getStreams };
