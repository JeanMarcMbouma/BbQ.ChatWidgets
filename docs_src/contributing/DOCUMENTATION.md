# Documentation Guide

Documentation sources live under `docs_src/`.

Generated documentation (DocFX site + TypeDoc output) is written to `docs/`.

## Build the docs locally

Prerequisites:

- .NET SDK 8
- DocFX (`docfx`) available on PATH
- Node/npm (only required for JS/TS docs)

From the repo root:

```powershell
./docs/generate-docs.ps1
```

To skip JS docs:

```powershell
./docs/generate-docs.ps1 -SkipJsDocs
```

## CI

The GitHub Pages build uses the same inputs and is defined in `.github/workflows/docs.yml`.
