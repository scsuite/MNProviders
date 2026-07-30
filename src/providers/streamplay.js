const { getStreams: getVidlinkStreams } = require('./vidlink');

// Dependency-free compatibility entry point for Nuvio's sandboxed JS runtime.
// Anime and cartoon-only sources are intentionally excluded.
function getStreams(tmdbId, mediaType, season, episode) {
  return getVidlinkStreams(tmdbId, mediaType, season, episode);
}

module.exports = { getStreams };
