@echo off
REM BbQ ChatWidgets - Copy Themes Script
REM This script copies CSS themes from the NuGet package to your web project

setlocal enabledelayedexpansion

echo.
echo ========================================
echo  BbQ ChatWidgets - Theme Copy Utility
echo ========================================
echo.

REM Check if wwwroot exists
if not exist "wwwroot" (
    echo Error: 'wwwroot' directory not found.
    echo Please run this script from your web project root directory.
    echo.
    pause
    exit /b 1
)

REM Create themes directory if it doesn't exist
if not exist "wwwroot\themes" (
    echo Creating themes directory...
    mkdir "wwwroot\themes"
)

REM Find NuGet packages directory
set PACKAGES_DIR=%USERPROFILE%\.nuget\packages\bbq.chatwidgets

if not exist "!PACKAGES_DIR!" (
    echo Error: BbQ.ChatWidgets NuGet package not found.
    echo Please install the package first:
    echo   dotnet add package BbQ.ChatWidgets
    echo.
    pause
    exit /b 1
)

REM Find the latest version
for /d %%D in ("!PACKAGES_DIR!\*") do (
    set LATEST_VERSION=%%~nxD
)

set SOURCE_PATH=!PACKAGES_DIR!\!LATEST_VERSION!\contentFiles\any\any\themes

if not exist "!SOURCE_PATH!" (
    echo Error: Themes directory not found in package.
    echo Looking in: !SOURCE_PATH!
    echo.
    pause
    exit /b 1
)

REM Copy CSS files
echo Copying CSS theme files...
echo.

if exist "!SOURCE_PATH!\bbq-chat-light.css" (
    copy "!SOURCE_PATH!\bbq-chat-light.css" "wwwroot\themes\" /Y >nul
    echo [OK] bbq-chat-light.css
) else (
    echo [SKIP] bbq-chat-light.css - file not found
)

if exist "!SOURCE_PATH!\bbq-chat-dark.css" (
    copy "!SOURCE_PATH!\bbq-chat-dark.css" "wwwroot\themes\" /Y >nul
    echo [OK] bbq-chat-dark.css
) else (
    echo [SKIP] bbq-chat-dark.css - file not found
)

if exist "!SOURCE_PATH!\bbq-chat-corporate.css" (
    copy "!SOURCE_PATH!\bbq-chat-corporate.css" "wwwroot\themes\" /Y >nul
    echo [OK] bbq-chat-corporate.css
) else (
    echo [SKIP] bbq-chat-corporate.css - file not found
)

if exist "!SOURCE_PATH!\README.md" (
    copy "!SOURCE_PATH!\README.md" "wwwroot\themes\" /Y >nul
    echo [OK] README.md
) else (
    echo [SKIP] README.md - file not found
)

echo.
echo ========================================
echo  ? Themes copied successfully!
echo ========================================
echo.
echo Location: wwwroot\themes\
echo.
echo Next steps:
echo 1. Link theme in your HTML:
echo    ^<link rel="stylesheet" href="/themes/bbq-chat-light.css"^>
echo.
echo 2. Register services in Program.cs:
echo    builder.Services.AddBbQChatWidgets(options =^> {
echo        options.RoutePrefix = "/api/chat";
echo    }^);
echo.
echo 3. Map endpoints:
echo    app.MapBbQChatEndpoints();
echo.
echo For more info, see: NUGET_INTEGRATION_GUIDE.md
echo.
pause
