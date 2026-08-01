using BbQ.ChatWidgets.Models;
using System.Text.Json;

namespace BbQ.ChatWidgets.Services;

/// <summary>
/// Creates deterministic RFC 6902 patches from validated complete widget states.
/// </summary>
public static class WidgetJsonPatch
{
    public static IReadOnlyList<WidgetJsonPatchOperation> Create(JsonElement previous, JsonElement next)
    {
        var operations = new List<WidgetJsonPatchOperation>();
        Diff(previous, next, string.Empty, operations);
        return Array.AsReadOnly(operations.ToArray());
    }

    private static void Diff(
        JsonElement previous,
        JsonElement next,
        string path,
        ICollection<WidgetJsonPatchOperation> operations)
    {
        if (Equivalent(previous, next))
            return;

        if (previous.ValueKind is JsonValueKind.Object && next.ValueKind is JsonValueKind.Object)
        {
            var previousProperties = previous.EnumerateObject()
                .ToDictionary(property => property.Name, property => property.Value.Clone(), StringComparer.Ordinal);
            var nextProperties = next.EnumerateObject()
                .ToDictionary(property => property.Name, property => property.Value.Clone(), StringComparer.Ordinal);

            foreach (var name in previousProperties.Keys.Except(nextProperties.Keys, StringComparer.Ordinal).OrderBy(name => name, StringComparer.Ordinal))
                operations.Add(new("remove", Append(path, name)));

            foreach (var name in nextProperties.Keys.Except(previousProperties.Keys, StringComparer.Ordinal).OrderBy(name => name, StringComparer.Ordinal))
                operations.Add(new("add", Append(path, name), nextProperties[name].Clone()));

            foreach (var name in previousProperties.Keys.Intersect(nextProperties.Keys, StringComparer.Ordinal).OrderBy(name => name, StringComparer.Ordinal))
                Diff(previousProperties[name], nextProperties[name], Append(path, name), operations);

            return;
        }

        // Arrays are replaced atomically. This keeps list semantics stable and avoids
        // index-shift ambiguity while remaining fully RFC 6902 compatible.
        operations.Add(new("replace", path, next.Clone()));
    }

    private static bool Equivalent(JsonElement left, JsonElement right)
    {
        if (left.ValueKind != right.ValueKind)
            return false;

        return left.ValueKind switch
        {
            JsonValueKind.Object => ObjectsEquivalent(left, right),
            JsonValueKind.Array => ArraysEquivalent(left, right),
            JsonValueKind.String => left.GetString() == right.GetString(),
            JsonValueKind.Number => NumbersEquivalent(left, right),
            JsonValueKind.True or JsonValueKind.False => left.GetBoolean() == right.GetBoolean(),
            JsonValueKind.Null or JsonValueKind.Undefined => true,
            _ => left.GetRawText() == right.GetRawText()
        };
    }

    private static bool ObjectsEquivalent(JsonElement left, JsonElement right)
    {
        var leftProperties = left.EnumerateObject()
            .ToDictionary(property => property.Name, property => property.Value, StringComparer.Ordinal);
        var rightProperties = right.EnumerateObject()
            .ToDictionary(property => property.Name, property => property.Value, StringComparer.Ordinal);
        return leftProperties.Count == rightProperties.Count &&
               leftProperties.All(pair =>
                   rightProperties.TryGetValue(pair.Key, out var other) && Equivalent(pair.Value, other));
    }

    private static bool ArraysEquivalent(JsonElement left, JsonElement right)
    {
        var leftItems = left.EnumerateArray().ToArray();
        var rightItems = right.EnumerateArray().ToArray();
        return leftItems.Length == rightItems.Length &&
               leftItems.Zip(rightItems).All(pair => Equivalent(pair.First, pair.Second));
    }

    private static bool NumbersEquivalent(JsonElement left, JsonElement right)
    {
        if (left.TryGetDecimal(out var leftDecimal) && right.TryGetDecimal(out var rightDecimal))
            return leftDecimal == rightDecimal;
        return left.GetDouble().Equals(right.GetDouble());
    }

    private static string Append(string path, string property) =>
        $"{path}/{property.Replace("~", "~0", StringComparison.Ordinal).Replace("/", "~1", StringComparison.Ordinal)}";
}
