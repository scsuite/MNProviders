#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const file = path.resolve(__dirname, '..', 'PORTING_STATUS.md');
const start = '<!-- PHASE3-AUDIT:START -->';
const end = '<!-- PHASE3-AUDIT:END -->';
const rows = [
  ['cinefreak.js', 'dynamic/current unknown', 'Suitable for direct HTTP/HLS porting', 'Movies/TV mixed-language; contract/export repair needed'],
  ['coflix.js', 'coflix.wales', 'Dead endpoint', 'HTTP 500 search; disabled'],
  ['desicinemas.js', 'desicinemas.to via Worker', 'Partially working', 'Site/proxy reachable; no verified media in 3 lookups; disabled'],
  ['dudefilms.js', 'dudefilms.living (registry)', 'Dead endpoint', 'Implementation still uses old dudefilms.sarl'],
  ['fibwatch.js', 'fibwatch.art (registry)', 'Dead endpoint', 'Implementation still uses old fibwatch.top'],
  ['fivemovierulz.js', '5movierulz.gripe', 'Partially working', 'Direct-link candidate; live validation pending'],
  ['fourkHDhub.js', '4khdhub.one (registry)', 'Cloudflare/WebView dependent', 'Access path produced Cloudflare placeholder; no bounded verified result; disabled'],
  ['goojara.js', 'ww1.goojara.to', 'Partially working', 'Anonymous search reachable; no verified final media; disabled'],
  ['hindmoviez.js', 'hindmovie.icu (registry)', 'Dead endpoint', 'Implementation still uses old hindmoviez.cafe'],
  ['idlix.js', 'z1.idlixku.com', 'Authentication required', 'Session claim/redeem flow; anonymous viability unverified'],
  ['istreamflare.js', 'istreamflare.com', 'Suitable for direct HTTP/HLS porting', 'JSON API implementation; live validation pending'],
  ['kisskh.js', 'provider-defined API', 'Suitable for direct HTTP/HLS porting', 'Movies/TV/Asian drama relevant; anime capability ignored'],
  ['layarkaca.js', 'provider-defined domain', 'Suitable for direct HTTP/HLS porting', 'Movies/TV/Asian drama; live validation pending'],
  ['masstamilan.js', 'provider-defined domain', 'Suitable for direct HTTP/HLS porting', 'Movie/music downloads; TV not expected'],
  ['megakino.js', 'provider-defined domain', 'Suitable for direct HTTP/HLS porting', 'Movies relevant; anime capability ignored'],
  ['movierulzhd.js', '123moviesfree9.cv (registry)', 'Partially working', 'Dynamic domain support exists; final embeds unverified'],
  ['movies4u.js', 'new1.movies4u.clinic (registry)', 'Authentication required', 'Existing implementation has a hardcoded cookie and must be cleaned before testing'],
  ['moviesdrive.js', 'new5.moviesdrives.my (registry)', 'Dead endpoint', 'Current search API returned HTML instead of JSON; disabled'],
  ['mplayer.js', 'mxplayer.in', 'Suitable for direct HTTP/HLS porting', 'Public HLS/DASH API; possible geo restrictions'],
  ['multimovies.js', 'multimovies.makeup (registry)', 'Partially working', 'Site reachable; no verified media in 3 lookups; disabled'],
  ['netcinez.js', 'netcinez.si / netcineye.lat player', 'Dead endpoint', 'Player URLs returned HTTP 404; disabled'],
  ['pelisplushd.js', 'provider-defined domain', 'Suitable for direct HTTP/HLS porting', 'Movies/TV direct decrypt endpoint; live validation pending'],
  ['pencurimovie.js', 'provider-defined domain', 'Suitable for direct HTTP/HLS porting', 'Movies/TV; live validation pending'],
  ['pinoymoviepedia.js', 'provider-defined domain', 'Suitable for direct HTTP/HLS porting', 'Movies/TV; live validation pending'],
  ['pmsm.js', 'dynamic provider domain', 'Suitable for direct HTTP/HLS porting', 'Movies/TV; live validation pending'],
  ['topstreamfilm.js', 'provider-defined domain', 'Suitable for direct HTTP/HLS porting', 'Movies/TV; live validation pending'],
  ['torrastream.js', 'multi-API', 'Torrent/debrid dependent', 'Out of direct HTTP/HLS scope'],
  ['xdmovies.js', 'new.xdmovies.wtf', 'Suitable for direct HTTP/HLS porting', 'Direct host extractors and quality/file-size metadata; live validation pending']
];
const animeOutOfScope = [
  'AllWish', 'Anichi', 'AniDb', 'Anikage', 'Animeav1', 'AnimeCloud', 'AnimeDekhoProvider',
  'Animedubhindi', 'Animekhor', 'Animenosub', 'AnimePahe', 'Animesalt', 'Animexin', 'Anineko',
  'Aniworld', 'Anizone', 'Donghuastream', 'DoraBash', 'Kickassanime', 'Latanime', 'OnePace',
  'Piratexplay', 'RingZ', 'ToonHub', 'Toonstream', 'ToonTales', 'Topcartoons'
];

const auditRows = rows.map((row) => `| ${row.join(' | ')} |`).join('\n');
const section = `${start}
## Phase 3 Movies/TV-only scope

Anime-only providers are **out of scope** and excluded from future batches. Existing anime files remain untouched. Live IPTV-only, Jellyfin/private-server, torrent/debrid-only, DRM, CAPTCHA, Cloudflare-challenge, and login-only providers are also excluded.

Explicitly out of scope: ${animeOutOfScope.map((name) => `**${name}**`).join(', ')}.

### Existing non-anime provider audit

Categories are based on current source inspection, the maintained domain registry, and Phase 2/3 live evidence. “Suitable” means a candidate for testing, not verified playback.

| Provider file | Current domain/source | Category | Audit note |
|---|---|---|---|
${auditRows}

### Phase 3 bounded live results

Limits: 30 seconds/request, 90 seconds/title, 3 alternate hosts/title, and 2 resolver redirects. Placeholder, trailer, sample, HTML-disguised media, HTTP 403/404/5xx, and Cloudflare open-graph media are rejected.

| Provider | Current domain | Movie result | TV result | Highest verified quality | Final playable URL | Blocker | Manifest status | Recommendation |
|---|---|---|---|---|:---:|---|---|---|
| MoviesDrive | new5.moviesdrives.my | Recent 0; older 0 | S1E1: 0 | None | No | Search endpoint returns HTML instead of expected JSON | Disabled | Contract-valid, playback-unverified; do not recommend |
| FourKHDHub | 4khdhub.one | Recent 0; older 0 | S1E1: 0 | None | No | Cloudflare placeholder/deep hosts exceed bounded attempts | Disabled | Contract-valid, playback-unverified; do not recommend |
| Desicinemas | desicinemas.to via Worker | Recent 0; older 0 | S1E1: 0 | None | No | No final media candidate from reachable pages | Disabled | Contract-valid, playback-unverified; do not recommend |
| Netcinez | netcinez.si / netcineye.lat | Recent 0; older 0 | S1E1: 0 | None | No | Player endpoint HTTP 404 | Disabled | Contract-valid, dead playback endpoint; do not recommend |
| MultiMovies | multimovies.makeup | Recent 0; older 0 | S1E1: 0 | None | No | Player options produced no verified final media | Disabled | Contract-valid, playback-unverified; do not recommend |

### Prioritized Movies/TV-only queue

1. **XDMovies** — broad direct-host support, file-size and 4K metadata already present.
2. **IStreamFlare** — JSON API and apparent direct movie/TV play-link endpoints.
3. **MXPlayer** — public HLS/DASH API, with geo-availability checked honestly.
4. **MovieRulzHD** — maintained dynamic domain and Movies/TV coverage.
5. **PelisPlusHD** — Movies/TV flow with a direct decrypt endpoint.
6. Pencurimovie.
7. Pinoymoviepedia.
8. LayarKaca.
9. PMSM.
10. Topstreamfilm.
${end}`;

let markdown = fs.readFileSync(file, 'utf8');
const pattern = new RegExp(`${start}[\\s\\S]*?${end}`, 'm');
markdown = pattern.test(markdown) ? markdown.replace(pattern, section) : `${markdown.trim()}\n\n${section}\n`;
fs.writeFileSync(file, markdown);
console.log(`Updated Phase 3 audit with ${rows.length} non-anime provider files.`);
