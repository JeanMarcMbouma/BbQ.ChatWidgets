using System.Text.Json;
using System.Text.Json.Serialization;

namespace BbQ.ChatWidgets.Models;

/// <summary>
/// One server-generated RFC 6902 JSON Patch operation.
/// </summary>
public sealed record WidgetJsonPatchOperation(
    string Op,
    string Path,
    [property: JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)] JsonElement? Value = null);
