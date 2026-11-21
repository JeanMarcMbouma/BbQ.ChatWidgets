import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const npmCli = process.env.npm_execpath;
assert.ok(npmCli, "Run through npm run test:package");
const temp = mkdtempSync(path.join(process.env.BBQ_PACKAGE_TEST_TMPDIR ?? tmpdir(), "bbq-react-package-"));
const npm = (args, cwd = process.cwd()) =>
  execFileSync(process.execPath, [npmCli, ...args], { cwd, encoding: "utf8" });
try {
  const [core] = JSON.parse(
    npm(
      ["pack", "--ignore-scripts", "--json", "--pack-destination", temp],
      path.resolve("../js"),
    ),
  );
  const [pack] = JSON.parse(
    npm(["pack", "--ignore-scripts", "--json", "--pack-destination", temp]),
  );
  assert.ok(pack.files.some((file) => file.path === "dist/index.d.ts"));
  assert.ok(pack.files.some((file) => file.path === "dist/reporting.css"));
  assert.ok(pack.files.some((file) => file.path === "LICENSE"));
  for (const version of ["18", "19"]) {
    const directory = path.join(temp, version);
    const { mkdirSync } = await import("node:fs");
    mkdirSync(directory);
    writeFileSync(
      path.join(directory, "package.json"),
      JSON.stringify({ private: true, type: "module" }),
    );
    npm(
      [
        "install",
        "--ignore-scripts",
        "--no-audit",
        "--no-fund",
        path.join(temp, core.filename),
        path.join(temp, pack.filename),
        `react@${version}`,
        `react-dom@${version}`,
        `@types/react@${version}`,
        `@types/react-dom@${version}`,
        "typescript@~5.9.2",
      ],
      directory,
    );
    writeFileSync(
      path.join(directory, "check.mjs"),
      `
      import assert from 'node:assert/strict';
      import { createRequire } from 'node:module';
      import React from 'react';
      import { renderToString } from 'react-dom/server';
      import { PagedReportingGrid, ReportingWorkspace, WidgetRenderer, WidgetProvider, ChatWidget, BUILT_IN_WIDGET_COMPONENTS } from '@bbq-chat/widgets-react';
      import { ChatWidget as Core } from '@bbq-chat/widgets';
      assert.equal(ChatWidget, Core);
      assert.equal(Object.keys(BUILT_IN_WIDGET_COMPONENTS).length, 15);
      const props = { widgets: [{ type: 'input', label: 'Name', action: 'name' }] };
      assert.match(renderToString(React.createElement(WidgetProvider, null, React.createElement(WidgetRenderer, props))), /Name/);
      assert.match(renderToString(React.createElement(ReportingWorkspace)), /Reporting/);
      assert.equal(typeof PagedReportingGrid, 'function');
      const require = createRequire(import.meta.url);
      const cjs = require('@bbq-chat/widgets-react');
      assert.equal(cjs.ChatWidget, require('@bbq-chat/widgets').ChatWidget);
      assert.equal(typeof cjs.ReportingWorkspace, 'function');
      assert.ok(require.resolve('@bbq-chat/widgets-react/styles/reporting'));
      assert.match(require('react-dom/server').renderToString(require('react').createElement(cjs.WidgetRenderer, props)), /Name/);
    `,
    );
    writeFileSync(
      path.join(directory, "consumer.tsx"),
      `
      import { ReportingWorkspace, ReportingWidget, WidgetRenderer, WidgetProvider, WidgetRegistryService, ButtonWidget, type WidgetData, type ReportingWorkspaceAction } from '@bbq-chat/widgets-react';
      const widgets: WidgetData[] = [new ButtonWidget('Go', 'go'), new ReportingWidget('Sales', 'open', 'table')];
      const registry = new WidgetRegistryService();
      export const app = <WidgetProvider registry={registry}><WidgetRenderer widgets={widgets} onWidgetAction={(action, payload) => console.log(action, payload)} /></WidgetProvider>;
      export const reporting = <ReportingWorkspace onReportingAction={(action: ReportingWorkspaceAction) => console.log(action.payload)} />;
    `,
    );
    execFileSync(process.execPath, ["check.mjs"], {
      cwd: directory,
      stdio: "inherit",
    });
    execFileSync(
      process.execPath,
      [
        "node_modules/typescript/bin/tsc",
        "--noEmit",
        "--strict",
        "--jsx",
        "react-jsx",
        "--module",
        "ESNext",
        "--moduleResolution",
        "Bundler",
        "--target",
        "ES2022",
        "consumer.tsx",
      ],
      { cwd: directory, stdio: "inherit" },
    );
    console.log(
      `✓ React ${version}: installed tarball, ESM/CommonJS SSR, shared core identity and consumer types`,
    );
  }
} finally {
  rmSync(temp, { recursive: true, force: true });
}
