const os = require('os');

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

function parseJson(req) {
  return new Promise((resolve) => {
    let b = '';
    req.on('data', c => { b += c; });
    req.on('end', () => {
      try { resolve(JSON.parse(b || '{}')); }
      catch (_) { resolve({}); }
    });
  });
}

module.exports = { MIME_TYPES, getLocalIPv4, parseJson };
