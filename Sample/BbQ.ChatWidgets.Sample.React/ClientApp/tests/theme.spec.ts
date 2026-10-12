import { expect, test } from '@playwright/test';

for (const colorScheme of ['light', 'dark'] as const) {
  test(`landing and demos retain the shared theme with ${colorScheme} OS preference`, async ({ page }) => {
    const pageErrors: string[] = [];
    const failedStylesheets: string[] = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    page.on('requestfailed', request => {
      if (request.resourceType() === 'stylesheet') failedStylesheets.push(request.url());
    });
    page.on('response', response => {
      if (response.request().resourceType() === 'stylesheet' && !response.ok()) failedStylesheets.push(response.url());
    });
    await page.route('**/api/chat/message', route => route.fulfill({ json: {
      content: 'Demo response', threadId: 'theme-test', widgets: [],
    } }));
    await page.emulateMedia({ colorScheme });
    await page.goto('/');
    const form = page.locator('.preview-widgets fieldset');
    await expect(form).toHaveCSS('background-color', 'rgb(250, 251, 248)');
    await expect(page.getByLabel('Your name')).toHaveCSS('background-color', 'rgb(255, 255, 255)');
    await page.getByRole('button', { name: /^Basic Chat/ }).click();
    await expect(page.getByRole('heading', { name: 'Start a conversation' })).toBeVisible();
    await expect(page.locator('.page-header')).toHaveCSS('background-color', 'rgb(247, 248, 242)');
    await expect(page.getByPlaceholder('Type a message...', { exact: true })).toHaveCSS('background-color', 'rgb(255, 255, 255)');
    await expect(page.getByRole('button', { name: 'Send', exact: true })).toHaveCSS('background-color', 'rgb(34, 101, 72)');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: test.info().outputPath(`basic-${colorScheme}.png`), fullPage: true });
    await page.getByRole('button', { name: '← Back', exact: true }).click();
    for (const name of [/^Streaming Chat/, /^Triage Agent/, /^Multi-Turn Agent/, /^Classifier/, /^Voice Chat/, /^Widgets Demo/, /^Actions Demo/, /^SSE Widget Updates/, /^SSE Clock/]) {
      await page.getByRole('button', { name }).click();
      await expect(page.locator('.page-header')).toHaveCSS('background-color', 'rgb(247, 248, 242)');
      await expect(page.locator('.page-header')).toHaveCSS('background-image', 'none');
      await page.getByRole('button', { name: '← Back', exact: true }).click();
    }
    await expect(form).toHaveCSS('background-color', 'rgb(250, 251, 248)');
    expect(pageErrors).toEqual([]);
    expect(failedStylesheets).toEqual([]);
    await expect(page.locator('.preview-widgets .bbq-form')).toHaveCSS('padding', '20px');
    await page.locator('.playground').screenshot({ path: test.info().outputPath(`playground-${colorScheme}.png`) });
  });
}
