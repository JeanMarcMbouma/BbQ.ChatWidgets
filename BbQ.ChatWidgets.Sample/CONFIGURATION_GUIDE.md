# Production Configuration Guide

This guide shows how to configure the sample application for different environments using appsettings files.

## Configuration Hierarchy

Configuration is loaded in this order (later sources override earlier ones):

1. **appsettings.json** - Default settings (safe values, no secrets)
2. **appsettings.{Environment}.json** - Environment-specific settings
3. **User Secrets** - Local development secrets (development only)
4. **Environment Variables** - System environment variables
5. **Command-line Arguments** - Runtime overrides

## File Structure

```
BbQ.ChatWidgets.Sample/
??? Program.cs
??? appsettings.json                (Defaults, no secrets)
??? appsettings.Development.json    (Dev overrides)
??? appsettings.Production.json     (Production overrides)
??? README.md
```

## Configuration Files

### appsettings.json (Default)

```json
{
  "OpenAI": {
    "ModelId": "gpt-4"
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft": "Warning"
    }
  }
}
```

**Note**: Never include `ApiKey` here!

### appsettings.Development.json

```json
{
  "OpenAI": {
    "ModelId": "gpt-3.5-turbo"
  },
  "Logging": {
    "LogLevel": {
      "Default": "Debug",
      "Microsoft": "Information"
    }
  }
}
```

### appsettings.Production.json

```json
{
  "OpenAI": {
    "ModelId": "gpt-4"
  },
  "Logging": {
    "LogLevel": {
      "Default": "Warning",
      "Microsoft": "Warning"
    }
  }
}
```

## Environment Variables

Use environment variables to set secrets in production:

### Windows

```powershell
$env:OpenAI__ApiKey = "sk-your-api-key"
$env:ASPNETCORE_ENVIRONMENT = "Production"
```

### Linux/Mac

```bash
export OpenAI__ApiKey="sk-your-api-key"
export ASPNETCORE_ENVIRONMENT="Production"
```

### Docker

```dockerfile
ENV OpenAI__ApiKey=sk-your-api-key
ENV ASPNETCORE_ENVIRONMENT=Production
```

## Configuration in Code

Update Program.cs to use environment variables:

```csharp
var configuration = new ConfigurationBuilder()
    .SetBasePath(Directory.GetCurrentDirectory())
    .AddJsonFile("appsettings.json", optional: false, reloadOnChange: true)
    .AddJsonFile($"appsettings.{Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Production"}.json", optional: true)
    .AddUserSecrets<Program>(optional: true)  // Only in development
    .AddEnvironmentVariables()
    .Build();
```

## Deployment Scenarios

### Local Development

```bash
# Use User Secrets
cd BbQ.ChatWidgets.Sample
dotnet user-secrets set "OpenAI:ApiKey" "sk-..."
dotnet run
```

### Docker Container

```dockerfile
FROM mcr.microsoft.com/dotnet/sdk:8.0 as build
WORKDIR /src
COPY . .
RUN dotnet build

FROM mcr.microsoft.com/dotnet/runtime:8.0
WORKDIR /app
COPY --from=build /src/bin/Release/net8.0 .

ENV OpenAI__ApiKey=${OPENAI_API_KEY}
ENV ASPNETCORE_ENVIRONMENT=Production

ENTRYPOINT ["dotnet", "BbQ.ChatWidgets.Sample.dll"]
```

Run with:

```bash
docker run -e OPENAI_API_KEY="sk-..." my-sample-app
```

### Azure App Service

1. In Azure Portal, go to Configuration ? Application Settings
2. Add new setting:
   - Name: `OpenAI__ApiKey`
   - Value: `sk-...`
3. Save and restart app

### Azure Key Vault

```csharp
var configuration = new ConfigurationBuilder()
    .AddJsonFile("appsettings.json")
    .AddAzureKeyVault(
        new Uri($"https://{keyVaultUrl}.vault.azure.net/"),
        new DefaultAzureCredential())
    .AddEnvironmentVariables()
    .Build();
```

### AWS Secrets Manager

```csharp
var configuration = new ConfigurationBuilder()
    .AddJsonFile("appsettings.json")
    .AddSecretsManager(region: Amazon.RegionEndpoint.USEast1)
    .AddEnvironmentVariables()
    .Build();
```

## Best Practices by Environment

### Development

- ? Use User Secrets
- ? Enable verbose logging
- ? Use gpt-3.5-turbo (cheaper for testing)
- ? Set `reloadOnChange: true` for appsettings

### Staging

- ? Use environment variables
- ? Use same model as production (gpt-4)
- ? Set warning-level logging
- ? Use production-like configuration

### Production

- ? Use Key Vault/Secrets Manager
- ? Use minimal logging (Warning level)
- ? Use production model (gpt-4)
- ? Monitor and audit access
- ? Rotate keys regularly

## Environment-Specific Settings

### Development

```json
{
  "OpenAI": {
    "ModelId": "gpt-3.5-turbo"
  },
  "Logging": {
    "LogLevel": {
      "Default": "Debug"
    }
  }
}
```

### Production

```json
{
  "OpenAI": {
    "ModelId": "gpt-4"
  },
  "Logging": {
    "LogLevel": {
      "Default": "Warning"
    }
  }
}
```

## Sensitive Configuration

Never include sensitive data in:

- ? appsettings.json
- ? appsettings.Development.json
- ? appsettings.Production.json
- ? Source code
- ? Git repositories

Always use:

- ? User Secrets (development)
- ? Environment Variables (any)
- ? Azure Key Vault (Azure)
- ? AWS Secrets Manager (AWS)
- ? Docker Secrets (Docker Swarm)
- ? Kubernetes Secrets (Kubernetes)

## Configuration Examples

### Development Setup

```bash
# Initialize User Secrets
dotnet user-secrets init

# Set API key
dotnet user-secrets set "OpenAI:ApiKey" "sk-dev-key"

# Run with Development environment (default)
dotnet run
```

### Production Setup

```bash
# Build release
dotnet build --configuration Release

# Set environment variables
export OpenAI__ApiKey="sk-prod-key"
export ASPNETCORE_ENVIRONMENT="Production"

# Run
dotnet BbQ.ChatWidgets.Sample.dll
```

### Docker Setup

```bash
# Build image
docker build -t bbq-sample .

# Run with environment variable
docker run \
  -e OpenAI__ApiKey="sk-prod-key" \
  -e ASPNETCORE_ENVIRONMENT="Production" \
  bbq-sample
```

## Troubleshooting

### Configuration not loading

1. Verify file names match environment
2. Check file paths
3. Verify JSON syntax is valid
4. Check environment variable names (use `__` for nesting)

### Secrets not working

1. Ensure User Secrets initialized: `dotnet user-secrets init`
2. Verify secret is set: `dotnet user-secrets list`
3. Run in Development environment: `$env:ASPNETCORE_ENVIRONMENT = "Development"`

### Wrong configuration loaded

1. Check environment variable: `echo $env:ASPNETCORE_ENVIRONMENT`
2. Verify configuration hierarchy
3. Check file contents match environment

## Testing Configuration

Add a `--list-config` option to test configuration loading:

```csharp
if (args.Contains("--list-config"))
{
    Console.WriteLine("Current Configuration:");
    Console.WriteLine($"OpenAI:ApiKey: {(string.IsNullOrEmpty(configuration["OpenAI:ApiKey"]) ? "[NOT SET]" : "[SET]")}");
    Console.WriteLine($"OpenAI:ModelId: {configuration["OpenAI:ModelId"]}");
    return;
}
```

Use it:

```bash
dotnet run -- --list-config
```

---

For more information, see the main [README.md](README.md)
