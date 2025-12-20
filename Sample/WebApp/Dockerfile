# Multi-stage build: Node.js for frontend + .NET for backend

# Stage 1: Build frontend
FROM node:18-alpine AS frontend-build
WORKDIR /app/ClientApp

# Copy package files
COPY ClientApp/package.json ClientApp/package-lock.json* ./

# Install dependencies
RUN npm ci

# Copy frontend source
COPY ClientApp/src ./src
COPY ClientApp/index.html ./
COPY ClientApp/tsconfig.json ./
COPY ClientApp/tsconfig.node.json ./
COPY ClientApp/vite.config.ts ./

# Build frontend
RUN npm run build

# Stage 2: Build and run backend
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS backend-build
WORKDIR /build

# Copy solution files
COPY BbQ.ChatWidgets/ ./BbQ.ChatWidgets/
COPY Sample/WebApp/ ./Sample/WebApp/
COPY BbQ.ChatWidgets.slnx .
COPY .gitignore .

# Restore and build
RUN dotnet restore "Sample/WebApp/WebApp.csproj"
RUN dotnet build "Sample/WebApp/WebApp.csproj" -c Release --no-restore

# Publish
RUN dotnet publish "Sample/WebApp/WebApp.csproj" -c Release -o /app/publish --no-build

# Stage 3: Runtime
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

# Copy published backend
COPY --from=backend-build /app/publish .

# Copy built frontend to wwwroot
COPY --from=frontend-build /app/ClientApp/dist ./wwwroot

EXPOSE 8080

ENV ASPNETCORE_URLS=http://+:8080

ENTRYPOINT ["dotnet", "BbQ.ChatWidgets.Sample.WebApp.dll"]
