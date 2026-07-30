const cheerio = require('cheerio-without-node-native');

function parseHtml(html) {
  return cheerio.load(typeof html === 'string' ? html : '');
}

function decodeBase64(value) {
  if (!value) return '';
  if (typeof globalThis.atob === 'function') return globalThis.atob(value);
  if (typeof Buffer !== 'undefined') return Buffer.from(value, 'base64').toString('utf8');
  throw new Error('No base64 decoder is available in this runtime');
}

function absoluteUrl(value, baseUrl) {
  if (!value) return '';
  try { return new URL(value, baseUrl).href; } catch (_) { return ''; }
}

module.exports = { absoluteUrl, decodeBase64, parseHtml };
