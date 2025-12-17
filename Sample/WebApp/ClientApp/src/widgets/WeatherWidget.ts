import { ChatWidget } from '@bbq/chatwidgets';

/**
 * Weather widget model for client-side rendering.
 * Extends ChatWidget with weather-specific properties and SSE support.
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
