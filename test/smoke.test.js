// Smoke test: runs the app against a stub HubSpot API so all three routes
// can be exercised without touching a real portal.
const http = require('http');
const assert = require('assert');

const created = [];
const stub = http.createServer((req, res) => {
  let body = '';
  req.on('data', c => body += c);
  req.on('end', () => {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) {
      res.writeHead(401); return res.end(JSON.stringify({ message: 'Unauthorized' }));
    }
    if (req.method === 'GET' && req.url.startsWith('/crm/v3/objects/p_plants')) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ results: [
        { id: '1', properties: { name: 'Rozanne Geranium', plant_type: 'Perennial', bloom_season: 'Early Summer' } },
        { id: '2', properties: { name: 'Sea Holly',        plant_type: 'Perennial', bloom_season: 'Midsummer' } },
        ...created
      ]}));
    }
    if (req.method === 'POST' && req.url === '/crm/v3/objects/p_plants') {
      const parsed = JSON.parse(body);
      created.push({ id: String(created.length + 3), properties: parsed.properties });
      res.writeHead(201, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ id: 'new', properties: parsed.properties }));
    }
    res.writeHead(404); res.end(JSON.stringify({ message: 'Not found' }));
  });
});

function req(opts, payload) {
  return new Promise(resolve => {
    const r = http.request(opts, resp => {
      let d = ''; resp.on('data', c => d += c);
      resp.on('end', () => resolve({ status: resp.statusCode, headers: resp.headers, body: d }));
    });
    if (payload) r.write(payload);
    r.end();
  });
}

(async () => {
  await new Promise(r => stub.listen(4001, r));
  process.env.HUBSPOT_BASE_URL = 'http://127.0.0.1:4001';
  process.env.PRIVATE_APP_ACCESS_TOKEN = 'test-token';
  process.env.HUBSPOT_OBJECT_TYPE = 'p_plants';
  process.env.PORT = '4000';

  const app = require('../index.js');
  const server = app.listen(4000);
  await new Promise(r => server.on('listening', r));

  const base = { host: '127.0.0.1', port: 4000 };
  let pass = 0;

  // ROUTE 1
  const home = await req({ ...base, path: '/', method: 'GET' });
  assert.strictEqual(home.status, 200, 'GET / should be 200');
  assert.ok(home.body.includes('<table>'), 'homepage renders a table');
  assert.ok(home.body.includes('Rozanne Geranium'), 'homepage lists records');
  assert.ok(home.body.includes('Bloom Season'), 'homepage shows third column label');
  assert.ok(home.body.includes('href="/update-cobj"'), 'homepage links to the form');
  console.log('PASS  ROUTE 1  GET /            renders record table'); pass++;

  // ROUTE 2
  const form = await req({ ...base, path: '/update-cobj', method: 'GET' });
  assert.strictEqual(form.status, 200, 'GET /update-cobj should be 200');
  assert.ok((form.body.match(/<input/g) || []).length >= 3, 'form has >= 3 inputs');
  assert.ok(form.body.includes('method="POST"'), 'form posts');
  assert.ok(form.body.includes('name="bloom_season"'), 'third field wired to property');
  console.log('PASS  ROUTE 2  GET /update-cobj renders 3-field form'); pass++;

  // ROUTE 3
  const payload = 'name=Dahlia+Cafe+au+Lait&plant_type=Tuber&bloom_season=Late+Summer';
  const post = await req({ ...base, path: '/update-cobj', method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(payload) } }, payload);
  assert.strictEqual(post.status, 302, 'POST should redirect');
  assert.strictEqual(post.headers.location, '/', 'POST redirects to homepage');
  assert.strictEqual(created.length, 1, 'record was sent to HubSpot');
  assert.strictEqual(created[0].properties.name, 'Dahlia Cafe au Lait', 'name mapped');
  assert.strictEqual(created[0].properties.bloom_season, 'Late Summer', 'third property mapped');
  console.log('PASS  ROUTE 3  POST /update-cobj creates record + redirects'); pass++;

  // Round trip
  const after = await req({ ...base, path: '/', method: 'GET' });
  assert.ok(after.body.includes('Dahlia Cafe au Lait'), 'new record appears on homepage');
  console.log('PASS  ROUND TRIP  new record appears on homepage'); pass++;

  server.close(); stub.close();
  console.log(`\n${pass}/4 checks passed`);
})().catch(e => { console.error('FAIL:', e.message); process.exit(1); });
