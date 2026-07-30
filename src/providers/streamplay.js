const { getStreams: getCastleStreams } = require('./castle');
const { getStreams: getVegaMoviesStreams } = require('./vegamovies');
function normalizeQuality(value) {
  const match = String(value || '').match(/(2160|1440|1080|720|480|360|240)/);
  if (match) return match[1] === '2160' ? '4K' : match[1] + 'p';
  return 'Unknown';
}

function qualityOrder(quality) {
  return ({ '4K': '01', '1440p': '02', '1080p': '03', '720p': '04', '480p': '05', '360p': '06', '240p': '07' })[quality] || '99';
}

// Nuvio-compatible StreamPlay entry point. VegaMovies supplies live-verified
// progressive MKV links; Castle remains the live HLS fallback. Anime/cartoon-
// only sources remain excluded.
async function getStreams(tmdbId, mediaType, season, episode) {
  if (!tmdbId || (mediaType !== 'movie' && mediaType !== 'tv')) return Promise.resolve([]);
  const results = await Promise.allSettled([
    getVegaMoviesStreams(tmdbId, mediaType, season, episode),
    getCastleStreams(tmdbId, mediaType, season, episode)
  ]);
  const streams = results.flatMap(result => result.status === 'fulfilled' && Array.isArray(result.value) ? result.value : []);
  return streams.map(function (stream) {
      const quality = normalizeQuality(stream.quality);
      const source = String(stream.name || stream.provider || 'Direct')
        .replace(/^(?:Castle|StreamPlay)\s*/i, '')
        .trim() || 'Direct';
      return Object.assign({}, stream, {
        // Nuvio 0.3.2 alphabetically re-sorts stream names. The rank prefix
        // preserves global quality order across every StreamPlay source.
        name: `${qualityOrder(quality)} • StreamPlay • ${quality} • ${source}`,
        quality
      });
    }).filter((stream, index, all) => all.findIndex(other => other.url === stream.url) === index)
      .sort((a, b) => qualityRank(b.quality) - qualityRank(a.quality));
}

function qualityRank(quality) {
  const match = String(quality || '').match(/(2160|1440|1080|720|480|360|240|4K)/i);
  if (!match) return 0;
  return match[1].toUpperCase() === '4K' ? 2160 : Number(match[1]);
}

module.exports = { getStreams };
