import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

// npm supplies its CLI path when running package scripts. Invoke it through
// Node so Windows does not need to execute the npm.cmd shell wrapper.
const npmCli = process.env.npm_execpath;
assert.ok(npmCli, 'Run this check with npm run test:package');

// Test the tarball an end user installs, not source files or workspace symlinks.
const temp = mkdtempSync(path.join(tmpdir(), 'bbq-package-'));
try {
  const [pack] = JSON.parse(
    execFileSync(process.execPath, [npmCli, 'pack', '--ignore-scripts', '--json', '--pack-destination', temp], {
      encoding: 'utf8',
    })
  );
  writeFileSync(path.join(temp, 'package.json'), JSON.stringify({ private: true, type: 'module' }));
  execFileSync(
    process.execPath,
    [npmCli, 'install', '--ignore-scripts', '--no-audit', '--no-fund', path.join(temp, pack.filename)],
    { cwd: temp, stdio: 'pipe' }
  );
  const checks = `
    import assert from 'node:assert/strict';
    import { createRequire } from 'node:module';
    import { ChatWidget, ImageWidget, ButtonWidget } from '@bbq-chat/widgets';
    import { ChatWidget as Model } from '@bbq-chat/widgets/models';
    import { SsrWidgetRenderer } from '@bbq-chat/widgets/renderers';
    import { WidgetEventManager } from '@bbq-chat/widgets/handlers';
    assert.ok(new WidgetEventManager());
    assert.equal(Model, ChatWidget);
    const image = ChatWidget.fromObject({ type: 'image', label: 'Image', action: 'view', imageUrl: '/photo.png' });
    assert.ok(image instanceof ImageWidget);
    assert.equal(Model.fromObject(null), null);
    assert.match(new SsrWidgetRenderer().renderWidget(new ButtonWidget('Go', 'go')), /Go/);
    const require = createRequire(import.meta.url);
    for (const name of ['@bbq-chat/widgets', '@bbq-chat/widgets/models', '@bbq-chat/widgets/renderers', '@bbq-chat/widgets/handlers']) assert.ok(require(name));
    assert.equal(require('@bbq-chat/widgets').ChatWidget, require('@bbq-chat/widgets/models').ChatWidget);
    assert.equal(require('@bbq-chat/widgets').ChatWidget.fromObject({ type:'image', imageUrl:'/photo.png' }).type, 'image');
    for (const name of ['styles', 'styles/light', 'styles/dark', 'styles/corporate']) assert.ok(require.resolve('@bbq-chat/widgets/' + name));
  `;
  writeFileSync(path.join(temp, 'check.mjs'), checks);
  execFileSync(process.execPath, ['check.mjs'], { cwd: temp, stdio: 'inherit' });
  assert.ok(pack.files.some((file) => file.path === 'dist/index.d.ts'));
  console.log(
    '✓ Installed tarball: ESM, CommonJS, model deserialization, subpaths, declarations and styles'
  );
} finally {
  rmSync(temp, { recursive: true, force: true });
}
