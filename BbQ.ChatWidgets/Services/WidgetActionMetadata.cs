using BbQ.ChatWidgets.Abstractions;

namespace BbQ.ChatWidgets.Services;

/// <summary>
/// Default implementation of <see cref="IWidgetActionMetadata"/>.
/// </summary>
public sealed class WidgetActionMetadata : IWidgetActionMetadata
{
    public string Name { get; }
    public string Description { get; }
    public string PayloadSchema { get; }
    public Type PayloadType { get; }

    public WidgetActionMetadata(string name, string description, string payloadSchema, Type payloadType)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Name cannot be null or empty.", nameof(name));

        Name = name;
        Description = description ?? "";
        PayloadSchema = payloadSchema ?? "{}";
        PayloadType = payloadType ?? typeof(object);
    }
}
