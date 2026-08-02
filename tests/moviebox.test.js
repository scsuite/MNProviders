const assert = require('assert');

const originalFetch = global.fetch;
const requests = [];

function response(status, payload, headers = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: key => headers[String(key).toLowerCase()] || null },
    text: async () => JSON.stringify(payload)
  };
}

global.fetch = async (url, options = {}) => {
  const value = String(url);
  requests.push({ url: value, options });
  if (value.includes('api.themoviedb.org')) {
    return { ok: true, json: async () => ({ title: 'The Matrix', release_date: '1999-03-31', external_ids: { imdb_id: 'tt0133093' } }) };
  }
  if (value.includes('/tab/ranking-list')) {
    return response(200, { data: [] }, { 'x-user': JSON.stringify({ token: 'mock-bearer-token-long-enough' }) });
  }
  if (value.includes('/subject-api/search/v2')) {
    return response(200, { data: { results: [{ subjectId: 'matrix-1999', title: 'The Matrix (1999)', subjectType: 'movie' }] } });
  }
  if (value.includes('/subject-api/play-info')) {
    return response(200, { data: { streams: [
      { streamUrl: 'https://media.example.test/matrix-1080.m3u8', resolution: '1080p' },
      { streamUrl: 'https://media.example.test/matrix-2160.mkv', resolution: '2160p' }
    ] } });
  }
  if (value.includes('captions')) return response(200, { data: [] });
  return response(404, {});
};

const movieBox = require(process.env.MOVIEBOX_BUNDLE ? '../providers/MovieBox.js' : '../src/providers/moviebox');

(async () => {
  const canonical = movieBox.canonicalRequest('GET', '/path?z=2&a=1', '', 123);
  assert.strictEqual(canonical, 'GET\n/path\na=1&z=2\n\n123');
  const headers = movieBox.signedHeaders('GET', '/path?a=1');
  assert(headers['x-client-token']);
  assert(headers['x-tr-signature'].includes('|2|'));

  const streams = await movieBox.getStreams('603', 'movie');
  assert.strictEqual(streams.length, 2);
  assert.deepStrictEqual(streams.map(stream => stream.quality), ['4K', '1080p']);
  assert(requests.some(item => item.url.includes('/tab/ranking-list')));
  assert(requests.some(item => item.url.includes('/subject-api/search/v2')));
  assert(requests.some(item => item.url.includes('/subject-api/play-info')));
  const signedApiRequests = requests.filter(item => item.url.includes('aoneroom.com'));
  assert(signedApiRequests.every(item => item.options.headers['x-client-token']));
  assert(signedApiRequests.some(item => item.options.headers.Authorization === 'Bearer mock-bearer-token-long-enough'));
  console.log('PASS: isolated MovieBox signing, token, search and stream parsing flow');
})().catch(error => {
  console.error('FAIL:', error);
  process.exitCode = 1;
}).finally(() => {
  global.fetch = originalFetch;
});
