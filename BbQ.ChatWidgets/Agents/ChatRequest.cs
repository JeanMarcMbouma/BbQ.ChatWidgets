namespace BbQ.ChatWidgets.Agents;

public record ChatRequest(string? ThreadId, IServiceProvider RequestServices, Dictionary<string, object>? Metadata = null);
