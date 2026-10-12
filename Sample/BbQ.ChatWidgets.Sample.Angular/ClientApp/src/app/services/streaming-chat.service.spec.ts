import { StreamingChatService } from './streaming-chat.service';

describe('StreamingChatService', () => {
  it('preserves fragmented UTF-8, thread IDs, and widget-only updates', async () => {
    const bytes = new TextEncoder().encode(
      'data: {"threadId":"server-thread","content":"Café"}\r\n\r\n' +
      'data:{"widgets":[{"type":"button","label":"Continue","action":"next"}]}\n\n' +
      'data: [DONE]\n\n'
    );
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        for (const byte of bytes) controller.enqueue(new Uint8Array([byte]));
        controller.close();
      }
    });
    spyOn(globalThis, 'fetch').and.resolveTo(new Response(body));
    const service = new StreamingChatService();

    await service.sendStreamingMessage('Hello');

    expect(service.threadId()).toBe('server-thread');
    expect(service.messages().length).toBe(2);
    expect(service.messages()[1].content).toBe('Café');
    expect(service.messages()[1].widgets?.length).toBe(1);
    expect(service.error()).toBeNull();
    expect(service.isStreaming()).toBeFalse();
    expect(body.locked).toBeFalse();
  });

  it('prevents duplicate requests and discards responses after clearing', async () => {
    let resolve!: (response: Response) => void;
    const fetchSpy = spyOn(globalThis, 'fetch').and.returnValue(
      new Promise<Response>(done => { resolve = done; })
    );
    const service = new StreamingChatService();
    const pending = service.sendStreamingMessage('First');
    await service.sendStreamingMessage('Duplicate');
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    service.clearMessages();
    const signal = fetchSpy.calls.mostRecent().args[1]?.signal;
    expect(signal?.aborted).toBeTrue();
    resolve(new Response('data: {"threadId":"old","content":"Stale"}\n\n'));
    await pending;

    expect(service.messages()).toEqual([]);
    expect(service.threadId()).toBeNull();
    expect(service.error()).toBeNull();
    expect(service.isStreaming()).toBeFalse();
  });

  it('allows retry after HTTP failure', async () => {
    const fetchSpy = spyOn(globalThis, 'fetch').and.resolveTo(new Response('', { status: 503 }));
    spyOn(console, 'error');
    const service = new StreamingChatService();
    await service.sendStreamingMessage('First');
    expect(service.error()).not.toBeNull();
    expect(service.isStreaming()).toBeFalse();

    fetchSpy.and.resolveTo(new Response('data: {"content":"Recovered"}\n\n'));
    await service.sendStreamingMessage('Retry');
    expect(service.error()).toBeNull();
    expect(service.messages().at(-1)?.content).toBe('Recovered');
  });
});
