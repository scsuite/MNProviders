const DOMAINS = require('../config/domains');

const TMDB_KEY = '439c478a771f35c05022f9feabcca01c';
const cache = new Map();

function getMetadata(tmdbId, mediaType) {
  const type = mediaType === 'tv' ? 'tv' : 'movie';
  const key = `${type}:${tmdbId}`;
  if (!cache.has(key)) {
    cache.set(key, fetch(`${DOMAINS.TMDB_API}/${type}/${tmdbId}?api_key=${TMDB_KEY}&append_to_response=external_ids`)
      .then(response => response.ok ? response.json() : null)
      .then(data => data ? {
        title: type === 'tv' ? data.name : data.title,
        year: Number(String(type === 'tv' ? data.first_air_date : data.release_date).slice(0, 4)) || null,
        imdbId: data.external_ids?.imdb_id || data.imdb_id || null
      } : null)
      .catch(() => null));
  }
  return cache.get(key);
}

module.exports = { getMetadata };
