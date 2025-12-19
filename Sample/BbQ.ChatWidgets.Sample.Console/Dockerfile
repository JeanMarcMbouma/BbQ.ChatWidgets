FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build

WORKDIR /src

# Copy project files
COPY BbQ.ChatWidgets.Sample/BbQ.ChatWidgets.Sample.csproj ./BbQ.ChatWidgets.Sample/
COPY BbQ.ChatWidgets/BbQ.ChatWidgets.csproj ./BbQ.ChatWidgets/

# Restore packages
RUN dotnet restore BbQ.ChatWidgets.Sample/BbQ.ChatWidgets.Sample.csproj

# Copy source
COPY . .

# Build
RUN dotnet build BbQ.ChatWidgets.Sample/BbQ.ChatWidgets.Sample.csproj -c Release

# Publish
RUN dotnet publish BbQ.ChatWidgets.Sample/BbQ.ChatWidgets.Sample.csproj -c Release -o /app/publish

# Runtime stage
FROM mcr.microsoft.com/dotnet/runtime:8.0

WORKDIR /app

COPY --from=build /app/publish .

# Environment variables
ENV ASPNETCORE_ENVIRONMENT=Production

# Expects OpenAI API key to be passed at runtime
ENTRYPOINT ["dotnet", "BbQ.ChatWidgets.Sample.dll"]
