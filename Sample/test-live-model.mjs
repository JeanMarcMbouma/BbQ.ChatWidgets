import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

// Opt-in integration check: start a demo configured for a local model first.
const base = process.argv[2] ?? 'http://127.0.0.1:5099';
const reportPath = process.argv[3] ?? 'artifacts/local-model/live-results.json';
const results = [];
async function post(path, body) {
  return fetch(`${base}/api/chat${path}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body), signal: AbortSignal.timeout(180_000),
  });
}
async function json(path, body) {
  const response = await post(path, body);
  const text = await response.text();
  assert.equal(response.status, 200, text);
  return JSON.parse(text);
}
async function check(name, run) {
  const start = performance.now();
  try {
    const detail = await run();
    results.push({ name, passed: true, seconds: (performance.now() - start) / 1000, detail });
    console.log(`PASS ${name}`);
    return detail;
  } catch (error) {
    results.push({ name, passed: false, seconds: (performance.now() - start) / 1000, error: String(error) });
    console.error(`FAIL ${name}: ${error}`);
    process.exitCode = 1;
  }
}

const first = await check('model emits a schema-validated button', async () => {
  const turn = await json('/message', {
    message: 'Remember the code ORCHID. Use emit_widgets to show exactly one button labeled Say hello with action greet. Briefly invite me to click it.',
  });
  assert.ok(turn.threadId);
  assert.ok(turn.widgets?.some(widget => widget.type === 'button' && widget.action === 'greet'));
  assert.ok(!turn.content.includes('<widget>'));
  return turn;
});
if (first) {
  await check('model remembers the conversation', async () => {
    const turn = await json('/message', { threadId: first.threadId, message: 'What code did I ask you to remember? Reply with only the code, without widgets.' });
    assert.equal(turn.threadId, first.threadId);
    assert.match(turn.content, /ORCHID/i);
    return turn;
  });
  await check('typed widget action completes on the same thread', async () => {
    const turn = await json('/action', { threadId: first.threadId, action: 'greet', payload: { name: 'Local tester', message: 'Live action confirmed.' } });
    assert.equal(turn.threadId, first.threadId);
    assert.match(turn.content, /Hello, Local tester!/);
    return turn;
  });
}
await check('live SSE yields deltas and a final widget turn', async () => {
  const response = await post('/stream/message', { message: 'Use emit_widgets to show one button labeled Continue with action greet. Then say Ready to continue.' });
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type'), /text\/event-stream/);
  const decoder = new TextDecoder();
  let buffer = '';
  const turns = [];
  for await (const chunk of response.body) {
    buffer += decoder.decode(chunk, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop();
    for (const line of lines) if (line.startsWith('data:')) turns.push(JSON.parse(line.slice(5)));
  }
  assert.ok(turns.length > 1);
  assert.ok(turns.some(turn => turn.isDelta));
  const final = turns.at(-1);
  assert.notEqual(final.isDelta, true);
  assert.ok(final.widgets?.some(widget => widget.type === 'button' && widget.action === 'greet'));
  assert.ok(turns.every(turn => turn.threadId === final.threadId));
  return { eventCount: turns.length, final };
});
await check('empty input is rejected before inference', async () => {
  const response = await post('/message', { message: ' ' });
  assert.equal(response.status, 400);
  return { status: response.status };
});
await mkdir(path.dirname(reportPath), { recursive: true });
await writeFile(reportPath, JSON.stringify({ base, results }, null, 2));
console.log(`Results: ${reportPath}`);
