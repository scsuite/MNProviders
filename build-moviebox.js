#!/usr/bin/env node

const esbuild = require('esbuild');
const path = require('path');

esbuild.buildSync({
  entryPoints: [path.join(__dirname, 'src', 'providers', 'moviebox.js')],
  outfile: path.join(__dirname, 'providers', 'MovieBox.js'),
  bundle: true,
  format: 'cjs',
  platform: 'neutral',
  target: 'es2016',
  minify: false,
  sourcemap: false,
  external: [
    'crypto-js', 'cheerio-without-node-native', 'react-native-cheerio',
    'cheerio', 'axios'
  ],
  banner: { js: '/** MovieBox - generated from src/providers/moviebox.js */' },
  legalComments: 'none'
});

console.log('Built providers/MovieBox.js');
