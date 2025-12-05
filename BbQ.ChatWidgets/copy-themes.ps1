# BbQ ChatWidgets - Copy Themes Script (PowerShell)
# This script copies CSS themes from the NuGet package to your web project

Write-Host ""
Write-Host "========================================"
Write-Host "  BbQ ChatWidgets - Theme Copy Utility"
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if wwwroot exists
if (-not (Test-Path "wwwroot")) {
    Write-Host "Error: 'wwwroot' directory not found." -ForegroundColor Red
    Write-Host "Please run this script from your web project root directory."
    Write-Host ""
    exit 1
}

# Create themes directory if it doesn't exist
$themesDir = "wwwroot\themes"
if (-not (Test-Path $themesDir)) {
    Write-Host "Creating themes directory..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $themesDir | Out-Null
}

# Find NuGet packages directory
$packagesDir = Join-Path $env:USERPROFILE ".nuget\packages\bbq.chatwidgets"

if (-not (Test-Path $packagesDir)) {
    Write-Host "Error: BbQ.ChatWidgets NuGet package not found." -ForegroundColor Red
    Write-Host "Please install the package first:"
    Write-Host "  dotnet add package BbQ.ChatWidgets"
    Write-Host ""
    exit 1
}

# Find the latest version
$versions = Get-ChildItem -Path $packagesDir -Directory | 
    Select-Object -ExpandProperty Name | 
    Sort-Object -Version -Descending

if ($null -eq $versions) {
    Write-Host "Error: No versions found in NuGet package cache." -ForegroundColor Red
    exit 1
}

$latestVersion = $versions[0]
$sourcePath = Join-Path $packagesDir $latestVersion "contentFiles\any\any\themes"

if (-not (Test-Path $sourcePath)) {
    Write-Host "Error: Themes directory not found in package." -ForegroundColor Red
    Write-Host "Looking in: $sourcePath"
    Write-Host ""
    exit 1
}

# Copy CSS files
Write-Host "Copying CSS theme files..." -ForegroundColor Yellow
Write-Host ""

$themeFiles = @(
    "bbq-chat-light.css",
    "bbq-chat-dark.css",
    "bbq-chat-corporate.css",
    "README.md"
)

$copiedCount = 0

foreach ($file in $themeFiles) {
    $sourceFile = Join-Path $sourcePath $file
    $destFile = Join-Path $themesDir $file
    
    if (Test-Path $sourceFile) {
        Copy-Item -Path $sourceFile -Destination $destFile -Force
        Write-Host "[OK] $file" -ForegroundColor Green
        $copiedCount++
    }
    else {
        Write-Host "[SKIP] $file - file not found" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ? Themes copied successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if ($copiedCount -eq 0) {
    Write-Host "Warning: No files were copied." -ForegroundColor Yellow
    exit 1
}

Write-Host "Location: $themesDir" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Link theme in your HTML:"
Write-Host '   <link rel="stylesheet" href="/themes/bbq-chat-light.css">'
Write-Host ""
Write-Host "2. Register services in Program.cs:"
Write-Host "   builder.Services.AddBbQChatWidgets(options => {"
Write-Host "       options.RoutePrefix = ""/api/chat"";"
Write-Host "   });"
Write-Host ""
Write-Host "3. Map endpoints:"
Write-Host "   app.MapBbQChatEndpoints();"
Write-Host ""
Write-Host "For more info, see: NUGET_INTEGRATION_GUIDE.md" -ForegroundColor Cyan
Write-Host ""
