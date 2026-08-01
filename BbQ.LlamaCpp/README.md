# BbQ.LlamaCpp

Verified installation and supervised `llama-server` lifecycle for local Schema First BbQ.ChatWidgets testing.

## Install

```shell
dotnet add package BbQ.LlamaCpp
```

## Configure and run

Copy `deployment-manifest.example.json` from the package or repository sample. Replace its illustrative sources, sizes, SHA-256 values, versions, and model license with approved immutable artifacts.

```csharp
using System.Runtime.InteropServices;
using BbQ.LlamaCpp;

var manifest = LlamaCppDeploymentManifestLoader.Load("deployment-manifest.json");
var dependencies = new LlamaCppDependencyOptions(
    RootDirectory: Path.Combine(AppContext.BaseDirectory, ".llama.cpp"),
    RuntimeIdentifier: RuntimeInformation.RuntimeIdentifier,
    Backend: "cpu",
    AllowNetworkDownloads: true,
    OfflineBundleDirectory: null);
var resolver = new VerifiedLlamaCppDependencyResolver(new HttpClient(), manifest, dependencies);
await using var runtime = new LlamaCppRuntime(resolver, new HttpClient(), new());
var ready = await runtime.EnsureReadyAsync();
```

The ready report contains a loopback OpenAI-compatible endpoint and random API key. Configure a Microsoft.Extensions.AI client for that endpoint and use `WidgetGenerationMode.StrictToolCall` so local and hosted models receive the same canonical `emit_widgets` schema.

## Manifest and security

Artifacts are selected by runtime identifier/backend and must have a pinned version, exact byte size, SHA-256, filename, and license. The resolver prefers an offline bundle, downloads only when enabled, verifies before installation, and re-verifies cached artifacts. Runtime archives must identify `llama-server`; the process binds only to loopback and is terminated when `LlamaCppRuntime` is disposed. Do not put credentials in manifests or accept floating URLs/checksums.

## Runnable sample

See `Sample/BbQ.ChatWidgets.Sample.LlamaCpp` in the repository. Run it with `dotnet run --project Sample/BbQ.ChatWidgets.Sample.LlamaCpp -- path/to/deployment-manifest.json`. The sample provisions and starts the server, then requires a successful Schema First `emit_widgets` tool call before reporting success. The recommended CPU profile is Qwen2.5-1.5B-Instruct Q4_K_M (about 1.1 GB on disk and typically 1.5–2.5 GB free RAM). Ordinary CI does not reference or exercise llama.cpp; local verification is intentionally opt-in.
