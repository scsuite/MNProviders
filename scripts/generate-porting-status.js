#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const sourceRoot = path.resolve(root, '..', 'PhisherCloudStream');
const pluginsPath = path.join(sourceRoot, 'plugins.json');
const plugins = JSON.parse(fs.readFileSync(pluginsPath, 'utf8'));
const localFiles = fs.readdirSync(path.join(root, 'src', 'providers'))
  .filter((name) => name.endsWith('.js'));

const normalize = (value) => value.toLowerCase().replace(/provider/g, '').replace(/[^a-z0-9]/g, '');
const localByName = new Map(localFiles.map((name) => [normalize(path.basename(name, '.js')), name]));
const phase2 = new Set(['AnimeCloud', 'Animekhor', 'Coflix', 'Goojara', 'OnePace']);

function flags(types) {
  const lowered = types.map((type) => type.toLowerCase());
  const all = lowered.includes('all');
  return {
    movies: all || lowered.includes('movie') || lowered.includes('animemovie'),
    tv: all || lowered.some((type) => ['tvseries', 'asiandrama', 'cartoon', 'documentary'].includes(type)),
    anime: all || lowered.some((type) => ['anime', 'animemovie', 'ova', 'cartoon'].includes(type)),
    torrent: lowered.includes('torrent'),
    live: lowered.includes('live')
  };
}

function login(plugin) {
  const text = `${plugin.name} ${plugin.description || ''}`.toLowerCase();
  if (plugin.name === 'Jellyfin') return 'Yes (server credentials/token)';
  if (/login required|cookie using login|requires setup/.test(text)) return 'Yes/setup';
  if (plugin.name === 'TorraStream') return 'Optional debrid/settings';
  return 'No evidence';
}

function dependencies(plugin, local) {
  if (local) return 'HTTP/fetch, TMDB lookup, HTML/JSON parsing; provider-local host extractors in current JS';
  if (plugin.name === 'StremioAddon' || plugin.name === 'StremioX') return 'Stremio manifest/stream client, URL normalization';
  if (plugin.name === 'Jellyfin') return 'Jellyfin API client and authenticated headers';
  if (flags(plugin.tvTypes).torrent) return 'Torrent/debrid helpers; not a direct Nuvio HTTP extractor';
  if (flags(plugin.tvTypes).live) return 'M3U/IPTV parsing and header propagation';
  return 'Unknown (Kotlin source unavailable; inspect/recover before porting)';
}

function feasibility(plugin, local) {
  const f = flags(plugin.tvTypes);
  if (local) return 'High: JS port already present; needs contract/runtime validation';
  if (f.torrent) return 'Low: torrent playback is outside direct HTTP/HLS contract';
  if (plugin.name === 'Ultima') return 'Not applicable: CloudStream aggregator/UI, not a stream provider';
  if (plugin.name === 'Jellyfin') return 'Medium: technically possible with user-supplied server/auth';
  if (['ShowBox', 'SuperStream'].includes(plugin.name)) return 'Low: authenticated cookie flow; manual policy decision';
  if (['StremioAddon', 'StremioX'].includes(plugin.name)) return 'Medium: configurable addon bridge, not a conventional provider';
  return 'Unknown/Medium: metadata suggests HTTP media, but source must be recovered';
}

function order(plugin, local) {
  const f = flags(plugin.tvTypes);
  if (local) return '0 - existing; validate before new ports';
  if (plugin.name === 'Ultima') return '5 - do not port as provider';
  if (f.torrent || ['ShowBox', 'SuperStream'].includes(plugin.name)) return '5 - blocked/defer';
  if (f.live || ['Jellyfin', 'StremioAddon', 'StremioX'].includes(plugin.name)) return '4 - special integration';
  return '3 - after source recovery/shared layer';
}

function direct(plugin, local) {
  const f = flags(plugin.tvTypes);
  if (local) return 'Likely/current implementation attempts HTTP/HLS extraction; not playback-verified in this phase';
  if (f.torrent) return 'No (torrent result, unless an authorized debrid service returns HTTP)';
  if (plugin.name === 'Ultima') return 'No (aggregator/UI)';
  if (plugin.name === 'Jellyfin' || f.live || ['StremioAddon', 'StremioX'].includes(plugin.name)) return 'Yes in principle, configuration dependent';
  return 'Unknown; likely, based only on provider category/metadata';
}

const header = `# CloudStream to Nuvio porting status

Generated from upstream build metadata cloned at \`${sourceRoot}\` and from the current Nuvio tree. The upstream \`master\` branch contains documentation only. The \`builds\` branch contains ${plugins.length} \`.cs3\` metadata records and 42 compiled Android/Dex artifacts, but no Kotlin source files. A referenced source commit was not fetchable from GitHub. Therefore exact Kotlin paths, extractor implementations, WebView/Cloudflare/CAPTCHA behavior, and DRM behavior are marked unavailable/unknown rather than guessed. “No evidence” is not a guarantee.

## Phase 1 findings for MNProviders

- Manifest: top-level \`name\`, \`version\`, and \`scrapers[]\`. Each scraper has \`id\`, \`name\`, \`description\`, \`version\`, \`author\`, \`supportedTypes\`, \`filename\`, \`enabled\`, \`formats\`, \`logo\`, and \`contentLanguage\`. Only MoviesDrive and AllWish are registered.
- Provider interface: a provider file exposes \`getStreams(tmdbId, mediaType, seasonNum, episodeNum)\`; both CommonJS and ESM export styles exist.
- Stream contract: resolves a Promise of stream objects. Current providers commonly return \`url\`, \`quality\`, \`title\` or \`name\`, optional request \`headers\`, and \`subtitles\`. An empty array represents no result/failure.
- Runtime: React Native/Hermes-oriented. Use global \`fetch\`; avoid Node built-ins. README specifies \`cheerio-without-node-native\`. Build externals also list \`react-native-cheerio\`, \`cheerio\`, \`crypto-js\`, and \`axios\`. Web Crypto availability is provider/runtime dependent.
- Build: esbuild CommonJS, neutral platform, ES2016 target. The current script discovers directories beneath \`src\` and expects \`src/<name>/index.js\`; the repository instead stores providers in \`src/providers/*.js\`, so it currently discovers one entry named \`providers\` and skips it. This was preserved.
- Existing utilities/extractors: there is no central shared utility directory. HTTP helpers, base64, AES/Web Crypto, TMDB/Anime ID lookup, HTML parsing, redirect handling, WordPress AJAX, host resolution, subtitle shaping, and quality parsing are duplicated inside provider files. \`aesdecryptor/\` is a separate helper project, not imported by manifest providers.
- Validation scope: \`npm test\` validates valid manifest JSON, containment/existence of every referenced provider file, JavaScript syntax, and a static \`getStreams\` export for every manifest entry. It intentionally does not execute providers or modify the 46 unregistered files.

## Shared work to port first

1. A runtime-safe HTTP client wrapper for headers, referer/origin, redirects, timeouts, response decoding, and Nuvio’s \`skipSizeCheck\` extension.
2. A canonical stream normalizer/validator that only accepts final \`http://\`, \`https://\`, or HLS URLs and preserves required headers/subtitles.
3. HTML/JSON helpers plus React Native-safe base64, URL normalization, quality parsing, and packed-script decoding.
4. TMDB-to-title/year and TMDB-to-anime-ID lookup with consistent movie/season/episode matching.
5. Shared direct-host extractors identified from recoverable source/current ports, implemented only for ordinary HTTP/HLS flows. Do not implement DRM circumvention, CAPTCHA solving, paid-login bypass, or access-control bypass.
6. M3U/IPTV and Stremio clients as separate optional integrations; torrent/debrid support requires a product decision and authorized user configuration.

## Complete upstream provider inventory

“Kotlin source path” is explicitly unavailable for every row because upstream removed the Kotlin tree. The artifact column names the only traceable source-side file.

| # | Provider | Kotlin source path / artifact | Lang | Movies | TV | Anime | Shared extractor dependencies | Login | WebView | CF/CAPTCHA | DRM | Direct HTTP/HLS possible | Nuvio feasibility | Order | Status |
|---:|---|---|---|:---:|:---:|:---:|---|---|---|---|---|---|---|---|---|
`;

const rows = plugins.map((plugin, index) => {
  const local = localByName.get(normalize(plugin.name));
  const f = flags(plugin.tvTypes);
  const artifact = `${plugin.name}.cs3${fs.existsSync(path.join(sourceRoot, `${plugin.name}.jar`)) ? ' + compiled .jar' : ''}`;
  const status = phase2.has(plugin.name)
    ? `Phase 2 normalized: src/providers/${local}`
    : local ? `Existing unmodified JS: src/providers/${local}` : 'Not started; Kotlin source unavailable';
  const values = [
    index + 1, plugin.name, `Unavailable; ${artifact}`, plugin.language || 'Unknown',
    f.movies ? 'Yes' : 'No', f.tv ? 'Yes' : 'No', f.anime ? 'Yes' : 'No',
    dependencies(plugin, local), login(plugin), 'Unknown (source absent)',
    'Unknown (source absent; do not bypass)', 'No evidence in metadata; verify source/stream before porting',
    direct(plugin, local), feasibility(plugin, local), order(plugin, local), status
  ];
  return `| ${values.map((value) => String(value).replace(/\|/g, '\\|').replace(/\r?\n/g, ' ')).join(' | ')} |`;
}).join('\n');

const localOnly = localFiles.filter((name) => !plugins.some((plugin) => normalize(plugin.name) === normalize(path.basename(name, '.js'))));
const footer = `

## Accounting and limitations

- Total upstream providers: **${plugins.length}** (all rows above; none silently omitted).
- Upstream compiled artifacts: **42**; metadata-only providers: **${plugins.length - 42}**.
- Current Nuvio provider files: **${localFiles.length}**. Current files with a normalized upstream match: **${localFiles.length - localOnly.length}**.
- Nuvio-only/unmatched current files (not added to the upstream count): ${localOnly.map((name) => `\`${name}\``).join(', ')}.
- Exact extractor dependency graphs cannot be responsibly reconstructed without Kotlin sources. Recovering an authorized source snapshot is the main blocker before porting providers not already represented in JavaScript.

## Proposed first porting batch

Before adding new providers, validate and consolidate shared behavior using the existing upstream-matched JS implementations. The first low-risk batch is **AnimeCloud, Animekhor, Coflix, Goojara, and OnePace**: all already have readable JavaScript ports, cover HTML/JSON/anime/movie flows, and can drive the shared HTTP, parsing, ID mapping, normalization, and direct-HLS layers. Playback must be claimed only when a final playable HTTP(S)/HLS URL is resolved during a dedicated live test.

## Phase 2 implementation and live-test status

| Provider | Implementation status | Test status | Final playable link resolved | Blocker |
|---|---|---|:---:|---|
| AnimeCloud | Normalized, shared utilities, manifest-registered and bundled | Array/URL/header contract passed; 0 streams | No | Current \`fireani.me\` search API returned HTTP 404 |
| Animekhor | Normalized, shared utilities, manifest-registered and bundled | Array/URL/header contract passed; 0 streams | No | Search/page flow produced no final media candidate; upstream Kotlin source unavailable |
| Coflix | Normalized, shared utilities, manifest-registered and bundled | Array/URL/header contract passed; 0 streams | No | Current \`coflix.wales\` suggestion endpoint returned HTTP 500 |
| Goojara | Normalized, hardcoded session cookie removed, manifest-registered and bundled | Array/URL/header contract passed; 0 streams | No | Anonymous search/player flow produced no final media candidate; no access-control bypass attempted |
| OnePace | Normalized, shared utilities, manifest-registered and bundled | Array/URL/header contract passed; 2 streams; each URL returned a successful media/HLS response during resolution | Yes | Host URLs are short-lived and must be resolved per request |
`;

fs.writeFileSync(path.join(root, 'PORTING_STATUS.md'), header + rows + footer);
console.log(`Wrote PORTING_STATUS.md with ${plugins.length} providers.`);
