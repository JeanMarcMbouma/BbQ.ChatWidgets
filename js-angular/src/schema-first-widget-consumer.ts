import { WidgetManager, WidgetStreamReducer, type WidgetStreamEvent } from '@bbq-chat/widgets';

/** Angular adapter for the shared revision reducer and keyed renderer lifecycle. */
export class AngularSchemaFirstWidgetConsumer {
  constructor(private readonly manager: WidgetManager, private readonly reducer = new WidgetStreamReducer(), private readonly requestResync: (reason: string) => void = () => undefined) {}
  consume(event: WidgetStreamEvent): void {
    const result = this.reducer.reduce(event);
    if (result.status === 'resync-required') this.requestResync(result.reason);
    else if (result.status === 'applied') {
      if (result.state) this.manager.updateWidget(result.instanceId, result.state.widget, 'Angular');
      else this.manager.unmountWidget(result.instanceId);
    }
  }
}
