#!/usr/bin/env node
import http from 'node:http';

const host = process.env.API_HOST || '127.0.0.1';
const port = Number(process.env.API_PORT || 4000);
const path = '/v1/integrations/make/health';

const req = http.request({ host, port, path, method: 'GET', timeout: 3000 }, (res) => {
  let body = '';
  res.on('data', (c) => (body += c));
  res.on('end', () => {
    const ok = res.statusCode === 200;
    console.log('GET', path, res.statusCode, body);
    process.exit(ok ? 0 : 2);
  });
});
req.on('error', (err) => { console.error('request error', err.message); process.exit(2); });
req.end();
