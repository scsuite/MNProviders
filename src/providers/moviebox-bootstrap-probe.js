var MIRRORS = [
  'https://api3.aoneroom.com',
  'https://api4.aoneroom.com',
  'https://api4sg.aoneroom.com',
  'https://api5.aoneroom.com',
  'https://api6.aoneroom.com'
];

var BOOTSTRAP_PATH = '/wefeed-mobile-bff/tab/ranking-list?tabId=0&categoryType=4516404531735022304&page=1&perPage=1';
var SAMPLE_URL = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';
var CLIENT_INFO = {
  package_name: 'com.community.oneroom',
  version_name: '3.0.13.0325.03',
  version_code: 50020088,
  os: 'android',
  os_version: '13',
  device_id: 'd7578036d13336cc',
  install_store: 'ps',
  system_language: 'en',
  net: 'NETWORK_WIFI',
  region: 'US',
  timezone: 'Asia/Calcutta',
  sp_code: ''
};
var USER_AGENT = 'com.community.oneroom/50020088 (Linux; U; Android 13; en_US; Pixel 7; Build/TQ3A.230901.001; Cronet/145.0.7582.0)';

function hostOf(mirror) {
  return mirror.replace(/^https?:\/\//, '');
}

function resultStream(host, detail, index) {
  return {
    name: 'MovieBox API Probe | ' + host + ' | ' + detail,
    title: 'Signed bootstrap diagnostic (token redacted)',
    url: SAMPLE_URL + '?moviebox_bootstrap_probe=' + index,
    quality: '1080p',
    size: 'Runtime diagnostic',
    headers: { 'User-Agent': 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36' },
    provider: 'MovieBoxBootstrapProbe'
  };
}

function tokenPresent(response) {
  var raw = response.headers && response.headers.get ? response.headers.get('x-user') : null;
  if (!raw) return false;
  try {
    var parsed = JSON.parse(raw);
    return !!(parsed && parsed.token);
  } catch (_) {
    return false;
  }
}

function signedHeaders(CryptoJS) {
  var timestamp = Date.now();
  var reversed = String(timestamp).split('').reverse().join('');
  var clientToken = CryptoJS.MD5(reversed).toString(CryptoJS.enc.Hex) + '_' + timestamp;
  var canonical = 'GET\n/wefeed-mobile-bff/tab/ranking-list\ncategoryType=4516404531735022304&page=1&perPage=1&tabId=0\n\n' + timestamp;
  var secret = CryptoJS.enc.Base64.parse('8NzZpUmwwN3MweFNOOWpxbUVXQXQ3OUVCSlp1bElRSXNWNjRGWnIyTw==');
  var signature = CryptoJS.enc.Base64.stringify(CryptoJS.HmacMD5(canonical, secret)) + '|2|' + timestamp;
  return {
    'User-Agent': USER_AGENT,
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'x-client-token': clientToken,
    'x-tr-signature': signature,
    'x-client-info': JSON.stringify(CLIENT_INFO),
    'x-client-status': '0'
  };
}

function probeMirror(CryptoJS, mirror, index) {
  var request = fetch(mirror + BOOTSTRAP_PATH, {
    method: 'GET',
    headers: signedHeaders(CryptoJS)
  }).then(function (response) {
    var signing = response.status === 407 ? 'SIGNATURE REJECTED' : 'SIGNATURE ACCEPTED/OTHER';
    var token = tokenPresent(response) ? 'token YES' : 'token NO';
    return resultStream(hostOf(mirror), 'HTTP ' + response.status + ' | ' + signing + ' | ' + token, index);
  }).catch(function (error) {
    return resultStream(hostOf(mirror), 'FETCH ERROR ' + String(error && error.message || error).slice(0, 70), index);
  });

  var timeout = new Promise(function (resolve) {
    setTimeout(function () {
      resolve(resultStream(hostOf(mirror), 'TIMEOUT 12s', index));
    }, 12000);
  });
  return Promise.race([request, timeout]);
}

function getStreams() {
  return Promise.resolve().then(function () {
    var CryptoJS = require('crypto-js');
    return Promise.all(MIRRORS.map(function (mirror, index) {
      return probeMirror(CryptoJS, mirror, index);
    }));
  }).catch(function (error) {
    return [resultStream('runtime', 'CRYPTO/RUNTIME ERROR ' + String(error && error.message || error).slice(0, 80), 99)];
  });
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { getStreams: getStreams };
} else {
  global.getStreams = getStreams;
}
