const assert = require('assert');

const originalFetch = global.fetch;
let requests = [];

global.fetch = async (url) => {
  requests.push(String(url));
  if (!String(url).includes('salman-sohail93.workers.dev/streams')) {
    throw new Error(`Unexpected device-side request: ${url}`);
  }
  return {
    ok: true,
    json: async () => ({
      ok: true,
      providers: { uhdmovies: { count: 2, status: 'success', error: null } },
      directStreams: [
        {
          provider: 'UHDMovies', source: 'DriveSeed Instant', quality: '4K',
          url: 'https://video-downloads.googleusercontent.com/mock-instant', seekable: false
        },
        {
          provider: 'UHDMovies', source: 'DriveSeed Resume', quality: '4K',
          url: 'https://resume.mock.workers.dev/file.mkv', seekable: true
        }
      ],
      candidates: []
    })
  };
};

const { fetchWorkerStreams } = require('../src/providers/uhdmovies');

(async () => {
  const streams = await fetchWorkerStreams('1124', 'movie');
  assert.strictEqual(requests.length, 1, 'UHDMovies should make one device-side request when Worker succeeds');
  assert(requests[0].includes('providers=uhdmovies'), 'Worker request must select only UHDMovies');
  assert(requests[0].includes('timeout=30000'), 'Worker request must allow the full UHD resolver deadline');
  assert.strictEqual(streams.length, 2, 'Both distinct Worker streams must be preserved');
  assert.deepStrictEqual(streams.map(stream => stream.source), ['DriveSeed Instant', 'DriveSeed Resume']);
  console.log('PASS: optional UHDMovies Worker diagnostic preserves both direct links');
})().catch(error => {
  console.error('FAIL:', error);
  process.exitCode = 1;
}).finally(() => {
  global.fetch = originalFetch;
});
