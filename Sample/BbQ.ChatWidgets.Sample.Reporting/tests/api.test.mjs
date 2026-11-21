import assert from 'node:assert/strict';
import { test } from 'node:test';

const origin = process.env.REPORTING_SAMPLE_URL ?? 'http://127.0.0.1:5107';
const query = { dataset: 'orders', metric: 'count', groupBy: 'status', from: '2026-11-01', to: '2026-11-14' };
const tile = { title: 'Order count', view: 'bar', query };

function request(path, { method = 'GET', account = 'demo', body } = {}) {
  const headers = {};
  if (account) headers['X-Demo-Account'] = account;
  if (body) headers['Content-Type'] = 'application/json';
  return fetch(origin + '/api/reporting' + path, {
    method, headers, body: body && JSON.stringify(body),
  });
}

test('the catalog requires a principal and contains both built-in types', async () => {
  assert.equal((await request('/catalog', { account: null })).status, 401);
  const response = await request('/catalog');
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  const catalog = await response.json();
  assert.ok(catalog.presets.some(item => item.definition.kind === 'report'));
  assert.ok(catalog.presets.some(item => item.definition.kind === 'dashboard'));
  assert.equal(catalog.presets.find(item => item.id === 'reporting-widgets')?.definition.tiles.length, 8);
  assert.deepEqual(catalog.presets.find(item => item.id === 'order-analysis')?.definition.tiles.map(tile => tile.view),
    ['waterfall', 'pareto', 'histogram']);
});

test('report runs aggregate only the current tenant and validate the query against the catalog', async () => {
  for (const [account, values] of [['demo', [18, 6]], ['other', [6, 2]]]) {
    const response = await request('/run', { method: 'POST', account, body: query });
    assert.equal(response.status, 200);
    const rows = await response.json();
    assert.deepEqual(rows.map(row => row.value), values);
  }

  for (const change of [{ metric: 'unknown' }, { groupBy: 'unknown' }, { to: '2025-11-14' }, { from: '2024-01-01' }]) {
    const response = await request('/run', { method: 'POST', body: { ...query, ...change } });
    assert.equal(response.status, 400);
  }
});

test('the time-series preset uses the day grouping and its chart types can be saved', async () => {
  const catalogResponse = await request('/catalog');
  assert.equal(catalogResponse.status, 200);
  const catalog = await catalogResponse.json();
  const { definition } = catalog.presets.find(item => item.id === 'order-time-series');
  assert.deepEqual(definition.tiles.map(tile => tile.view), ['time-line', 'area', 'step', 'time-column']);

  const body = definition.tiles[0].query;
  const dataset = catalog.datasets.find(item => item.id === body.dataset);
  assert.equal(dataset.dimensions.find(item => item.id === body.groupBy).dateField, 'label');
  assert.deepEqual(definition.tiles.map(tile => tile.query), [body, body, body, body]);
  const series = await request('/run', { method: 'POST', body });
  assert.equal(series.status, 200);
  const rows = await series.json();
  assert.equal(rows.length, 14);
  assert.equal(rows[0].label, body.from);
  assert.equal(rows.at(-1).label, body.to);

  const created = await request('/saved', { method: 'POST', body: definition });
  assert.equal(created.status, 200);
  const saved = await created.json();
  try {
    assert.deepEqual(saved.definition, definition);
  } finally {
    assert.equal((await request('/saved/' + saved.id, { method: 'DELETE' })).status, 204);
  }
});

test('the fulfilment grid exposes typed details within the current tenant and date range', async () => {
  const catalog = await (await request('/catalog')).json();
  const preset = catalog.presets.find(item => item.id === 'fulfilment-grid');
  assert.equal(preset.definition.tiles[0].view, 'grid');
  const body = preset.definition.tiles[0].query;
  const columns = catalog.datasets.find(dataset => dataset.id === body.dataset).dimensions
    .find(dimension => dimension.id === body.groupBy).columns;
  assert.deepEqual(columns.filter(column => column.editable).map(column => column.field), ['review']);
  for (const [account, prefix, count] of [['demo', 'N-', 96], ['other', 'S-', 36]]) {
    const response = await request('/run', { method: 'POST', account, body });
    assert.equal(response.status, 200);
    const rows = await response.json();
    assert.equal(rows.length, count);
    assert.equal(new Set(rows.map(row => row.label)).size, count);
    assert.ok(rows.every(row => row.label.startsWith(prefix) && Number.isInteger(row.fields.units)));
  }
  const response = await request('/run', { method: 'POST', body: { ...body, from: body.to } });
  assert.equal(response.status, 200);
  const rows = await response.json();
  assert.ok(rows.length > 0 && rows.every(row => row.fields.placed === body.to));
});

test('the warehouse grid pages the full scoped result and validates grid operations', async () => {
  const catalog = await (await request('/catalog')).json();
  const tile = catalog.presets.find(item => item.id === 'warehouse-grid').definition.tiles[0];
  const dimension = catalog.datasets.find(dataset => dataset.id === tile.query.dataset)
    .dimensions.find(field => field.id === tile.query.groupBy);
  assert.ok(dimension.grid.sortFields.includes('value'));
  assert.ok(dimension.grid.filterFields.includes('warehouse'));
  const base = { query: tile.query, offset: 0, limit: 25, sortField: 'value', descending: true };
  const getPage = (body, account = 'demo') => request('/page', { method: 'POST', account, body });

  assert.equal((await getPage(base, null)).status, 401);
  const first = await getPage(base);
  const second = await getPage({ ...base, offset: 25 });
  assert.equal(first.status, 200);
  assert.equal(second.status, 200);
  assert.equal(first.headers.get('cache-control'), 'no-store');
  const pages = await Promise.all([first.json(), second.json()]);
  assert.deepEqual(pages.map(page => page.total), [2400, 2400]);
  assert.deepEqual(pages.map(page => page.rows.length), [25, 25]);
  const entries = pages.flatMap(page => page.rows);
  assert.equal(new Set(entries.map(entry => entry.key)).size, 50);
  assert.ok(entries.every(entry => entry.key === entry.row.label && entry.key.startsWith('N-')));
  assert.ok(entries.every((entry, index) => index === 0 || entries[index - 1].row.value >= entry.row.value));
  const repeat = await (await getPage(base)).json();
  assert.deepEqual(repeat, pages[0]);

  const south = await (await getPage(base, 'other')).json();
  assert.equal(south.total, 720);
  assert.ok(south.rows.every(entry => entry.key.startsWith('S-')));
  const matching = await (await getPage({
    ...base, search: 'Customer 01', filters: [{ field: 'warehouse', value: 'Leeds' }],
  })).json();
  assert.ok(matching.total > 0 && matching.total < pages[0].total);
  assert.equal(matching.rows.length, matching.total);
  assert.ok(matching.rows.every(entry => entry.row.fields.warehouse === 'Leeds' && entry.row.fields.customer === 'Customer 01'));

  for (const change of [
    { limit: 101 }, { offset: -1 }, { sortField: 'review' },
    { filters: [{ field: 'value', value: '0' }] }, { query },
  ]) {
    assert.equal((await getPage({ ...base, ...change })).status, 400);
  }
});

test('a custom dashboard can be saved, edited, and deleted by its owner only', async () => {
  const definition = { title: 'My dashboard', kind: 'dashboard',
    tiles: ['waterfall', 'pareto', 'histogram'].map(view => ({ ...tile, title: view, view })) };
  const created = await request('/saved', { method: 'POST', body: definition });
  assert.equal(created.status, 200);
  const { id } = await created.json();
  try {
    for (const account of ['colleague', 'other']) {
      const list = await (await request('/saved', { account })).json();
      assert.equal(list.some(item => item.id === id), false);
      assert.equal((await request('/saved/' + id, { method: 'PUT', account, body: definition })).status, 404);
      assert.equal((await request('/saved/' + id, { method: 'DELETE', account })).status, 404);
    }

    const updated = { ...definition, title: 'Updated dashboard' };
    assert.equal((await request('/saved/' + id, { method: 'PUT', body: updated })).status, 204);
    const saved = await (await request('/saved')).json();
    assert.deepEqual(saved.find(item => item.id === id)?.definition, updated);
  } finally {
    assert.equal((await request('/saved/' + id, { method: 'DELETE' })).status, 204);
  }
});

test('a custom report accepts one tile and rejects a multi-tile definition', async () => {
  const definition = { title: 'My report', kind: 'report', tiles: [tile] };
  assert.equal((await request('/saved', { method: 'POST', body: { ...definition, tiles: [tile, tile] } })).status, 400);
  const created = await request('/saved', { method: 'POST', body: definition });
  assert.equal(created.status, 200);
  const { id } = await created.json();
  assert.equal((await request('/saved/' + id, { method: 'DELETE' })).status, 204);
});
