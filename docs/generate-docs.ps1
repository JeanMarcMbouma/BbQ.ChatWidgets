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

Write-Host "Building project..."
dotnet build BbQ.ChatWidgets/BbQ.ChatWidgets.csproj -c Release

if (-not (Get-Command docfx -ErrorAction SilentlyContinue)) {
    Write-Warning "DocFX not found. Install it (choco install docfx) or use 'dotnet tool install -g docfx' and re-run this script.";
    exit 0
}

Write-Host "Generating metadata..."
docfx metadata docfx.json

Write-Host "Building docs site..."
docfx build docfx.json

Write-Host "Docs generation finished. Output: docs_site"
