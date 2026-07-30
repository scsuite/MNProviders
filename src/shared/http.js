const DEFAULT_TIMEOUT_MS = 30000;
const RETRYABLE_STATUS = new Set([408, 425, 429, 500, 502, 503, 504]);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function mergeHeaders(...sets) {
  const result = {};
  for (const set of sets) {
    if (!set) continue;
    for (const key of Object.keys(set)) {
      if (set[key] !== undefined && set[key] !== null && set[key] !== '') result[key] = String(set[key]);
    }
  }
  return result;
}

function withReferer(headers, referer) {
  if (!referer) return mergeHeaders(headers);
  let origin;
  try { origin = new URL(referer).origin; } catch (_) {}
  return mergeHeaders(headers, { Referer: referer, Origin: origin });
}

async function request(url, options = {}) {
  const {
    timeoutMs = DEFAULT_TIMEOUT_MS,
    retries = 1,
    retryDelayMs = 300,
    ...fetchOptions
  } = options;

  let lastError;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
    try {
      const response = await fetch(url, {
        skipSizeCheck: true,
        ...fetchOptions,
        signal: controller ? controller.signal : fetchOptions.signal
      });
      if (!response.ok && RETRYABLE_STATUS.has(response.status) && attempt < retries) {
        await sleep(retryDelayMs * (attempt + 1));
        continue;
      }
      return response;
    } catch (error) {
      lastError = error;
      if (attempt >= retries) throw error;
      await sleep(retryDelayMs * (attempt + 1));
    } finally {
      if (timer) clearTimeout(timer);
    }
  }
  throw lastError || new Error(`Request failed: ${url}`);
}

async function getText(url, options) {
  const response = await request(url, options);
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
  return response.text();
}

async function getJson(url, options) {
  const response = await request(url, options);
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
  return response.json();
}

module.exports = { DEFAULT_TIMEOUT_MS, getJson, getText, mergeHeaders, request, withReferer };
