const assert = require('assert');

const originalFetch = global.fetch;
const requests = [];

global.fetch = async (url) => {
  const value = String(url);
  requests.push(value);
  if (!value.includes('salman-sohail93.workers.dev/streams')) {
    throw new Error(`Unexpected device-side request: ${value}`);
  }
  return {
    ok: true,
    json: async () => ({
      ok: true,
      providers: { vegamovies: { count: 1, status: 'success', error: null } },
      directStreams: [{
        provider: 'VegaMovies',
        source: 'Worker Direct',
        quality: '1080p',
        url: 'https://vegamovies.mock.workers.dev/file.mkv'
      }],
      candidates: []
    })
  };
};

const vegaMovies = require('../src/providers/vegamovies');

(async () => {
  const streams = await vegaMovies.getStreams('603', 'movie');
  assert.strictEqual(requests.length, 1, 'VegaMovies should make exactly one Worker request');
  assert(requests[0].includes('providers=vegamovies') && requests[0].includes('timeout=30000'));
  assert.strictEqual(streams.length, 1);
  assert.strictEqual(streams[0].provider, 'VegaMovies');
  console.log('PASS: VegaMovies uses one Worker request on successful resolution');
})().catch(error => {
  console.error('FAIL:', error);
  process.exitCode = 1;
}).finally(() => {
  global.fetch = originalFetch;
});
