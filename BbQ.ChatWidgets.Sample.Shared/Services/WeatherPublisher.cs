using System.Collections.Concurrent;
using BbQ.ChatWidgets.Abstractions;

namespace BbQ.ChatWidgets.Sample.Shared.Services;

/// <summary>
/// Background publisher for weather updates via SSE.
/// Publishes simulated weather data for various cities at regular intervals.
/// </summary>
public class WeatherPublisher
{
    private readonly IWidgetSseService _sse;
    private readonly IStreamPayloadValidator _validator;
    private readonly ConcurrentDictionary<string, CancellationTokenSource> _running = new();

    private static readonly Dictionary<string, WeatherData[]> WeatherCycle = new()
    {
        {
            "London", new[]
            {
                new WeatherData("London", "Sunny", 22, 65, "SW", 8),
                new WeatherData("London", "Cloudy", 20, 72, "W", 12),
                new WeatherData("London", "Rainy", 18, 85, "NW", 15),
                new WeatherData("London", "Partly Cloudy", 21, 68, "SW", 10),
            }
        },
        {
            "New York", new[]
            {
                new WeatherData("New York", "Humid", 27, 78, "SE", 5),
                new WeatherData("New York", "Hot & Sunny", 29, 55, "N", 3),
                new WeatherData("New York", "Thunderstorm", 24, 88, "E", 20),
                new WeatherData("New York", "Clear", 25, 60, "NW", 8),
            }
        },
        {
            "Tokyo", new[]
            {
                new WeatherData("Tokyo", "Clear", 23, 55, "N", 4),
                new WeatherData("Tokyo", "Humid", 26, 75, "S", 6),
                new WeatherData("Tokyo", "Overcast", 22, 65, "E", 7),
                new WeatherData("Tokyo", "Foggy", 20, 85, "NE", 2),
            }
        }
    };

    public record WeatherData(
        string City,
        string Condition,
        int Temperature,
        int Humidity,
        string WindDirection,
        int WindSpeed
    );

    public WeatherPublisher(IWidgetSseService sse, IStreamPayloadValidator validator)
    {
        _sse = sse;
        _validator = validator;
    }

    /// <summary>
    /// Starts publishing weather updates to the specified stream at regular intervals.
    /// </summary>
    public Task StartAsync(string streamId, string city = "London", int intervalMs = 5000)
    {
        if (_running.ContainsKey(streamId)) return Task.CompletedTask;

        if (!WeatherCycle.ContainsKey(city))
            city = "London";

        var cts = new CancellationTokenSource();
        if (!_running.TryAdd(streamId, cts)) return Task.CompletedTask;

        var weatherData = WeatherCycle[city];
        var currentIndex = 0;

        _ = Task.Run(async () =>
        {
            try
            {
                while (!cts.Token.IsCancellationRequested)
                {
                    var weather = weatherData[currentIndex % weatherData.Length];
                    var payload = new
                    {
                        widgetId = "weather",
                        city = weather.City,
                        condition = weather.Condition,
                        temperature = weather.Temperature,
                        humidity = weather.Humidity,
                        windDirection = weather.WindDirection,
                        windSpeed = weather.WindSpeed,
                        timestamp = DateTime.UtcNow.ToString("O")
                    };

                    try
                    {
                        await _sse.PublishAsync(streamId, payload, _validator);
                    }
                    catch
                    {
                        // best-effort
                    }

                    currentIndex++;
                    await Task.Delay(intervalMs, cts.Token);
                }
            }
            catch (TaskCanceledException) { }
            finally
            {
                _running.TryRemove(streamId, out _);
            }
        });

        return Task.CompletedTask;
    }

    /// <summary>
    /// Stops the background publisher for the specified stream.
    /// </summary>
    public Task StopAsync(string streamId)
    {
        if (_running.TryRemove(streamId, out var cts))
        {
            cts.Cancel();
            cts.Dispose();
        }

        return Task.CompletedTask;
    }
}
