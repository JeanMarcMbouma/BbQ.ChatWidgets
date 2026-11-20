import { build } from 'esbuild';
import { readFile, writeFile } from 'node:fs/promises';

const target = new URL('../../BbQ.ChatWidgets.Blazor/wwwroot/js/reporting.js', import.meta.url);
const result = await build({
  entryPoints: ['src/reporting/blazor.ts'],
  bundle: true,
  write: false,
  format: 'esm',
  target: 'es2020',
  banner: { js: '// Generated from js/src/reporting by npm run build:reporting.' },
});
const output = result.outputFiles[0].text;
if (process.argv.includes('--check')) {
  if (await readFile(target, 'utf8') !== output) {
    throw new Error('The Blazor reporting asset is out of date. Run npm run build:reporting from js/.');
  }
} else {
  await writeFile(target, output);
}
