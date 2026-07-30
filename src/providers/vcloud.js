const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36';

function clean(value) {
  return String(value || '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;|&#160;/gi, ' ').replace(/&amp;/gi, '&').replace(/\s+/g, ' ').trim();
}

function origin(url) {
  const match = String(url).match(/^(https?:\/\/[^/]+)/i);
  return match ? match[1] : '';
}

function absolute(value, base) {
  if (!value) return null;
  const url = String(value).replace(/&amp;/gi, '&').trim();
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith('/')) return origin(base) + url;
  return String(base).replace(/\/[^/]*$/, '/') + url.replace(/^\.\//, '');
}

function anchors(html, base) {
  const output = [];
  const regex = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = regex.exec(html))) {
    const url = absolute(match[1], base);
    if (url) output.push({ url, text: clean(match[2]) });
  }
  return output;
}

async function getResponse(url, referer, redirect) {
  return fetch(url, {
    redirect: redirect || 'follow',
    headers: { 'User-Agent': USER_AGENT, Accept: 'text/html,*/*;q=0.8', ...(referer ? { Referer: referer } : {}) }
  });
}

function decodeTwice(value) {
  try { return atob(atob(value)); } catch (_) { return ''; }
}

function extractIntermediate(html) {
  const script = String(html);
  const encoded = script.match(/atob\(atob\(['"]([^'"]+)['"]\)\)/i);
  if (encoded) return decodeTwice(encoded[1]);
  const plain = script.match(/var\s+url\s*=\s*['"]([^'"]+)['"]/i);
  return plain ? plain[1] : '';
}

function qualityFrom(value) {
  const match = String(value).match(/(2160|1080|720|480|360)p?/i);
  if (!match) return 'Unknown';
  return match[1] === '2160' ? '4K' : `${match[1]}p`;
}

async function resolveServer(server, label, referer) {
  let url = server.url;
  const text = server.text;
  let name = text || 'V-Cloud';
  if (/buzzserver/i.test(text)) {
    const response = await getResponse(url.replace(/\/$/, '') + '/download', url, 'manual');
    const target = response.headers.get('hx-redirect');
    if (!target) return null;
    url = absolute(target, url);
    name = 'BuzzServer';
  } else if (/pixeldra|pixelserver|\bpixel\b/i.test(text)) {
    if (!/download/i.test(url)) url = origin(url) + '/api/file/' + url.split('/').filter(Boolean).pop() + '?download';
    name = 'Pixeldrain';
  } else if (/10\s*gbps/i.test(text)) {
    const response = await getResponse(url, referer, 'follow');
    url = response.url || url;
    if (url.includes('link=')) url = decodeURIComponent(url.split('link=').pop());
    name = '10Gbps';
    if (response.body && response.body.cancel) await response.body.cancel();
  } else if (/fslv2/i.test(text)) name = 'FSLv2';
  else if (/\bfsl\b/i.test(text)) name = 'FSL';
  else if (/pdl server/i.test(text)) name = 'PDL';
  else if (/s3 server/i.test(text)) name = 'S3';
  else if (/mega server/i.test(text)) name = 'Mega';
  return { name, url, quality: qualityFrom(label), headers: { 'User-Agent': USER_AGENT, Referer: referer } };
}

async function resolveVCloud(url, referer, label) {
  try {
    let response = await getResponse(url, referer);
    if (!response.ok) return { streams: [], blocked: `HTTP ${response.status}` };
    let html = await response.text();
    let pageUrl = response.url || url;
    if (/api\/index\.php/i.test(pageUrl)) {
      const next = anchors(html, pageUrl).find(item => /download|v-?cloud|continue/i.test(item.text + ' ' + item.url));
      if (!next) return { streams: [], blocked: 'api/index.php target missing' };
      response = await getResponse(next.url, pageUrl);
      if (!response.ok) return { streams: [], blocked: `HTTP ${response.status}` };
      html = await response.text();
      pageUrl = response.url || next.url;
    }
    const intermediate = absolute(extractIntermediate(html), pageUrl);
    if (!intermediate) return { streams: [], blocked: 'encoded intermediate URL missing' };
    response = await getResponse(intermediate, pageUrl);
    if (!response.ok) return { streams: [], blocked: `intermediate HTTP ${response.status}` };
    const serverHtml = await response.text();
    const serverPage = response.url || intermediate;
    const candidates = anchors(serverHtml, serverPage).filter(item => /fsl|buzz|pixel|pdl|10\s*gbps|s3 server|mega server/i.test(item.text));
    const results = await Promise.all(candidates.map(item => resolveServer(item, label, serverPage).catch(() => null)));
    return { streams: results.filter(Boolean), blocked: null };
  } catch (error) {
    return { streams: [], blocked: error && error.message ? error.message : String(error) };
  }
}

module.exports = { resolveVCloud };
