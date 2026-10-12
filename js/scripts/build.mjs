import esbuild from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';

function sources(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const filename = path.join(directory, entry.name);
    return entry.isDirectory()
      ? sources(filename)
      : filename.endsWith('.ts') && !/\.(spec|test)\.ts$/.test(filename)
        ? [filename]
        : [];
  });
}

// TypeScript emits declarations before this script runs. Keep them in dist.
fs.rmSync('dist/package.json', { force: true });
const common = { outdir: 'dist', platform: 'browser', target: 'es2020' };
// Shared chunks preserve model/registry identity across public ESM subpaths.
await esbuild.build({
  ...common,
  entryPoints: [
    'src/index.ts',
    'src/models/index.ts',
    'src/renderers/index.ts',
    'src/handlers/index.ts',
  ],
  outbase: 'src',
  bundle: true,
  splitting: true,
  format: 'esm',
  chunkNames: 'chunks/[name]-[hash]',
});
// CommonJS uses a shared module graph rather than four independent model copies.
await esbuild.build({
  ...common,
  entryPoints: sources('src'),
  outbase: 'src',
  bundle: false,
  format: 'cjs',
  outExtension: { '.js': '.cjs' },
});
for (const source of sources('src')) {
  const output = source.replace(/^src/, 'dist').replace(/\.ts$/, '.cjs');
  const content = fs
    .readFileSync(output, 'utf8')
    .replace(/require\("(\.[^"]+)"\)/g, (_match, specifier) => {
      const location = path.resolve(path.dirname(output), specifier);
      const target = fs.existsSync(`${location}.cjs`)
        ? `${specifier}.cjs`
        : `${specifier}/index.cjs`;
      return `require(${JSON.stringify(target)})`;
    });
  fs.writeFileSync(output, content);
}
fs.mkdirSync('dist/styles', { recursive: true });
for (const file of fs.readdirSync('src/styles').filter((file) => file.endsWith('.css')))
  fs.copyFileSync(`src/styles/${file}`, `dist/styles/${file}`);
for (const file of ['README.md', 'LICENSE'])
  if (fs.existsSync(file)) fs.copyFileSync(file, `dist/${file}`);
console.log('✓ Built ESM/CommonJS module graphs, declarations and themes');
