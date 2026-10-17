import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { fetchSentimentReadings, generateMockData } from './data.js';

const old = {value: '20', timestamp: '1700000000'};
const recent = {value: '78', timestamp: '1700086400'};
test('live and fallback readings always put the newest reading last', () => {
  for (const rows of [[old, recent], [recent, old]]) {
    assert.deepEqual(generateMockData(rows).map(row => row.fearGreedScore), [20, 78]);
  }
});
test('malformed, empty and duplicate upstream readings are handled', () => {
  assert.equal(generateMockData([old, old, null, {value: 150, timestamp: 1}, {value: '', timestamp: 1}]).length, 1);
  assert.throws(() => generateMockData([]), /No valid/);
  assert.throws(() => generateMockData({}), /Invalid/);
});

async function withUpstream(handler, check) {
  const server = createServer(handler);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    await check(`http://127.0.0.1:${server.address().port}`);
  } finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }
}

test('upstream HTTP, JSON and contract failures reach the fallback boundary', async () => {
  await withUpstream((request, response) => {
    response.setHeader('Content-Type', 'application/json');
    if (request.url === '/http-error') response.statusCode = 503;
    response.end(request.url === '/invalid-json' ? 'unavailable' : JSON.stringify(
      request.url === '/valid' ? { data: [recent, old] } : { data: [] },
    ));
  }, async url => {
    assert.deepEqual((await fetchSentimentReadings({url: `${url}/valid`})).map(row => row.fearGreedScore), [20, 78]);
    await assert.rejects(fetchSentimentReadings({url: `${url}/http-error`}), /503/);
    await assert.rejects(fetchSentimentReadings({url: `${url}/invalid-json`}), SyntaxError);
    await assert.rejects(fetchSentimentReadings({url: `${url}/empty`}), /No valid/);
  });
});

test('a stalled upstream body rejects so the UI can stop loading and use its fallback', async () => {
  await withUpstream((_, response) => {
    response.writeHead(200, {'Content-Type': 'application/json'});
    response.write('{"data":');
  }, async url => {
    let guard;
    try {
      await assert.rejects(Promise.race([
        fetchSentimentReadings({url, timeoutMs: 50}),
        new Promise(resolve => { guard = setTimeout(() => resolve('deadline missed'), 500); }),
      ]), error => error.name === 'TimeoutError' || error.name === 'AbortError');
    } finally {
      clearTimeout(guard);
    }
  });
});
