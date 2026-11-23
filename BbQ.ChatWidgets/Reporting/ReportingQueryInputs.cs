using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace BbQ.ChatWidgets.Reporting;

public static partial class ReportingEndpoints
{
    private const int MaxInputs = 16;
    private const int MaxOptions = 200;
    private const int MaxDateRange = 366;

    private static void MapReportingInputOptions(RouteGroupBuilder group)
    {
        group.MapPost("/options", (ReportInputOptionsRequest request, IReportingSource source, HttpContext http) =>
            WithScope(source, http, async (scope, ct) =>
            {
                var datasets = await source.GetDatasetsAsync(scope, ct);
                var dataset = datasets.FirstOrDefault(item => item.Id == request.Dataset);
                if (dataset is null)
                    return Invalid("Choose an available dataset.");

                if (DateRangeError(dataset, request.From, request.To) is { } dateError)
                    return Invalid(dateError);

                var input = DatasetInputs(dataset).FirstOrDefault(item => item.Id == request.Input);
                if (input is null)
                    return Invalid("Choose an available reporting input.");

                var choices = await InputOptionsAsync(source, scope, request, input, ct);
                return choices.Count > MaxOptions
                    ? Results.UnprocessableEntity(new { error = "Too many choices. Narrow the date range." })
                    : Results.Ok(choices);
            }));
    }

    private static async ValueTask<(ReportQuery? Query, string? Error)> ResolveQueryAsync(
        IReportingSource source, ReportScope scope, ReportQuery? query,
        IReadOnlyList<ReportDataset> datasets, CancellationToken ct)
    {
        if (query is null)
            return (null, "Provide a reporting query.");

        var dataset = datasets.FirstOrDefault(item => item.Id == query.Dataset);
        if (dataset is null || !dataset.Metrics.Any(metric => metric.Id == query.Metric))
            return (null, "Choose an available dataset and metric.");

        if (query.GroupBy is not null && !dataset.Dimensions.Any(dimension => dimension.Id == query.GroupBy))
            return (null, "Choose an available grouping.");

        if (DateRangeError(dataset, query.From, query.To) is { } dateError)
            return (null, dateError);

        var inputs = DatasetInputs(dataset);
        var values = new SortedDictionary<string, ReportInputValue>(StringComparer.Ordinal);
        if (query.Inputs is { } selected)
        {
            if (selected.Length > MaxInputs)
                return (null, "Choose up to sixteen reporting inputs.");

            foreach (var item in selected)
            {
                if (item is null || !ValidInputId(item.Id) || !values.TryAdd(item.Id, item.Value))
                    return (null, "Choose distinct reporting input IDs.");
            }
        }

        if (values.Keys.Any(id => !inputs.Any(input => input.Id == id)))
            return (null, "Choose available reporting inputs.");

        foreach (var input in inputs)
        {
            if (!values.TryGetValue(input.Id, out var value))
            {
                if (input.DefaultValue is not { } defaultValue)
                    continue;

                value = defaultValue;
                values.Add(input.Id, value);
            }

            if (value.Type != input.Type)
                return (null, "Choose a value of the advertised type.");

            var request = new ReportInputOptionsRequest(dataset.Id, input.Id, query.From, query.To);
            bool available;
            if (input.Options is null && source is IReportingInputValidationSource validator)
            {
                available = await validator.IsInputValueAvailableAsync(scope, request, value, ct);
            }
            else
            {
                var choices = await InputOptionsAsync(source, scope, request, input, ct);
                if (choices.Count > MaxOptions)
                    return (null, "Too many choices. Narrow the date range.");

                available = choices.Any(option => option.Value == value);
            }

            if (!available)
                return (null, "Choose an available value for each reporting input.");
        }

        return (query with
        {
            Inputs = values.Count == 0 ? null : values.Select(item => new ReportInputSelection(item.Key, item.Value)).ToArray()
        }, null);
    }

    private static string? DateRangeError(ReportDataset dataset, DateOnly from, DateOnly to)
    {
        var limit = dataset.Calendar?.MaxDays ?? MaxDateRange;
        if (limit is < 1 or > MaxDateRange)
            throw new InvalidOperationException("A reporting calendar must allow between one and 366 days.");

        return from == default || to == default || to < from || to.DayNumber - from.DayNumber >= limit
            ? $"Choose an inclusive date range of up to {limit} days."
            : null;
    }

    private static ReportInput[] DatasetInputs(ReportDataset dataset)
    {
        var inputs = dataset.Inputs ?? [];
        if (inputs.Length > MaxInputs ||
            inputs.Any(input => input is null || !ValidInputId(input.Id) || !ValidTitle(input.Label) ||
                !Enum.IsDefined(input.Role) || !Enum.IsDefined(input.Type) ||
                (input.DefaultValue is { } value && value.Type != input.Type)) ||
            inputs.Select(input => input.Id).Distinct(StringComparer.Ordinal).Count() != inputs.Length)
            throw new InvalidOperationException("The reporting catalog contains invalid dataset inputs.");

        return inputs;
    }

    private static bool ValidInputId(string? id) => id is { Length: >= 1 and <= 64 } &&
        char.IsAsciiLetterLower(id[0]) && id.All(ch => char.IsAsciiLetterLower(ch) || char.IsAsciiDigit(ch) || ch == '-');

    private static async ValueTask<IReadOnlyList<ReportInputOption>> InputOptionsAsync(IReportingSource source,
        ReportScope scope, ReportInputOptionsRequest request, ReportInput input, CancellationToken ct)
    {
        IReadOnlyList<ReportInputOption> choices;
        if (input.Options is { } fixedOptions)
        {
            if (fixedOptions.Length > MaxOptions)
                throw new InvalidOperationException("A reporting input has too many fixed choices.");

            choices = fixedOptions;
        }
        else if (source is IReportingInputSource dynamicSource)
        {
            choices = await dynamicSource.GetInputOptionsAsync(scope, request, MaxOptions + 1, ct);
        }
        else
        {
            throw new InvalidOperationException("Dynamic reporting inputs require an input options source.");
        }

        if (choices.Count > MaxOptions + 1 ||
            choices.Any(option => option is null || option.Value.Type != input.Type || !ValidTitle(option.Label)) ||
            choices.Select(option => option.Value).Distinct().Count() != choices.Count)
            throw new InvalidOperationException("The reporting source returned invalid input choices.");

        return choices;
    }
}
