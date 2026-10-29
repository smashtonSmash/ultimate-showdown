// Bundles the app into one self-contained dist/index.html (JS and CSS inlined).
// `node build.mjs --serve` rebuilds on change and serves on http://localhost:5173.
import * as esbuild from 'esbuild';
import { cpSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const serve = process.argv.includes('--serve');

const options = {
  entryPoints: ['src/ui/main.tsx'],
  bundle: true,
  minify: !serve && !process.env.DEBUG,
  write: false,
  outdir: 'dist',
  format: 'iife',
  target: ['es2020', 'safari15'],
  jsx: 'automatic',
  loader: { '.json': 'json' },
  define: { 'process.env.NODE_ENV': serve ? '"development"' : '"production"' },
  logLevel: 'warning',
};

function emit(result) {
  const js = result.outputFiles.find((f) => f.path.endsWith('.js')).text;
  const css = result.outputFiles.find((f) => f.path.endsWith('.css'))?.text ?? '';
  const html = readFileSync('index.html', 'utf8')
    .replace('<!--STYLES-->', () => `<style>${css}</style>`)
    .replace('<!--SCRIPT-->', () => `<script>${js.replace(/<\/script/gi, '<\\/script')}</script>`);
  mkdirSync('dist', { recursive: true });
  writeFileSync('dist/index.html', html);
  writeFileSync('dist/404.html', html);
  // Home-screen icons and the web app manifest sit next to the page.
  cpSync('public', 'dist', { recursive: true });
  console.log(`dist/index.html ${(html.length / 1024).toFixed(0)} KB`);
}

if (serve) {
  const ctx = await esbuild.context({ ...options, plugins: [{ name: 'emit', setup: (b) => b.onEnd((r) => r.errors.length || emit(r)) }] });
  await ctx.watch();
  await ctx.serve({ servedir: 'dist', port: 5173 });
  console.log('http://localhost:5173');
} else {
  emit(await esbuild.build(options));
}
