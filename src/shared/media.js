const { getJson } = require('./http');

const TMDB_API_KEY = '1865f43a0549ca50d341dd9ab8b29f49';

async function getMediaInfo(tmdbId, mediaType, options = {}) {
  const type = mediaType === 'tv' ? 'tv' : 'movie';
  const url = `https://api.themoviedb.org/3/${type}/${encodeURIComponent(tmdbId)}?api_key=${TMDB_API_KEY}`;
  const data = await getJson(url, options);
  return {
    title: data.title || data.name || '',
    year: Number(String(data.release_date || data.first_air_date || '').slice(0, 4)) || null,
    raw: data
  };
}

module.exports = { getMediaInfo };
