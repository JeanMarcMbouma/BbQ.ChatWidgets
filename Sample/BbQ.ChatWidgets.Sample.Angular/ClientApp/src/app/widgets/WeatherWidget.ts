import { ChatWidget } from '@bbq-chat/widgets';

/**
 * Client-side representation of the server weather widget.
 * Supports SSE-driven weather updates with configurable stream ID and city.
 */
export class WeatherWidget extends ChatWidget {
  public readonly city?: string;
  public readonly streamId?: string;

  constructor(label: string, action: string, city?: string, streamId?: string) {
    super('weather', label, action);
    this.city = city;
    this.streamId = streamId;
  }

  toObject(): any {
    return {
      type: 'weather',
      label: this.label,
      action: this.action,
      city: this.city,
      streamId: this.streamId,
    };
  }
}
