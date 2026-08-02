function getStreams(tmdbId, mediaType, seasonNum, episodeNum) {
  var type = mediaType === 'tv' ? 'tv' : 'movie';
  var suffix = type === 'tv' ? ' S' + seasonNum + 'E' + episodeNum : '';
  return Promise.resolve([{
    name: 'MovieBox Runtime Test - PASS',
    title: 'Nuvio loaded MovieBox provider for TMDB ' + tmdbId + suffix,
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    quality: '1080p',
    size: 'Runtime diagnostic',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36'
    },
    provider: 'MovieBox'
  }]);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { getStreams: getStreams };
} else {
  global.getStreams = getStreams;
}
