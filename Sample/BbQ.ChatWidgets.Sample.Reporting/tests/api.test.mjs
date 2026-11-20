import assert from 'node:assert/strict';
import { test } from 'node:test';

const origin = process.env.REPORTING_SAMPLE_URL ?? 'http://127.0.0.1:5097';
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

test('a custom dashboard can be saved, edited, and deleted by its owner only', async () => {
  const definition = { title: 'My dashboard', kind: 'dashboard', tiles: [tile, { ...tile, title: 'Second tile', view: 'grid' }] };
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
