#!/bin/bash

# BbQ.ChatWidgets Build Script
# This script builds the complete solution: backend library, JavaScript library, and React app

set -e  # Exit on error

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo ""
echo "========================================"
echo "  BbQ.ChatWidgets Build Script"
echo "========================================"
echo ""

# Check for required tools
echo "Checking for required tools..."

if ! command -v dotnet &> /dev/null; then
    echo -e "${RED}Error: .NET SDK not found. Please install .NET 8 SDK.${NC}"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo -e "${RED}Error: npm not found. Please install Node.js.${NC}"
    exit 1
fi

echo -e "${GREEN}[OK]${NC} dotnet found:"
dotnet --version

echo -e "${GREEN}[OK]${NC} npm found:"
npm --version

echo ""
echo "========================================"
echo "  Building Complete Solution"
echo "========================================"
echo ""
echo "Note: The React ClientApp will be compiled automatically"
echo "as part of the .NET build process (WebApp project target)"
echo ""

if ! dotnet build -c Release; then
    echo -e "${RED}ERROR: Build failed!${NC}"
    exit 1
fi

echo ""
echo "========================================"
echo "  Build Summary"
echo "========================================"
echo ""
echo -e "${GREEN}[OK]${NC} .NET Backend - Release"
echo -e "${GREEN}[OK]${NC} .NET Library - Release"
echo -e "${GREEN}[OK]${NC} React Sample App - Auto-compiled to wwwroot/"
echo ""
echo "========================================"
echo "  Next Steps"
echo "========================================"
echo ""
echo "To run the application:"
echo ""
echo "  cd Sample/WebApp"
echo "  dotnet run"
echo ""
echo "  Then open http://localhost:5000"
echo ""
echo "To run development mode with hot reload:"
echo ""
echo "  Terminal 1 (Backend):"
echo "  cd Sample/WebApp"
echo "  dotnet run"
echo ""
echo "  Terminal 2 (Frontend with hot reload):"
echo "  cd Sample/WebApp/ClientApp"
echo "  npm run dev"
echo ""
echo "  Then open http://localhost:5173"
echo ""
echo "========================================"
echo ""
