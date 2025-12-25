import { ChatWidget } from '@bbq/chatwidgets';

/**
 * Client-side representation of the server clock widget.
 * Matches server registration: type id 'clock-widget'.
 * 
 * Supports SSE-driven time updates with configurable stream ID and timezone.
 */
export class ClockWidget extends ChatWidget {
  public readonly timezone?: string;
  public readonly streamId?: string;

  constructor(label: string, action: string, timezone?: string, streamId?: string) {
    super('clock', label, action);
    this.timezone = timezone;
    this.streamId = streamId;
  }

  toObject(): any {
    return {
      type: 'clock',
      label: this.label,
      action: this.action,
      timezone: this.timezone,
      streamId: this.streamId,
    };
  }
}
