function normalizeTitle(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\b(the|a|an)\b/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function titleScore(candidate, wanted) {
  const a = normalizeTitle(candidate);
  const b = normalizeTitle(wanted);
  if (!a || !b) return 0;
  if (a === b) return 100;
  if (a.includes(b) || b.includes(a)) return 70;
  const wantedWords = new Set(b.split(' '));
  const overlap = a.split(' ').filter((word) => wantedWords.has(word)).length;
  return Math.round((overlap / Math.max(wantedWords.size, 1)) * 50);
}

function bestTitleMatch(items, wanted, getTitle = (item) => item.title) {
  return items.reduce((best, item) => {
    const score = titleScore(getTitle(item), wanted);
    return !best || score > best.score ? { item, score } : best;
  }, null)?.item || null;
}

function episodeNumber(value) {
  const match = String(value || '').match(/(?:episode|ep|e)\s*[-.:#]?\s*(\d+(?:\.\d+)?)/i)
    || String(value || '').match(/\b(\d+(?:\.\d+)?)\b/);
  return match ? Number(match[1]) : null;
}

function matchesEpisode(value, wanted) {
  const actual = episodeNumber(value);
  return actual !== null && actual === Number(wanted);
}

module.exports = { bestTitleMatch, episodeNumber, matchesEpisode, normalizeTitle, titleScore };
