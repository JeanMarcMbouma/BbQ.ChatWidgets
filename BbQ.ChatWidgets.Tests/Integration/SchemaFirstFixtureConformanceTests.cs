using System.Text.Json;
using BbQ.ChatWidgets.Blazor.Services;
using BbQ.ChatWidgets.Models;
using Xunit;

namespace BbQ.ChatWidgets.Tests.Integration;

public sealed class SchemaFirstFixtureConformanceTests
{
    [Fact]
    public void SharedFixture_DeserializesFormAndDrivesBlazorLifecycleGapRecoveryAndRemoval()
    {
        using var fixture = JsonDocument.Parse(File.ReadAllText(Path.Combine(AppContext.BaseDirectory, "test-fixtures", "schema-first-lifecycle.json")));
        var formEvent = fixture.RootElement.GetProperty("form").Deserialize<WidgetStreamEvent>(Serialization.Default)!;
        var form = formEvent.Payload.Deserialize<ChatWidget>(Serialization.Default);
        Assert.IsType<FormWidget>(form);

        var reconciler = new WidgetStreamReconciler();
        var lifecycle = new RecordingLifecycle();
        Assert.Equal(WidgetTransitionOutcome.Applied, reconciler.Apply(formEvent, lifecycle));
        var events = fixture.RootElement.GetProperty("events").EnumerateArray().Select(x => x.Deserialize<WidgetStreamEvent>(Serialization.Default)!).ToArray();
        Assert.Equal(WidgetTransitionOutcome.Applied, reconciler.Apply(events[0], lifecycle));
        Assert.Equal(WidgetTransitionOutcome.Applied, reconciler.Apply(events[1], lifecycle));
        Assert.Equal(WidgetTransitionOutcome.ResyncRequired, reconciler.Apply(events[2], lifecycle));
        Assert.Equal(WidgetTransitionOutcome.Applied, reconciler.Apply(events[3], lifecycle));
        Assert.Equal(75, reconciler.Widgets[events[3].InstanceId!.Value].State.GetProperty("value").GetInt32());
        Assert.Equal(WidgetTransitionOutcome.Applied, reconciler.Apply(events[4], lifecycle));
        Assert.DoesNotContain(events[4].InstanceId!.Value, reconciler.Widgets.Keys);
        Assert.Equal(["mount", "mount", "update", "update", "unmount"], lifecycle.Calls);
    }

    private sealed class RecordingLifecycle : IBlazorWidgetLifecycle
    {
        public List<string> Calls { get; } = [];
        public void Mount(Guid instanceId, WidgetRevisionedState state) => Calls.Add("mount");
        public void Update(Guid instanceId, WidgetRevisionedState previous, WidgetRevisionedState next) => Calls.Add("update");
        public void Unmount(Guid instanceId, WidgetRevisionedState state) => Calls.Add("unmount");
    }
}
