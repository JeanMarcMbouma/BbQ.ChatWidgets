This sample project documentation has been consolidated into the top-level `docs_src/examples/` and the `Sample/WebApp` project. See `docs_src/index.md` for links.
# BbQ.ChatWidgets Web API Sample

This is a full-stack React + .NET sample application demonstrating how to use **BbQ.ChatWidgets** with OpenAI integration.

## Features

- **React Frontend**: Modern, responsive chat UI built with React 18 + TypeScript
- **ASP.NET Core Backend**: Web API using the local BbQ.ChatWidgets library
- **Local Library Integration**: Both frontend and backend reference local workspace versions
- **OpenAI Integration**: GPT-4o-mini (configurable) for AI responses
- **Interactive Widgets**: Display and handle custom widgets from AI responses
- **Typed Actions**: Example greeting and feedback actions with strong typing

## Project Structure

```
Sample/WebApp/
├── Program.cs                          # ASP.NET Core Web API entry point
├── WebApp.csproj                       # .NET project file
├── appsettings.json                    # Production config
├── appsettings.Development.json        # Development config (with API key)
├── appsettings.example.json            # Example config template
├── Actions/
│   └── SampleActions.cs                # Greeting and Feedback actions
├── wwwroot/                            # React build output (auto-generated)
└── ClientApp/                          # React frontend
    ├── package.json                    # Dependencies (uses local @bbq/chatwidgets)
    ├── vite.config.ts                  # Vite build config
    ├── tsconfig.json                   # TypeScript config
    ├── index.html                      # HTML entry point
    └── src/
        ├── main.tsx                    # React entry point
        ├── App.tsx                     # Main app component
        ├── hooks/
        │   └── useChat.ts              # Chat API hook
        ├── components/
        │   ├── ChatWindow.tsx          # Main chat window
        │   ├── MessageList.tsx         # Message display
        │   ├── ChatInput.tsx           # Message input
        │   └── WidgetRenderer.tsx      # Widget rendering
        └── styles/
            ├── index.css               # Global styles
            └── App.css                 # Component styles
```

## Prerequisites

- **.NET 8.0 SDK**: [Download](https://dotnet.microsoft.com/download)
- **Node.js 18+**: [Download](https://nodejs.org/)
- **OpenAI API Key**: Get one at [platform.openai.com](https://platform.openai.com/api-keys)

## Setup

### 1. Configure OpenAI API Key

Configure OpenAI API Key — copy example settings and add your API key.

Bash (macOS / Linux):
```bash
cd Sample/WebApp
cp appsettings.example.json appsettings.Development.json
```

PowerShell (Windows):
```powershell
Set-Location -Path Sample\WebApp
Copy-Item -Path appsettings.example.json -Destination appsettings.Development.json
```

Then edit `appsettings.Development.json` and set `OpenAI:ApiKey` (and optionally `OpenAI:ModelId`).

```json
{
  "OpenAI": {
    "ModelId": "gpt-4o-mini",
    "ApiKey": "sk-your-actual-api-key-here"
  }
}
```

### 2. Install Dependencies

**Frontend**:
```bash
cd ClientApp
npm install
```

### 3. Build Frontend

```bash
cd ClientApp
npm run build
```

This creates the production build in `wwwroot/` which the .NET server will serve.

## Local Development

### Option A: Frontend dev server + Backend API (Recommended for development)

**Terminal 1 - Backend API:**
```bash
cd Sample/WebApp
dotnet run
```

The backend will start on `http://localhost:5000` and serve the API endpoints at `/api/chat/`.

**Terminal 2 - Frontend dev server:**
```bash
cd Sample/WebApp/ClientApp
npm run dev
```

The frontend will start on `http://localhost:5173` with Vite's dev server. The `vite.config.ts` proxies API calls to `http://localhost:5000/api`.

### Option B: Full production build (for testing)

```bash
cd Sample/WebApp
dotnet run
```

Navigate to `http://localhost:5000` to see the full app with the built frontend.

## API Endpoints

The backend provides two endpoints (from BbQ.ChatWidgets library):

### POST `/api/chat/message`

Send a user message and get an AI response.

**Request:**
```json
{
  "message": "Hello!",
  "threadId": "unique-thread-id"
}
```

**Response:**
```json
{
  "role": "assistant",
  "content": "Hello! How can I help you today?",
  "widgets": [
    {
      "type": "button",
      "id": "btn_1",
      "label": "Get Started",
      "action": "greet"
    }
  ],
  "threadId": "unique-thread-id"
}
```

### POST `/api/chat/action`

Handle widget actions (e.g., button clicks).

**Request:**
```json
{
  "action": "greet",
  "payload": {
    "name": "Alice",
    "message": "Nice to meet you!"
  },
  "threadId": "unique-thread-id"
}
```

**Response:**
```json
{
  "role": "assistant",
  "content": "Hello, Alice! Nice to meet you!",
  "widgets": [...],
  "threadId": "unique-thread-id"
}
```

## Docker Deployment

Build and run with Docker:

```bash
docker-compose up --build
```

The app will be available at `http://localhost:5000`.

**Docker-compose.yml:**
```yaml
version: '3.8'

services:
  webapp:
    build: .
    ports:
      - "5000:8080"
    environment:
      - ASPNETCORE_ENVIRONMENT=Production
      - OpenAI__ApiKey=sk-your-api-key
      - OpenAI__ModelId=gpt-4o-mini
```

## Configuration

### Environment Variables

You can configure the app using environment variables:

```bash
export OpenAI__ApiKey=sk-your-api-key
export OpenAI__ModelId=gpt-4o-mini
dotnet run
```

Or in Docker:
```yaml
environment:
  - OpenAI__ApiKey=sk-your-api-key
  - OpenAI__ModelId=gpt-4o-mini
```

### appsettings.json Hierarchy

1. `appsettings.json` - Base settings
2. `appsettings.Development.json` - Development overrides (local API key)
3. `appsettings.Production.json` - Production overrides
4. Environment variables - Highest priority

## Frontend Architecture

### useChat Hook

The `useChat` hook manages chat state and API communication:

```typescript
const {
  messages,           // Array of ChatMessage
  isLoading,          // Boolean
  error,              // Error message or null
  threadId,           // Current conversation thread
  sendMessage,        // (message: string) => Promise<void>
  sendAction,         // (action: string, payload: unknown) => Promise<void>
  clearMessages,      // () => void
} = useChat('/api/chat');
```

### Components

- **ChatWindow**: Container component that orchestrates the entire chat UI
- **MessageList**: Displays messages with auto-scrolling to latest
- **ChatInput**: Textarea-based input with auto-resize and Shift+Enter support
- **WidgetRenderer**: SSR-based widget rendering with event delegation

## Widget Support

The sample supports all widget types from BbQ.ChatWidgets:

- **ButtonWidget**: Interactive buttons
- **SliderWidget**: Numeric range selection
- **InputWidget**: Text input
- **DropdownWidget**: Select options
- **CheckboxWidget**: Boolean selection
- **CarouselWidget**: Scrollable item list

Widgets are rendered using the `SsrWidgetRenderer` from the library, and actions are sent back to the backend for processing.

## Troubleshooting

### "OpenAI API key not found"

Make sure `appsettings.Development.json` has the correct `OpenAI:ApiKey` value.

### Frontend can't connect to backend

- Check that backend is running on `http://localhost:5000`
- In dev mode, check that `vite.config.ts` proxy is correct
- Check browser DevTools Network tab for API errors

### Module not found errors

Make sure to install dependencies:
```bash
cd Sample/WebApp/ClientApp
npm install
```

### Frontend won't build

Clear cache and rebuild:
```bash
cd ClientApp
rm -r node_modules dist
npm install
npm run build
```

## Example Conversation

1. **User**: "Say hello to Alice"
2. **Assistant**: Shows a greeting button widget
3. **User**: Clicks widget with name "Alice"
4. **Backend**: Handles `greet` action with payload
5. **Assistant**: Returns personalized greeting

## Contributing

This is a sample application. Feel free to:
- Extend widgets with custom types
- Add more action handlers
- Modify the UI styling
- Integrate additional AI features

## License

Same as BbQ.ChatWidgets library.
