const esbuild = require('esbuild');
const path = require('path');

esbuild.buildSync({
  entryPoints: [path.join(__dirname, 'src', 'index.js')],
  outfile: path.join(__dirname, 'dist', 'worker.js'),
  bundle: true,
  minify: true,
  format: 'esm',
  platform: 'browser',
  target: ['es2022'],
  legalComments: 'none',
  define: { 'process.env.NODE_ENV': '"production"' }
});

console.log('Built worker/dist/worker.js');
