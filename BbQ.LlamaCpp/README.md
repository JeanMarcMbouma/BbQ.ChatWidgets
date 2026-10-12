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

## Live demo integration checks

The React and Angular demo servers accept `OpenAI:Endpoint` for an OpenAI-compatible local server. Include `/v1` in the endpoint. With llama-server running on loopback, configure these environment variables in PowerShell:

```powershell
$env:ASPNETCORE_ENVIRONMENT = 'Development'
$env:OpenAI__Endpoint = 'http://127.0.0.1:8099/v1'
$env:OpenAI__ModelId = 'local-model'
$env:OpenAI__ApiKey = 'local-live-test' # Must match the local server's --api-key.
dotnet run --project Sample/BbQ.ChatWidgets.Sample.React --no-launch-profile -- --urls http://127.0.0.1:5099
```

Run the checks from a second terminal at the repository root:

```powershell
node Sample/test-live-model.mjs http://127.0.0.1:5099
```

The check sends real inference requests and verifies schema-validated widget generation, conversation memory, typed widget actions, streamed deltas/final widgets, and empty-input rejection. It exits nonzero on failure and writes responses and timings to `artifacts/local-model/live-results.json`. An optional third argument selects a different report path. The same check works against the Angular demo server.

Verified locally with llama.cpp `b11429` and Qwen2.5-1.5B-Instruct Q4_K_M, model revision `91cad51170dc346986eccefdc2dd33a9da36ead9`. The CPU server used `--alias local-model --ctx-size 32768 --parallel 1 --threads 8 --jinja --n-predict 1024`, bound to `127.0.0.1:8099`. Model output remains nondeterministic; these checks are an opt-in integration smoke test, not a quality benchmark.
