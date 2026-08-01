# Local llama.cpp testing

`BbQ.LlamaCpp` adapts MiningLLM's verified dependency resolver and supervised loopback-process design for local Schema First integration testing. It is a separately packable NuGet package and does not load the native ABI into the application process.

Copy the sample deployment manifest and replace every placeholder with an immutable llama.cpp release/runtime archive and GGUF model. Each artifact must declare its pinned version, exact byte size, SHA-256, and license. Resolution checks an offline bundle first, then downloads when allowed, verifies before installation, and re-verifies cached artifacts.

## Recommended CPU profile

Use **Qwen2.5-1.5B-Instruct GGUF, Q4_K_M** for the sample. It is a modest but useful instruct model with tool-call support; the Q4_K_M file is about 1.1 GB and is a better quality/size default than very low-bit quants. Expect roughly 1.5–2.5 GB of free RAM while serving it, plus the downloaded llama.cpp archive and model on disk. The sample defaults to CPU (`GpuLayers = 0`), an 8K context, and llama.cpp's automatic thread selection. Larger models are deliberately not the default.

Pin the model repository revision in the manifest URL as well as its exact byte size and SHA-256. Do the same for one llama.cpp CPU archive matching the machine's runtime identifier. The checked-in manifest remains an explicit template because upstream release artifacts are platform-specific and their hashes must not be guessed or floated. A clean machine needs only the .NET SDK, network access to those approved immutable URLs, and enough disk/RAM for the values above.

## Clean setup and end-to-end run

1. Copy `Sample/BbQ.ChatWidgets.Sample.LlamaCpp/deployment-manifest.example.json` outside the repository and replace every placeholder with the pinned llama.cpp CPU runtime and Qwen model metadata.
2. Run `dotnet run --project Sample/BbQ.ChatWidgets.Sample.LlamaCpp -- path/to/deployment-manifest.json`.
3. The resolver downloads (or uses `OfflineBundleDirectory`), verifies, and caches both artifacts. The runtime launches `llama-server` on a dynamically allocated loopback port with a random API key and waits for `/health`.
4. The sample then makes an OpenAI-compatible request with the canonical `emit_widgets` tool, requires that tool to be selected, parses its Schema First arguments, and reports success. Press Enter to dispose the supervisor and terminate the entire process tree.

Angular, React, Blazor, and console samples continue to demonstrate hosted-provider configuration; the dedicated llama.cpp sample is the local-model lifecycle sample and exercises the same `StrictToolCall` contract without duplicating provisioning code across UI hosts.

Ordinary CI does not reference, provision, start, probe, or emulate llama.cpp. There are deliberately no fake-server or model-contract tests in the normal test project: runtime and model changes must not make routine pipelines fail. For an explicit practical lifecycle check, maintainers run the command above with an approved manifest; this keeps all llama.cpp behavior and the gigabyte-scale download opt-in.
