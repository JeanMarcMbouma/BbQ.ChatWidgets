using System.Diagnostics;
using System.Net;
using System.Net.Sockets;
namespace BbQ.LlamaCpp;
public sealed record LlamaCppRuntimeOptions(int ContextWindowTokens = 8192, int Threads = 0, int GpuLayers = 0, TimeSpan? StartupTimeout = null);
public sealed record LlamaCppRuntimeReport(bool IsReady, Uri? Endpoint, string ApiKey, IReadOnlyCollection<string> Diagnostics);
public sealed class LlamaCppRuntime(ILlamaCppDependencyResolver resolver, HttpClient healthClient, LlamaCppRuntimeOptions options) : IAsyncDisposable
{
    private Process? process;
    public async ValueTask<LlamaCppRuntimeReport> EnsureReadyAsync(CancellationToken ct = default) { var resolved = await resolver.ResolveAsync(ct); if (resolved.Dependencies is null) return new(false, null, "", resolved.Diagnostics); var port = FreePort(); var key = Convert.ToHexString(Guid.NewGuid().ToByteArray()); var endpoint = new Uri($"http://127.0.0.1:{port}/"); var info = new ProcessStartInfo(resolved.Dependencies.RuntimeExecutable) { UseShellExecute = false, CreateNoWindow = true }; foreach (var arg in new[] { "--model", resolved.Dependencies.GenerationModel, "--host", "127.0.0.1", "--port", port.ToString(), "--api-key", key, "--ctx-size", options.ContextWindowTokens.ToString() }) info.ArgumentList.Add(arg); if (options.Threads > 0) { info.ArgumentList.Add("--threads"); info.ArgumentList.Add(options.Threads.ToString()); } if (options.GpuLayers > 0) { info.ArgumentList.Add("--n-gpu-layers"); info.ArgumentList.Add(options.GpuLayers.ToString()); } process = Process.Start(info); if (process is null) return new(false, null, "", ["Unable to start llama-server."]); var deadline = DateTimeOffset.UtcNow + (options.StartupTimeout ?? TimeSpan.FromMinutes(2)); while (DateTimeOffset.UtcNow < deadline && !process.HasExited) { try { using var response = await healthClient.GetAsync(new Uri(endpoint, "health"), ct); if (response.StatusCode == HttpStatusCode.OK) return new(true, endpoint, key, []); } catch (HttpRequestException) { } await Task.Delay(250, ct); } return new(false, null, "", ["llama-server did not become healthy."]); }
    public ValueTask DisposeAsync() { if (process is { HasExited: false }) process.Kill(true); process?.Dispose(); return ValueTask.CompletedTask; }
    private static int FreePort() { using var listener = new TcpListener(IPAddress.Loopback, 0); listener.Start(); return ((IPEndPoint)listener.LocalEndpoint).Port; }
}
