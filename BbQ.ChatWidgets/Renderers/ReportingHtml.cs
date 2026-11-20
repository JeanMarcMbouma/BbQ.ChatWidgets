using System.Net;
using System.Text;
using BbQ.ChatWidgets.Models;

namespace BbQ.ChatWidgets.Renderers;

/// <summary>Produces a data fallback for a reporting widget before browser hydration.</summary>
public static class ReportingHtml
{
    /// <summary>Renders an encoded reporting definition and its accessible data projection.</summary>
    public static string Render(ReportingWidget widget)
    {
        var html = new StringBuilder();
        html.Append("<div class=\"bbq-reporting\" data-bbq-reporting=\"")
            .Append(Encode(widget.ToJson())).Append("\">");
        Append(widget, inheritedSource: null, inheritedColumns: null, sources: [], html, depth: 0);
        return html.Append("</div>").ToString();
    }

    private static void Append(
        ReportingWidget widget, string? inheritedSource, IReadOnlyList<ReportingColumn>? inheritedColumns,
        List<ReportingWidget> sources, StringBuilder html, int depth)
    {
        if (depth > 12)
            return;

        var source = widget.Settings?.DataSource ?? inheritedSource;
        var columns = widget.Settings?.Columns ?? inheritedColumns;
        sources.Add(widget);
        html.Append("<section class=\"bbq-report\"><h3>").Append(Encode(widget.Label)).Append("</h3>");
        if (widget.Error is not null)
            html.Append("<p role=\"alert\">").Append(Encode(widget.Error)).Append("</p>");
        else if (widget.Kind == "dashboard")
        {
            foreach (var child in widget.Children ?? [])
                Append(child, source, columns, sources, html, depth + 1);
        }
        else if (widget.Kind == "filter")
            html.Append("<p>Filtering is available when the dashboard is interactive.</p>");
        else
        {
            var rows = widget.Rows;
            if (rows is null && source is not null)
            {
                for (var index = sources.Count - 1; index >= 0; index--)
                {
                    if (sources[index].Sources?.TryGetValue(source, out rows) == true)
                        break;
                }
            }

            if (rows is not { Count: > 0 })
                html.Append("<p>No results.</p>");
            else
            {
                columns ??= rows.SelectMany(row => row.Keys).Distinct(StringComparer.Ordinal)
                    .Select(field => new ReportingColumn(field, field)).ToArray();
                html.Append("<table><thead><tr>");
                foreach (var column in columns)
                    html.Append("<th scope=\"col\">").Append(Encode(column.Label)).Append("</th>");

                html.Append("</tr></thead><tbody>");
                foreach (var row in rows.Take(10))
                {
                    html.Append("<tr>");
                    foreach (var column in columns)
                        html.Append("<td>").Append(row.TryGetValue(column.Field, out var value) ? Encode(value.ToString()) : "").Append("</td>");

                    html.Append("</tr>");
                }
                html.Append("</tbody></table>");
                if (rows.Count > 10)
                    html.Append("<p>Showing the first 10 rows.</p>");
            }
        }

        html.Append("</section>");
        sources.RemoveAt(sources.Count - 1);
    }

    private static string Encode(string? value) => WebUtility.HtmlEncode(value) ?? "";
}
