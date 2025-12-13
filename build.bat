@echo off
REM BbQ.ChatWidgets Build Script
REM This script builds the complete solution: backend library, JavaScript library, and React app

setlocal enabledelayedexpansion
set SCRIPT_DIR=%~dp0
cd /d "%SCRIPT_DIR%"

echo.
echo ========================================
echo  BbQ.ChatWidgets Build Script
echo ========================================
echo.

REM Colors and formatting
set SUCCESS=Build completed successfully!
set ERROR=Build failed!

REM Check for required tools
echo Checking for required tools...
where dotnet >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: .NET SDK not found. Please install .NET 8 SDK.
    exit /b 1
)

where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: npm not found. Please install Node.js.
    exit /b 1
)

echo. [OK] dotnet found: 
dotnet --version

echo. [OK] npm found: 
npm --version

echo.
echo ========================================
echo  Building Complete Solution
echo ========================================
echo.
echo Note: The React ClientApp will be compiled automatically
echo as part of the .NET build process (WebApp project target)
echo.

dotnet build -c Release
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Build failed!
    exit /b 1
)

echo.
echo ========================================
echo  Build Summary
echo ========================================
echo.
echo [OK] .NET Backend - Release
echo [OK] .NET Library - Release
echo [OK] React Sample App - Auto-compiled to wwwroot/
echo.
echo ========================================
echo  Next Steps
echo ========================================
echo.
echo To run the application:
echo.
echo   cd Sample\WebApp
echo   dotnet run
echo.
echo   Then open http://localhost:5000
echo.
echo To run development mode with hot reload:
echo.
echo   Terminal 1 (Backend):
echo   cd Sample\WebApp
echo   dotnet run
echo.
echo   Terminal 2 (Frontend with hot reload):
echo   cd Sample\WebApp\ClientApp
echo   npm run dev
echo.
echo   Then open http://localhost:5173
echo.
echo ========================================
echo.
pause
