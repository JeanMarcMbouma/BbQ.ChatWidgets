namespace BbQ.LlamaCpp;
public enum LlamaCppArtifactKind { Runtime, GenerationModel }
public enum LlamaCppArchiveKind { None, Zip, TarGzip }
public sealed record LlamaCppArtifact(string ArtifactId, LlamaCppArtifactKind Kind, string Version, Uri Source, string Sha256, long SizeBytes, string FileName, string? RuntimeIdentifier = null, string? Backend = null, LlamaCppArchiveKind ArchiveKind = LlamaCppArchiveKind.None, string? ExecutableRelativePath = null, string? License = null);
public sealed record LlamaCppDeploymentManifest(string ManifestVersion, IReadOnlyCollection<LlamaCppArtifact> Artifacts);
public sealed record LlamaCppDependencyOptions(string RootDirectory, string RuntimeIdentifier, string Backend, bool AllowNetworkDownloads = true, string? OfflineBundleDirectory = null);
public sealed record ResolvedLlamaCppDependencies(string RuntimeExecutable, string GenerationModel, IReadOnlyCollection<string> ArtifactIds);
public enum LlamaCppDependencyStatus { Ready, Failed }
public sealed record LlamaCppDependencyReport(LlamaCppDependencyStatus Status, ResolvedLlamaCppDependencies? Dependencies, IReadOnlyCollection<string> Diagnostics);
public interface ILlamaCppDependencyResolver { ValueTask<LlamaCppDependencyReport> ResolveAsync(CancellationToken cancellationToken = default); }
