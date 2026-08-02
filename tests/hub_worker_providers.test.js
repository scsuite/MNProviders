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
  const providerName = providerId === '4khdhub' ? '4KHDHub' : 'HDHub4u';
  return {
    ok: true,
    json: async () => ({
      ok: true,
      providers: { [providerId]: { count: 1, status: 'success', error: null } },
      directStreams: [{
        provider: providerName,
        source: 'Worker Direct',
        quality: '4K',
        url: `https://${providerId}.mock.workers.dev/file.mkv`,
        seekable: true
      }],
      candidates: []
    })
  };
};

const fourkHDHub = require('../src/providers/fourkHDhub');
const hdHub4u = require('../src/providers/hdhub4u');

(async () => {
  const [fourkStreams, hdStreams] = await Promise.all([
    fourkHDHub.getStreams('603', 'movie'),
    hdHub4u.getStreams('603', 'movie')
  ]);

  assert.strictEqual(requests.length, 2, 'Each standalone provider should make exactly one Worker request');
  assert(requests.some(url => url.includes('providers=4khdhub')), '4KHDHub must select its Worker provider');
  assert(requests.some(url => url.includes('providers=hdhub4u')), 'HDHub4u must select its Worker provider');
  assert.strictEqual(fourkStreams.length, 1);
  assert.strictEqual(hdStreams.length, 1);
  assert.strictEqual(fourkStreams[0].provider, '4KHDHub');
  assert.strictEqual(hdStreams[0].provider, 'HDHub4u');
  console.log('PASS: 4KHDHub and HDHub4u each use one Worker request on successful resolution');
})().catch(error => {
  console.error('FAIL:', error);
  process.exitCode = 1;
}).finally(() => {
  global.fetch = originalFetch;
});
