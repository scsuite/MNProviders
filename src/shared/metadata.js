const DOMAINS = require('../config/domains');

const TMDB_KEY = '439c478a771f35c05022f9feabcca01c';
const cache = new Map();

function resolveTmdbId(inputId, type) {
  const value = String(inputId || '').replace(/^tmdb:/i, '');
  if (!/^tt\d+$/i.test(value)) return Promise.resolve(value);
  return fetch(`${DOMAINS.TMDB_API}/find/${encodeURIComponent(value)}?api_key=${TMDB_KEY}&external_source=imdb_id`)
    .then(response => response.ok ? response.json() : null)
    .then(data => {
      const matches = type === 'tv' ? data?.tv_results : data?.movie_results;
      return matches?.[0]?.id ? String(matches[0].id) : null;
    })
    .catch(() => null);
}

function getMetadata(tmdbId, mediaType) {
  const type = mediaType === 'tv' ? 'tv' : 'movie';
  const key = `${type}:${tmdbId}`;
  if (!cache.has(key)) {
    cache.set(key, resolveTmdbId(tmdbId, type)
      .then(resolvedId => resolvedId
        ? fetch(`${DOMAINS.TMDB_API}/${type}/${resolvedId}?api_key=${TMDB_KEY}&append_to_response=external_ids`)
        : null)
      .then(response => response?.ok ? response.json() : null)
      .then(data => data ? {
        title: type === 'tv' ? data.name : data.title,
        year: Number(String(type === 'tv' ? data.first_air_date : data.release_date).slice(0, 4)) || null,
        imdbId: data.external_ids?.imdb_id || data.imdb_id || (/^tt\d+$/i.test(String(tmdbId)) ? String(tmdbId) : null),
        tmdbId: String(data.id)
      } : null)
      .catch(() => null));
  }
  return cache.get(key);
}

module.exports = { getMetadata, resolveTmdbId };
