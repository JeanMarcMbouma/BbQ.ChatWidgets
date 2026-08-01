/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import type { WidgetManager } from '@bbq-chat/widgets';
import { AngularSchemaFirstWidgetConsumer } from './schema-first-widget-consumer';

describe('AngularSchemaFirstWidgetConsumer', () => {
  it('consumes the shared fixture and requests resync for its intentional gap', () => {
    const fixture = JSON.parse(readFileSync('../test-fixtures/schema-first-lifecycle.json', 'utf8'));
    const manager = { updateWidget: vi.fn(), unmountWidget: vi.fn() } as unknown as WidgetManager;
    const resync = vi.fn();
    const consumer = new AngularSchemaFirstWidgetConsumer(manager, undefined, resync);
    consumer.consume(fixture.form);
    fixture.events.forEach((event: never) => consumer.consume(event));

    expect(manager.updateWidget).toHaveBeenCalledTimes(4);
    expect(manager.unmountWidget).toHaveBeenCalledTimes(1);
    expect(resync).toHaveBeenCalledWith('revision-gap');
  });
});
