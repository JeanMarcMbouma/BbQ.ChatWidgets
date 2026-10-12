# Deploying ChatWidgets

ChatWidgets supplies widget contracts, rendering, action dispatch and conversation/stream services. Your application owns identity, business permissions, AI credentials, data retention and deployment. The local playground is suitable for public hosting; the live sample APIs are development examples.

## Try the product without an AI account

Use Node 22.12 or later and the .NET 10 SDK (the projects currently target .NET 8; install its runtime too). From the repository root:

```sh
cd js
npm ci
npm run build
cd ../Sample/BbQ.ChatWidgets.Sample.React/ClientApp
npm ci
npm run dev
```

Open the Vite address. Booking, support and approval examples run locally using the public library. They use sample responses; no booking, approval, external API call or persistent write occurs. Inspect or copy the emitted widget JSON to connect the same contract to your own backend.

For a deployable ASP.NET host:

```sh
dotnet publish Sample/BbQ.ChatWidgets.Sample.React -c Release -o artifacts/playground
```

Publishing builds the core npm package and React frontend, and preserves nested assets under `wwwroot/assets`. With no AI key, the host serves the playground and returns 503 for live APIs. `/health` reports host readiness and its mode; it does not test the AI provider.

For local live examples, set `OpenAI__ApiKey` through environment variables or .NET user secrets and run in Development. In Production, live APIs also require `Demo__EnableLiveApi=true`. Only enable them behind application authentication and authorization. The demo includes agent execution and stream publisher controls that can consume resources.

## Protect API requests

`MapBbQChatEndpoints` currently installs middleware rather than endpoint-routing metadata. Do not assume `.RequireAuthorization()` or endpoint-specific rate limiter metadata protects it. Install authentication and any path-based gates before calling it.

The new `AuthorizeRequestAsync` option is invoked for every recognized chat, action, voice and widget stream request before its body is read. Return false to stop the request with 403. The host may use scoped services through `context.RequestServices`:

```csharp
services.AddBbQChatWidgets(options =>
{
    options.MaxRequestBodyBytes = 64 * 1024;
    options.AuthorizeRequestAsync = (context, cancellationToken) =>
        ValueTask.FromResult(context.User.Identity?.IsAuthenticated == true);
    // Register your IChatClient factory and business action handlers here.
});

// After building the app, and configuring its authentication scheme:
app.UseAuthentication();
app.UseAuthorization();
app.MapBbQChatEndpoints();
```

This snippet checks identity only. Also validate thread and stream ownership, tenant boundaries and business permissions. Thread IDs and stream IDs are identifiers, not authorization tokens. Check payload permissions inside action handlers; never let model-generated actions authorize a purchase or an approval. Restrict the client stream publish route (`POST .../widgets/streams/{streamId}/events`) to trusted publishers. Deny it from browser identities unless your application explicitly needs it.

JSON bodies have a default 1 MiB limit, enforced for both content-length and chunked requests. Invalid JSON and null bodies produce 400, oversized bodies produce 413. Voice multipart uploads need separate host/proxy form and file size limits. Configure request deadlines, per-user rate limits, active-stream limits and AI budgets in the host. Configure cookie CSRF protection if your app uses cookie-based authentication. Keep AI secrets on the server. The React sample uses same-origin APIs and has no wildcard CORS policy.

## Data and scale

The default thread/persona stores and widget stream state live in the process. They are intended for a prototype or a bounded single-instance application. Before hosting a multi-user, long-lived application:

- Replace the thread store with a tenant-aware durable implementation and explicit retention/expiry.
- Set SSE buffer/replay limits through `WidgetSseOptions`; proxy buffering must be disabled for SSE. Verify reconnect behavior and idle timeouts with your proxy.
- Use sticky routing or implement shared stream state for multiple instances; the default service is not a distributed broker.
- Keep logs free of credentials and sensitive conversation content; define deletion and retention behavior.
- Treat custom renderers as trusted application code. Built-in text and numeric attributes are escaped; do not inject unsanitized HTML or permit arbitrary remote resources in your custom widgets.

On the client, pass a `container` to `WidgetManager` to keep streamed updates scoped to one conversation. Call `detachHandlers` when disposing a rendered container and `disconnect` when leaving a stream. Browser form validation is feedback for users; validate all fields again on the server.

## Verify a release

Run the checks used by CI:

```sh
cd js
npm ci
npm run lint
npm run build
npm test
npm run test:package
cd ../js-angular
npm ci
npm run build
npm test
cd ../Sample/BbQ.ChatWidgets.Sample.React/ClientApp
npm ci
npm run build
npx playwright install chromium
npm run test:e2e
```

Run `dotnet test BbQ.ChatWidgets.slnx -c Release /p:SkipClientBuild=true` (frontend checks run separately) and publish the React host. Check the published HTML and nested assets, `/health`, disabled live API responses, and your configured authenticated live workflows. The browser suite covers desktop/mobile playground flows, required field validation, reset, JSON inspection, no API traffic and no horizontal overflow. A mocked live response also checks chart rendering, single action dispatch and disposal when leaving the page.

Choose new package versions before tagging. The core and Angular versions do not need to match, but the Angular peer dependency must accept the released core version. Angular publishes its compiled `dist` directory, not the workspace root. Publishing requires the existing npm/NuGet credentials or trusted publishing configuration. The .NET package uses the ASP.NET Core shared framework; console hosts must include that runtime. The NuGet workflow publishes both the core and Blazor UI packages plus the optional llama.cpp integration.

A green build does not certify your host's identity, isolation, AI provider, load handling or deployment configuration. Exercise those with real accounts and representative traffic before enabling production live APIs.
