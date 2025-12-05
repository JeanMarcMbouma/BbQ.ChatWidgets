namespace BbQ.ChatWidgets.Abstractions
{
    public interface IWidgetLocalizer
    {
        string Localize(string key, string defaultValue);
    }
}