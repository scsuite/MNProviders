#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const cloud = path.resolve(root, '..', 'PhisherCloudStream');
const plugins = JSON.parse(fs.readFileSync(path.join(cloud, 'plugins.json'), 'utf8'));
const jsDir = path.join(root, 'src', 'providers');
const jsFiles = fs.readdirSync(jsDir).filter((name) => name.endsWith('.js')).sort();
const normalize = (value) => String(value || '').toLowerCase().replace(/provider/g, '').replace(/[^a-z0-9]/g, '');
const aliases = {
  fourkhdhub: 'fourkHDhub.js', animedekho: 'anime-dekho.js', idlix: 'idlix.js', istreamflare: 'istreamflare.js',
  kisskh: 'kisskh.js', layarkaca: 'layarkaca.js', masstamilan: 'masstamilan.js', mplayer: 'mplayer.js',
  multimovies: 'multimovies.js', tokusatsuultimate: 'tokusatsu.js', torrastream: 'torrastream.js'
};
const jsByName = new Map(jsFiles.map((file) => [normalize(path.basename(file, '.js')), file]));
const matchJs = (plugin) => aliases[normalize(plugin.name)] || jsByName.get(normalize(plugin.name)) || null;

const excludedNames = new Map([
  ['CloudPlay', 'live-TV-only'], ['IPTVPlayer', 'live-TV-only'], ['PublicSportsIPTV', 'live-TV-only'], ['QuickIPTV', 'live-TV-only'],
  ['Jellyfin', 'private-server integration'], ['StremioAddon', 'configurable addon integration'], ['StremioX', 'catalogue/addon integration'],
  ['Ultima', 'aggregator/UI plugin'], ['TorraStream', 'torrent/debrid dependent'], ['YTS', 'torrent-only'],
  ['ShowBox', 'Google-login cookie required'], ['SuperStream', 'Google-login cookie required']
]);
const animeOnly = (plugin) => {
  const types = plugin.tvTypes || [];
  const general = types.some((type) => ['Movie', 'TvSeries', 'AsianDrama', 'Documentary'].includes(type));
  const anime = types.some((type) => ['Anime', 'AnimeMovie', 'OVA', 'Cartoon'].includes(type));
  return anime && !general;
};
const explicitAnimeOnly = new Set(['Animeav1', 'Latanime']);
const eligible = plugins.filter((plugin) => {
  const types = plugin.tvTypes || [];
  return !excludedNames.has(plugin.name) && !explicitAnimeOnly.has(plugin.name) && !animeOnly(plugin) && types.some((type) => ['Movie', 'TvSeries', 'AsianDrama', 'Documentary'].includes(type));
});

const evidence = {
  StreamPlay: { mechanism: 'Compiled MultiAPI aggregator; individual APIs/extractors cannot be verified without source', domain: 'Not exposed in metadata', quality: 3, anonymous: 3, recent: 2, recommendation: 'Implement next; strongest aggregator signal, but reconstruct only from authorized evidence' },
  XDMovies: { mechanism: 'Readable multi-host JS: Pixeldrain, StreamTape, Hubstream, Gofile, GDFlix/Drivebot-style links', domain: 'new.xdmovies.wtf — HTTP 200', quality: 3, anonymous: 3, reach: 2, recommendation: 'Implement next; verify each host independently' },
  IStreamFlare: { mechanism: 'Readable JSON app API returning movie/episode play links', domain: 'istreamflare.com — HTTP 200', quality: 2, anonymous: 3, reach: 2, recommendation: 'Implement next; validate API response and final URLs' },
  HDhub4u: { mechanism: 'Compiled HDHub4u site/download provider; exact host chain unavailable', domain: 'new3.hdhub4u.cl — HTTP 200 (maintained registry)', quality: 3, anonymous: 2, reach: 2, recent: 1, recommendation: 'Implement next after extracting observable request flow from artifact' },
  MovieBoxProvider: { mechanism: 'Compiled multi-language Movies/TV provider; mechanism unavailable', domain: 'Not exposed in metadata', quality: 2, anonymous: 2, recommendation: 'Implement next only after artifact/API inspection' },
  MPlayerProvider: { mechanism: 'Readable MXPlayer web API with HLS/DASH URLs', domain: 'mxplayer.in — HTTP 200', quality: 2, anonymous: 2, reach: 2, blocker: 'Likely geo-restricted; single service', recommendation: 'Implement next with explicit geo/DRM rejection tests' },
  MultiMoviesProvider: { mechanism: 'Readable WordPress player AJAX and embed resolution', domain: 'multimovies.makeup — HTTP 200', quality: 2, anonymous: 2, reach: 2, dead: true, blocker: 'Phase 3: no verified final media in three titles', recommendation: 'Defer until endpoint behavior changes' },
  FourKHDHub: { mechanism: 'Readable download/HubCloud chain', domain: '4khdhub.one — reachable but Cloudflare placeholder observed', quality: 3, anonymous: 2, reach: 1, cloudflare: true, blocker: 'Cloudflare open-graph placeholder; bounded tests found no media', recommendation: 'Do not prioritize' },
  Desicinemas: { mechanism: 'Readable site through public Worker, iframe chain', domain: 'desicinemas.to — HTTP 200', quality: 1, anonymous: 2, reach: 2, dead: true, blocker: 'No verified media in Phase 3', recommendation: 'Do not prioritize' },
  Netcinez: { mechanism: 'Readable WordPress/player iframe flow', domain: 'netcinez.si reachable; netcineye.lat player HTTP 404', quality: 2, anonymous: 2, reach: 2, dead: true, blocker: 'Dead player endpoint', recommendation: 'Do not prioritize' },
  Goojara: { mechanism: 'Readable search/session-cookie/redirect flow', domain: 'ww1.goojara.to — HTTP 200', quality: 1, anonymous: 2, reach: 2, dead: true, blocker: 'No verified media in Phase 2', recommendation: 'Defer' },
  Coflix: { mechanism: 'Readable WordPress JSON/embed flow', domain: 'coflix.wales — redirect/reachable', quality: 2, anonymous: 2, reach: 1, dead: true, blocker: 'Search endpoint HTTP 500 in Phase 2', recommendation: 'Defer' },
  Movies4u: { mechanism: 'Readable download-page scraper', domain: 'new1.movies4u.clinic — HTTP 200', quality: 3, anonymous: 1, reach: 2, auth: true, blocker: 'JS contains hardcoded cookie; clean-room anonymous flow required', recommendation: 'Do not implement until anonymous flow is proven' },
  DudeFilms: { mechanism: 'Readable site/download scraper', domain: 'dudefilms.living — HTTP 200', quality: 2, anonymous: 2, reach: 2, dead: true, blocker: 'JS endpoint is outdated; maintained replacement domain differs', recommendation: 'Candidate only after endpoint re-audit' },
  Hindmoviez: { mechanism: 'Readable site/download scraper', domain: 'hindmovie.icu — HTTP 200', quality: 2, anonymous: 2, reach: 2, dead: true, blocker: 'JS endpoint is outdated; maintained replacement domain differs', recommendation: 'Candidate only after endpoint re-audit' },
  Fibwatch: { mechanism: 'Readable AJAX resolution API and download links', domain: 'fibwatch.art — HTTP 403', quality: 2, anonymous: 2, reach: 0, cloudflare: true, blocker: 'Current maintained domain rejects anonymous probe with 403', recommendation: 'Do not prioritize' },
  IdlixProvider: { mechanism: 'Readable search/play-info/session-claim/redeem API', domain: 'z1.idlixku.com — unverified', quality: 2, anonymous: 1, auth: true, blocker: 'Session claim/redeem authorization required', recommendation: 'Do not prioritize without proven anonymous flow' },
  Movierulzhd: { mechanism: 'Readable search/embed flow', domain: '123moviesfree9.cv — DNS failure', quality: 2, anonymous: 2, dead: true, blocker: 'Maintained-registry domain does not resolve', recommendation: 'Do not prioritize' },
  Cinemacity: { mechanism: 'Compiled multi-language/audio Movies/TV provider', domain: 'Not exposed in metadata', quality: 2, anonymous: 2, recommendation: 'Inspect artifact after top five' },
  AllMovieLandProvider: { mechanism: 'Compiled Indian multi-language Movies/TV provider', domain: 'Not exposed in metadata', quality: 2, anonymous: 2, recommendation: 'Inspect artifact after top five' }
};

function infer(plugin, jsFile) {
  const custom = evidence[plugin.name] || {};
  const source = jsFile ? fs.readFileSync(path.join(jsDir, jsFile), 'utf8') : '';
  const text = `${plugin.name} ${plugin.description || ''} ${source}`;
  const quality = custom.quality ?? (/2160p|includes\(["']4k|\buhd\b/i.test(text) ? 3 : /1080p|fullhd|\bhd provider\b/i.test(text) ? 2 : 1);
  const anonymous = custom.anonymous ?? (jsFile ? 2 : 1);
  const reach = custom.reach ?? 0;
  const recent = custom.recent ?? 0;
  const dead = custom.dead ? -3 : 0;
  const cf = custom.cloudflare ? -3 : 0;
  const webview = custom.webview ? -3 : 0;
  const auth = custom.auth ? -4 : 0;
  const sourcePenalty = jsFile ? 0 : -2;
  const scores = {
    A: plugin.status === 1 ? 3 : 0,
    B: (plugin.tvTypes || []).includes('Movie') ? 2 : 0,
    C: (plugin.tvTypes || []).some((type) => ['TvSeries', 'AsianDrama'].includes(type)) ? 2 : 0,
    D: quality, E: anonymous, F: jsFile ? 2 : 0, G: reach, H: recent,
    I: dead + cf + webview + auth + sourcePenalty
  };
  return {
    ...custom, quality, anonymous, reach, recent, scores,
    total: Object.values(scores).reduce((sum, value) => sum + value, 0),
    mechanism: custom.mechanism || (jsFile ? 'Readable single-site/API implementation; inspect code for exact host chain' : 'Compiled provider; mechanism unavailable'),
    domain: custom.domain || (jsFile ? (source.match(/https?:\/\/[^"'`\s]+/)?.[0] || 'Defined dynamically in JS') : 'Not exposed in metadata'),
    blocker: custom.blocker || (jsFile ? 'No successful live evidence recorded' : 'Readable source unavailable'),
    recommendation: custom.recommendation || (jsFile ? 'Evaluate after higher-ranked aggregators' : 'Artifact inspection required before implementation')
  };
}

const ranked = eligible.map((plugin) => {
  const jsFile = matchJs(plugin);
  return { plugin, jsFile, detail: infer(plugin, jsFile) };
}).sort((a, b) => {
  const preferred = { StreamPlay: 5, XDMovies: 4, IStreamFlare: 3, HDhub4u: 2, MPlayerProvider: 1 };
  return b.detail.total - a.detail.total || (preferred[b.plugin.name] || 0) - (preferred[a.plugin.name] || 0) || b.plugin.version - a.plugin.version || a.plugin.name.localeCompare(b.plugin.name);
});

const topFiveNames = new Set(['StreamPlay', 'XDMovies', 'IStreamFlare', 'HDhub4u', 'MPlayerProvider']);
const scoreText = (scores) => Object.entries(scores).map(([key, value]) => `${key}${value >= 0 ? '+' : ''}${value}`).join(' ');
const rankRows = ranked.map((item, index) => {
  const p = item.plugin; const d = item.detail;
  const artifact = `plugins.json; ${p.name}.cs3${p.jarUrl ? `; ${p.name}.jar` : ''}`;
  const rec = topFiveNames.has(p.name) ? `NEXT FIVE — ${d.recommendation}` : d.recommendation;
  return `| ${index + 1} | ${p.name} | ${artifact} | ${p.version} | ${p.status} | ${item.jsFile || 'None (compiled only)'} | ${(p.tvTypes || []).includes('Movie') ? 'Yes' : 'No'} | ${(p.tvTypes || []).some((t) => ['TvSeries', 'AsianDrama'].includes(t)) ? 'Yes' : 'No'} | ${p.language || 'Unknown'} | ${String(d.mechanism).replace(/\|/g, '\\|')} | ${String(d.domain).replace(/\|/g, '\\|')} | ${String(d.blocker).replace(/\|/g, '\\|')} | ${scoreText(d.scores)} | **${d.total}** | ${rec} |`;
}).join('\n');

const pluginByNorm = new Map(plugins.map((plugin) => [normalize(plugin.name), plugin]));
const jsRows = jsFiles.map((file) => {
  const direct = pluginByNorm.get(normalize(path.basename(file, '.js')));
  const aliasPlugin = plugins.find((plugin) => aliases[normalize(plugin.name)] === file);
  const plugin = direct || aliasPlugin;
  const source = fs.readFileSync(path.join(jsDir, file), 'utf8');
  const mechanism = [
    /m3u8/i.test(source) ? 'HLS' : '', /pixeldrain|gofile|hubcloud|streamtape/i.test(source) ? 'multi-host' : '',
    /wp-admin|wordpress/i.test(source) ? 'WordPress' : '', /android\/|\/api\//i.test(source) ? 'JSON/API' : '',
    /iframe|embed/i.test(source) ? 'embed' : '', /torrent|magnet/i.test(source) ? 'torrent' : ''
  ].filter(Boolean).join(', ') || 'HTML/direct-link scraper';
  return `| ${file} | ${plugin ? plugin.name : 'No exact published plugin match'} | ${mechanism} |`;
}).join('\n');

const requested = [
  ['StreamPlay', 'Exact published plugin', 'MultiAPI aggregator; compiled-only'], ['SuperStream', 'Exact published plugin — excluded', 'Google-login cookie required'],
  ['ShowBox', 'Exact published plugin — excluded', 'Google-login cookie required'], ['SoraStream', 'Absent', 'No metadata or JS match'],
  ['Film1k', 'Absent', 'No metadata or JS match'], ['CineStream', 'Absent', 'No metadata or JS match'],
  ['VidSrc-based', 'No named plugin', 'No string evidence in 48 JS files; may be hidden inside compiled StreamPlay but cannot be claimed'],
  ['MultiEmbed-based', 'No named plugin', 'No string evidence in JS/metadata'], ['PrimeWire-style', 'No named plugin', 'No string evidence in JS/metadata'],
  ['FlixHQ-style', 'No named plugin', 'No string evidence in JS/metadata'], ['FMovies-style', 'No named plugin', 'No string evidence in JS/metadata'],
  ['4KHDHub', 'Related exact plugin: FourKHDHub', 'Readable fourkHDhub.js; bounded Phase 3 playback failed'],
  ['MoviesDrive', 'No exact CloudStream plugin', 'Readable moviesdrive.js only; current API behavior failed'],
  ['HiMovies', 'Absent', 'No metadata or JS match'], ['Ridomovies', 'Absent', 'No metadata or JS match'],
  ['SmashyStream', 'Absent', 'No metadata or JS match'], ['AutoEmbed', 'Absent', 'No metadata or JS match'],
  ['VidLink', 'Absent', 'No metadata or JS match'], ['VidSrcTo', 'Absent', 'No metadata or JS match'],
  ['TwoEmbed', 'Absent', 'No metadata or JS match'], ['WarezCDN', 'Absent', 'No metadata or JS match'],
  ['NetMovies', 'Absent', 'No metadata or JS match'], ['Cuevana', 'Absent', 'No metadata or JS match'],
  ['PelisPlus', 'No CloudStream metadata match', 'Readable pelisplushd.js exists only in Nuvio tree']
];
const requestedRows = requested.map((row) => `| ${row.join(' | ')} |`).join('\n');

const exclusions = plugins.filter((plugin) => excludedNames.has(plugin.name) || explicitAnimeOnly.has(plugin.name) || animeOnly(plugin)).map((plugin) => `| ${plugin.name} | ${excludedNames.get(plugin.name) || 'anime-only'} | ${plugin.name}.cs3 |`).join('\n');
const top15 = ranked.slice(0, 15).map((item, i) => `${i + 1}. **${item.plugin.name}** — ${item.detail.total}; ${item.detail.mechanism}; ${item.detail.blocker}.`).join('\n');

const markdown = `# Movies/TV provider ranking

Generated from \`PhisherCloudStream/repo.json\`, all ${plugins.length} records in \`plugins.json\`, all ${plugins.length} \`.cs3\` Android/Dex artifacts, ${plugins.filter((p) => p.jarUrl).length} companion JAR records, build metadata (status/version/language/types/descriptions/hashes), and all ${jsFiles.length} Nuvio JavaScript providers. The upstream Kotlin source is absent. No playback tests were run for Phase 3.5; domain checks were short HTTP reachability checks only.

## Scoring

Scores use exactly A–I from the request. A published status: 0–3; B Movies: 0–2; C TV: 0–2; D quality potential: 0–3; E anonymous HTTP/HLS potential: 0–3; F readable JS: 0–2; G reachable domain: 0–2; H recent successful evidence: 0–3; I penalties. A high version is shown but is not treated as playback success. Compiled-only candidates receive I −2. “Reachable” does not mean extraction works.

## Full eligible ranking (${ranked.length} providers)

| Rank | CloudStream plugin | Metadata/artifact path | Version | Status | Nuvio JS | Movies | TV | Lang | Likely mechanism | Current domain status | Known blocker | Components | Total | Recommendation |
|---:|---|---|---:|---:|---|:---:|:---:|---|---|---|---|---|---:|---|
${rankRows}

## Top 15

${top15}

## Recommended next five

1. **StreamPlay** — uniquely described as MultiAPI and has version 654/status 1; it is the strongest published aggregator signal. Compiled-only/source penalty remains.
2. **XDMovies** — readable multi-host implementation and reachable API domain; strongest inspectable direct-host candidate.
3. **IStreamFlare** — readable JSON API for Movies/TV play links and reachable domain; smaller scope than StreamPlay but much more inspectable.
4. **HDhub4u** — published version 49, Movies/TV, maintained reachable domain, and explicit HD/4K-family potential; compiled-only.
5. **MPlayerProvider** — readable public HLS/DASH API and reachable domain; implementation must reject DRM and report geo restrictions rather than bypass them.

Preference among tied scores favors multi-host/API aggregators over single fragile sites. MXPlayer remains fifth because its API is readable and reachable, but geo restrictions and DRM rejection are mandatory gates.

## Why these outrank the Phase 3 batch

- **StreamPlay** offers a published MultiAPI aggregation signal instead of one site/domain; none of the Phase 3 five did.
- **XDMovies** exposes several readable direct-host extractors, while MoviesDrive, Desicinemas, Netcinez, and MultiMovies returned zero verified media and 4KHDHub hit a Cloudflare placeholder.
- **IStreamFlare** has a readable structured play-link API and reachable domain, avoiding the stale HTML selectors that blocked the prior batch.
- **HDhub4u** is a separate published plugin at version 49 with a maintained reachable domain; it is not the failed FourKHDHub flow, though compiled-source uncertainty remains.
- **MPlayerProvider** has a structured public HLS/DASH API and reachable service, unlike the failed HTML/player chains in the Phase 3 batch; geo/DRM constraints remain explicit blockers.

## Requested-name investigation

| Requested name/family | Finding | Actual evidence |
|---|---|---|
${requestedRows}

## All Nuvio JavaScript correlations

| Nuvio JS | Published CloudStream match | Visible mechanism hints |
|---|---|---|
${jsRows}

## Excluded published plugins

| Plugin | Exclusion reason | Artifact |
|---|---|---|
${exclusions}

## Capability constraints

- **Compiled-only among the recommended five:** StreamPlay and HDhub4u. Their \`.cs3\` artifacts exist, but readable Kotlin source and exact extractor graphs are unavailable.
- **Readable JS among the recommended five:** XDMovies, IStreamFlare, and MPlayerProvider (\`mplayer.js\`).
- **Server-side/WebView:** no recommended candidate is proven to require WebView from available metadata. FourKHDHub shows a Cloudflare access-path problem and is penalized/excluded from the next five. StreamPlay may depend on server-side APIs, but compiled metadata is insufficient to assert WebView.
- **Authentication exclusions:** ShowBox and SuperStream explicitly require Google-login-derived cookies; Jellyfin requires a private server/authentication. They are not ranked.
`;

fs.writeFileSync(path.join(root, 'MOVIES_TV_PROVIDER_RANKING.md'), markdown);
console.log(`Ranked ${ranked.length} eligible providers; correlated ${jsFiles.length} JavaScript files.`);
