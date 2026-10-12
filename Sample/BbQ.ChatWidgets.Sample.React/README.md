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

## Troubleshooting local model widgets

Try a new conversation with `Show me a weather widget for London.`, `Show me a live clock widget.`, or `Show me a button labelled Say hello.` These use registered templates with working action and stream IDs. Rebuild and restart the server after changing widget registrations or instructions.

Strict mode sends template examples to the model and requires it to call `emit_widgets`. Action IDs such as `weather_update` are widget properties, not model tools. When adding a custom widget, register its action handler and provide a template with the correct action and any stream defaults. Built-in placeholder actions are excluded from examples when registered actions are required.

Both demos enable `RequireWidgetDecision`: with the default tool list, the provider receives `tool_choice: required`. The model must emit widgets or explicitly return an empty array for ordinary chat. The default no-op `retry_tool` has been removed; repair uses the actual emission tool. Applications with additional custom tools use a named emission-tool choice and need a provider that honors it. This option is opt-in for library consumers.

For loopback model endpoints, both demos instead default to `StructuredResponse`. Override with `OpenAI:UseStructuredResponses`. This generates a single schema-constrained `{content, widgets}` response and validates every widget before returning it. Local schemas are forwarded unchanged: the OpenAI adapter otherwise rewrites constraints such as `minItems` into descriptions, which local grammar engines cannot enforce. Structured streaming buffers the JSON until complete, then emits the validated final turn; it does not stream JSON fragments into the chat UI.

Basic and streaming chat enable **Include a widget** by default. This sends `requireWidgets: true` and requires a nonempty widget array in the schema and validator. Clear it for ordinary text-only chat. API clients can set the same request property explicitly; it defaults to false. A schema guarantees structure, not that a small model chooses the right widget or writes accurate prose.

Demo generation defaults to temperature 0 and a 1024-token output limit, configurable through `OpenAI:Temperature` and `OpenAI:MaxOutputTokens`. Increase the limit for large widget forms or charts.

Basic and streaming chat display a notice for unsuccessful or empty widget outcomes. The API returns `widgetGeneration.status`: `emitted`, `none` (explicit empty decision), `rejected` (with validation diagnostics), or `not_called` (provider/model skipped the tool or invocation middleware was absent). These outcomes are independent of the assistant's claims. A required tool choice cannot guarantee a model chooses the correct widget; inspect the returned state as well as the status.

If a widget does not appear, check the server output for `Widget emission rejected` under `BbQ.ChatWidgets.Services.ChatWidgetService`. Each warning includes a diagnostic code, JSON path, reason, and whether another repair is allowed. For example, `widget.action.unregistered` at `/widgets/0/action` lists the registered alternatives. A rejected call accepts no widgets; the model gets one repair opportunity. Keep warning-level logging enabled for this category.

The chat API's `widgets` array is the source of truth: prose claiming a widget was displayed does not create one. Small local models can still fail to follow instructions; the server never silently substitutes an invented action.

## Contributing

This is a sample application. Feel free to:
- Extend widgets with custom types
- Add more action handlers
- Modify the UI styling
- Integrate additional AI features

## License

Same as BbQ.ChatWidgets library.
