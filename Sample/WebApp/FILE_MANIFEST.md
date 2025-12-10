# File Manifest - Sample/WebApp Project

## Backend Files

### Configuration & Setup
- **WebApp.csproj** - .NET project file (SDK.Web, local library reference)
- **Program.cs** - ASP.NET Core entry point with DI setup
- **appsettings.json** - Production configuration template
- **appsettings.Development.json** - Development configuration (API key)
- **appsettings.example.json** - Example template for developers

### Functionality
- **Actions/SampleActions.cs** - Greeting and Feedback action handlers

### Containerization
- **Dockerfile** - Multi-stage build (Node.js → .NET)
- **docker-compose.yml** - Docker composition with environment variables

### Static Files
- **wwwroot/** - Directory for serving built React app (auto-generated)

## Frontend Files

### Configuration
- **package.json** - Dependencies, build scripts, workspace reference to @bbq/chatwidgets
- **tsconfig.json** - TypeScript compiler configuration
- **tsconfig.node.json** - Build tools TypeScript configuration
- **vite.config.ts** - Vite build tool and dev server configuration
- **.eslintrc.cjs** - ESLint configuration for code quality
- **index.html** - HTML entry point for React
- **.gitignore** - Git ignore patterns for frontend

### Application Code

#### Entry Points
- **src/main.tsx** - React root entry point
- **src/App.tsx** - Main application component

#### Hooks
- **src/hooks/useChat.ts** - Custom hook for chat API integration
  - Message state management
  - API communication (POST /api/chat/message and /api/chat/action)
  - Thread ID management
  - Loading and error states

#### Components
- **src/components/ChatWindow.tsx** - Main container component
  - Header with title and clear button
  - Error banner display
  - Composition of MessageList and ChatInput
  
- **src/components/MessageList.tsx** - Message display component
  - Auto-scrolling to latest message
  - User and assistant message differentiation
  - Widget rendering for each message
  - Loading indicator
  - Empty state message
  
- **src/components/ChatInput.tsx** - User input component
  - Textarea with auto-resize
  - Shift+Enter for newline, Enter to send
  - Loading state handling
  - Form submission
  
- **src/components/WidgetRenderer.tsx** - Widget rendering component
  - Uses SsrWidgetRenderer from @bbq/chatwidgets
  - Handles widget action delegation
  - Event delegation for button clicks
  - JSON payload parsing

#### Styles
- **src/styles/index.css** - Global styles and CSS variables
  - Font configuration
  - Button base styles
  - Link styling
  - Responsive design variables
  
- **src/styles/App.css** - Component-specific styles (340 lines)
  - Chat window layout (flexbox)
  - Message styling (user vs assistant)
  - Input area styling
  - Widget container styling
  - Animations (slideIn, pulse)
  - Responsive breakpoints for mobile
  - Gradient backgrounds
  - Color scheme

## Documentation Files

### README.md (Comprehensive Guide)
- Project overview and features
- Complete project structure
- Prerequisites and setup steps
- Local development instructions
- API endpoint documentation
- Docker deployment guide
- Configuration options
- Frontend architecture explanation
- Widget support details
- Troubleshooting guide
- Example conversation flow

### QUICKSTART.md (5-Minute Setup)
- Minimal steps to get running
- OpenAI API key setup
- Installation commands
- Quick test examples
- Common troubleshooting

### ENV_SETUP.md (Configuration Guide)
- Environment variable setup
- Development configuration
- Production deployment
- Configuration precedence
- Model options and recommendations

### IMPLEMENTATION.md (Technical Summary)
- Complete file listing with line counts
- Features breakdown
- Technology stack
- Integration patterns
- Development workflows
- API endpoint reference
- Configuration examples
- Customization points

## Root Files
- **.gitignore** - Git ignore patterns (obj/, bin/, wwwroot, etc.)

## Total File Count: 28 files
- Backend: 5 files
- Frontend: 23 files
  - Configuration: 8 files
  - Code: 7 files
  - Styles: 2 files
  - Documentation: 6 files (in root)

## Key Integration Points

1. **Backend → Local Library**
   - `WebApp.csproj` includes `<ProjectReference>` to `BbQ.ChatWidgets.csproj`
   - `Program.cs` uses `AddBbQChatWidgets()` and `MapBbQChatEndpoints()`

2. **Frontend → Local Library**
   - `package.json` references `@bbq/chatwidgets` via `file:../../../js`
   - `WidgetRenderer.tsx` imports and uses `SsrWidgetRenderer`
   - Type imports from library (ChatWidget, ChatTurn, ChatRole)

3. **Frontend → Backend**
   - `useChat` hook calls `/api/chat/message` and `/api/chat/action`
   - `vite.config.ts` proxies `/api` to `http://localhost:5000`
   - Environment-based API base URL configuration

4. **Configuration Flow**
   - `appsettings.Development.json` → `appsettings.json` → Environment variables
   - OpenAI API key loaded from configuration
   - ASP.NET Core built-in configuration management

## Build Artifacts
- **ClientApp/dist/** - Frontend build output (created by `npm run build`)
- **wwwroot/** - Symlink/copy destination for frontend build
- **bin/Debug** and **bin/Release** - .NET build outputs

## Production Readiness
✅ All files in place
✅ Local library references configured
✅ Documentation complete
✅ Docker support included
✅ Error handling implemented
✅ Type safety (TypeScript + C#)
✅ Responsive design
✅ CORS configured
✅ Configuration management
✅ Example actions included
