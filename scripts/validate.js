#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const manifestPath = path.join(root, 'manifest.json');
const errors = [];

function fail(message) {
  errors.push(message);
  console.error(`FAIL: ${message}`);
}

let manifest;
try {
  manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  console.log('PASS: manifest.json is valid JSON');
} catch (error) {
  fail(`manifest.json is not valid JSON: ${error.message}`);
}

if (manifest) {
  if (!Array.isArray(manifest.scrapers)) {
    fail('manifest.json must contain a scrapers array');
  } else {
    for (const scraper of manifest.scrapers) {
      const label = scraper.id || scraper.name || '<unnamed>';
      if (typeof scraper.filename !== 'string' || !scraper.filename) {
        fail(`${label} has no filename`);
        continue;
      }

      const providerPath = path.resolve(root, scraper.filename.split(/[?#]/, 1)[0]);
      const relative = path.relative(root, providerPath);
      if (relative.startsWith('..') || path.isAbsolute(relative)) {
        fail(`${label} filename escapes the repository: ${scraper.filename}`);
        continue;
      }
      if (!fs.existsSync(providerPath) || !fs.statSync(providerPath).isFile()) {
        fail(`${label} provider file does not exist: ${scraper.filename}`);
        continue;
      }
      console.log(`PASS: ${label} provider file exists`);

      const syntax = spawnSync(process.execPath, ['--check', providerPath], {
        encoding: 'utf8'
      });
      if (syntax.status !== 0) {
        fail(`${label} has invalid JavaScript syntax: ${(syntax.stderr || syntax.stdout).trim()}`);
        continue;
      }
      console.log(`PASS: ${label} JavaScript syntax is valid`);

      const source = fs.readFileSync(providerPath, 'utf8');
      const hasGetStreamsExport = [
        /module\.exports\s*=\s*\{[\s\S]*?\bgetStreams\b[\s\S]*?\}/,
        /exports\.getStreams\s*=/,
        /export\s*\{[\s\S]*?\bgetStreams\b[\s\S]*?\}/,
        /export\s+(?:async\s+)?function\s+getStreams\b/
      ].some((pattern) => pattern.test(source));
      if (!hasGetStreamsExport) {
        fail(`${label} does not export getStreams`);
      } else {
        console.log(`PASS: ${label} exports getStreams`);
      }
    }
  }
}

if (errors.length) {
  console.error(`\nValidation failed with ${errors.length} error(s).`);
  process.exit(1);
}

console.log('\nAll manifest provider validations passed.');
