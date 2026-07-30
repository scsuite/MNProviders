const { getStreams: getVidlinkStreams } = require('./vidlink');
const { uniqueStreams } = require('../shared/streams');

// Nuvio cannot execute the original Android/Kotlin StreamPlay plugin. This
// compatibility provider preserves StreamPlay's multi-source behavior by
// aggregating the Phisher providers that have already been ported and audited
// for Nuvio's JavaScript runtime. Anime/cartoon-only sources are intentionally
// excluded.
const SOURCES = [
  { name: 'Vidlink', getStreams: getVidlinkStreams }
];

const SOURCE_TIMEOUT_MS = 25000;

function withTimeout(promise, sourceName) {
  return new Promise((resolve) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      console.warn(`[StreamPlay] ${sourceName} timed out`);
      resolve([]);
    }, SOURCE_TIMEOUT_MS);

    Promise.resolve(promise).then((value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(Array.isArray(value) ? value : []);
    }).catch((error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      console.warn(`[StreamPlay] ${sourceName}: ${error && error.message ? error.message : error}`);
      resolve([]);
    });
  });
}

function labelStreams(sourceName, streams) {
  return streams.map((stream) => ({
    ...stream,
    name: `StreamPlay • ${sourceName}`,
    title: stream.title && stream.title.indexOf(sourceName) >= 0
      ? stream.title
      : `${sourceName} • ${stream.title || stream.quality || 'Stream'}`
  }));
}

async function getStreams(tmdbId, mediaType, season = 1, episode = 1) {
  if (!tmdbId || (mediaType !== 'movie' && mediaType !== 'tv')) return [];

  const results = await Promise.all(SOURCES.map((source) => withTimeout(
    source.getStreams(tmdbId, mediaType, season, episode),
    source.name
  ).then((streams) => labelStreams(source.name, streams))));

  return uniqueStreams([].concat(...results));
}

module.exports = { getStreams };
