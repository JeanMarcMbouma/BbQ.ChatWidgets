# Quick Start Guide - Angular Sample

## 5-Minute Setup

### 1. Get OpenAI API Key
- Go to https://platform.openai.com/api-keys
- Create a new API key
- Copy it to clipboard

### 2. Configure Backend

```bash
cd Sample/BbQ.ChatWidgets.Sample.Angular
cp appsettings.example.json appsettings.Development.json
```

Edit `appsettings.Development.json`:
```json
{
  "OpenAI": {
    "ApiKey": "sk-paste-your-key-here"
  }
}
```

### 3. Install Frontend Dependencies

```bash
cd ClientApp
npm install
```

### 4. Run Development Servers

**Terminal 1 - Backend:**
```bash
cd Sample/BbQ.ChatWidgets.Sample.Angular
dotnet run
# API available at http://localhost:5000/api/chat/
```

**Terminal 2 - Frontend:**
```bash
cd Sample/BbQ.ChatWidgets.Sample.Angular/ClientApp
npm start
# UI available at http://localhost:4200
```

### 5. Test It
- Open http://localhost:4200 in your browser
- Select a scenario from the home page
- Type "Hello" and press Send
- Watch the AI respond with widgets!

## Try These Commands

1. "Say hello to Alice" → Click the widget that appears
2. "What's your favorite color?" → Get a slider widget
3. "Rate this app" → Get a feedback widget

## Next Steps

- Read the full README.md for detailed docs
- Check ClientApp/src/app for component examples
- Explore Angular signals for reactive state management
- Customize the UI with Angular components

## Troubleshooting

**"OpenAI API key not found"**
- Make sure appsettings.Development.json has your actual API key

**"Cannot GET /api/chat/message"**
- Backend not running? Start it with `dotnet run`

**Frontend shows blank page**
- Check http://localhost:4200 in console for errors
- Did you run `npm install`?

**Need help?**
- Check README.md for detailed documentation
- Review the code comments in ClientApp/src
- Check backend logs in terminal
