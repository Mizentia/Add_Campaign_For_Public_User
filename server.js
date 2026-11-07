const http = require('http');
const fs = require('fs');
const path = require('path');
const { MIME_TYPES, getLocalIPv4 } = require('./scripts/server-utils.js');
const { handleOrderSubmission, handleOrderStatus, handleGetSettings } = require('./scripts/campaign-api.js');

const PORT = Number(process.env.PORT) || 8088;
const isLocalOnly = process.argv.includes('--local-only');
const shouldOpen = process.argv.includes('--open');
const HOST = isLocalOnly ? '127.0.0.1' : '0.0.0.0';

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }

  const urlPath = decodeURI(req.url.split('?')[0]).replace(/\/+$/, '') || '/';

  if (urlPath === '/api/submit-order' && req.method === 'POST') return handleOrderSubmission(req, res);
  if (urlPath === '/api/order-status' && req.method === 'GET') return handleOrderStatus(req, res);
  if (urlPath === '/api/campaign-settings' && req.method === 'GET') return handleGetSettings(req, res);
  if (urlPath === '/api/server-info' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ success: true, port: currentPort, ip: getLocalIPv4(), service: 'Add Campaign Public Portal' }));
  }

  let reqFile = urlPath === '/' ? '/index.html' : urlPath;
  const filePath = path.join(__dirname, reqFile);
  const isPrivate = /^\/(data|scripts|node_modules|\.git)(\/|$)|^\/\.env|^\/server\.js$/i.test(reqFile);
  if (!filePath.startsWith(__dirname) || isPrivate) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    return res.end('403 Forbidden');
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=UTF-8' });
      return res.end('404 Not Found');
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
      'Cache-Control': 'no-cache'
    });
    fs.createReadStream(filePath).pipe(res);
  });
});

let currentPort = Number(PORT);
function startServer(portToTry) {
  server.listen(portToTry, HOST, () => {
    const ip = getLocalIPv4();
    try { console.clear(); } catch (_) {}
    console.log('================================================================');
    console.log('     ADD CAMPAIGN FOR PUBLIC USER (SELF-SERVICE) - SERVER       ');
    console.log('================================================================\n');
    console.log(` 💻 Localhost:       http://localhost:${portToTry}/`);
    if (!isLocalOnly) console.log(` 📱 Network (Wi-Fi): http://${ip}:${portToTry}/`);
    console.log('\n Server Status: RUNNING (Press Ctrl+C to terminate)');
    console.log('================================================================\n');
    if (shouldOpen) {
      const openUrl = isLocalOnly ? `http://localhost:${portToTry}/` : `http://${ip}:${portToTry}/`;
      require('child_process').exec(`start ${openUrl}`);
    }
  });
}

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    currentPort++;
    startServer(currentPort);
  } else {
    console.error('Server error:', err);
  }
});

startServer(currentPort);
