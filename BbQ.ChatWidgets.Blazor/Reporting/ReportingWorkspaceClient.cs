using System.Net.Http.Json;
using System.Text.Json;
using BbQ.ChatWidgets.Reporting;

namespace BbQ.ChatWidgets.Blazor.Reporting;

/// <summary>The scoped reporting catalog available to the current user.</summary>
public sealed record ReportingCatalog(ReportDataset[] Datasets, SavedReport[] Presets);

/// <summary>Host-supplied access to report data and saved definitions for a Blazor workspace.</summary>
public interface IReportingWorkspaceClient
{
    ValueTask<ReportingCatalog> GetCatalogAsync(CancellationToken cancellationToken = default);
    ValueTask<IReadOnlyList<SavedReport>> ListAsync(CancellationToken cancellationToken = default);
    ValueTask<IReadOnlyList<ReportRow>> RunAsync(ReportQuery query, CancellationToken cancellationToken = default);
    ValueTask<ReportGridPage> GetPageAsync(ReportGridPageRequest query, CancellationToken cancellationToken = default);
    ValueTask<SavedReport> CreateAsync(ReportDefinition definition, CancellationToken cancellationToken = default);
    ValueTask UpdateAsync(string id, ReportDefinition definition, CancellationToken cancellationToken = default);
    ValueTask DeleteAsync(string id, CancellationToken cancellationToken = default);
}

/// <summary>Uses a host-configured HTTP client to access the ChatWidgets reporting endpoints.</summary>
/// <remarks>The supplied client owns the base address and caller authentication and remains owned by the host.</remarks>
public sealed class ReportingHttpClient(HttpClient httpClient, string basePath = "/api/reporting") : IReportingWorkspaceClient
{
    private readonly string basePath = basePath.TrimEnd('/');

    public async ValueTask<ReportingCatalog> GetCatalogAsync(CancellationToken cancellationToken = default)
        => await ReadAsync<ReportingCatalog>(HttpMethod.Get, "/catalog", cancellationToken);

    public async ValueTask<IReadOnlyList<SavedReport>> ListAsync(CancellationToken cancellationToken = default)
        => await ReadAsync<SavedReport[]>(HttpMethod.Get, "/saved", cancellationToken);

    public async ValueTask<IReadOnlyList<ReportRow>> RunAsync(ReportQuery query, CancellationToken cancellationToken = default)
        => await ReadAsync<ReportRow[]>(HttpMethod.Post, "/run", cancellationToken, query);

    public async ValueTask<ReportGridPage> GetPageAsync(ReportGridPageRequest query, CancellationToken cancellationToken = default)
        => await ReadAsync<ReportGridPage>(HttpMethod.Post, "/page", cancellationToken, query);

    public async ValueTask<SavedReport> CreateAsync(ReportDefinition definition, CancellationToken cancellationToken = default)
        => await ReadAsync<SavedReport>(HttpMethod.Post, "/saved", cancellationToken, definition);

    public async ValueTask UpdateAsync(string id, ReportDefinition definition, CancellationToken cancellationToken = default)
    {
        using var response = await SendAsync(HttpMethod.Put, "/saved/" + Uri.EscapeDataString(id), cancellationToken, definition);
    }

    public async ValueTask DeleteAsync(string id, CancellationToken cancellationToken = default)
    {
        using var response = await SendAsync(HttpMethod.Delete, "/saved/" + Uri.EscapeDataString(id), cancellationToken);
    }

    private async Task<T> ReadAsync<T>(HttpMethod method, string suffix, CancellationToken cancellationToken, object? body = null)
    {
        using var response = await SendAsync(method, suffix, cancellationToken, body);
        return await response.Content.ReadFromJsonAsync<T>(cancellationToken: cancellationToken)
            ?? throw new JsonException("The reporting server returned an empty response.");
    }

    private async Task<HttpResponseMessage> SendAsync(HttpMethod method, string suffix, CancellationToken cancellationToken, object? body = null)
    {
        using var request = new HttpRequestMessage(method, basePath + suffix);
        if (body is not null)
            request.Content = JsonContent.Create(body);

        var response = await httpClient.SendAsync(request, cancellationToken);
        if (response.IsSuccessStatusCode)
            return response;

        using (response)
        {
            string? detail = null;
            try
            {
                var problem = await response.Content.ReadFromJsonAsync<JsonElement>(cancellationToken: cancellationToken);
                if (problem.ValueKind == JsonValueKind.Object && problem.TryGetProperty("error", out var error)
                    && error.ValueKind == JsonValueKind.String)
                    detail = error.GetString();
            }
            catch (JsonException)
            {
                // A host can return empty or non-JSON authentication and error responses.
            }
            throw new HttpRequestException(detail ?? $"Reporting request failed ({(int)response.StatusCode}).",
                inner: null, statusCode: response.StatusCode);
        }
    }
}
