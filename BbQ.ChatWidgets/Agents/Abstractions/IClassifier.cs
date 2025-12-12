namespace BbQ.ChatWidgets.Agents.Abstractions;

public interface IClassifier<TCategory> where TCategory : Enum
{
    Task<TCategory> ClassifyAsync(string input, CancellationToken ct = default);
}
