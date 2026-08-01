using System.Text.Json;
using System.Text.Json.Serialization;
namespace BbQ.LlamaCpp;
public static class LlamaCppDeploymentManifestLoader
{
    private static readonly JsonSerializerOptions Options = CreateOptions();
    public static LlamaCppDeploymentManifest Load(string path) { ArgumentException.ThrowIfNullOrWhiteSpace(path); var value = JsonSerializer.Deserialize<LlamaCppDeploymentManifest>(File.ReadAllText(path), Options) ?? throw new InvalidDataException("Invalid llama.cpp manifest."); Validate(value); return value; }
    public static void Validate(LlamaCppDeploymentManifest manifest) { ArgumentNullException.ThrowIfNull(manifest); if (string.IsNullOrWhiteSpace(manifest.ManifestVersion) || manifest.Artifacts.Count == 0) throw new InvalidDataException("Manifest version and artifacts are required."); foreach (var a in manifest.Artifacts) { if (string.IsNullOrWhiteSpace(a.ArtifactId) || string.IsNullOrWhiteSpace(a.Version)) throw new InvalidDataException("Every artifact requires a pinned ID and version."); if (a.Sha256.Length != 64 || !a.Sha256.All(Uri.IsHexDigit)) throw new InvalidDataException($"Artifact '{a.ArtifactId}' requires a valid SHA-256."); if (a.SizeBytes <= 0 || string.IsNullOrWhiteSpace(a.License)) throw new InvalidDataException($"Artifact '{a.ArtifactId}' requires size and license metadata."); } }
    private static JsonSerializerOptions CreateOptions() { var value = new JsonSerializerOptions(JsonSerializerDefaults.Web); value.Converters.Add(new JsonStringEnumConverter(JsonNamingPolicy.CamelCase)); return value; }
}
