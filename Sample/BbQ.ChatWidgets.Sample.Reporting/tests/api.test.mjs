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

test('authored layouts reject invalid references and protected updates and round-trip in the standard store', async () => {
  const definition = {
    title: 'Order modes',
    kind: 'dashboard',
    tiles: [{ ...tile, id: 'count', view: 'column' }],
    filters: [],
    layout: { defaultModeId: 'overview', modes: [
      { id: 'overview', label: 'Overview', placements: [{ id: 'main', tileIds: ['count'], columnSpan: 8 }] },
    ] },
  };
  const create = body => request('/saved', { method: 'POST', body });
  const created = await create(definition);
  assert.equal(created.status, 200, await created.clone().text());
  const saved = await created.json();
  const path = '/saved/' + saved.id;
  try {
    assert.deepEqual(saved.definition, definition);
    for (const mutate of [
      copy => { copy.layout.modes[0].placements[0].tileIds = ['unknown']; },
      copy => { copy.layout.defaultModeId = 'missing'; },
      copy => { copy.layout.modes[0].placements[0].columnSpan = 13; },
      copy => { copy.tiles.push(copy.tiles[0]); },
      copy => { copy.tiles[0].presentation = { colors: [{ key: 'order', color: 'invalid' }] }; },
    ]) {
      const candidate = structuredClone(definition);
      mutate(candidate);
      assert.equal((await create(candidate)).status, 400);
    }
    const legacy = { title: 'Older editor', kind: 'dashboard', tiles: [tile] };
    assert.equal((await request(path, { method: 'PUT', body: legacy })).status, 409);
    const listed = await (await request('/saved')).json();
    assert.deepEqual(listed.find(item => item.id === saved.id)?.definition, definition);
    assert.equal((await request(path + '?removeLayout=true', { method: 'PUT', body: legacy })).status, 204);
    const updated = await (await request('/saved')).json();
    assert.deepEqual(updated.find(item => item.id === saved.id)?.definition, legacy);
  } finally {
    await request(path, { method: 'DELETE' });
  }
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

test('typed query inputs are scoped, normalized and validated before report execution', async () => {
  const run = body => request('/run', { method: 'POST', body });
  const selected = { ...query, inputs: [{ id: 'scale', value: 100 }, { id: 'pending', value: false }] };
  const result = await run(selected);
  assert.equal(result.status, 200);
  assert.deepEqual(await result.json(), [{ label: 'Complete', value: 0.18 }]);

  for (const inputs of [
    [{ id: 'tenant', value: 'south' }],
    [{ id: 'scale', value: '100' }],
    [{ id: 'scale', value: 1000 }],
    [{ id: 'scale', value: 0.5 }],
    [{ id: 'scale', value: 9007199254740992 }],
    [{ id: 'pending', value: true }, { id: 'pending', value: false }],
  ]) {
    assert.equal((await run({ ...query, inputs })).status, 400);
  }

  const definition = { title: 'Selected order count', kind: 'report', tiles: [{ ...tile, query: selected }] };
  const created = await request('/saved', { method: 'POST', body: definition });
  assert.equal(created.status, 200);
  const saved = await created.json();
  try {
    assert.deepEqual(saved.definition, definition);
    const invalid = { ...definition, tiles: [{ ...tile, query: { ...query, inputs: [{ id: 'region', value: 2 }] } }] };
    assert.equal((await request('/saved/' + saved.id, { method: 'PUT', body: invalid })).status, 400);
  } finally {
    assert.equal((await request('/saved/' + saved.id, { method: 'DELETE' })).status, 204);
  }
});

test('dynamic input choices use the current scope and also constrain paged queries', async () => {
  const body = { dataset: 'fulfilment', input: 'warehouse', from: query.from, to: query.to };
  const options = account => request('/options', { method: 'POST', account, body });
  assert.equal((await options(null)).status, 401);
  const response = await options('demo');
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.deepEqual((await response.json()).map(option => option.value), ['Bristol', 'Leeds', 'London', 'Manchester']);
  assert.deepEqual((await (await options('other')).json()).map(option => option.value), ['London', 'Manchester']);

  const selected = { ...query, dataset: 'fulfilment', metric: 'revenue', groupBy: 'paged-order',
    inputs: [{ id: 'warehouse', value: 'Leeds' }] };
  const page = account => request('/page', { method: 'POST', account, body: { query: selected, offset: 0, limit: 10 } });
  assert.equal((await page('other')).status, 400);
  const result = await page('demo');
  assert.equal(result.status, 200);
  const data = await result.json();
  assert.equal(data.total, 600);
  assert.ok(data.rows.every(entry => entry.row.fields.warehouse === 'Leeds' && entry.key.startsWith('N-')));

  assert.equal((await request('/options', { method: 'POST', body: { ...body, from: '2026-10-01' } })).status, 400);
});

test('Order comparison uses one scoped order population across the charts and paged grid', async () => {
  const response = await request('/catalog');
  assert.equal(response.status, 200);
  const catalog = await response.json();
  const { definition } = catalog.presets.find(item => item.id === 'order-comparison');
  assert.deepEqual(definition.tiles.map(tile => tile.view),
    ['metric', 'time-column', 'pie', 'column', 'scatter', 'histogram', 'grid', 'time-line']);
  assert.equal(catalog.capabilities.layouts, true);
  assert.deepEqual(definition.layout.modes.map(mode => mode.id), ['overview', 'warehouse']);
  assert.equal(definition.layout.modes[1].placements[1].variants.length, 2);
  assert.ok(definition.tiles.every(tile => tile.query.dataset === 'fulfilment'));
  const [metric, daily, statuses, warehouses, scatter, histogram, grid] = definition.tiles;
  assert.equal(daily.presentation.seriesField, 'stage');
  assert.equal(daily.presentation.dateAxisLabel, 'Business date');
  assert.equal(statuses.presentation.pieHole, 0.55);
  assert.equal(warehouses.presentation.referenceLines[0].axis, 'Y');
  assert.equal(warehouses.presentation.series.length, 2);
  assert.deepEqual(warehouses.inputBinding, { input: 'warehouse', field: 'label' });
  assert.equal(scatter.presentation.sizeField, 'value');
  assert.equal(histogram.presentation.binWidth, 4);

  const execute = async (path, body, account = 'demo') => {
    const result = await request(path, { method: 'POST', account, body });
    assert.equal(result.status, 200, await result.clone().text());
    return result.json();
  };
  const [total, dateRows, statusRows, warehouseRows, bins, page] = await Promise.all([
    execute('/run', metric.query), execute('/run', daily.query), execute('/run', statuses.query),
    execute('/run', warehouses.query), execute('/run', histogram.query),
    execute('/page', { query: grid.query, offset: 0, limit: 10 }),
  ]);
  assert.equal(page.total, 2400);
  assert.deepEqual(new Set(dateRows.map(row => row.fields.stage)), new Set(['Delivered', 'Open']));
  for (const rows of [dateRows, statusRows, warehouseRows, bins]) {
    assert.equal(rows.reduce((sum, row) => sum + row.fields.orderCount, 0), page.total);
  }
  assert.equal(warehouseRows.reduce((sum, row) => sum + row.value, 0), total[0].value);
  assert.deepEqual(bins.map(row => row.fields.binStart), [1, 5, 9, 13, 17, 21, 25, 29]);
  assert.deepEqual((await execute('/run', warehouses.query, 'other')).map(row => row.label).sort(),
    ['London', 'Manchester']);

  const inputs = [{ id: 'warehouse', value: 'Leeds' }, { id: 'value-scale', value: 1000 }];
  const [filtered, filteredPage, filteredBins] = await Promise.all([
    execute('/run', { ...warehouses.query, inputs }),
    execute('/page', { query: { ...grid.query, inputs }, offset: 0, limit: 10 }),
    execute('/run', { ...histogram.query, inputs }),
  ]);
  assert.equal(filteredPage.total, 600);
  assert.ok(filteredPage.rows.every(entry => entry.row.fields.warehouse === 'Leeds'));
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].label, 'Leeds');
  assert.equal(filtered[0].fields.orderCount, filteredPage.total);
  assert.equal(filtered[0].fields.target, 350);
  assert.equal(filtered[0].value, warehouseRows.find(row => row.label === 'Leeds').value / 1000);
  assert.equal(filteredBins.reduce((sum, row) => sum + row.fields.orderCount, 0), 600);

  const savedDefinition = { ...definition, tiles: definition.tiles.map(tile => ({
    ...tile, query: { ...tile.query, inputs },
  })) };
  const saved = await execute('/saved', savedDefinition);
  try {
    const definitions = await (await request('/saved')).json();
    assert.deepEqual(definitions.find(item => item.id === saved.id)?.definition, savedDefinition);
  } finally {
    assert.equal((await request('/saved/' + saved.id, { method: 'DELETE' })).status, 204);
  }
});

test('report owners can save an ordered list of authorized filter controls', async () => {
  const catalog = await (await request('/catalog')).json();
  const { definition } = catalog.presets.find(item => item.id === 'order-comparison');
  const save = body => request('/saved', { method: 'POST', body });
  const authored = { ...definition, filters: [{ input: 'channel', label: 'Sales channel' }, { input: 'warehouse' }] };
  const response = await save(authored);
  assert.equal(response.status, 200);
  const created = await response.json();
  const read = async () => (await (await request('/saved')).json()).find(item => item.id === created.id)?.definition;
  try {
    assert.deepEqual(await read(), authored);
    assert.equal((await (await request('/saved', { account: 'colleague' })).json())
      .some(item => item.id === created.id), false);
    const none = { ...authored, filters: [] };
    assert.equal((await request('/saved/' + created.id, { method: 'PUT', body: none })).status, 204);
    assert.deepEqual(await read(), none);

    for (const filters of [
      [{ input: 'tenant' }],
      [{ input: 'value-scale' }],
      [{ input: 'warehouse' }, { input: 'warehouse' }],
      [{ input: 'channel', label: ' '.repeat(2) }],
      [{ input: 'channel', label: 'x'.repeat(101) }],
      [{ input: 'pending' }],
    ]) {
      const invalid = { ...authored, filters };
      assert.equal((await save(invalid)).status, 400);
      assert.equal((await request('/saved/' + created.id, { method: 'PUT', body: invalid })).status, 400);
    }
  } finally {
    assert.equal((await request('/saved/' + created.id, { method: 'DELETE' })).status, 204);
  }
});

test('saved chart presentations validate bindings against the dataset and view', async () => {
  const presentation = { series: [{ field: 'value', label: 'Orders' }],
    referenceLines: [{ axis: 'X', label: 'Target', value: 25 }] };
  const valid = { ...tile, presentation, inputBinding: { input: 'pending', field: 'label' } };
  const save = tiles => request('/saved', { method: 'POST', body: { title: 'Order snapshot', kind: 'report', tiles } });
  const response = await save([valid]);
  assert.equal(response.status, 200);
  const saved = await response.json();
  try {
    assert.deepEqual(saved.definition.tiles, [valid]);
    for (const invalid of [
      { ...valid, presentation: { series: [{ field: 'unknown', label: 'Unknown' }] } },
      { ...valid, presentation: { pieHole: 0.5 } },
      { ...valid, presentation: { referenceLines: [{ axis: 'Y', label: 'Wrong axis', value: 2 }] } },
      { ...valid, inputBinding: { input: 'scale', field: 'value' } },
    ]) assert.equal((await save([invalid])).status, 400);
  } finally {
    assert.equal((await request('/saved/' + saved.id, { method: 'DELETE' })).status, 204);
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
