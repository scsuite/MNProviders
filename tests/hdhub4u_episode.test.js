const assert = require('assert');
const cheerio = require('cheerio-without-node-native');
const { parseEpisode } = require('../src/providers/hdhub4u');

const $ = cheerio.load(`
  <main>
    <p>E02 –
      <a href="https://hubdrive.tips/file/episode-2">Drive</a>
      <a href="https://hubcdn.sbs/file/episode-2">Instant</a>
      <a href="https://greenmountmotors.com/?id=episode-2">Watch</a>
    </p>
    <p><a href="https://greenmountmotors.com/?id=season-pack">Season Pack</a></p>
    <p>E03 – <a href="https://hubdrive.tips/file/episode-3">Drive</a></p>
  </main>
`);

const candidates = parseEpisode($, 'https://new4.hdhub4u.cl/season-1/', 2);

assert.deepStrictEqual(
  candidates.map(candidate => candidate.url),
  [
    'https://hubdrive.tips/file/episode-2',
    'https://hubcdn.sbs/file/episode-2',
    'https://greenmountmotors.com/?id=episode-2'
  ],
  'HDHub4u must extract only links inside the requested episode marker block'
);
assert.deepStrictEqual(
  candidates.map(candidate => candidate.resolverType),
  ['hubdrive', 'hubcdn', 'protector']
);

console.log('PASS: HDHub4u extracts exact episode links without mixing season packs or later episodes');
