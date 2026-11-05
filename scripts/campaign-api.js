const fs = require('fs');
const path = require('path');
const { parseJson } = require('./server-utils');

const ORDERS_FILE = path.join(__dirname, '..', 'data', 'public-orders.json');
const SETTINGS_FILE = path.join(__dirname, '..', 'data', 'campaign-settings.json');
const STUDIO_SETTINGS_FILE = path.join(__dirname, '..', '..', 'NL_Admin_Studio', 'data', 'portal-settings.json');

function ensureDataDir() {
  const dir = path.dirname(ORDERS_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(ORDERS_FILE)) fs.writeFileSync(ORDERS_FILE, '[]', 'utf8');
}

function getStoredOrders() {
  ensureDataDir();
  try { return JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf8') || '[]'); } catch (_) { return []; }
}

async function forwardOrderToStudio(order) {
  const urls = [process.env.ADMIN_STUDIO_URL, 'http://127.0.0.1:3001', 'http://localhost:3001'].filter(Boolean);
  for (const u of urls) {
    try {
      const res = await fetch(`${u}/api/campaign-orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Source': 'public-portal' },
        body: JSON.stringify(order)
      });
      if (res.ok) return await res.json();
    } catch (_) {}
  }
  return null;
}

async function handleOrderSubmission(req, res) {
  const body = await parseJson(req);
  if (!body.customerName || !body.customerPhone || !body.platform) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ success: false, error: 'Missing required fields' }));
  }
  const order = {
    id: 'PUB-CAMP-' + Date.now().toString(36).toUpperCase(),
    customerName: body.customerName.trim(),
    customerPhone: body.customerPhone.trim(),
    platform: body.platform,
    targetAudience: body.targetAudience || 'General Audience',
    budgetUSD: Number(body.budgetUSD) || 10,
    durationDays: Number(body.durationDays) || 4,
    pageOrPostUrl: body.pageOrPostUrl || '',
    notes: body.notes || '',
    status: 'pending',
    createdAt: new Date().toISOString(),
    source: 'public_portal'
  };

  const orders = getStoredOrders();
  orders.unshift(order);
  fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders.slice(0, 500), null, 2), 'utf8');
  forwardOrderToStudio(order).catch(() => {});

  res.writeHead(200, { 'Content-Type': 'application/json' });
  return res.end(JSON.stringify({ success: true, order }));
}

function handleGetOrders(req, res) {
  const orders = getStoredOrders();
  res.writeHead(200, { 'Content-Type': 'application/json' });
  return res.end(JSON.stringify({ success: true, orders }));
}

function handleGetSettings(req, res) {
  let settings = null;
  try {
    if (fs.existsSync(SETTINGS_FILE)) settings = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
  } catch (_) {}
  if (!settings) {
    try {
      if (fs.existsSync(STUDIO_SETTINGS_FILE)) {
        const portal = JSON.parse(fs.readFileSync(STUDIO_SETTINGS_FILE, 'utf8'));
        if (portal?.campaign) settings = portal.campaign;
      }
    } catch (_) {}
  }
  res.writeHead(200, { 'Content-Type': 'application/json' });
  return res.end(JSON.stringify({ success: true, settings: settings || {} }));
}

module.exports = { handleOrderSubmission, handleGetOrders, handleGetSettings };
