#!/usr/bin/env node

const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

const root = __dirname;
const manifestPath = path.join(root, 'manifest.json');
const srcDir = path.join(root, 'src');
const outDir = path.join(root, 'providers');
const EXTERNAL_MODULES = [
  'cheerio-without-node-native',
  'react-native-cheerio',
  'cheerio',
  'crypto-js',
  'axios'
];

function discoverProviderEntries() {
  const discovered = [];
  const flatDir = path.join(srcDir, 'providers');
  if (fs.existsSync(flatDir)) {
    for (const name of fs.readdirSync(flatDir)) {
      if (name.endsWith('.js')) discovered.push(path.join(flatDir, name));
    }
  }
  if (fs.existsSync(srcDir)) {
    for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
      if (!entry.isDirectory() || entry.name === 'providers' || entry.name === 'shared') continue;
      const nested = path.join(srcDir, entry.name, 'index.js');
      if (fs.existsSync(nested)) discovered.push(nested);
    }
  }
  return discovered.map((entry) => path.resolve(entry));
}

function loadManifest() {
  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  } catch (error) {
    throw new Error(`Invalid manifest.json: ${error.message}`);
  }
  if (!Array.isArray(manifest.scrapers)) throw new Error('Invalid manifest.json: scrapers must be an array');
  return manifest;
}

function resolveManifestEntry(scraper) {
  if (!scraper || typeof scraper.filename !== 'string' || !scraper.filename) {
    throw new Error(`${scraper?.id || '<unnamed>'}: missing filename`);
  }
  const entry = path.resolve(root, scraper.source || scraper.filename);
  const relative = path.relative(root, entry);
  if (relative.startsWith('..') || path.isAbsolute(relative)) throw new Error(`${scraper.id}: filename escapes repository`);
  if (!fs.existsSync(entry) || !fs.statSync(entry).isFile()) throw new Error(`${scraper.id}: missing provider file ${scraper.filename}`);
  return entry;
}

async function buildOne(scraper, entry) {
  const outputName = `${scraper.id}.js`;
  const output = path.join(outDir, outputName);
  await esbuild.build({
    entryPoints: [entry],
    bundle: true,
    outfile: output,
    format: 'cjs',
    platform: 'neutral',
    target: 'es2016',
    minify: false,
    sourcemap: false,
    external: EXTERNAL_MODULES,
    banner: { js: `/** ${scraper.id} - generated from ${path.relative(root, entry).replace(/\\/g, '/')} */` },
    logLevel: 'silent'
  });
  return { outputName, bytes: fs.statSync(output).size };
}

async function main() {
  const manifest = loadManifest();
  const discovered = discoverProviderEntries();
  const selectedIds = new Set(process.argv.slice(2).filter((arg) => !arg.startsWith('-')));
  const referenced = selectedIds.size
    ? manifest.scrapers.filter((item) => selectedIds.has(item.id) || selectedIds.has(item.name))
    : manifest.scrapers;
  if (selectedIds.size && referenced.length !== selectedIds.size) {
    const found = new Set(referenced.flatMap((item) => [item.id, item.name]));
    throw new Error(`Unknown manifest provider(s): ${[...selectedIds].filter((id) => !found.has(id)).join(', ')}`);
  }

  console.log(`Discovered provider entries: ${discovered.length}`);
  console.log(`Manifest providers selected: ${referenced.length}`);
  const resolved = [];
  const broken = [];
  for (const scraper of referenced) {
    try { resolved.push({ scraper, entry: resolveManifestEntry(scraper) }); }
    catch (error) { broken.push(error.message); }
  }
  if (broken.length) {
    broken.forEach((reason) => console.error(`BROKEN: ${reason}`));
    console.error(`Build summary: discovered=${discovered.length} built=0 skipped=${discovered.length} broken=${broken.length}`);
    process.exit(1);
  }

  fs.mkdirSync(outDir, { recursive: true });
  let built = 0;
  const failures = [];
  for (const { scraper, entry } of resolved) {
    try {
      const result = await buildOne(scraper, entry);
      built += 1;
      console.log(`BUILT: ${scraper.id} -> providers/${result.outputName} (${(result.bytes / 1024).toFixed(1)} KB)`);
    } catch (error) {
      failures.push(`${scraper.id}: ${error.message}`);
      console.error(`BROKEN: ${scraper.id}: ${error.message}`);
    }
  }

  const referencedPaths = new Set(resolved.map((item) => item.entry));
  const skipped = discovered.filter((entry) => !referencedPaths.has(entry));
  for (const entry of skipped) console.log(`SKIPPED: ${path.relative(root, entry).replace(/\\/g, '/')} (not referenced by manifest)`);
  console.log(`Build summary: discovered=${discovered.length} built=${built} skipped=${skipped.length} broken=${failures.length}`);
  if (failures.length) process.exit(1);
}

main().catch((error) => {
  console.error(`Build failed: ${error.message}`);
  process.exit(1);
});
