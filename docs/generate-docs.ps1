<#
Generate API docs and build site (requires docfx)

Usage:
  PowerShell: .\docs\generate-docs.ps1

This script will:
 - build the `BbQ.ChatWidgets` project (Release)
 - run `docfx metadata` to produce API YAML
 - run `docfx build` to generate the site into `docs_site`

If `docfx` is not installed, install via:
  choco install docfx -y
  # or
  dotnet tool install -g docfx
#>

Write-Host "Building project (Release) and regenerating XML docs..."
dotnet build BbQ.ChatWidgets/BbQ.ChatWidgets.csproj -c Release

if (-not (Get-Command docfx -ErrorAction SilentlyContinue)) {
  Write-Warning "DocFX not found. Install it (choco install docfx) or use 'dotnet tool install -g docfx' and re-run this script.";
  exit 0
}

# Generate API metadata from compiled assembly (safer when source has compile warnings)
Write-Host "Generating DocFX metadata from assembly..."
docfx metadata docfx.json

Write-Host "Building .NET docs site into ./docs/..."
# Build into the `docs` folder so final site lives under repository `docs/` for GitHub Pages or similar
docfx build docfx.json -o docs

# ---- JS docs (TypeDoc) ----
if (Test-Path "js") {
  if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Warning "npm not found — skipping JS docs. Install Node/npm to generate JS docs.";
  }
  else {
    Push-Location js
    Write-Host "Generating JS docs using npx typedoc (no local node_modules will be installed)"
    # Use npx with --yes to avoid prompting; this uses the network cache without creating local node_modules
    npx --yes typedoc --out ../docs/js "src" --tsconfig tsconfig.json --options typedoc.json

    Pop-Location
  }
}

Write-Host "Docs generation finished. Output: docs/ (and docs/js for TypeScript docs if generated)"
