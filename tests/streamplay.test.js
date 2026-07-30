const assert = require('assert');

const dependencyPaths = [
  '../src/providers/vidlink'
];

for (const dependencyPath of dependencyPaths) {
  const resolved = require.resolve(dependencyPath);
  require.cache[resolved] = {
    id: resolved,
    filename: resolved,
    loaded: true,
    exports: {
      getStreams: async (tmdbId, mediaType) => (!tmdbId || !['movie', 'tv'].includes(mediaType) ? [] : [{
        url: `https://cdn.test/${resolved.split(/[\\/]/).pop()}.m3u8`,
        title: '1080p',
        quality: '1080p',
        headers: { Referer: 'https://source.test/' },
        subtitles: []
      }])
    }
  };
}

const { getStreams } = require('../src/providers/streamplay');

(async () => {
  assert.deepStrictEqual(await getStreams(null, 'movie'), []);
  assert.deepStrictEqual(await getStreams('123', 'anime'), []);

  const streams = await getStreams('123', 'movie');
  assert.strictEqual(streams.length, dependencyPaths.length);
  assert(streams.every((stream) => stream.title.length > 0));
  assert(streams.every((stream) => stream.headers.Referer));
  console.log(`PASS: StreamPlay aggregated ${streams.length} unique movie/TV sources`);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
