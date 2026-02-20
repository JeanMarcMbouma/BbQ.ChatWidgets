using BbQ.ChatWidgets.Abstractions;
using System.Text;

namespace BbQ.ChatWidgets.Services;

internal static class PersonaGuardrails
{
    public static void ValidateOptions(BbQChatOptions options)
    {
        ArgumentNullException.ThrowIfNull(options);

        if (options.MaxPersonaLength <= 0)
        {
            throw new InvalidOperationException($"MaxPersonaLength must be positive. Current value: {options.MaxPersonaLength}");
        }

        if (options.EnablePersona)
        {
            _ = NormalizeForPersistence(options.DefaultPersona, options, "DefaultPersona");
        }
    }

    public static string? NormalizeIncoming(string? persona, BbQChatOptions options, string paramName)
    {
        if (persona is null)
        {
            return null;
        }

        var trimmed = persona.Trim();
        if (trimmed.Length == 0)
        {
            return string.Empty;
        }

        ValidatePersonaText(trimmed, options, paramName);
        return trimmed;
    }

    public static string? NormalizeForPersistence(string? persona, BbQChatOptions options, string paramName)
    {
        if (string.IsNullOrWhiteSpace(persona))
        {
            return null;
        }

        var trimmed = persona.Trim();
        ValidatePersonaText(trimmed, options, paramName);
        return trimmed;
    }

    private static void ValidatePersonaText(string persona, BbQChatOptions options, string paramName)
    {
        if (persona.Length > options.MaxPersonaLength)
        {
            throw new ArgumentException($"Persona exceeds maximum allowed length of {options.MaxPersonaLength} characters.", paramName);
        }

        if (!options.RejectPersonaControlCharacters)
        {
            return;
        }

        foreach (var character in persona)
        {
            if (!char.IsControl(character))
            {
                continue;
            }

            if (character is '\n' or '\r' or '\t')
            {
                continue;
            }

            throw new ArgumentException("Persona contains disallowed control characters.", paramName);
        }
    }
}
