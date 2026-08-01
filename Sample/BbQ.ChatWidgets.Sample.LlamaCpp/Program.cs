using System.Runtime.InteropServices;
using BbQ.LlamaCpp;

if (args.Length == 0)
{
    Console.WriteLine("Usage: dotnet run -- <deployment-manifest.json>");
    Console.WriteLine("The manifest pins llama-server and a GGUF model by version, size, SHA-256, and license.");
    return;
}

var manifest = LlamaCppDeploymentManifestLoader.Load(args[0]);
var root = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "BbQ.ChatWidgets", "llama.cpp");
var dependencyOptions = new LlamaCppDependencyOptions(root, RuntimeInformation.RuntimeIdentifier, "cpu");
var resolver = new VerifiedLlamaCppDependencyResolver(new HttpClient(), manifest, dependencyOptions);
await using var runtime = new LlamaCppRuntime(resolver, new HttpClient(), new());
var report = await runtime.EnsureReadyAsync();
if (!report.IsReady) { Console.Error.WriteLine(string.Join(Environment.NewLine, report.Diagnostics)); Environment.ExitCode = 1; return; }

Console.WriteLine($"llama.cpp is ready at {report.Endpoint}");
Console.WriteLine("Running the Schema First emit_widgets scenario...");
var arguments = await LlamaCppSchemaFirstProbe.RunAsync(new HttpClient(), report);
Console.WriteLine($"Schema First scenario passed. Tool arguments: {arguments}");
Console.WriteLine("The supervised runtime is loopback-only and uses an ephemeral API key.");
Console.WriteLine("Press Enter to stop the supervised runtime.");
Console.ReadLine();
