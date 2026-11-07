const os = require('os');
const fs = require('fs');
const path = require('path');

try {
  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    fs.readFileSync(envPath, 'utf8').split(/\r?\n/).forEach(line => {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
    });
  }
} catch (_) {}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function getLocalIPv4() {
  const ifaces = os.networkInterfaces();
  for (const name of Object.keys(ifaces)) {
    for (const iface of ifaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        if (iface.address.startsWith('192.168.') || iface.address.startsWith('10.')) {
          return iface.address;
        }
      }
    }
  }
  return '127.0.0.1';
}

function parseJson(req, maxBytes = 65536) {
  return new Promise((resolve) => {
    let b = '', tooLarge = false;
    req.on('data', c => {
      if (tooLarge) return;
      b += c;
      if (b.length > maxBytes) { tooLarge = true; b = ''; }
    });
    req.on('end', () => {
      if (tooLarge) return resolve({});
      try { resolve(JSON.parse(b || '{}')); }
      catch (_) { resolve({}); }
    });
    req.on('error', () => resolve({}));
  });
}

module.exports = { MIME_TYPES, getLocalIPv4, parseJson };
