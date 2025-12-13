This environment setup guidance has been consolidated into `docs/GETTING_STARTED.md`.
# Environment Variables Guide

## Development Setup

Create `appsettings.Development.json` with your actual API key:

```json
{
  "OpenAI": {
    "ModelId": "gpt-4o-mini",
    "ApiKey": "sk-your-actual-api-key-here"
  },
  "Logging": {
    "LogLevel": {
      "Default": "Debug"
    }
  }
}
```

**DO NOT commit this file to git** - it contains your API key!

## Production Deployment

Set environment variables before running:

```bash
export OPENAI__APIKEY=sk-your-api-key
export OPENAI__MODELID=gpt-4o-mini
export ASPNETCORE_ENVIRONMENT=Production
dotnet run
```

Or with Docker:

```bash
docker-compose up --build
```

The docker-compose.yml reads `OPENAI_API_KEY` from environment:

```bash
export OPENAI_API_KEY=sk-your-api-key
docker-compose up --build
```

## Configuration Precedence

1. Environment Variables (highest priority)
2. appsettings.Development.json
3. appsettings.json
4. Default values in code

## Available Settings

### OpenAI Configuration

- `OpenAI:ModelId` - Model to use (default: "gpt-4o-mini")
- `OpenAI:ApiKey` - Your OpenAI API key (required)

### Logging

- `Logging:LogLevel:Default` - Default log level (Information, Debug, Warning, Error)
- `Logging:LogLevel:Microsoft` - ASP.NET Core framework logs

### CORS (Development)

By default, development allows any origin. In production, consider restricting this in Program.cs.

## Model Options

| Model | Cost | Speed | Quality |
|-------|------|-------|---------|
| gpt-4o-mini | Low | Fast | Good |
| gpt-4o | Higher | Medium | Excellent |
| gpt-4-turbo | High | Slow | Excellent |

## Tips

- Use gpt-4o-mini for development (cheaper)
- Use gpt-4o for production (better quality)
- Check your API quota at https://platform.openai.com/account/billing
- Set spending limits to avoid surprise charges
