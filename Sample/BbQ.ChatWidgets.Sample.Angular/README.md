# BbQ.ChatWidgets Angular Sample

This is a full-stack Angular + .NET sample application demonstrating how to use **BbQ.ChatWidgets** with OpenAI integration.

## Features

- **Angular Frontend**: Modern, responsive chat UI built with Angular 17+ standalone components and signals
- **ASP.NET Core Backend**: Web API using the local BbQ.ChatWidgets library
- **Local Library Integration**: Both frontend and backend reference local workspace versions
- **OpenAI Integration**: GPT-4o-mini (configurable) for AI responses
- **Interactive Widgets**: Display and handle custom widgets from AI responses
- **Typed Actions**: Example greeting and feedback actions with strong typing
- **Signal-Based State Management**: Leveraging Angular signals for reactive state
- **Standalone Components**: Modern Angular architecture without modules

## Project Structure

```
Sample/BbQ.ChatWidgets.Sample.Angular/
├── Program.cs                          # ASP.NET Core Web API entry point
├── BbQ.ChatWidgets.Sample.Angular.csproj # .NET project file
├── appsettings.json                    # Production config
├── appsettings.Development.json        # Development config (with API key)
├── appsettings.example.json            # Example config template
├── wwwroot/                            # Angular build output (auto-generated)
└── ClientApp/                          # Angular frontend
    ├── package.json                    # Dependencies (uses local @bbq/chatwidgets)
    ├── angular.json                    # Angular build config
    ├── tsconfig.json                   # TypeScript config
    ├── src/
    │   ├── main.ts                     # Angular bootstrap
    │   ├── styles.css                  # Global styles
    │   ├── proxy.conf.json             # Dev server proxy config
    │   └── app/
    │       ├── app.component.ts        # Root component
    │       ├── app.config.ts           # App configuration with providers
    │       ├── models/                 # TypeScript interfaces
    │       ├── config/                 # App configuration
    │       ├── services/               # Angular services with signals
    │       ├── components/             # Reusable components
    │       └── pages/                  # Page components
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
cd Sample/BbQ.ChatWidgets.Sample.Angular
cp appsettings.example.json appsettings.Development.json
```

PowerShell (Windows):
```powershell
Set-Location -Path Sample\BbQ.ChatWidgets.Sample.Angular
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
cd Sample/BbQ.ChatWidgets.Sample.Angular
dotnet run
```

The backend will start on `http://localhost:5000` and serve the API endpoints at `/api/chat/`.

**Terminal 2 - Frontend dev server:**
```bash
cd Sample/BbQ.ChatWidgets.Sample.Angular/ClientApp
npm start
```

The frontend will start on `http://localhost:4200` with Angular CLI dev server. The `proxy.conf.json` proxies API calls to `http://localhost:5000/api`.

### Option B: Full production build (for testing)

```bash
cd Sample/BbQ.ChatWidgets.Sample.Angular
dotnet run
```

Navigate to `http://localhost:5000` to see the full app with the built frontend.

## API Endpoints

The backend provides the same endpoints as the React sample (from BbQ.ChatWidgets library):

### POST `/api/chat/message`

Send a user message and get an AI response.

**Request:**
```json
{
  "message": "Hello!",
  "threadId": "unique-thread-id",
  "persona": "You are a concise travel assistant."
}
```

`persona` is optional and only works when persona is enabled at DI registration (`options.EnablePersona = true`). If omitted or blank, the server falls back to the thread persona (if set) and then to the DI-configured default persona.

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

## Angular Architecture

### Standalone Components

This sample uses Angular 17+ standalone components architecture:
- No NgModules required
- Components are self-contained with their own imports
- Simplified dependency injection

### Signals for State Management

The sample leverages Angular signals for reactive state:

```typescript
// In chat.service.ts
private _messages = signal<ChatMessage[]>([]);
readonly messages = this._messages.asReadonly();

// Update state
this._messages.update(msgs => [...msgs, newMessage]);
```

### Services

- **ChatService**: Manages chat state with signals for reactive updates
- **StreamingChatService**: Handles streaming responses
- **SseService**: Manages Server-Sent Events subscriptions

`ChatService.sendMessage(...)` and `StreamingChatService.sendStreamingMessage(...)` both accept an optional `persona` argument and send `null` when it is blank.

### Components

- **HomeComponent**: Landing page with scenario selection
- **ChatWindow**: Container component for chat UI
- **MessageList**: Displays messages with auto-scrolling
- **ChatInput**: Input field with auto-resize
- **WidgetRenderer**: SSR-based widget rendering

## Configuration

### Environment Variables

You can configure the app using environment variables:

```bash
export OpenAI__ApiKey=sk-your-api-key
export OpenAI__ModelId=gpt-4o-mini
dotnet run
```

### appsettings.json Hierarchy

1. `appsettings.json` - Base settings
2. `appsettings.Development.json` - Development overrides (local API key)
3. `appsettings.Production.json` - Production overrides
4. Environment variables - Highest priority

## Troubleshooting

### "OpenAI API key not found"

Make sure `appsettings.Development.json` has the correct `OpenAI:ApiKey` value.

### Frontend can't connect to backend

- Check that backend is running on `http://localhost:5000`
- In dev mode, check that `proxy.conf.json` is correct
- Check browser DevTools Network tab for API errors

### Module not found errors

Make sure to install dependencies:
```bash
cd Sample/BbQ.ChatWidgets.Sample.Angular/ClientApp
npm install
```

### Frontend won't build

Clear cache and rebuild:
```bash
cd ClientApp
rm -rf node_modules .angular dist
npm install
npm run build
```

## Differences from React Sample

While the functionality is the same, this Angular sample demonstrates:
- **Signals** instead of React hooks for state management
- **Standalone components** instead of React functional components
- **RxJS Observables** for async operations
- **Angular's HttpClient** instead of fetch
- **Dependency Injection** for services

## Contributing

This is a sample application. Feel free to:
- Extend widgets with custom types
- Add more action handlers
- Modify the UI styling
- Integrate additional AI features

## License

Same as BbQ.ChatWidgets library.
