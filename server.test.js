// Tests of server.js with a throw-away dist folder:  npm run test:server   (plain node, no test framework)
const assert = require('assert');
const fs = require('fs');
const http = require('http');
const os = require('os');
const path = require('path');

const dist = fs.mkdtempSync(path.join(os.tmpdir(), 'senechal-dist-'));
fs.writeFileSync(path.join(dist, 'index.html'), '<html>app</html>');
fs.writeFileSync(path.join(dist, 'main.0123456789abcdef.js'), 'console.log(1)');
fs.writeFileSync(path.join(dist, 'favicon.ico'), 'x');

process.env.DIST_DIR = dist;
process.env.ALLOWED_HOSTS = '';
const app = require('./server');
const server = app.listen(0);
const port = server.address().port;

function get(urlPath, headers = {}) {
    return new Promise((resolve, reject) => {
        http.get({port, path: urlPath, headers}, res => {
            let body = '';
            res.on('data', c => body += c);
            res.on('end', () => resolve({status: res.statusCode, headers: res.headers, body}));
        }).on('error', reject);
    });
}

async function run() {
    const https = {'x-forwarded-proto': 'https'};

    // http -> https redirect, only to a plain host name
    let r = await get('/character/Arthur', {host: 'example.org'});
    assert.strictEqual(r.status, 301);
    assert.strictEqual(r.headers.location, 'https://example.org/character/Arthur');
    r = await get('/', {host: 'evil.example/@x'});
    assert.strictEqual(r.status, 400);
    r = await get('/', {host: 'a b'});
    assert.strictEqual(r.status, 400);

    // behind the proxy over https: served
    r = await get('/', https);
    assert.strictEqual(r.status, 200);
    assert.ok(r.body.includes('app'));
    assert.strictEqual(r.headers['cache-control'], 'no-cache');

    // security headers
    assert.strictEqual(r.headers['x-content-type-options'], 'nosniff');
    assert.ok(r.headers['strict-transport-security']);
    assert.ok(r.headers['content-security-policy-report-only']);
    assert.strictEqual(r.headers['x-powered-by'], undefined);

    // router paths get the app shell, missing files a 404
    r = await get('/character/Arthur', https);
    assert.strictEqual(r.status, 200);
    assert.ok(r.body.includes('app'));
    r = await get('/main.deadbeefdeadbeef.js', https);
    assert.strictEqual(r.status, 404);
    r = await get('/nope.png', https);
    assert.strictEqual(r.status, 404);

    // caching: hashed bundles forever, the rest is revalidated
    r = await get('/main.0123456789abcdef.js', https);
    assert.strictEqual(r.status, 200);
    assert.strictEqual(r.headers['cache-control'], 'public, max-age=31536000, immutable');
    r = await get('/favicon.ico', https);
    assert.strictEqual(r.headers['cache-control'], 'no-cache');

    // X-Forwarded-Proto is honoured only because one proxy is trusted
    r = await get('/', {'x-forwarded-proto': 'http', host: 'example.org'});
    assert.strictEqual(r.status, 301);

    console.log('server tests passed');
}

run().then(() => cleanup(0), err => { console.error(err); cleanup(1); });

function cleanup(code) {
    server.close();
    fs.rmSync(dist, {recursive: true, force: true});
    process.exit(code);
}
