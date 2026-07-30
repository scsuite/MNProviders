const { getStreams: getCastleStreams } = require('./castle');

function normalizeQuality(value) {
  const match = String(value || '').match(/(2160|1440|1080|720|480|360|240)/);
  if (match) return match[1] === '2160' ? '4K' : match[1] + 'p';
  return 'Unknown';
}

// Nuvio-compatible StreamPlay entry point. Castle currently supplies the
// live-verified, proxy-free movie/TV HLS streams. Anime/cartoon-only sources
// remain excluded.
function getStreams(tmdbId, mediaType, season, episode) {
  if (!tmdbId || (mediaType !== 'movie' && mediaType !== 'tv')) return Promise.resolve([]);
  return getCastleStreams(tmdbId, mediaType, season, episode).then(function (streams) {
    if (!Array.isArray(streams)) return [];
    return streams.map(function (stream) {
      return Object.assign({}, stream, {
        name: String(stream.name || 'Castle').replace(/^Castle/, 'StreamPlay'),
        quality: normalizeQuality(stream.quality)
      });
    });
  }).catch(function (error) {
    console.log('[StreamPlay] ' + (error && error.message ? error.message : error));
    return [];
  });
}

module.exports = { getStreams };
