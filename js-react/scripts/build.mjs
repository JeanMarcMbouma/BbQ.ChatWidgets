import { rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { build } from "esbuild";
rmSync(new URL("../dist", import.meta.url), { recursive: true, force: true });
execFileSync(process.execPath, ["node_modules/typescript/bin/tsc"], {
  stdio: "inherit",
});
for (const format of ["esm", "cjs"]) {
  await build({
    entryPoints: ["src/index.ts"],
    bundle: true,
    format,
    platform: "neutral",
    target: "es2022",
    packages: "external",
    jsx: "automatic",
    outfile: `dist/index.${format === "esm" ? "js" : "cjs"}`,
    sourcemap: true,
  });
}
