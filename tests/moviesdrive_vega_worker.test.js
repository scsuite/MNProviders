const assert = require('assert');

const originalFetch = global.fetch;
const requests = [];

global.fetch = async (url) => {
  const value = String(url);
  requests.push(value);
  if (!value.includes('salman-sohail93.workers.dev/streams')) {
    throw new Error(`Unexpected device-side request: ${value}`);
  }
  const providerId = new URL(value).searchParams.get('providers');
  const providerName = providerId === 'moviesdrive' ? 'MoviesDrive' : 'VegaMovies';
  return {
    ok: true,
    json: async () => ({
      ok: true,
      providers: { [providerId]: { count: 1, status: 'success', error: null } },
      directStreams: [{
        provider: providerName,
        source: 'Worker Direct',
        quality: '1080p',
        url: `https://${providerId}.mock.workers.dev/file.mkv`
      }],
      candidates: []
    })
  };
};

(async () => {
  const moviesDrive = await import('../src/moviesdrive/index.js');
  const vegaMovies = require('../src/providers/vegamovies');
  const [moviesDriveStreams, vegaStreams] = await Promise.all([
    moviesDrive.fetchWorkerStreams('603', 'movie'),
    vegaMovies.fetchWorkerStreams('603', 'movie')
  ]);

  assert.strictEqual(requests.length, 2, 'Each provider should make exactly one Worker request');
  assert(requests.some(url => url.includes('providers=moviesdrive') && url.includes('timeout=40000')));
  assert(requests.some(url => url.includes('providers=vegamovies') && url.includes('timeout=30000')));
  assert.strictEqual(moviesDriveStreams.length, 1);
  assert.strictEqual(vegaStreams.length, 1);
  assert.strictEqual(moviesDriveStreams[0].provider, 'MoviesDrive');
  assert.strictEqual(vegaStreams[0].provider, 'VegaMovies');
  console.log('PASS: optional MoviesDrive and VegaMovies Worker diagnostics remain available');
})().catch(error => {
  console.error('FAIL:', error);
  process.exitCode = 1;
}).finally(() => {
  global.fetch = originalFetch;
});
