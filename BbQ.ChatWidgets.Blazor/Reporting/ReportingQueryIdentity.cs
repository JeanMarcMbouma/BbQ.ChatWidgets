using System.Text.Json;
using BbQ.ChatWidgets.Reporting;

namespace BbQ.ChatWidgets.Blazor.Reporting;

internal static class ReportingQueryIdentity
{
    public static ReportQuery Normalize(ReportQuery query, ReportInput[]? definitions = null)
    {
        var inputs = query.Inputs?.ToList() ?? [];
        foreach (var input in definitions ?? [])
        {
            if (input.DefaultValue is { } value && !inputs.Any(selection => selection.Id == input.Id))
                inputs.Add(new(input.Id, value));
        }

        return inputs.Count == 0 && query.Inputs is null ? query : query with
        {
            Inputs = inputs.Count == 0 ? null : inputs.OrderBy(input => input.Id, StringComparer.Ordinal).ToArray()
        };
    }

    public static string Create(ReportQuery query) => JsonSerializer.Serialize(Normalize(query));
}
