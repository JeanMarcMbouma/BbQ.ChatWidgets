[CmdletBinding()]
param(
    [switch]$SkipJsDocs
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Assert-Command {
    param([Parameter(Mandatory = $true)][string]$Name)

    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        throw "Required command '$Name' was not found in PATH."
    }
}

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
Push-Location $repoRoot

try {
    Assert-Command dotnet
    Assert-Command docfx

    Write-Host 'Building .NET project (Release)...'
    dotnet build 'BbQ.ChatWidgets/BbQ.ChatWidgets.csproj' -c Release

    Write-Host 'Generating DocFX API metadata...'
    docfx metadata 'docfx.json'

    Write-Host 'Building DocFX site into ./docs ...'
    docfx build 'docfx.json' -o 'docs'

    if (-not $SkipJsDocs) {
        if (Get-Command npm -ErrorAction SilentlyContinue) {
            Write-Host 'Installing JS dependencies (npm ci)...'
            Push-Location 'js'
            npm ci
            Pop-Location

            Write-Host 'Generating JS docs (TypeDoc) into ./docs/js ...'
            npx --yes typedoc --options 'js/typedoc.json'
        }
        else {
            Write-Warning 'npm not found - skipping JS docs.'
        }
    }
}
finally {
    Pop-Location
}
