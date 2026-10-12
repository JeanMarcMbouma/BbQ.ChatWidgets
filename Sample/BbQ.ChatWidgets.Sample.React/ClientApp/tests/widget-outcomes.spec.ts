import { expect, test } from '@playwright/test';

for (const streaming of [false, true]) {
  test(`${streaming ? 'streaming' : 'basic'} chat shows actual widget outcomes instead of trusting prose`, async ({ page }) => {
    const outcomes = [
      { status: 'not_called', text: 'the model did not invoke the widget tool' },
      { status: 'rejected', text: 'The widget was rejected by validation' },
      { status: 'none', text: 'The model chose a text-only response' },
    ];
    let index = 0;
    await page.route(streaming ? '**/api/chat/stream/message' : '**/api/chat/message', async route => {
      expect(route.request().postDataJSON().requireWidgets).toBe(index !== 2);
      const outcome = outcomes[index++];
      const turn = { content: 'I have successfully displayed a widget.', widgets: [], threadId: 'test-thread', widgetGeneration: {
        status: outcome.status,
        diagnostics: outcome.status === 'rejected' ? [{ code: 'widget.action.unregistered', path: '/widgets/0/action', message: 'Use registered action greet.' }] : [],
      } };
      await route.fulfill({ contentType: streaming ? 'text/event-stream' : 'application/json',
        body: streaming ? `data: ${JSON.stringify(turn)}\n\n` : JSON.stringify(turn) });
    });
    await page.goto('/');
    await page.getByRole('button', { name: streaming ? /^Streaming Chat/ : /^Basic Chat/ }).click();
    for (const outcome of outcomes) {
      if (outcome.status === 'none') await page.getByLabel('Include a widget').uncheck();
      await page.getByPlaceholder(streaming ? 'Type a message to stream...' : 'Type a message...', { exact: true }).fill('Show a widget');
      if (streaming) {
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      }
      await page.locator('.input-area button').last().click();
      await expect(page.getByRole('status').last()).toContainText(outcome.text);
    }
    await expect(page.getByText('widget.action.unregistered', { exact: true })).toBeVisible();
    await expect(page.getByText('/widgets/0/action', { exact: true })).toBeVisible();
  });
}
