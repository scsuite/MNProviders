const { getStreams: getCastleStreams } = require('./castle');
const { getStreams: getVegaMoviesStreams } = require('./vegamovies');
function normalizeQuality(value) {
  const match = String(value || '').match(/(2160|1440|1080|720|480|360|240)/);
  if (match) return match[1] === '2160' ? '4K' : match[1] + 'p';
  return 'Unknown';
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
      return Object.assign({}, stream, {
        name: String(stream.name || 'Castle').replace(/^Castle/, 'StreamPlay'),
        quality: normalizeQuality(stream.quality)
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
