const assert = require('assert');

let workerUrlCalled = null;
let localVegaDiscoverCalled = false;
let localMDDiscoverCalled = false;

const originalFetch = global.fetch;

global.fetch = async (url, options) => {
  const urlString = String(url);
  const urlDecoded = decodeURIComponent(urlString);
  if (urlString.includes('salman-sohail93.workers.dev')) {
    workerUrlCalled = urlString;
    if (urlDecoded.includes('fail=true')) {
      return { ok: false, status: 500 };
    }

    return {
      ok: true,
      json: async () => ({
        ok: true,
        directStreams: [
          {
            name: 'Castle HLS - 1080p',
            url: 'https://cdn.castle.test/stream.m3u8',
            quality: '1080p',
            provider: 'castle',
            source: 'Castle'
          }
        ],
        deviceProviders: ['vegamovies', 'moviesdrive'],
        providers: {
          vegamovies: { count: 1, status: 'success', error: null },
          moviesdrive: { count: 1, status: 'success', error: null }
        },
        candidates: [
          {
            provider: 'vegamovies',
            source: 'FastDL',
            quality: '4K',
            url: 'https://fastdl.test/movie4k',
            referer: 'https://vegamovies.test/',
            resolverType: 'fastdl'
          },
          {
            provider: 'MoviesDrive',
            source: 'HubCloud',
            quality: '720p',
            url: 'https://hubcloud.test/drive/720',
            referer: 'https://moviesdrive.test/',
            resolverType: 'hubcloud'
          }
        ]
      })
    };
  }
  return originalFetch ? originalFetch(url, options) : { ok: false };
};

const vegaResolved = require.resolve('../src/providers/vegamovies');
require.cache[vegaResolved] = {
  id: vegaResolved,
  filename: vegaResolved,
  loaded: true,
  exports: {
    discoverCandidates: async () => {
      localVegaDiscoverCalled = true;
      return [{
        provider: 'vegamovies', source: 'FastDL', quality: '4K',
        url: 'https://fastdl.test/device_movie4k', resolverType: 'fastdl'
      }];
    },
    resolveCandidate: async (candidate) => [{
      name: `VegaMovies ${candidate.source} - ${candidate.quality}`,
      url: `https://resolved.test/vega_${candidate.quality}.mp4`,
      quality: candidate.quality,
      provider: 'vegamovies',
      source: candidate.source
    }]
  }
};

const mdResolved = require.resolve('../src/moviesdrive/index');
require.cache[mdResolved] = {
  id: mdResolved,
  filename: mdResolved,
  loaded: true,
  exports: {
    discoverCandidates: async () => {
      localMDDiscoverCalled = true;
      return [{
        provider: 'MoviesDrive', source: 'HubCloud', quality: '720p',
        url: 'https://hubcloud.test/device_720', resolverType: 'hubcloud'
      }];
    },
    resolveCandidate: async (candidate) => [{
      name: `MoviesDrive ${candidate.source} - ${candidate.quality}`,
      url: `https://resolved.test/md_${candidate.quality}.mkv`,
      quality: candidate.quality,
      provider: 'MoviesDrive',
      source: candidate.source
    }]
  }
};

const castleResolved = require.resolve('../src/providers/castle');
require.cache[castleResolved] = {
  id: castleResolved,
  filename: castleResolved,
  loaded: true,
  exports: {
    getStreams: async () => [{
      name: 'Local Castle Fallback',
      url: 'https://cdn.castle.test/fallback.m3u8',
      quality: '720p',
      provider: 'castle',
      source: 'Castle'
    }]
  }
};

for (const modulePath of [
  '../src/providers/movies4u',
  '../src/providers/fourkHDhub',
  '../src/providers/multimovies',
  '../src/providers/hdhub4u'
]) {
  const resolved = require.resolve(modulePath);
  require.cache[resolved] = {
    id: resolved,
    filename: resolved,
    loaded: true,
    exports: { discoverCandidates: async () => [], resolveCandidate: async () => [] }
  };
}

const { getStreams } = require('../src/providers/streamplay');

(async () => {
  console.log('--- Device-first StreamPlay Test ---');
  workerUrlCalled = null;
  localVegaDiscoverCalled = false;
  localMDDiscoverCalled = false;

  const streams = await getStreams('603', 'movie');

  assert.strictEqual(workerUrlCalled, null, 'Normal StreamPlay fetching must not call the Worker');
  assert.strictEqual(localVegaDiscoverCalled, true, 'Vega discovery should run on the device');
  assert.strictEqual(localMDDiscoverCalled, true, 'MoviesDrive discovery should run on the device');
  console.log('PASS: normal fetching used device discovery with zero Worker requests');

  assert.strictEqual(streams.length, 3, `Expected 3 total device streams (1 Castle + 2 resolved candidates), got ${streams.length}`);
  const castleStream = streams.find(s => s.provider === 'castle');
  assert(castleStream && castleStream.url === 'https://cdn.castle.test/fallback.m3u8', 'Device Castle stream should be preserved');
  console.log('PASS: Device Castle stream and resolved candidates preserved');

  const qualities = streams.map(s => s.quality);
  assert.deepStrictEqual(qualities, ['4K', '720p', '720p'], `Expected qualities ['4K', '720p', '720p'], got ${JSON.stringify(qualities)}`);
  console.log('PASS: Global quality order remains correct');

  console.log('\n✅ STREAMPLAY DEVICE-FIRST TEST PASSED!');
})().catch((err) => {
  console.error('❌ TEST FAILURE:', err);
  process.exit(1);
});
