import { expect, test } from '@playwright/test';

test('native React form validates and submits once', async ({ page }) => {
  const actions: string[] = [];
  const errors: string[] = [];
  page.on('console', message => {
    if (message.text().startsWith('Widget action: save_profile')) actions.push(message.text());
  });
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/api/chat/message', route => route.fulfill({ json: {
    role: 'assistant', content: 'Complete your profile.', threadId: 'native-form-test',
    widgets: [{ type: 'form', label: 'Profile', action: 'save_profile', fields: [
      { name: 'name', type: 'input', label: 'Profile name', required: true },
      { name: 'email', type: 'email', label: 'Profile email', required: true },
    ], actions: [{ type: 'submit', label: 'Save profile' }] }],
  } }));
  await page.goto('/');
  await page.getByRole('button', { name: /^Basic Chat/ }).click();
  await page.getByPlaceholder('Type a message...', { exact: true }).fill('Profile');
  await page.getByRole('button', { name: 'Send', exact: true }).click();
  await page.getByRole('button', { name: 'Save profile', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveCount(2);
  expect(actions).toHaveLength(0);
  await page.getByRole('textbox', { name: 'Profile name', exact: true }).fill('Ada');
  await page.getByRole('textbox', { name: 'Profile email', exact: true }).fill('ada@example.com');
  await page.getByRole('button', { name: 'Save profile', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Save profile', exact: true })).toBeDisabled();
  await expect(page.getByRole('textbox', { name: 'Profile name', exact: true })).toBeDisabled();
  expect(actions).toHaveLength(1);
  expect(errors).toEqual([]);
});

test('visitors can complete a local workflow, inspect JSON and reset', async ({ page }) => {
  const errors: string[] = [];
  const apiRequests: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('request', (request) => {
    if (/\/(api|sample)\//.test(request.url())) apiRequests.push(request.url());
  });
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('More done.');
  await page.getByRole('link', { name: 'Try the playground' }).click();
  await page.getByLabel('Your name').fill('Alex');
  await page.getByLabel('Email address').fill('alex@example.com');
  await page.getByLabel('Preferred day').selectOption('Wednesday');
  await page.getByRole('button', { name: 'Request a walkthrough' }).click();
  await expect(page.locator('.action-result')).toContainText('Thanks, Alex');
  await page.getByRole('button', { name: 'View widget JSON' }).click();
  await expect(page.locator('.widget-json')).toContainText('book_visit');
  await page.getByRole('button', { name: 'Reset', exact: true }).click();
  await expect(page.getByLabel('Your name')).toHaveValue('');
  await expect(page.locator('.action-result')).toContainText('Interact with a widget');
  await page.getByRole('button', { name: /Resolve a problem/ }).click();
  await page.getByRole('button', { name: 'Check delivery', exact: true }).click();
  await expect(page.locator('.action-result')).toContainText('Tracking action received');
  await page.getByRole('button', { name: /Make a decision/ }).click();
  await page.getByRole('button', { name: 'Approve request', exact: true }).click();
  await expect(page.locator('.action-result')).toContainText('Approval action received');
  expect(apiRequests).toEqual([]);
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true
  );
  await page.screenshot({
    path: test.info().outputPath('playground.png'),
    fullPage: true,
  });
});

test('empty and invalid required fields cannot dispatch a booking action', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Request a walkthrough' }).click();
  await expect(page.locator('.action-result')).toContainText('Interact with a widget');
  await page.getByLabel('Your name').fill('Alex');
  await page.getByLabel('Email address').fill('not-an-email');
  await page.getByLabel('Preferred day').selectOption('Monday');
  await expect(page.getByRole('button', { name: 'Request a walkthrough' })).toBeDisabled();
  await page.getByLabel('Email address').fill('alex@example.com');
  await page.getByLabel('Your name').focus();
  await expect(page.getByRole('button', { name: 'Request a walkthrough' })).toBeEnabled();
});

test('live renderer dispatches once and disposes chart resources when leaving', async ({
  page,
}) => {
  const actions: string[] = [];
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.text().startsWith('Widget action: confirm')) actions.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.route('**/api/chat/message', (route) =>
    route.fulfill({
      json: {
        role: 'assistant',
        content: 'Here is a sample chart.',
        threadId: 'browser-test',
        widgets: [
          { type: 'button', label: 'Confirm', action: 'confirm' },
          {
            type: 'echarts',
            label: 'Sample chart',
            action: 'chart_click',
            chartType: 'bar',
            jsonData: JSON.stringify({
              xAxis: { type: 'category', data: ['A', 'B'] },
              yAxis: { type: 'value' },
              series: [{ type: 'bar', data: [1, 2] }],
            }),
          },
        ],
      },
    })
  );
  await page.goto('/');
  await page.getByRole('button', { name: /^Basic Chat/ }).click();
  await page.getByPlaceholder('Type a message...', { exact: true }).fill('Show a chart');
  await page.getByRole('button', { name: 'Send', exact: true }).click();
  await expect(page.locator('.echarts-container canvas')).toBeVisible();
  await page.evaluate(() => {
    const testWindow = window as unknown as {
      echarts: { getInstanceByDom: (element: HTMLElement) => unknown };
      chartForTest: unknown;
    };
    testWindow.chartForTest = testWindow.echarts.getInstanceByDom(
      document.querySelector('.echarts-container')!
    );
  });
  await page.getByRole('button', { name: 'Confirm', exact: true }).click();
  expect(actions).toHaveLength(1);
  await page.getByRole('button', { name: '← Back', exact: true }).click();
  expect(
    await page.evaluate(() =>
      (
        window as unknown as { chartForTest: { isDisposed: () => boolean } }
      ).chartForTest.isDisposed()
    )
  ).toBe(true);
  expect(errors).toEqual([]);
});
