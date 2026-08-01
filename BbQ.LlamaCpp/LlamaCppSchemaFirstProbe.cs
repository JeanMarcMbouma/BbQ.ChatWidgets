using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;

namespace BbQ.LlamaCpp;

/// <summary>Runs a small OpenAI-compatible tool-call probe against a ready llama.cpp server.</summary>
public static class LlamaCppSchemaFirstProbe
{
    /// <summary>
    /// Requests one canonical <c>emit_widgets</c> tool call and verifies that the local model selected it.
    /// This is intended as a startup check for samples, not as a model quality benchmark.
    /// </summary>
    /// <param name="client">The client used to call the loopback server.</param>
    /// <param name="runtime">A successful runtime report.</param>
    /// <param name="cancellationToken">Cancellation token for the request.</param>
    /// <returns>The tool arguments returned by the model.</returns>
    public static async ValueTask<JsonElement> RunAsync(
        HttpClient client,
        LlamaCppRuntimeReport runtime,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(client);
        ArgumentNullException.ThrowIfNull(runtime);
        if (!runtime.IsReady || runtime.Endpoint is null)
        {
            throw new InvalidOperationException("The llama.cpp runtime must be ready before running the Schema First probe.");
        }

        using var request = new HttpRequestMessage(HttpMethod.Post, new Uri(runtime.Endpoint, "v1/chat/completions"));
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", runtime.ApiKey);
        request.Content = JsonContent.Create(new
        {
            model = "local-model",
            temperature = 0,
            messages = new[] { new { role = "user", content = "Use emit_widgets to show a greeting card titled Hello with body Local llama.cpp is ready." } },
            tools = new[]
            {
                new
                {
                    type = "function",
                    function = new
                    {
                        name = "emit_widgets",
                        description = "Emit schema-first widgets.",
                        parameters = new
                        {
                            type = "object",
                            properties = new
                            {
                                widgets = new
                                {
                                    type = "array",
                                    items = new
                                    {
                                        type = "object",
                                        properties = new
                                        {
                                            type = new { type = "string" },
                                            title = new { type = "string" },
                                            body = new { type = "string" }
                                        },
                                        required = new[] { "type", "title", "body" }
                                    }
                                }
                            },
                            required = new[] { "widgets" }
                        }
                    }
                }
            },
            tool_choice = new { type = "function", function = new { name = "emit_widgets" } }
        });

        using var response = await client.SendAsync(request, cancellationToken).ConfigureAwait(false);
        response.EnsureSuccessStatusCode();
        using var document = JsonDocument.Parse(await response.Content.ReadAsStreamAsync(cancellationToken).ConfigureAwait(false));
        var function = document.RootElement.GetProperty("choices")[0].GetProperty("message").GetProperty("tool_calls")[0].GetProperty("function");
        if (!string.Equals(function.GetProperty("name").GetString(), "emit_widgets", StringComparison.Ordinal))
        {
            throw new InvalidDataException("The local model did not select the required emit_widgets tool.");
        }

        var arguments = function.GetProperty("arguments");
        return arguments.ValueKind == JsonValueKind.String
            ? JsonDocument.Parse(arguments.GetString() ?? "{}").RootElement.Clone()
            : arguments.Clone();
    }
}
